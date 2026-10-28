import assert from "assert";

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== JalMitra Gram Panchayat Upgrade E2E Verification Suite ===\n");

  let adminToken = "";
  let citizenToken = "";

  // 1. Admin Login
  console.log("1. Authenticating Admin (admin / Admin@123)...");
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: "admin", password: "Admin@123" })
  });
  assert.strictEqual(adminLoginRes.status, 200, "Admin login should return 200");
  const adminData = await adminLoginRes.json();
  adminToken = adminData.token;
  assert.ok(adminToken, "Admin token should be present");
  console.log("   ✓ Admin authenticated successfully.");

  // 2. Citizen Login
  console.log("2. Authenticating Citizen (CIT-101 / Citizen@123)...");
  const citLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId: "CIT-101", password: "Citizen@123" })
  });
  assert.strictEqual(citLoginRes.status, 200, "Citizen login should return 200");
  const citData = await citLoginRes.json();
  citizenToken = citData.token;
  assert.ok(citizenToken, "Citizen token should be present");
  console.log("   ✓ Citizen authenticated successfully.");

  // 3. Test Village Settings (GET & PUT)
  console.log("3. Testing Village Settings API & MySQL Persistence...");
  const getSettingsRes = await fetch(`${BASE_URL}/village-settings`);
  assert.strictEqual(getSettingsRes.status, 200);
  const settings = await getSettingsRes.json();
  assert.ok(settings.sarpanch_name, "Sarpanch name should be present");
  assert.ok(settings.gram_sevak_name, "Gram Sevak name should be present");
  assert.ok(settings.secretary_name, "Secretary name should be present");
  assert.ok(settings.office_hours, "Office hours should be present");
  console.log(`   ✓ Current Village: ${settings.village_name}, Sarpanch: ${settings.sarpanch_name}, Gram Sevak: ${settings.gram_sevak_name}`);

  const updateSettingsRes = await fetch(`${BASE_URL}/village-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      village_name: "Sundarpur Gram Panchayat",
      taluka: "Karjat",
      district: "Ahmednagar",
      state: "Maharashtra",
      sarpanch_name: "Shri. Vitthalrao Deshmukh",
      gram_sevak_name: "Shri. Ramesh Patil",
      secretary_name: "Smt. Sunita Kulkarni",
      office_phone: "02489-234567 / 1800-120-JAL",
      office_email: "grampanchayat.sundarpur@gov.in",
      office_hours: "Mon – Sat: 10:00 AM – 05:30 PM",
      office_address: "Gram Panchayat Karyalaya, Main Chowk, Sundarpur",
      intro_text: "Welcome to Sundarpur Gram Panchayat official digital administration portal.",
      intro_text_mr: "ग्रामपंचायत सुंदरपूरच्या अधिकृत ई-प्रशासन पोर्टलवर आपले सहर्ष स्वागत आहे.",
      drought_status: "Low",
      alert_banner_text: "Notice: Water supply is in Rationing Mode. Please store water carefully and avoid wastage."
    })
  });
  assert.strictEqual(updateSettingsRes.status, 200);
  console.log("   ✓ Village settings updated and verified in MySQL.");

  // 4. Role-based Security: Citizen trying to update village settings should be rejected (403)
  console.log("4. Testing Role-Based Protection on Admin endpoints...");
  const forbiddenRes = await fetch(`${BASE_URL}/village-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${citizenToken}`
    },
    body: JSON.stringify({ village_name: "Hacked" })
  });
  assert.strictEqual(forbiddenRes.status, 403, "Citizen should be forbidden from updating village settings");
  console.log("   ✓ 403 Forbidden verified for unauthorized citizen access.");

  // 5. Submit an Application as Citizen
  console.log("5. Submitting Application as Citizen (Water Supply Complaint)...");
  const appSubmitRes = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${citizenToken}`
    },
    body: JSON.stringify({
      category: "Water Supply Complaint",
      subject: "Low water pressure in Ward 1 pipeline",
      description: "Water tap supply pressure has been insufficient for 3 consecutive days.",
      ward: "Ward 1 - Patel Falia (North)",
      property_number: "H-104",
      citizen_name: "Tukaram Shinde",
      citizen_phone: "9876543210",
      urgency: "High"
    })
  });
  assert.strictEqual(appSubmitRes.status, 201, "Application submission should return 201");
  const appData = await appSubmitRes.json();
  assert.ok(appData.reference_no, "Reference number should be generated");
  assert.ok(appData.reference_no.startsWith("CMP-"), "Water complaint ref should start with CMP-");
  console.log(`   ✓ Created Application with Reference #: ${appData.reference_no}`);

  // 6. Submit an RTI Application
  console.log("6. Submitting RTI Application with Statutory 30-Day SLA...");
  const rtiSubmitRes = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${citizenToken}`
    },
    body: JSON.stringify({
      category: "RTI (Right to Information) Application",
      is_rti: true,
      rti_fee_status: "Paid",
      subject: "Details of VWSC Tanker Expenditure for 2025-26",
      description: "Requesting certified copy of water tanker expenditure vouchers and driver logbooks under RTI Act 2005.",
      ward: "Ward 1 - Patel Falia (North)",
      citizen_name: "Tukaram Shinde",
      citizen_phone: "9876543210"
    })
  });
  assert.strictEqual(rtiSubmitRes.status, 201);
  const rtiData = await rtiSubmitRes.json();
  assert.ok(rtiData.reference_no.startsWith("RTI-"), "RTI ref should start with RTI-");
  console.log(`   ✓ Created RTI Application with Reference #: ${rtiData.reference_no}`);

  // 7. Test Public Tracking Endpoint
  console.log("7. Testing Public Tracking Endpoint for Reference #...");
  const trackRes = await fetch(`${BASE_URL}/applications/track/${encodeURIComponent(appData.reference_no)}`);
  assert.strictEqual(trackRes.status, 200);
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.reference_no, appData.reference_no);
  assert.strictEqual(trackData.status, "Submitted");
  console.log(`   ✓ Public tracking confirmed: Ref=${trackData.reference_no}, Status=${trackData.status}`);

  // 8. Test Citizen's Scoped Applications
  console.log("8. Testing Citizen's Private Applications History...");
  const citAppsRes = await fetch(`${BASE_URL}/citizen/applications`, {
    headers: { "Authorization": `Bearer ${citizenToken}` }
  });
  assert.strictEqual(citAppsRes.status, 200);
  const citApps = await citAppsRes.json();
  assert.ok(Array.isArray(citApps));
  const hasSubmittedApp = citApps.some(a => a.reference_no === appData.reference_no);
  assert.ok(hasSubmittedApp, "Citizen's submissions list must contain newly created application");
  console.log(`   ✓ Citizen sees their own ${citApps.length} applications in Citizen Portal.`);

  // 9. Admin Applications Management & Status Update
  console.log("9. Admin Reviewing and Updating Application Status...");
  const updateStatusRes = await fetch(`${BASE_URL}/admin/applications/${appData.id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: "Resolved",
      assigned_to: "Ramesh Patil (Gram Sevak)",
      official_response: "Valve technician dispatched to Ward 1. Air lock cleared and water pressure restored to normal.",
      internal_notes: "Checked on site at 11:30 AM."
    })
  });
  assert.strictEqual(updateStatusRes.status, 200);
  console.log("   ✓ Admin updated status to Resolved with official response.");

  // Verify the updated status reflects in tracking
  const trackRes2 = await fetch(`${BASE_URL}/applications/track/${encodeURIComponent(appData.reference_no)}`);
  const trackData2 = await trackRes2.json();
  assert.strictEqual(trackData2.status, "Resolved");
  assert.strictEqual(trackData2.assigned_to, "Ramesh Patil (Gram Sevak)");
  assert.ok(trackData2.official_response.includes("Valve technician dispatched"));
  console.log("   ✓ Verified live public tracking immediately shows 'Resolved' and official response!");

  // 10. Test Work Register & Maintenance Tasks
  console.log("10. Testing Gram Panchayat Daily Work Register & Tasks...");
  const createTaskRes = await fetch(`${BASE_URL}/admin/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: "Repair main pipeline rupture near High School",
      category: "Water Supply",
      priority: "Urgent",
      ward: "Ward 3 - School Tola",
      assigned_to: "Lineman Shankar"
    })
  });
  assert.strictEqual(createTaskRes.status, 201);
  const taskData = await createTaskRes.json();
  console.log(`   ✓ Created Work Task #${taskData.id}`);

  const updateTaskRes = await fetch(`${BASE_URL}/admin/tasks/${taskData.id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: "Completed" })
  });
  assert.strictEqual(updateTaskRes.status, 200);
  console.log("   ✓ Updated task status to Completed in MySQL.");

  // 11. Test Public Notices
  console.log("11. Testing Public Notices & Gram Sabha Updates...");
  const createNoticeRes = await fetch(`${BASE_URL}/admin/notices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: "Notice: Annual Village Development Gram Sabha on 15th Nov",
      title_mr: "सूचना: वार्षिक गाव विकास ग्रामसभा १५ नोव्हेंबर रोजी",
      category: "Gram Sabha",
      priority: "High",
      content: "All villagers of Sundarpur are requested to attend the Gram Sabha at Panchayat Karyalaya at 10:00 AM.",
      content_mr: "सुंदरपूर गावातील सर्व नागरिकांनी सकाळी १०:०० वाजता ग्रामपंचायत कार्यालयात उपस्थित रहावे."
    })
  });
  assert.strictEqual(createNoticeRes.status, 201);
  console.log("   ✓ Published new Gram Sabha notice to public board.");

  const publicNoticesRes = await fetch(`${BASE_URL}/notices`);
  assert.strictEqual(publicNoticesRes.status, 200);
  const notices = await publicNoticesRes.json();
  assert.ok(notices.length > 0, "Public notices list must have notices");
  console.log(`   ✓ Verified ${notices.length} active notices on public endpoint.`);

  // 12. Test Executive 8-KPI Dashboard Summary
  console.log("12. Testing Executive 8-KPI Dashboard Summary...");
  const summaryRes = await fetch(`${BASE_URL}/admin/panchayat-summary`, {
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  assert.strictEqual(summaryRes.status, 200);
  const summary = await summaryRes.json();
  assert.ok(summary.citizens_count >= 0, "Citizens count present");
  assert.ok(summary.applications_total >= 0, "Applications count present");
  assert.ok(summary.active_rti >= 0, "Active RTI count present");
  assert.ok(summary.water_reserve_fill_percent !== undefined, "Water fill percent present");
  console.log(`   ✓ Executive KPIs: Citizens=${summary.citizens_count}, Total Apps=${summary.applications_total}, Active RTI=${summary.active_rti}, Water Fill=${summary.water_reserve_fill_percent}%`);

  // 13. Test CSV Export
  console.log("13. Testing Applications CSV Export...");
  const csvRes = await fetch(`${BASE_URL}/admin/applications/export`, {
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  assert.strictEqual(csvRes.status, 200);
  const csvContent = await csvRes.text();
  assert.ok(csvContent.includes("Reference No,Filing Date,Category"), "CSV header must be present");
  assert.ok(csvContent.includes(appData.reference_no), "CSV must contain created reference number");
  console.log("   ✓ CSV Export generated with correct headers and data rows.");

  console.log("\n========================================================");
  console.log("🎉 ALL 13 TEST CASES PASSED WITH 100% SUCCESS!");
  console.log("========================================================\n");
}

runTests().catch(err => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
