/**
 * Vercel Serverless Function Handler for Gram Panchayat Portal API
 * Bridges incoming Vercel serverless requests to the Express application.
 */
import app from "../backend/server.js";

let migrated = false;

export default async function handler(req, res) {
  // Ensure req.url has /api prefix for Express routing if stripped by rewrites
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }

  // Attempt database migrations once during container initialization
  if (!migrated) {
    try {
      const { seedIfDatabaseEmpty } = await import("../backend/db.js");
      const { runMigrations } = await import("../backend/migrate.js");
      await seedIfDatabaseEmpty();
      await runMigrations();
      migrated = true;
    } catch (e) {
      // Defer if database is not reachable yet
    }
  }

  return app(req, res);
}
