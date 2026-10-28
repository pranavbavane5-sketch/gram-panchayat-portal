/**
 * JalMitra - Gram Panchayat Services Catalog Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeService(s) {
  if (!s) return null;
  return {
    ...s,
    id: s.id,
    service_code: s.service_key || s.service_code,
    name_en: s.title_en || s.name_en,
    name_mr: s.title_mr || s.name_mr,
    title_en: s.title_en || s.name_en,
    title_mr: s.title_mr || s.name_mr,
    category: s.category,
    icon: s.icon || "file-text",
    badge_text_en: s.badge_text_en || s.service_badge_text || s.badge_text,
    badge_text_mr: s.badge_text_mr || "",
    badge_type: s.badge_type || "info",
    desc_en: s.desc_en,
    desc_mr: s.desc_mr,
    eligibility_en: s.eligibility_en || s.eligibility_instructions,
    eligibility_mr: s.eligibility_mr,
    required_docs_en: s.required_docs_en || s.required_documents,
    required_docs_mr: s.required_docs_mr,
    contact_info_en: s.contact_info_en || s.contact_department,
    contact_info_mr: s.contact_info_mr,
    button_label_en: s.button_label_en || "Apply Now",
    button_label_mr: s.button_label_mr || "अर्ज करा",
    nav_target: s.nav_target || s.action_target,
    action_target: s.nav_target || s.action_target,
    nav_extra_attrs: s.nav_extra_attrs || null,
    display_order: Number(s.display_order !== undefined ? s.display_order : 999),
    is_enabled: s.is_enabled !== undefined ? (s.is_enabled ? 1 : 0) : 1,
    is_active: Boolean(s.is_enabled)
  };
}

export const serviceRepo = {
  async getAll(enabledOnly = false) {
    if (isFirestore()) {
      const db = getDb();
      const coll = db.collection(COLLECTIONS.GP_SERVICES);
      let snap;
      if (enabledOnly) {
        snap = await coll.where("is_enabled", "==", 1).get();
      } else {
        snap = await coll.get();
      }
      const raw = docsToArray(snap);
      const sorted = raw
        .map(normalizeService)
        .sort((a, b) => {
          if (a.display_order !== b.display_order) return a.display_order - b.display_order;
          return String(a.id).localeCompare(String(b.id));
        });
      return sorted;
    }

    // MySQL
    const sql = enabledOnly
      ? "SELECT * FROM gp_services WHERE is_enabled = 1 ORDER BY display_order ASC, id ASC"
      : "SELECT * FROM gp_services ORDER BY display_order ASC, id ASC";
    const rows = await mysqlQuery(sql);
    return rows.map(normalizeService);
  },

  async getById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.GP_SERVICES).doc(cleanId).get();
      return docToData(docSnap) ? normalizeService(docToData(docSnap)) : null;
    }

    // MySQL
    const rows = await mysqlQuery("SELECT * FROM gp_services WHERE id = ? LIMIT 1", [cleanId]);
    return rows.length > 0 ? normalizeService(rows[0]) : null;
  },

  async create(data) {
    const id = data.id || `srv-${Date.now()}`;
    const all = await this.getAll(false);
    const maxOrder = all.reduce((max, s) => Math.max(max, s.display_order || 0), 0);
    const displayOrder = data.display_order !== undefined ? Number(data.display_order) : maxOrder + 1;

    const record = {
      id,
      service_key: data.service_key || data.service_code || id,
      title_en: data.title_en || data.name_en || "Service",
      title_mr: data.title_mr || data.name_mr || "",
      category: data.category || "General",
      icon: data.icon || "file-text",
      badge_text_en: data.badge_text_en || data.badge_text || "",
      badge_text_mr: data.badge_text_mr || "",
      badge_type: data.badge_type || "info",
      desc_en: data.desc_en || "",
      desc_mr: data.desc_mr || "",
      eligibility_en: data.eligibility_en || "",
      eligibility_mr: data.eligibility_mr || "",
      required_docs_en: data.required_docs_en || "",
      required_docs_mr: data.required_docs_mr || "",
      contact_info_en: data.contact_info_en || "",
      contact_info_mr: data.contact_info_mr || "",
      button_label_en: data.button_label_en || "Apply Now",
      button_label_mr: data.button_label_mr || "अर्ज करा",
      nav_target: data.nav_target || data.action_target || "",
      nav_extra_attrs: data.nav_extra_attrs || null,
      display_order: displayOrder,
      is_enabled: data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : 1
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GP_SERVICES).doc(id).set(cleanUndefined(record));
      return normalizeService(record);
    }

    // MySQL
    await mysqlQuery(`
      INSERT INTO gp_services (
        id, service_key, title_en, title_mr, category, icon,
        badge_text_en, badge_text_mr, badge_type,
        desc_en, desc_mr, eligibility_en, eligibility_mr,
        required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
        button_label_en, button_label_mr, nav_target, nav_extra_attrs,
        display_order, is_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id, record.service_key, record.title_en, record.title_mr, record.category, record.icon,
      record.badge_text_en, record.badge_text_mr, record.badge_type,
      record.desc_en, record.desc_mr, record.eligibility_en, record.eligibility_mr,
      record.required_docs_en, record.required_docs_mr, record.contact_info_en, record.contact_info_mr,
      record.button_label_en, record.button_label_mr, record.nav_target, record.nav_extra_attrs,
      record.display_order, record.is_enabled
    ]);

    return normalizeService(record);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Service '${id}' not found`);

    const patch = {
      ...cleanUndefined(updates),
      display_order: updates.display_order !== undefined ? Number(updates.display_order) : existing.display_order,
      is_enabled: updates.is_enabled !== undefined ? (updates.is_enabled ? 1 : 0) : existing.is_enabled
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GP_SERVICES).doc(id).update(cleanUndefined(patch));
      return this.getById(id);
    }

    // MySQL
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(patch)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    values.push(id);
    await mysqlQuery(`UPDATE gp_services SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getById(id);
  },

  async delete(id) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GP_SERVICES).doc(id).delete();
      return true;
    }

    // MySQL
    const res = await mysqlQuery("DELETE FROM gp_services WHERE id = ?", [id]);
    return res.affectedRows > 0;
  },

  async moveOrder(id, direction) {
    const all = await this.getAll(false);
    const index = all.findIndex(s => s.id === id);
    if (index === -1) return false;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= all.length) return false;

    const currentItem = all[index];
    const targetItem = all[targetIndex];

    const currentOrder = currentItem.display_order;
    const targetOrder = targetItem.display_order;

    await this.update(currentItem.id, { display_order: targetOrder });
    await this.update(targetItem.id, { display_order: currentOrder });
    return true;
  }
};

