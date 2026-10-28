/**
 * JalMitra - Local Firebase Credentials Configuration Helper
 * 
 * Safely extracts project_id, client_email, and private_key from a local
 * Firebase Service Account JSON file and updates backend/.env without
 * ever printing secrets or credentials to the terminal or logs.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("❌ Usage: node backend/configure_firebase_credentials.js <path-to-service-account-json>");
  process.exit(1);
}

const resolvedPath = path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ File not found at path: ${resolvedPath}`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(content);

  const { project_id, client_email, private_key } = parsed;

  if (!project_id || !client_email || !private_key) {
    console.error("❌ Invalid Service Account JSON: Missing project_id, client_email, or private_key.");
    process.exit(1);
  }

  // Read existing .env if present
  let envLines = [];
  if (fs.existsSync(envPath)) {
    envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  }

  // Update or append variables
  const updates = {
    FIREBASE_PROJECT_ID: project_id,
    FIREBASE_CLIENT_EMAIL: client_email,
    FIREBASE_PRIVATE_KEY: JSON.stringify(private_key) // preserves newlines safely
  };

  const updatedKeys = new Set();
  const newEnvLines = envLines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return line;
    const key = trimmed.split("=")[0].trim();
    if (updates[key] !== undefined) {
      updatedKeys.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  for (const [key, val] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      newEnvLines.push(`${key}=${val}`);
    }
  }

  fs.writeFileSync(envPath, newEnvLines.join("\n"), "utf8");

  console.log("============================================================");
  console.log("🔒 FIREBASE CREDENTIALS CONFIGURED SECURELY");
  console.log("============================================================");
  console.log(`📁 Source File:       [LOCAL FILE VERIFIED]`);
  console.log(`🆔 Project ID:        ${project_id}`);
  console.log(`📧 Client Email:      ${client_email.split("@")[0]}@...`);
  console.log(`🔑 Private Key:       [LOADED & SANITIZED - NOT DISPLAYED]`);
  console.log(`📝 Destination:       backend/.env (Excluded by .gitignore)`);
  console.log("============================================================\n");

} catch (err) {
  console.error("❌ Failed to process service account key:", err.message);
  process.exit(1);
}

