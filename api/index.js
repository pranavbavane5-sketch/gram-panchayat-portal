/**
 * Vercel Serverless Function Handler for Gram Panchayat Portal API
 * Bridges incoming Vercel serverless requests to the Express application.
 */
import app from "../backend/server.js";

export default function handler(req, res) {
  // Ensure req.url has /api prefix for Express routing if stripped by rewrites
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  return app(req, res);
}
