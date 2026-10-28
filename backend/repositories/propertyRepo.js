/**
 * JalMitra - Properties Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeProperty(p) {
  if (!p) return null;
  return {
    id: p.id,
    property_number: p.property_number,
    owner_name: p.owner_name,
    owner_citizen_id: p.owner_citizen_id || null,
    property_type: p.property_type || "Residential",
    ward_area: p.ward_area,
    address: p.address || "",
    water_meter_no: p.water_meter_no || null,
    connection_type: p.connection_type || "Domestic Metered Tap",
    annual_tax: Number(p.annual_tax || 0),
    is_active: p.is_active !== undefined ? (p.is_active ? 1 : 0) : 1
  };
}

export const propertyRepo = {
  async getAll() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.PROPERTIES).get();
      return docsToArray(snap).map(normalizeProperty).sort((a, b) => String(a.property_number).localeCompare(String(b.property_number)));
    }

    const rows = await mysqlQuery("SELECT * FROM properties ORDER BY property_number ASC");
    return rows.map(normalizeProperty);
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.PROPERTIES).doc(cleanId).get();
      if (docSnap.exists) return normalizeProperty(docToData(docSnap));

      // Try by property_number
      const querySnap = await db.collection(COLLECTIONS.PROPERTIES).where("property_number", "==", cleanId).limit(1).get();
      return querySnap.empty ? null : normalizeProperty(docToData(querySnap.docs[0]));
    }

    const rows = await mysqlQuery("SELECT * FROM properties WHERE id = ? OR property_number = ? LIMIT 1", [cleanId, cleanId]);
    return rows.length > 0 ? normalizeProperty(rows[0]) : null;
  },

  async getByPropertyNumber(num) {
    if (!num) return null;
    const cleanNum = String(num).trim();

    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.PROPERTIES).where("property_number", "==", cleanNum).limit(1).get();
      return snap.empty ? null : normalizeProperty(docToData(snap.docs[0]));
    }

    const rows = await mysqlQuery("SELECT * FROM properties WHERE property_number = ? LIMIT 1", [cleanNum]);
    return rows.length > 0 ? normalizeProperty(rows[0]) : null;
  },

  async getByOwnerCitizenId(citizenId) {
    if (!citizenId) return null;
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.PROPERTIES).where("owner_citizen_id", "==", citizenId).limit(1).get();
      return snap.empty ? null : normalizeProperty(docToData(snap.docs[0]));
    }

    const rows = await mysqlQuery("SELECT * FROM properties WHERE owner_citizen_id = ? LIMIT 1", [citizenId]);
    return rows.length > 0 ? normalizeProperty(rows[0]) : null;
  },

  async create(data) {
    const id = data.id || `PROP-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      property_number: (data.property_number || data.propertyNumber || id).trim(),
      owner_name: (data.owner_name || data.ownerName || "").trim(),
      owner_citizen_id: data.owner_citizen_id || data.ownerCitizenId || null,
      property_type: data.property_type || data.propertyType || "Residential",
      ward_area: (data.ward_area || data.wardArea || "").trim(),
      address: data.address || "",
      water_meter_no: data.water_meter_no || data.waterMeterNo || null,
      connection_type: data.connection_type || data.connectionType || "Domestic Metered Tap",
      annual_tax: parseFloat(data.annual_tax || data.annualTax || 0),
      is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.PROPERTIES).doc(id).set(cleanUndefined(record));
      return normalizeProperty(record);
    }

    await mysqlQuery(`
      INSERT INTO properties (id, property_number, owner_name, owner_citizen_id, property_type, ward_area, address, water_meter_no, connection_type, annual_tax, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.property_number, record.owner_name, record.owner_citizen_id, record.property_type, record.ward_area, record.address, record.water_meter_no, record.connection_type, record.annual_tax, record.is_active]);

    return normalizeProperty(record);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Property '${id}' not found`);

    const patch = cleanUndefined({
      property_number: updates.property_number || updates.propertyNumber,
      owner_name: updates.owner_name || updates.ownerName,
      owner_citizen_id: updates.owner_citizen_id !== undefined ? updates.owner_citizen_id : (updates.ownerCitizenId !== undefined ? updates.ownerCitizenId : undefined),
      property_type: updates.property_type || updates.propertyType,
      ward_area: updates.ward_area || updates.wardArea,
      address: updates.address,
      water_meter_no: updates.water_meter_no || updates.waterMeterNo,
      connection_type: updates.connection_type || updates.connectionType,
      annual_tax: (updates.annual_tax !== undefined || updates.annualTax !== undefined) ? parseFloat(updates.annual_tax || updates.annualTax) : undefined,
      is_active: updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : undefined
    });

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.PROPERTIES).doc(existing.id).update(patch);
      return this.getById(existing.id);
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(existing.id);
    await mysqlQuery(`UPDATE properties SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getById(existing.id);
  },

  async delete(id) {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.PROPERTIES).doc(existing.id).delete();
      return true;
    }

    const res = await mysqlQuery("DELETE FROM properties WHERE id = ?", [existing.id]);
    return res.affectedRows > 0;
  },

  async count() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.PROPERTIES).get();
      return snap.size;
    }
    const rows = await mysqlQuery("SELECT COUNT(*) as count FROM properties");
    return Number(rows[0]?.count || 0);
  }
};

