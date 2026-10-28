/**
 * Safe Local Database Exporter for JalMitra Gram Panchayat Portal
 * Exports all schema and data from local MySQL to a clean SQL file.
 * This operation is strictly READ-ONLY on the source database.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../jalmitra_dump.sql");

async function exportDatabase() {
  console.log("=================================================");
  console.log("📦 Starting Read-Only Export of Local jalmitra_db");
  console.log("=================================================");

  const stream = fs.createWriteStream(outputPath, { encoding: "utf8" });

  stream.write("-- JalMitra Gram Panchayat Portal - Production SQL Dump\n");
  stream.write(`-- Generated at: ${new Date().toISOString()}\n`);
  stream.write("SET FOREIGN_KEY_CHECKS = 0;\n\n");

  const [rawTables] = await pool.query("SHOW TABLES");
  const tableNames = rawTables.map(t => Object.values(t)[0]);

  console.log(`Found ${tableNames.length} tables to export.`);

  for (const table of tableNames) {
    console.log(`Exporting table: ${table}...`);

    // 1. DDL: Create Table
    const [createResult] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    const createTableSql = createResult[0]["Create Table"];

    stream.write(`-- Table structure for table \`${table}\`\n`);
    stream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
    stream.write(`${createTableSql};\n\n`);

    // 2. Data: Insert rows
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      stream.write(`-- Dumping data for table \`${table}\` (${rows.length} rows)\n`);
      for (const row of rows) {
        const columns = Object.keys(row).map(c => `\`${c}\``).join(", ");
        const values = Object.values(row).map(v => {
          if (v === null || v === undefined) return "NULL";
          if (typeof v === "number") return v;
          if (typeof v === "boolean") return v ? 1 : 0;
          if (v instanceof Date) {
            return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          }
          // Escape strings safely
          const escaped = String(v)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/\0/g, "\\0")
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r");
          return `'${escaped}'`;
        }).join(", ");

        stream.write(`INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`);
      }
      stream.write("\n");
    }
  }

  stream.write("SET FOREIGN_KEY_CHECKS = 1;\n");
  stream.end();

  console.log(`\n✅ Database successfully exported to: ${outputPath}`);
  process.exit(0);
}

exportDatabase().catch(err => {
  console.error("❌ Export failed:", err);
  process.exit(1);
});

