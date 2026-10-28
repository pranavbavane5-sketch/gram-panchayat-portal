/**
 * JalMitra Backend - Dual Engine Database Connection (MySQL & Cloud Firestore)
 * Uses mysql2/promise for local development / cloud MySQL and Firestore for Vercel.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { executeFirestoreQuery } from "./firestoreQueryAdapter.js";
import { checkFirestoreConnection } from "./firestoreDb.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config(); // fallback

const isFirestore = () => {
  const p = (process.env.DB_PROVIDER || "").trim().toLowerCase();
  return p === "firestore";
};

// SSL & Connection Configuration for Cloud & Local MySQL
const isRemoteHost = (host) => {
  if (!host) return false;
  return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
};

const requiresSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1" ||
  (process.env.NODE_ENV === "production" && isRemoteHost(process.env.DB_HOST));

const sslConfig = requiresSsl ? { rejectUnauthorized: false } : undefined;

const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || (process.env.VERCEL ? "3" : "10"), 10);

let dbConfig;
if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  dbConfig = {
    uri,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    ...(sslConfig ? { ssl: sslConfig } : {})
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jalmitra_db",
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    ...(sslConfig ? { ssl: sslConfig } : {})
  };
}

// Create MySQL connection pool (only if not running pure Firestore)
let mysqlPool = null;

if (!isFirestore()) {
  try {
    mysqlPool = mysql.createPool(dbConfig);
  } catch (err) {
    console.error("❌ Failed to create MySQL pool:", err.message);
  }
}

/**
 * Execute a query with parameters across active database provider
 */
export async function query(sql, params = []) {
  if (isFirestore()) {
    return await executeFirestoreQuery(sql, params);
  }

  if (!mysqlPool) {
    throw new Error("MySQL database pool is not initialized. Please verify your database configuration.");
  }
  const [results] = await mysqlPool.execute(sql, params);
  return results;
}

/**
 * Test database connection
 */
export async function testConnection() {
  if (isFirestore()) {
    return await checkFirestoreConnection();
  }

  if (!mysqlPool) {
    return {
      connected: false,
      message: "MySQL pool not initialized. Check DB credentials in backend/.env"
    };
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MySQL connection attempt timed out after 3000ms")), 3000)
    );
    const connection = await Promise.race([mysqlPool.getConnection(), timeoutPromise]);
    await connection.ping();
    connection.release();
    return {
      connected: true,
      database: dbConfig.database || process.env.DB_NAME || "jalmitra_db",
      host: dbConfig.host || (process.env.DB_HOST || "cloud_mysql"),
      port: dbConfig.port || parseInt(process.env.DB_PORT || "3306", 10),
      ssl: Boolean(sslConfig)
    };
  } catch (err) {
    return {
      connected: false,
      error: err.code || "DB_ERROR",
      message: err.message
    };
  }
}

/**
 * Check if the database tables are empty, and seed sample data only if empty.
 */
export async function seedIfDatabaseEmpty() {
  if (isFirestore()) {
    return { seeded: false, reason: "Firestore active, skipping MySQL seeding" };
  }

  const connStatus = await testConnection();
  if (!connStatus.connected) {
    console.warn("⚠️ MySQL not connected yet; skipping auto-seed.");
    return { seeded: false, reason: "Database not connected" };
  }

  try {
    const [rows] = await mysqlPool.query("SELECT COUNT(*) AS count FROM water_sources");
    if (rows[0].count === 0) {
      console.log("🌱 Database is empty. Seeding initial Sundarpur village data into MySQL...");

      // 1. Village settings
      await mysqlPool.query(`
        INSERT INTO village_settings (id, village_name, district, overall_status, notice_text, last_updated, officer_name, helpline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE village_name=VALUES(village_name)
      `, [
        "current",
        "Sundarpur Gram Panchayat",
        "Jalna District, Maharashtra",
        "Low",
        "Notice: Water supply is in Rationing Mode. Please store water carefully and avoid wastage.",
        "Today at 08:30 AM",
        "Ramesh Patil (Gram Sevak)",
        "1800-120-JAL (525)"
      ]);

      // 2. Water sources
      const sources = [
        ["src-1", "Main Village Reservoir (Shivalay Talab)", "reservoir", "Reservoir / Lake", "Near Mahadev Mandir (East)", 500000, 32, "Today 07:00 AM", "Treated & Potable"],
        ["src-2", "North Falia Overhead Tank", "tank", "Overhead Tank", "Ward 1 - Behind Panchayat Bhavan", 150000, 45, "Today 07:30 AM", "Chlorinated"],
        ["src-3", "Panchayat Community Well #1", "well", "Deep Dug Well", "Ward 2 - Old Market Square", 100000, 55, "Yesterday", "Safe for Household"],
        ["src-4", "Government Borewell Station South", "well", "Borewell Station", "Ward 5 - Farm Boundary Road", 80000, 22, "Today 06:45 AM", "Filtered Ground Water"],
        ["src-5", "School Rainwater Harvest Cistern", "tank", "Harvested Storage Tank", "Ward 3 - Zilla Parishad Primary School", 70000, 58, "2 days ago", "UV Filtered"]
      ];

      for (const s of sources) {
        await mysqlPool.query(`
          INSERT INTO water_sources (id, name, type, type_label, location, total_capacity, current_level_percent, last_inspected, purity_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE current_level_percent=VALUES(current_level_percent)
        `, s);
      }

      // 3. Distribution schedules
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const schedules = [
        ["sch-1", "Ward 1 - Patel Falia (North)", today, "Today", "06:00 AM - 08:00 AM", "2 hours", "Pipeline Tap", "Completed", "Suresh Patil (9822114455)"],
        ["sch-2", "Ward 2 - Temple Chowk & Main Bazar", today, "Today", "11:30 AM - 01:30 PM", "2 hours", "Pipeline Tap", "Completed", "Ramesh Gavit (9876543210)"],
        ["sch-3", "Ward 3 - School Tola & Aanganwadi", today, "Today", "05:00 PM - 07:00 PM", "2 hours", "Pipeline Tap", "Active Now", "Ganesh Kadam (9833445566)"],
        ["sch-4", "Ward 4 - Harijan Basti / East Colony", today, "Today", "07:30 PM - 09:30 PM", "2 hours", "Water Tanker", "Upcoming", "Tanker MH-21-BK-4091"],
        ["sch-5", "Ward 5 - Farm Road & Outer Basti", tomorrow, "Tomorrow", "06:30 AM - 08:30 AM", "2 hours", "Community Well", "Tomorrow", "Suresh Patil (9822114455)"]
      ];

      for (const sch of schedules) {
        await mysqlPool.query(`
          INSERT INTO distribution_schedules (id, area, date, date_label, time_slot, duration, supply_type, status, lineman)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status=VALUES(status)
        `, sch);
      }

      // 4. Community reports
      const reports = [
        ["cmp-1", "Mohan Kadam", "9823101122", "Ward 3 - School Tola & Aanganwadi", "Pipeline Leakage", "Critical", "Severe pipe burst near Primary School gate. Potable water is pooling on the road and getting wasted.", "Dispatched"],
        ["cmp-2", "Savita Devi", "9890223344", "Ward 4 - Harijan Basti / East Colony", "Low Pressure", "Normal", "Water pressure has been negligible for 2 days. Buckets taking over 30 minutes to fill.", "Pending"],
        ["cmp-3", "Tukaram Shinde", "9765443322", "Ward 1 - Patel Falia (North)", "Broken Community Tap/Valve", "Normal", "Public tap faucet brass head broken. Replaced with emergency stopper plug.", "Resolved"]
      ];

      for (const r of reports) {
        await mysqlPool.query(`
          INSERT INTO community_reports (id, name, phone, area, problem_type, urgency, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status=VALUES(status)
        `, r);
      }

      console.log("✅ Seed data inserted successfully.");
      return { seeded: true };
    }
    return { seeded: false, reason: "Database already populated" };
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    return { seeded: false, error: err.message };
  }
}

/**
 * Reset database to default sample data
 */
export async function resetDatabaseToSample() {
  if (isFirestore()) {
    return { reset: false, message: "Reset not available in Firestore production mode" };
  }
  await mysqlPool.query("DELETE FROM community_reports");
  await mysqlPool.query("DELETE FROM distribution_schedules");
  await mysqlPool.query("DELETE FROM water_sources");
  await mysqlPool.query("DELETE FROM village_settings");
  return await seedIfDatabaseEmpty();
}

/**
 * Universal pool wrapper compatible with both MySQL and Cloud Firestore
 */
const universalPool = {
  async query(sql, params) {
    const res = await query(sql, params);
    return [res, []];
  },
  async execute(sql, params) {
    const res = await query(sql, params);
    return [res, []];
  },
  async getConnection() {
    if (isFirestore()) {
      return {
        ping: async () => true,
        release: () => {}
      };
    }
    return await mysqlPool.getConnection();
  }
};

export default universalPool;
