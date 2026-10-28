/**
 * JalMitra - Billing, Payments & Taxes Repository (Dual Driver: MySQL & Firestore)
 */

import { isFirestore, getDb, docToData, docsToArray, cleanUndefined, mysqlQuery, COLLECTIONS } from "./baseRepo.js";

function normalizeBill(b) {
  if (!b) return null;
  return {
    id: b.id,
    citizen_id: b.citizen_id || b.citizenId,
    property_id: b.property_id || b.propertyId || null,
    billing_period: b.billing_period || b.billingPeriod,
    amount: Number(b.amount || 0),
    paid_amount: Number(b.paid_amount || b.paidAmount || 0),
    due_date: b.due_date ? (typeof b.due_date === "string" ? b.due_date.split("T")[0] : b.due_date.toISOString().split("T")[0]) : "",
    status: b.status || "Unpaid"
  };
}

function normalizePayment(p) {
  if (!p) return null;
  return {
    id: p.id,
    bill_id: p.bill_id || p.billId,
    citizen_id: p.citizen_id || p.citizenId,
    amount: Number(p.amount || 0),
    payment_mode: p.payment_mode || p.paymentMode || "UPI",
    receipt_no: p.receipt_no || p.receiptNo,
    notes: p.notes || null,
    billing_period: p.billing_period || null,
    payment_date: p.payment_date || p.paymentDate || new Date().toISOString()
  };
}

function normalizeTax(t) {
  if (!t) return null;
  const chargeType = t.charge_type || t.chargeType || t.tax_name || t.taxName || t.title || "General Water Tax";
  const desc = t.description || t.tax_category || t.taxCategory || t.category || "Panchayat Cess";
  return {
    id: t.id,
    citizen_id: t.citizen_id || t.citizenId,
    property_id: t.property_id || t.propertyId || null,
    charge_type: chargeType,
    description: desc,
    tax_name: chargeType,
    tax_category: desc,
    amount: Number(t.amount || 0),
    due_date: t.due_date ? (typeof t.due_date === "string" ? t.due_date.split("T")[0] : t.due_date.toISOString().split("T")[0]) : "",
    status: t.status || "Unpaid"
  };
}

export const billingRepo = {
  // --- WATER BILLS ---
  async getAllBills() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.WATER_BILLS).get();
      return docsToArray(snap).map(normalizeBill).sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)));
    }
    const rows = await mysqlQuery("SELECT * FROM water_bills ORDER BY due_date DESC");
    return rows.map(normalizeBill);
  },

  async getBillById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();

    if (isFirestore()) {
      const db = getDb();
      const docSnap = await db.collection(COLLECTIONS.WATER_BILLS).doc(cleanId).get();
      return docToData(docSnap) ? normalizeBill(docToData(docSnap)) : null;
    }
    const rows = await mysqlQuery("SELECT * FROM water_bills WHERE id = ? LIMIT 1", [cleanId]);
    return rows.length > 0 ? normalizeBill(rows[0]) : null;
  },

  async getBillsByCitizenId(citizenId) {
    if (!citizenId) return [];
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.WATER_BILLS).where("citizen_id", "==", citizenId).get();
      return docsToArray(snap).map(normalizeBill).sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)));
    }
    const rows = await mysqlQuery("SELECT * FROM water_bills WHERE citizen_id = ? ORDER BY due_date DESC", [citizenId]);
    return rows.map(normalizeBill);
  },

  async createBill(data) {
    const id = data.id || `BILL-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      citizen_id: data.citizen_id || data.citizenId,
      property_id: data.property_id || data.propertyId || null,
      billing_period: data.billing_period || data.billingPeriod,
      amount: parseFloat(data.amount || 0),
      paid_amount: parseFloat(data.paid_amount || data.paidAmount || 0),
      due_date: data.due_date || data.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      status: data.status || "Unpaid"
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_BILLS).doc(id).set(cleanUndefined(record));
      return normalizeBill(record);
    }

    await mysqlQuery(`
      INSERT INTO water_bills (id, citizen_id, property_id, billing_period, amount, paid_amount, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.citizen_id, record.property_id, record.billing_period, record.amount, record.paid_amount, record.due_date, record.status]);

    return normalizeBill(record);
  },

  async updateBill(id, updates) {
    const existing = await this.getBillById(id);
    if (!existing) throw new Error(`Bill '${id}' not found`);

    const patch = cleanUndefined({
      paid_amount: updates.paid_amount !== undefined ? parseFloat(updates.paid_amount) : undefined,
      status: updates.status
    });

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.WATER_BILLS).doc(id).update(patch);
      return this.getBillById(id);
    }

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = ?`);
      values.push(v);
    }
    values.push(id);
    await mysqlQuery(`UPDATE water_bills SET ${fields.join(", ")} WHERE id = ?`, values);
    return this.getBillById(id);
  },

  // --- PAYMENTS ---
  async getAllPayments() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.PAYMENTS).get();
      const payments = docsToArray(snap).map(normalizePayment);
      // Join with bills for billing_period if needed
      const bills = await this.getAllBills();
      const billMap = new Map(bills.map(b => [b.id, b.billing_period]));
      payments.forEach(p => {
        if (!p.billing_period && p.bill_id) {
          p.billing_period = billMap.get(p.bill_id) || "Standard Water Charge";
        }
      });
      return payments.sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)));
    }

    const rows = await mysqlQuery(`
      SELECT p.*, b.billing_period 
      FROM payments p
      LEFT JOIN water_bills b ON p.bill_id = b.id
      ORDER BY p.payment_date DESC
    `);
    return rows.map(normalizePayment);
  },

  async getPaymentsByCitizenId(citizenId) {
    if (!citizenId) return [];
    if (isFirestore()) {
      const all = await this.getAllPayments();
      return all.filter(p => p.citizen_id === citizenId);
    }

    const rows = await mysqlQuery(`
      SELECT p.*, b.billing_period 
      FROM payments p
      LEFT JOIN water_bills b ON p.bill_id = b.id
      WHERE p.citizen_id = ?
      ORDER BY p.payment_date DESC
    `, [citizenId]);
    return rows.map(normalizePayment);
  },

  async recordPayment(data) {
    const id = data.id || `PAY-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      bill_id: data.bill_id || data.billId,
      citizen_id: data.citizen_id || data.citizenId,
      amount: parseFloat(data.amount || 0),
      payment_mode: data.payment_mode || data.paymentMode || "UPI",
      receipt_no: data.receipt_no || data.receiptNo || `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      notes: data.notes || "Paid via JalMitra Portal",
      payment_date: data.payment_date || new Date().toISOString()
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.PAYMENTS).doc(id).set(cleanUndefined(record));
      // Mark bill as paid
      if (record.bill_id) {
        await this.updateBill(record.bill_id, {
          paid_amount: record.amount,
          status: "Paid"
        });
      }
      return normalizePayment(record);
    }

    await mysqlQuery(`
      INSERT INTO payments (id, bill_id, citizen_id, amount, payment_mode, receipt_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.bill_id, record.citizen_id, record.amount, record.payment_mode, record.receipt_no, record.notes]);

    if (record.bill_id) {
      await mysqlQuery(`
        UPDATE water_bills 
        SET paid_amount = amount, status = 'Paid' 
        WHERE id = ?
      `, [record.bill_id]);
    }

    return normalizePayment(record);
  },

  // --- TAXES & CHARGES ---
  async getAllTaxes() {
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.TAXES_CHARGES).get();
      return docsToArray(snap).map(normalizeTax).sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)));
    }
    const rows = await mysqlQuery("SELECT * FROM taxes_charges ORDER BY due_date DESC");
    return rows.map(normalizeTax);
  },

  async getTaxesByCitizenId(citizenId) {
    if (!citizenId) return [];
    if (isFirestore()) {
      const db = getDb();
      const snap = await db.collection(COLLECTIONS.TAXES_CHARGES).where("citizen_id", "==", citizenId).get();
      return docsToArray(snap).map(normalizeTax).sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)));
    }
    const rows = await mysqlQuery("SELECT * FROM taxes_charges WHERE citizen_id = ? ORDER BY due_date DESC", [citizenId]);
    return rows.map(normalizeTax);
  },

  async createTax(data) {
    const id = data.id || `TAX-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      citizen_id: data.citizen_id || data.citizenId,
      property_id: data.property_id || data.propertyId || null,
      tax_name: data.tax_name || data.taxName,
      tax_category: data.tax_category || data.taxCategory || "General",
      amount: parseFloat(data.amount || 0),
      due_date: data.due_date || data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: data.status || "Unpaid"
    };

    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.TAXES_CHARGES).doc(id).set(cleanUndefined(record));
      return normalizeTax(record);
    }

    await mysqlQuery(`
      INSERT INTO taxes_charges (id, citizen_id, property_id, tax_name, tax_category, amount, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [record.id, record.citizen_id, record.property_id, record.tax_name, record.tax_category, record.amount, record.due_date, record.status]);

    return normalizeTax(record);
  },

  async updateTaxStatus(id, status) {
    if (isFirestore()) {
      const db = getDb();
      await db.collection(COLLECTIONS.TAXES_CHARGES).doc(id).update({
        status,
        updated_at: new Date().toISOString()
      });
      return true;
    }
    const res = await mysqlQuery("UPDATE taxes_charges SET status = ? WHERE id = ?", [status, id]);
    return res.affectedRows > 0;
  }
};

