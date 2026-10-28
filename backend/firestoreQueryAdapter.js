/**
 * JalMitra - Firestore SQL-to-NoSQL Compatibility Adapter
 * 
 * Provides fallback translation of SQL queries to Cloud Firestore collection operations
 * when DB_PROVIDER=firestore is enabled in production (Vercel).
 * Guarantees zero ECONNREFUSED errors and full route compatibility.
 */

import { getFirestoreDb, COLLECTIONS } from "./firestoreDb.js";
import { userRepo } from "./repositories/userRepo.js";
import { villageRepo } from "./repositories/villageRepo.js";
import { serviceRepo } from "./repositories/serviceRepo.js";
import { waterSourceRepo } from "./repositories/waterSourceRepo.js";
import { scheduleRepo } from "./repositories/scheduleRepo.js";
import { communityRepo } from "./repositories/communityRepo.js";
import { propertyRepo } from "./repositories/propertyRepo.js";
import { citizenRepo } from "./repositories/citizenRepo.js";
import { billingRepo } from "./repositories/billingRepo.js";
import { waterTankRepo } from "./repositories/waterTankRepo.js";
import { panchayatRepo } from "./repositories/panchayatRepo.js";
import { auditRepo } from "./repositories/auditRepo.js";

function getCollectionRef(tableName) {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error(
      "Cloud Firestore is active (DB_PROVIDER=firestore) but credentials are not configured. " +
      "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  const cleanTable = tableName.toLowerCase().replace(/[`"']/g, "").trim();
  const collectionName = COLLECTIONS[cleanTable.toUpperCase()] || cleanTable;
  return db.collection(collectionName);
}

export async function executeFirestoreQuery(sql, params = []) {
  const trimmed = sql.trim().replace(/\s+/g, " ");

  // 1. VILLAGE SETTINGS
  if (/FROM village_settings/i.test(trimmed)) {
    if (/^SELECT/i.test(trimmed)) {
      const s = await villageRepo.getSettings();
      return s ? [s] : [];
    }
  }

  // 2. USERS
  if (/FROM users/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    // SELECT ... WHERE login_id = ? OR phone = ?
    if (/login_id\s*=\s*\?\s*OR\s*phone\s*=\s*\?/i.test(trimmed) || /id\s*=\s*\?\s*OR\s*login_id\s*=\s*\?/i.test(trimmed)) {
      const u = await userRepo.findByLoginOrPhone(params[0] || params[1]);
      return u ? [u] : [];
    }
    // SELECT ... WHERE id = ?
    if (/WHERE id\s*=\s*\?/i.test(trimmed) || /WHERE id\s*=\s*\?\s*LIMIT/i.test(trimmed)) {
      const u = await userRepo.findById(params[0]);
      return u ? [u] : [];
    }
    // SELECT id FROM users WHERE phone = ?
    if (/WHERE phone\s*=\s*\?/i.test(trimmed)) {
      const coll = getCollectionRef("users");
      const snap = await coll.where("phone", "==", String(params[0])).limit(1).get();
      if (snap.empty) return [];
      return [{ id: snap.docs[0].id, ...snap.docs[0].data() }];
    }
    // COUNT
    if (/COUNT\(\*\)/i.test(trimmed)) {
      const count = await userRepo.count();
      return [{ count }];
    }
  }

  // 3. CITIZENS
  if (/FROM citizens/i.test(trimmed)) {
    if (/COUNT\(\*\)/i.test(trimmed)) {
      const count = await citizenRepo.count();
      return [{ count }];
    }
    if (/LEFT JOIN properties/i.test(trimmed) && /c\.id\s*=\s*\?/i.test(trimmed)) {
      const profile = await citizenRepo.getProfileWithProperty(params[0]);
      return profile ? [profile] : [];
    }
    if (/WHERE id\s*=\s*\?/i.test(trimmed) || /WHERE id\s*=\s*\?\s*LIMIT/i.test(trimmed)) {
      const c = await citizenRepo.getById(params[0]);
      return c ? [c] : [];
    }
    if (/WHERE phone\s*=\s*\?/i.test(trimmed)) {
      const c = await citizenRepo.getByPhone(params[0]);
      return c ? [c] : [];
    }
    if (/^SELECT \* FROM citizens ORDER BY/i.test(trimmed) || /^SELECT \* FROM citizens$/i.test(trimmed)) {
      return await citizenRepo.getAll();
    }
  }

  // 4. PROPERTIES
  if (/FROM properties/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/COUNT\(\*\)/i.test(trimmed)) {
      const count = await propertyRepo.count();
      return [{ count }];
    }
    if (/WHERE property_number\s*=\s*\?/i.test(trimmed)) {
      const p = await propertyRepo.getByPropertyNumber(params[0]);
      return p ? [p] : [];
    }
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const p = await propertyRepo.getById(params[0]);
      return p ? [p] : [];
    }
    if (/WHERE owner_citizen_id\s*=\s*\?/i.test(trimmed)) {
      const p = await propertyRepo.getByOwnerCitizenId(params[0]);
      return p ? [p] : [];
    }
    return await propertyRepo.getAll();
  }

  // 5. GP_SERVICES
  if (/FROM gp_services/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    const enabledOnly = /is_enabled\s*=\s*1/i.test(trimmed);
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const s = await serviceRepo.getById(params[0]);
      return s ? [s] : [];
    }
    return await serviceRepo.getAll(enabledOnly);
  }

  // 6. WATER_SOURCES
  if (/FROM water_sources/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/COUNT\(\*\)/i.test(trimmed)) {
      const count = await waterSourceRepo.count();
      return [{ count }];
    }
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const s = await waterSourceRepo.getById(params[0]);
      return s ? [s] : [];
    }
    return await waterSourceRepo.getAll();
  }

  // 7. WATER_TANKS & MONITORING
  if (/FROM water_tanks/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE is_active\s*=\s*1/i.test(trimmed)) {
      return await waterTankRepo.getAllTanks(true);
    }
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const t = await waterTankRepo.getTankById(params[0]);
      return t ? [t] : [];
    }
    return await waterTankRepo.getAllTanks(false);
  }

  if (/FROM water_level_alerts/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/COUNT\(\*\)/i.test(trimmed) && /is_acknowledged\s*=\s*0/i.test(trimmed)) {
      const summary = await waterTankRepo.getSummary();
      return [{ count: summary.activeAlertsCount }];
    }
    const unack = /is_acknowledged\s*=\s*0/i.test(trimmed);
    return await waterTankRepo.getAlerts(unack);
  }

  if (/FROM water_level_readings/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE tank_id\s*=\s*\?/i.test(trimmed)) {
      const limit = params[1] || 50;
      return await waterTankRepo.getReadings(params[0], limit);
    }
  }

  // 8. BILLING, PAYMENTS & TAXES
  if (/FROM water_bills/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE citizen_id\s*=\s*\?/i.test(trimmed)) {
      return await billingRepo.getBillsByCitizenId(params[0]);
    }
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const b = await billingRepo.getBillById(params[0]);
      return b ? [b] : [];
    }
    return await billingRepo.getAllBills();
  }

  if (/FROM payments/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE p\.citizen_id\s*=\s*\?/i.test(trimmed) || /WHERE citizen_id\s*=\s*\?/i.test(trimmed)) {
      return await billingRepo.getPaymentsByCitizenId(params[0]);
    }
    return await billingRepo.getAllPayments();
  }

  if (/FROM taxes_charges/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE citizen_id\s*=\s*\?/i.test(trimmed)) {
      return await billingRepo.getTaxesByCitizenId(params[0]);
    }
    return await billingRepo.getAllTaxes();
  }

  // 9. COMMUNITY REPORTS / GRIEVANCES
  if (/FROM community_reports/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE citizen_id\s*=\s*\?\s*OR\s*phone\s*=\s*\?/i.test(trimmed)) {
      return await communityRepo.getByCitizenOrPhone(params[0], params[1]);
    }
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const r = await communityRepo.getById(params[0]);
      return r ? [r] : [];
    }
    return await communityRepo.getAll();
  }

  // 10. DISTRIBUTION SCHEDULES
  if (/FROM distribution_schedules/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE id\s*=\s*\?/i.test(trimmed)) {
      const s = await scheduleRepo.getById(params[0]);
      return s ? [s] : [];
    }
    return await scheduleRepo.getAll();
  }

  // 11. APPLICATIONS & NOTICES
  if (/FROM applications/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE id\s*=\s*\?\s*OR\s*reference_no\s*=\s*\?/i.test(trimmed) || /WHERE reference_no\s*=\s*\?/i.test(trimmed)) {
      const a = await panchayatRepo.getApplicationById(params[0]);
      return a ? [a] : [];
    }
    return await panchayatRepo.getAllApplications();
  }

  if (/FROM application_history/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    if (/WHERE application_id\s*=\s*\?/i.test(trimmed)) {
      return await panchayatRepo.getApplicationHistory(params[0]);
    }
  }

  if (/FROM public_notices/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    const active = /WHERE is_active\s*=\s*1/i.test(trimmed);
    return await panchayatRepo.getNotices(active);
  }

  if (/FROM gram_panchayat_tasks/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    return await panchayatRepo.getTasks();
  }

  // 12. ADMIN AUDIT LOGS
  if (/FROM admin_audit_logs/i.test(trimmed) && /^SELECT/i.test(trimmed)) {
    return await auditRepo.getLogs(params[0] || 100);
  }

  // --- GENERIC INSERT ---
  const insertMatch = trimmed.match(/^INSERT INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const tableName = insertMatch[1];
    const columns = insertMatch[2].split(",").map(c => c.trim().replace(/[`"']/g, ""));
    const record = {};
    columns.forEach((col, idx) => {
      if (params[idx] !== undefined) {
        record[col] = params[idx];
      }
    });

    const docId = record.id || `${tableName.slice(0, 3)}-${Date.now()}`;
    record.id = docId;

    const coll = getCollectionRef(tableName);
    await coll.doc(docId).set(record);
    return { insertId: docId, affectedRows: 1 };
  }

  // --- GENERIC UPDATE ---
  const updateMatch = trimmed.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/i);
  if (updateMatch) {
    const tableName = updateMatch[1];
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3];

    const assignments = setClause.split(",").map(a => a.trim().split("=")[0].trim().replace(/[`"']/g, ""));
    const patch = {};
    assignments.forEach((col, idx) => {
      if (params[idx] !== undefined) {
        patch[col] = params[idx];
      }
    });

    // Extract WHERE id = ?
    const whereParam = params[assignments.length];
    const coll = getCollectionRef(tableName);

    if (whereClause.toLowerCase().includes("id =") && whereParam) {
      await coll.doc(String(whereParam)).update(patch);
      return { affectedRows: 1 };
    }

    return { affectedRows: 0 };
  }

  // --- GENERIC DELETE ---
  const deleteMatch = trimmed.match(/^DELETE FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+id\s*=\s*\?/i);
  if (deleteMatch) {
    const tableName = deleteMatch[1];
    const docId = params[0];
    if (docId) {
      const coll = getCollectionRef(tableName);
      await coll.doc(String(docId)).delete();
      return { affectedRows: 1 };
    }
  }

  console.warn("⚠️ Unhandled SQL in Firestore Adapter:", trimmed);
  return [];
}

