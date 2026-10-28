/**
 * JalMitra - Admin Audit Logs Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeLog(l) {
  if (!l) return null;
  return {
    id: l.id,
    user_id: l.user_id || l.userId,
    user_name: l.user_name || l.userName,
    action: l.action,
    target_type: l.target_type || l.targetType,
    target_id: l.target_id || l.targetId,
    details: l.details || "",
    ip_address: l.ip_address || l.ipAddress || "127.0.0.1",
    created_at: l.created_at || l.createdAt || new Date().toISOString()
  };
}

export const auditRepo = {
  async logAction(data) {
    const id = data.id || `log-${Date.now()}`;
    const record = {
      id,
      user_id: data.user_id || data.userId || "system",
      user_name: data.user_name || data.userName || "System",
      action: data.action || "UPDATE",
      target_type: data.target_type || data.targetType || "SYSTEM",
      target_id: data.target_id || data.targetId || null,
      details: typeof data.details === "object" ? JSON.stringify(data.details) : String(data.details || ""),
      ip_address: data.ip_address || data.ipAddress || "127.0.0.1",
      created_at: data.created_at || new Date().toISOString()
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).doc(id).set(cleanUndefined(record));
      return normalizeLog(record);
    }

    try {
      await mysqlQuery(`
        INSERT INTO admin_audit_logs (id, user_id, user_name, action, target_type, target_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [record.id, record.user_id, record.user_name, record.action, record.target_type, record.target_id, record.details, record.ip_address]);
    } catch (e) {
      console.warn("Audit log insert deferred:", e.message);
    }

    return normalizeLog(record);
  },

  async getLogs(limit = 100) {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).get();
      return docsToArray(snap)
        .map(normalizeLog)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, limit);
    }

    try {
      const rows = await mysqlQuery(`
        SELECT * FROM admin_audit_logs 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit]);
      return rows.map(normalizeLog);
    } catch (e) {
      return [];
    }
  }
};

