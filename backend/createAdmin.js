/**
 * JalMitra - Administrative CLI User Setup Script
 * Usage:
 *   node createAdmin.js <username> <password> [fullName] [phone] [email]
 * Example:
 *   node createAdmin.js admin Admin@2026 "Ramesh Patil" "9822114455" "gramsevak@sundarpur.gov.in"
 */

import bcrypt from "bcryptjs";
import pool, { query } from "./db.js";

async function main() {
  const args = process.argv.slice(2);
  const username = args[0] || "admin";
  const password = args[1] || "Admin@123";
  const fullName = args[2] || "Ramesh Patil (Gram Sevak)";
  const phone = args[3] || "9822114455";
  const email = args[4] || "gramsevak@sundarpur.gov.in";

  if (!username || !password) {
    console.error("❌ Usage: node createAdmin.js <username> <password> [fullName] [phone] [email]");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Password must be at least 6 characters long.");
    process.exit(1);
  }

  console.log(`🔐 Creating/Updating Admin account for '${username}'...`);
  const hash = await bcrypt.hash(password, 10);
  const adminId = "usr-admin-" + username.toLowerCase().replace(/[^a-z0-9]/g, "");

  await query(`
    INSERT INTO users (id, login_id, password_hash, role, full_name, phone, email, is_active)
    VALUES (?, ?, ?, 'admin', ?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      role = 'admin',
      full_name = VALUES(full_name),
      phone = VALUES(phone),
      email = VALUES(email),
      is_active = 1
  `, [adminId, username.trim(), hash, fullName.trim(), phone.trim(), email.trim()]);

  console.log(`✅ Admin account '${username}' is configured and active.`);
  await pool.end();
}

main().catch(err => {
  console.error("❌ Error setting up admin:", err);
  process.exit(1);
});
