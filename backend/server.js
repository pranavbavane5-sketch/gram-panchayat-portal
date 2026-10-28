/**
 * JalMitra - Express & MySQL REST API Server
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { query, testConnection, seedIfDatabaseEmpty, resetDatabaseToSample } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import citizenRoutes from "./routes/citizenRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import waterTankRoutes from "./routes/waterTankRoutes.js";
import panchayatRoutes from "./routes/panchayatRoutes.js";
import { runMigrations } from "./migrate.js";
import { authenticateToken, requireRole } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Standard Middlewares
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CORS Configuration - Allows Vercel frontend, preview domains, local dev, and explicit env origins
const allowedOrigins = [
  "https://gram-panchayat-portal-sandy.vercel.app",
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) : [])
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, mobile apps, Postman, internal health checks)
    if (!origin) return callback(null, true);

    // In local development or localhost callers, allow
    if (process.env.NODE_ENV !== "production" || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }

    // Allow deployed Vercel domain and any branch/preview deployments (*.vercel.app)
    const isVercelDomain = origin.endsWith(".vercel.app");
    const isAllowedOrigin = allowedOrigins.includes(origin);

    if (isAllowedOrigin || isVercelDomain || process.env.ALLOW_ALL_ORIGINS === "true") {
      return callback(null, true);
    }

    console.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

app.use(express.json({ limit: "2mb" }));

// ==========================================================
// 1. PING & HEALTH CHECK ENDPOINTS
// ==========================================================
app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    provider: (process.env.DB_PROVIDER || "mysql").trim().toLowerCase(),
    hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
    hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    nodeEnv: process.env.NODE_ENV || "development",
    isVercel: Boolean(process.env.VERCEL),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", async (req, res) => {
  const provider = (process.env.DB_PROVIDER || "").trim().toLowerCase() === "firestore" ? "firestore" : "mysql";
  try {
    let dbStatus;

    if (provider === "firestore") {
      const { checkFirestoreConnection } = await import("./firestoreDb.js");
      dbStatus = await checkFirestoreConnection();
    } else {
      dbStatus = await testConnection();
      dbStatus.provider = "mysql";
    }

    const isOk = dbStatus && dbStatus.connected;

    res.status(isOk ? 200 : 503).json({
      status: isOk ? "ok" : "degraded",
      server: "running",
      provider,
      uptime: Math.floor(process.uptime()),
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (healthErr) {
    console.error("Health check exception:", healthErr.message);
    res.status(503).json({
      status: "degraded",
      server: "running",
      provider,
      database: {
        connected: false,
        error: healthErr.code || "HEALTH_CHECK_ERROR",
        message: healthErr.message,
        provider
      },
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================================
// 2. VILLAGE SETTINGS ENDPOINTS
// ==========================================================

// GET /api/village-settings
app.get("/api/village-settings", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM village_settings WHERE id = 'current' LIMIT 1");
    if (rows.length === 0) {
      return res.status(404).json({ error: "Village settings not found." });
    }
    const row = rows[0];
    const villageName = row.village_name || "Gram Panchayat";
    const villageNameMr = row.village_name_mr || "";
    const sarpanchName = row.sarpanch_name || "Shri. Vitthalrao Deshmukh";
    const gramSevakName = row.gram_sevak_name || "Shri. Ramesh Patil";
    const secretaryName = row.secretary_name || "Smt. Sunita Kulkarni";
    const officeHours = row.office_hours || "Mon – Sat: 10:00 AM – 05:30 PM";
    const officeEmail = row.office_email || "grampanchayat@gov.in";
    const officeAddress = row.office_address || "Gram Panchayat Karyalaya, Main Chowk";
    const officePhone = row.office_phone || row.helpline || "02489-234567 / 1800-120-JAL";
    const introText = row.intro_text || "Welcome to the official Gram Panchayat digital administration portal.";
    const introTextMr = row.intro_text_mr || "ग्रामपंचायतीच्या अधिकृत ई-प्रशासन पोर्टलवर आपले सहर्ष स्वागत आहे.";

    res.json({
      id: row.id,
      village_name: villageName,
      villageName: villageName,
      village_name_mr: villageNameMr,
      villageNameMr: villageNameMr,
      district: row.district || "",
      taluka: row.taluka || "",
      state: row.state || "Maharashtra",
      sarpanch_name: sarpanchName,
      sarpanchName: sarpanchName,
      sarpanch_photo: row.sarpanch_photo || null,
      sarpanchPhoto: row.sarpanch_photo || null,
      gram_sevak_name: gramSevakName,
      gramSevakName: gramSevakName,
      gram_sevak_photo: row.gram_sevak_photo || null,
      gramSevakPhoto: row.gram_sevak_photo || null,
      secretary_name: secretaryName,
      secretaryName: secretaryName,
      secretary_photo: row.secretary_photo || null,
      secretaryPhoto: row.secretary_photo || null,
      office_phone: officePhone,
      officePhone: officePhone,
      helpline: officePhone,
      office_email: officeEmail,
      officeEmail: officeEmail,
      office_hours: officeHours,
      officeHours: officeHours,
      office_address: officeAddress,
      officeAddress: officeAddress,
      intro_text: introText,
      introText: introText,
      intro_text_mr: introTextMr,
      introTextMr: introTextMr,
      overall_status: row.overall_status || "Low",
      overallStatus: row.overall_status || "Low",
      drought_status: row.overall_status || "Low",
      notice_text: row.notice_text || "",
      noticeText: row.notice_text || "",
      alert_banner_text: row.notice_text || "",
      last_updated: row.last_updated || "Today at 08:30 AM",
      lastUpdated: row.last_updated || "Today at 08:30 AM",
      officer_name: row.officer_name || gramSevakName,
      officerName: row.officer_name || gramSevakName
    });
  } catch (err) {
    console.error("GET /api/village-settings error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});


// PUT /api/village-settings (Admin Protected)
app.put("/api/village-settings", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const [existing] = await query("SELECT * FROM village_settings WHERE id = 'current' LIMIT 1");
    const villageName = req.body.village_name || req.body.villageName || (existing ? existing.village_name : "Gram Panchayat");
    const villageNameMr = req.body.village_name_mr !== undefined ? req.body.village_name_mr : (req.body.villageNameMr !== undefined ? req.body.villageNameMr : (existing ? existing.village_name_mr : ""));
    const district = req.body.district !== undefined ? req.body.district : (existing ? existing.district : "");
    const taluka = req.body.taluka !== undefined ? req.body.taluka : (existing ? existing.taluka : "");
    const state = req.body.state !== undefined ? req.body.state : (existing ? existing.state : "Maharashtra");
    const sarpanchName = req.body.sarpanch_name || req.body.sarpanchName || (existing ? existing.sarpanch_name : "Shri. Vitthalrao Deshmukh");
    const sarpanchPhoto = req.body.sarpanch_photo !== undefined ? req.body.sarpanch_photo : (req.body.sarpanchPhoto !== undefined ? req.body.sarpanchPhoto : (existing ? existing.sarpanch_photo : null));
    const gramSevakName = req.body.gram_sevak_name || req.body.gramSevakName || (existing ? existing.gram_sevak_name : "Shri. Ramesh Patil");
    const gramSevakPhoto = req.body.gram_sevak_photo !== undefined ? req.body.gram_sevak_photo : (req.body.gramSevakPhoto !== undefined ? req.body.gramSevakPhoto : (existing ? existing.gram_sevak_photo : null));
    const secretaryName = req.body.secretary_name || req.body.secretaryName || (existing ? existing.secretary_name : "Smt. Sunita Kulkarni");
    const secretaryPhoto = req.body.secretary_photo !== undefined ? req.body.secretary_photo : (req.body.secretaryPhoto !== undefined ? req.body.secretaryPhoto : (existing ? existing.secretary_photo : null));
    const officeAddress = req.body.office_address || req.body.officeAddress || (existing ? existing.office_address : "Gram Panchayat Karyalaya, Main Chowk");
    const officeEmail = req.body.office_email || req.body.officeEmail || (existing ? existing.office_email : "grampanchayat@gov.in");
    const officeHours = req.body.office_hours || req.body.officeHours || (existing ? existing.office_hours : "Mon – Sat: 10:00 AM – 05:30 PM");
    const officePhone = req.body.office_phone || req.body.officePhone || req.body.helpline || (existing ? (existing.office_phone || existing.helpline) : "02489-234567 / 1800-120-JAL");
    const introText = req.body.intro_text || req.body.introText || (existing ? existing.intro_text : "Welcome to the official Gram Panchayat digital administration portal.");
    const introTextMr = req.body.intro_text_mr || req.body.introTextMr || (existing ? existing.intro_text_mr : "ग्रामपंचायतीच्या अधिकृत ई-प्रशासन पोर्टलवर आपले सहर्ष स्वागत आहे.");
    const overallStatus = req.body.overall_status || req.body.overallStatus || req.body.drought_status || (existing ? existing.overall_status : "Low");
    const noticeText = req.body.notice_text !== undefined ? req.body.notice_text : (req.body.noticeText !== undefined ? req.body.noticeText : (req.body.alert_banner_text !== undefined ? req.body.alert_banner_text : (existing ? existing.notice_text : "")));
    const lastUpdated = req.body.last_updated || req.body.lastUpdated || "Just now by Admin";
    const officerName = req.body.officer_name || req.body.officerName || gramSevakName;

    if (!villageName || villageName.trim() === "") {
      return res.status(400).json({ error: "Validation error", message: "villageName is required." });
    }

    const validStatuses = ["Normal", "Low", "Critical"];
    if (overallStatus && !validStatuses.includes(overallStatus)) {
      return res.status(400).json({
        error: "Validation error",
        message: `overallStatus must be one of: ${validStatuses.join(", ")}`
      });
    }

    await query(`
      INSERT INTO village_settings (
        id, village_name, village_name_mr, district, taluka, state,
        sarpanch_name, sarpanch_photo, gram_sevak_name, gram_sevak_photo,
        secretary_name, secretary_photo, office_address, office_email,
        office_hours, intro_text, intro_text_mr, overall_status, notice_text,
        last_updated, officer_name, helpline
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        village_name = VALUES(village_name),
        village_name_mr = VALUES(village_name_mr),
        district = VALUES(district),
        taluka = VALUES(taluka),
        state = VALUES(state),
        sarpanch_name = VALUES(sarpanch_name),
        sarpanch_photo = VALUES(sarpanch_photo),
        gram_sevak_name = VALUES(gram_sevak_name),
        gram_sevak_photo = VALUES(gram_sevak_photo),
        secretary_name = VALUES(secretary_name),
        secretary_photo = VALUES(secretary_photo),
        office_address = VALUES(office_address),
        office_email = VALUES(office_email),
        office_hours = VALUES(office_hours),
        intro_text = VALUES(intro_text),
        intro_text_mr = VALUES(intro_text_mr),
        overall_status = VALUES(overall_status),
        notice_text = VALUES(notice_text),
        last_updated = VALUES(last_updated),
        officer_name = VALUES(officer_name),
        helpline = VALUES(helpline)
    `, [
      "current",
      villageName.trim(),
      villageNameMr ? villageNameMr.trim() : null,
      district,
      taluka,
      state,
      sarpanchName,
      sarpanchPhoto,
      gramSevakName,
      gramSevakPhoto,
      secretaryName,
      secretaryPhoto,
      officeAddress,
      officeEmail,
      officeHours,
      introText,
      introTextMr,
      overallStatus,
      noticeText,
      lastUpdated,
      officerName,
      officePhone
    ]);

    res.json({
      message: "Village settings and official Gram Panchayat details updated successfully.",
      village_name: villageName,
      villageName,
      sarpanch_name: sarpanchName,
      sarpanchName,
      gram_sevak_name: gramSevakName,
      gramSevakName,
      secretary_name: secretaryName,
      secretaryName,
      office_phone: officePhone,
      office_hours: officeHours,
      office_email: officeEmail
    });
  } catch (err) {
    console.error("PUT /api/village-settings error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 2B. PUBLIC GRAM PANCHAYAT SERVICES CATALOG
// ==========================================================

// GET /api/services - Returns enabled services for public home page
app.get("/api/services", async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        id, service_key, title_en, title_mr, category, icon,
        badge_text_en, badge_text_mr, badge_type,
        desc_en, desc_mr, eligibility_en, eligibility_mr,
        required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
        button_label_en, button_label_mr, nav_target, nav_extra_attrs,
        display_order, is_enabled
      FROM gp_services 
      WHERE is_enabled = 1 
      ORDER BY display_order ASC, id ASC
    `);
    const services = rows.map(s => ({
      ...s,
      service_code: s.service_key,
      name_en: s.title_en,
      name_mr: s.title_mr,
      desc_en: s.desc_en,
      desc_mr: s.desc_mr,
      service_badge_text: s.badge_text_en,
      badge_text: s.badge_text_en,
      action_target: s.nav_target,
      is_active: true,
      eligibility_instructions: s.eligibility_en,
      required_documents: s.required_docs_en,
      contact_department: s.contact_info_en
    }));
    res.json({ success: true, count: services.length, services });
  } catch (err) {
    console.error("GET /api/services error:", err);
    res.status(500).json({ error: "Database error", message: "Unable to load services at this time." });
  }
});

// ==========================================================
// 3. WATER SOURCES ENDPOINTS
// ==========================================================

// GET /api/water-sources
app.get("/api/water-sources", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM water_sources ORDER BY id ASC");
    const sources = rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      typeLabel: r.type_label,
      location: r.location,
      totalCapacity: r.total_capacity,
      currentLevelPercent: r.current_level_percent,
      lastInspected: r.last_inspected,
      purityStatus: r.purity_status
    }));
    res.json(sources);
  } catch (err) {
    console.error("GET /api/water-sources error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// POST /api/water-sources (Admin Protected)
app.post("/api/water-sources", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { name, type, typeLabel, location, totalCapacity, currentLevelPercent, lastInspected, purityStatus } = req.body;

    if (!name || !type || totalCapacity === undefined) {
      return res.status(400).json({ error: "Validation error", message: "name, type, and totalCapacity are required." });
    }

    const id = req.body.id || "src-" + Date.now();
    const capacity = parseInt(totalCapacity, 10);
    const level = Math.min(100, Math.max(0, parseInt(currentLevelPercent || 0, 10)));

    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ error: "Validation error", message: "totalCapacity must be a positive integer." });
    }

    await query(`
      INSERT INTO water_sources (id, name, type, type_label, location, total_capacity, current_level_percent, last_inspected, purity_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name.trim(), type.trim(), typeLabel || type, location || "", capacity, level, lastInspected || "Recently", purityStatus || "Tested Safe"]);

    res.status(201).json({
      message: "Water source created successfully.",
      id,
      name,
      type,
      totalCapacity: capacity,
      currentLevelPercent: level
    });
  } catch (err) {
    console.error("POST /api/water-sources error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// PUT /api/water-sources/:id (Admin Protected)
app.put("/api/water-sources/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, currentLevelPercent, lastInspected, purityStatus, totalCapacity } = req.body;

    const existing = await query("SELECT * FROM water_sources WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Not Found", message: `Water source '${id}' not found.` });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (currentLevelPercent !== undefined) {
      const level = Math.min(100, Math.max(0, parseInt(currentLevelPercent, 10)));
      updates.push("current_level_percent = ?");
      params.push(level);
    }
    if (lastInspected !== undefined) {
      updates.push("last_inspected = ?");
      params.push(lastInspected);
    }
    if (purityStatus !== undefined) {
      updates.push("purity_status = ?");
      params.push(purityStatus);
    }
    if (totalCapacity !== undefined) {
      updates.push("total_capacity = ?");
      params.push(parseInt(totalCapacity, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Validation error", message: "No update fields provided." });
    }

    params.push(id);
    await query(`UPDATE water_sources SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ message: "Water source updated successfully.", id });
  } catch (err) {
    console.error("PUT /api/water-sources/:id error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// DELETE /api/water-sources/:id (Admin Protected)
app.delete("/api/water-sources/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM water_sources WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not Found", message: `Water source '${id}' not found.` });
    }
    res.json({ message: "Water source deleted successfully.", id });
  } catch (err) {
    console.error("DELETE /api/water-sources/:id error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 4. DISTRIBUTION SCHEDULES ENDPOINTS
// ==========================================================

// GET /api/distribution-schedules
app.get("/api/distribution-schedules", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM distribution_schedules ORDER BY date ASC, time_slot ASC");
    const schedules = rows.map(r => ({
      id: r.id,
      area: r.area,
      date: r.date ? r.date.toISOString().split("T")[0] : "",
      dateLabel: r.date_label,
      timeSlot: r.time_slot,
      duration: r.duration,
      supplyType: r.supply_type,
      status: r.status,
      lineman: r.lineman
    }));
    res.json(schedules);
  } catch (err) {
    console.error("GET /api/distribution-schedules error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// POST /api/distribution-schedules (Admin Protected)
app.post("/api/distribution-schedules", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { area, date, dateLabel, timeSlot, duration, supplyType, status, lineman } = req.body;

    if (!area || !timeSlot || !duration) {
      return res.status(400).json({
        error: "Validation error",
        message: "area, timeSlot, and duration are required."
      });
    }

    const id = req.body.id || "sch-" + Date.now();
    const schedDate = date || new Date().toISOString().split("T")[0];

    await query(`
      INSERT INTO distribution_schedules (id, area, date, date_label, time_slot, duration, supply_type, status, lineman)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, area.trim(), schedDate, dateLabel || "Scheduled", timeSlot.trim(), duration.trim(), supplyType || "Pipeline Tap", status || "Upcoming", lineman || "Panchayat Lineman"]);

    res.status(201).json({
      message: "Distribution schedule created successfully.",
      id,
      area,
      timeSlot,
      date: schedDate
    });
  } catch (err) {
    console.error("POST /api/distribution-schedules error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// PUT /api/distribution-schedules/:id (Admin Protected)
app.put("/api/distribution-schedules/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { area, date, dateLabel, timeSlot, duration, supplyType, status, lineman } = req.body;

    const existing = await query("SELECT * FROM distribution_schedules WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Not Found", message: `Schedule '${id}' not found.` });
    }

    const updates = [];
    const params = [];

    if (area !== undefined) { updates.push("area = ?"); params.push(area.trim()); }
    if (date !== undefined) { updates.push("date = ?"); params.push(date); }
    if (dateLabel !== undefined) { updates.push("date_label = ?"); params.push(dateLabel); }
    if (timeSlot !== undefined) { updates.push("time_slot = ?"); params.push(timeSlot.trim()); }
    if (duration !== undefined) { updates.push("duration = ?"); params.push(duration.trim()); }
    if (supplyType !== undefined) { updates.push("supply_type = ?"); params.push(supplyType); }
    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (lineman !== undefined) { updates.push("lineman = ?"); params.push(lineman); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Validation error", message: "No update fields provided." });
    }

    params.push(id);
    await query(`UPDATE distribution_schedules SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ message: "Schedule updated successfully.", id });
  } catch (err) {
    console.error("PUT /api/distribution-schedules/:id error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// DELETE /api/distribution-schedules/:id (Admin Protected)
app.delete("/api/distribution-schedules/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM distribution_schedules WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not Found", message: `Schedule '${id}' not found.` });
    }
    res.json({ message: "Schedule deleted successfully.", id });
  } catch (err) {
    console.error("DELETE /api/distribution-schedules/:id error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 5. COMMUNITY REPORTS ENDPOINTS
// ==========================================================

// GET /api/community-reports
app.get("/api/community-reports", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM community_reports ORDER BY created_at DESC");
    const reports = rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      area: r.area,
      problemType: r.problem_type,
      urgency: r.urgency,
      description: r.description,
      status: r.status,
      createdAt: r.created_at
    }));
    res.json(reports);
  } catch (err) {
    console.error("GET /api/community-reports error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// POST /api/community-reports
app.post("/api/community-reports", async (req, res) => {
  try {
    const { name, phone, area, problemType, urgency, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Validation error", message: "Name must be at least 2 characters." });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone.trim())) {
      return res.status(400).json({ error: "Validation error", message: "Valid 10-digit mobile number is required." });
    }

    if (!area || area.trim() === "") {
      return res.status(400).json({ error: "Validation error", message: "Area / Ward selection is required." });
    }

    if (!problemType || problemType.trim() === "") {
      return res.status(400).json({ error: "Validation error", message: "problemType is required." });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: "Validation error", message: "Description must be at least 10 characters." });
    }

    const validUrgencies = ["Normal", "High", "Critical"];
    const chosenUrgency = validUrgencies.includes(urgency) ? urgency : "Normal";

    const id = req.body.id || "cmp-" + Date.now();

    await query(`
      INSERT INTO community_reports (id, name, phone, area, problem_type, urgency, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name.trim(), phone.trim(), area.trim(), problemType.trim(), chosenUrgency, description.trim(), "Pending"]);

    res.status(201).json({
      message: "Complaint submitted successfully.",
      id,
      status: "Pending"
    });
  } catch (err) {
    console.error("POST /api/community-reports error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// PUT /api/community-reports/:id/status (Admin Protected)
app.put("/api/community-reports/:id/status", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Dispatched", "Resolved"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Validation error",
        message: `status must be one of: ${validStatuses.join(", ")}`
      });
    }

    const result = await query("UPDATE community_reports SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not Found", message: `Report '${id}' not found.` });
    }

    res.json({ message: "Complaint status updated successfully.", id, status });
  } catch (err) {
    console.error("PUT /api/community-reports/:id/status error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// DELETE /api/community-reports/:id (Admin Protected)
app.delete("/api/community-reports/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM community_reports WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not Found", message: `Report '${id}' not found.` });
    }
    res.json({ message: "Complaint deleted successfully.", id });
  } catch (err) {
    console.error("DELETE /api/community-reports/:id error:", err);
    res.status(500).json({ error: "Database error", message: err.message });
  }
});

// ==========================================================
// 6. DATABASE RESET / SEED ENDPOINT (Admin Protected)
// ==========================================================
app.post("/api/reset-data", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const result = await resetDatabaseToSample();
    res.json({ message: "Database reset to initial sample data.", result });
  } catch (err) {
    console.error("POST /api/reset-data error:", err);
    res.status(500).json({ error: "Database reset failed", message: err.message });
  }
});

// ==========================================================
// 7. AUTH, CITIZEN & ADMIN PORTAL API ROUTES
// ==========================================================
app.use("/api/auth", authRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", waterTankRoutes);
app.use("/api", panchayatRoutes);

// 404 handler for undefined API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not Found", message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Start Express Server (only when directly run from CLI, not when imported as serverless function)
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith("server.js") || 
  process.argv[1].endsWith("server")
);

if (isDirectExecution && !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 JalMitra Backend Server listening on http://localhost:${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/api/health`);

    // Attempt auto-seed and migrations if MySQL is ready
    try {
      await seedIfDatabaseEmpty();
      await runMigrations();
    } catch (e) {
      console.warn("Auto-seed/migration deferred:", e.message);
    }
  });
}

export default app;
