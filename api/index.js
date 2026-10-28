/**
 * Vercel Serverless Function Handler for Gram Panchayat Portal API
 * Bridges incoming Vercel serverless requests to the Express application.
 */
import app from "../backend/server.js";

export default function handler(req, res) {
  try {
    const rawTarget = req.headers["x-matched-path"] || req.headers["x-invoke-path"] || req.url || "/api/health";
    const parsed = new URL(rawTarget, "http://localhost");

    // Remove Vercel's rewrite query parameter (:match*)
    parsed.searchParams.delete("match");
    const cleanSearch = parsed.search ? parsed.search : "";
    let cleanPath = parsed.pathname;

    if (cleanPath.startsWith("/api/index")) {
      cleanPath = cleanPath.replace(/^\/api\/index(\.js)?/, "");
      if (!cleanPath) cleanPath = "/health";
    }

    if (cleanPath.startsWith("/api")) {
      req.url = cleanPath + cleanSearch;
    } else {
      req.url = (cleanPath.startsWith("/") ? "/api" + cleanPath : "/api/" + cleanPath) + cleanSearch;
    }
  } catch (err) {
    if (req.url && !req.url.startsWith("/api")) {
      req.url = "/api" + req.url;
    }
  }

  return app(req, res);
}
