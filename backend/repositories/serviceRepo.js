/**
 * JalMitra - Gram Panchayat Services Catalog Repository (Dual Driver: MySQL & Firestore)
 * Enforces strict, continuous, 1-based sequential ordering (1...N) without gaps or duplicates.
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

export function normalizeService(s) {
  if (!s) return null;
  return {
    ...s,
    id: s.id,
    service_code: s.service_key || s.service_code,
    service_key: s.service_key || s.service_code,
    name_en: s.title_en || s.name_en,
    name_mr: s.title_mr || s.name_mr,
    title_en: s.title_en || s.name_en,
    title_mr: s.title_mr || s.name_mr,
    category: s.category || "Civic Utilities",
    icon: s.icon || "🏛️",
    badge_text_en: s.badge_text_en || s.service_badge_text || s.badge_text || "Standard",
    badge_text_mr: s.badge_text_mr || "",
    service_badge_text: s.badge_text_en || s.service_badge_text || s.badge_text || "Standard",
    badge_type: s.badge_type || "counter",
    desc_en: s.desc_en || s.description || "",
    desc_mr: s.desc_mr || "",
    eligibility_en: s.eligibility_en || s.eligibility_instructions || "",
    eligibility_mr: s.eligibility_mr || "",
    eligibility_instructions: s.eligibility_en || s.eligibility_instructions || "",
    required_docs_en: s.required_docs_en || s.required_documents || "",
    required_docs_mr: s.required_docs_mr || "",
    required_documents: s.required_docs_en || s.required_documents || "",
    contact_info_en: s.contact_info_en || s.contact_department || "",
    contact_info_mr: s.contact_info_mr || "",
    contact_department: s.contact_info_en || s.contact_department || "",
    button_label_en: s.button_label_en || "Access Service",
    button_label_mr: s.button_label_mr || "सेवा मिळवा",
    nav_target: s.nav_target || s.action_target || "counter_info",
    action_target: s.nav_target || s.action_target || "counter_info",
    nav_extra_attrs: s.nav_extra_attrs || null,
    display_order: Number.isFinite(Number(s.display_order)) ? Number(s.display_order) : 9999,
    is_enabled: s.is_enabled !== undefined ? (s.is_enabled ? 1 : 0) : (s.is_active !== undefined ? (s.is_active ? 1 : 0) : 1),
    is_active: s.is_enabled !== undefined ? Boolean(s.is_enabled) : (s.is_active !== undefined ? Boolean(s.is_active) : true)
  };
}

export function serviceSortComparator(a, b) {
  const orderA = Number.isFinite(Number(a.display_order)) ? Number(a.display_order) : 999999;
  const orderB = Number.isFinite(Number(b.display_order)) ? Number(b.display_order) : 999999;
  if (orderA !== orderB) return orderA - orderB;
  const numA = Number(a.id);
  const numB = Number(b.id);
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return numA - numB;
  }
  return String(a.id || "").localeCompare(String(b.id || ""));
}

export const serviceRepo = {
  /**
   * Normalizes display_order across all services to be strictly 1...N without gaps or duplicates.
   * If customOrderedList is provided, that specific list order is assigned 1...N.
   * Otherwise, all services are fetched, sorted by display_order ASC, id ASC, and assigned 1...N.
   * Only rows/documents with differing orders are updated in the database.
   */
  async normalizeOrderSequence(customOrderedList = null) {
    let items = customOrderedList;
    if (!items || !Array.isArray(items)) {
      if (isFirestore()) {
        const db = getDb();
        const snap = await db.collection(COLLECTIONS.GP_SERVICES).get();
        items = docsToArray(snap).map(normalizeService);
      } else {
        const rows = await mysqlQuery("SELECT * FROM gp_services");
        items = rows.map(normalizeService);
      }
      items.sort(serviceSortComparator);
    }

    const toUpdate = [];
    const normalized = [];

    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i] };
      const targetOrder = i + 1;
      if (item.display_order !== targetOrder) {
        toUpdate.push({ id: item.id, display_order: targetOrder });
        item.display_order = targetOrder;
      }
      normalized.push(item);
    }

    if (toUpdate.length > 0) {
      if (isFirestore()) {
        const db = getDb();
        const coll = db.collection(COLLECTIONS.GP_SERVICES);
        const CHUNK_SIZE = 400;
        for (let c = 0; c < toUpdate.length; c += CHUNK_SIZE) {
          const chunk = toUpdate.slice(c, c + CHUNK_SIZE);
          const batch = db.batch();
          for (const u of chunk) {
            batch.update(coll.doc(String(u.id)), { display_order: u.display_order });
          }
          await batch.commit();
        }
      } else {
        for (const u of toUpdate) {
          await mysqlQuery("UPDATE gp_services SET display_order = ? WHERE id = ?", [u.display_order, u.id]);
        }
      }
    }

    return normalized;
  },

  /**
   * Retrieves all services, self-healing gaps/duplicates so ordering is strictly 1...N.
   * Supports optional filtering by enabledOnly, category, and status.
   */
  async getAll(enabledOnly = false, category = null, status = null) {
    let all;
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.GP_SERVICES).get();
      all = docsToArray(snap).map(normalizeService);
    } else {
      const rows = await mysqlQuery("SELECT * FROM gp_services");
      all = rows.map(normalizeService);
    }

    all.sort(serviceSortComparator);

    // Auto-healing: detect if sequence has any gaps, duplicates, or non-1 start
    let needsHealing = false;
    for (let i = 0; i < all.length; i++) {
      if (all[i].display_order !== i + 1) {
        needsHealing = true;
        break;
      }
    }

    if (needsHealing && all.length > 0) {
      all = await this.normalizeOrderSequence(all);
    }

    let filtered = all;
    if (enabledOnly || status === "active" || status === "1") {
      filtered = filtered.filter(s => s.is_enabled === 1 || s.is_active);
    } else if (status === "inactive" || status === "0" || status === "disabled") {
      filtered = filtered.filter(s => s.is_enabled === 0 || !s.is_active);
    }

    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }

    return filtered;
  },

  async getById(id) {
    if (!id && id !== 0) return null;
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

  /**
   * Creates a new service.
   * If display_order is omitted or invalid, it is placed at the end (N + 1).
   * If a specific order is requested, it is inserted at that position and subsequent items shift down.
   * Strict 1...N sequence is guaranteed and persisted.
   */
  async create(data) {
    const all = await this.getAll(false);
    const total = all.length;

    let targetOrder = (data.display_order !== undefined && data.display_order !== null && data.display_order !== "" && !isNaN(Number(data.display_order)))
      ? Number(data.display_order)
      : (total + 1);

    if (targetOrder < 1) targetOrder = 1;
    if (targetOrder > total + 1) targetOrder = total + 1;

    let id = data.id;
    const serviceKey = (data.service_key || data.service_code || data.code)
      ? String(data.service_key || data.service_code || data.code).trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : `srv_${Date.now()}`;

    const title_en = String(data.title_en || data.name_en || data.title || "Service").trim();
    const title_mr = String(data.title_mr || data.name_mr || title_en).trim();
    const category = String(data.category || "Civic Utilities").trim();
    const icon = data.icon || "🏛️";
    const badge_text_en = data.badge_text_en || data.service_badge_text || data.badge || "Office Counter";
    const badge_text_mr = data.badge_text_mr || badge_text_en;
    const badge_type = data.badge_type || "counter";
    const desc_en = String(data.desc_en || data.description || data.desc || "Gram Panchayat Service").trim();
    const desc_mr = data.desc_mr ? String(data.desc_mr).trim() : desc_en;
    const eligibility_en = data.eligibility_en || data.eligibility_instructions || "";
    const eligibility_mr = data.eligibility_mr || eligibility_en;
    const required_docs_en = data.required_docs_en || data.required_documents || "";
    const required_docs_mr = data.required_docs_mr || required_docs_en;
    const contact_info_en = data.contact_info_en || data.contact_department || "";
    const contact_info_mr = data.contact_info_mr || contact_info_en;
    const button_label_en = data.button_label_en || "Access Service";
    const button_label_mr = data.button_label_mr || "सेवा मिळवा";
    const nav_target = data.nav_target || data.action_target || "counter_info";
    const nav_extra_attrs = typeof data.nav_extra_attrs === "object" ? JSON.stringify(data.nav_extra_attrs) : (data.nav_extra_attrs || "{}");
    const is_enabled = data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : (data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1);

    if (isFirestore()) {
      if (!id) {
        const numericIds = all.map(s => Number(s.id)).filter(n => Number.isFinite(n) && n > 0);
        const nextId = numericIds.length > 0 ? (Math.max(...numericIds) + 1) : Date.now();
        id = String(nextId);
      }
      const db = getDb();
      const record = {
        id: String(id),
        service_key: serviceKey,
        title_en,
        title_mr,
        category,
        icon,
        badge_text_en,
        badge_text_mr,
        badge_type,
        desc_en,
        desc_mr,
        eligibility_en,
        eligibility_mr,
        required_docs_en,
        required_docs_mr,
        contact_info_en,
        contact_info_mr,
        button_label_en,
        button_label_mr,
        nav_target,
        nav_extra_attrs,
        display_order: targetOrder,
        is_enabled
      };
      await db.collection(COLLECTIONS.GP_SERVICES).doc(String(id)).set(cleanUndefined(record));

      const reordered = [...all];
      const insertIdx = targetOrder - 1;
      reordered.splice(insertIdx, 0, normalizeService(record));
      await this.normalizeOrderSequence(reordered);

      return await this.getById(id);
    }

    // MySQL
    const insertResult = await mysqlQuery(`
      INSERT INTO gp_services (
        service_key, title_en, title_mr, category, icon,
        badge_text_en, badge_text_mr, badge_type,
        desc_en, desc_mr, eligibility_en, eligibility_mr,
        required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
        button_label_en, button_label_mr, nav_target, nav_extra_attrs,
        display_order, is_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      serviceKey, title_en, title_mr, category, icon,
      badge_text_en, badge_text_mr, badge_type,
      desc_en, desc_mr, eligibility_en, eligibility_mr,
      required_docs_en, required_docs_mr, contact_info_en, contact_info_mr,
      button_label_en, button_label_mr, nav_target, nav_extra_attrs,
      targetOrder, is_enabled
    ]);

    const newId = insertResult.insertId;
    const [createdRow] = await mysqlQuery("SELECT * FROM gp_services WHERE id = ?", [newId]);
    const createdService = normalizeService(createdRow);

    const reordered = [...all];
    const insertIdx = targetOrder - 1;
    reordered.splice(insertIdx, 0, createdService);
    await this.normalizeOrderSequence(reordered);

    return await this.getById(newId);
  },

  /**
   * Updates an existing service.
   * If display_order changed, shifts other items and renormalizes 1...N.
   */
  async update(id, updates) {
    if (!id && id !== 0) throw new Error("Service ID is required");
    const cleanId = String(id).trim();

    const existing = await this.getById(cleanId);
    if (!existing) throw new Error(`Service #${cleanId} not found`);

    const patch = {};
    if (updates.title_en !== undefined || updates.name_en !== undefined) {
      patch.title_en = String(updates.title_en || updates.name_en).trim();
    }
    if (updates.title_mr !== undefined || updates.name_mr !== undefined) {
      patch.title_mr = String(updates.title_mr || updates.name_mr).trim();
    }
    if (updates.category !== undefined) patch.category = String(updates.category).trim();
    if (updates.icon !== undefined) patch.icon = updates.icon;
    if (updates.badge_text_en !== undefined || updates.service_badge_text !== undefined) {
      patch.badge_text_en = updates.badge_text_en || updates.service_badge_text;
    }
    if (updates.badge_text_mr !== undefined) patch.badge_text_mr = updates.badge_text_mr;
    if (updates.badge_type !== undefined) patch.badge_type = updates.badge_type;
    if (updates.desc_en !== undefined || updates.description !== undefined) {
      patch.desc_en = String(updates.desc_en || updates.description).trim();
    }
    if (updates.desc_mr !== undefined) patch.desc_mr = String(updates.desc_mr).trim();
    if (updates.eligibility_en !== undefined || updates.eligibility_instructions !== undefined) {
      patch.eligibility_en = updates.eligibility_en || updates.eligibility_instructions;
    }
    if (updates.eligibility_mr !== undefined) patch.eligibility_mr = updates.eligibility_mr;
    if (updates.required_docs_en !== undefined || updates.required_documents !== undefined) {
      patch.required_docs_en = updates.required_docs_en || updates.required_documents;
    }
    if (updates.required_docs_mr !== undefined) patch.required_docs_mr = updates.required_docs_mr;
    if (updates.contact_info_en !== undefined || updates.contact_department !== undefined) {
      patch.contact_info_en = updates.contact_info_en || updates.contact_department;
    }
    if (updates.contact_info_mr !== undefined) patch.contact_info_mr = updates.contact_info_mr;
    if (updates.button_label_en !== undefined) patch.button_label_en = updates.button_label_en;
    if (updates.button_label_mr !== undefined) patch.button_label_mr = updates.button_label_mr;
    if (updates.nav_target !== undefined || updates.action_target !== undefined) {
      patch.nav_target = updates.nav_target || updates.action_target;
    }
    if (updates.nav_extra_attrs !== undefined) {
      patch.nav_extra_attrs = typeof updates.nav_extra_attrs === "object" ? JSON.stringify(updates.nav_extra_attrs) : updates.nav_extra_attrs;
    }
    if (updates.is_enabled !== undefined) {
      patch.is_enabled = updates.is_enabled ? 1 : 0;
    } else if (updates.is_active !== undefined) {
      patch.is_enabled = updates.is_active ? 1 : 0;
    }

    const orderProvided = updates.display_order !== undefined && updates.display_order !== null && updates.display_order !== "" && !isNaN(Number(updates.display_order));
    const newOrder = orderProvided ? Number(updates.display_order) : existing.display_order;

    // 1. Update service attributes in DB
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GP_SERVICES).doc(cleanId).update(cleanUndefined({ ...patch, display_order: newOrder }));
    } else {
      const fields = [];
      const values = [];
      const fullPatch = { ...patch, display_order: newOrder };
      for (const [key, val] of Object.entries(fullPatch)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
      values.push(cleanId);
      if (fields.length > 0) {
        await mysqlQuery(`UPDATE gp_services SET ${fields.join(", ")} WHERE id = ?`, values);
      }
    }

    // 2. If order changed, shift other items and renormalize
    if (orderProvided && newOrder !== existing.display_order) {
      const all = await this.getAll(false);
      const currIdx = all.findIndex(s => String(s.id) === cleanId);
      if (currIdx !== -1) {
        const reordered = [...all];
        const [item] = reordered.splice(currIdx, 1);
        const targetIdx = Math.max(0, Math.min(newOrder - 1, reordered.length));
        reordered.splice(targetIdx, 0, item);
        await this.normalizeOrderSequence(reordered);
      }
    }

    return await this.getById(cleanId);
  },

  /**
   * Deletes a service and renormalizes remaining services to strictly 1...N-1.
   */
  async delete(id) {
    if (!id && id !== 0) return false;
    const cleanId = String(id).trim();

    const existing = await this.getById(cleanId);
    if (!existing) return false;

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GP_SERVICES).doc(cleanId).delete();
    } else {
      await mysqlQuery("DELETE FROM gp_services WHERE id = ?", [cleanId]);
    }

    // Renormalize remaining services
    const remaining = await this.getAll(false);
    await this.normalizeOrderSequence(remaining);
    return true;
  },

  /**
   * Moves a service up or down one position, swapping with adjacent item and renormalizing 1...N.
   */
  async moveOrder(id, direction) {
    if (!id && id !== 0) return null;
    const cleanId = String(id).trim();

    const all = await this.getAll(false);
    const currentIndex = all.findIndex(s => String(s.id) === cleanId);
    if (currentIndex === -1) return null;

    if (direction !== "up" && direction !== "down") {
      throw new Error("Direction must be 'up' or 'down'");
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= all.length) {
      return all[currentIndex];
    }

    const reordered = [...all];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const normalized = await this.normalizeOrderSequence(reordered);
    return normalized.find(s => String(s.id) === cleanId) || all[currentIndex];
  },

  /**
   * Batch reorders services based on the provided items array.
   */
  async reorder(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Items array is required");
    }

    const all = await this.getAll(false);
    const orderMap = new Map();
    items.forEach((it, idx) => {
      const order = (it.display_order !== undefined && it.display_order !== null && !isNaN(Number(it.display_order)))
        ? Number(it.display_order)
        : (idx + 1);
      orderMap.set(String(it.id), order);
    });

    all.sort((a, b) => {
      const ordA = orderMap.has(String(a.id)) ? orderMap.get(String(a.id)) : a.display_order;
      const ordB = orderMap.has(String(b.id)) ? orderMap.get(String(b.id)) : b.display_order;
      if (ordA !== ordB) return ordA - ordB;
      return serviceSortComparator(a, b);
    });

    return await this.normalizeOrderSequence(all);
  }
};
