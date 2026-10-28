/**
 * JalMitra - Water Tanks, Monitoring, Readings & Distribution Repository
 * (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

export function getWaterStatus(percent) {
  const p = Number(percent);
  if (p <= 0) return "Empty";
  if (p < 10) return "Very Critical";
  if (p < 25) return "Critical";
  if (p <= 50) return "Low";
  return "Normal";
}

function normalizeTank(t) {
  if (!t) return null;
  const now = Date.now();
  const lastTime = t.last_measured_at ? new Date(t.last_measured_at).getTime() : 0;
  const isOutdated = !t.last_measured_at || (now - lastTime > 24 * 60 * 60 * 1000);

  return {
    id: t.id,
    name: t.name,
    village_location: t.village_location || t.villageLocation,
    tank_type: t.tank_type || t.tankType || "Overhead",
    total_capacity: Number(t.total_capacity || t.totalCapacity || 0),
    current_quantity: Number(t.current_quantity || t.currentQuantity || 0),
    current_level_percent: Number(t.current_level_percent || t.currentLevelPercent || 0),
    status: t.status || getWaterStatus(t.current_level_percent),
    last_measured_at: t.last_measured_at || null,
    measurement_method: t.measurement_method || "manual",
    sensor_id: t.sensor_id || null,
    tank_shape: t.tank_shape || "Cylinder",
    dim_height: t.dim_height ? Number(t.dim_height) : null,
    dim_diameter: t.dim_diameter ? Number(t.dim_diameter) : null,
    dim_length: t.dim_length ? Number(t.dim_length) : null,
    dim_width: t.dim_width ? Number(t.dim_width) : null,
    source_id: t.source_id || null,
    is_active: t.is_active !== undefined ? (t.is_active ? 1 : 0) : 1,
    created_at: t.created_at,
    updated_at: t.updated_at,
    is_outdated: isOutdated,
    freshness_label: isOutdated ? "Pending fresh measurement (>24h)" : "Live / Verified"
  };
}

export const waterTankRepo = {
  // --- TANKS ---
  async getAllTanks(activeOnly = true) {
    if (isFirestore()) {
      const db = getDb();
      let snap;
      if (activeOnly) {
        snap = await db.collection(COLLECTIONS.WATER_TANKS).where("is_active", "==", 1).get();
      } else {
        snap = await db.collection(COLLECTIONS.WATER_TANKS).get();
      }
      return docsToArray(snap).map(normalizeTank).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }

    const sql = activeOnly
      ? "SELECT * FROM water_tanks WHERE is_active = 1 ORDER BY name ASC"
      : "SELECT * FROM water_tanks ORDER BY name ASC";
    const rows = await mysqlQuery(sql);
    return rows.map(normalizeTank);
  },

  async getTankById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.WATER_TANKS).doc(cleanId).get();
      return docToData(docSnap) ? normalizeTank(docToData(docSnap)) : null;
    }

    const rows = await mysqlQuery("SELECT * FROM water_tanks WHERE id = ? LIMIT 1", [cleanId]);
    return rows.length > 0 ? normalizeTank(rows[0]) : null;
  },

  async createTank(data) {
    const id = data.id || `TNK-${Date.now().toString().slice(-6)}`;
    const capacity = Number(data.total_capacity || data.totalCapacity || 0);
    const quantity = Number(data.current_quantity || data.currentQuantity || 0);
    const percent = capacity > 0 ? Number(((quantity / capacity) * 100).toFixed(2)) : 0;
    const status = getWaterStatus(percent);

    const record = {
      id,
      name: (data.name || "").trim(),
      village_location: (data.village_location || data.villageLocation || "").trim(),
      tank_type: data.tank_type || data.tankType || "Overhead",
      total_capacity: capacity,
      current_quantity: quantity,
      current_level_percent: percent,
      status,
      last_measured_at: data.last_measured_at || new Date().toISOString(),
      measurement_method: data.measurement_method || "manual",
      sensor_id: data.sensor_id || null,
      tank_shape: data.tank_shape || "Cylinder",
      dim_height: data.dim_height ? Number(data.dim_height) : null,
      dim_diameter: data.dim_diameter ? Number(data.dim_diameter) : null,
      dim_length: data.dim_length ? Number(data.dim_length) : null,
      dim_width: data.dim_width ? Number(data.dim_width) : null,
      source_id: data.source_id || null,
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_TANKS).doc(id).set(cleanUndefined(record));
      return normalizeTank(record);
    }

    await mysqlQuery(`
      INSERT INTO water_tanks (
        id, name, village_location, tank_type, total_capacity,
        current_quantity, current_level_percent, status,
        last_measured_at, measurement_method, sensor_id,
        tank_shape, dim_height, dim_diameter, dim_length, dim_width,
        source_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id, record.name, record.village_location, record.tank_type, record.total_capacity,
      record.current_quantity, record.current_level_percent, record.status,
      record.last_measured_at, record.measurement_method, record.sensor_id,
      record.tank_shape, record.dim_height, record.dim_diameter, record.dim_length, record.dim_width,
      record.source_id, record.is_active
    ]);

    return normalizeTank(record);
  },

  async updateTank(id, updates) {
    const existing = await this.getTankById(id);
    if (!existing) throw new Error(`Water tank '${id}' not found`);

    const capacity = updates.total_capacity !== undefined ? Number(updates.total_capacity) : existing.total_capacity;
    let quantity = updates.current_quantity !== undefined ? Number(updates.current_quantity) : existing.current_quantity;
    let percent = updates.current_level_percent !== undefined ? Number(updates.current_level_percent) : (capacity > 0 ? Number(((quantity / capacity) * 100).toFixed(2)) : 0);
    let status = updates.status || getWaterStatus(percent);

    const patch = cleanUndefined({
      name: updates.name,
      village_location: updates.village_location || updates.villageLocation,
      tank_type: updates.tank_type || updates.tankType,
      total_capacity: capacity,
      current_quantity: quantity,
      current_level_percent: percent,
      status,
      last_measured_at: updates.last_measured_at,
      measurement_method: updates.measurement_method,
      sensor_id: updates.sensor_id,
      tank_shape: updates.tank_shape,
      dim_height: updates.dim_height,
      dim_diameter: updates.dim_diameter,
      dim_length: updates.dim_length,
      dim_width: updates.dim_width,
      source_id: updates.source_id,
      is_active: updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : undefined,
      updated_at: new Date().toISOString()
    });

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_TANKS).doc(existing.id).update(patch);
      return this.getTankById(existing.id);
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(existing.id);
    await mysqlQuery(`UPDATE water_tanks SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getTankById(existing.id);
  },

  async deleteTank(id) {
    const existing = await this.getTankById(id);
    if (!existing) return false;

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_TANKS).doc(existing.id).delete();
      return true;
    }

    const res = await mysqlQuery("DELETE FROM water_tanks WHERE id = ?", [existing.id]);
    return res.affectedRows > 0;
  },

  async getSummary() {
    const tanks = await this.getAllTanks(true);
    const totalTanks = tanks.length;
    const totalCapacity = tanks.reduce((acc, t) => acc + Number(t.total_capacity || 0), 0);
    const totalCurrentStorage = tanks.reduce((acc, t) => acc + Number(t.current_quantity || 0), 0);

    const overallStoragePercent = totalCapacity > 0
      ? Number(((totalCurrentStorage / totalCapacity) * 100).toFixed(2))
      : 0;

    const normalCount = tanks.filter(t => t.status === "Normal").length;
    const lowCount = tanks.filter(t => t.status === "Low").length;
    const criticalCount = tanks.filter(t => t.status === "Critical" || t.status === "Very Critical").length;
    const emptyCount = tanks.filter(t => t.status === "Empty").length;

    let activeAlertsCount = 0;
    if (isFirestore()) {
      const db = getDb();
      const alertSnap = await db.collection(COLLECTIONS.WATER_LEVEL_ALERTS).where("is_acknowledged", "==", 0).get();
      activeAlertsCount = alertSnap.size;
    } else {
      const [alertRows] = await mysqlQuery("SELECT COUNT(*) as count FROM water_level_alerts WHERE is_acknowledged = 0");
      activeAlertsCount = Number(alertRows?.count || 0);
    }

    return {
      totalTanks,
      totalCapacity,
      totalCurrentStorage,
      overallStoragePercent,
      normalCount,
      lowCount,
      criticalCount,
      emptyCount,
      lowOrCriticalCount: lowCount + criticalCount + emptyCount,
      overallStatus: getWaterStatus(overallStoragePercent),
      activeAlertsCount
    };
  },

  // --- READINGS ---
  async addReading(tankId, readingData) {
    const tank = await this.getTankById(tankId);
    if (!tank) throw new Error(`Water tank '${tankId}' not found`);

    const readingId = readingData.id || `RDG-${Date.now().toString().slice(-6)}`;
    const measuredQuantity = Number(readingData.water_quantity_liters);
    const measuredPercent = Number(((measuredQuantity / tank.total_capacity) * 100).toFixed(2));
    const status = getWaterStatus(measuredPercent);
    const measuredAt = readingData.measured_at || new Date().toISOString();

    const record = {
      id: readingId,
      tank_id: tank.id,
      water_level_percent: measuredPercent,
      water_quantity_liters: measuredQuantity,
      water_height_m: readingData.water_height_m ? Number(readingData.water_height_m) : null,
      measurement_method: readingData.measurement_method || "manual",
      recorded_by: readingData.recorded_by || "Panchayat Staff",
      notes: readingData.notes || null,
      measured_at: measuredAt
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_LEVEL_READINGS).doc(readingId).set(cleanUndefined(record));
      // Update tank
      await this.updateTank(tank.id, {
        current_quantity: measuredQuantity,
        current_level_percent: measuredPercent,
        status,
        last_measured_at: measuredAt,
        measurement_method: record.measurement_method
      });

      // Create alert if Low or Critical
      if (measuredPercent <= 50) {
        const alertId = `ALT-${Date.now().toString().slice(-6)}`;
        await db.collection(COLLECTIONS.WATER_LEVEL_ALERTS).doc(alertId).set({
          id: alertId,
          tank_id: tank.id,
          alert_level: measuredPercent <= 25 ? "Critical" : "Warning",
          current_level_percent: measuredPercent,
          threshold_percent: 50.0,
          is_acknowledged: 0,
          created_at: new Date().toISOString()
        });
      }

      return record;
    }

    // MySQL
    await mysqlQuery(`
      INSERT INTO water_level_readings (
        id, tank_id, water_level_percent, water_quantity_liters,
        water_height_m, measurement_method, recorded_by, notes, measured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id, record.tank_id, record.water_level_percent, record.water_quantity_liters,
      record.water_height_m, record.measurement_method, record.recorded_by, record.notes, record.measured_at
    ]);

    await this.updateTank(tank.id, {
      current_quantity: measuredQuantity,
      current_level_percent: measuredPercent,
      status,
      last_measured_at: measuredAt,
      measurement_method: record.measurement_method
    });

    if (measuredPercent <= 50) {
      const alertId = `ALT-${Date.now().toString().slice(-6)}`;
      await mysqlQuery(`
        INSERT INTO water_level_alerts (id, tank_id, alert_level, current_level_percent, threshold_percent, is_acknowledged)
        VALUES (?, ?, ?, ?, 50.0, 0)
      `, [alertId, tank.id, measuredPercent <= 25 ? "Critical" : "Warning", measuredPercent]);
    }

    return record;
  },

  async getReadings(tankId, limit = 50) {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.WATER_LEVEL_READINGS)
        .where("tank_id", "==", tankId)
        .get();
      return docsToArray(snap)
        .sort((a, b) => String(b.measured_at).localeCompare(String(a.measured_at)))
        .slice(0, limit);
    }

    const rows = await mysqlQuery(`
      SELECT * FROM water_level_readings 
      WHERE tank_id = ? 
      ORDER BY measured_at DESC 
      LIMIT ?
    `, [tankId, limit]);
    return rows;
  },

  // --- ALERTS ---
  async getAlerts(unackOnly = false) {
    if (isFirestore()) {
      const db = getDb();
      let snap;
      if (unackOnly) {
        snap = await db.collection(COLLECTIONS.WATER_LEVEL_ALERTS).where("is_acknowledged", "==", 0).get();
      } else {
        snap = await db.collection(COLLECTIONS.WATER_LEVEL_ALERTS).get();
      }
      return docsToArray(snap).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    }

    const sql = unackOnly
      ? "SELECT a.*, t.name as tank_name FROM water_level_alerts a LEFT JOIN water_tanks t ON a.tank_id = t.id WHERE a.is_acknowledged = 0 ORDER BY a.created_at DESC"
      : "SELECT a.*, t.name as tank_name FROM water_level_alerts a LEFT JOIN water_tanks t ON a.tank_id = t.id ORDER BY a.created_at DESC";
    return mysqlQuery(sql);
  },

  async acknowledgeAlert(id, notes = "") {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_LEVEL_ALERTS).doc(id).update({
        is_acknowledged: 1,
        acknowledged_at: new Date().toISOString(),
        notes: notes || "Acknowledged by Admin"
      });
      return true;
    }

    const res = await mysqlQuery(`
      UPDATE water_level_alerts 
      SET is_acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP, notes = ?
      WHERE id = ?
    `, [notes || "Acknowledged by Admin", id]);
    return res.affectedRows > 0;
  }
};

