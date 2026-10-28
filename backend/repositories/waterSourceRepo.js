/**
 * JalMitra - Water Sources Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeSource(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    typeLabel: r.type_label || r.typeLabel,
    type_label: r.type_label || r.typeLabel,
    location: r.location,
    totalCapacity: Number(r.total_capacity || r.totalCapacity || 0),
    total_capacity: Number(r.total_capacity || r.totalCapacity || 0),
    currentLevelPercent: Number(r.current_level_percent || r.currentLevelPercent || 0),
    current_level_percent: Number(r.current_level_percent || r.currentLevelPercent || 0),
    lastInspected: r.last_inspected || r.lastInspected || "Recently",
    last_inspected: r.last_inspected || r.lastInspected || "Recently",
    purityStatus: r.purity_status || r.purityStatus || "Tested Safe",
    purity_status: r.purity_status || r.purityStatus || "Tested Safe"
  };
}

export const waterSourceRepo = {
  async getAll() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.WATER_SOURCES).get();
      return docsToArray(snap).map(normalizeSource).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    const rows = await mysqlQuery("SELECT * FROM water_sources ORDER BY id ASC");
    return rows.map(normalizeSource);
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.WATER_SOURCES).doc(cleanId).get();
      return docToData(docSnap) ? normalizeSource(docToData(docSnap)) : null;
    }

    const rows = await mysqlQuery("SELECT * FROM water_sources WHERE id = ? LIMIT 1", [cleanId]);
    return rows.length > 0 ? normalizeSource(rows[0]) : null;
  },

  async create(data) {
    const id = data.id || `src-${Date.now()}`;
    const record = {
      id,
      name: (data.name || "").trim(),
      type: (data.type || "").trim(),
      type_label: data.typeLabel || data.type_label || data.type,
      location: data.location || "",
      total_capacity: parseInt(data.totalCapacity || data.total_capacity || 0, 10),
      current_level_percent: Math.min(100, Math.max(0, parseInt(data.currentLevelPercent || data.current_level_percent || 0, 10))),
      last_inspected: data.lastInspected || data.last_inspected || "Recently",
      purity_status: data.purityStatus || data.purity_status || "Tested Safe"
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_SOURCES).doc(id).set(cleanUndefined(record));
      return normalizeSource(record);
    }

    await mysqlQuery(`
      INSERT INTO water_sources (id, name, type, type_label, location, total_capacity, current_level_percent, last_inspected, purity_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.name, record.type, record.type_label, record.location, record.total_capacity, record.current_level_percent, record.last_inspected, record.purity_status]);

    return normalizeSource(record);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Water source '${id}' not found`);

    const patch = {};
    if (updates.name !== undefined) patch.name = updates.name.trim();
    if (updates.type !== undefined) patch.type = updates.type.trim();
    if (updates.typeLabel !== undefined || updates.type_label !== undefined) patch.type_label = updates.typeLabel || updates.type_label;
    if (updates.location !== undefined) patch.location = updates.location;
    if (updates.totalCapacity !== undefined || updates.total_capacity !== undefined) patch.total_capacity = parseInt(updates.totalCapacity || updates.total_capacity, 10);
    if (updates.currentLevelPercent !== undefined || updates.current_level_percent !== undefined) {
      patch.current_level_percent = Math.min(100, Math.max(0, parseInt(updates.currentLevelPercent || updates.current_level_percent, 10)));
    }
    if (updates.lastInspected !== undefined || updates.last_inspected !== undefined) patch.last_inspected = updates.lastInspected || updates.last_inspected;
    if (updates.purityStatus !== undefined || updates.purity_status !== undefined) patch.purity_status = updates.purityStatus || updates.purity_status;

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_SOURCES).doc(id).update(cleanUndefined(patch));
      return this.getById(id);
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(id);
    await mysqlQuery(`UPDATE water_sources SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getById(id);
  },

  async delete(id) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_SOURCES).doc(id).delete();
      return true;
    }

    const res = await mysqlQuery("DELETE FROM water_sources WHERE id = ?", [id]);
    return res.affectedRows > 0;
  },

  async count() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.WATER_SOURCES).get();
      return snap.size;
    }
    const rows = await mysqlQuery("SELECT COUNT(*) as count FROM water_sources");
    return Number(rows[0]?.count || 0);
  }
};

