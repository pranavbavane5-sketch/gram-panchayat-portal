/**
 * Test Suite: Dynamic Admin Profile & Badge Display Settings
 * Validates Requirement 1 through 8
 */

import { query } from "./db.js";

const API_BASE = "http://localhost:5000/api";

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`✅ PASS: ${testName} ${details ? `(${details})` : ""}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("============================================================");
  console.log("🧪 TESTING DYNAMIC ADMIN PROFILE & BADGE PERSISTENCE");
  console.log("============================================================\n");

  // Step 1: Health Check
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === "ok", "API Health Check");

  // Step 2: Login as Admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: "admin", password: "Admin@123" })
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, "Admin Login HTTP 200");
  assert(loginData.user && loginData.user.loginId === "admin", "Login ID is 'admin'");
  assert(loginData.user.role === "admin", "System security role is 'admin'");
  assert(typeof loginData.user.roleTitle === "string" && loginData.user.roleTitle.length > 0, "Login returns dynamic roleTitle", loginData.user.roleTitle);
  assert(typeof loginData.user.fullName === "string" && loginData.user.fullName.length > 0, "Login returns dynamic fullName", loginData.user.fullName);

  const token = loginData.token;
  assert(Boolean(token), "JWT token returned");

  // Step 3: GET /auth/me returns dynamic profile
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, "GET /api/auth/me HTTP 200");
  assert(meData.user.roleTitle === loginData.user.roleTitle, "RoleTitle in /auth/me matches login data", meData.user.roleTitle);
  assert(meData.user.fullName === loginData.user.fullName, "FullName in /auth/me matches login data", meData.user.fullName);

  // Step 4: Update Profile via PUT /api/auth/profile
  const testNewName = "Shri. Rajesh Sharma";
  const testNewRole = "Gram Sevak";
  const testPhone = "9822998877";
  const testEmail = "gramsevak.sundarpur@gov.in";

  const updateRes = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      fullName: testNewName,
      roleTitle: testNewRole,
      phone: testPhone,
      email: testEmail
    })
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200, "PUT /api/auth/profile HTTP 200");
  assert(updateData.user.fullName === testNewName, "Updated user.fullName matches submitted name", updateData.user.fullName);
  assert(updateData.user.roleTitle === testNewRole, "Updated user.roleTitle matches submitted title", updateData.user.roleTitle);
  assert(updateData.user.loginId === "admin", "Login ID remains 'admin' (never confused with display name)");
  assert(updateData.user.role === "admin", "System role remains 'admin' (privileges intact)");

  const newToken = updateData.token;
  assert(Boolean(newToken), "New JWT token issued with updated claims");

  // Step 5: Verify Persistence directly in MySQL Database
  const [dbUser] = await query("SELECT id, login_id, role, role_title, full_name, phone, email FROM users WHERE login_id = 'admin'");
  assert(Boolean(dbUser), "Queried MySQL users table directly");
  assert(dbUser.full_name === testNewName, "MySQL users.full_name persisted correctly", dbUser.full_name);
  assert(dbUser.role_title === testNewRole, "MySQL users.role_title persisted correctly", dbUser.role_title);
  assert(dbUser.login_id === "admin", "MySQL users.login_id remained intact", dbUser.login_id);
  assert(dbUser.role === "admin", "MySQL users.role remained 'admin'", dbUser.role);
  assert(dbUser.phone === testPhone, "MySQL users.phone persisted correctly", dbUser.phone);
  assert(dbUser.email === testEmail, "MySQL users.email persisted correctly", dbUser.email);

  // Step 6: Verify GET /api/admin/profile returns updated MySQL data
  const admProfRes = await fetch(`${API_BASE}/admin/profile`, {
    headers: { Authorization: `Bearer ${newToken}` }
  });
  const admProfData = await admProfRes.json();
  assert(admProfRes.status === 200, "GET /api/admin/profile HTTP 200");
  assert(admProfData.profile.fullName === testNewName, "Admin profile endpoint returns updated display name", admProfData.profile.fullName);
  assert(admProfData.profile.roleTitle === testNewRole, "Admin profile endpoint returns updated role title", admProfData.profile.roleTitle);

  // Step 7: Subsequent Login retains updated display name and role title from MySQL
  const reLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: "admin", password: "Admin@123" })
  });
  const reLoginData = await reLoginRes.json();
  assert(reLoginRes.status === 200, "Re-login HTTP 200");
  assert(reLoginData.user.fullName === testNewName, "Re-login returns persisted fullName", reLoginData.user.fullName);
  assert(reLoginData.user.roleTitle === testNewRole, "Re-login returns persisted roleTitle", reLoginData.user.roleTitle);

  // Step 8: Validation Check - Empty display name rejected
  const invalidRes = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${newToken}`
    },
    body: JSON.stringify({ fullName: "   " })
  });
  assert(invalidRes.status === 400, "Empty display name rejected with HTTP 400");

  console.log("\n============================================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
