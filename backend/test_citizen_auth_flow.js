/**
 * JalMitra - Comprehensive Citizen Auth & Registration Flow Verification
 * Dual Driver: MySQL & Firestore
 */

import http from "http";
import bcrypt from "bcryptjs";
import app from "./server.js";
import { userRepo } from "./repositories/userRepo.js";
import { citizenRepo } from "./repositories/citizenRepo.js";

const TEST_PORT = 5099;

// Helper to make local HTTP requests to Express app
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "localhost",
        port: TEST_PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${msg}`);
    failed++;
  }
}

async function runAuthTestsForDriver(providerName) {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING CITIZEN AUTH FLOW WITH DB_PROVIDER: ${providerName.toUpperCase()}`);
  console.log(`======================================================`);
  process.env.DB_PROVIDER = providerName;

  // 1. Test Admin Login
  console.log(`\n[Test 1] Panchayat Staff Admin Login:`);
  const adminRes = await makeRequest("POST", "/api/auth/login", {
    loginId: "admin",
    password: "Admin@123"
  });
  assert(adminRes.status === 200, `Admin login returns 200 (got ${adminRes.status})`);
  assert(adminRes.data.token && adminRes.data.user?.role === "admin", `Admin returns JWT and role='admin'`);

  // 2. Test Existing Citizen Login (Exact, Lowercase, and Phone)
  console.log(`\n[Test 2] Existing Citizen Login (CIT-101):`);
  const citExact = await makeRequest("POST", "/api/auth/login", {
    loginId: "CIT-101",
    password: "Citizen@123"
  });
  assert(citExact.status === 200, `Exact 'CIT-101' login returns 200 (got ${citExact.status})`);
  assert(citExact.data.token && citExact.data.user?.role === "citizen", `Returns JWT token and citizen role`);

  const citLower = await makeRequest("POST", "/api/auth/login", {
    loginId: "cit-101",
    password: "Citizen@123"
  });
  assert(citLower.status === 200, `Lowercase 'cit-101' login returns 200 (case-insensitive)`);

  const citSpaces = await makeRequest("POST", "/api/auth/login", {
    loginId: "  CIT-101  ",
    password: "Citizen@123"
  });
  assert(citSpaces.status === 200, `Padded '  CIT-101  ' login returns 200 (trimmed)`);

  // 3. Test Invalid Credentials
  console.log(`\n[Test 3] Password Verification & Rejection:`);
  const wrongPwd = await makeRequest("POST", "/api/auth/login", {
    loginId: "CIT-101",
    password: "WrongPassword!99"
  });
  assert(wrongPwd.status === 401, `Wrong password returns 401 (got ${wrongPwd.status})`);
  assert(wrongPwd.data.message === "Invalid login credentials.", `Sanitized error message returned`);

  const wrongUser = await makeRequest("POST", "/api/auth/login", {
    loginId: "NON_EXISTENT_CIT_9999",
    password: "SomePassword123"
  });
  assert(wrongUser.status === 401, `Non-existent user returns 401 (got ${wrongUser.status})`);

  // 4. Test New Citizen Registration Flow
  console.log(`\n[Test 4] New Citizen Registration Flow:`);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPhone = `98${randomSuffix}${randomSuffix.toString().slice(0, 4)}`; // 10 digit
  const testPassword = "SafePass@2026";
  const testName = `Ramesh Patil ${randomSuffix}`;
  const testProp = `H-${randomSuffix}`;

  const regRes = await makeRequest("POST", "/api/auth/register-citizen", {
    fullName: testName,
    phone: testPhone,
    propertyNo: testProp,
    wardArea: "Ward 2 - Temple Chowk & Main Bazar",
    password: testPassword
  });

  assert(regRes.status === 201, `Registration returns 201 Created (got ${regRes.status})`);
  assert(regRes.data.success === true, `Registration success is true`);
  const generatedId = regRes.data.loginId || regRes.data.citizenId;
  assert(Boolean(generatedId && generatedId.startsWith("CIT-")), `Generated ID starts with 'CIT-': ${generatedId}`);
  assert(regRes.data.phone === testPhone, `Phone matches registration: ${regRes.data.phone}`);

  // 5. Test Duplicate Phone Registration Conflict
  console.log(`\n[Test 5] Duplicate Mobile Number Conflict Prevention:`);
  const dupRes = await makeRequest("POST", "/api/auth/register-citizen", {
    fullName: "Duplicate Resident",
    phone: testPhone,
    propertyNo: "H-999",
    wardArea: "Ward 1",
    password: "AnotherPassword123"
  });
  assert(dupRes.status === 409, `Duplicate phone returns 409 Conflict (got ${dupRes.status})`);

  // 6. Test Newly Registered Citizen Login (CIT-xxx, cit-xxx, Phone)
  console.log(`\n[Test 6] Newly Registered Citizen Login Verification:`);
  
  // Exact CIT-xxx
  const newCitExact = await makeRequest("POST", "/api/auth/login", {
    loginId: generatedId,
    password: testPassword
  });
  assert(newCitExact.status === 200, `New citizen logs in with exact ID '${generatedId}'`);
  assert(Boolean(newCitExact.data.token), `Token issued for new citizen`);
  assert(newCitExact.data.user?.fullName === testName, `User profile matches registered name`);
  assert(newCitExact.data.user?.role === "citizen", `User role is 'citizen'`);

  // Lowercase cit-xxx
  const newCitLower = await makeRequest("POST", "/api/auth/login", {
    loginId: generatedId.toLowerCase(),
    password: testPassword
  });
  assert(newCitLower.status === 200, `New citizen logs in with lowercase '${generatedId.toLowerCase()}'`);

  // Phone number
  const newCitPhone = await makeRequest("POST", "/api/auth/login", {
    loginId: testPhone,
    password: testPassword
  });
  assert(newCitPhone.status === 200, `New citizen logs in with 10-digit phone '${testPhone}'`);

  // 7. Test /api/auth/me Profile Lookup with Issued Token
  console.log(`\n[Test 7] Authenticated Profile /api/auth/me Lookup:`);
  const meRes = await makeRequest("GET", "/api/auth/me", null, newCitExact.data.token);
  assert(meRes.status === 200, `/api/auth/me returns 200 for new citizen`);
  assert(meRes.data.user?.loginId === generatedId, `/me user loginId matches generatedId`);
  assert(meRes.data.user?.citizenId === generatedId, `/me user citizenId matches generatedId`);
  assert(meRes.data.user?.citizenProfile?.id === generatedId, `/me loads linked citizen profile`);

  // 8. Test /api/auth/change-password
  console.log(`\n[Test 8] Change Password Flow:`);
  const updatedPassword = "NewPass@2026!";
  const chgPwdRes = await makeRequest(
    "PUT",
    "/api/auth/change-password",
    { oldPassword: testPassword, newPassword: updatedPassword },
    newCitExact.data.token
  );
  assert(chgPwdRes.status === 200, `Change password returns 200`);

  // Verify login with new password
  const newPwdLogin = await makeRequest("POST", "/api/auth/login", {
    loginId: generatedId,
    password: updatedPassword
  });
  assert(newPwdLogin.status === 200, `Login with updated password succeeds`);

  // Verify old password fails
  const oldPwdLogin = await makeRequest("POST", "/api/auth/login", {
    loginId: generatedId,
    password: testPassword
  });
  assert(oldPwdLogin.status === 401, `Login with old password now rejected (401)`);
}

async function run() {
  const server = app.listen(TEST_PORT, async () => {
    try {
      // Run MySQL
      await runAuthTestsForDriver("mysql");

      // Run Firestore
      await runAuthTestsForDriver("firestore");

      console.log(`\n======================================================`);
      console.log(`FINAL RESULTS:`);
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${failed}`);
      console.log(`======================================================`);

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error("Test execution error:", err);
      server.close(() => process.exit(1));
    }
  });
}

run();
