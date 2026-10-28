/**
 * JalMitra - Village Settings Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

const DEFAULT_SETTINGS = {
  id: "current",
  village_name: "Gram Panchayat",
  village_name_mr: "ग्रामपंचायत",
  district: "Pune",
  taluka: "Haveli",
  state: "Maharashtra",
  sarpanch_name: "Shri. Vitthalrao Deshmukh",
  sarpanch_photo: null,
  gram_sevak_name: "Shri. Ramesh Patil",
  gram_sevak_photo: null,
  secretary_name: "Smt. Sunita Kulkarni",
  secretary_photo: null,
  office_address: "Gram Panchayat Karyalaya, Main Chowk",
  office_email: "grampanchayat@gov.in",
  office_hours: "Mon – Sat: 10:00 AM – 05:30 PM",
  office_phone: "02489-234567 / 1800-120-JAL",
  helpline: "02489-234567 / 1800-120-JAL",
  intro_text: "Welcome to the official Gram Panchayat digital administration portal.",
  intro_text_mr: "ग्रामपंचायतीच्या अधिकृत ई-प्रशासन पोर्टलवर आपले सहर्ष स्वागत आहे.",
  overall_status: "Low",
  notice_text: "",
  last_updated: "Today at 08:30 AM",
  officer_name: "Shri. Ramesh Patil"
};

export const villageRepo = {
  async getSettings() {
    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.VILLAGE_SETTINGS).doc("current").get();
      if (!docSnap.exists) {
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...docSnap.data(), id: "current" };
    }

    // MySQL
    const rows = await mysqlQuery("SELECT * FROM village_settings WHERE id = 'current' LIMIT 1");
    if (rows.length === 0) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...rows[0] };
  },

  async updateSettings(data) {
    const existing = await this.getSettings();
    const updated = {
      ...existing,
      ...cleanUndefined(data),
      id: "current",
      last_updated: data.last_updated || data.lastUpdated || "Just now by Admin"
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.VILLAGE_SETTINGS).doc("current").set(cleanUndefined(updated), { merge: true });
      return updated;
    }

    // MySQL
    await mysqlQuery(`
      INSERT INTO village_settings (
        id, village_name, village_name_mr, district, taluka, state,
        sarpanch_name, sarpanch_photo, gram_sevak_name, gram_sevak_photo,
        secretary_name, secretary_photo, office_address, office_email,
        office_hours, intro_text, intro_text_mr, overall_status, notice_text,
        last_updated, officer_name, helpline
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        village_name = VALUES(village_name),
        village_name_mr = VALUES(village_name_mr),
        district = VALUES(district),
        taluka = VALUES(taluka),
        state = VALUES(state),
        sarpanch_name = VALUES(sarpanch_name),
        sarpanch_photo = VALUES(sarpanch_photo),
        gram_sevak_name = VALUES(gram_sevak_name),
        gram_sevak_photo = VALUES(gram_sevak_photo),
        secretary_name = VALUES(secretary_name),
        secretary_photo = VALUES(secretary_photo),
        office_address = VALUES(office_address),
        office_email = VALUES(office_email),
        office_hours = VALUES(office_hours),
        intro_text = VALUES(intro_text),
        intro_text_mr = VALUES(intro_text_mr),
        overall_status = VALUES(overall_status),
        notice_text = VALUES(notice_text),
        last_updated = VALUES(last_updated),
        officer_name = VALUES(officer_name),
        helpline = VALUES(helpline)
    `, [
      "current",
      updated.village_name,
      updated.village_name_mr || null,
      updated.district,
      updated.taluka,
      updated.state,
      updated.sarpanch_name,
      updated.sarpanch_photo || null,
      updated.gram_sevak_name,
      updated.gram_sevak_photo || null,
      updated.secretary_name,
      updated.secretary_photo || null,
      updated.office_address,
      updated.office_email,
      updated.office_hours,
      updated.intro_text,
      updated.intro_text_mr || null,
      updated.overall_status,
      updated.notice_text || "",
      updated.last_updated,
      updated.officer_name || updated.gram_sevak_name,
      updated.office_phone || updated.helpline
    ]);

    return updated;
  }
};

