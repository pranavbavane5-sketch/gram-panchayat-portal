/**
 * JalMitra - Panchayat Applications, Notices & Tasks Repository
 * (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeApplication(a) {
  if (!a) return null;
  const applicantName = a.applicant_name || a.applicantName || a.citizen_name || a.citizenName || "";
  const applicantPhone = a.applicant_phone || a.applicantPhone || a.citizen_phone || a.citizenPhone || "";
  const wardArea = a.ward_area || a.wardArea || a.ward || null;
  return {
    ...a,
    id: a.id,
    reference_no: a.reference_no || a.referenceNo,
    applicant_name: applicantName,
    citizen_name: applicantName,
    applicant_phone: applicantPhone,
    citizen_phone: applicantPhone,
    applicant_email: a.applicant_email || a.applicantEmail || null,
    ward_area: wardArea,
    ward: wardArea,
    property_no: a.property_no || a.propertyNo || null,
    category: a.category,
    sub_type: a.sub_type || a.subType || null,
    subject: a.subject,
    description: a.description,
    urgency: a.urgency || "Normal",
    status: a.status || "Submitted",
    attachment_path: a.attachment_path || a.attachmentPath || null,
    attachment_name: a.attachment_name || a.attachmentName || null,
    officer_remarks: a.officer_remarks || a.officerRemarks || null,
    assigned_to: a.assigned_to || a.assignedTo || null,
    is_rti: a.is_rti !== undefined ? (a.is_rti ? 1 : 0) : 0,
    created_at: a.created_at || a.createdAt,
    updated_at: a.updated_at || a.updatedAt
  };
}

export const panchayatRepo = {
  // --- APPLICATIONS ---
  async getApplicationById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.APPLICATIONS).doc(cleanId).get();
      if (docSnap.exists) return normalizeApplication(docToData(docSnap));

      // Try by reference_no
      const snap = await db.collection(COLLECTIONS.APPLICATIONS).where("reference_no", "==", cleanId).limit(1).get();
      return snap.empty ? null : normalizeApplication(docToData(snap.docs[0]));
    }

    const rows = await mysqlQuery("SELECT * FROM applications WHERE id = ? OR reference_no = ? LIMIT 1", [cleanId, cleanId]);
    return rows.length > 0 ? normalizeApplication(rows[0]) : null;
  },

  async getAllApplications(filters = {}) {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.APPLICATIONS).get();
      let apps = docsToArray(snap).map(normalizeApplication);

      if (filters.status) {
        apps = apps.filter(a => a.status === filters.status);
      }
      if (filters.category) {
        apps = apps.filter(a => a.category === filters.category);
      }
      if (filters.phone) {
        apps = apps.filter(a => a.applicant_phone === filters.phone);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        apps = apps.filter(a =>
          (a.applicant_name && a.applicant_name.toLowerCase().includes(q)) ||
          (a.reference_no && a.reference_no.toLowerCase().includes(q)) ||
          (a.subject && a.subject.toLowerCase().includes(q))
        );
      }

      return apps.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    }

    let sql = "SELECT * FROM applications WHERE 1=1";
    const params = [];
    if (filters.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.category) {
      sql += " AND category = ?";
      params.push(filters.category);
    }
    if (filters.phone) {
      sql += " AND applicant_phone = ?";
      params.push(filters.phone);
    }
    if (filters.search) {
      sql += " AND (applicant_name LIKE ? OR reference_no LIKE ? OR subject LIKE ?)";
      const pattern = `%${filters.search}%`;
      params.push(pattern, pattern, pattern);
    }
    sql += " ORDER BY created_at DESC";

    const rows = await mysqlQuery(sql, params);
    return rows.map(normalizeApplication);
  },

  async createApplication(data) {
    const id = data.id || `app-${Date.now()}`;
    const refYear = new Date().getFullYear();
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const referenceNo = data.reference_no || data.referenceNo || `GP-APP-${refYear}-${randPart}`;
    const nowIso = new Date().toISOString();

    const record = {
      id,
      reference_no: referenceNo,
      applicant_name: (data.applicant_name || data.applicantName || "").trim(),
      applicant_phone: (data.applicant_phone || data.applicantPhone || "").trim(),
      applicant_email: data.applicant_email || data.applicantEmail || null,
      ward_area: data.ward_area || data.wardArea || null,
      property_no: data.property_no || data.propertyNo || null,
      category: data.category || "General",
      sub_type: data.sub_type || data.subType || null,
      subject: (data.subject || "").trim(),
      description: (data.description || "").trim(),
      urgency: data.urgency || "Normal",
      status: data.status || "Submitted",
      attachment_path: data.attachment_path || data.attachmentPath || null,
      attachment_name: data.attachment_name || data.attachmentName || null,
      officer_remarks: data.officer_remarks || null,
      assigned_to: data.assigned_to || null,
      is_rti: data.is_rti ? 1 : 0,
      rti_fee_status: data.rti_fee_status || null,
      rti_fee_receipt_no: data.rti_fee_receipt_no || null,
      is_citizen_of_india: data.is_citizen_of_india ? 1 : 0,
      is_draft: data.is_draft ? 1 : 0,
      template_type: data.template_type || null,
      letter_content: data.letter_content || null,
      created_at: data.created_at || nowIso,
      updated_at: nowIso
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.APPLICATIONS).doc(id).set(cleanUndefined(record));

      // Initial history entry
      const histId = `hist-${Date.now()}`;
      await db.collection(COLLECTIONS.APPLICATION_HISTORY).doc(histId).set({
        id: histId,
        application_id: id,
        status: record.status,
        action_by: record.applicant_name,
        remarks: "Application submitted successfully.",
        action_date: nowIso
      });

      return normalizeApplication(record);
    }

    // MySQL
    await mysqlQuery(`
      INSERT INTO applications (
        id, reference_no, applicant_name, applicant_phone, applicant_email,
        ward_area, property_no, category, sub_type, subject,
        description, urgency, status, attachment_path, attachment_name,
        officer_remarks, assigned_to, is_rti, rti_fee_status, rti_fee_receipt_no,
        is_citizen_of_india, is_draft, template_type, letter_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id, record.reference_no, record.applicant_name, record.applicant_phone, record.applicant_email,
      record.ward_area, record.property_no, record.category, record.sub_type, record.subject,
      record.description, record.urgency, record.status, record.attachment_path, record.attachment_name,
      record.officer_remarks, record.assigned_to, record.is_rti, record.rti_fee_status, record.rti_fee_receipt_no,
      record.is_citizen_of_india, record.is_draft, record.template_type, record.letter_content
    ]);

    // Initial history entry
    const histId = `hist-${Date.now()}`;
    await mysqlQuery(`
      INSERT INTO application_history (id, application_id, status, action_by, remarks)
      VALUES (?, ?, ?, ?, ?)
    `, [histId, id, record.status, record.applicant_name, "Application submitted successfully."]);

    return normalizeApplication(record);
  },

  async updateApplicationStatus(id, { status, officer_remarks, updated_by }) {
    const app = await this.getApplicationById(id);
    if (!app) throw new Error(`Application '${id}' not found`);

    const nowIso = new Date().toISOString();
    const remarks = officer_remarks || `Status updated to ${status}`;
    const by = updated_by || "Panchayat Officer";

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.APPLICATIONS).doc(app.id).update({
        status,
        officer_remarks: remarks,
        updated_at: nowIso
      });

      const histId = `hist-${Date.now()}`;
      await db.collection(COLLECTIONS.APPLICATION_HISTORY).doc(histId).set({
        id: histId,
        application_id: app.id,
        status,
        action_by: by,
        remarks,
        action_date: nowIso
      });

      return this.getApplicationById(app.id);
    }

    await mysqlQuery(`
      UPDATE applications 
      SET status = ?, officer_remarks = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, remarks, app.id]);

    const histId = `hist-${Date.now()}`;
    await mysqlQuery(`
      INSERT INTO application_history (id, application_id, status, action_by, remarks)
      VALUES (?, ?, ?, ?, ?)
    `, [histId, app.id, status, by, remarks]);

    return this.getApplicationById(app.id);
  },

  async getApplicationHistory(appId) {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.APPLICATION_HISTORY)
        .where("application_id", "==", appId)
        .get();
      return docsToArray(snap).sort((a, b) => String(a.action_date || "").localeCompare(String(b.action_date || "")));
    }

    const rows = await mysqlQuery(`
      SELECT * FROM application_history 
      WHERE application_id = ? 
      ORDER BY action_date ASC
    `, [appId]);
    return rows;
  },

  // --- NOTICES ---
  async getNotices(activeOnly = true) {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.PUBLIC_NOTICES).get();
      let notices = docsToArray(snap);

      if (activeOnly) {
        const now = new Date();
        notices = notices.filter(n => {
          if (n.is_active === 0 || n.is_active === false) return false;
          if (n.expiry_date) {
            const exp = new Date(n.expiry_date);
            if (!isNaN(exp.getTime()) && exp < now) return false;
          }
          return true;
        });
      }

      return notices.sort((a, b) => {
        if (b.is_pinned !== a.is_pinned) return (b.is_pinned || 0) - (a.is_pinned || 0);
        return String(b.publish_date || b.created_at || "").localeCompare(String(a.publish_date || a.created_at || ""));
      });
    }

    const sql = activeOnly
      ? "SELECT * FROM public_notices WHERE expiry_date IS NULL OR expiry_date >= CURRENT_DATE ORDER BY is_pinned DESC, publish_date DESC"
      : "SELECT * FROM public_notices ORDER BY is_pinned DESC, publish_date DESC";
    return mysqlQuery(sql);
  },

  async createNotice(data) {
    const id = data.id || `not-${Date.now()}`;
    const record = {
      id,
      title_en: data.title_en || data.titleEn || data.title,
      title_mr: data.title_mr || data.titleMr || null,
      content_en: data.content_en || data.contentEn || data.content,
      content_mr: data.content_mr || data.contentMr || null,
      notice_type: data.notice_type || data.noticeType || "General",
      is_pinned: data.is_pinned ? 1 : 0,
      publish_date: data.publish_date || new Date().toISOString().split("T")[0],
      expiry_date: data.expiry_date || null,
      attachment_path: data.attachment_path || null,
      is_active: 1
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.PUBLIC_NOTICES).doc(id).set(cleanUndefined(record));
      return record;
    }

    await mysqlQuery(`
      INSERT INTO public_notices (id, title_en, title_mr, content_en, content_mr, notice_type, is_pinned, publish_date, expiry_date, attachment_path, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.title_en, record.title_mr, record.content_en, record.content_mr, record.notice_type, record.is_pinned, record.publish_date, record.expiry_date, record.attachment_path, record.is_active]);

    return record;
  },

  async deleteNotice(id) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.PUBLIC_NOTICES).doc(id).delete();
      return true;
    }
    const res = await mysqlQuery("DELETE FROM public_notices WHERE id = ?", [id]);
    return res.affectedRows > 0;
  },

  // --- TASKS ---
  async getTasks(status = null) {
    if (isFirestore()) {
      const db = getDb();
      let snap;
      if (status) {
        snap = await db.collection(COLLECTIONS.GRAM_PANCHAYAT_TASKS).where("status", "==", status).get();
      } else {
        snap = await db.collection(COLLECTIONS.GRAM_PANCHAYAT_TASKS).get();
      }
      return docsToArray(snap).sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || "")));
    }

    const sql = status
      ? "SELECT * FROM gram_panchayat_tasks WHERE status = ? ORDER BY due_date ASC"
      : "SELECT * FROM gram_panchayat_tasks ORDER BY due_date ASC";
    const params = status ? [status] : [];
    return mysqlQuery(sql, params);
  },

  async createTask(data) {
    const id = data.id || `tsk-${Date.now()}`;
    const record = {
      id,
      title: (data.title || "").trim(),
      description: data.description || null,
      assigned_to: data.assigned_to || data.assignedTo || "Panchayat Staff",
      priority: data.priority || "Medium",
      status: data.status || "Pending",
      due_date: data.due_date || data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GRAM_PANCHAYAT_TASKS).doc(id).set(cleanUndefined(record));
      return record;
    }

    await mysqlQuery(`
      INSERT INTO gram_panchayat_tasks (id, title, description, assigned_to, priority, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.title, record.description, record.assigned_to, record.priority, record.status, record.due_date]);

    return record;
  },

  async updateTaskStatus(id, status) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.GRAM_PANCHAYAT_TASKS).doc(id).update({
        status,
        completed_at: status === "Completed" ? new Date().toISOString() : null
      });
      return true;
    }

    const res = await mysqlQuery("UPDATE gram_panchayat_tasks SET status = ? WHERE id = ?", [status, id]);
    return res.affectedRows > 0;
  }
};

