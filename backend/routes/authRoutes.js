/**
 * JalMitra - Authentication Routes
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { generateToken, authenticateToken } from "../auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { loginId, username, password } = req.body;
    const identifier = (loginId || username || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Login ID and password are required."
      });
    }

    // Lookup user by login_id or phone
    const users = await query("SELECT * FROM users WHERE login_id = ? OR phone = ? LIMIT 1", [identifier, identifier]);
    if (users.length === 0) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid login credentials."
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        error: "Account suspended",
        message: "Your account is deactivated. Please contact the Gram Panchayat administrator."
      });
    }

    // Verify password hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid login credentials."
      });
    }

    // If citizen, fetch citizen record details
    let citizenData = null;
    if (user.citizen_id) {
      const citizens = await query("SELECT * FROM citizens WHERE id = ? LIMIT 1", [user.citizen_id]);
      if (citizens.length > 0) citizenData = citizens[0];
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        loginId: user.login_id,
        role: user.role,
        roleTitle: user.role_title || (user.role === "admin" ? "Administrator" : "Citizen"),
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        citizenId: user.citizen_id || null,
        citizenProfile: citizenData
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET /api/auth/me (Get current authenticated user)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const users = await query(
      "SELECT id, login_id, role, role_title, full_name, phone, email, is_active, citizen_id, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }

    const user = users[0];
    let citizenData = null;
    if (user.citizen_id) {
      const citizens = await query("SELECT * FROM citizens WHERE id = ?", [user.citizen_id]);
      if (citizens.length > 0) citizenData = citizens[0];
    }

    res.json({
      user: {
        id: user.id,
        loginId: user.login_id,
        role: user.role,
        roleTitle: user.role_title || (user.role === "admin" ? "Administrator" : "Citizen"),
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        citizenId: user.citizen_id || null,
        citizenProfile: citizenData
      }
    });
  } catch (err) {
    console.error("Auth /me error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET /api/auth/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const users = await query(
      "SELECT id, login_id, role, role_title, full_name, phone, email, is_active, citizen_id, created_at FROM users WHERE id = ? OR login_id = ? LIMIT 1",
      [req.user.id, req.user.loginId || req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }
    const user = users[0];
    res.json({
      profile: {
        id: user.id,
        loginId: user.login_id,
        role: user.role,
        roleTitle: user.role_title || (user.role === "admin" ? "Administrator" : "Citizen"),
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        citizenId: user.citizen_id || null,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// PUT /api/auth/profile (Update display name, role title, phone, email for authenticated user)
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, roleTitle, phone, email } = req.body;

    const users = await query("SELECT * FROM users WHERE id = ? OR login_id = ? LIMIT 1", [userId, req.user.loginId || userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }
    const userRecord = users[0];

    const newFullName = fullName !== undefined ? String(fullName).trim() : userRecord.full_name;
    const newRoleTitle = roleTitle !== undefined ? String(roleTitle).trim() : (userRecord.role_title || (userRecord.role === "admin" ? "Administrator" : "Citizen"));
    const newPhone = phone !== undefined ? String(phone).trim() : userRecord.phone;
    const newEmail = email !== undefined ? String(email).trim() : userRecord.email;

    if (!newFullName) {
      return res.status(400).json({
        error: "Validation error",
        message: "Display name cannot be empty."
      });
    }

    // Persist changes to MySQL securely - NEVER modify login_id or role (system permission)
    await query(
      "UPDATE users SET full_name = ?, role_title = ?, phone = ?, email = ? WHERE id = ?",
      [newFullName, newRoleTitle, newPhone, newEmail, userRecord.id]
    );

    // If citizen account, keep citizens table in sync
    if (userRecord.citizen_id) {
      await query(
        "UPDATE citizens SET full_name = ?, phone = ?, email = ? WHERE id = ?",
        [newFullName, newPhone, newEmail, userRecord.citizen_id]
      );
    }

    // Fetch refreshed user record
    const [updatedUser] = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [userRecord.id]);

    // Issue refreshed token with updated claims
    const token = generateToken(updatedUser);

    res.json({
      message: "Profile updated successfully.",
      token,
      user: {
        id: updatedUser.id,
        loginId: updatedUser.login_id,
        role: updatedUser.role,
        roleTitle: updatedUser.role_title || (updatedUser.role === "admin" ? "Administrator" : "Citizen"),
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        citizenId: updatedUser.citizen_id || null
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// PUT /api/auth/change-password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "Validation error",
        message: "New password must be at least 6 characters long."
      });
    }

    const users = await query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }

    const user = users[0];
    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({
        error: "Verification failed",
        message: "Current password does not match."
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id]);

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/auth/register-citizen (Self-registration)
router.post("/register-citizen", async (req, res) => {
  try {
    const fullName = (req.body.fullName || req.body.full_name || req.body.name || "").trim();
    const phone = (req.body.phone || req.body.mobile || req.body.phoneNumber || "").trim();
    const propertyNo = (req.body.propertyNo || req.body.property_no || req.body.propertyNumber || "").trim();
    const wardArea = (req.body.wardArea || req.body.ward || req.body.ward_area || "").trim();
    const password = req.body.password || req.body.initialPassword || "";
    const email = (req.body.email || "").trim();
    const familyMembers = parseInt(req.body.familyMembers || req.body.family_members || 4, 10);

    if (!fullName || !phone || !propertyNo || !wardArea || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Name, phone, property number, ward/area, and password are required."
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Validation error", message: "A valid 10-digit mobile number is required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Validation error", message: "Password must be at least 6 characters." });
    }

    // Check if phone or property already exists
    const existing = await query("SELECT id FROM users WHERE phone = ?", [phone]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Conflict", message: "An account with this mobile number already exists." });
    }

    // Generate unique citizen ID
    const countRow = await query("SELECT COUNT(*) as count FROM citizens");
    const nextSeq = countRow[0].count + 101;
    const citizenId = `CIT-${nextSeq}`;
    const userId = `usr-cit-${Date.now()}`;

    const passwordHash = await bcrypt.hash(password, 10);

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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Domestic Metered Tap', 'Active', ?)
    `, [citizenId, userId, fullName, phone, email, propertyNo, wardArea, familyMembers, `MET-${nextSeq}`, propertyId]);

    // 2. Insert User Login
    await query(`
      INSERT INTO users (id, login_id, password_hash, role, full_name, phone, email, is_active, citizen_id)
      VALUES (?, ?, ?, 'citizen', ?, ?, ?, 1, ?)
    `, [userId, citizenId, passwordHash, fullName, phone, email, citizenId]);

    // 3. Create initial introductory water bill for the citizen
    const billId = `BILL-${Date.now().toString().slice(-6)}`;
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    await query(`
      INSERT INTO water_bills (id, citizen_id, property_id, billing_period, amount, paid_amount, due_date, status)
      VALUES (?, ?, ?, 'Current Month (New Connection)', 100.00, 0.00, ?, 'Unpaid')
    `, [billId, citizenId, propertyId, dueDate]);

    res.status(201).json({
      message: "Citizen account registered successfully.",
      loginId: citizenId,
      citizenId,
      fullName,
      citizen: {
        citizenId,
        loginId: citizenId,
        fullName,
        phone,
        propertyNo,
        wardArea
      }
    });
  } catch (err) {
    console.error("Register citizen error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
