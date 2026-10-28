/**
 * JalMitra - Authentication & Authorization Middleware
 */

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "jalmitra_super_secure_jwt_secret_token_2026_xyz";

/**
 * Generate a signed JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      loginId: user.login_id,
      role: user.role,
      citizenId: user.citizen_id || null,
      fullName: user.full_name,
      phone: user.phone || ""
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Authentication Middleware
 * Enforces valid JWT token in Authorization: Bearer <token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Access token is required. Please log in to proceed."
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Invalid or expired session token. Please log in again."
      });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Role-Based Access Control Middleware
 * Example: requireRole(['admin']) or requireRole(['citizen', 'admin'])
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Access denied. This action requires role: ${allowedRoles.join(" or ")}.`
      });
    }
    next();
  };
}

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid token is present, but allows guest access
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
}
