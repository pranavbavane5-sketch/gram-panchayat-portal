/**
 * JalMitra - Authentication Routes
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { generateToken, authenticateToken } from "../auth.js";
import { userRepo } from "../repositories/userRepo.js";
import { citizenRepo } from "../repositories/citizenRepo.js";
import { propertyRepo } from "../repositories/propertyRepo.js";
import { billingRepo } from "../repositories/billingRepo.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { loginId, username, password } = req.body;
    const identifier = String(loginId || username || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({
        error: "Validation error",
        message: "Login ID and password are required."
      });
    }

    // Lookup user by login_id, citizen_id, phone, email, or id (case-insensitive & trimmed)
    const user = await userRepo.findByLoginOrPhone(identifier);
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid login credentials."
      });
    }

    // Explicit check on account suspension: default to active (1) if undefined
    const isActive = user.is_active !== undefined ? Boolean(Number(user.is_active)) : true;
    if (!isActive) {
      return res.status(403).json({
        error: "Account suspended",
        message: "Your account is deactivated. Please contact the Gram Panchayat administrator."
      });
    }

    // Verify password hash with bcrypt
    if (!user.password_hash) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid login credentials."
      });
    }

    const match = await bcrypt.compare(String(password), String(user.password_hash));
    if (!match) {
      return res.status(401).json({
        error: "Authentication failed",
        message: "Invalid login credentials."
      });
    }

    // If citizen, load citizen profile details
    let citizenData = null;
    const citIdToLook = user.citizen_id || user.login_id;
    if (citIdToLook) {
      citizenData = await citizenRepo.getById(citIdToLook);
    }
    if (!citizenData && user.id) {
      citizenData = await citizenRepo.getById(user.id);
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
        citizenId: user.citizen_id || (citizenData ? citizenData.id : null),
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
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }

    let citizenData = null;
    const citId = user.citizen_id || (user.role === "citizen" ? user.login_id : null);
    if (citId) {
      citizenData = await citizenRepo.getById(citId);
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
        citizenId: user.citizen_id || (citizenData ? citizenData.id : null),
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
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }

    let citizenProfile = null;
    const citId = user.citizen_id || (user.role === "citizen" ? user.login_id : null);
    if (citId) {
      citizenProfile = await citizenRepo.getById(citId);
    }

    res.json({
      profile: {
        id: user.id,
        loginId: user.login_id,
        role: user.role,
        roleTitle: user.role_title || (user.role === "admin" ? "Administrator" : "Citizen"),
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        citizenId: user.citizen_id || (citizenProfile ? citizenProfile.id : null),
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

    const userRecord = await userRepo.findById(userId);
    if (!userRecord) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }

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

    // Persist changes securely via repository - NEVER modify login_id or role (system permission)
    const updatedUser = await userRepo.updateProfile(userRecord.id, {
      fullName: newFullName,
      roleTitle: newRoleTitle,
      phone: newPhone,
      email: newEmail
    });

    // If citizen account, keep citizens table in sync
    if (userRecord.citizen_id) {
      try {
        await citizenRepo.update(userRecord.citizen_id, {
          full_name: newFullName,
          phone: newPhone,
          email: newEmail
        });
      } catch (cErr) {
        console.warn("Citizen sync note:", cErr.message);
      }
    }

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

    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Not found", message: "User not found." });
    }

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({
        error: "Verification failed",
        message: "Current password does not match."
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepo.updatePassword(user.id, newHash);

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

    // Check if phone already registered in users table
    const existingUser = await userRepo.findByLoginOrPhone(phone);
    if (existingUser) {
      return res.status(409).json({
        error: "Conflict",
        message: `An account with mobile number '${phone}' is already registered. Please sign in or use another number.`
      });
    }

    // Guarantee unique sequential CIT-xxx ID across all existing citizens and users
    const allCitizens = await citizenRepo.getAll();
    const existingIds = new Set(allCitizens.map(c => String(c.id).toUpperCase()));
    try {
      const allUsers = await query("SELECT login_id, citizen_id FROM users");
      (allUsers || []).forEach(u => {
        if (u.login_id) existingIds.add(String(u.login_id).toUpperCase());
        if (u.citizen_id) existingIds.add(String(u.citizen_id).toUpperCase());
      });
    } catch {
      // Ignore if user query differs
    }

    let nextSeq = 101;
    allCitizens.forEach(c => {
      const m = String(c.id).match(/^CIT-(\d+)$/i);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val >= nextSeq) nextSeq = val + 1;
      }
    });

    let citizenId = `CIT-${nextSeq}`;
    while (existingIds.has(citizenId)) {
      nextSeq++;
      citizenId = `CIT-${nextSeq}`;
    }

    const userId = `usr-cit-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);

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
      meter_no: `MET-${nextSeq}`,
      connection_type: "Domestic Metered Tap",
      status: "Active",
      property_id: propertyId
    });

    // 2. Insert User Login (Dual driver repository with bcrypt hash & active citizen role)
    const newUser = await userRepo.create({
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

    // 3. Create initial introductory water bill for the citizen
    const billId = `BILL-${Date.now().toString().slice(-6)}`;
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0];
    try {
      await billingRepo.createBill({
        id: billId,
        citizen_id: citizenId,
        property_id: propertyId || null,
        billing_period: "Current Month (New Connection)",
        amount: 100.00,
        paid_amount: 0.00,
        due_date: dueDate,
        status: "Unpaid"
      });
    } catch (bErr) {
      console.warn("Initial bill creation note:", bErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Citizen account registered successfully.",
      loginId: citizenId,
      citizenId,
      fullName,
      phone,
      user: {
        id: userId,
        loginId: citizenId,
        citizenId,
        fullName,
        phone,
        role: "citizen"
      },
      citizen: newCitizen
    });
  } catch (err) {
    console.error("Register citizen error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
