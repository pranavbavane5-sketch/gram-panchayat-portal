/**
 * Vercel Serverless Function Handler for Gram Panchayat Portal API
 * Bridges incoming Vercel serverless requests to the Express application.
 */

export default async function handler(req, res) {
  try {
    const { default: app } = await import("../backend/server.js");
    if (req.url && !req.url.startsWith("/api")) {
      req.url = "/api" + req.url;
    }
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Initialization Error:", err);
    return res.status(500).json({
      error: "Serverless Initialization Error",
      message: err.message,
      stack: err.stack
    });
  }
}
