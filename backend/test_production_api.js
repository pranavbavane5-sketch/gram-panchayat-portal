/**
 * Production & Staging Verification Script for Gram Panchayat Portal API
 * Usage: node backend/test_production_api.js [API_BASE_URL]
 * Example: node backend/test_production_api.js https://gram-panchayat-portal-sandy.vercel.app/api
 */

const targetUrl = process.argv[2] || process.env.TARGET_API_URL || "http://localhost:5000/api";

console.log("============================================================");
console.log(`🧪 TESTING API HEALTH & AUTHENTICATION`);
console.log(`🎯 Target API: ${targetUrl}`);
console.log("============================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`✅ PASS: ${name} ${details ? `(${details})` : ""}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

async function runProductionTests() {
  // 1. Health Endpoint
  let healthOk = false;
  try {
    const res = await fetch(`${targetUrl}/health`);
    const data = await res.json();
    healthOk = res.status === 200 && data.status === "ok";
    assert(
      res.status === 200 || res.status === 503,
      `API Health Check responded (HTTP ${res.status})`,
      `Server: ${data.server || 'unknown'}, Database connected: ${data.database?.connected}`
    );
    if (!data.database?.connected) {
      console.warn(`⚠️ Warning: Database is not connected to API: ${data.database?.message || 'Check DB credentials'}`);
    }
  } catch (err) {
    assert(false, "API Health Check reachable", err.message);
  }

  // 2. Admin Login
  let adminToken = null;
  try {
    const res = await fetch(`${targetUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "admin", password: "Admin@123" })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(
      res.status === 200 && Boolean(adminToken) && data.user?.role === "admin",
      "Admin Login authentication",
      `Role: ${data.user?.role}, Name: ${data.user?.fullName}`
    );
  } catch (err) {
    assert(false, "Admin Login authentication failed", err.message);
  }

  // 3. Citizen Login
  try {
    const res = await fetch(`${targetUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "CIT-101", password: "Citizen@123" })
    });
    const data = await res.json();
    assert(
      res.status === 200 && Boolean(data.token) && data.user?.role === "citizen",
      "Citizen Login authentication",
      `Citizen: ${data.user?.fullName} (${data.user?.id})`
    );
  } catch (err) {
    assert(false, "Citizen Login authentication failed", err.message);
  }

  // 4. Public Services
  try {
    const res = await fetch(`${targetUrl}/services`);
    const data = await res.json();
    assert(
      res.status === 200 && data.success && Array.isArray(data.services),
      "Public Services Catalog endpoint",
      `Services count: ${data.count || data.services?.length}`
    );
  } catch (err) {
    assert(false, "Public Services Catalog endpoint failed", err.message);
  }

  // 5. Admin Protected Route
  if (adminToken) {
    try {
      const res = await fetch(`${targetUrl}/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.citizens?.total !== undefined,
        "Admin Protected Dashboard Statistics",
        `Citizens: ${data.citizens?.total || 0}, Sources: ${data.sources?.total || 0}`
      );
    } catch (err) {
      assert(false, "Admin Protected Dashboard Statistics failed", err.message);
    }
  }

  console.log("\n============================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
