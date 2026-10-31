/**
 * JalMitra - Safe Citizen Accounts Repair Utility
 * Audits and fixes missing links, malformed fields, and unlinked profiles
 * WITHOUT deleting records or resetting authorized passwords.
 */

import { initFirestore, getFirestoreDb, COLLECTIONS } from "./firestoreDb.js";
import { query } from "./db.js";
import { userRepo } from "./repositories/userRepo.js";
import { citizenRepo } from "./repositories/citizenRepo.js";
import { propertyRepo } from "./repositories/propertyRepo.js";

async function repairFirestoreAccounts() {
  console.log("\n=======================================================");
  console.log("🛠️  AUDITING & REPAIRING FIRESTORE CITIZEN ACCOUNTS");
  console.log("=======================================================");

  initFirestore();
  const db = getFirestoreDb();
  if (!db) {
    console.error("Firestore not initialized.");
    return;
  }

  const usersSnap = await db.collection(COLLECTIONS.USERS).get();
  const citizensSnap = await db.collection(COLLECTIONS.CITIZENS).get();

  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const citizens = citizensSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${citizens.length} citizens and ${users.length} users in Firestore.`);
  let repairedCount = 0;

  for (const c of citizens) {
    // 1. Repair malformed status / property_id in citizen record
    const citPatch = {};
    if (c.status && c.status.startsWith("PROP-")) {
      console.log(`Repairing citizen ${c.id}: status was '${c.status}', moving to property_id and setting status to 'Active'.`);
      citPatch.property_id = c.status;
      citPatch.status = "Active";
      c.status = "Active";
      c.property_id = citPatch.property_id;
    }
    if (c.connection_type && c.connection_type.startsWith("PROP-")) {
      citPatch.property_id = c.connection_type;
      citPatch.connection_type = "Domestic Metered Tap";
      c.connection_type = "Domestic Metered Tap";
    }
    if (!c.status) {
      citPatch.status = "Active";
      c.status = "Active";
    }

    if (Object.keys(citPatch).length > 0) {
      await db.collection(COLLECTIONS.CITIZENS).doc(c.id).update(citPatch);
      repairedCount++;
      console.log(`✓ Citizen ${c.id} fields normalized.`);
    }

    // 2. Find matching user account
    let u = users.find(x => x.citizen_id === c.id || x.login_id === c.id || x.id === c.user_id);

    if (!u) {
      console.warn(`Citizen ${c.id} (${c.full_name}) has NO matching user account! Creating linked login account.`);
      const newUserId = c.user_id || `usr-cit-${Date.now()}`;
      await db.collection(COLLECTIONS.USERS).doc(newUserId).set({
        id: newUserId,
        login_id: c.login_id || c.id,
        citizen_id: c.id,
        role: "citizen",
        role_title: "Citizen",
        full_name: c.full_name,
        phone: c.phone,
        email: c.email || null,
        is_active: c.status === "Active" ? 1 : 0,
        password_hash: "$2a$10$wT3x9eU.1HspuYk1K5V03.95f9o0KzLdF1eT6kQY0GzT7R6.x4JCy", // Default initial hash Citizen@123
        created_at: new Date().toISOString()
      });
      repairedCount++;
      console.log(`✓ Created user ${newUserId} for citizen ${c.id}`);
    } else {
      // User exists - check if fields are malformed (e.g. role shifted, is_active undefined)
      const userPatch = {};
      if (u.role !== "citizen" && u.role !== "admin") {
        console.log(`Repairing user ${u.id}: role was '${u.role}', fixing to 'citizen'.`);
        userPatch.role = "citizen";
        userPatch.role_title = "Citizen";
        if (c.full_name && u.full_name !== c.full_name) {
          userPatch.full_name = c.full_name;
        }
      }
      if (!u.phone && c.phone) {
        userPatch.phone = c.phone;
      }
      if (!u.citizen_id) {
        userPatch.citizen_id = c.id;
      }
      if (c.status === "Active" && (u.is_active === undefined || u.is_active === 0 || u.is_active === null)) {
        userPatch.is_active = 1;
      }
      if (u.email === c.id || u.email === u.login_id) {
        userPatch.email = null;
      }
      if (!u.login_id) {
        userPatch.login_id = c.id;
      }

      if (Object.keys(userPatch).length > 0) {
        await db.collection(COLLECTIONS.USERS).doc(u.id).update(userPatch);
        repairedCount++;
        console.log(`✓ User ${u.id} (${u.login_id || c.id}) repaired:`, Object.keys(userPatch).join(", "));
      }
    }
  }

  console.log(`Firestore account repair completed: ${repairedCount} updates applied.`);
}

async function repairMySQLAccounts() {
  console.log("\n=======================================================");
  console.log("🛠️  AUDITING & REPAIRING MYSQL CITIZEN ACCOUNTS");
  console.log("=======================================================");

  const users = await query("SELECT * FROM users");
  const citizens = await query("SELECT * FROM citizens");

  console.log(`Found ${citizens.length} citizens and ${users.length} users in MySQL.`);
  let repairedCount = 0;

  for (const c of citizens) {
    let u = users.find(x => x.citizen_id === c.id || x.login_id === c.id || x.id === c.user_id);

    if (!u) {
      console.warn(`MySQL Citizen ${c.id} (${c.full_name}) has NO matching user account! Creating linked account.`);
      const newUserId = c.user_id || `usr-cit-${Date.now()}`;
      await query(`
        INSERT INTO users (id, login_id, password_hash, role, role_title, full_name, phone, email, is_active, citizen_id)
        VALUES (?, ?, ?, 'citizen', 'Citizen', ?, ?, ?, ?, ?)
      `, [newUserId, c.id, "$2a$10$wT3x9eU.1HspuYk1K5V03.95f9o0KzLdF1eT6kQY0GzT7R6.x4JCy", c.full_name, c.phone, c.email || null, c.status === "Active" ? 1 : 0, c.id]);
      repairedCount++;
      console.log(`✓ Created MySQL user ${newUserId} for citizen ${c.id}`);
    } else {
      if (!u.citizen_id || u.citizen_id !== c.id) {
        await query("UPDATE users SET citizen_id = ? WHERE id = ?", [c.id, u.id]);
        repairedCount++;
        console.log(`✓ Fixed citizen_id link on MySQL user ${u.id}`);
      }
      if (u.role !== "citizen" && u.role !== "admin") {
        await query("UPDATE users SET role = 'citizen', role_title = 'Citizen' WHERE id = ?", [u.id]);
        repairedCount++;
        console.log(`✓ Fixed role on MySQL user ${u.id}`);
      }
    }
  }

  console.log(`MySQL account repair completed: ${repairedCount} updates applied.`);
}

async function main() {
  try {
    await repairMySQLAccounts();
    await repairFirestoreAccounts();
    console.log("\n🎉 ALL CITIZEN ACCOUNTS AUDITED & REPAIRED CLEANLY!");
    process.exit(0);
  } catch (err) {
    console.error("Account repair failed:", err);
    process.exit(1);
  }
}

main();
