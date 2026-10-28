/**
 * JalMitra - Citizens Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";
import { propertyRepo } from "./propertyRepo.js";

function normalizeCitizen(c) {
  if (!c) return null;
  return {
    id: c.id,
    user_id: c.user_id || c.userId || null,
    full_name: c.full_name || c.fullName,
    phone: c.phone,
    email: c.email || null,
    property_no: c.property_no || c.propertyNo,
    ward_area: c.ward_area || c.wardArea,
    family_members: Number(c.family_members !== undefined ? c.family_members : (c.familyMembers || 1)),
    meter_no: c.meter_no || c.meterNo || null,
    connection_type: c.connection_type || c.connectionType || "Domestic Metered Tap",
    status: c.status || "Active",
    property_id: c.property_id || c.propertyId || null,
    created_at: c.created_at || c.createdAt
  };
}

export const citizenRepo = {
  async getAll() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.CITIZENS).get();
      return docsToArray(snap).map(normalizeCitizen).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    const rows = await mysqlQuery("SELECT * FROM citizens ORDER BY id ASC");
    return rows.map(normalizeCitizen);
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.CITIZENS).doc(cleanId).get();
      if (docSnap.exists) return normalizeCitizen(docToData(docSnap));

      // Try user_id match
      const snap = await db.collection(COLLECTIONS.CITIZENS).where("user_id", "==", cleanId).limit(1).get();
      return snap.empty ? null : normalizeCitizen(docToData(snap.docs[0]));
    }

    const rows = await mysqlQuery("SELECT * FROM citizens WHERE id = ? OR user_id = ? LIMIT 1", [cleanId, cleanId]);
    return rows.length > 0 ? normalizeCitizen(rows[0]) : null;
  },

  async getProfileWithProperty(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const citizen = await this.getById(cleanId);
      if (!citizen) return null;

      let prop = null;
      if (citizen.property_id) {
        prop = await propertyRepo.getById(citizen.property_id);
      }
      if (!prop && citizen.property_no) {
        prop = await propertyRepo.getByPropertyNumber(citizen.property_no);
      }
      if (!prop) {
        prop = await propertyRepo.getByOwnerCitizenId(citizen.id);
      }

      return {
        ...citizen,
        prop_id: prop ? prop.id : null,
        prop_number: prop ? prop.property_number : null,
        prop_type: prop ? prop.property_type : null,
        prop_ward: prop ? prop.ward_area : null,
        prop_address: prop ? prop.address : null,
        prop_meter_no: prop ? prop.water_meter_no : null,
        prop_connection_type: prop ? prop.connection_type : null,
        prop_annual_tax: prop ? prop.annual_tax : null
      };
    }

    // MySQL composite LEFT JOIN
    const rows = await mysqlQuery(`
      SELECT c.*,
             p.id as prop_id,
             p.property_number as prop_number,
             p.property_type as prop_type,
             p.ward_area as prop_ward,
             p.address as prop_address,
             p.water_meter_no as prop_meter_no,
             p.connection_type as prop_connection_type,
             p.annual_tax as prop_annual_tax
      FROM citizens c
      LEFT JOIN properties p ON (c.property_id = p.id OR c.property_no = p.property_number OR p.owner_citizen_id = c.id)
      WHERE c.id = ? OR c.user_id = ?
      LIMIT 1
    `, [cleanId, cleanId]);

    return rows.length > 0 ? rows[0] : null;
  },

  async getByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).trim();

    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.CITIZENS).where("phone", "==", cleanPhone).limit(1).get();
      return snap.empty ? null : normalizeCitizen(docToData(snap.docs[0]));
    }

    const rows = await mysqlQuery("SELECT * FROM citizens WHERE phone = ? LIMIT 1", [cleanPhone]);
    return rows.length > 0 ? normalizeCitizen(rows[0]) : null;
  },

  async create(data) {
    const id = data.id || `CIT-${Date.now().toString().slice(-4)}`;
    const record = {
      id,
      user_id: data.user_id || data.userId || null,
      full_name: (data.full_name || data.fullName || "").trim(),
      phone: (data.phone || "").trim(),
      email: data.email ? String(data.email).trim() : null,
      property_no: (data.property_no || data.propertyNo || "").trim(),
      ward_area: (data.ward_area || data.wardArea || "").trim(),
      family_members: parseInt(data.family_members || data.familyMembers || 1, 10),
      meter_no: data.meter_no || data.meterNo || `MET-${id.replace("CIT-", "")}`,
      connection_type: data.connection_type || data.connectionType || "Domestic Metered Tap",
      status: data.status || "Active",
      property_id: data.property_id || data.propertyId || null,
      created_at: data.created_at || new Date().toISOString()
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.CITIZENS).doc(id).set(cleanUndefined(record));
      return normalizeCitizen(record);
    }

    await mysqlQuery(`
      INSERT INTO citizens (id, user_id, full_name, phone, email, property_no, ward_area, family_members, meter_no, connection_type, status, property_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.user_id, record.full_name, record.phone, record.email, record.property_no, record.ward_area, record.family_members, record.meter_no, record.connection_type, record.status, record.property_id]);

    return normalizeCitizen(record);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Citizen '${id}' not found`);

    const patch = cleanUndefined({
      full_name: updates.full_name || updates.fullName,
      phone: updates.phone ? String(updates.phone).trim() : undefined,
      email: updates.email !== undefined ? updates.email : undefined,
      property_no: updates.property_no || updates.propertyNo,
      ward_area: updates.ward_area || updates.wardArea,
      family_members: (updates.family_members !== undefined || updates.familyMembers !== undefined)
        ? parseInt(updates.family_members || updates.familyMembers, 10)
        : undefined,
      meter_no: updates.meter_no || updates.meterNo,
      connection_type: updates.connection_type || updates.connectionType,
      status: updates.status,
      property_id: updates.property_id || updates.propertyId
    });

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.CITIZENS).doc(existing.id).update(patch);
      return this.getById(existing.id);
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(existing.id);
    await mysqlQuery(`UPDATE citizens SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getById(existing.id);
  },

  async delete(id) {
    const existing = await this.getById(id);
    if (!existing) return false;

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.CITIZENS).doc(existing.id).delete();
      return true;
    }

    const res = await mysqlQuery("DELETE FROM citizens WHERE id = ?", [existing.id]);
    return res.affectedRows > 0;
  },

  async count() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.CITIZENS).get();
      return snap.size;
    }
    const rows = await mysqlQuery("SELECT COUNT(*) as count FROM citizens");
    return Number(rows[0]?.count || 0);
  }
};

