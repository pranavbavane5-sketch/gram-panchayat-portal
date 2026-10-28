/**
 * JalMitra - Citizen Portal Protected Routes
 * Enforces strict data ownership: Citizens can only access their own private records.
 */

import { Router } from "express";
import { query } from "../db.js";
import { authenticateToken, requireRole } from "../auth.js";

const router = Router();

// Apply authentication and role check (Citizen or Admin)
router.use(authenticateToken);
router.use(requireRole(["citizen", "admin"]));

// Helper: Get effective citizenId for current request
function getCitizenId(req) {
  // If role is citizen, ALWAYS force req.user.citizenId
  if (req.user.role === "citizen") {
    if (!req.user.citizenId) {
      throw new Error("No citizen profile associated with this account.");
    }
    return req.user.citizenId;
  }
  // If admin viewing as a citizen
  return req.query.citizenId || req.user.citizenId;
}

// 1. GET /api/citizen/my-profile
router.get("/my-profile", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const rows = await query(`
      SELECT c.*,
             p.id as prop_id,
             p.property_number as prop_number,
             p.property_type as prop_type,
             p.ward_area as prop_ward,
             p.address as prop_address,
             p.water_meter_no as prop_meter_no,
             p.connection_type as prop_connection_type,
             p.annual_tax as prop_annual_tax
      FROM citizens c
      LEFT JOIN properties p ON (c.property_id = p.id OR c.property_no = p.property_number OR p.owner_citizen_id = c.id)
      WHERE c.id = ?
      LIMIT 1
    `, [citizenId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Citizen profile not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /my-profile error:", err);
    res.status(400).json({ error: "Profile error", message: err.message });
  }
});

// 2. PUT /api/citizen/my-profile (Update permitted details)
router.put("/my-profile", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const { phone, email, familyMembers } = req.body;

    const updates = [];
    const params = [];

    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({ error: "Validation error", message: "Valid 10-digit phone required." });
      }
      updates.push("phone = ?");
      params.push(phone.trim());
    }

    if (email !== undefined) {
      updates.push("email = ?");
      params.push(email.trim());
    }

    if (familyMembers !== undefined) {
      updates.push("family_members = ?");
      params.push(parseInt(familyMembers, 10) || 1);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Validation error", message: "No update fields provided." });
    }

    params.push(citizenId);
    await query(`UPDATE citizens SET ${updates.join(", ")} WHERE id = ?`, params);

    // Also update users table phone/email
    if (phone || email !== undefined) {
      const userUpdates = [];
      const userParams = [];
      if (phone) { userUpdates.push("phone = ?"); userParams.push(phone.trim()); }
      if (email !== undefined) { userUpdates.push("email = ?"); userParams.push(email.trim()); }
      userParams.push(req.user.id);
      await query(`UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`, userParams);
    }

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("PUT /my-profile error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 3. GET /api/citizen/my-bills
router.get("/my-bills", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const bills = await query(`
      SELECT * FROM water_bills 
      WHERE citizen_id = ? 
      ORDER BY due_date DESC
    `, [citizenId]);

    // Compute balance
    let totalDue = 0;
    let totalPaid = 0;
    bills.forEach(b => {
      const due = Number(b.amount) - Number(b.paid_amount);
      if (due > 0) totalDue += due;
      totalPaid += Number(b.paid_amount);
    });

    res.json({
      summary: {
        totalOutstanding: totalDue,
        totalPaid: totalPaid,
        billCount: bills.length
      },
      bills
    });
  } catch (err) {
    console.error("GET /my-bills error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 4. GET /api/citizen/my-payments (Payment receipt history)
router.get("/my-payments", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const payments = await query(`
      SELECT p.*, b.billing_period 
      FROM payments p
      LEFT JOIN water_bills b ON p.bill_id = b.id
      WHERE p.citizen_id = ?
      ORDER BY p.payment_date DESC
    `, [citizenId]);

    res.json(payments);
  } catch (err) {
    console.error("GET /my-payments error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 5. POST /api/citizen/my-payments (Pay a water bill)
router.post("/my-payments", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const { billId, paymentMode } = req.body;

    if (!billId) {
      return res.status(400).json({ error: "Validation error", message: "Bill ID is required." });
    }

    // Verify bill belongs to this citizen
    const bills = await query("SELECT * FROM water_bills WHERE id = ? AND citizen_id = ?", [billId, citizenId]);
    if (bills.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Water bill not found or does not belong to you." });
    }

    const bill = bills[0];
    const dueAmount = Number(bill.amount) - Number(bill.paid_amount);

    if (dueAmount <= 0) {
      return res.status(400).json({ error: "Already Paid", message: "This bill has already been fully paid." });
    }

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const receiptNo = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const mode = paymentMode || "UPI";

    // 1. Record payment
    await query(`
      INSERT INTO payments (id, bill_id, citizen_id, amount, payment_mode, receipt_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [paymentId, billId, citizenId, dueAmount, mode, receiptNo, "Paid via JalMitra Citizen Portal"]);

    // 2. Update bill status
    await query(`
      UPDATE water_bills 
      SET paid_amount = amount, status = 'Paid' 
      WHERE id = ?
    `, [billId]);

    res.status(201).json({
      message: "Payment processed successfully.",
      receipt: {
        receiptNo,
        billId,
        amount: dueAmount,
        paymentMode: mode,
        paidAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("POST /my-payments error:", err);
    res.status(500).json({ error: "Payment failed", message: err.message });
  }
});

// 6. GET /api/citizen/my-taxes
router.get("/my-taxes", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const taxes = await query(`
      SELECT * FROM taxes_charges 
      WHERE citizen_id = ? 
      ORDER BY due_date DESC
    `, [citizenId]);

    res.json(taxes);
  } catch (err) {
    console.error("GET /my-taxes error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 7. POST /api/citizen/my-taxes/pay
router.post("/my-taxes/pay", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const { taxId } = req.body;

    const taxes = await query("SELECT * FROM taxes_charges WHERE id = ? AND citizen_id = ?", [taxId, citizenId]);
    if (taxes.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Tax record not found or not owned by you." });
    }

    await query("UPDATE taxes_charges SET status = 'Paid' WHERE id = ?", [taxId]);
    res.json({ message: "Tax payment recorded successfully.", taxId });
  } catch (err) {
    console.error("POST /my-taxes/pay error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 8. GET /api/citizen/my-complaints
router.get("/my-complaints", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const complaints = await query(`
      SELECT * FROM community_reports 
      WHERE citizen_id = ? OR phone = ?
      ORDER BY created_at DESC
    `, [citizenId, req.user.phone || ""]);

    res.json(complaints);
  } catch (err) {
    console.error("GET /my-complaints error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 9. POST /api/citizen/my-complaints (Submit new complaint)
router.post("/my-complaints", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const { problemType, urgency, description, area } = req.body;

    if (!problemType || !description || description.trim().length < 10) {
      return res.status(400).json({
        error: "Validation error",
        message: "Problem type and a clear description (min 10 chars) are required."
      });
    }

    // Get citizen details for auto-populating
    const citizens = await query("SELECT * FROM citizens WHERE id = ?", [citizenId]);
    const cit = citizens[0] || {};

    const id = `cmp-${Date.now()}`;
    const reportArea = area || cit.ward_area || "Village Center";
    const reportUrgency = ["Normal", "High", "Critical"].includes(urgency) ? urgency : "Normal";

    await query(`
      INSERT INTO community_reports (id, citizen_id, name, phone, area, problem_type, urgency, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [id, citizenId, cit.full_name || req.user.fullName, cit.phone || req.user.phone, reportArea, problemType.trim(), reportUrgency, description.trim()]);

    res.status(201).json({
      message: "Complaint registered successfully. Panchayat staff will review it.",
      id,
      complaintId: id,
      ticketNo: id.slice(-4)
    });
  } catch (err) {
    console.error("POST /my-complaints error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// 10. GET /api/citizen/my-schedule
router.get("/my-schedule", async (req, res) => {
  try {
    const citizenId = getCitizenId(req);
    const citizens = await query("SELECT ward_area FROM citizens WHERE id = ?", [citizenId]);
    const ward = citizens[0]?.ward_area || "";

    const allSchedules = await query("SELECT * FROM distribution_schedules ORDER BY date ASC, time_slot ASC");
    
    // Flag schedules that belong to this citizen's ward
    const enriched = allSchedules.map(s => ({
      ...s,
      isMyWard: ward ? s.area.toLowerCase().includes(ward.toLowerCase()) || ward.toLowerCase().includes(s.area.toLowerCase()) : false
    }));

    res.json(enriched);
  } catch (err) {
    console.error("GET /my-schedule error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
