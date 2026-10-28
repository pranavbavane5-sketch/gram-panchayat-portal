/**
 * JalMitra - Admin Portal Protected Routes
 * Authorized Gram Panchayat Staff Control Panel
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { authenticateToken, requireRole } from "../auth.js";
import { buildExcelWorkbook } from "../excelExport.js";

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
      "SELECT id, login_id, role, role_title, full_name, phone, email, created_at FROM users WHERE id = ?",
      [adminId]
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

    const users = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [adminId]);
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
      [newFullName, newRoleTitle, newPhone, newEmail, adminId]
    );

    const [updatedUser] = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [adminId]);
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

    res.json({
      citizens: {
        total: citRows.totalCitizens || 0,
        active: citRows.activeCitizens || 0
      },
      waterSources: {
        total: srcRows.totalSources || 0,
        operational: srcRows.operationalSources || 0,
        totalCapacity: Number(srcRows.totalCapacity),
        totalAvailable: Number(srcRows.totalAvailable)
      },
      billing: {
        totalOutstanding: Number(billRows.totalOutstandingAmount),
        totalCollected: Number(billRows.totalPaidAmount),
        unpaidCount: billRows.unpaidBillsCount || 0,
        totalRevenue: Number(payRows.totalRevenue),
        transactionCount: payRows.totalTransactions || 0
      },
      complaints: {
        total: cmpRows.totalComplaints || 0,
        pending: cmpRows.pendingComplaints || 0,
        inProgress: cmpRows.inProgressComplaints || 0,
        resolved: cmpRows.resolvedComplaints || 0
      },
      taxes: {
        total: Number(taxRows.totalTaxAmount),
        collected: Number(taxRows.collectedTaxAmount)
      }
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
    let sql = `
      SELECT c.*, u.login_id, u.is_active as user_active
      FROM citizens c
      LEFT JOIN users u ON c.user_id = u.id
    `;
    const params = [];

    if (search) {
      sql += " WHERE c.full_name LIKE ? OR c.phone LIKE ? OR c.property_no LIKE ? OR c.ward_area LIKE ? OR c.id LIKE ?";
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    sql += " ORDER BY c.created_at DESC";
    const rows = await query(sql, params);
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

    const countRow = await query("SELECT COUNT(*) as count FROM citizens");
    const nextSeq = countRow[0].count + 101;
    const citizenId = (req.body.citizenId || req.body.id || `CIT-${nextSeq}`).trim();
    const userId = `usr-cit-${Date.now()}`;
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // Check if citizenId or phone already in users table
    const existingUsers = await query("SELECT id FROM users WHERE login_id = ? OR phone = ?", [citizenId, phone]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Conflict", message: `A user account with Citizen ID '${citizenId}' or phone '${phone}' already exists.` });
    }

    // Link property if matching record exists in properties table
    let propertyId = null;
    try {
      const propRows = await query("SELECT id FROM properties WHERE property_number = ?", [propertyNo]);
      if (propRows.length > 0) {
        propertyId = propRows[0].id;
        await query("UPDATE properties SET owner_citizen_id = ?, owner_name = ?, ward_area = ? WHERE id = ?", [citizenId, fullName, wardArea, propertyId]);
      }
    } catch (e) {
      console.warn("Property linking note:", e.message);
    }

    // 1. Insert Citizen Profile
    await query(`
      INSERT INTO citizens (id, user_id, full_name, phone, email, property_no, ward_area, family_members, meter_no, connection_type, status, property_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    `, [citizenId, userId, fullName, phone, email, propertyNo, wardArea, familyMembers, meterNo || `MET-${nextSeq}`, connectionType, propertyId]);

    // 2. Insert User Login Credentials
    await query(`
      INSERT INTO users (id, login_id, password_hash, role, full_name, phone, email, is_active, citizen_id)
      VALUES (?, ?, ?, 'citizen', ?, ?, ?, 1, ?)
    `, [userId, citizenId, passwordHash, fullName, phone, email, citizenId]);

    res.status(201).json({
      message: "Citizen created successfully.",
      citizenId,
      loginId: citizenId,
      fullName,
      propertyNo,
      wardArea,
      initialPassword
    });
  } catch (err) {
    console.error("POST /citizens error:", err);
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

    const billId = `BILL-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO water_bills (id, citizen_id, billing_period, amount, paid_amount, due_date, status)
      VALUES (?, ?, ?, ?, 0.00, ?, 'Unpaid')
    `, [billId, citizenId, billingPeriod.trim(), parseFloat(amount), dueDate]);

    res.status(201).json({ message: "Water bill created successfully.", billId, id: billId });
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
    const receiptNo = req.body.receiptNo || req.body.transactionRef || `REC-${Date.now().toString().slice(-5)}`;
    const notes = req.body.notes;

    if (!citizenId && billId) {
      const [bill] = await query("SELECT citizen_id FROM water_bills WHERE id = ?", [billId]);
      if (bill) citizenId = bill.citizen_id;
    }

    if (!citizenId || amount === undefined || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "Validation error", message: "Citizen ID and payment amount are required." });
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
      const [bill] = await query("SELECT amount, paid_amount FROM water_bills WHERE id = ?", [billId]);
      if (bill) {
        const newPaid = Number(bill.paid_amount) + payAmount;
        const newStatus = newPaid >= Number(bill.amount) ? "Paid" : "Partially Paid";
        await query("UPDATE water_bills SET paid_amount = ?, status = ? WHERE id = ?", [newPaid, newStatus, billId]);
      }
    }

    res.status(201).json({ message: "Payment recorded successfully.", paymentId: payId, receiptNo: recNo });
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
    const { citizenId, chargeType, description, amount, dueDate } = req.body;

    if (!citizenId || !chargeType || !amount || !dueDate) {
      return res.status(400).json({ error: "Validation error", message: "Citizen ID, charge type, amount, and due date are required." });
    }

    const taxId = `TAX-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO taxes_charges (id, citizen_id, charge_type, description, amount, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Unpaid')
    `, [taxId, citizenId, chargeType.trim(), description || "", parseFloat(amount), dueDate]);

    res.status(201).json({ message: "Tax/charge record created.", taxId });
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
    let sql = `
      SELECT p.*, c.full_name as linked_citizen_name, c.phone as linked_citizen_phone,
             (SELECT COUNT(*) FROM water_bills wb WHERE wb.property_id = p.id OR wb.citizen_id = p.owner_citizen_id) as total_bills,
             (SELECT COALESCE(SUM(wb.amount - wb.paid_amount), 0) FROM water_bills wb WHERE (wb.property_id = p.id OR wb.citizen_id = p.owner_citizen_id) AND wb.status != 'Paid') as unpaid_water_dues,
             (SELECT COALESCE(SUM(tc.amount), 0) FROM taxes_charges tc WHERE (tc.property_id = p.id OR tc.citizen_id = p.owner_citizen_id) AND tc.status = 'Unpaid') as unpaid_tax_dues
      FROM properties p
      LEFT JOIN citizens c ON p.owner_citizen_id = c.id
    `;
    const params = [];
    if (search) {
      sql += " WHERE p.property_number LIKE ? OR p.owner_name LIKE ? OR p.ward_area LIKE ? OR p.address LIKE ?";
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    sql += " ORDER BY p.created_at DESC";
    const rows = await query(sql, params);
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

// GET /api/admin/properties/:id (Single property details + bills & taxes)
router.get("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(`
      SELECT p.*, c.full_name as citizen_name, c.phone as citizen_phone, c.email as citizen_email
      FROM properties p
      LEFT JOIN citizens c ON p.owner_citizen_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Property not found." });
    }

    const prop = rows[0];
    const bills = await query("SELECT * FROM water_bills WHERE property_id = ? OR citizen_id = ? ORDER BY due_date DESC", [id, prop.owner_citizen_id || ""]);
    const taxes = await query("SELECT * FROM taxes_charges WHERE property_id = ? OR citizen_id = ? ORDER BY due_date DESC", [id, prop.owner_citizen_id || ""]);

    res.json({ property: prop, bills, taxes });
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
    let sql = "SELECT * FROM gp_services WHERE 1=1";
    const params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    if (status === "active" || status === "1") {
      sql += " AND is_enabled = 1";
    } else if (status === "inactive" || status === "0") {
      sql += " AND is_enabled = 0";
    }

    sql += " ORDER BY display_order ASC, id ASC";
    const rows = await query(sql, params);
    const services = rows.map(formatServiceRow);

    res.json({ success: true, count: services.length, services });
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
    const icon = req.body.icon || "🏛️";
    const badge_text_en = req.body.badge_text_en || req.body.service_badge_text || req.body.badge || "Office Counter";
    const badge_text_mr = req.body.badge_text_mr || badge_text_en;
    const badge_type = req.body.badge_type || "counter";
    const desc_en = req.body.desc_en || req.body.description || req.body.desc || "Gram Panchayat Service";
    const desc_mr = req.body.desc_mr || desc_en;
    const eligibility_en = req.body.eligibility_en || req.body.eligibility_instructions || "";
    const eligibility_mr = req.body.eligibility_mr || eligibility_en;
    const required_docs_en = req.body.required_docs_en || req.body.required_documents || "";
    const required_docs_mr = req.body.required_docs_mr || required_docs_en;
    const contact_info_en = req.body.contact_info_en || req.body.contact_department || "";
    const contact_info_mr = req.body.contact_info_mr || contact_info_en;
    const button_label_en = req.body.button_label_en || "Access Service";
    const button_label_mr = req.body.button_label_mr || "सेवा मिळवा";
    const nav_target = req.body.nav_target || req.body.action_target || "counter_info";
    const is_enabled = req.body.is_enabled !== undefined ? (req.body.is_enabled ? 1 : 0) : (req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : 1);
    const service_key = req.body.service_key || req.body.service_code || req.body.code;
    const nav_extra_attrs = req.body.nav_extra_attrs;

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

    const key = (service_key && String(service_key).trim())
      ? String(service_key).trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : `srv_${Date.now()}`;

    // Compute display_order: if not explicitly provided, assign the next available order number (placed at end)
    let order = (req.body.display_order !== undefined && req.body.display_order !== null && req.body.display_order !== "" && !isNaN(Number(req.body.display_order)))
      ? Number(req.body.display_order)
      : null;

    if (order === null || order < 1) {
      const [maxRow] = await query("SELECT COALESCE(MAX(display_order), 0) AS max_order FROM gp_services");
      order = (Number(maxRow?.max_order) || 0) + 1;
    }

    const enabled = is_enabled ? 1 : 0;
    const extraAttrs = typeof nav_extra_attrs === "object" ? JSON.stringify(nav_extra_attrs) : (nav_extra_attrs || "{}");

    const result = await query(`
      INSERT INTO gp_services (
        service_key, title_en, title_mr, category, icon,
        badge_text_en, badge_text_mr, badge_type,
        desc_en, desc_mr, eligibility_en, eligibility_mr,
        required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
        button_label_en, button_label_mr, nav_target, nav_extra_attrs,
        display_order, is_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      key, String(title_en).trim(), String(title_mr).trim(), String(category).trim(), icon || "🏛️",
      badge_text_en, badge_text_mr, badge_type,
      String(desc_en).trim(), desc_mr ? String(desc_mr).trim() : String(desc_en).trim(),
      eligibility_en || "", eligibility_mr || "",
      required_docs_en || "", required_docs_mr || "",
      contact_info_en || "", contact_info_mr || "",
      button_label_en || "Access Service", button_label_mr || "सेवा मिळवा",
      nav_target || "counter_info", extraAttrs,
      order, enabled
    ]);

    const newId = result.insertId;
    const [created] = await query("SELECT * FROM gp_services WHERE id = ?", [newId]);

    await recordAuditLog(
      "SERVICE_CREATE",
      "SERVICE",
      String(newId),
      req.user,
      `Created Gram Panchayat service '${String(title_en).trim()}' (Key: ${key})`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: "Gram Panchayat service added successfully.",
      id: newId,
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
    const [service] = await query("SELECT * FROM gp_services WHERE id = ?", [id]);
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
    const [existing] = await query("SELECT * FROM gp_services WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }

    const title_en = req.body.title_en !== undefined ? req.body.title_en : (req.body.name_en !== undefined ? req.body.name_en : null);
    const title_mr = req.body.title_mr !== undefined ? req.body.title_mr : (req.body.name_mr !== undefined ? req.body.name_mr : null);
    const category = req.body.category !== undefined ? req.body.category : null;
    const icon = req.body.icon !== undefined ? req.body.icon : null;
    const badge_text_en = req.body.badge_text_en !== undefined ? req.body.badge_text_en : (req.body.service_badge_text !== undefined ? req.body.service_badge_text : null);
    const badge_text_mr = req.body.badge_text_mr !== undefined ? req.body.badge_text_mr : null;
    const badge_type = req.body.badge_type !== undefined ? req.body.badge_type : null;
    const desc_en = req.body.desc_en !== undefined ? req.body.desc_en : (req.body.description !== undefined ? req.body.description : null);
    const desc_mr = req.body.desc_mr !== undefined ? req.body.desc_mr : null;
    const eligibility_en = req.body.eligibility_en !== undefined ? req.body.eligibility_en : (req.body.eligibility_instructions !== undefined ? req.body.eligibility_instructions : null);
    const eligibility_mr = req.body.eligibility_mr !== undefined ? req.body.eligibility_mr : null;
    const required_docs_en = req.body.required_docs_en !== undefined ? req.body.required_docs_en : (req.body.required_documents !== undefined ? req.body.required_documents : null);
    const required_docs_mr = req.body.required_docs_mr !== undefined ? req.body.required_docs_mr : null;
    const contact_info_en = req.body.contact_info_en !== undefined ? req.body.contact_info_en : (req.body.contact_department !== undefined ? req.body.contact_department : null);
    const contact_info_mr = req.body.contact_info_mr !== undefined ? req.body.contact_info_mr : null;
    const button_label_en = req.body.button_label_en !== undefined ? req.body.button_label_en : null;
    const button_label_mr = req.body.button_label_mr !== undefined ? req.body.button_label_mr : null;
    const nav_target = req.body.nav_target !== undefined ? req.body.nav_target : (req.body.action_target !== undefined ? req.body.action_target : null);
    const nav_extra_attrs = req.body.nav_extra_attrs;
    const display_order = (req.body.display_order !== undefined && req.body.display_order !== null && req.body.display_order !== "" && !isNaN(Number(req.body.display_order)))
      ? Number(req.body.display_order)
      : null;
    const is_enabled = req.body.is_enabled !== undefined 
      ? (req.body.is_enabled ? 1 : 0) 
      : (req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : null);

    const extraAttrs = nav_extra_attrs !== undefined
      ? (typeof nav_extra_attrs === "object" ? JSON.stringify(nav_extra_attrs) : nav_extra_attrs)
      : existing.nav_extra_attrs;

    await query(`
      UPDATE gp_services SET
        title_en = COALESCE(?, title_en),
        title_mr = COALESCE(?, title_mr),
        category = COALESCE(?, category),
        icon = COALESCE(?, icon),
        badge_text_en = COALESCE(?, badge_text_en),
        badge_text_mr = COALESCE(?, badge_text_mr),
        badge_type = COALESCE(?, badge_type),
        desc_en = COALESCE(?, desc_en),
        desc_mr = COALESCE(?, desc_mr),
        eligibility_en = COALESCE(?, eligibility_en),
        eligibility_mr = COALESCE(?, eligibility_mr),
        required_docs_en = COALESCE(?, required_docs_en),
        required_docs_mr = COALESCE(?, required_docs_mr),
        contact_info_en = COALESCE(?, contact_info_en),
        contact_info_mr = COALESCE(?, contact_info_mr),
        button_label_en = COALESCE(?, button_label_en),
        button_label_mr = COALESCE(?, button_label_mr),
        nav_target = COALESCE(?, nav_target),
        nav_extra_attrs = ?,
        display_order = COALESCE(?, display_order),
        is_enabled = COALESCE(?, is_enabled)
      WHERE id = ?
    `, [
      title_en, title_mr, category, icon,
      badge_text_en, badge_text_mr, badge_type,
      desc_en, desc_mr, eligibility_en, eligibility_mr,
      required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
      button_label_en, button_label_mr, nav_target, extraAttrs,
      display_order !== null ? Number(display_order) : null,
      is_enabled !== null ? is_enabled : null,
      id
    ]);

    const [updated] = await query("SELECT * FROM gp_services WHERE id = ?", [id]);

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
    const [existing] = await query("SELECT * FROM gp_services WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }

    await query("DELETE FROM gp_services WHERE id = ?", [id]);

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

    const rows = await query("SELECT id, title_en, display_order FROM gp_services ORDER BY display_order ASC, id ASC");
    const currentIndex = rows.findIndex(r => String(r.id) === String(id));
    if (currentIndex === -1) {
      return res.status(404).json({ error: "Not Found", message: `Service #${id} not found.` });
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) {
      return res.json({
        success: true,
        message: `Service is already at the ${direction === 'up' ? 'top' : 'bottom'}.`,
        service: formatServiceRow(rows[currentIndex])
      });
    }

    const currentItem = rows[currentIndex];
    const swapItem = rows[targetIndex];

    let currentNewOrder = Number(swapItem.display_order);
    let swapNewOrder = Number(currentItem.display_order);

    // If both items had identical display_order, adjust so current strictly moves ahead/behind
    if (currentNewOrder === swapNewOrder) {
      if (direction === "up") {
        currentNewOrder = Math.max(1, swapNewOrder - 1);
      } else {
        currentNewOrder = swapNewOrder + 1;
      }
    }

    await query("UPDATE gp_services SET display_order = ? WHERE id = ?", [currentNewOrder, currentItem.id]);
    await query("UPDATE gp_services SET display_order = ? WHERE id = ?", [swapNewOrder, swapItem.id]);

    await recordAuditLog(
      "SERVICE_REORDER",
      "SERVICE",
      String(id),
      req.user,
      `Moved service #${id} (${currentItem.title_en}) ${direction}. Order changed to #${currentNewOrder}.`,
      req.ip
    );

    const [updated] = await query("SELECT * FROM gp_services WHERE id = ?", [id]);

    res.json({
      success: true,
      message: `Service '${currentItem.title_en}' moved ${direction} successfully.`,
      id: currentItem.id,
      display_order: currentNewOrder,
      service: formatServiceRow(updated)
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

    for (const item of items) {
      if (item.id && item.display_order !== undefined) {
        await query("UPDATE gp_services SET display_order = ? WHERE id = ?", [Number(item.display_order), item.id]);
      }
    }

    await recordAuditLog(
      "SERVICE_REORDER_BATCH",
      "SERVICE",
      "BATCH",
      req.user,
      `Batch reordered ${items.length} Gram Panchayat services.`,
      req.ip
    );

    res.json({ success: true, message: "Services display order persisted successfully." });
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
