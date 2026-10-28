/**
 * JalMitra - Community Reports / Grievances Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeReport(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    area: r.area,
    problemType: r.problem_type || r.problemType,
    problem_type: r.problem_type || r.problemType,
    urgency: r.urgency || "Normal",
    description: r.description,
    status: r.status || "Pending",
    citizen_id: r.citizen_id || null,
    createdAt: r.created_at || r.createdAt,
    created_at: r.created_at || r.createdAt
  };
}

export const communityRepo = {
  async getAll() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.COMMUNITY_REPORTS).get();
      return docsToArray(snap).map(normalizeReport).sort((a, b) => {
        return String(b.created_at || "").localeCompare(String(a.created_at || ""));
      });
    }

    const rows = await mysqlQuery("SELECT * FROM community_reports ORDER BY created_at DESC");
    return rows.map(normalizeReport);
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.COMMUNITY_REPORTS).doc(cleanId).get();
      return docToData(docSnap) ? normalizeReport(docToData(docSnap)) : null;
    }

    const rows = await mysqlQuery("SELECT * FROM community_reports WHERE id = ? LIMIT 1", [cleanId]);
    return rows.length > 0 ? normalizeReport(rows[0]) : null;
  },

  async getByCitizenOrPhone(citizenId, phone) {
    if (isFirestore()) {
      const db = getDb();
      const coll = db.collection(COLLECTIONS.COMMUNITY_REPORTS);
      const resultsMap = new Map();

      if (citizenId) {
        const snap1 = await coll.where("citizen_id", "==", citizenId).get();
        docsToArray(snap1).forEach(d => resultsMap.set(d.id, d));
      }
      if (phone) {
        const snap2 = await coll.where("phone", "==", phone).get();
        docsToArray(snap2).forEach(d => resultsMap.set(d.id, d));
      }

      return Array.from(resultsMap.values())
        .map(normalizeReport)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    }

    const rows = await mysqlQuery(`
      SELECT * FROM community_reports 
      WHERE citizen_id = ? OR phone = ?
      ORDER BY created_at DESC
    `, [citizenId || "", phone || ""]);
    return rows.map(normalizeReport);
  },

  async create(data) {
    const id = data.id || `cmp-${Date.now()}`;
    const record = {
      id,
      name: (data.name || "").trim(),
      phone: (data.phone || "").trim(),
      area: (data.area || "").trim(),
      problem_type: (data.problem_type || data.problemType || "").trim(),
      urgency: ["Normal", "High", "Critical"].includes(data.urgency) ? data.urgency : "Normal",
      description: (data.description || "").trim(),
      status: data.status || "Pending",
      citizen_id: data.citizen_id || data.citizenId || null,
      created_at: data.created_at || new Date().toISOString()
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.COMMUNITY_REPORTS).doc(id).set(cleanUndefined(record));
      return normalizeReport(record);
    }

    await mysqlQuery(`
      INSERT INTO community_reports (id, citizen_id, name, phone, area, problem_type, urgency, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.citizen_id, record.name, record.phone, record.area, record.problem_type, record.urgency, record.description, record.status]);

    return normalizeReport(record);
  },

  async updateStatus(id, status) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.COMMUNITY_REPORTS).doc(id).update({
        status,
        updated_at: new Date().toISOString()
      });
      return this.getById(id);
    }

    const res = await mysqlQuery("UPDATE community_reports SET status = ? WHERE id = ?", [status, id]);
    if (res.affectedRows === 0) return null;
    return this.getById(id);
  },

  async delete(id) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.COMMUNITY_REPORTS).doc(id).delete();
      return true;
    }

    const res = await mysqlQuery("DELETE FROM community_reports WHERE id = ?", [id]);
    return res.affectedRows > 0;
  },

  async count() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.COMMUNITY_REPORTS).get();
      return snap.size;
    }
    const rows = await mysqlQuery("SELECT COUNT(*) as count FROM community_reports");
    return Number(rows[0]?.count || 0);
  }
};

