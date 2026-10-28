import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { query } from "../db.js";
import { authenticateToken, requireRole } from "../auth.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

// File validation filter: PDF, DOCX, JPG, PNG, max 5MB
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ==========================================================
// 1. PUBLIC & CITIZEN APPLICATION SUBMISSION
// ==========================================================

// POST /api/applications (Public or Authenticated Citizen)
router.post("/applications", (req, res, next) => {
  // Allow optional token authentication without rejecting guest submissions
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    return authenticateToken(req, res, () => {
      upload.single("attachment")(req, res, (err) => {
        if (err) return res.status(400).json({ error: "Upload error", message: err.message });
        next();
      });
    });
  }
  upload.single("attachment")(req, res, (err) => {
    if (err) return res.status(400).json({ error: "Upload error", message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const applicant_name = (req.body.applicant_name || req.body.citizen_name || (req.user && req.user.full_name) || "").trim();
    const applicant_phone = (req.body.applicant_phone || req.body.citizen_phone || (req.user && req.user.phone) || "").trim();
    const applicant_email = (req.body.applicant_email || req.body.citizen_email || (req.user && req.user.email) || "").trim();
    const ward_area = (req.body.ward_area || req.body.ward || "").trim();
    const property_no = (req.body.property_no || req.body.property_number || "").trim();
    const {
      category,
      sub_type,
      subject,
      description,
      urgency,
      is_rti,
      rti_fee_status,
      rti_fee_receipt_no,
      is_citizen_of_india,
      is_draft,
      template_type,
      letter_content
    } = req.body;


    // Validation
    if (!applicant_name || !applicant_name.trim()) {
      return res.status(400).json({ error: "Validation error", message: "Applicant name is required." });
    }
    if (!applicant_phone || !applicant_phone.trim()) {
      return res.status(400).json({ error: "Validation error", message: "Contact phone number is required." });
    }
    if (!ward_area || !ward_area.trim()) {
      return res.status(400).json({ error: "Validation error", message: "Ward / Area is required." });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: "Validation error", message: "Application category is required." });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Validation error", message: "Subject is required." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Validation error", message: "Application description is required." });
    }

    // Determine citizen_id if authenticated
    let citizenId = null;
    if (req.user && req.user.role === "citizen") {
      citizenId = req.user.citizen_id || req.user.citizenId || null;
    }
    if (!citizenId && req.body.citizen_id) {
      citizenId = req.body.citizen_id;
    }


    // Generate unique reference number based on category
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const yr = new Date().getFullYear();
    const isRtiFlag = String(is_rti) === "1" || String(is_rti) === "true" || category.includes("RTI");

    let refPrefix = "APP";
    if (isRtiFlag) {
      refPrefix = "RTI";
    } else if (category.includes("Complaint") || category.includes("Grievance")) {
      refPrefix = "CMP";
    } else if (category.includes("Request") || category.includes("Letter")) {
      refPrefix = "REQ";
    }

    const referenceNo = `${refPrefix}-${yr}-${randPart}`;
    const appId = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Attachment info
    const attachmentPath = req.file ? `/api/attachments/${req.file.filename}` : null;
    const attachmentName = req.file ? req.file.originalname : null;
    const attachmentSize = req.file ? req.file.size : null;

    // RTI statutory 30-day deadline
    let rtiDeadline = null;
    if (isRtiFlag) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      rtiDeadline = d.toISOString().split("T")[0];
    }

    const initialStatus = is_draft === "1" || is_draft === true ? "Submitted" : "Submitted";
    const cleanUrgency = ["Normal", "High", "Critical"].includes(urgency) ? urgency : "Normal";

    await query(`
      INSERT INTO applications (
        id, reference_no, citizen_id, applicant_name, applicant_phone, applicant_email,
        ward_area, property_no, category, sub_type, subject, description, urgency,
        status, is_rti, rti_fee_status, rti_fee_receipt_no, rti_deadline, is_citizen_of_india,
        attachment_path, attachment_name, attachment_size, is_draft, template_type, letter_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      appId,
      referenceNo,
      citizenId,
      applicant_name.trim(),
      applicant_phone.trim(),
      applicant_email ? applicant_email.trim() : null,
      ward_area.trim(),
      property_no ? property_no.trim() : null,
      category.trim(),
      sub_type ? sub_type.trim() : null,
      subject.trim(),
      description.trim(),
      cleanUrgency,
      initialStatus,
      isRtiFlag ? 1 : 0,
      (() => {
        let fs = rti_fee_status || (isRtiFlag ? "Fee Pending at Counter" : "Not Applicable");
        if (fs === "Paid") return "Prescribed Fee Paid";
        if (fs === "Pending") return "Fee Pending at Counter";
        return fs;
      })(),
      rti_fee_receipt_no || null,
      rtiDeadline,
      is_citizen_of_india === false || String(is_citizen_of_india) === "0" ? 0 : 1,
      attachmentPath,
      attachmentName,
      attachmentSize,
      is_draft ? 1 : 0,
      template_type || null,
      letter_content || null
    ]);

    // Insert audit history
    await query(`
      INSERT INTO application_history (id, application_id, previous_status, new_status, action_by, action_role, notes)
      VALUES (?, ?, NULL, ?, ?, ?, ?)
    `, [
      `HIST-${Date.now()}`,
      appId,
      initialStatus,
      applicant_name.trim(),
      req.user ? req.user.role : "citizen",
      isRtiFlag
        ? "RTI Application received online. Statutory 30-day timeline initialized."
        : "Application submitted via Gram Panchayat digital portal."
    ]);

    // Backward compatibility mirror to community_reports if water complaint
    if (category.includes("Water Supply") || category.includes("Water Quality") || category.includes("Grievance")) {
      try {
        await query(`
          INSERT INTO community_reports (id, citizen_id, name, phone, area, problem_type, urgency, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, [
          `cmp-${Date.now()}`,
          citizenId,
          applicant_name.trim(),
          applicant_phone.trim(),
          ward_area.trim(),
          sub_type || "General Water Supply Issue",
          cleanUrgency,
          description.trim()
        ]);
      } catch (mirrorErr) {
        console.warn("Mirror to community_reports skipped:", mirrorErr.message);
      }
    }

    res.status(201).json({
      success: true,
      id: appId,
      reference_no: referenceNo,
      referenceNo,
      status: initialStatus,
      category,
      is_rti: isRtiFlag,
      isRti: isRtiFlag,
      rti_deadline: rtiDeadline,
      rtiDeadline,
      message: isRtiFlag
        ? `RTI Application submitted successfully! Reference Number: ${referenceNo}. Please present prescribed RTI fee / BPL proof if pending.`
        : `Application submitted successfully! Your official reference number is: ${referenceNo}.`
    });

  } catch (err) {
    console.error("POST /api/applications error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET /api/applications/track/:referenceNo (Public Reference Lookup)
router.get("/applications/track/:referenceNo", async (req, res) => {
  try {
    const { referenceNo } = req.params;
    const rows = await query(`
      SELECT 
        id, reference_no, citizen_id, applicant_name, applicant_phone, applicant_email,
        category, sub_type, subject, description, urgency, status,
        ward_area, assigned_officer, assigned_at, admin_notes, official_response, official_response_doc,
        is_rti, rti_fee_status, rti_deadline, created_at, resolved_at
      FROM applications 
      WHERE reference_no = ? OR id = ?
      LIMIT 1
    `, [referenceNo.trim(), referenceNo.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found", message: `No application found with reference number "${referenceNo}".` });
    }

    const app = rows[0];
    app.assigned_to = app.assigned_officer;
    app.citizen_name = app.applicant_name;
    app.citizen_phone = app.applicant_phone;
    app.ward = app.ward_area;

    // Fetch history
    const history = await query(`
      SELECT previous_status, new_status, action_by, notes, created_at 
      FROM application_history 
      WHERE application_id = ? 
      ORDER BY created_at ASC
    `, [app.id]);

    res.json({
      ...app,
      application: app,
      history
    });
  } catch (err) {
    console.error("GET /api/applications/track error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET /api/citizen/applications (Authenticated Citizen's Own Submissions)
router.get("/citizen/applications", authenticateToken, requireRole(["citizen"]), async (req, res) => {
  try {
    const citizenId = req.user.citizen_id || req.user.citizenId;
    if (!citizenId) {
      return res.json([]);
    }

    const rows = await query(`
      SELECT * FROM applications 
      WHERE citizen_id = ? 
      ORDER BY created_at DESC
    `, [citizenId]);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/citizen/applications error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 2. ADMIN PORTAL: APPLICATIONS & RTI REGISTERS
// ==========================================================

// GET /api/admin/applications (Admin search, filter, paginate)
router.get("/admin/applications", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { category, status, ward, is_rti, search, limit = 100, offset = 0 } = req.query;

    let sql = "SELECT * FROM applications WHERE 1=1";
    const params = [];

    if (category && category !== "all") {
      sql += " AND category = ?";
      params.push(category);
    }
    if (status && status !== "all") {
      sql += " AND status = ?";
      params.push(status);
    }
    if (ward && ward !== "all") {
      sql += " AND ward_area = ?";
      params.push(ward);
    }
    if (is_rti !== undefined && is_rti !== "" && is_rti !== "all") {
      sql += " AND is_rti = ?";
      params.push(String(is_rti) === "1" ? 1 : 0);
    }
    if (search && search.trim() !== "") {
      const q = `%${search.trim()}%`;
      sql += " AND (reference_no LIKE ? OR applicant_name LIKE ? OR applicant_phone LIKE ? OR subject LIKE ? OR description LIKE ?)";
      params.push(q, q, q, q, q);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await query(sql, params);

    // Summary counts
    const countRows = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_rti = 1 THEN 1 ELSE 0 END) as total_rti,
        SUM(CASE WHEN is_rti = 1 AND status NOT IN ('Replied', 'Closed') THEN 1 ELSE 0 END) as pending_rti,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status IN ('Under Review', 'In Progress', 'Assigned') THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status IN ('Resolved', 'Replied', 'Closed') THEN 1 ELSE 0 END) as resolved_count
      FROM applications
    `);

    res.json({
      applications: rows,
      stats: countRows[0] || {}
    });
  } catch (err) {
    console.error("GET /api/admin/applications error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// GET /api/admin/applications/export (CSV Export)
router.get("/admin/applications/export", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        reference_no, created_at, category, applicant_name, applicant_phone, ward_area,
        property_no, subject, urgency, status, assigned_officer, is_rti, rti_deadline,
        official_response, resolved_at
      FROM applications 
      ORDER BY created_at DESC
    `);

    // Build CSV
    const headers = [
      "Reference No",
      "Filing Date",
      "Category",
      "Applicant Name",
      "Phone",
      "Ward / Area",
      "Property No",
      "Subject",
      "Urgency",
      "Status",
      "Assigned Officer",
      "Is RTI",
      "RTI Deadline",
      "Official Response",
      "Resolution Date"
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csv = headers.join(",") + "\n";
    rows.forEach(r => {
      csv += [
        escapeCsv(r.reference_no),
        escapeCsv(r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : ""),
        escapeCsv(r.category),
        escapeCsv(r.applicant_name),
        escapeCsv(r.applicant_phone),
        escapeCsv(r.ward_area),
        escapeCsv(r.property_no),
        escapeCsv(r.subject),
        escapeCsv(r.urgency),
        escapeCsv(r.status),
        escapeCsv(r.assigned_officer),
        escapeCsv(r.is_rti ? "Yes" : "No"),
        escapeCsv(r.rti_deadline ? new Date(r.rti_deadline).toLocaleDateString("en-IN") : ""),
        escapeCsv(r.official_response),
        escapeCsv(r.resolved_at ? new Date(r.resolved_at).toLocaleDateString("en-IN") : "")
      ].join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="gram_panchayat_applications_${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("GET /api/admin/applications/export error:", err);
    res.status(500).json({ error: "Export error", message: err.message });
  }
});

// GET /api/admin/applications/:id (Admin Single Detail with Audit Trail)
router.get("/admin/applications/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query("SELECT * FROM applications WHERE id = ? OR reference_no = ? LIMIT 1", [id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Application record not found." });
    }

    const app = rows[0];
    const history = await query(`
      SELECT * FROM application_history 
      WHERE application_id = ? 
      ORDER BY created_at ASC
    `, [app.id]);

    res.json({
      application: app,
      history
    });
  } catch (err) {
    console.error("GET /api/admin/applications/:id error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// PUT /api/admin/applications/:id/status (Admin Update Status, Assign, Add Response)
router.put("/admin/applications/:id/status", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      official_response,
      official_response_doc
    } = req.body;
    const assigned_officer = req.body.assigned_officer !== undefined ? req.body.assigned_officer : req.body.assigned_to;
    const admin_notes = req.body.admin_notes !== undefined ? req.body.admin_notes : req.body.internal_notes;


    const validStatuses = [
      "Submitted",
      "Under Review",
      "Additional Information Required",
      "Assigned",
      "In Progress",
      "Replied",
      "Transferred",
      "Resolved",
      "Closed",
      "Rejected"
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Validation error",
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Check existing
    const existing = await query("SELECT * FROM applications WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Not found", message: "Application record not found." });
    }
    const current = existing[0];

    const updates = [];
    const params = [];

    if (status) {
      updates.push("status = ?");
      params.push(status);
      if (["Resolved", "Replied", "Closed"].includes(status)) {
        updates.push("resolved_at = NOW()");
      }
    }
    if (assigned_officer !== undefined) {
      updates.push("assigned_officer = ?");
      params.push(assigned_officer);
      updates.push("assigned_at = NOW()");
    }
    if (admin_notes !== undefined) {
      updates.push("admin_notes = ?");
      params.push(admin_notes);
    }
    if (official_response !== undefined) {
      updates.push("official_response = ?");
      params.push(official_response);
    }
    if (official_response_doc !== undefined) {
      updates.push("official_response_doc = ?");
      params.push(official_response_doc);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(`UPDATE applications SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    // Audit log entry
    const actionBy = req.user.full_name || "Admin Staff";
    await query(`
      INSERT INTO application_history (id, application_id, previous_status, new_status, action_by, action_role, notes)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `, [
      `HIST-${Date.now()}`,
      id,
      current.status,
      status || current.status,
      actionBy,
      admin_notes || official_response || `Status updated to ${status}`
    ]);

    res.json({
      success: true,
      message: "Application updated successfully.",
      status: status || current.status
    });
  } catch (err) {
    console.error("PUT /api/admin/applications/:id/status error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 3. PUBLIC NOTICES & ANNOUNCEMENTS
// ==========================================================

// GET /api/notices (Public)
router.get("/notices", async (req, res) => {
  try {
    const rows = await query(`
      SELECT * FROM public_notices 
      WHERE expiry_date IS NULL OR expiry_date >= CURRENT_DATE 
      ORDER BY is_pinned DESC, publish_date DESC 
      LIMIT 20
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET /api/notices error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// POST /api/admin/notices (Admin Protected)
router.post("/admin/notices", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const title = (req.body.title || req.body.title_en || "").trim();
    const title_mr = req.body.title_mr ? req.body.title_mr.trim() : null;
    const category = req.body.category || "Public Notice";
    const content = (req.body.content || req.body.content_en || "").trim();
    const content_mr = req.body.content_mr ? req.body.content_mr.trim() : null;
    const issued_by = req.body.issued_by || "Gram Panchayat";
    const is_pinned = req.body.is_pinned ? 1 : 0;
    const expiry_date = req.body.expiry_date || null;

    if (!title) {
      return res.status(400).json({ error: "Validation error", message: "Notice title is required." });
    }
    if (!content) {
      return res.status(400).json({ error: "Validation error", message: "Notice content is required." });
    }

    const id = `NOT-${Date.now()}`;
    await query(`
      INSERT INTO public_notices (id, title, title_mr, category, content, content_mr, issued_by, is_pinned, publish_date, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?)
    `, [
      id,
      title.trim(),
      title_mr ? title_mr.trim() : null,
      category || "Public Notice",
      content.trim(),
      content_mr ? content_mr.trim() : null,
      issued_by || "Gram Panchayat Sundarpur",
      is_pinned ? 1 : 0,
      expiry_date || null
    ]);

    res.status(201).json({ success: true, message: "Notice published successfully.", id });
  } catch (err) {
    console.error("POST /api/admin/notices error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// DELETE /api/admin/notices/:id (Admin Protected)
router.delete("/admin/notices/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM public_notices WHERE id = ?", [id]);
    res.json({ success: true, message: "Notice removed." });
  } catch (err) {
    console.error("DELETE /api/admin/notices error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 4. VILLAGE WORK REGISTER & STAFF TASKS
// ==========================================================

// GET /api/tasks (Admin Protected)
router.get("/tasks", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const rows = await query("SELECT * FROM gram_panchayat_tasks ORDER BY due_date ASC");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// POST /api/admin/tasks (Admin Protected)
router.post("/admin/tasks", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    const category = req.body.category || "Maintenance";
    const ward_area = (req.body.ward_area || req.body.ward || "General Village").trim();
    const assigned_to = (req.body.assigned_to || "").trim();
    let priority = req.body.priority || "Medium";
    if (priority === "Urgent") priority = "High";
    const due_date = req.body.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    if (!title) {
      return res.status(400).json({ error: "Validation error", message: "Task title is required." });
    }
    if (!assigned_to) {
      return res.status(400).json({ error: "Validation error", message: "Assigned staff member is required." });
    }

    const id = `TSK-${Date.now()}`;
    await query(`
      INSERT INTO gram_panchayat_tasks (id, title, category, ward_area, assigned_to, priority, due_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `, [
      id,
      title,
      category,
      ward_area,
      assigned_to,
      ["Low", "Medium", "High", "Critical"].includes(priority) ? priority : "Medium",
      due_date,
      req.user.full_name || "Admin"
    ]);

    res.status(201).json({ success: true, message: "Task added to village work register.", id });
  } catch (err) {
    console.error("POST /api/admin/tasks error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// PUT /api/admin/tasks/:id/status (Admin Protected)
router.put("/admin/tasks/:id/status", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completion_notes } = req.body;
    if (!status || !["Pending", "In Progress", "Completed", "Delayed"].includes(status)) {
      return res.status(400).json({ error: "Validation error", message: "Valid status required." });
    }

    await query(`
      UPDATE gram_panchayat_tasks 
      SET status = ?, completion_notes = ? 
      WHERE id = ?
    `, [status, completion_notes || null, id]);

    res.json({ success: true, message: "Task status updated." });
  } catch (err) {
    console.error("PUT /api/admin/tasks/:id/status error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 5. YEAR-ROUND GRAM PANCHAYAT DASHBOARD SUMMARY
// ==========================================================

// GET /api/admin/panchayat-summary (Admin Protected)
router.get("/admin/panchayat-summary", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    // 1. Citizens & Households
    const citRows = await query("SELECT COUNT(*) as total_citizens FROM citizens");
    const propRows = await query("SELECT COUNT(*) as total_properties FROM properties");

    // 2. Applications today & pending
    const appRows = await query(`
      SELECT 
        COUNT(*) as total_applications,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as applications_today,
        SUM(CASE WHEN status IN ('Submitted', 'Under Review', 'In Progress', 'Assigned') THEN 1 ELSE 0 END) as pending_applications,
        SUM(CASE WHEN is_rti = 1 AND status NOT IN ('Replied', 'Closed') THEN 1 ELSE 0 END) as pending_rti,
        SUM(CASE WHEN is_rti = 1 AND status NOT IN ('Replied', 'Closed') AND rti_deadline < CURRENT_DATE THEN 1 ELSE 0 END) as overdue_rti
      FROM applications
    `);

    // 3. Financial Collections & Dues
    const billRows = await query(`
      SELECT 
        COUNT(*) as total_bills,
        SUM(CASE WHEN status = 'Unpaid' THEN amount - paid_amount ELSE 0 END) as total_bills_due,
        SUM(paid_amount) as total_bills_collected
      FROM water_bills
    `);

    const taxRows = await query(`
      SELECT 
        SUM(CASE WHEN status = 'Unpaid' THEN amount ELSE 0 END) as total_tax_due,
        SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as total_tax_collected
      FROM taxes_charges
    `);

    // 4. Tasks & Work Register
    const taskRows = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status IN ('Pending', 'In Progress') THEN 1 ELSE 0 END) as open_tasks,
        SUM(CASE WHEN due_date = CURRENT_DATE AND status != 'Completed' THEN 1 ELSE 0 END) as tasks_due_today
      FROM gram_panchayat_tasks
    `);

    // 5. Water Storage
    const tankRows = await query(`
      SELECT 
        COUNT(*) as total_tanks,
        SUM(total_capacity) as total_capacity_litres,
        SUM(current_quantity) as total_storage_litres
      FROM water_tanks
      WHERE is_active = 1
    `);

    const totCap = Number(tankRows[0]?.total_capacity_litres || 0);
    const totStorage = Number(tankRows[0]?.total_storage_litres || 0);
    const fillPercent = totCap > 0 ? ((totStorage / totCap) * 100).toFixed(1) : "0.0";

    const [noticesCount] = await query("SELECT COUNT(*) as count FROM public_notices WHERE expiry_date IS NULL OR expiry_date >= CURRENT_DATE");
    const totalCollected = Number(billRows[0]?.total_bills_collected || 0) + Number(taxRows[0]?.total_tax_collected || 0);
    const totalOutstanding = Number(billRows[0]?.total_bills_due || 0) + Number(taxRows[0]?.total_tax_due || 0);

    res.json({
      citizens_count: Number(citRows[0]?.total_citizens || 0),
      households_count: Number(propRows[0]?.total_properties || 0),
      applications_total: Number(appRows[0]?.total_applications || 0),
      applications_pending: Number(appRows[0]?.pending_applications || 0),
      applications_today: Number(appRows[0]?.applications_today || 0),
      active_rti: Number(appRows[0]?.pending_rti || 0),
      overdue_rti: Number(appRows[0]?.overdue_rti || 0),
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      water_reserve_fill_percent: Number(fillPercent),
      water_storage_liters: totStorage,
      water_capacity_liters: totCap,
      open_tasks: Number(taskRows[0]?.open_tasks || 0),
      total_tasks: Number(taskRows[0]?.total_tasks || 0),
      public_notices_count: Number(noticesCount[0]?.count || 0),

      citizens: {
        totalCitizens: Number(citRows[0]?.total_citizens || 0),
        totalHouseholds: Number(propRows[0]?.total_properties || 0)
      },
      applications: {
        total: Number(appRows[0]?.total_applications || 0),
        receivedToday: Number(appRows[0]?.applications_today || 0),
        pending: Number(appRows[0]?.pending_applications || 0),
        pendingRti: Number(appRows[0]?.pending_rti || 0),
        overdueRti: Number(appRows[0]?.overdue_rti || 0)
      },
      finance: {
        billsDueAmount: Number(billRows[0]?.total_bills_due || 0),
        billsCollectedAmount: Number(billRows[0]?.total_bills_collected || 0),
        taxesDueAmount: Number(taxRows[0]?.total_tax_due || 0),
        taxesCollectedAmount: Number(taxRows[0]?.total_tax_collected || 0)
      },
      tasks: {
        total: Number(taskRows[0]?.total_tasks || 0),
        open: Number(taskRows[0]?.open_tasks || 0),
        dueToday: Number(taskRows[0]?.tasks_due_today || 0)
      },
      water: {
        totalTanks: Number(tankRows[0]?.total_tanks || 0),
        totalCapacityLitres: totCap,
        currentStorageLitres: totStorage,
        fillPercentage: fillPercent
      }
    });
  } catch (err) {
    console.error("GET /api/admin/panchayat-summary error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// Serve attachments safely
router.get("/attachments/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Document not found.");
  }
  res.sendFile(filePath);
});

export default router;
