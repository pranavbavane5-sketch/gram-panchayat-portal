/**
 * JalMitra - Repository Verification Suite
 * Tests all 12 domain repositories across the active database engine.
 */

import {
  userRepo,
  villageRepo,
  serviceRepo,
  waterSourceRepo,
  scheduleRepo,
  communityRepo,
  propertyRepo,
  citizenRepo,
  billingRepo,
  waterTankRepo,
  panchayatRepo,
  auditRepo
} from "./repositories/index.js";

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
  console.log("🧪 TESTING UNIFIED DOMAIN REPOSITORIES (DUAL-ENGINE)");
  console.log(`Active Provider: ${process.env.DB_PROVIDER || "mysql"}`);
  console.log("============================================================\n");

  try {
    // 1. userRepo
    const adminUser = await userRepo.findByLoginOrPhone("admin");
    assert(adminUser !== null && adminUser.login_id === "admin", "userRepo.findByLoginOrPhone('admin')", `ID: ${adminUser?.id}`);
    assert(adminUser.role === "admin", "userRepo admin has role 'admin'");

    const byId = await userRepo.findById(adminUser.id);
    assert(byId !== null && byId.id === adminUser.id, "userRepo.findById", `User: ${byId?.full_name}`);

    const userCount = await userRepo.count();
    assert(userCount >= 1, "userRepo.count() returns active user count", `Count: ${userCount}`);

    // 2. villageRepo
    const settings = await villageRepo.getSettings();
    assert(settings !== null && settings.id === "current", "villageRepo.getSettings() returns current settings", `Village: ${settings.village_name}`);
    assert(Boolean(settings.sarpanch_name), "villageRepo settings has sarpanch_name", `Sarpanch: ${settings.sarpanch_name}`);
    assert(Boolean(settings.gram_sevak_name), "villageRepo settings has gram_sevak_name", `Gram Sevak: ${settings.gram_sevak_name}`);

    // 3. serviceRepo
    const allServices = await serviceRepo.getAll(false);
    assert(Array.isArray(allServices) && allServices.length > 0, "serviceRepo.getAll(false) returns catalog", `Count: ${allServices.length}`);

    const enabledServices = await serviceRepo.getAll(true);
    assert(Array.isArray(enabledServices) && enabledServices.length > 0, "serviceRepo.getAll(true) returns enabled services", `Count: ${enabledServices.length}`);
    // Check sorting
    let isSorted = true;
    for (let i = 1; i < enabledServices.length; i++) {
      if (enabledServices[i].display_order < enabledServices[i - 1].display_order) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, "serviceRepo returns services sorted by display_order ASC");

    // 4. waterSourceRepo
    const sources = await waterSourceRepo.getAll();
    assert(Array.isArray(sources), "waterSourceRepo.getAll() returns sources list", `Count: ${sources.length}`);
    const sourceCount = await waterSourceRepo.count();
    assert(sourceCount === sources.length, "waterSourceRepo.count() matches getAll() length", `Count: ${sourceCount}`);

    // 5. scheduleRepo
    const schedules = await scheduleRepo.getAll();
    assert(Array.isArray(schedules), "scheduleRepo.getAll() returns schedules", `Count: ${schedules.length}`);

    // 6. communityRepo
    const reports = await communityRepo.getAll();
    assert(Array.isArray(reports), "communityRepo.getAll() returns reports", `Count: ${reports.length}`);
    const reportCount = await communityRepo.count();
    assert(reportCount === reports.length, "communityRepo.count() matches getAll() length", `Count: ${reportCount}`);

    // 7. propertyRepo
    const properties = await propertyRepo.getAll();
    assert(Array.isArray(properties), "propertyRepo.getAll() returns properties", `Count: ${properties.length}`);
    const propCount = await propertyRepo.count();
    assert(propCount === properties.length, "propertyRepo.count() matches getAll() length", `Count: ${propCount}`);

    // 8. citizenRepo
    const citizens = await citizenRepo.getAll();
    assert(Array.isArray(citizens) && citizens.length > 0, "citizenRepo.getAll() returns citizens list", `Count: ${citizens.length}`);
    const citizenCount = await citizenRepo.count();
    assert(citizenCount === citizens.length, "citizenRepo.count() matches getAll() length", `Count: ${citizenCount}`);

    const sampleCitizen = citizens[0];
    const profile = await citizenRepo.getProfileWithProperty(sampleCitizen.id);
    assert(profile !== null && profile.id === sampleCitizen.id, "citizenRepo.getProfileWithProperty returns joined profile", `Citizen: ${profile?.full_name}, Prop: ${profile?.prop_number || 'N/A'}`);

    // 9. billingRepo
    const bills = await billingRepo.getAllBills();
    assert(Array.isArray(bills), "billingRepo.getAllBills() returns bills list", `Count: ${bills.length}`);
    const payments = await billingRepo.getAllPayments();
    assert(Array.isArray(payments), "billingRepo.getAllPayments() returns payments list", `Count: ${payments.length}`);
    const taxes = await billingRepo.getAllTaxes();
    assert(Array.isArray(taxes), "billingRepo.getAllTaxes() returns taxes list", `Count: ${taxes.length}`);

    // 10. waterTankRepo
    const tanks = await waterTankRepo.getAllTanks(false);
    assert(Array.isArray(tanks), "waterTankRepo.getAllTanks() returns tanks", `Count: ${tanks.length}`);
    const summary = await waterTankRepo.getSummary();
    assert(summary !== null && typeof summary.overallStoragePercent === "number", "waterTankRepo.getSummary() computes overall storage", `Percent: ${summary.overallStoragePercent}%`);

    // 11. panchayatRepo
    const apps = await panchayatRepo.getAllApplications();
    assert(Array.isArray(apps), "panchayatRepo.getAllApplications() returns applications list", `Count: ${apps.length}`);
    const notices = await panchayatRepo.getNotices(false);
    assert(Array.isArray(notices), "panchayatRepo.getNotices() returns notices list", `Count: ${notices.length}`);
    const tasks = await panchayatRepo.getTasks();
    assert(Array.isArray(tasks), "panchayatRepo.getTasks() returns tasks list", `Count: ${tasks.length}`);

    // 12. auditRepo
    const logs = await auditRepo.getLogs(10);
    assert(Array.isArray(logs), "auditRepo.getLogs() returns audit logs", `Count: ${logs.length}`);

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log("\n============================================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("============================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

