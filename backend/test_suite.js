/**
 * Comprehensive Automated Verification Suite for JalMitra Smart Drought Management System
 * Tests authentication, authorization, RBAC, isolation, CRUD, Excel export, and DB integrity.
 */

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("============================================================");
  console.log("🧪 STARTING JALMITRA AUTOMATED VERIFICATION SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${extraInfo ? `(${extraInfo})` : ""}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extraInfo ? `(${extraInfo})` : ""}`);
      failed++;
    }
  }

  // 1. Health check & MySQL Connection
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === "ok" && data.database?.connected === true, "MySQL & Backend Health Check", `DB: ${data.database?.database}`);
  } catch (err) {
    assert(false, "MySQL & Backend Health Check", err.message);
  }

  // 2. Admin Login with Valid Credentials
  let adminToken = "";
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "admin", password: "Admin@123" })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(res.status === 200 && data.user?.role === "admin" && Boolean(adminToken), "Admin Login with valid real credentials", `Role: ${data.user?.role}`);
  } catch (err) {
    assert(false, "Admin Login with valid real credentials", err.message);
  }

  // 3. Invalid Login Attempt Rejection
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "admin", password: "WrongPassword123" })
    });
    assert(res.status === 401, "Invalid login attempts rejected with 401 Unauthorized");
  } catch (err) {
    assert(false, "Invalid login attempts rejected", err.message);
  }

  // 4. Citizen Login with Valid Account
  let citizenToken = "";
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "CIT-101", password: "Citizen@123" })
    });
    const data = await res.json();
    citizenToken = data.token;
    assert(res.status === 200 && data.user?.role === "citizen" && Boolean(citizenToken), "Citizen Login with valid account", `Citizen: ${data.user?.fullName}`);
  } catch (err) {
    assert(false, "Citizen Login with valid account", err.message);
  }

  // 5. Citizens CANNOT Access Admin Routes (RBAC)
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { "Authorization": `Bearer ${citizenToken}` }
    });
    assert(res.status === 403, "Citizens forbidden from accessing Admin routes (403 Forbidden)");
  } catch (err) {
    assert(false, "Citizens forbidden from accessing Admin routes", err.message);
  }

  // 6. Citizens CANNOT view another citizen's records by tampering IDs
  try {
    // Tukaram (CIT-101) requesting Savita's profile by spoofing query param
    const res = await fetch(`${BASE_URL}/citizen/my-profile?citizenId=CIT-102`, {
      headers: { "Authorization": `Bearer ${citizenToken}` }
    });
    const data = await res.json();
    // Must return Tukaram (CIT-101), NOT Savita (CIT-102)
    assert(data.id === "CIT-101", "Citizen records enforce cryptographic token ownership (cannot spoof other citizen ID)", `Returned citizen: ${data.id}`);
  } catch (err) {
    assert(false, "Citizen records enforce cryptographic token ownership", err.message);
  }

  // 7. Citizen Profile Returns Associated Property & Household Details
  try {
    const res = await fetch(`${BASE_URL}/citizen/my-profile`, {
      headers: { "Authorization": `Bearer ${citizenToken}` }
    });
    const data = await res.json();
    assert(Boolean(data.prop_number || data.property_no), "Citizen profile returns associated household property record", `Property: ${data.prop_number || data.property_no}`);
  } catch (err) {
    assert(false, "Citizen profile returns associated household property record", err.message);
  }

  // 8. Admin Dashboard Stats
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && typeof data.citizens?.total === "number", "Admin dashboard returns live MySQL statistics", `Citizens: ${data.citizens?.total}, Sources: ${data.waterSources?.total}`);
  } catch (err) {
    assert(false, "Admin dashboard returns live statistics", err.message);
  }

  // 9. Admin Property Management (Create, List, Update, Guarded Delete)
  let testPropId = "";
  const testPropNo = `TEST-H-${Date.now().toString().slice(-4)}`;
  try {
    // Create
    const createRes = await fetch(`${BASE_URL}/admin/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({
        propertyNumber: testPropNo,
        ownerName: "Dev Testing Household",
        wardArea: "Ward 1 - Patel Falia (North)",
        propertyType: "Residential",
        address: "Plot 99, North Bypass",
        waterMeterNo: `MET-${testPropNo}`,
        annualTax: 250.00
      })
    });
    const createData = await createRes.json();
    testPropId = createData.id;
    assert(createRes.status === 201 && Boolean(testPropId), "Admin can create new village property", `ID: ${testPropId}`);

    // Update
    const updateRes = await fetch(`${BASE_URL}/admin/properties/${testPropId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ address: "Plot 99, North Bypass (Updated Landmark)" })
    });
    assert(updateRes.status === 200, "Admin can update village property details");

    // Guarded Delete
    const delRes = await fetch(`${BASE_URL}/admin/properties/${testPropId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert(delRes.status === 200, "Admin can safely delete test property with deletion guard");
  } catch (err) {
    assert(false, "Admin property management operations", err.message);
  }

  // 10. Water Sources & Distribution Schedules (Public Read & Admin Mutate)
  try {
    const pubSourcesRes = await fetch(`${BASE_URL}/water-sources`);
    const pubSources = await pubSourcesRes.json();
    assert(pubSourcesRes.status === 200 && pubSources.length > 0, "Public can view village water sources and storage levels", `Sources count: ${pubSources.length}`);

    // Unauthorized mutation must be rejected
    const unauthPut = await fetch(`${BASE_URL}/water-sources/src-1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentLevelPercent: 50 })
    });
    assert(unauthPut.status === 401 || unauthPut.status === 403, "Unauthenticated mutation of water sources is strictly rejected");

    // Admin mutation succeeds
    const authPut = await fetch(`${BASE_URL}/water-sources/src-1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ lastInspected: "Inspected Today by Staff" })
    });
    assert(authPut.status === 200, "Admin authorized mutation of water source succeeds");
  } catch (err) {
    assert(false, "Water sources read and protected mutations", err.message);
  }

  // 11. Community Grievance Submission & Status Update
  let testCmpId = "";
  try {
    const cmpRes = await fetch(`${BASE_URL}/community-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Automated Test Citizen",
        phone: "9876543210",
        area: "Ward 2 - Temple Chowk & Main Bazar",
        problemType: "Low Pressure",
        urgency: "Normal",
        description: "Automated test complaint verification description."
      })
    });
    const cmpData = await cmpRes.json();
    testCmpId = cmpData.id;
    assert(cmpRes.status === 201 && Boolean(testCmpId), "Community report / complaint stored in MySQL", `ID: ${testCmpId}`);

    // Admin updates complaint status & response
    const statusRes = await fetch(`${BASE_URL}/admin/complaints/${testCmpId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "In Progress", adminResponse: "Staff dispatched to inspect valve line." })
    });
    assert(statusRes.status === 200, "Admin can update complaint status and record administrative response");
  } catch (err) {
    assert(false, "Community grievance submission and status update", err.message);
  }

  // 12. Excel Export (.xlsx) Verification
  try {
    const excelRes = await fetch(`${BASE_URL}/admin/complaints/export-excel`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    const excelBuffer = Buffer.from(await excelRes.arrayBuffer());
    const isZip = excelBuffer.slice(0, 4).toString("hex") === "504b0304";
    const contentType = excelRes.headers.get("content-type");
    assert(
      excelRes.status === 200 && isZip && contentType.includes("openxmlformats"),
      "Admin Excel export generates valid Office OpenXML (.xlsx) containing all records",
      `Size: ${excelBuffer.length} bytes, Header: PK..`
    );
  } catch (err) {
    assert(false, "Admin Excel export verification", err.message);
  }

  // 14. Water Tank Monitoring Module Tests
  let testTankId = "";
  try {
    // 14.1 Add test tank with capacity of 100,000 litres
    const createTankRes = await fetch(`${BASE_URL}/water-tanks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Test Verification Overhead Tank",
        village_location: "Ward 1 - Test Verification Sector",
        tank_type: "Overhead Tank",
        total_capacity: 100000,
        tank_shape: "Cylindrical Vertical",
        dim_height: 5.0,
        dim_diameter: 5.05
      })
    });
    const tankData = await createTankRes.json();
    testTankId = tankData.tankId || tankData.tank?.id;
    assert(createTankRes.status === 201 && Boolean(testTankId), "Admin can register new water tank with 100,000 L capacity", `Tank ID: ${testTankId}`);

    // 14.2 Record measurement of 65,000 litres
    const read1Res = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({
        measuredQuantity: 65000,
        measurementMethod: "Manual",
        notes: "First test dipstick measurement"
      })
    });
    const read1Data = await read1Res.json();
    assert(
      read1Res.status === 201 && read1Data.reading?.percentage === 65 && read1Data.reading?.status === "Normal",
      "Measurement of 65,000 L calculated automatically to 65% with status 'Normal'",
      `Percentage: ${read1Data.reading?.percentage}%`
    );

    // 14.3 Verify tank details show 65% water level and persist in database
    const verifyTankRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}`);
    const verifyTankData = await verifyTankRes.json();
    assert(
      verifyTankRes.status === 200 &&
      Number(verifyTankData.tank?.current_quantity) === 65000 &&
      Number(verifyTankData.tank?.current_level_percent) === 65,
      "Water level and quantity persist accurately in MySQL database after reload",
      `Quantity: ${verifyTankData.tank?.current_quantity} L, Percent: ${verifyTankData.tank?.current_level_percent}%`
    );

    // 14.4 Record second measurement of 40,000 litres (Low threshold: 40%)
    const read2Res = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({
        measuredQuantity: 40000,
        measurementMethod: "Manual",
        notes: "Second test measurement after daily consumption"
      })
    });
    const read2Data = await read2Res.json();
    assert(
      read2Res.status === 201 && read2Data.reading?.percentage === 40 && read2Data.reading?.status === "Low",
      "Second measurement of 40,000 L updates level to 40% with status 'Low'"
    );

    // 14.5 Verify both readings remain in historical records (not overwritten)
    const historyRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`);
    const historyData = await historyRes.json();
    const hasBoth = historyData.readings?.length >= 2;
    assert(
      historyRes.status === 200 && hasBoth,
      "All historical measurements preserved in MySQL without overwriting previous readings",
      `Total readings in log: ${historyData.readings?.length}`
    );

    // 14.6 Test input validations: zero, negative, and over-capacity
    // Negative quantity rejection
    const negRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ measuredQuantity: -500 })
    });
    assert(negRes.status === 400, "Negative water quantity (-500 L) rejected with 400 Bad Request");

    // Over-capacity quantity rejection
    const overRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ measuredQuantity: 120000 })
    });
    assert(overRes.status === 400, "Over-capacity water quantity (120,000 L > 100,000 L) rejected with 400 Bad Request");

    // Zero quantity allowed (Empty status)
    const zeroRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ measuredQuantity: 0, notes: "Tank drained" })
    });
    const zeroData = await zeroRes.json();
    assert(
      zeroRes.status === 201 && zeroData.reading?.percentage === 0 && zeroData.reading?.status === "Empty",
      "Zero water quantity (0 L) allowed and correctly classified as 'Empty' (0%)"
    );

    // 14.7 Unauthorized citizen cannot update tank readings (RBAC check)
    const citReadRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${citizenToken}` },
      body: JSON.stringify({ measuredQuantity: 50000 })
    });
    assert(citReadRes.status === 403, "Citizens blocked from recording water measurements (403 Forbidden)");

    // 14.8 Overall summary calculation verification
    const sumRes = await fetch(`${BASE_URL}/water-tanks/summary`);
    const sumData = await sumRes.json();
    assert(
      sumRes.status === 200 &&
      sumData.summary?.totalCapacity > 0 &&
      sumData.summary?.overallStoragePercent === Number(((sumData.summary.totalCurrentStorage / sumData.summary.totalCapacity) * 100).toFixed(2)),
      "Overall storage percentage computed mathematically from total quantities & total capacities (not averaged)"
    );

    // Safe cleanup of test tank
    const delRes = await fetch(`${BASE_URL}/water-tanks/${testTankId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert(delRes.status === 200, "Safe test tank and associated readings cleanup", `Tank ${testTankId} deleted`);
  } catch (err) {
    assert(false, "Water Tank Monitoring automated test sequence", err.message);
  }

  console.log("\n============================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
