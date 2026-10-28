/**
 * Vercel Serverless Function Handler for Gram Panchayat Portal API
 * Bridges incoming Vercel serverless requests to the Express application.
 */
import app from "../backend/server.js";

export default function handler(req, res) {
  // If Vercel rewrote URL to /api/index.js or function filename, restore actual request path
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-invoke-path"];
  if (matchedPath && matchedPath.startsWith("/api")) {
    req.url = matchedPath;
  } else if (req.url && (req.url.startsWith("/api/index.js") || req.url === "/api/index")) {
    const rawPath = req.url.replace(/^\/api\/index(\.js)?/, "");
    req.url = rawPath ? (rawPath.startsWith("/") ? "/api" + rawPath : "/api/" + rawPath) : "/api/health";
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + req.url;
  }
  return app(req, res);
}
