/**
 * Firebase Admin SDK Probe Script
 * Verifies live connection by reading/writing a test document in a dedicated isolated collection '_connectivity_probe'
 * Never touches production collections. Never prints secrets, credentials, or keys.
 */

import { initFirestore, checkFirestoreConnection } from "./firestoreDb.js";

async function probe() {
  console.log("============================================================");
  console.log("🔍 PROBING FIREBASE ADMIN SDK & CLOUD FIRESTORE CONNECTION");
  console.log("============================================================\n");

  // Step 1: Check if credentials are configured
  const connectionStatus = await checkFirestoreConnection();

  if (connectionStatus.status === "NOT_CONFIGURED") {
    console.log("⚠️ RESULT: Firebase credentials are NOT YET CONFIGURED.");
    console.log("Status: NOT_CONFIGURED");
    console.log("Message:", connectionStatus.message);
    process.exit(2);
  }

  if (connectionStatus.status === "INIT_ERROR") {
    console.error("❌ RESULT: Firebase Admin SDK initialization failed.");
    console.error("Status: INIT_ERROR");
    console.error("Message:", connectionStatus.message);
    process.exit(1);
  }

  // Step 2: Attempt real read/write probe to a dedicated test collection
  try {
    const db = initFirestore();
    const probeCollection = db.collection("_connectivity_probe");
    const probeDocId = `probe_${Date.now()}`;
    const probeRef = probeCollection.doc(probeDocId);

    console.log(`📡 Testing write probe to isolated collection '_connectivity_probe/${probeDocId}'...`);
    await probeRef.set({
      probe: "jalmitra_connection_test",
      timestamp: new Date().toISOString(),
      server: "express_backend"
    });
    console.log("✅ Write probe succeeded!");

    console.log(`📡 Testing read probe from '_connectivity_probe/${probeDocId}'...`);
    const snap = await probeRef.get();
    if (!snap.exists) {
      throw new Error("Probe document was written but could not be read back.");
    }
    console.log("✅ Read probe succeeded! Document data confirmed.");

    console.log(`🧹 Cleaning up probe document '_connectivity_probe/${probeDocId}'...`);
    await probeRef.delete();
    console.log("✅ Cleanup succeeded! Isolated test document removed.");

    console.log("\n============================================================");
    console.log("🎉 SUCCESS: Live Cloud Firestore connection verified!");
    console.log(`🎯 Connected to Firebase Project ID: ${connectionStatus.projectId}`);
    console.log("============================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ ERROR: Cloud Firestore probe failed.");
    console.error("Details:", err.message);
    process.exit(1);
  }
}

probe().catch(err => {
  console.error("Unexpected probe failure:", err.message);
  process.exit(1);
});
