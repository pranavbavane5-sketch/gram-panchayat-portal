/**
 * Test Suite: Manage Services Display Order Stability & Admin Navigation Verification
 */
import { query } from "./db.js";

const BASE_URL = "http://localhost:5000/api";

async function runServicesOrderVerification() {
  console.log("============================================================");
  console.log("🧪 TESTING SERVICES ORDER STABILITY & PERSISTENCE");
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

  // 1. Admin Login
  let adminToken = "";
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "admin", password: "Admin@123" })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(Boolean(adminToken), "Admin authentication for services management");
  } catch (e) {
    assert(false, "Admin authentication failed", e.message);
  }

  // 2. Fetch existing services and check order
  let initialServices = [];
  try {
    const res = await fetch(`${BASE_URL}/admin/services`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    initialServices = data.services || [];
    assert(data.success && initialServices.length > 0, "Fetch existing services from database", `Count: ${initialServices.length}`);
    
    // Check if sorted ascending by display_order
    let isAscending = true;
    for (let i = 0; i < initialServices.length - 1; i++) {
      if ((initialServices[i].display_order || 0) > (initialServices[i + 1].display_order || 0)) {
        isAscending = false;
        break;
      }
    }
    assert(isAscending, "Existing services returned sorted strictly ascending by display_order");
  } catch (e) {
    assert(false, "Fetch existing services failed", e.message);
  }

  const initialMaxOrder = initialServices.length > 0
    ? Math.max(...initialServices.map(s => Number(s.display_order) || 0))
    : 0;

  // 3. Create a new service WITHOUT specifying display_order
  let createdServiceId = null;
  const testKey = `test_srv_${Date.now()}`;
  try {
    const res = await fetch(`${BASE_URL}/admin/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        service_code: testKey,
        title_en: "Solar Street Light Request",
        title_mr: "सौर पथदिवे मागणी",
        category: "Public Works",
        icon: "☀️",
        desc_en: "Request new solar street lights in village wards.",
        desc_mr: "गावातील प्रभागांमध्ये नवीन सौर पथदिवे बसविण्याची मागणी."
        // display_order intentionally omitted!
      })
    });
    const data = await res.json();
    createdServiceId = data.id;
    const assignedOrder = data.service?.display_order;
    assert(
      data.success && assignedOrder === initialMaxOrder + 1,
      "New service automatically assigned next available display_order (appears at end)",
      `Assigned: #${assignedOrder}, Expected: #${initialMaxOrder + 1}`
    );
  } catch (e) {
    assert(false, "New service creation failed", e.message);
  }

  // 4. Move Service Up
  let orderAfterMoveUp = null;
  try {
    const res = await fetch(`${BASE_URL}/admin/services/${createdServiceId}/move`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ direction: "up" })
    });
    const data = await res.json();
    orderAfterMoveUp = data.display_order;
    assert(data.success && orderAfterMoveUp < (initialMaxOrder + 1), "Move Service Up swaps order with previous service", `New order: #${orderAfterMoveUp}`);
  } catch (e) {
    assert(false, "Move Service Up failed", e.message);
  }

  // 5. Move Service Down
  try {
    const res = await fetch(`${BASE_URL}/admin/services/${createdServiceId}/move`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ direction: "down" })
    });
    const data = await res.json();
    assert(data.success && data.display_order === initialMaxOrder + 1, "Move Service Down returns service to end position", `Order: #${data.display_order}`);
  } catch (e) {
    assert(false, "Move Service Down failed", e.message);
  }

  // 6. Edit service WITHOUT changing display_order -> position must remain unchanged
  try {
    const res = await fetch(`${BASE_URL}/admin/services/${createdServiceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title_en: "Solar Street Light Request (Updated)",
        desc_en: "Updated description without modifying display_order."
      })
    });
    const data = await res.json();
    assert(
      data.success && data.service?.display_order === initialMaxOrder + 1,
      "Editing service details keeps display_order strictly unchanged",
      `Order: #${data.service?.display_order}`
    );
  } catch (e) {
    assert(false, "Edit service without order change failed", e.message);
  }

  // 7. Verify deletion does NOT renumber or shift other services
  let testMiddleServiceId = null;
  const middleKey = `test_mid_${Date.now()}`;
  try {
    // Add an intermediate service
    const createMidRes = await fetch(`${BASE_URL}/admin/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        service_code: middleKey,
        title_en: "Temporary Middle Service",
        title_mr: "तात्पुरती मध्यवर्ती सेवा",
        category: "Civic Utilities",
        desc_en: "Middle service to test deletion stability."
      })
    });
    const midData = await createMidRes.json();
    testMiddleServiceId = midData.id;

    // Snapshot of orders before deletion
    const listBeforeRes = await fetch(`${BASE_URL}/admin/services`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listBefore = (await listBeforeRes.json()).services;
    const ourServiceBefore = listBefore.find(s => s.id === createdServiceId);
    const orderBefore = ourServiceBefore?.display_order;

    // Delete the middle service
    const delRes = await fetch(`${BASE_URL}/admin/services/${testMiddleServiceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const delData = await delRes.json();
    assert(delData.success, "Delete intermediate service succeeded");

    // Re-fetch services and verify our other service's order was NOT renumbered
    const listAfterRes = await fetch(`${BASE_URL}/admin/services`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listAfter = (await listAfterRes.json()).services;
    const ourServiceAfter = listAfter.find(s => s.id === createdServiceId);
    assert(
      ourServiceAfter && ourServiceAfter.display_order === orderBefore,
      "Deleting a service preserves exact display_order of all remaining services (no automatic renumbering)",
      `Order remained #${ourServiceAfter?.display_order}`
    );
  } catch (e) {
    assert(false, "Deletion order stability test failed", e.message);
  }

  // 8. Public Services API returns services sorted strictly ascending by display_order
  try {
    const res = await fetch(`${BASE_URL}/services`);
    const data = await res.json();
    const pubServices = data.services || [];
    let pubSorted = true;
    for (let i = 0; i < pubServices.length - 1; i++) {
      if ((pubServices[i].display_order || 0) > (pubServices[i + 1].display_order || 0)) {
        pubSorted = false;
        break;
      }
    }
    assert(data.success && pubSorted, "Public /api/services returns services sorted by display_order ascending", `Public count: ${pubServices.length}`);
  } catch (e) {
    assert(false, "Public services sort check failed", e.message);
  }

  // Clean up created test service
  if (createdServiceId) {
    try {
      await fetch(`${BASE_URL}/admin/services/${createdServiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`🧹 Cleaned up test service #${createdServiceId}`);
    } catch (e) {
      console.warn("Cleanup warning:", e.message);
    }
  }

  console.log("\n============================================================");
  console.log(`📊 SERVICES ORDER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runServicesOrderVerification()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Test runner failed:", err);
    process.exit(1);
  });

