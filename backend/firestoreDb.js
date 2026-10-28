/**
 * JalMitra Backend - Firebase Cloud Firestore Database Adapter
 * 
 * Provides:
 * 1. Safe, non-crashing initialization from environment variables or service account.
 * 2. Credential sanitization (handles escaped \n in private keys).
 * 3. Health & connectivity probe for Firestore status reporting.
 * 4. Domain repository helpers mapping NoSQL collections to existing portal schemas.
 * 5. Does NOT interfere with the existing MySQL database connection.
 */

import admin from "firebase-admin";
import { cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

let firestoreInstance = null;
let firebaseAppInstance = null;
let initStatus = {
  isConfigured: false,
  status: "NOT_CONFIGURED",
  message: "Firebase credentials not provided. Backend defaults to MySQL.",
  projectId: null,
  error: null
};

function makeCert(config) {
  if (typeof cert === "function") return cert(config);
  if (typeof admin.cert === "function") return admin.cert(config);
  if (admin.credential && typeof admin.credential.cert === "function") return admin.credential.cert(config);
  throw new Error("Unable to locate cert helper in firebase-admin SDK");
}

/**
 * Safely parse and format Firebase Service Account Credentials
 */
function resolveCredentials() {
  try {
    // Option 1: Discrete Environment Variables (Recommended for Vercel & Production)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Strip surrounding quotes if present from env string
      privateKey = String(privateKey).trim();
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
      }
      // Sanitize escaped newlines (Vercel env vars often escape \n to \\n)
      if (privateKey.includes("\\n")) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }
      return {
        type: "discrete",
        projectId,
        credential: makeCert({
          projectId,
          clientEmail,
          privateKey
        })
      };
    }

    // Option 2: Full JSON string in FIREBASE_SERVICE_ACCOUNT
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson && typeof serviceAccountJson === "string") {
      try {
        const parsed = JSON.parse(serviceAccountJson);
        if (parsed.private_key && parsed.private_key.includes("\\n")) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        }
        return {
          type: "json_string",
          projectId: parsed.project_id,
          credential: makeCert(parsed)
        };
      } catch (parseErr) {
        console.warn("⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON string:", parseErr.message);
      }
    }

    // Option 3: Local file via GOOGLE_APPLICATION_CREDENTIALS (development only)
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      const resolvedPath = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
      if (fs.existsSync(resolvedPath)) {
        try {
          const fileContent = fs.readFileSync(resolvedPath, "utf8");
          const parsed = JSON.parse(fileContent);
          return {
            type: "file",
            projectId: parsed.project_id,
            credential: makeCert(parsed)
          };
        } catch (fileErr) {
          console.warn("⚠️ Failed to load credentials from file:", fileErr.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ resolveCredentials error:", err.message);
  }

  return null;
}

/**
 * Initialize Firebase Admin SDK
 */
export function initFirestore() {
  if (firestoreInstance) return firestoreInstance;

  const creds = resolveCredentials();

  if (!creds) {
    initStatus = {
      isConfigured: false,
      status: "NOT_CONFIGURED",
      message: "Firebase credentials not provided. Backend defaults to MySQL.",
      projectId: null,
      error: null
    };
    return null;
  }

  try {
    // Check if an app is already initialized to prevent duplicate app errors in serverless
    const existingApps = typeof admin.getApps === "function" ? admin.getApps() : (admin.apps || []);
    if (existingApps.length > 0) {
      firebaseAppInstance = typeof admin.getApp === "function" ? admin.getApp() : admin.app();
    } else {
      firebaseAppInstance = admin.initializeApp({
        credential: creds.credential,
        projectId: creds.projectId
      });
    }

    firestoreInstance = getFirestore(firebaseAppInstance);
    // Ignore undefined properties to avoid Firestore write exceptions
    firestoreInstance.settings({ ignoreUndefinedProperties: true });

    initStatus = {
      isConfigured: true,
      status: "INITIALIZED",
      message: "Firebase Admin SDK initialized successfully.",
      projectId: creds.projectId,
      error: null
    };

    console.log(`🔥 Firebase Admin SDK initialized for project: ${creds.projectId}`);
    return firestoreInstance;
  } catch (err) {
    initStatus = {
      isConfigured: false,
      status: "INIT_ERROR",
      message: `Firebase Admin initialization error: ${err.message}`,
      projectId: creds ? creds.projectId : null,
      error: err.message
    };
    console.error("❌ Failed to initialize Firebase Admin SDK:", err.message);
    return null;
  }
}

/**
 * Get the Firestore database instance (or null if unconfigured)
 */
export function getFirestoreDb() {
  if (!firestoreInstance) {
    return initFirestore();
  }
  return firestoreInstance;
}

/**
 * Check initialization and connection status without exposing secrets
 */
export async function checkFirestoreConnection() {
  if (!firestoreInstance) {
    initFirestore();
  }

  if (!initStatus.isConfigured || !firestoreInstance) {
    return {
      connected: false,
      provider: "firestore",
      status: initStatus.status,
      message: initStatus.message,
      projectId: initStatus.projectId
    };
  }

  try {
    // Execute a read probe against village_settings/current with a 4000ms safety timeout
    const docRef = firestoreInstance.collection("village_settings").doc("current");
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Probe request timed out after 4000ms. Check if Cloud Firestore database has been created in Firebase Console.")), 4000);
    });
    const snapshot = await Promise.race([docRef.get(), timeoutPromise]);

    return {
      connected: true,
      provider: "firestore",
      status: "CONNECTED",
      message: "Connected to Google Cloud Firestore successfully.",
      projectId: initStatus.projectId,
      exists: snapshot.exists
    };
  } catch (probeErr) {
    return {
      connected: false,
      provider: "firestore",
      status: "CONNECTION_FAILED",
      message: `Firestore probe failed: ${probeErr.message}`,
      projectId: initStatus.projectId
    };
  }
}

/**
 * Standard Firestore Collection Names Mapped from MySQL Schema
 */
export const COLLECTIONS = {
  USERS: "users",
  CITIZENS: "citizens",
  PROPERTIES: "properties",
  WATER_BILLS: "water_bills",
  PAYMENTS: "payments",
  TAXES_CHARGES: "taxes_charges",
  COMMUNITY_REPORTS: "community_reports",
  DISTRIBUTION_SCHEDULES: "distribution_schedules",
  WATER_SOURCES: "water_sources",
  WATER_TANKS: "water_tanks",
  WATER_LEVEL_READINGS: "water_level_readings",
  WATER_DISTRIBUTION_RECORDS: "water_distribution_records",
  WATER_LEVEL_ALERTS: "water_level_alerts",
  APPLICATIONS: "applications",
  APPLICATION_HISTORY: "application_history",
  GRAM_PANCHAYAT_TASKS: "gram_panchayat_tasks",
  PUBLIC_NOTICES: "public_notices",
  VILLAGE_SETTINGS: "village_settings",
  GP_SERVICES: "gp_services",
  ADMIN_AUDIT_LOGS: "admin_audit_logs"
};

export default {
  initFirestore,
  getFirestoreDb,
  checkFirestoreConnection,
  COLLECTIONS
};

