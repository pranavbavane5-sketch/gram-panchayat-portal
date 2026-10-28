/**
 * JalMitra - Base Repository Utilities
 * Provides dual-mode abstraction bridging Cloud Firestore and MySQL.
 */

import { query } from "../db.js";
import { getFirestoreDb, COLLECTIONS } from "../firestoreDb.js";

export function isFirestore() {
  return process.env.DB_PROVIDER === "firestore";
}

export function getDb() {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error(
      "Cloud Firestore is selected (DB_PROVIDER=firestore) but credentials are not configured. " +
      "Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }
  return db;
}

export function docToData(docSnap) {
  if (!docSnap || !docSnap.exists) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export function docsToArray(querySnap) {
  if (!querySnap || querySnap.empty) return [];
  const list = [];
  querySnap.forEach(d => {
    list.push({ id: d.id, ...d.data() });
  });
  return list;
}

export function cleanUndefined(obj) {
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export { query as mysqlQuery, COLLECTIONS };

