/**
 * JalMitra - Backend REST API Client
 * Connects the frontend to the Express + MySQL backend.
 */

// Determine API Base URL:
// 1. Explicit window.__API_URL__ (runtime override, e.g. for testing)
// 2. Vite environment variable import.meta.env.VITE_API_BASE_URL (build-time override)
// 3. In production mode: defaults to "/api" (same-domain relative path for Vercel Serverless & reverse proxies)
// 4. In development mode: defaults to "http://localhost:5000/api"
export const API_BASE_URL = (typeof window !== "undefined" && window.__API_URL__) 
  || (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

// Auth token storage key
export const AUTH_TOKEN_KEY = "jalmitra_auth_token";
export const AUTH_USER_KEY = "jalmitra_auth_user";

let memoryToken = null;
let memoryUser = null;

export function getAuthToken() {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthSession(token, user) {
  memoryToken = token || null;
  memoryUser = user || null;
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  memoryToken = null;
  memoryUser = null;
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getCurrentUser() {
  if (memoryUser) return memoryUser;
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401 && endpoint !== "/auth/login") {
        clearAuthSession();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:unauthorized", {
            detail: {
              message: (data && data.message) || "Session expired or invalid. Please log in again."
            }
          }));
        }
      }
      const errorMsg = (data && data.message) || (data && data.error) || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed"))) {
      const isLocal = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
      const offlineErr = new Error(
        isLocal
          ? `Cannot connect to Express server at ${API_BASE_URL}. Ensure 'npm start' is running in backend.`
          : `Cannot connect to Gram Panchayat API at ${API_BASE_URL}. Please check server deployment status.`
      );
      offlineErr.isOffline = true;
      throw offlineErr;
    }
    throw err;
  }
}

export const api = {
  // Session & Auth State Helpers
  getCurrentUser,
  setAuthSession,
  clearAuthSession,
  getAuthToken,

  // 1. Core Health & Public Village Settings
  getHealth: () => request("/health"),
  getVillageSettings: () => request("/village-settings"),
  updateVillageSettings: (settings) => request("/village-settings", { method: "PUT", body: JSON.stringify(settings) }),
  resetDatabase: () => request("/reset-data", { method: "POST" }),

  // 2. Authentication APIs
  login: (loginId, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ loginId, password }) }),
  getMe: () => request("/auth/me"),
  getProfile: () => request("/auth/profile"),
  updateProfile: (profileData) => request("/auth/profile", { method: "PUT", body: JSON.stringify(profileData) }),
  getAdminProfile: () => request("/admin/profile"),
  updateAdminProfile: (profileData) => request("/admin/profile", { method: "PUT", body: JSON.stringify(profileData) }),
  changePassword: (oldPassword, newPassword) => request("/auth/change-password", { method: "PUT", body: JSON.stringify({ oldPassword, newPassword }) }),
  registerCitizen: (data) => request("/auth/register-citizen", { method: "POST", body: JSON.stringify(data) }),

  // 3. Water Sources (Full CRUD)
  getWaterSources: () => request("/water-sources"),
  createWaterSource: (source) => request("/water-sources", { method: "POST", body: JSON.stringify(source) }),
  updateWaterSource: (id, updates) => request(`/water-sources/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(updates) }),
  deleteWaterSource: (id) => request(`/water-sources/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // 4. Distribution Schedules (Full CRUD)
  getDistributionSchedules: () => request("/distribution-schedules"),
  createDistributionSchedule: (schedule) => request("/distribution-schedules", { method: "POST", body: JSON.stringify(schedule) }),
  updateDistributionSchedule: (id, updates) => request(`/distribution-schedules/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(updates) }),
  deleteDistributionSchedule: (id) => request(`/distribution-schedules/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // 5. Community Reports (Public + Staff)
  getCommunityReports: () => request("/community-reports"),
  createCommunityReport: (report) => request("/community-reports", { method: "POST", body: JSON.stringify(report) }),
  updateCommunityReportStatus: (id, status, adminResponse) => request(`/admin/complaints/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify({ status, adminResponse }) }),
  deleteCommunityReport: (id) => request(`/community-reports/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // 6. Admin Portal APIs
  getAdminDashboardStats: () => request("/admin/dashboard-stats"),
  getCitizens: (search = "", status = "", ward = "") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (ward) params.append("ward", ward);
    return request("/admin/citizens" + (params.toString() ? `?${params.toString()}` : ""));
  },
  getAdminCitizens: (search = "", status = "", ward = "") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (ward) params.append("ward", ward);
    return request("/admin/citizens" + (params.toString() ? `?${params.toString()}` : ""));
  },
  createCitizen: (data) => request("/admin/citizens", { method: "POST", body: JSON.stringify(data) }),
  createAdminCitizen: (data) => request("/admin/citizens", { method: "POST", body: JSON.stringify(data) }),
  updateCitizen: (id, data) => request(`/admin/citizens/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  updateAdminCitizen: (id, data) => request(`/admin/citizens/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCitizen: (id) => request(`/admin/citizens/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteAdminCitizen: (id) => request(`/admin/citizens/${encodeURIComponent(id)}`, { method: "DELETE" }),
  toggleCitizenStatus: (id, status) => request(`/admin/citizens/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  toggleAdminCitizenStatus: (id, status) => request(`/admin/citizens/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Property & Household Management (Admin)
  getProperties: (search = "") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    return request("/admin/properties" + (params.toString() ? `?${params.toString()}` : ""));
  },
  getAdminProperties: (search = "") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    return request("/admin/properties" + (params.toString() ? `?${params.toString()}` : ""));
  },
  getPropertyById: (id) => request(`/admin/properties/${encodeURIComponent(id)}`),
  createProperty: (data) => request("/admin/properties", { method: "POST", body: JSON.stringify(data) }),
  createAdminProperty: (data) => request("/admin/properties", { method: "POST", body: JSON.stringify(data) }),
  updateProperty: (id, data) => request(`/admin/properties/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  updateAdminProperty: (id, data) => request(`/admin/properties/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProperty: (id) => request(`/admin/properties/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteAdminProperty: (id) => request(`/admin/properties/${encodeURIComponent(id)}`, { method: "DELETE" }),

  getBills: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/admin/bills${params.toString() ? `?${params}` : ""}`);
  },
  getAdminBills: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/admin/bills${params.toString() ? `?${params}` : ""}`);
  },
  createBill: (data) => request("/admin/bills", { method: "POST", body: JSON.stringify(data) }),
  createAdminBill: (data) => request("/admin/bills", { method: "POST", body: JSON.stringify(data) }),

  getPayments: () => request("/admin/payments"),
  getAdminPayments: () => request("/admin/payments"),
  recordPayment: (data) => request("/admin/payments", { method: "POST", body: JSON.stringify(data) }),
  recordAdminPayment: (data) => request("/admin/payments", { method: "POST", body: JSON.stringify(data) }),

  getTaxes: () => request("/admin/taxes"),
  getAdminTaxes: () => request("/admin/taxes"),
  createTax: (data) => request("/admin/taxes", { method: "POST", body: JSON.stringify(data) }),
  createAdminTax: (data) => request("/admin/taxes", { method: "POST", body: JSON.stringify(data) }),
  updateTaxStatus: (id, status) => request(`/admin/taxes/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  markAdminTaxPaid: (id) => request(`/admin/taxes/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify({ status: "Paid" }) }),
  updateAdminComplaint: (id, data) => request(`/admin/complaints/${encodeURIComponent(id)}/status`, { method: "PUT", body: JSON.stringify(data) }),

  // Excel Export of Complaints & Requests
  exportComplaintsExcel: async () => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/admin/complaints/export-excel`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error((errData && errData.message) || `Failed to export Excel (${res.status})`);
    }
    const blob = await res.blob();
    const dateStr = new Date().toISOString().split("T")[0];
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `JalMitra_Complaints_and_Requests_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    return true;
  },

  getAdminReports: () => request("/admin/reports"),

  // 7. Citizen Portal APIs (Strictly Private / Scoped)
  getMyProfile: () => request("/citizen/my-profile"),
  updateMyProfile: (data) => request("/citizen/my-profile", { method: "PUT", body: JSON.stringify(data) }),
  getMyBills: () => request("/citizen/my-bills"),
  getMyPayments: () => request("/citizen/my-payments"),
  payMyBill: (billId, _unused, paymentMode = "UPI") => request("/citizen/my-payments", { method: "POST", body: JSON.stringify({ billId, paymentMode: paymentMode || "UPI" }) }),
  getMyTaxes: () => request("/citizen/my-taxes"),
  payMyTax: (taxId, paymentMode = "UPI") => request("/citizen/my-taxes/pay", { method: "POST", body: JSON.stringify({ taxId, paymentMode: paymentMode || "UPI" }) }),
  getMyComplaints: () => request("/citizen/my-complaints"),
  createMyComplaint: (data) => request("/citizen/my-complaints", { method: "POST", body: JSON.stringify(data) }),
  submitMyComplaint: (data) => request("/citizen/my-complaints", { method: "POST", body: JSON.stringify(data) }),
  getMySchedule: () => request("/citizen/my-schedule"),

  // 8. Water Tank Management & Live Water Level Monitoring
  getWaterTanks: () => request("/water-tanks"),
  getWaterTanksSummary: () => request("/water-tanks/summary"),
  getWaterTankById: (id) => request(`/water-tanks/${encodeURIComponent(id)}`),
  createWaterTank: (data) => request("/water-tanks", { method: "POST", body: JSON.stringify(data) }),
  updateWaterTank: (id, data) => request(`/water-tanks/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWaterTank: (id) => request(`/water-tanks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  recordWaterReading: (id, data) => request(`/water-tanks/${encodeURIComponent(id)}/readings`, { method: "POST", body: JSON.stringify(data) }),
  getWaterTankReadings: (id, filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/water-tanks/${encodeURIComponent(id)}/readings${params.toString() ? `?${params}` : ""}`);
  },
  getWaterAlerts: (acknowledged = "") => {
    const q = acknowledged !== "" ? `?acknowledged=${acknowledged}` : "";
    return request(`/water-tanks/alerts${q}`);
  },
  acknowledgeWaterAlert: (id) => request(`/water-tanks/alerts/${encodeURIComponent(id)}/ack`, { method: "PUT" }),
  getWaterDistributionRecords: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/water-distribution${params.toString() ? `?${params}` : ""}`);
  },
  recordWaterDistribution: (data) => request("/water-distribution", { method: "POST", body: JSON.stringify(data) }),
  getWaterDepletionEstimate: (tankId) => request(`/water-distribution/estimate/${encodeURIComponent(tankId)}`),

  // 9. Year-Round Gram Panchayat Applications, RTI, Tasks & Notices
  submitApplication: (data) => {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    return request("/applications", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data)
    });
  },
  trackApplication: (referenceNo) => request(`/applications/track/${encodeURIComponent(referenceNo)}`),
  getCitizenApplications: () => request("/citizen/applications"),
  getAdminApplications: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/admin/applications${params.toString() ? `?${params}` : ""}`);
  },
  getAdminRtiRegister: (filters = {}) => {
    const params = new URLSearchParams({ ...filters, is_rti: 1 });
    return request(`/admin/applications${params.toString() ? `?${params}` : ""}`);
  },
  getAdminApplicationById: (id) => request(`/admin/applications/${encodeURIComponent(id)}`),
  updateAdminApplicationStatus: (id, data) => request(`/admin/applications/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
  exportAdminApplicationsCsv: async (filters = {}) => {
    const token = getAuthToken();
    const params = new URLSearchParams(filters);
    const url = `${API_BASE_URL}/admin/applications/export${params.toString() ? `?${params}` : ""}`;
    const res = await fetch(url, {
      headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error((errData && errData.message) || `Failed to export CSV (${res.status})`);
    }
    const blob = await res.blob();
    const dateStr = new Date().toISOString().split("T")[0];
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `Gram_Panchayat_Applications_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    return true;
  },
  getPublicNotices: () => request("/notices"),
  createAdminNotice: (data) => request("/admin/notices", { method: "POST", body: JSON.stringify(data) }),
  deleteAdminNotice: (id) => request(`/admin/notices/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getPanchayatTasks: (status = "") => request(`/tasks${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  createPanchayatTask: (data) => request("/admin/tasks", { method: "POST", body: JSON.stringify(data) }),
  updatePanchayatTaskStatus: (id, status) => request(`/admin/tasks/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  }),
  getPanchayatSummary: () => request("/admin/panchayat-summary"),

  // 10. Gram Panchayat Services Management
  getPublicServices: () => request("/services"),
  getAdminServices: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return request(`/admin/services${params.toString() ? `?${params}` : ""}`);
  },
  getAdminServiceById: (id) => request(`/admin/services/${encodeURIComponent(id)}`),
  createAdminService: (data) => request("/admin/services", { method: "POST", body: JSON.stringify(data) }),
  updateAdminService: (id, data) => request(`/admin/services/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAdminService: (id) => request(`/admin/services/${encodeURIComponent(id)}`, { method: "DELETE" }),
  toggleAdminServiceStatus: (id, isEnabled) => request(`/admin/services/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ is_enabled: isEnabled ? 1 : 0 })
  }),
  moveAdminService: (id, direction) => request(`/admin/services/${encodeURIComponent(id)}/move`, {
    method: "PUT",
    body: JSON.stringify({ direction })
  }),
  reorderAdminServices: (items) => request("/admin/services/reorder", {
    method: "PUT",
    body: JSON.stringify({ items })
  }),

  // 11. Administrative Audit Logs
  getAdminAuditLogs: (limit = 50) => request(`/admin/audit-logs?limit=${encodeURIComponent(limit)}`)
};
