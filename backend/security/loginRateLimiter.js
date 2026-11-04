/**
 * JalMitra - Server-Side Login Rate Limiter & Brute-Force Protection
 * 
 * Implements:
 * 1. IP-level rate limiting: Max 5 failed attempts per IP within a 15-minute sliding window.
 * 2. Per-account rate limiting: Max 5 failed attempts per account within 15 minutes.
 * 3. 15-minute temporary lockout (HTTP 429 Too Many Requests) with Retry-After header.
 * 4. Bilingual error messaging in English and Marathi.
 * 5. Attack mitigation: Successful login resets the account counter, but resets the IP
 *    counter ONLY IF the IP attempted no other accounts (preventing attacker reset evasion).
 * 6. Dual-driver persistence: Atomic Firestore transactions in production, MySQL in local dev,
 *    with a local in-memory fallback if the database connection fails.
 * 7. Privacy & Security: Zero credential logging and no account enumeration.
 */

import { isFirestore, getDb, mysqlQuery, COLLECTIONS } from "../repositories/baseRepo.js";

export const RATE_LIMIT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000,        // 15 minutes
  BLOCK_DURATION_MS: 15 * 60 * 1000  // 15 minutes
};

// Fallback in-memory store if database is unreachable or for isolated unit tests
const memoryStore = new Map();

// Periodic prune to prevent unbounded memory growth in long-running processes
if (typeof setInterval !== "undefined") {
  const pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore.entries()) {
      const blockedUntil = Number(v?.blocked_until || 0);
      const lastFailedAt = Number(v?.last_failed_at || 0);
      if (blockedUntil < now && (now - lastFailedAt) > RATE_LIMIT_CONFIG.WINDOW_MS) {
        memoryStore.delete(k);
      }
    }
  }, 5 * 60 * 1000);
  if (pruneTimer.unref) pruneTimer.unref();
}

/**
 * Safely extracts client IP address respecting Express trusted reverse proxies
 */
export function getClientIp(req) {
  if (!req) return "127.0.0.1";
  let ip = req.ip || req.headers?.["x-forwarded-for"] || req.connection?.remoteAddress || req.socket?.remoteAddress || "127.0.0.1";
  if (typeof ip === "string" && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  if (typeof ip === "string") {
    ip = ip.trim();
    if (ip.startsWith("::ffff:")) {
      ip = ip.slice(7);
    }
    if (ip === "::1") {
      ip = "127.0.0.1";
    }
  }
  if (!ip || !/^[a-zA-Z0-9:.]+$/.test(ip)) {
    return "127.0.0.1";
  }
  return ip;
}

/**
 * Normalizes user account identifier to case-insensitive trimmed string
 */
export function normalizeAccountKey(identifier) {
  if (!identifier) return "";
  return String(identifier).trim().toLowerCase();
}

/**
 * Produces safe key for Firestore doc ID or MySQL primary key
 */
export function toRateLimitKey(type, value) {
  const safe = String(value || "").replace(/[^a-zA-Z0-9_.-]/g, "_");
  return `${type}_${safe}`;
}

/**
 * Reads rate limit record from persistent store (Firestore / MySQL) with memory fallback
 */
async function getRateLimitRecord(key) {
  try {
    if (isFirestore()) {
      const db = getDb();
      const collName = COLLECTIONS.LOGIN_RATE_LIMITS || "login_rate_limits";
      const snap = await db.collection(collName).doc(key).get();
      if (!snap.exists) return null;
      const data = snap.data();
      return {
        ...data,
        failed_attempts: Number(data.failed_attempts || 0),
        first_failed_at: Number(data.first_failed_at || 0),
        last_failed_at: Number(data.last_failed_at || 0),
        blocked_until: Number(data.blocked_until || 0),
        attempted_accounts: Array.isArray(data.attempted_accounts) ? data.attempted_accounts : []
      };
    } else {
      const rows = await mysqlQuery("SELECT * FROM login_rate_limits WHERE rate_key = ?", [key]);
      if (!rows || rows.length === 0) return null;
      const rec = rows[0];
      let accounts = [];
      try {
        accounts = rec.attempted_accounts ? JSON.parse(rec.attempted_accounts) : [];
      } catch {
        accounts = [];
      }
      return {
        ...rec,
        failed_attempts: Number(rec.failed_attempts || 0),
        first_failed_at: Number(rec.first_failed_at || 0),
        last_failed_at: Number(rec.last_failed_at || 0),
        blocked_until: Number(rec.blocked_until || 0),
        attempted_accounts: Array.isArray(accounts) ? accounts : []
      };
    }
  } catch (err) {
    console.warn("⚠️ Rate limiter store read warning (using in-memory fallback):", err.message);
    return memoryStore.get(key) || null;
  }
}

/**
 * Atomically updates failed attempt count and block timestamp
 */
async function recordFailureForKey(key, type, account) {
  const now = Date.now();

  if (isFirestore()) {
    try {
      const db = getDb();
      const collName = COLLECTIONS.LOGIN_RATE_LIMITS || "login_rate_limits";
      const ref = db.collection(collName).doc(key);

      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists ? snap.data() : null;

        let failed_attempts = 1;
        let first_failed_at = now;
        let last_failed_at = now;
        let blocked_until = 0;
        let attempted_accounts = account ? [account] : [];

        if (current && (now - Number(current.last_failed_at || 0)) <= RATE_LIMIT_CONFIG.WINDOW_MS) {
          failed_attempts = Number(current.failed_attempts || 0) + 1;
          first_failed_at = Number(current.first_failed_at || now);
          const prevAccounts = Array.isArray(current.attempted_accounts) ? current.attempted_accounts : [];
          attempted_accounts = Array.from(new Set([...prevAccounts, ...(account ? [account] : [])]));
        }

        if (failed_attempts >= RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS) {
          blocked_until = now + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS;
        }

        const payload = {
          rate_key: key,
          key_type: type,
          failed_attempts,
          first_failed_at,
          last_failed_at,
          blocked_until,
          attempted_accounts,
          updated_at: new Date()
        };

        tx.set(ref, payload);
        memoryStore.set(key, payload);
        return payload;
      });
    } catch (err) {
      console.warn("⚠️ Rate limiter Firestore write error (falling back to memory):", err.message);
      return recordMemoryFailure(key, type, account, now);
    }
  }

  // MySQL persistence
  try {
    const rows = await mysqlQuery("SELECT * FROM login_rate_limits WHERE rate_key = ?", [key]);
    const current = rows && rows.length > 0 ? rows[0] : null;

    let failed_attempts = 1;
    let first_failed_at = now;
    let last_failed_at = now;
    let blocked_until = 0;
    let attempted_accounts = account ? [account] : [];

    if (current && (now - Number(current.last_failed_at || 0)) <= RATE_LIMIT_CONFIG.WINDOW_MS) {
      failed_attempts = Number(current.failed_attempts || 0) + 1;
      first_failed_at = Number(current.first_failed_at || now);
      let prevAccounts = [];
      try {
        prevAccounts = current.attempted_accounts ? JSON.parse(current.attempted_accounts) : [];
      } catch {
        prevAccounts = [];
      }
      attempted_accounts = Array.from(new Set([...prevAccounts, ...(account ? [account] : [])]));
    }

    if (failed_attempts >= RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS) {
      blocked_until = now + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS;
    }

    const accountsJson = JSON.stringify(attempted_accounts);

    await mysqlQuery(
      `INSERT INTO login_rate_limits (rate_key, key_type, failed_attempts, first_failed_at, last_failed_at, blocked_until, attempted_accounts)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         key_type = VALUES(key_type),
         failed_attempts = VALUES(failed_attempts),
         first_failed_at = VALUES(first_failed_at),
         last_failed_at = VALUES(last_failed_at),
         blocked_until = VALUES(blocked_until),
         attempted_accounts = VALUES(attempted_accounts)`,
      [key, type, failed_attempts, first_failed_at, last_failed_at, blocked_until, accountsJson]
    );

    const result = {
      rate_key: key,
      key_type: type,
      failed_attempts,
      first_failed_at,
      last_failed_at,
      blocked_until,
      attempted_accounts
    };
    memoryStore.set(key, result);
    return result;
  } catch (err) {
    console.warn("⚠️ Rate limiter MySQL write error (falling back to memory):", err.message);
    return recordMemoryFailure(key, type, account, now);
  }
}

function recordMemoryFailure(key, type, account, now) {
  const current = memoryStore.get(key);

  let failed_attempts = 1;
  let first_failed_at = now;
  let last_failed_at = now;
  let blocked_until = 0;
  let attempted_accounts = account ? [account] : [];

  if (current && (now - Number(current.last_failed_at || 0)) <= RATE_LIMIT_CONFIG.WINDOW_MS) {
    failed_attempts = Number(current.failed_attempts || 0) + 1;
    first_failed_at = Number(current.first_failed_at || now);
    const prevAccounts = Array.isArray(current.attempted_accounts) ? current.attempted_accounts : [];
    attempted_accounts = Array.from(new Set([...prevAccounts, ...(account ? [account] : [])]));
  }

  if (failed_attempts >= RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS) {
    blocked_until = now + RATE_LIMIT_CONFIG.BLOCK_DURATION_MS;
  }

  const payload = {
    rate_key: key,
    key_type: type,
    failed_attempts,
    first_failed_at,
    last_failed_at,
    blocked_until,
    attempted_accounts
  };
  memoryStore.set(key, payload);
  return payload;
}

/**
 * Checks whether the client IP or target account is currently rate-limited
 * Returns: { blocked: false } or { blocked: true, retryAfterSeconds, retryMinutes, message, message_mr }
 */
export async function checkLoginRateLimit(req, identifier) {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const accountKey = normalizeAccountKey(identifier);

  const ipKey = toRateLimitKey("ip", clientIp);
  const ipRecord = await getRateLimitRecord(ipKey);

  if (ipRecord && Number(ipRecord.blocked_until || 0) > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((Number(ipRecord.blocked_until) - now) / 1000));
    const retryMinutes = Math.ceil(retryAfterSeconds / 60);
    return {
      blocked: true,
      reason: "ip",
      retryAfterSeconds,
      retryMinutes,
      message: "Too many failed login attempts. Please try again after 15 minutes.",
      message_mr: "अनेक अयशस्वी लॉगिन प्रयत्न झाले आहेत. कृपया १५ मिनिटांनंतर पुन्हा प्रयत्न करा."
    };
  }

  if (accountKey) {
    const accKey = toRateLimitKey("acc", accountKey);
    const accRecord = await getRateLimitRecord(accKey);

    if (accRecord && Number(accRecord.blocked_until || 0) > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((Number(accRecord.blocked_until) - now) / 1000));
      const retryMinutes = Math.ceil(retryAfterSeconds / 60);
      return {
        blocked: true,
        reason: "account",
        retryAfterSeconds,
        retryMinutes,
        message: "Too many failed login attempts. Please try again after 15 minutes.",
        message_mr: "अनेक अयशस्वी लॉगिन प्रयत्न झाले आहेत. कृपया १५ मिनिटांनंतर पुन्हा प्रयत्न करा."
      };
    }
  }

  return { blocked: false };
}

/**
 * Records a failed login attempt for the client IP and targeted account
 */
export async function recordFailedLogin(req, identifier) {
  const clientIp = getClientIp(req);
  const accountKey = normalizeAccountKey(identifier);

  const ipKey = toRateLimitKey("ip", clientIp);
  const ipResult = await recordFailureForKey(ipKey, "ip", accountKey);

  let accResult = null;
  if (accountKey) {
    const accKey = toRateLimitKey("acc", accountKey);
    accResult = await recordFailureForKey(accKey, "account", accountKey);
  }

  return { ip: ipResult, account: accResult };
}

/**
 * Handles successful login:
 * 1. Resets the targeted account's failed attempts counter.
 * 2. Resets the IP's counter ONLY IF that IP did not record failures against other accounts.
 */
export async function recordSuccessfulLogin(req, identifier) {
  const clientIp = getClientIp(req);
  const accountKey = normalizeAccountKey(identifier);

  // 1. Reset account record
  if (accountKey) {
    const accKey = toRateLimitKey("acc", accountKey);
    memoryStore.delete(accKey);
    try {
      if (isFirestore()) {
        const db = getDb();
        const collName = COLLECTIONS.LOGIN_RATE_LIMITS || "login_rate_limits";
        await db.collection(collName).doc(accKey).delete();
      } else {
        await mysqlQuery("DELETE FROM login_rate_limits WHERE rate_key = ?", [accKey]);
      }
    } catch (err) {
      console.warn("⚠️ Notice clearing account rate limit record:", err.message);
    }
  }

  // 2. Conditionally reset IP record:
  // Only reset IP if no other accounts were attacked from this IP during current window
  const ipKey = toRateLimitKey("ip", clientIp);
  const ipRecord = await getRateLimitRecord(ipKey);

  if (ipRecord) {
    const attempted = Array.isArray(ipRecord.attempted_accounts) ? ipRecord.attempted_accounts : [];
    const isSingleAccountOrEmpty = attempted.length === 0 || (attempted.length === 1 && attempted[0] === accountKey);

    if (isSingleAccountOrEmpty) {
      memoryStore.delete(ipKey);
      try {
        if (isFirestore()) {
          const db = getDb();
          const collName = COLLECTIONS.LOGIN_RATE_LIMITS || "login_rate_limits";
          await db.collection(collName).doc(ipKey).delete();
        } else {
          await mysqlQuery("DELETE FROM login_rate_limits WHERE rate_key = ?", [ipKey]);
        }
      } catch (err) {
        console.warn("⚠️ Notice clearing IP rate limit record:", err.message);
      }
    }
  }
}

/**
 * Test helper to clear rate limit records for specific IP or account
 */
export async function clearRateLimitForTesting({ ip, identifier } = {}) {
  const keys = [];
  if (ip) keys.push(toRateLimitKey("ip", ip));
  if (identifier) keys.push(toRateLimitKey("acc", normalizeAccountKey(identifier)));

  for (const k of keys) {
    memoryStore.delete(k);
    try {
      if (isFirestore()) {
        const db = getDb();
        const collName = COLLECTIONS.LOGIN_RATE_LIMITS || "login_rate_limits";
        await db.collection(collName).doc(k).delete();
      } else {
        await mysqlQuery("DELETE FROM login_rate_limits WHERE rate_key = ?", [k]);
      }
    } catch (err) {
      // Ignore in testing cleanup
    }
  }
}
