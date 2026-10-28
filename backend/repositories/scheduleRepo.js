/**
 * JalMitra - Distribution Schedules Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeSchedule(r) {
  if (!r) return null;
  let dateStr = "";
  if (r.date) {
    if (typeof r.date === "string") {
      dateStr = r.date.split("T")[0];
    } else if (r.date.toISOString) {
      dateStr = r.date.toISOString().split("T")[0];
    }
  }
  return {
    id: r.id,
    area: r.area,
    date: dateStr,
    dateLabel: r.date_label || r.dateLabel || "Scheduled",
    date_label: r.date_label || r.dateLabel || "Scheduled",
    timeSlot: r.time_slot || r.timeSlot,
    time_slot: r.time_slot || r.timeSlot,
    duration: r.duration,
    supplyType: r.supply_type || r.supplyType || "Pipeline Tap",
    supply_type: r.supply_type || r.supplyType || "Pipeline Tap",
    status: r.status || "Upcoming",
    lineman: r.lineman || "Panchayat Lineman"
  };
}

export const scheduleRepo = {
  async getAll() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.DISTRIBUTION_SCHEDULES).get();
      return docsToArray(snap).map(normalizeSchedule).sort((a, b) => {
        const d = String(a.date).localeCompare(String(b.date));
        if (d !== 0) return d;
        return String(a.time_slot).localeCompare(String(b.time_slot));
      });
    }

    const rows = await mysqlQuery("SELECT * FROM distribution_schedules ORDER BY date ASC, time_slot ASC");
    return rows.map(normalizeSchedule);
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.DISTRIBUTION_SCHEDULES).doc(cleanId).get();
      return docToData(docSnap) ? normalizeSchedule(docToData(docSnap)) : null;
    }

    const rows = await mysqlQuery("SELECT * FROM distribution_schedules WHERE id = ? LIMIT 1", [cleanId]);
    return rows.length > 0 ? normalizeSchedule(rows[0]) : null;
  },

  async create(data) {
    const id = data.id || `sch-${Date.now()}`;
    const schedDate = data.date || new Date().toISOString().split("T")[0];
    const record = {
      id,
      area: (data.area || "").trim(),
      date: schedDate,
      date_label: data.dateLabel || data.date_label || "Scheduled",
      time_slot: (data.timeSlot || data.time_slot || "").trim(),
      duration: (data.duration || "").trim(),
      supply_type: data.supplyType || data.supply_type || "Pipeline Tap",
      status: data.status || "Upcoming",
      lineman: data.lineman || "Panchayat Lineman"
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.DISTRIBUTION_SCHEDULES).doc(id).set(cleanUndefined(record));
      return normalizeSchedule(record);
    }

    await mysqlQuery(`
      INSERT INTO distribution_schedules (id, area, date, date_label, time_slot, duration, supply_type, status, lineman)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.area, record.date, record.date_label, record.time_slot, record.duration, record.supply_type, record.status, record.lineman]);

    return normalizeSchedule(record);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Distribution schedule '${id}' not found`);

    const patch = {};
    if (updates.area !== undefined) patch.area = updates.area.trim();
    if (updates.date !== undefined) patch.date = updates.date;
    if (updates.dateLabel !== undefined || updates.date_label !== undefined) patch.date_label = updates.dateLabel || updates.date_label;
    if (updates.timeSlot !== undefined || updates.time_slot !== undefined) patch.time_slot = (updates.timeSlot || updates.time_slot).trim();
    if (updates.duration !== undefined) patch.duration = updates.duration.trim();
    if (updates.supplyType !== undefined || updates.supply_type !== undefined) patch.supply_type = updates.supplyType || updates.supply_type;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.lineman !== undefined) patch.lineman = updates.lineman;

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.DISTRIBUTION_SCHEDULES).doc(id).update(cleanUndefined(patch));
      return this.getById(id);
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(id);
    await mysqlQuery(`UPDATE distribution_schedules SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getById(id);
  },

  async delete(id) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.DISTRIBUTION_SCHEDULES).doc(id).delete();
      return true;
    }

    const res = await mysqlQuery("DELETE FROM distribution_schedules WHERE id = ?", [id]);
    return res.affectedRows > 0;
  }
};

