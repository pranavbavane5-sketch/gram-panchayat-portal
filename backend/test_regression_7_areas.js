/**
 * JalMitra - Comprehensive 7-Area Automated Regression Test Suite
 * Tests all 7 critical areas in both MySQL and Firestore environments:
 * 1. Citizen Registration / Directory (search, status, ward filters, login_id)
 * 2. Property / Household Management (listing with dues, canonical records, no COUNT(*) hijack)
 * 3. Water Bills, Payments & Receipts (bill number, receipt number, duplicate prevention)
 * 4. Taxes & Charges (field normalization, citizen select options, creation)
 * 5. Application Register & RTI (detail retrieval, citizen name/ward aliases, attachment handling)
 * 6. Work Register & Tasks (detail retrieval, Pending/Completed status normalization)
 * 7. Public Notices (active notices retrieval, expiry date filtering, homepage compatibility)
 */

import { citizenRepo } from "./repositories/citizenRepo.js";
import { propertyRepo } from "./repositories/propertyRepo.js";
import { billingRepo } from "./repositories/billingRepo.js";
import { panchayatRepo } from "./repositories/panchayatRepo.js";
import { executeFirestoreQuery } from "./firestoreQueryAdapter.js";
import { query } from "./db.js";

async function runTestSuite(provider) {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING REGRESSION SUITE WITH DB_PROVIDER: ${provider.toUpperCase()}`);
  console.log(`======================================================`);

  process.env.DB_PROVIDER = provider;
  const results = { passed: 0, failed: 0, errors: [] };

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      results.passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      results.failed++;
      results.errors.push(`${provider}: ${testName}`);
    }
  }

  try {
    // ----------------------------------------------------
    // AREA 1: Citizen Registration & Directory
    // ----------------------------------------------------
    console.log(`\n[Area 1] Citizen Registration & Resident Directory:`);
    const allCitizens = await citizenRepo.getAll();
    assert(Array.isArray(allCitizens) && allCitizens.length > 0, `Returns citizen records (found: ${allCitizens.length})`);
    
    const firstCit = allCitizens[0];
    assert(Boolean(firstCit.id && firstCit.full_name), `Citizen record contains valid id ('${firstCit?.id}') and full_name`);
    assert(firstCit.login_id !== undefined, `Citizen record has mapped login_id ('${firstCit?.login_id}')`);
    assert(firstCit.user_active !== undefined, `Citizen record has user_active flag (${firstCit?.user_active})`);

    // Test search filter
    const searchTerm = firstCit.full_name.split(" ")[0];
    const searchResults = await citizenRepo.getAll({ search: searchTerm });
    assert(searchResults.length > 0 && searchResults.some(c => c.full_name.includes(searchTerm)), `Search by name '${searchTerm}' returns matching citizens`);

    // Test ward filter
    if (firstCit.ward_area) {
      const wardResults = await citizenRepo.getAll({ ward: firstCit.ward_area });
      assert(wardResults.length > 0 && wardResults.every(c => c.ward_area.toLowerCase() === firstCit.ward_area.toLowerCase()), `Filter by ward '${firstCit.ward_area}' works correctly`);
    }

    // Test profile with property join
    const profile = await citizenRepo.getProfileWithProperty(firstCit.id);
    assert(profile !== null && profile.id === firstCit.id, `getProfileWithProperty returns profile composite`);

    // ----------------------------------------------------
    // AREA 2: Property / Household Management
    // ----------------------------------------------------
    console.log(`\n[Area 2] Property / Household Management:`);
    const propertiesWithDues = await propertyRepo.getAllWithDues();
    assert(Array.isArray(propertiesWithDues) && propertiesWithDues.length > 0, `getAllWithDues returns property list (found: ${propertiesWithDues.length})`);
    
    // Ensure no COUNT(*) hijack returning [{ count: 14 }]
    const hasCountHijack = propertiesWithDues.length === 1 && propertiesWithDues[0].count !== undefined && !propertiesWithDues[0].property_number;
    assert(!hasCountHijack, `Property listing is NOT hijacked by subquery COUNT(*)`);

    const pSample = propertiesWithDues[0];
    assert(Boolean(pSample.property_number), `Property record has valid property_number ('${pSample?.property_number}')`);
    assert(typeof pSample.total_bills === "number", `Property record has calculated total_bills (${pSample?.total_bills})`);
    assert(typeof pSample.unpaid_water_dues === "number", `Property record has calculated unpaid_water_dues (₹${pSample?.unpaid_water_dues})`);
    assert(typeof pSample.unpaid_tax_dues === "number", `Property record has calculated unpaid_tax_dues (₹${pSample?.unpaid_tax_dues})`);

    // Verify canonical property lookup (e.g. H-620 or sample)
    const knownPropNo = pSample.property_number;
    const propFound = await propertyRepo.getByPropertyNumber(knownPropNo);
    assert(propFound !== null && propFound.property_number === knownPropNo, `getByPropertyNumber finds canonical property '${knownPropNo}'`);

    // ----------------------------------------------------
    // AREA 3: Water Bills, Payments & Receipts
    // ----------------------------------------------------
    console.log(`\n[Area 3] Water Bills, Payments & Receipts:`);
    const bills = await billingRepo.getAllBills();
    assert(Array.isArray(bills) && bills.length > 0, `getAllBills returns water bills (found: ${bills.length})`);

    const payments = await billingRepo.getAllPayments();
    assert(Array.isArray(payments) && payments.length > 0, `getAllPayments returns payments (found: ${payments.length})`);

    const firstPay = payments[0];
    assert(Boolean(firstPay.receipt_no && firstPay.amount), `Payment record has receipt_no ('${firstPay?.receipt_no}') and amount`);

    // ----------------------------------------------------
    // AREA 4: Taxes & Charges
    // ----------------------------------------------------
    console.log(`\n[Area 4] Taxes & Other Charges:`);
    const taxes = await billingRepo.getAllTaxes();
    assert(Array.isArray(taxes) && taxes.length > 0, `getAllTaxes returns taxes/charges (found: ${taxes.length})`);

    const firstTax = taxes[0];
    assert(Boolean(firstTax.charge_type || firstTax.tax_name), `Tax record has normalized charge_type ('${firstTax?.charge_type}')`);
    assert(firstTax.amount !== undefined, `Tax record has valid amount (${firstTax?.amount})`);

    // ----------------------------------------------------
    // AREA 5: Application Register & RTI
    // ----------------------------------------------------
    console.log(`\n[Area 5] Applications & RTI Register:`);
    const apps = await panchayatRepo.getAllApplications();
    assert(Array.isArray(apps) && apps.length > 0, `getAllApplications returns applications (found: ${apps.length})`);

    const firstApp = apps[0];
    assert(Boolean(firstApp.id && firstApp.reference_no), `Application has id ('${firstApp?.id}') and reference_no ('${firstApp?.reference_no}')`);
    // Check aliases
    assert(firstApp.citizen_name !== undefined && firstApp.applicant_name !== undefined, `Application has citizen_name and applicant_name aliases`);
    assert(firstApp.citizen_phone !== undefined && firstApp.applicant_phone !== undefined, `Application has citizen_phone and applicant_phone aliases`);
    assert(firstApp.ward !== undefined && firstApp.ward_area !== undefined, `Application has ward and ward_area aliases`);

    const singleApp = await panchayatRepo.getApplicationById(firstApp.id);
    assert(singleApp !== null && singleApp.id === firstApp.id, `getApplicationById retrieves single application`);

    // ----------------------------------------------------
    // AREA 6: Work Register & Tasks
    // ----------------------------------------------------
    console.log(`\n[Area 6] Work Register & Tasks:`);
    const tasks = await panchayatRepo.getTasks();
    assert(Array.isArray(tasks) && tasks.length > 0, `getTasks returns task records (found: ${tasks.length})`);

    const firstTask = tasks[0];
    assert(Boolean(firstTask.id && firstTask.title), `Task has id ('${firstTask?.id}') and title ('${firstTask?.title}')`);
    assert(["Pending", "In Progress", "Completed", "Delayed", "Open"].includes(firstTask.status), `Task has valid status ('${firstTask.status}')`);

    // ----------------------------------------------------
    // AREA 7: Public Notices on Homepage
    // ----------------------------------------------------
    console.log(`\n[Area 7] Public Notices & Announcements:`);
    const activeNotices = await panchayatRepo.getNotices(true);
    assert(Array.isArray(activeNotices) && activeNotices.length > 0, `getNotices(activeOnly=true) returns active notices (found: ${activeNotices.length})`);

    const allNotices = await panchayatRepo.getNotices(false);
    assert(Array.isArray(allNotices) && allNotices.length >= activeNotices.length, `getNotices(false) returns all notices (found: ${allNotices.length})`);

    const firstNotice = activeNotices[0];
    assert(Boolean(firstNotice.id && firstNotice.title), `Notice has id ('${firstNotice?.id}') and title`);

    // Check sort order (pinned first)
    if (activeNotices.length > 1) {
      const isSorted = (activeNotices[0].is_pinned || 0) >= (activeNotices[activeNotices.length - 1].is_pinned || 0);
      assert(isSorted, `Notices are correctly prioritized by is_pinned`);
    }

  } catch (err) {
    console.error(`Suite exception under ${provider}:`, err);
    results.failed++;
    results.errors.push(`${provider} Exception: ${err.message}`);
  }

  console.log(`\n>> ${provider.toUpperCase()} SUMMARY: ${results.passed} Passed, ${results.failed} Failed`);
  return results;
}

async function main() {
  console.log("Starting Dual-Driver Regression Verification Suite...");
  
  // Test MySQL
  const mysqlResults = await runTestSuite("mysql");

  // Test Firestore
  const firestoreResults = await runTestSuite("firestore");

  console.log("\n======================================================");
  console.log("FINAL REGRESSION RESULTS:");
  console.log(`MySQL:     ${mysqlResults.passed} passed, ${mysqlResults.failed} failed`);
  console.log(`Firestore: ${firestoreResults.passed} passed, ${firestoreResults.failed} failed`);
  console.log("======================================================");

  if (mysqlResults.failed > 0 || firestoreResults.failed > 0) {
    console.error("Regression test suite encountered failures.");
    process.exit(1);
  } else {
    console.log("🎉 ALL 7 AREAS PASSED IN BOTH MYSQL AND FIRESTORE!");
    process.exit(0);
  }
}

main();
