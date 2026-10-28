/**
 * Automated Test Suite: Service Management Ordering System Lifecycle & Sequence Invariant
 * Verifies:
 *  1. Dense sequential ordering invariant: 1...N without gaps or duplicates
 *  2. Add service: assigns N+1 or inserts at target order with shifting
 *  3. Move up/down: swaps adjacent services, persists order in DB, preserves 1...N
 *  4. Boundary guards: top item cannot move up, bottom item cannot move down
 *  5. Edit service: preserves order unless explicitly changed; if changed, shifts others
 *  6. Delete service: renumbers remaining services sequentially from 1 with zero gaps
 *  7. Reliable sorting: always display_order ASC, id ASC
 *  8. Database persistence: reload from DB verifies persisted state
 */

import { serviceRepo } from "./repositories/serviceRepo.js";
import { query } from "./db.js";

function assert(condition, message, details = "") {
  if (!condition) {
    console.error(`❌ FAIL: ${message} ${details ? `(${details})` : ""}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message} ${details ? `-> ${details}` : ""}`);
}

function verifySequenceInvariant(services, expectedCount = null) {
  if (expectedCount !== null) {
    assert(services.length === expectedCount, `Catalog has expected count of ${expectedCount}`, `Actual: ${services.length}`);
  }
  const orders = services.map(s => s.display_order);
  const seenOrders = new Set();
  
  for (let i = 0; i < services.length; i++) {
    const expectedOrder = i + 1;
    const actualOrder = services[i].display_order;
    assert(
      actualOrder === expectedOrder,
      `Service at index ${i} ('${services[i].title_en}') has sequential order #${expectedOrder}`,
      `Actual: #${actualOrder}`
    );
    assert(!seenOrders.has(actualOrder), `Order #${actualOrder} is unique (no duplicate detected)`);
    seenOrders.add(actualOrder);
  }

  // Verify dense 1...N: no gaps
  for (let num = 1; num <= services.length; num++) {
    assert(seenOrders.has(num), `Sequence contains order #${num} (no gap)`);
  }
}

async function runServiceOrderingLifecycleTests() {
  console.log("\n=======================================================");
  console.log("🚀 Starting Service Management Ordering Lifecycle Tests");
  console.log("=======================================================\n");

  const isFs = process.env.DB_PROVIDER === "firestore";
  console.log(`Active Database Provider: ${isFs ? "Cloud Firestore" : "Local MySQL"}`);

  // Step 1: Initial state & self-healing normalization
  console.log("\n--- Step 1: Verify Initial State & Invariant ---");
  const initialServices = await serviceRepo.getAll(false);
  const initialCount = initialServices.length;
  console.log(`Initial total services count: ${initialCount}`);
  verifySequenceInvariant(initialServices, initialCount);

  // Step 2: Add a new test service (placed at end: N + 1)
  console.log("\n--- Step 2: Add Service (Append to End) ---");
  const testKeyA = `test_srv_a_${Date.now()}`;
  const createdA = await serviceRepo.create({
    service_key: testKeyA,
    title_en: "Test Water Meter Calibration",
    title_mr: "पाणी मीटर तपासणी चाचणी",
    category: "Water Works",
    desc_en: "Test service for verifying automatic display order assignment",
    desc_mr: "चाचणी सेवा",
    is_enabled: 1
  });

  assert(createdA !== null, "Service A created successfully");
  assert(createdA.display_order === initialCount + 1, `Service A automatically assigned next order #${initialCount + 1}`, `Actual: #${createdA.display_order}`);

  const servicesAfterAddA = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterAddA, initialCount + 1);

  // Step 3: Add another service inserted at specific position (e.g. position 2)
  console.log("\n--- Step 3: Add Service Inserted at Specific Position (Position 2) ---");
  const testKeyB = `test_srv_b_${Date.now()}`;
  const createdB = await serviceRepo.create({
    service_key: testKeyB,
    title_en: "Test Priority Solar Borewell",
    title_mr: "सौर बोअरवेल चाचणी",
    category: "Water Works",
    desc_en: "Inserted at priority position 2",
    display_order: 2,
    is_enabled: 1
  });

  assert(createdB !== null, "Service B created successfully");
  assert(createdB.display_order === 2, "Service B placed at order #2", `Actual: #${createdB.display_order}`);

  const servicesAfterAddB = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterAddB, initialCount + 2);
  const itemAtPos2 = servicesAfterAddB[1];
  assert(String(itemAtPos2.id) === String(createdB.id), "Service B is indeed at index 1 (order #2)");

  // Step 4: Move Service B down
  console.log("\n--- Step 4: Move Service B Down (Position 2 -> Position 3) ---");
  const movedDown = await serviceRepo.moveOrder(createdB.id, "down");
  assert(movedDown !== null, "moveOrder down returned updated service");
  assert(movedDown.display_order === 3, "Service B moved down to order #3", `Actual: #${movedDown.display_order}`);

  const servicesAfterMoveDown = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterMoveDown, initialCount + 2);
  assert(String(servicesAfterMoveDown[2].id) === String(createdB.id), "Service B is now at index 2 (order #3)");

  // Step 5: Move Service B up
  console.log("\n--- Step 5: Move Service B Up (Position 3 -> Position 2) ---");
  const movedUp = await serviceRepo.moveOrder(createdB.id, "up");
  assert(movedUp !== null, "moveOrder up returned updated service");
  assert(movedUp.display_order === 2, "Service B moved back up to order #2", `Actual: #${movedUp.display_order}`);

  const servicesAfterMoveUp = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterMoveUp, initialCount + 2);

  // Step 6: Boundary guards (moving #1 up, moving #N down)
  console.log("\n--- Step 6: Boundary Guard Verification ---");
  const topService = servicesAfterMoveUp[0];
  const topMoveUp = await serviceRepo.moveOrder(topService.id, "up");
  assert(topMoveUp.display_order === 1, "Moving top service up preserves order #1 without error");

  const bottomService = servicesAfterMoveUp[servicesAfterMoveUp.length - 1];
  const bottomMoveDown = await serviceRepo.moveOrder(bottomService.id, "down");
  assert(bottomMoveDown.display_order === servicesAfterMoveUp.length, `Moving bottom service down preserves order #${servicesAfterMoveUp.length}`);

  // Step 7: Edit Service A non-order field (position preserved)
  console.log("\n--- Step 7: Edit Service (Non-Order Fields - Order Preserved) ---");
  const orderBeforeEdit = (await serviceRepo.getById(createdA.id)).display_order;
  const updatedA1 = await serviceRepo.update(createdA.id, {
    title_en: "Test Water Meter Calibration (Updated Title)",
    category: "Civic Utilities"
  });
  assert(updatedA1.title_en === "Test Water Meter Calibration (Updated Title)", "Title updated");
  assert(updatedA1.display_order === orderBeforeEdit, `Order preserved at #${orderBeforeEdit}`, `Actual: #${updatedA1.display_order}`);

  const servicesAfterEditA1 = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterEditA1, initialCount + 2);

  // Step 8: Edit Service A order explicitly (Move to position 1)
  console.log("\n--- Step 8: Edit Service Order Explicitly (Move to Position 1) ---");
  const updatedA2 = await serviceRepo.update(createdA.id, {
    display_order: 1
  });
  assert(updatedA2.display_order === 1, "Service A moved to position #1 via edit", `Actual: #${updatedA2.display_order}`);

  const servicesAfterEditA2 = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterEditA2, initialCount + 2);
  assert(String(servicesAfterEditA2[0].id) === String(createdA.id), "Service A is now at index 0 (order #1)");

  // Step 9: Delete Service B & verify renumbering
  console.log("\n--- Step 9: Delete Service B & Verify Dense Renumbering ---");
  const deletedB = await serviceRepo.delete(createdB.id);
  assert(deletedB === true, "Service B deleted");

  const servicesAfterDeleteB = await serviceRepo.getAll(false);
  verifySequenceInvariant(servicesAfterDeleteB, initialCount + 1);

  // Step 10: Delete Service A & verify renumbering back to initialCount
  console.log("\n--- Step 10: Delete Service A & Verify Restoration of Count ---");
  const deletedA = await serviceRepo.delete(createdA.id);
  assert(deletedA === true, "Service A deleted");

  const finalServices = await serviceRepo.getAll(false);
  verifySequenceInvariant(finalServices, initialCount);

  // Step 11: Public enabled catalog consistency
  console.log("\n--- Step 11: Public Catalog Sequence Consistency ---");
  const publicServices = await serviceRepo.getAll(true);
  assert(publicServices.length > 0, "Public services catalog returned enabled services");
  for (let i = 0; i < publicServices.length - 1; i++) {
    assert(
      publicServices[i].display_order <= publicServices[i + 1].display_order,
      `Public catalog item #${i + 1} (${publicServices[i].display_order}) is strictly <= next item (${publicServices[i + 1].display_order})`
    );
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL SERVICE ORDERING SYSTEM TESTS PASSED PERFECTLY!");
  console.log("=======================================================\n");
}

runServiceOrderingLifecycleTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  });
