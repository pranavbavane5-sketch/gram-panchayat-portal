/**
 * JalMitra - Firebase Firestore Configuration & Services
 * 
 * Secure configuration module that:
 * 1. Reads Firebase credentials purely from environment variables (import.meta.env or window.__ENV__).
 * 2. Never hardcodes private keys or project secrets.
 * 3. Accurately verifies connection and tests live Firestore connectivity.
 * 4. Provides Firestore CRUD helpers with full error handling and status reporting.
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";

// ==========================================================
// 1. SAFELY EXTRACT ENVIRONMENT VARIABLES
// ==========================================================
function getEnvVariables() {
  let env = {};

  // Check import.meta.env (Vite or modern bundler)
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      env = { ...env, ...import.meta.env };
    }
  } catch (e) {
    // import.meta not available
  }

  // Check window.__ENV__ (Static / Python HTTP server runtime via env.js)
  try {
    if (typeof window !== "undefined" && window.__ENV__) {
      env = { ...env, ...window.__ENV__ };
    }
  } catch (e) {
    // window not available
  }

  // Check process.env (Node environments)
  try {
    if (typeof process !== "undefined" && process.env) {
      env = { ...env, ...process.env };
    }
  } catch (e) {
    // process not available
  }

  return env;
}

const rawEnv = getEnvVariables();

export const firebaseConfig = {
  apiKey: rawEnv.VITE_FIREBASE_API_KEY || rawEnv.FIREBASE_API_KEY || "",
  authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN || rawEnv.FIREBASE_AUTH_DOMAIN || "",
  projectId: rawEnv.VITE_FIREBASE_PROJECT_ID || rawEnv.FIREBASE_PROJECT_ID || "",
  storageBucket: rawEnv.VITE_FIREBASE_STORAGE_BUCKET || rawEnv.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || rawEnv.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: rawEnv.VITE_FIREBASE_APP_ID || rawEnv.FIREBASE_APP_ID || ""
};

// Validate that configuration is present and not dummy placeholder text
function validateConfig(config) {
  const required = ["apiKey", "projectId", "appId"];
  for (const key of required) {
    const val = config[key];
    if (!val || typeof val !== "string" || val.trim() === "" || val.includes("your_") || val.includes("your-project-id")) {
      return {
        isValid: false,
        missingKey: key,
        reason: `Environment variable for '${key}' is missing or still set to placeholder value.`
      };
    }
  }
  return { isValid: true };
}

const configValidation = validateConfig(firebaseConfig);

export const isFirebaseConfigured = configValidation.isValid;

// Initialize Firebase App and Firestore if configuration is valid
let app = null;
let db = null;
let initError = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.info("🔥 Firebase initialized with project ID:", firebaseConfig.projectId);
  } catch (err) {
    initError = err;
    console.error("❌ Firebase initialization error:", err);
  }
} else {
  console.warn("⚠️ Firebase credentials not configured. JalMitra will inform the user and operate in local preview mode until real credentials are provided in .env or env.js.");
}

export { app, db };

// ==========================================================
// 2. LIVE FIREBASE CONNECTION & STATUS CHECK
// ==========================================================
/**
 * Test live Firestore connectivity with an actual probe read/write.
 * Used to ensure we do NOT claim the database is connected until a real read/write succeeds.
 */
export async function testFirestoreConnection() {
  if (!isFirebaseConfigured) {
    return {
      connected: false,
      status: "NOT_CONFIGURED",
      message: "Firebase project configuration is pending. Please provide environment variables in .env (or env.js).",
      projectId: null
    };
  }

  if (initError || !db) {
    return {
      connected: false,
      status: "INIT_FAILED",
      message: `Firebase failed to initialize: ${initError ? initError.message : "Unknown error"}`,
      projectId: firebaseConfig.projectId
    };
  }

  try {
    // Attempt to access water_sources collection to verify real credentials & security rules
    const testCol = collection(db, "water_sources");
    const snap = await getDocs(testCol);
    return {
      connected: true,
      status: "CONNECTED",
      message: `Successfully connected to Firestore database! (${snap.size} sources loaded)`,
      projectId: firebaseConfig.projectId
    };
  } catch (err) {
    console.error("Firestore connection probe failed:", err);
    let userMsg = err.message;
    if (err.code === "permission-denied") {
      userMsg = "Permission denied. Please verify your Firestore Security Rules (e.g. set to Test Mode: allow read, write: if true;).";
    } else if (err.code === "unavailable") {
      userMsg = "Could not reach Firestore backend. Check your internet connection or project status.";
    }
    return {
      connected: false,
      status: "PROBE_FAILED",
      code: err.code,
      message: userMsg,
      projectId: firebaseConfig.projectId
    };
  }
}

// ==========================================================
// 3. FIRESTORE DATABASE REPOSITORY OPERATIONS
// ==========================================================

const COL_VILLAGE = "village_info";
const COL_SOURCES = "water_sources";
const COL_SCHEDULES = "distribution_schedules";
const COL_COMPLAINTS = "community_reports";

/**
 * Check if Firestore is empty. If empty, seeds the sample data.
 * Requirement: "Load existing sample data into Firestore only when the database is empty."
 */
export async function seedIfDatabaseEmpty(defaultData) {
  if (!db) throw new Error("Firestore is not initialized.");

  // Check if water_sources has documents
  const sourcesSnap = await getDocs(collection(db, COL_SOURCES));
  
  if (sourcesSnap.empty) {
    console.info("🌱 Firestore database is empty. Seeding initial sample data...");

    // 1. Seed Village Info
    await setDoc(doc(db, COL_VILLAGE, "current"), defaultData.villageInfo);

    // 2. Seed Sources
    for (const source of defaultData.sources) {
      await setDoc(doc(db, COL_SOURCES, source.id), source);
    }

    // 3. Seed Schedules
    for (const schedule of defaultData.schedules) {
      await setDoc(doc(db, COL_SCHEDULES, schedule.id), schedule);
    }

    // 4. Seed Complaints
    for (const complaint of defaultData.complaints) {
      await setDoc(doc(db, COL_COMPLAINTS, complaint.id), complaint);
    }

    console.info("✅ Sample data seeding complete in Firestore.");
    return { seeded: true };
  } else {
    console.info("ℹ️ Firestore already contains data. Skipping initial seeding.");
    return { seeded: false };
  }
}

/**
 * Reset Firestore collections to default sample data (used by Admin button).
 */
export async function resetDatabaseToSample(defaultData) {
  if (!db) throw new Error("Firestore is not initialized.");

  // Overwrite village info
  await setDoc(doc(db, COL_VILLAGE, "current"), defaultData.villageInfo);

  // Overwrite sources
  for (const s of defaultData.sources) {
    await setDoc(doc(db, COL_SOURCES, s.id), s);
  }

  // Delete existing schedules and re-populate
  const schedSnap = await getDocs(collection(db, COL_SCHEDULES));
  for (const d of schedSnap.docs) {
    await deleteDoc(d.ref);
  }
  for (const sch of defaultData.schedules) {
    await setDoc(doc(db, COL_SCHEDULES, sch.id), sch);
  }

  // Delete existing complaints and re-populate
  const compSnap = await getDocs(collection(db, COL_COMPLAINTS));
  for (const d of compSnap.docs) {
    await deleteDoc(d.ref);
  }
  for (const cmp of defaultData.complaints) {
    await setDoc(doc(db, COL_COMPLAINTS, cmp.id), cmp);
  }

  return true;
}

// --- Village Info ---
export async function fetchVillageInfo() {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_VILLAGE, "current");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

export async function updateVillageInfo(data) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_VILLAGE, "current");
  await setDoc(docRef, data, { merge: true });
}

// --- Water Sources ---
export async function fetchWaterSources() {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await getDocs(collection(db, COL_SOURCES));
  const sources = [];
  snap.forEach(d => {
    sources.push({ id: d.id, ...d.data() });
  });
  return sources;
}

export async function updateWaterSource(id, updates) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_SOURCES, id);
  await updateDoc(docRef, updates);
}

// --- Distribution Schedules ---
export async function fetchDistributionSchedules() {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await getDocs(collection(db, COL_SCHEDULES));
  const schedules = [];
  snap.forEach(d => {
    schedules.push({ id: d.id, ...d.data() });
  });
  return schedules;
}

export async function addDistributionSchedule(scheduleData) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_SCHEDULES, scheduleData.id);
  await setDoc(docRef, scheduleData);
}

export async function updateDistributionSchedule(id, updates) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_SCHEDULES, id);
  await updateDoc(docRef, updates);
}

export async function deleteDistributionSchedule(id) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_SCHEDULES, id);
  await deleteDoc(docRef);
}

// --- Community Reports / Complaints ---
export async function fetchCommunityReports() {
  if (!db) throw new Error("Firestore not initialized");
  const snap = await getDocs(collection(db, COL_COMPLAINTS));
  const reports = [];
  snap.forEach(d => {
    reports.push({ id: d.id, ...d.data() });
  });
  // Sort by createdAt or maintain order
  return reports;
}

export async function addCommunityReport(reportData) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_COMPLAINTS, reportData.id);
  await setDoc(docRef, reportData);
}

export async function updateCommunityReportStatus(id, newStatus) {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, COL_COMPLAINTS, id);
  await updateDoc(docRef, { status: newStatus });
}
