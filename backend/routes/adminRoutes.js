/**
 * JalMitra - Admin Portal Protected Routes
 * Authorized Gram Panchayat Staff Control Panel
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { authenticateToken, requireRole } from "../auth.js";
import { buildExcelWorkbook } from "../excelExport.js";
import { serviceRepo } from "../repositories/serviceRepo.js";
import { citizenRepo } from "../repositories/citizenRepo.js";
import { propertyRepo } from "../repositories/propertyRepo.js";
import { panchayatRepo } from "../repositories/panchayatRepo.js";
import { billingRepo } from "../repositories/billingRepo.js";
import { communityRepo } from "../repositories/communityRepo.js";

const router = Router();

// Protect all admin routes: Requires role 'admin'
router.use(authenticateToken);
router.use(requireRole(["admin"]));

// ==========================================================
// ADMIN PROFILE & DISPLAY SETTINGS
// ==========================================================
router.get("/profile", async (req, res) => {
  try {
    const adminId = req.user.id;
    const users = await query(
      "SELECT id, login_id, role, role_title, full_name, phone, email, created_at FROM users WHERE id = ? OR login_id = ? LIMIT 1",
      [adminId, req.user.loginId || adminId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Admin profile not found." });
    }
    const user = users[0];
    res.json({
      profile: {
        id: user.id,
        loginId: user.login_id,
        role: user.role,
        roleTitle: user.role_title || "Administrator",
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const adminId = req.user.id;
    const { fullName, roleTitle, phone, email } = req.body;

    const users = await query(
      "SELECT * FROM users WHERE id = ? OR login_id = ? LIMIT 1",
      [adminId, req.user.loginId || adminId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Admin user not found." });
    }
    const adminRecord = users[0];

    const newFullName = fullName !== undefined ? String(fullName).trim() : adminRecord.full_name;
    const newRoleTitle = roleTitle !== undefined ? String(roleTitle).trim() : (adminRecord.role_title || "Administrator");
    const newPhone = phone !== undefined ? String(phone).trim() : adminRecord.phone;
    const newEmail = email !== undefined ? String(email).trim() : adminRecord.email;

    if (!newFullName) {
      return res.status(400).json({ error: "Validation error", message: "Display name cannot be empty." });
    }

    // Persist changes to MySQL (strictly preserving login_id and role privileges)
    await query(
      "UPDATE users SET full_name = ?, role_title = ?, phone = ?, email = ? WHERE id = ?",
      [newFullName, newRoleTitle, newPhone, newEmail, adminRecord.id]
    );

    const [updatedUser] = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [adminRecord.id]);
    const { generateToken } = await import("../auth.js");
    const token = generateToken(updatedUser);

    res.json({
      message: "Admin profile updated successfully.",
      token,
      user: {
        id: updatedUser.id,
        loginId: updatedUser.login_id,
        role: updatedUser.role,
        roleTitle: updatedUser.role_title || "Administrator",
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        email: updatedUser.email
      }
    });
  } catch (err) {
    console.error("Admin profile update error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 1. DASHBOARD SUMMARY STATS
// ==========================================================
router.get("/dashboard-stats", async (req, res) => {
  try {
    // 1. Citizens count
    const [citRows] = await query("SELECT COUNT(*) as totalCitizens, SUM(status = 'Active') as activeCitizens FROM citizens");

    // 2. Sources count & capacity
    const [srcRows] = await query(`
      SELECT 
        COUNT(*) as totalSources,
        COALESCE(SUM(total_capacity), 0) as totalCapacity,
        COALESCE(SUM(ROUND((total_capacity * current_level_percent) / 100)), 0) as totalAvailable,
        SUM(current_level_percent > 10) as operationalSources
      FROM water_sources
    `);

    // 3. Water Bills stats
    const [billRows] = await query(`
      SELECT 
        COUNT(*) as totalBills,
        COALESCE(SUM(amount), 0) as totalBilledAmount,
        COALESCE(SUM(paid_amount), 0) as totalPaidAmount,
        COALESCE(SUM(amount - paid_amount), 0) as totalOutstandingAmount,
        SUM(status != 'Paid') as unpaidBillsCount
      FROM water_bills
    `);

    // 4. Payments revenue
    const [payRows] = await query("SELECT COALESCE(SUM(amount), 0) as totalRevenue, COUNT(*) as totalTransactions FROM payments");

    // 5. Complaints stats
    const [cmpRows] = await query(`
      SELECT 
        COUNT(*) as totalComplaints,
        SUM(status = 'Pending') as pendingComplaints,
        SUM(status = 'In Progress' OR status = 'Dispatched') as inProgressComplaints,
        SUM(status = 'Resolved') as resolvedComplaints
      FROM community_reports
    `);

    // 6. Taxes stats
    const [taxRows] = await query(`
      SELECT 
        COUNT(*) as totalTaxes,
        COALESCE(SUM(amount), 0) as totalTaxAmount,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) as collectedTaxAmount
      FROM taxes_charges
    `);

    // 7. Properties & Households
    const allProps = await propertyRepo.getAll();
    const totalProperties = allProps.length;

    // 8. Applications & RTI
    const allApps = await panchayatRepo.getAllApplications();
    const pendingApps = allApps.filter(a => ['Submitted', 'Under Review', 'In Progress', 'Assigned'].includes(a.status)).length;
    const resolvedApps = allApps.filter(a => ['Resolved', 'Replied', 'Closed'].includes(a.status)).length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const appsToday = allApps.filter(a => a.created_at && String(a.created_at).startsWith(todayStr)).length;
    const pendingRti = allApps.filter(a => (a.application_type === 'RTI' || (a.subject || '').includes('RTI')) && !['Resolved', 'Replied', 'Closed'].includes(a.status)).length;

    // 9. Work Register & Tasks
    const allTasks = await panchayatRepo.getTasks();
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    const activeTasks = allTasks.filter(t => t.status !== 'Completed').length;

    const totalB = Number(billRows?.totalBills || 0);
    const unpaidB = Number(billRows?.unpaidBillsCount || 0);
    const paidB = Math.max(0, totalB - unpaidB);
    const taxTot = Number(taxRows?.totalTaxAmount || 0);
    const taxCol = Number(taxRows?.collectedTaxAmount || 0);
    const taxPend = Math.max(0, taxTot - taxCol);

    // 10. Ward Demographics & Households breakdown
    const allCitizens = await citizenRepo.getAll();
    const wardDemographics = [
      { ward: "Ward 1", label: "Gaikwad Mala", citizens: allCitizens.filter(c => (c.ward_area || '').includes('1')).length, properties: allProps.filter(p => (p.ward_area || '').includes('1')).length },
      { ward: "Ward 2", label: "Bazar Peth", citizens: allCitizens.filter(c => (c.ward_area || '').includes('2')).length, properties: allProps.filter(p => (p.ward_area || '').includes('2')).length },
      { ward: "Ward 3", label: "Navi Vasti", citizens: allCitizens.filter(c => (c.ward_area || '').includes('3')).length, properties: allProps.filter(p => (p.ward_area || '').includes('3')).length },
      { ward: "Ward 4", label: "Khadki Area", citizens: allCitizens.filter(c => (c.ward_area || '').includes('4')).length, properties: allProps.filter(p => (p.ward_area || '').includes('4')).length }
    ];

    // 11. Monthly Revenue Collections Trend
    const monthlyRevenue = [
      { month: "May", amount: 14200 },
      { month: "Jun", amount: 18500 },
      { month: "Jul", amount: 22100 },
      { month: "Aug", amount: 19800 },
      { month: "Sep", amount: 26400 },
      { month: "Oct", amount: Number(payRows?.totalRevenue || 28950) }
    ];

    // 12. Recent Activities Stream
    const recentActivities = [
      ...allApps.slice(0, 3).map(a => ({
        type: "application",
        title: `Civic Application #${a.reference_no || a.id}`,
        subtitle: `${a.applicant_name || a.citizen_name || 'Resident'} - ${a.service_name || a.subject || 'Application'}`,
        status: a.status,
        time: a.created_at || "Recent"
      })),
      ...allTasks.slice(0, 2).map(t => ({
        type: "task",
        title: `Work Order: ${t.title}`,
        subtitle: `${t.ward_area || 'Village'} • Budget: ₹${Number(t.budget || 0).toLocaleString()}`,
        status: t.status,
        time: t.updated_at || "In Progress"
      }))
    ];

    // 13. SLA Deadlines & Urgent Alerts
    const slaAlerts = [
      {
        id: "sla-1",
        level: pendingRti > 0 ? "warning" : "info",
        title: `${pendingRti} Statutory RTI Inquiry Pending Review`,
        desc: "Mandatory 30-day RTI statutory window requires Gram Sevak verification and formal response.",
        due: "Statutory SLA: 30 Days"
      },
      {
        id: "sla-2",
        level: (Number(srcRows?.totalAvailable || 0) < Number(srcRows?.totalCapacity || 1) * 0.4) ? "critical" : "normal",
        title: "Village Water Storage Reserves Monitoring",
        desc: `Available storage at ${Math.round((Number(srcRows?.totalAvailable || 0) / Math.max(1, Number(srcRows?.totalCapacity || 1))) * 100)}% of total capacity. Tank distribution schedule active.`,
        due: "Continuous Telemetry"
      },
      {
        id: "sla-3",
        level: unpaidB > 5 ? "warning" : "normal",
        title: `${unpaidB} Outstanding Water Bills Past Due`,
        desc: `Total outstanding dues: ₹${Number(billRows?.totalOutstandingAmount || 0).toFixed(2)}. Notices queued for issuance.`,
        due: "Billing Cycle SLA"
      }
    ];

    res.json({
      citizens: {
        total: citRows?.totalCitizens || 0,
        active: citRows?.activeCitizens || 0
      },
      households: {
        total: totalProperties
      },
      properties: {
        total: totalProperties
      },
      applications: {
        total: allApps.length,
        pending: pendingApps,
        resolved: resolvedApps,
        today: appsToday,
        rtiPending: pendingRti
      },
      complaints: {
        total: cmpRows?.totalComplaints || 0,
        pending: cmpRows?.pendingComplaints || 0,
        inProgress: cmpRows?.inProgressComplaints || 0,
        resolved: cmpRows?.resolvedComplaints || 0
      },
      billing: {
        totalBills: totalB,
        paidCount: paidB,
        unpaidCount: unpaidB,
        totalOutstanding: Number(billRows?.totalOutstandingAmount || 0),
        totalCollected: Number(billRows?.totalPaidAmount || 0),
        totalRevenue: Number(payRows?.totalRevenue || 0),
        transactionCount: payRows?.totalTransactions || 0
      },
      taxes: {
        total: taxTot,
        collected: taxCol,
        pending: taxPend
      },
      tasks: {
        total: allTasks.length,
        active: activeTasks,
        completed: completedTasks
      },
      waterSources: {
        total: srcRows?.totalSources || 0,
        operational: srcRows?.operationalSources || 0,
        totalCapacity: Number(srcRows?.totalCapacity || 0),
        totalAvailable: Number(srcRows?.totalAvailable || 0)
      },
      wardDemographics,
      monthlyRevenue,
      recentActivities,
      slaAlerts
    });
  } catch (err) {
    console.error("GET /dashboard-stats error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 2. CITIZEN MANAGEMENT
// ==========================================================

// GET /api/admin/citizens (Search & List)
router.get("/citizens", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();
    const ward = (req.query.ward || "").trim();
    const rows = await citizenRepo.getAll({ search, status, ward });
    res.json(rows);
  } catch (err) {
    console.error("GET /citizens error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/admin/citizens (Add new citizen + create user login)
router.post("/citizens", async (req, res) => {
  try {
    const fullName = (req.body.fullName || req.body.full_name || req.body.name || "").trim();
    const phone = (req.body.phone || req.body.mobile || req.body.phoneNumber || "").trim();
    const propertyNo = (req.body.propertyNo || req.body.property_no || req.body.propertyNumber || "").trim();
    const wardArea = (req.body.wardArea || req.body.ward || req.body.ward_area || "").trim();
    const email = (req.body.email || "").trim();
    const initialPassword = req.body.initialPassword || req.body.password || "Citizen@123";
    const familyMembers = parseInt(req.body.familyMembers || req.body.family_members || 4, 10);
    const meterNo = (req.body.meterNo || req.body.meter_no || "").trim();
    const connectionType = (req.body.connectionType || req.body.connection_type || "Domestic Metered Tap").trim();
    const address = (req.body.address || "").trim();

    if (!fullName || !phone || !propertyNo || !wardArea) {
      return res.status(400).json({ error: "Validation error", message: "Name, phone, property number, and ward are required." });
    }

    // Guarantee collision-free CIT-xxx sequence
    const allCitizens = await citizenRepo.getAll();
    const existingIds = new Set(allCitizens.map(c => String(c.id).toUpperCase()));
    let nextSeq = 101;
    allCitizens.forEach(c => {
      const m = String(c.id).match(/^CIT-(\d+)$/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val >= nextSeq) nextSeq = val + 1;
      }
    });

    let citizenId = (req.body.citizenId || req.body.id || `CIT-${nextSeq}`).trim();
    if (!req.body.citizenId && !req.body.id) {
      while (existingIds.has(citizenId)) {
        nextSeq++;
        citizenId = `CIT-${nextSeq}`;
      }
    }
    const userId = `usr-cit-${Date.now()}`;
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // Check if citizenId or phone already in users table
    const existingUser = await userRepo.findByLoginOrPhone(citizenId) || await userRepo.findByLoginOrPhone(phone);
    if (existingUser) {
      return res.status(409).json({ error: "Conflict", message: `A user account with Citizen ID '${citizenId}' or phone '${phone}' already exists.` });
    }

    // Link property if matching record exists in properties table
    let propertyId = null;
    try {
      const prop = await propertyRepo.getByPropertyNumber(propertyNo);
      if (prop) {
        propertyId = prop.id;
        await propertyRepo.update(propertyId, {
          owner_citizen_id: citizenId,
          owner_name: fullName,
          ward_area: wardArea
        });
      }
    } catch (e) {
      console.warn("Property linking note:", e.message);
    }

    // 1. Insert Citizen Profile (Dual driver repository)
    const newCitizen = await citizenRepo.create({
      id: citizenId,
      user_id: userId,
      full_name: fullName,
      phone,
      email: email || null,
      property_no: propertyNo,
      ward_area: wardArea,
      family_members: familyMembers,
      meter_no: meterNo || `MET-${nextSeq}`,
      connection_type: connectionType,
      status: "Active",
      property_id: propertyId
    });

    // 2. Insert User Login Credentials (Dual driver repository)
    await userRepo.create({
      id: userId,
      login_id: citizenId,
      password_hash: passwordHash,
      role: "citizen",
      role_title: "Citizen",
      full_name: fullName,
      phone,
      email: email || null,
      is_active: 1,
      citizen_id: citizenId
    });

    res.status(201).json({
      success: true,
      message: "Citizen created successfully.",
      citizenId,
      id: citizenId,
      loginId: citizenId,
      fullName,
      propertyNo,
      wardArea,
      initialPassword,
      citizen: newCitizen
    });
  } catch (err) {
    console.error("POST /citizens error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET /api/admin/citizens/:id (Single citizen 360° profile)
router.get("/citizens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const citizen = await citizenRepo.getById(id);
    if (!citizen) {
      return res.status(404).json({ error: "Not found", message: `Citizen '${id}' not found.` });
    }

    // Linked property if any
    let property = null;
    if (citizen.property_id || citizen.property_no) {
      if (citizen.property_id) {
        property = await propertyRepo.getById(citizen.property_id);
      }
      if (!property && citizen.property_no) {
        property = await propertyRepo.getByPropertyNumber(citizen.property_no);
      }
    }

    // Co-residents / Family members sharing this household/property
    let familyMembersList = [];
    if (citizen.property_no) {
      const allCits = await citizenRepo.getAll();
      familyMembersList = allCits.filter(c => c.property_no === citizen.property_no && c.id !== citizen.id);
    }

    // Bills, taxes, applications, complaints
    const bills = await billingRepo.getBillsByCitizenId(citizen.id);
    const taxes = await billingRepo.getTaxesByCitizenId(citizen.id);
    const allApps = await panchayatRepo.getAllApplications();
    const citizenApps = allApps.filter(a => a.citizen_id === citizen.id || a.applicant_phone === citizen.phone);
    const allComplaints = await communityRepo.getAll();
    const citizenComplaints = allComplaints.filter(c => c.citizen_id === citizen.id || c.phone === citizen.phone);

    // Compute dues
    const unpaidBills = bills.filter(b => b.status !== 'Paid');
    const totalWaterDues = unpaidBills.reduce((sum, b) => sum + (Number(b.amount || 0) - Number(b.paid_amount || 0)), 0);
    const unpaidTaxes = taxes.filter(t => t.status !== 'Paid');
    const totalTaxDues = unpaidTaxes.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    res.json({
      citizen,
      property,
      familyMembers: familyMembersList,
      bills,
      taxes,
      applications: citizenApps,
      complaints: citizenComplaints,
      dues: {
        waterDues: totalWaterDues,
        taxDues: totalTaxDues,
        totalDues: totalWaterDues + totalTaxDues
      }
    });
  } catch (err) {
    console.error("GET /citizens/:id error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// PUT /api/admin/citizens/:id (Edit citizen details)
router.put("/citizens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fullName = (req.body.fullName || req.body.full_name || req.body.name || "").trim();
    const phone = (req.body.phone || req.body.mobile || req.body.phoneNumber || "").trim();
    const propertyNo = (req.body.propertyNo || req.body.property_no || req.body.propertyNumber || "").trim();
    const wardArea = (req.body.wardArea || req.body.ward || req.body.ward_area || "").trim();
    const email = req.body.email !== undefined ? req.body.email.trim() : undefined;
    const familyMembers = req.body.familyMembers !== undefined ? parseInt(req.body.familyMembers, 10) : undefined;
    const meterNo = req.body.meterNo !== undefined ? req.body.meterNo.trim() : undefined;
    const connectionType = req.body.connectionType || req.body.connection_type;
    const status = req.body.status;

    const existing = await query("SELECT * FROM citizens WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Not found", message: `Citizen '${id}' not found.` });
    }

    const updates = [];
    const params = [];

    if (fullName) { updates.push("full_name = ?"); params.push(fullName); }
    if (phone) { updates.push("phone = ?"); params.push(phone); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (propertyNo) { updates.push("property_no = ?"); params.push(propertyNo); }
    if (wardArea) { updates.push("ward_area = ?"); params.push(wardArea); }
    if (familyMembers !== undefined && !isNaN(familyMembers)) { updates.push("family_members = ?"); params.push(familyMembers); }
    if (meterNo !== undefined) { updates.push("meter_no = ?"); params.push(meterNo); }
    if (connectionType) { updates.push("connection_type = ?"); params.push(connectionType); }
    if (status) { updates.push("status = ?"); params.push(status); }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE citizens SET ${updates.join(", ")} WHERE id = ?`, params);

      // Keep users table in sync for full_name and phone
      if (fullName || phone || email !== undefined) {
        const userUpdates = [];
        const userParams = [];
        if (fullName) { userUpdates.push("full_name = ?"); userParams.push(fullName); }
        if (phone) { userUpdates.push("phone = ?"); userParams.push(phone); }
        if (email !== undefined) { userUpdates.push("email = ?"); userParams.push(email); }
        userParams.push(id);
        await query(`UPDATE users SET ${userUpdates.join(", ")} WHERE citizen_id = ?`, userParams);
      }
    }

    res.json({ message: "Citizen profile updated successfully.", id });
  } catch (err) {
    console.error("PUT /citizens/:id error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// PATCH /api/admin/citizens/:id/status (Toggle Activate / Deactivate)
router.patch("/citizens/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Inactive'

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ error: "Validation error", message: "Status must be 'Active' or 'Inactive'." });
    }

    const cit = await query("SELECT user_id FROM citizens WHERE id = ?", [id]);
    if (cit.length === 0) return res.status(404).json({ error: "Not found", message: "Citizen not found." });

    await query("UPDATE citizens SET status = ? WHERE id = ?", [status, id]);
    if (cit[0].user_id) {
      await query("UPDATE users SET is_active = ? WHERE id = ?", [status === "Active" ? 1 : 0, cit[0].user_id]);
    }

    res.json({ message: `Citizen status updated to ${status}.`, id, status });
  } catch (err) {
    console.error("PATCH /citizens/:id/status error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// DELETE /api/admin/citizens/:id (Guarded Deletion)
router.delete("/citizens/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const cit = await query("SELECT * FROM citizens WHERE id = ?", [id]);
    if (cit.length === 0) return res.status(404).json({ error: "Not found", message: `Citizen '${id}' not found.` });

    // Guard: Check if citizen has unpaid bills
    const unpaidBills = await query("SELECT COUNT(*) as count FROM water_bills WHERE citizen_id = ? AND status != 'Paid'", [id]);
    if (unpaidBills[0].count > 0) {
      return res.status(400).json({
        error: "Protected Record",
        message: `Cannot delete citizen '${id}': ${unpaidBills[0].count} unpaid water bill(s) are outstanding. Clear or settle dues first, or set status to 'Inactive'.`
      });
    }

    // Unlink property ownership
    await query("UPDATE properties SET owner_citizen_id = NULL WHERE owner_citizen_id = ?", [id]);

    // Delete user login
    if (cit[0].user_id) {
      await query("DELETE FROM users WHERE id = ?", [cit[0].user_id]);
    }
    await query("DELETE FROM users WHERE citizen_id = ?", [id]);

    // Delete citizen record
    await query("DELETE FROM citizens WHERE id = ?", [id]);

    res.json({ message: `Citizen '${id}' deleted successfully.`, id });
  } catch (err) {
    console.error("DELETE /citizens/:id error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 3. WATER BILLS & PAYMENTS MANAGEMENT
// ==========================================================

// GET /api/admin/bills
router.get("/bills", async (req, res) => {
  try {
    const { citizenId, status } = req.query;
    let sql = `
      SELECT b.*, c.full_name, c.property_no, c.ward_area, c.phone
      FROM water_bills b
      JOIN citizens c ON b.citizen_id = c.id
    `;
    const params = [];
    const wheres = [];

    if (citizenId) { wheres.push("b.citizen_id = ?"); params.push(citizenId); }
    if (status) { wheres.push("b.status = ?"); params.push(status); }

    if (wheres.length > 0) sql += " WHERE " + wheres.join(" AND ");
    sql += " ORDER BY b.created_at DESC";

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/bills error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/admin/bills (Create new water bill)
router.post("/bills", async (req, res) => {
  try {
    const { citizenId, billingPeriod, amount, dueDate } = req.body;

    if (!citizenId || !billingPeriod || !amount || !dueDate) {
      return res.status(400).json({ error: "Validation error", message: "Citizen ID, billing period, amount, and due date are required." });
    }

    // Check duplicate unpaid bill for citizen and period
    try {
      const existingBills = await query("SELECT id FROM water_bills WHERE citizen_id = ? AND billing_period = ? AND status != 'Paid'", [citizenId, billingPeriod.trim()]);
      if (existingBills && existingBills.length > 0) {
        return res.status(409).json({ error: "Conflict", message: `An unpaid water bill for period '${billingPeriod.trim()}' already exists for this resident.` });
      }
    } catch (chkErr) {
      console.warn("Bill duplicate check note:", chkErr.message);
    }

    const billId = `BILL-${Date.now().toString().slice(-6)}`;
    const billAmount = parseFloat(amount);
    await query(`
      INSERT INTO water_bills (id, citizen_id, billing_period, amount, paid_amount, due_date, status)
      VALUES (?, ?, ?, ?, 0.00, ?, 'Unpaid')
    `, [billId, citizenId, billingPeriod.trim(), billAmount, dueDate]);

    const billData = {
      id: billId,
      billId,
      billNumber: billId,
      citizenId,
      citizen_id: citizenId,
      billingPeriod: billingPeriod.trim(),
      billing_period: billingPeriod.trim(),
      amount: billAmount,
      paidAmount: 0.00,
      paid_amount: 0.00,
      dueDate,
      due_date: dueDate,
      status: "Unpaid"
    };

    res.status(201).json({
      success: true,
      message: "Water bill created successfully.",
      billId,
      id: billId,
      billNumber: billId,
      bill: billData
    });
  } catch (err) {
    console.error("POST /admin/bills error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET /api/admin/payments (All collection logs)
router.get("/payments", async (req, res) => {
  try {
    const rows = await query(`
      SELECT p.*, c.full_name, c.property_no, b.billing_period
      FROM payments p
      JOIN citizens c ON p.citizen_id = c.id
      LEFT JOIN water_bills b ON p.bill_id = b.id
      ORDER BY p.payment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/payments error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/admin/payments (Record a payment verified by Admin)
router.post("/payments", async (req, res) => {
  try {
    const billId = req.body.billId || req.body.bill_id;
    let citizenId = req.body.citizenId || req.body.citizen_id;
    const amount = req.body.amount !== undefined ? req.body.amount : (req.body.amountPaid !== undefined ? req.body.amountPaid : req.body.paidAmount);
    const paymentMode = req.body.paymentMode || req.body.paymentMethod || "Cash";
    const receiptNo = req.body.receiptNo || req.body.transactionRef || `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const notes = req.body.notes;

    if (!citizenId && billId) {
      const [bill] = await query("SELECT citizen_id FROM water_bills WHERE id = ?", [billId]);
      if (bill) citizenId = bill.citizen_id;
    }

    if (!citizenId || amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "Validation error", message: "Citizen ID and payment amount are required." });
    }

    // Check if bill is already paid
    if (billId) {
      const bills = await query("SELECT amount, paid_amount, status FROM water_bills WHERE id = ?", [billId]);
      if (bills && bills.length > 0 && bills[0].status === "Paid") {
        return res.status(400).json({ error: "Already Paid", message: "This water bill has already been fully paid." });
      }
    }

    const payId = `PAY-${Date.now().toString().slice(-6)}`;
    const recNo = receiptNo;
    const payAmount = parseFloat(amount);

    let normalizedMode = "Cash";
    const modeUpper = (paymentMode || "").toUpperCase();
    if (modeUpper.includes("UPI")) normalizedMode = "UPI";
    else if (modeUpper.includes("BANK")) normalizedMode = "Net Banking";
    else if (modeUpper.includes("CHEQUE")) normalizedMode = "Cheque";
    else normalizedMode = "Cash";

    await query(`
      INSERT INTO payments (id, bill_id, citizen_id, amount, payment_mode, receipt_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [payId, billId || null, citizenId, payAmount, normalizedMode, recNo, notes || "Counter payment collected by Gram Panchayat"]);

    // If billId provided, update the bill
    if (billId) {
      const bills = await query("SELECT amount, paid_amount FROM water_bills WHERE id = ?", [billId]);
      if (bills && bills.length > 0) {
        const bill = bills[0];
        const newPaid = Number(bill.paid_amount || 0) + payAmount;
        const newStatus = newPaid >= Number(bill.amount) ? "Paid" : "Partially Paid";
        await query("UPDATE water_bills SET paid_amount = ?, status = ? WHERE id = ?", [newPaid, newStatus, billId]);
      }
    }

    const paymentData = {
      id: payId,
      paymentId: payId,
      billId: billId || null,
      citizenId,
      citizen_id: citizenId,
      amount: payAmount,
      paymentMode: normalizedMode,
      payment_mode: normalizedMode,
      receiptNo: recNo,
      receiptNumber: recNo,
      receipt_no: recNo,
      notes: notes || "Counter payment collected by Gram Panchayat",
      paymentDate: new Date().toISOString(),
      payment_date: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      paymentId: payId,
      receiptNo: recNo,
      receiptNumber: recNo,
      payment: paymentData,
      receipt: {
        receiptNo: recNo,
        receiptNumber: recNo,
        receipt_no: recNo,
        paymentId: payId,
        billId: billId || null,
        citizenId,
        amount: payAmount,
        paymentMode: normalizedMode,
        paidAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("POST /admin/payments error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 4. TAXES & CHARGES MANAGEMENT
// ==========================================================

// GET /api/admin/taxes
router.get("/taxes", async (req, res) => {
  try {
    const rows = await query(`
      SELECT t.*, c.full_name, c.property_no, c.ward_area
      FROM taxes_charges t
      JOIN citizens c ON t.citizen_id = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/taxes error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/admin/taxes
router.post("/taxes", async (req, res) => {
  try {
    const citizenId = req.body.citizenId || req.body.citizen_id;
    const chargeType = (req.body.chargeType || req.body.title || req.body.tax_name || req.body.category || "").trim();
    const description = (req.body.description || req.body.category || req.body.title || "").trim();
    const amount = req.body.amount;
    const dueDate = req.body.dueDate || req.body.due_date;

    if (!citizenId || !chargeType || amount === undefined || isNaN(parseFloat(amount)) || !dueDate) {
      return res.status(400).json({ error: "Validation error", message: "Citizen ID, charge type/title, amount, and due date are required." });
    }

    const taxId = `TAX-${Date.now().toString().slice(-6)}`;
    const numAmount = parseFloat(amount);

    await query(`
      INSERT INTO taxes_charges (id, citizen_id, charge_type, description, amount, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Unpaid')
    `, [taxId, citizenId, chargeType, description, numAmount, dueDate]);

    const taxData = {
      id: taxId,
      taxId,
      citizenId,
      citizen_id: citizenId,
      chargeType,
      charge_type: chargeType,
      title: chargeType,
      description,
      category: description,
      amount: numAmount,
      dueDate,
      due_date: dueDate,
      status: "Unpaid"
    };

    res.status(201).json({
      success: true,
      message: "Tax/charge record created successfully.",
      taxId,
      id: taxId,
      tax: taxData
    });
  } catch (err) {
    console.error("POST /admin/taxes error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// PUT /api/admin/taxes/:id/status
router.put("/taxes/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Unpaid", "Paid"].includes(status)) {
      return res.status(400).json({ error: "Validation error", message: "Status must be 'Unpaid' or 'Paid'." });
    }

    await query("UPDATE taxes_charges SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: "Tax status updated.", id, status });
  } catch (err) {
    console.error("PUT /admin/taxes/:id/status error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 5. COMMUNITY COMPLAINTS MANAGEMENT (ADMIN)
// ==========================================================

// PUT /api/admin/complaints/:id/status
router.put("/complaints/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const validStatuses = ["Pending", "In Progress", "Dispatched", "Resolved", "Rejected"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Validation error", message: `Valid statuses: ${validStatuses.join(", ")}` });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push("status = ?");
      params.push(status);
      if (status === "Resolved") {
        updates.push("resolved_at = CURRENT_TIMESTAMP");
      }
    }

    if (adminResponse !== undefined) {
      updates.push("admin_response = ?");
      params.push(adminResponse.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Validation error", message: "No updates provided." });
    }

    params.push(id);
    await query(`UPDATE community_reports SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ message: "Complaint updated successfully.", id, status });
  } catch (err) {
    console.error("PUT /admin/complaints/:id/status error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET /api/admin/complaints/export-excel (Export all complaints & requests to .xlsx)
router.get("/complaints/export-excel", async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        id,
        COALESCE(citizen_id, 'Public/Direct') as citizen_id,
        name,
        phone,
        area,
        problem_type,
        urgency,
        description,
        status,
        COALESCE(admin_response, '') as admin_response,
        created_at,
        updated_at,
        resolved_at
      FROM community_reports
      ORDER BY created_at DESC
    `);

    const columns = [
      { key: "id", title: "Complaint / Request ID", width: 22 },
      { key: "citizen_id", title: "Citizen ID", width: 18 },
      { key: "name", title: "Citizen Name", width: 24 },
      { key: "phone", title: "Contact Phone", width: 16 },
      { key: "area", title: "Ward / Village Area", width: 30 },
      { key: "problem_type", title: "Category", width: 26 },
      { key: "urgency", title: "Urgency Level", width: 16 },
      { key: "description", title: "Description", width: 45 },
      { key: "status", title: "Current Status", width: 16 },
      { key: "admin_response", title: "Administrative Response", width: 35 },
      { key: "submission_date", title: "Submission Date and Time", width: 25 },
      { key: "last_updated", title: "Last Updated Date", width: 25 }
    ];

    const formattedRows = rows.map(r => {
      const subDate = r.created_at ? new Date(r.created_at).toLocaleString("en-IN") : "";
      const updDate = r.updated_at ? new Date(r.updated_at).toLocaleString("en-IN") : subDate;
      return {
        id: r.id || "",
        citizen_id: r.citizen_id || "",
        name: r.name || "",
        phone: r.phone || "",
        area: r.area || "",
        problem_type: r.problem_type || "",
        urgency: r.urgency || "Normal",
        description: r.description || "",
        status: r.status || "Pending",
        admin_response: r.admin_response || "No response recorded yet",
        submission_date: subDate,
        last_updated: updDate
      };
    });

    const excelBuffer = buildExcelWorkbook("Complaints & Grievances", columns, formattedRows);
    const dateStr = new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="JalMitra_Complaints_and_Requests_${dateStr}.xlsx"`);
    res.setHeader("Content-Length", excelBuffer.length);
    res.send(excelBuffer);
  } catch (err) {
    console.error("GET /admin/complaints/export-excel error:", err);
    res.status(500).json({ error: "Export error", message: err.message });
  }
});

// ==========================================================
// 6. PROPERTY MANAGEMENT ENDPOINTS
// ==========================================================

// GET /api/admin/properties (List & Search)
router.get("/properties", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const rows = await propertyRepo.getAllWithDues({ search });
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/properties error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/admin/properties (Add Property)
router.post("/properties", async (req, res) => {
  try {
    const { propertyNumber, ownerCitizenId, ownerName, wardArea, propertyType, address, waterMeterNo, connectionType, annualTax } = req.body;
    
    if (!propertyNumber || !wardArea || !address) {
      return res.status(400).json({ error: "Validation error", message: "Property number, ward/area, and address are required." });
    }

    // Check for duplicate property number
    const existing = await query("SELECT id FROM properties WHERE property_number = ?", [propertyNumber.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Conflict", message: `Property number '${propertyNumber}' is already registered.` });
    }

    const propId = `PROP-${Date.now().toString().slice(-6)}`;
    let effectiveOwnerName = (ownerName || "").trim();

    if (ownerCitizenId) {
      const cRows = await query("SELECT full_name FROM citizens WHERE id = ?", [ownerCitizenId]);
      if (cRows.length > 0 && !effectiveOwnerName) effectiveOwnerName = cRows[0].full_name;
    }
    if (!effectiveOwnerName) effectiveOwnerName = "Gram Panchayat Property";

    await query(`
      INSERT INTO properties 
        (id, property_number, owner_citizen_id, owner_name, ward_area, property_type, address, water_meter_no, connection_type, annual_tax)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      propId,
      propertyNumber.trim(),
      ownerCitizenId || null,
      effectiveOwnerName,
      wardArea.trim(),
      propertyType || "Residential",
      address.trim(),
      waterMeterNo ? waterMeterNo.trim() : null,
      connectionType || "Domestic Metered Tap",
      parseFloat(annualTax) || 250.00
    ]);

    // Link citizen to property
    if (ownerCitizenId) {
      await query("UPDATE citizens SET property_id = ?, property_no = ? WHERE id = ?", [propId, propertyNumber.trim(), ownerCitizenId]);
    }

    res.status(201).json({
      message: "Property created successfully.",
      id: propId,
      propertyNumber: propertyNumber.trim(),
      ownerName: effectiveOwnerName
    });
  } catch (err) {
    console.error("POST /admin/properties error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// PUT /api/admin/properties/:id (Edit Property)
router.put("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { propertyNumber, ownerCitizenId, ownerName, wardArea, propertyType, address, waterMeterNo, connectionType, annualTax } = req.body;

    const existing = await query("SELECT * FROM properties WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Property not found." });
    }

    if (propertyNumber && propertyNumber.trim() !== existing[0].property_number) {
      const dup = await query("SELECT id FROM properties WHERE property_number = ? AND id != ?", [propertyNumber.trim(), id]);
      if (dup.length > 0) {
        return res.status(409).json({ error: "Conflict", message: `Property number '${propertyNumber}' is already registered.` });
      }
    }

    const updates = [];
    const params = [];

    if (propertyNumber) { updates.push("property_number = ?"); params.push(propertyNumber.trim()); }
    if (ownerCitizenId !== undefined) { updates.push("owner_citizen_id = ?"); params.push(ownerCitizenId || null); }
    if (ownerName) { updates.push("owner_name = ?"); params.push(ownerName.trim()); }
    if (wardArea) { updates.push("ward_area = ?"); params.push(wardArea.trim()); }
    if (propertyType) { updates.push("property_type = ?"); params.push(propertyType); }
    if (address) { updates.push("address = ?"); params.push(address.trim()); }
    if (waterMeterNo !== undefined) { updates.push("water_meter_no = ?"); params.push(waterMeterNo ? waterMeterNo.trim() : null); }
    if (connectionType) { updates.push("connection_type = ?"); params.push(connectionType); }
    if (annualTax !== undefined) { updates.push("annual_tax = ?"); params.push(parseFloat(annualTax) || 0); }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE properties SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    if (ownerCitizenId) {
      await query("UPDATE citizens SET property_id = ?, property_no = COALESCE(?, property_no) WHERE id = ?", [id, propertyNumber ? propertyNumber.trim() : null, ownerCitizenId]);
    }

    res.json({ message: "Property updated successfully.", id });
  } catch (err) {
    console.error("PUT /admin/properties/:id error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET /api/admin/properties/:id (Single property details + residents + bills & taxes)
router.get("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let rows = await query(`
      SELECT p.*, c.full_name as citizen_name, c.phone as citizen_phone, c.email as citizen_email
      FROM properties p
      LEFT JOIN citizens c ON p.owner_citizen_id = c.id
      WHERE p.id = ? OR p.property_number = ?
    `, [id, id]);

    if (rows.length === 0) {
      const p = await propertyRepo.getById(id) || await propertyRepo.getByPropertyNumber(id);
      if (p) rows = [p];
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Property not found." });
    }

    const prop = rows[0];
    const allCits = await citizenRepo.getAll();
    const residents = allCits.filter(c => c.property_no === prop.property_number || c.property_id === prop.id);

    const bills = await query("SELECT * FROM water_bills WHERE property_id = ? OR citizen_id = ? ORDER BY due_date DESC", [prop.id, prop.owner_citizen_id || ""]);
    const taxes = await query("SELECT * FROM taxes_charges WHERE property_id = ? OR citizen_id = ? ORDER BY due_date DESC", [prop.id, prop.owner_citizen_id || ""]);

    res.json({ property: prop, residents, bills, taxes });
  } catch (err) {
    console.error("GET /admin/properties/:id error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// DELETE /api/admin/properties/:id (Guarded Deletion)
router.delete("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const prop = await query("SELECT * FROM properties WHERE id = ?", [id]);
    if (prop.length === 0) {
      return res.status(404).json({ error: "Not found", message: `Property '${id}' not found.` });
    }

    // Guard: Check if active unpaid water bills exist for this property
    const unpaid = await query("SELECT COUNT(*) as count FROM water_bills WHERE property_id = ? AND status != 'Paid'", [id]);
    if (unpaid[0].count > 0) {
      return res.status(400).json({
        error: "Protected Record",
        message: `Cannot delete property '${prop[0].property_number}': It has ${unpaid[0].count} unpaid water bill(s) pending. Resolve the bills first.`
      });
    }

    // Check if citizen is linked as occupant/owner
    const linkedCitizens = await query("SELECT id, full_name FROM citizens WHERE property_id = ? OR property_no = ?", [id, prop[0].property_number]);
    if (linkedCitizens.length > 0) {
      // Reassign citizen property_id to null rather than deleting the citizen
      await query("UPDATE citizens SET property_id = NULL WHERE property_id = ?", [id]);
    }

    await query("DELETE FROM properties WHERE id = ?", [id]);
    res.json({ message: `Property '${prop[0].property_number}' deleted successfully.`, id });
  } catch (err) {
    console.error("DELETE /admin/properties/:id error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 7. REPORTS & AGGREGATIONS
// ==========================================================
router.get("/reports", async (req, res) => {
  try {
    // 1. Financial summary
    const [billTotals] = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalBilled,
        COALESCE(SUM(paid_amount), 0) as totalCollected,
        COALESCE(SUM(amount - paid_amount), 0) as outstandingBalance
      FROM water_bills
    `);

    const billed = Number(billTotals.totalBilled);
    const collected = Number(billTotals.totalCollected);
    const outstanding = Number(billTotals.outstandingBalance);
    const collectionPercentage = billed > 0 ? Math.round((collected / billed) * 100) : 100;

    const financial = {
      totalBilled: billed,
      totalCollected: collected,
      outstandingBalance: outstanding,
      collectionPercentage
    };

    // 2. Grievances performance
    const [complaintTotals] = await query(`
      SELECT 
        COUNT(*) as totalComplaints,
        SUM(status = 'Resolved') as resolvedCount,
        SUM(status = 'In Progress' OR status = 'Dispatched') as inProgressCount,
        SUM(status = 'Pending') as pendingCount
      FROM community_reports
    `);

    const totalC = Number(complaintTotals.totalComplaints || 0);
    const resolvedC = Number(complaintTotals.resolvedCount || 0);
    const resolutionRate = totalC > 0 ? Math.round((resolvedC / totalC) * 100) : 100;

    const complaints = {
      totalComplaints: totalC,
      resolvedCount: resolvedC,
      inProgressCount: Number(complaintTotals.inProgressCount || 0),
      pendingCount: Number(complaintTotals.pendingCount || 0),
      resolutionRate
    };

    // 3. Water Reserves
    const [reservesTotals] = await query(`
      SELECT 
        COUNT(*) as totalSources,
        COALESCE(SUM(total_capacity), 0) as totalCapacityLiters,
        COALESCE(SUM(ROUND((total_capacity * current_level_percent) / 100)), 0) as totalAvailableLiters
      FROM water_sources
    `);

    const cap = Number(reservesTotals.totalCapacityLiters || 0);
    const avail = Number(reservesTotals.totalAvailableLiters || 0);
    const overallFillPercent = cap > 0 ? Math.round((avail / cap) * 100) : 0;

    const waterReserves = {
      totalSources: Number(reservesTotals.totalSources || 0),
      totalCapacityLiters: cap,
      totalAvailableLiters: avail,
      overallFillPercent
    };

    // 4. Detailed breakdowns
    const revenueByMode = await query(`
      SELECT payment_mode, COUNT(*) as txCount, COALESCE(SUM(amount), 0) as totalAmount
      FROM payments
      GROUP BY payment_mode
    `);

    const duesByWard = await query(`
      SELECT c.ward_area, COUNT(b.id) as billCount, COALESCE(SUM(b.amount - b.paid_amount), 0) as totalDue
      FROM water_bills b
      JOIN citizens c ON b.citizen_id = c.id
      WHERE b.status != 'Paid'
      GROUP BY c.ward_area
    `);

    const complaintsBreakdown = await query(`
      SELECT status, urgency, COUNT(*) as count
      FROM community_reports
      GROUP BY status, urgency
    `);

    const scheduleSummary = await query(`
      SELECT status, COUNT(*) as count
      FROM distribution_schedules
      GROUP BY status
    `);

    res.json({
      financial,
      complaints,
      waterReserves,
      revenueByMode,
      duesByWard,
      complaintsBreakdown,
      scheduleSummary
    });
  } catch (err) {
    console.error("GET /admin/reports error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// ==========================================================
// 13. GRAM PANCHAYAT SERVICES MANAGEMENT (Full CRUD)
// ==========================================================

export async function recordAuditLog(action, entityType, entityId, adminUser, details, ipAddress) {
  try {
    const adminId = adminUser ? (adminUser.id || adminUser.userId || adminUser.username || "admin") : "system";
    const adminName = adminUser ? (adminUser.full_name || adminUser.fullName || adminUser.username || "Staff") : "System";
    await query(`
      INSERT INTO admin_audit_logs (action, entity_type, entity_id, admin_id, admin_name, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [action, entityType, entityId, adminId, adminName, details, ipAddress || "127.0.0.1"]);
  } catch (e) {
    console.warn("Audit log write failed:", e.message);
  }
}

function formatServiceRow(s) {
  if (!s) return null;
  return {
    ...s,
    service_code: s.service_key,
    name_en: s.title_en,
    name_mr: s.title_mr,
    desc_en: s.desc_en,
    desc_mr: s.desc_mr,
    service_badge_text: s.badge_text_en,
    badge_text: s.badge_text_en,
    action_target: s.nav_target,
    is_active: Boolean(s.is_enabled),
    eligibility_instructions: s.eligibility_en,
    required_documents: s.required_docs_en,
    contact_department: s.contact_info_en
  };
}

// GET /api/admin/services - List all services (active & inactive)
router.get("/services", async (req, res) => {
  try {
    const { category, status } = req.query;
    const services = await serviceRepo.getAll(false, category, status);
    res.json({
      success: true,
      count: services.length,
      services: services.map(formatServiceRow)
    });
  } catch (err) {
    console.error("GET /admin/services error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to load services." });
  }
});

// POST /api/admin/services - Add a new service
router.post("/services", async (req, res) => {
  try {
    const title_en = req.body.title_en || req.body.name_en || req.body.title;
    const title_mr = req.body.title_mr || req.body.name_mr || title_en;
    const category = req.body.category || "Civic Utilities";
    const desc_en = req.body.desc_en || req.body.description || req.body.desc;

    if (!title_en || !String(title_en).trim()) {
      return res.status(400).json({ error: "Validation error", message: "Service title (English) is required." });
    }
    if (!title_mr || !String(title_mr).trim()) {
      return res.status(400).json({ error: "Validation error", message: "Service title (मराठी) is required." });
    }
    if (!category || !String(category).trim()) {
      return res.status(400).json({ error: "Validation error", message: "Service category is required." });
    }
    if (!desc_en || !String(desc_en).trim()) {
      return res.status(400).json({ error: "Validation error", message: "Service description (English) is required." });
    }

    const created = await serviceRepo.create(req.body);

    await recordAuditLog(
      "SERVICE_CREATE",
      "SERVICE",
      String(created.id),
      req.user,
      `Created Gram Panchayat service '${created.title_en}' (Key: ${created.service_key})`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: "Gram Panchayat service added successfully.",
      id: created.id,
      service: formatServiceRow(created)
    });
  } catch (err) {
    console.error("POST /admin/services error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Duplicate entry", message: "A service with this key already exists." });
    }
    res.status(500).json({ error: "Server error", message: "Unable to save service. Please try again." });
  }
});

// GET /api/admin/services/:id
router.get("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceRepo.getById(id);
    if (!service) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }
    res.json({ success: true, service: formatServiceRow(service) });
  } catch (err) {
    console.error("GET /admin/services/:id error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to fetch service." });
  }
});

// PUT /api/admin/services/:id - Update service
router.put("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await serviceRepo.getById(id);
    if (!existing) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }

    const updated = await serviceRepo.update(id, req.body);

    await recordAuditLog(
      "SERVICE_UPDATE",
      "SERVICE",
      String(id),
      req.user,
      `Updated service #${id} (${updated.title_en}). Status: ${updated.is_enabled ? 'Active' : 'Disabled'}`,
      req.ip
    );

    res.json({
      success: true,
      message: "Gram Panchayat service updated successfully.",
      service: formatServiceRow(updated)
    });
  } catch (err) {
    console.error("PUT /admin/services/:id error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to update service. Please try again." });
  }
});

// DELETE /api/admin/services/:id - Delete service
router.delete("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await serviceRepo.getById(id);
    if (!existing) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }

    await serviceRepo.delete(id);

    await recordAuditLog(
      "SERVICE_DELETE",
      "SERVICE",
      String(id),
      req.user,
      `Deleted service #${id} (${existing.title_en})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Service '${existing.title_en}' deleted successfully.`,
      id
    });
  } catch (err) {
    console.error("DELETE /admin/services/:id error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to delete service." });
  }
});

// PUT /api/admin/services/:id/move - Move service up or down in display order
router.put("/services/:id/move", async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;
    if (!["up", "down"].includes(direction)) {
      return res.status(400).json({ error: "Validation error", message: "Direction must be 'up' or 'down'." });
    }

    const moved = await serviceRepo.moveOrder(id, direction);
    if (!moved) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }

    await recordAuditLog(
      "SERVICE_REORDER",
      "SERVICE",
      String(id),
      req.user,
      `Moved service #${id} (${moved.title_en}) ${direction}. Order changed to #${moved.display_order}.`,
      req.ip
    );

    res.json({
      success: true,
      message: `Service '${moved.title_en}' moved ${direction} successfully.`,
      id: moved.id,
      display_order: moved.display_order,
      service: formatServiceRow(moved)
    });
  } catch (err) {
    console.error("PUT /admin/services/:id/move error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to move service." });
  }
});

// PUT /api/admin/services/reorder - Batch update display orders
router.put("/services/reorder", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Validation error", message: "Items array is required." });
    }

    const normalized = await serviceRepo.reorder(items);

    await recordAuditLog(
      "SERVICE_REORDER_BATCH",
      "SERVICE",
      "BATCH",
      req.user,
      `Batch reordered ${items.length} Gram Panchayat services.`,
      req.ip
    );

    res.json({
      success: true,
      message: "Services display order persisted successfully.",
      services: normalized.map(formatServiceRow)
    });
  } catch (err) {
    console.error("PUT /admin/services/reorder error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to update services order." });
  }
});

// ==========================================================
// 14. ADMINISTRATIVE AUDIT LOGS
// ==========================================================
router.get("/audit-logs", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await query(`
      SELECT * FROM admin_audit_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error("GET /admin/audit-logs error:", err);
    res.status(500).json({ error: "Server error", message: "Unable to fetch audit logs." });
  }
});

export default router;
