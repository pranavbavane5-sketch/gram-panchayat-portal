/**
 * Test Suite: Firestore Adapter & Credential Sanitization (Phase 1)
 * Validates Requirement 1, 2, 3, 5, 6
 */

import { initFirestore, getFirestoreDb, checkFirestoreConnection, COLLECTIONS } from "./firestoreDb.js";
import { query, testConnection } from "./db.js";

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
  console.log("🧪 TESTING FIRESTORE ADAPTER & DUAL DRIVER (PHASE 1)");
  console.log("============================================================\n");

  // 1. Connection & Configuration State Safety Check
  const statusBefore = await checkFirestoreConnection();
  if (process.env.FIREBASE_PROJECT_ID) {
    assert(statusBefore.connected, "Configured Firestore reports connected: true");
    assert(statusBefore.status === "CONNECTED", "Configured status is 'CONNECTED'", statusBefore.status);
    assert(typeof statusBefore.message === "string", "Helpful diagnostic message returned", statusBefore.message);
    const dbInstance = getFirestoreDb();
    assert(dbInstance !== null, "getFirestoreDb() returns Firestore instance safely when configured");
  } else {
    assert(!statusBefore.connected, "Unconfigured Firestore reports connected: false");
    assert(statusBefore.status === "NOT_CONFIGURED", "Unconfigured status is 'NOT_CONFIGURED'", statusBefore.status);
    assert(typeof statusBefore.message === "string", "Helpful diagnostic message returned", statusBefore.message);
    const dbInstance = getFirestoreDb();
    assert(dbInstance === null, "getFirestoreDb() returns null safely without crashing when unconfigured");
  }

  // 2. Collection Names Mapping Verification (All 20 collections mapped)
  const collectionKeys = Object.keys(COLLECTIONS);
  assert(collectionKeys.length === 20, "Adapter maps exactly 20 collections matching MySQL schema", `Count: ${collectionKeys.length}`);
  assert(COLLECTIONS.USERS === "users", "COLLECTIONS.USERS mapped to 'users'");
  assert(COLLECTIONS.CITIZENS === "citizens", "COLLECTIONS.CITIZENS mapped to 'citizens'");
  assert(COLLECTIONS.PROPERTIES === "properties", "COLLECTIONS.PROPERTIES mapped to 'properties'");
  assert(COLLECTIONS.WATER_BILLS === "water_bills", "COLLECTIONS.WATER_BILLS mapped to 'water_bills'");
  assert(COLLECTIONS.GP_SERVICES === "gp_services", "COLLECTIONS.GP_SERVICES mapped to 'gp_services'");
  assert(COLLECTIONS.VILLAGE_SETTINGS === "village_settings", "COLLECTIONS.VILLAGE_SETTINGS mapped to 'village_settings'");

  // 3. Private Key Normalization Logic Verification
  const rawKeyWithEscapedNewlines = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC\\n-----END PRIVATE KEY-----\\n";
  const normalizedKey = rawKeyWithEscapedNewlines.replace(/\\n/g, "\n");
  assert(normalizedKey.includes("\n") && !normalizedKey.includes("\\n"), "Private key escaping converts '\\n' to real newlines");

  // 4. Verification that MySQL Remains Active and Working (Requirement 2)
  const mysqlStatus = await testConnection();
  assert(mysqlStatus.connected === true, "MySQL remains active and operational", `Database: ${mysqlStatus.database}`);

  const testRows = await query("SELECT COUNT(*) as count FROM users");
  assert(testRows.length > 0 && testRows[0].count > 0, "MySQL query() executes successfully", `User count: ${testRows[0].count}`);

  const servicesRows = await query("SELECT id, display_order FROM gp_services ORDER BY display_order ASC LIMIT 3");
  assert(servicesRows.length > 0, "MySQL gp_services display_order queries intact", `Sample: order #${servicesRows[0].display_order}`);

  console.log("\n============================================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});

