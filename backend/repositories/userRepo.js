/**
 * JalMitra - User Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

export const userRepo = {
  async findByLoginOrPhone(identifier) {
    if (!identifier) return null;
    const cleanId = String(identifier).trim();
    const upperId = cleanId.toUpperCase();
    const lowerId = cleanId.toLowerCase();

    function normalizeUser(u) {
      if (!u) return null;
      return {
        ...u,
        login_id: u.login_id || u.citizen_id || u.id,
        citizen_id: u.citizen_id || (u.role === "citizen" ? (u.login_id || u.id) : null),
        role: (u.role && ["admin", "citizen"].includes(u.role)) ? u.role : "citizen",
        role_title: u.role_title || (u.role === "admin" ? "Administrator" : "Citizen"),
        is_active: u.is_active !== undefined ? (Number(u.is_active) === 1 ? 1 : 0) : 1
      };
    }

    if (isFirestore()) {
      const db = getDb();
      const coll = db.collection(COLLECTIONS.USERS);

      // 1. Exact login_id
      let snap = await coll.where("login_id", "==", cleanId).limit(1).get();
      if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));

      // 2. Uppercase login_id (e.g. cit-101 -> CIT-101)
      if (upperId !== cleanId) {
        snap = await coll.where("login_id", "==", upperId).limit(1).get();
        if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));
      }

      // 3. Lowercase login_id (e.g. ADMIN -> admin)
      if (lowerId !== cleanId) {
        snap = await coll.where("login_id", "==", lowerId).limit(1).get();
        if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));
      }

      // 4. By citizen_id
      snap = await coll.where("citizen_id", "==", cleanId).limit(1).get();
      if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));

      if (upperId !== cleanId) {
        snap = await coll.where("citizen_id", "==", upperId).limit(1).get();
        if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));
      }

      // 5. By phone
      snap = await coll.where("phone", "==", cleanId).limit(1).get();
      if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));

      // 6. By email
      snap = await coll.where("email", "==", lowerId).limit(1).get();
      if (!snap.empty) return normalizeUser(docToData(snap.docs[0]));

      // 7. Direct doc by ID
      const directDoc = await coll.doc(cleanId).get();
      if (directDoc.exists) return normalizeUser(docToData(directDoc));

      // 8. Case-insensitive document fallback scan
      const allSnap = await coll.get();
      for (const d of allSnap.docs) {
        const data = d.data();
        if (
          (data.login_id && String(data.login_id).toLowerCase() === lowerId) ||
          (data.citizen_id && String(data.citizen_id).toLowerCase() === lowerId) ||
          (data.phone && String(data.phone).trim() === cleanId) ||
          (data.email && String(data.email).toLowerCase() === lowerId)
        ) {
          return normalizeUser({ id: d.id, ...data });
        }
      }

      return null;
    }

    // MySQL
    const rows = await mysqlQuery(
      `SELECT * FROM users 
       WHERE login_id = ? 
          OR UPPER(login_id) = ? 
          OR citizen_id = ? 
          OR UPPER(citizen_id) = ? 
          OR phone = ? 
          OR LOWER(email) = ? 
          OR id = ? 
       LIMIT 1`,
      [cleanId, upperId, cleanId, upperId, cleanId, lowerId, cleanId]
    );
    return rows.length > 0 ? normalizeUser(rows[0]) : null;
  },

  async findById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.USERS).doc(cleanId).get();
      if (docSnap.exists) {
        return docToData(docSnap);
      }
      // Fallback by login_id
      const querySnap = await db.collection(COLLECTIONS.USERS)
        .where("login_id", "==", cleanId)
        .limit(1)
        .get();
      return querySnap.empty ? null : docToData(querySnap.docs[0]);
    }

    // MySQL
    const rows = await mysqlQuery(
      "SELECT * FROM users WHERE id = ? OR login_id = ? LIMIT 1",
      [cleanId, cleanId]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async updateProfile(id, updates) {
    const { fullName, roleTitle, phone, email } = updates;

    if (isFirestore()) {
      const db = getDb();
      // Ensure we have correct doc ID
      const user = await this.findById(id);
      if (!user) throw new Error(`User '${id}' not found`);

      const patch = cleanUndefined({
        full_name: fullName,
        role_title: roleTitle,
        phone,
        email,
        updated_at: new Date().toISOString()
      });

      await db.collection(COLLECTIONS.USERS).doc(user.id).update(patch);
      return this.findById(user.id);
    }

    // MySQL
    const user = await this.findById(id);
    if (!user) throw new Error(`User '${id}' not found`);

    const newFullName = fullName !== undefined ? String(fullName).trim() : user.full_name;
    const newRoleTitle = roleTitle !== undefined ? String(roleTitle).trim() : (user.role_title || "Administrator");
    const newPhone = phone !== undefined ? String(phone).trim() : user.phone;
    const newEmail = email !== undefined ? String(email).trim() : user.email;

    await mysqlQuery(
      "UPDATE users SET full_name = ?, role_title = ?, phone = ?, email = ? WHERE id = ?",
      [newFullName, newRoleTitle, newPhone, newEmail, user.id]
    );

    return this.findById(user.id);
  },

  async updatePassword(id, passwordHash) {
    if (isFirestore()) {
      const db = getDb();
      const user = await this.findById(id);
      if (!user) throw new Error(`User '${id}' not found`);
      await db.collection(COLLECTIONS.USERS).doc(user.id).update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      });
      return true;
    }

    // MySQL
    const user = await this.findById(id);
    if (!user) throw new Error(`User '${id}' not found`);
    await mysqlQuery("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, user.id]);
    return true;
  },

  async create(userData) {
    const id = userData.id || `usr-${Date.now()}`;
    const docData = {
      id,
      login_id: userData.login_id || userData.loginId,
      password_hash: userData.password_hash || userData.passwordHash,
      role: userData.role || "citizen",
      role_title: userData.role_title || userData.roleTitle || (userData.role === "admin" ? "Administrator" : "Citizen"),
      full_name: userData.full_name || userData.fullName,
      phone: userData.phone,
      email: userData.email || null,
      is_active: userData.is_active !== undefined ? (userData.is_active ? 1 : 0) : 1,
      citizen_id: userData.citizen_id || userData.citizenId || null,
      created_at: userData.created_at || new Date().toISOString()
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.USERS).doc(id).set(cleanUndefined(docData));
      return docData;
    }

    // MySQL
    await mysqlQuery(`
      INSERT INTO users (id, login_id, password_hash, role, role_title, full_name, phone, email, is_active, citizen_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      docData.id,
      docData.login_id,
      docData.password_hash,
      docData.role,
      docData.role_title,
      docData.full_name,
      docData.phone,
      docData.email,
      docData.is_active,
      docData.citizen_id
    ]);

    return docData;
  },

  async count() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.USERS).get();
      return snap.size;
    }
    const rows = await mysqlQuery("SELECT COUNT(*) as count FROM users");
    return Number(rows[0]?.count || 0);
  }
};

