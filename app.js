/**
 * JalMitra - Village Drought & Water Management Web App
 * Connected to Express + MySQL Backend REST API
 */

import { api, API_BASE_URL } from "./api.js";
import {
  t,
  getLanguage,
  setLanguage,
  initI18n,
  applyTranslations,
  formatStatus,
  formatUrgency,
  formatSupplyType,
  formatTankShape,
  formatMethod,
  translateErrorMessage,
  onLanguageChange
} from "./translations.js";

import {
  renderPanchayatWelcomeHero,
  initServiceCardsNavigation,
  switchAppSectionTab,
  initUnifiedApplicationForm,
  initLetterGenerator,
  initApplicationTracking,
  loadPublicNoticesView,
  loadCitizenApplications,
  initAdminPanchayatModule,
  loadAdminApplications,
  loadAdminRtiRegister,
  loadAdminTasks,
  loadAdminNotices,
  loadAdminExecutiveKPIs
} from "./panchayatApp.js";

// ==========================================================
// 1. DEFAULT VILLAGE SAMPLE DATA
// (Used as seed data for empty database or local fallback)
// ==========================================================
export const DEFAULT_APP_DATA = {
  villageInfo: {
    villageName: "Gram Panchayat",
    villageNameMr: "ग्रामपंचायत",
    district: "",
    taluka: "",
    state: "Maharashtra",
    overallStatus: "Normal",
    noticeText: "",
    lastUpdated: "Today",
    officerName: "",
    helpline: "1800-120-JAL (525)"
  },
  sources: [
    {
      id: "src-1",
      name: "Main Village Reservoir (Shivalay Talab)",
      type: "reservoir",
      typeLabel: "Reservoir / Lake",
      location: "Near Mahadev Mandir (East)",
      totalCapacity: 500000,
      currentLevelPercent: 32,
      lastInspected: "Today 07:00 AM",
      purityStatus: "Treated & Potable"
    },
    {
      id: "src-2",
      name: "North Falia Overhead Tank",
      type: "tank",
      typeLabel: "Overhead Tank",
      location: "Ward 1 - Behind Panchayat Bhavan",
      totalCapacity: 150000,
      currentLevelPercent: 45,
      lastInspected: "Today 07:30 AM",
      purityStatus: "Chlorinated"
    },
    {
      id: "src-3",
      name: "Panchayat Community Well #1",
      type: "well",
      typeLabel: "Deep Dug Well",
      location: "Ward 2 - Old Market Square",
      totalCapacity: 100000,
      currentLevelPercent: 55,
      lastInspected: "Yesterday",
      purityStatus: "Safe for Household"
    },
    {
      id: "src-4",
      name: "Government Borewell Station South",
      type: "well",
      typeLabel: "Borewell Station",
      location: "Ward 5 - Farm Boundary Road",
      totalCapacity: 80000,
      currentLevelPercent: 22,
      lastInspected: "Today 06:45 AM",
      purityStatus: "Filtered Ground Water"
    },
    {
      id: "src-5",
      name: "School Rainwater Harvest Cistern",
      type: "tank",
      typeLabel: "Harvested Storage Tank",
      location: "Ward 3 - Zilla Parishad Primary School",
      totalCapacity: 70000,
      currentLevelPercent: 58,
      lastInspected: "2 days ago",
      purityStatus: "UV Filtered"
    }
  ],
  schedules: [
    {
      id: "sch-1",
      area: "Ward 1 - Patel Falia (North)",
      date: "2026-10-24",
      dateLabel: "Today",
      timeSlot: "06:00 AM - 08:00 AM",
      duration: "2 hours",
      supplyType: "Pipeline Tap",
      status: "Completed",
      lineman: "Suresh Patil (9822114455)"
    },
    {
      id: "sch-2",
      area: "Ward 2 - Temple Chowk & Main Bazar",
      date: "2026-10-24",
      dateLabel: "Today",
      timeSlot: "11:30 AM - 01:30 PM",
      duration: "2 hours",
      supplyType: "Pipeline Tap",
      status: "Completed",
      lineman: "Ramesh Gavit (9876543210)"
    },
    {
      id: "sch-3",
      area: "Ward 3 - School Tola & Aanganwadi",
      date: "2026-10-24",
      dateLabel: "Today",
      timeSlot: "05:00 PM - 07:00 PM",
      duration: "2 hours",
      supplyType: "Pipeline Tap",
      status: "Active Now",
      lineman: "Ganesh Kadam (9833445566)"
    },
    {
      id: "sch-4",
      area: "Ward 4 - Harijan Basti / East Colony",
      date: "2026-10-24",
      dateLabel: "Today",
      timeSlot: "07:30 PM - 09:30 PM",
      duration: "2 hours",
      supplyType: "Water Tanker",
      status: "Upcoming",
      lineman: "Tanker MH-21-BK-4091"
    },
    {
      id: "sch-5",
      area: "Ward 5 - Farm Road & Outer Basti",
      date: "2026-10-25",
      dateLabel: "Tomorrow",
      timeSlot: "06:30 AM - 08:30 AM",
      duration: "2 hours",
      supplyType: "Community Well",
      status: "Tomorrow",
      lineman: "Suresh Patil (9822114455)"
    }
  ],
  complaints: [
    {
      id: "cmp-1",
      name: "Mohan Kadam",
      phone: "9823101122",
      area: "Ward 3 - School Tola & Aanganwadi",
      problemType: "Pipeline Leakage",
      urgency: "Critical",
      description: "Severe pipe burst near Primary School gate. Potable water is pooling on the road and getting wasted.",
      status: "Dispatched",
      timeAgo: "2 hours ago"
    },
    {
      id: "cmp-2",
      name: "Savita Devi",
      phone: "9890223344",
      area: "Ward 4 - Harijan Basti / East Colony",
      problemType: "Low Pressure",
      urgency: "Normal",
      description: "Water pressure has been negligible for 2 days. Buckets taking over 30 minutes to fill.",
      status: "Pending",
      timeAgo: "4 hours ago"
    },
    {
      id: "cmp-3",
      name: "Tukaram Shinde",
      phone: "9765443322",
      area: "Ward 1 - Patel Falia (North)",
      problemType: "Broken Community Tap/Valve",
      urgency: "Normal",
      description: "Public tap faucet brass head broken. Replaced with emergency stopper plug.",
      status: "Resolved",
      timeAgo: "Yesterday"
    }
  ]
};

// ==========================================================
// 2. ACTIVE APPLICATION STATE
// ==========================================================
export const appState = {
  isBackendConnected: false,
  isDatabaseConnected: false,
  databaseDetails: null,
  villageInfo: JSON.parse(JSON.stringify(DEFAULT_APP_DATA.villageInfo)),
  sources: JSON.parse(JSON.stringify(DEFAULT_APP_DATA.sources)),
  schedules: JSON.parse(JSON.stringify(DEFAULT_APP_DATA.schedules)),
  complaints: JSON.parse(JSON.stringify(DEFAULT_APP_DATA.complaints)),
  isLoading: false,
  error: null
};

// Calculate overall water stats
export function getOverallStats() {
  const totalCapacity = appState.sources.reduce((sum, s) => sum + (Number(s.totalCapacity) || 0), 0);
  const totalAvailable = appState.sources.reduce((sum, s) => {
    const avail = Math.round(((Number(s.totalCapacity) || 0) * (Number(s.currentLevelPercent) || 0)) / 100);
    return sum + avail;
  }, 0);

  const overallPercent = totalCapacity > 0 ? Math.round((totalAvailable / totalCapacity) * 100) : 0;
  
  let status = appState.villageInfo.overallStatus;
  if (!status || status === "Auto") {
    if (overallPercent > 60) status = "Normal";
    else if (overallPercent >= 30) status = "Low";
    else status = "Critical";
  }

  return {
    totalCapacity,
    totalAvailable,
    overallPercent,
    status
  };
}

// ==========================================================
// 3. TOAST & NOTIFICATION HELPERS
// ==========================================================
export function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const translatedMessage = translateErrorMessage(message);

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === "error" 
        ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
        : '<circle cx="12" cy="12" r="10"></circle><polyline points="9 12 12 15 16 10"></polyline>'
      }
    </svg>
    <span>${escapeHtml(translatedMessage)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Update Top Portal Service Status Indicator
function updateDatabaseUIState(state) {
  const pill = document.getElementById("dbStatusPill");
  const label = document.getElementById("dbStatusLabel");

  if (!pill || !label) return;

  pill.className = "db-status-pill";

  if (state.status === "CONNECTING") {
    pill.classList.add("status-connecting");
    label.textContent = t("status_connecting", "Connecting...");
  } else if (state.status === "CONNECTED") {
    pill.classList.add("status-connected");
    label.textContent = t("portal_active", "Active");
    console.log("[JalMitra Live Service] Connected to database:", state.databaseName || "jalmitra_db");
  } else if (state.status === "DB_DISCONNECTED") {
    pill.classList.add("status-unconfigured");
    label.textContent = t("status_db_pending", "DB Pending");
    console.warn("[JalMitra Diagnostics] Express running, MySQL connection pending.");
  } else {
    pill.classList.add("status-error");
    label.textContent = t("status_offline", "Offline");
    console.warn("[JalMitra Diagnostics] Backend service unreachable at", API_BASE_URL);
  }
}

// ==========================================================
// 4. DATABASE INITIALIZATION & SYNC VIA REST API
// ==========================================================
async function initDatabaseAndLoadData() {
  updateDatabaseUIState({ status: "CONNECTING" });

  try {
    const health = await api.getHealth();
    appState.isBackendConnected = true;

    if (health.database && health.database.connected) {
      appState.isDatabaseConnected = true;
      appState.databaseDetails = health.database;

      // 1. Fetch live village settings
      const settings = await api.getVillageSettings().catch(() => null);
      if (settings) appState.villageInfo = settings;

      // 2. Fetch live water sources
      const sources = await api.getWaterSources().catch(() => null);
      if (sources && sources.length > 0) appState.sources = sources;

      // 3. Fetch live distribution schedules
      const schedules = await api.getDistributionSchedules().catch(() => null);
      if (schedules && schedules.length > 0) appState.schedules = schedules;

      // 4. Fetch live community reports
      const reports = await api.getCommunityReports().catch(() => null);
      if (reports) appState.complaints = reports;

      updateDatabaseUIState({
        status: "CONNECTED",
        databaseName: health.database.database
      });
      showToast("Connected to Express & MySQL database.", "success");
    } else {
      appState.isDatabaseConnected = false;
      updateDatabaseUIState({ status: "DB_DISCONNECTED" });
      showToast("Express running, but MySQL connection is pending. Check backend/.env", "info");
    }
  } catch (err) {
    console.warn("Backend not running or unreachable:", err.message);
    appState.isBackendConnected = false;
    appState.isDatabaseConnected = false;
    updateDatabaseUIState({ status: "BACKEND_DISCONNECTED" });
    const isLocal = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
    showToast(
      isLocal 
        ? `Backend server not detected at ${API_BASE_URL}. Running in preview mode.`
        : "Backend API is currently unreachable. Running in preview mode.",
      "info"
    );
  }

  // Render all views with loaded data
  renderAllViews();
}

// ==========================================================
// 5. APPLICATION INITIALIZATION & DYNAMIC GP BRANDING
// ==========================================================
export function getVillageDisplayName(villageInfo = appState.villageInfo) {
  const isMr = getLanguage() === "mr";
  const v = villageInfo || {};
  const enName = (v.village_name || v.villageName || "").trim();
  const mrName = (v.village_name_mr || v.villageNameMr || "").trim();

  if (isMr) {
    if (mrName) return mrName;
    if (enName) return enName;
    return t("gp_name_default", "ग्रामपंचायत");
  } else {
    if (enName) return enName;
    if (mrName) return mrName;
    return t("gp_name_default", "Gram Panchayat");
  }
}

const MAHARASHTRA_LOC_MR = {
  "ahmednagar": "अहिल्यानगर",
  "karjat": "कर्जत",
  "pune": "पुणे",
  "haveli": "हवेली",
  "solapur": "सोलापूर",
  "satara": "सातारा",
  "kolhapur": "कोल्हापूर",
  "karveer": "करवीर",
  "jalna": "जालना",
  "nashik": "नाशिक",
  "aurangabad": "छत्रपती संभाजीनगर",
  "chhatrapati sambhajinagar": "छत्रपती संभाजीनगर",
  "sangli": "सांगली",
  "nagpur": "नागपूर",
  "amravati": "अमरावती",
  "thane": "ठाणे",
  "raigad": "रायगड",
  "alibag": "अलिबाग"
};

export function getVillageJurisdictionSubtitle(villageInfo = appState.villageInfo) {
  const isMr = getLanguage() === "mr";
  const v = villageInfo || {};
  const taluka = (v.taluka || "").trim();
  const district = (v.district || "").trim();
  const baseSubtitle = isMr ? "अधिकृत ग्रामपंचायत नागरिक सेवा पोर्टल" : "Official Gram Panchayat Citizen Services Portal";

  const locParts = [];
  if (taluka) {
    const tMr = isMr ? (MAHARASHTRA_LOC_MR[taluka.toLowerCase()] || taluka) : taluka;
    locParts.push(isMr ? `तालुका: ${tMr}` : `Taluka: ${taluka}`);
  }
  if (district) {
    const dMr = isMr ? (MAHARASHTRA_LOC_MR[district.toLowerCase()] || district) : district;
    locParts.push(isMr ? `जिल्हा: ${dMr}` : `District: ${district}`);
  }

  if (locParts.length > 0) {
    return `${baseSubtitle} • ${locParts.join(", ")}`;
  }
  return baseSubtitle;
}

export function applyDynamicGramPanchayatBranding() {
  const isMr = getLanguage() === "mr";
  const vInfo = appState.villageInfo || {};
  const displayName = getVillageDisplayName(vInfo);
  const subtitle = isMr ? "अधिकृत ग्रामपंचायत नागरिक सेवा पोर्टल" : "Official Gram Panchayat Citizen Services Portal";
  const fullSubtitle = getVillageJurisdictionSubtitle(vInfo);

  // 1. Browser Tab Title
  document.title = `${displayName} | ${subtitle}`;

  // 2. Header Brand & Subtitle
  const headerBrandTitle = document.getElementById("headerBrandTitle");
  if (headerBrandTitle) {
    headerBrandTitle.textContent = displayName;
  }
  const headerVillageName = document.getElementById("headerVillageName");
  if (headerVillageName) {
    headerVillageName.textContent = fullSubtitle;
  }

  // 3. Home Page Hero Label
  const heroVillageLabel = document.getElementById("heroVillageLabel");
  if (heroVillageLabel) {
    heroVillageLabel.textContent = displayName;
  }

  // 4. Login Page
  const loginHeading = document.getElementById("loginHeading");
  if (loginHeading) {
    loginHeading.textContent = `${displayName} - ${isMr ? "नागरिक व कर्मचारी पोर्टल" : "Citizen & Staff Portal"}`;
  }
  const loginSubtitle = document.getElementById("loginSubtitle");
  if (loginSubtitle) {
    loginSubtitle.textContent = subtitle;
  }

  // 5. Admin Portal Header
  const adminHeading = document.getElementById("adminHeading");
  if (adminHeading) {
    adminHeading.textContent = `${displayName} • ${isMr ? "ई-प्रशासन व नागरिक सेवा व्यवस्थापन" : "Administration & Citizen Services"}`;
  }
  const adminSubheading = document.getElementById("adminSubheading");
  if (adminSubheading) {
    adminSubheading.textContent = fullSubtitle;
  }

  // 6. Footer
  const footerBrand = document.getElementById("footerBrand");
  if (footerBrand) {
    footerBrand.textContent = `${displayName} • ${subtitle}`;
  }
  const footerRights = document.getElementById("footerRights");
  if (footerRights) {
    footerRights.textContent = `© 2026 ${displayName}. ${isMr ? "महाराष्ट्र शासन उपक्रम." : "Government of Maharashtra Initiative."}`;
  }
}

let isRenderingAllViews = false;
export function renderAllViews() {
  if (isRenderingAllViews) return;
  isRenderingAllViews = true;

  try {
    applyTranslations();
    applyDynamicGramPanchayatBranding();
    renderPanchayatWelcomeHero(appState.villageInfo);
    renderHomeView();
    renderHomeServices();
    renderStorageView();
    renderScheduleView();
    renderRecentReports();
    loadPublicNoticesView();

    const user = api.getCurrentUser();
    if (user) {
      if (user.role === "admin") {
        renderAdminStats();
        renderAdminTanks();
        renderAdminCitizensTable();
        renderAdminPropertiesTable();
        loadAdminServicesTable();
        renderAdminSourcesTable();
        renderAdminBills();
        renderAdminTaxesTable();
        renderAdminScheduleTable();
        renderAdminComplaintsTable();
        loadAdminApplications();
        loadAdminRtiRegister();
        loadAdminTasks();
        loadAdminNotices();
        loadAdminExecutiveKPIs();
      } else if (user.role === "citizen") {
        loadCitizenProfile();
        loadCitizenBills();
        loadCitizenTaxes();
        loadCitizenComplaints();
        loadCitizenApplications();
        loadCitizenSchedule();
      }
    }
  } finally {
    isRenderingAllViews = false;
  }
}
window.renderAllViews = renderAllViews;

document.addEventListener("DOMContentLoaded", () => {
  initI18n();
  initNavigation();
  initStorageView();
  initScheduleView();
  initReportForm();
  initServiceCardsNavigation(switchPage, (tab) => {
    switchPage("citizen");
    const tBtn = document.querySelector(`.portal-subnav-tab[data-cit-tab="${tab}"]`);
    if (tBtn) tBtn.click();
  });
  initUnifiedApplicationForm(showToast, switchPage);
  initLetterGenerator(showToast);
  initApplicationTracking(showToast);
  initAdminPanchayatModule(showToast);
  loadPublicNoticesView();
  initAuth();
  initCitizenView();
  initAdminView();
  initBackendModal();

  onLanguageChange(() => {
    renderAllViews();
  });

  // Load database
  initDatabaseAndLoadData();
});

// Setup modal controller (No-op in production)
function initBackendModal() {
  // Public setup modal removed per Gram Panchayat deployment specification
}

// ----------------------------------------------------------
// Navigation System with Role-Based Access Guards
// ----------------------------------------------------------
export function selectLoginRole(role) {
  const tabCitizen = document.getElementById("tabRoleCitizen");
  const tabAdmin = document.getElementById("tabRoleAdmin");
  const hiddenRole = document.getElementById("loginSelectedRole");
  const identLabel = document.getElementById("loginIdentifierLabel");
  const identInput = document.getElementById("loginIdentifier");

  if (!tabCitizen || !tabAdmin || !hiddenRole) return;

  const isMr = getLanguage() === "mr";

  if (role === "admin") {
    tabAdmin.classList.add("active");
    tabCitizen.classList.remove("active");
    hiddenRole.value = "admin";
    if (identLabel) identLabel.textContent = isMr ? "प्रशासक वापरकर्ता नाव (Username)" : "Admin Username";
    if (identInput) identInput.placeholder = isMr ? "उदा. admin किंवा staff ID" : "e.g. admin or staff ID";
  } else {
    tabCitizen.classList.add("active");
    tabAdmin.classList.remove("active");
    hiddenRole.value = "citizen";
    if (identLabel) identLabel.textContent = isMr ? "नागरिक युनिक आयडी / मोबाईल" : "Citizen Unique ID / Phone";
    if (identInput) identInput.placeholder = isMr ? "उदा. CIT-101 किंवा 9765443322" : "e.g. CIT-101 or 9765443322";
  }
}

export function switchPage(pageId) {
  const user = api.getCurrentUser();

  // Role Access Checks
  if (pageId === "admin") {
    if (!user || user.role !== "admin") {
      showToast("Panchayat Staff login required for Admin Control Panel.", "info");
      selectLoginRole("admin");
      pageId = "login";
    }
  } else if (pageId === "citizen") {
    if (!user || user.role !== "citizen") {
      showToast("Citizen login required to access your private records.", "info");
      selectLoginRole("citizen");
      pageId = "login";
    }
  }

  document.querySelectorAll(".page-view").forEach(page => page.classList.remove("active"));
  
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  document.querySelectorAll("[data-page]").forEach(btn => {
    if (btn.getAttribute("data-page") === pageId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "home") renderHomeView();
  if (pageId === "storage") renderStorageView();
  if (pageId === "schedule") renderScheduleView();
  if (pageId === "report") renderRecentReports();
  if (pageId === "citizen") renderCitizenView();
  if (pageId === "admin") renderAdminView();
}
window.switchPage = switchPage;

function initNavigation() {
  const navButtons = document.querySelectorAll("[data-page]");

  navButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = btn.getAttribute("data-page");
      switchPage(pageId);
    });
  });

  const btnSeeAll = document.getElementById("btnSeeAllSchedules");
  if (btnSeeAll) btnSeeAll.addEventListener("click", () => switchPage("schedule"));

  const tileLeak = document.getElementById("tileReportLeak");
  if (tileLeak) tileLeak.addEventListener("click", () => switchPage("report"));

  const tileStorage = document.getElementById("tileCheckStorage");
  if (tileStorage) tileStorage.addEventListener("click", () => switchPage("storage"));

  const btnExitAdmin = document.getElementById("btnExitAdmin");
  if (btnExitAdmin) btnExitAdmin.addEventListener("click", () => switchPage("home"));
}

// ==========================================================
// 6. HOME VIEW CONTROLLER
// ==========================================================
function renderHomeView() {
  const { villageInfo, schedules, sources, complaints } = appState;
  const stats = getOverallStats();

  const headerVillageName = document.getElementById("headerVillageName");
  const heroVillageLabel = document.getElementById("heroVillageLabel");
  const alertBannerText = document.getElementById("alertBannerText");
  const homeLastUpdated = document.getElementById("homeLastUpdated");
  const homeOfficerName = document.getElementById("homeOfficerName");

  applyDynamicGramPanchayatBranding();
  if (alertBannerText) {
    if (getLanguage() === "mr") {
      alertBannerText.innerHTML = `<strong>${t("announcement_notice", "सूचना:")}</strong> ${villageInfo.noticeText && !villageInfo.noticeText.includes("Rationing Mode") ? escapeHtml(villageInfo.noticeText) : t("announcement_text")}`;
    } else {
      alertBannerText.innerHTML = `<strong>Notice:</strong> ${escapeHtml(villageInfo.noticeText)}`;
    }
  }
  if (homeLastUpdated) {
    homeLastUpdated.textContent = getLanguage() === "mr" ? "आज सकाळी ०८:३० वाजता" : (villageInfo.lastUpdated || "Today at 08:30 AM");
  }
  if (homeOfficerName) {
    homeOfficerName.textContent = villageInfo.officerName || "Ramesh Patil (Gram Sevak)";
  }

  const badge = document.getElementById("homeStatusBadge");
  const percentText = document.getElementById("homeWaterPercent");
  const totalLitersText = document.getElementById("homeTotalLiters");
  const advisoryText = document.getElementById("gaugeAdvisory");
  const homeRingFill = document.getElementById("homeRingFill");
  const homeReserveStatus = document.getElementById("homeReserveStatus");

  const isMr = getLanguage() === "mr";

  if (badge) {
    badge.className = "status-tag";
    if (stats.status === "Normal") {
      badge.classList.add("status-normal");
      badge.textContent = isMr ? "सामान्य पुरवठा" : "Normal Supply";
      if (homeReserveStatus) homeReserveStatus.textContent = isMr ? "पुरेसा जलसाठा" : "Adequate Storage";
    } else if (stats.status === "Critical") {
      badge.classList.add("status-critical");
      badge.textContent = isMr ? "अतिगंभीर पातळी" : "Critical Level";
      if (homeReserveStatus) homeReserveStatus.textContent = isMr ? "तीव्र पाणीटंचाई" : "Critical Shortage";
    } else {
      badge.classList.add("status-low");
      badge.textContent = isMr ? "कमी पातळी" : "Low Level";
      if (homeReserveStatus) homeReserveStatus.textContent = isMr ? "रेशनिंग मोड" : "Rationing Mode";
    }
  }

  // Update Hero Circular Progress Ring (r=54, circumference=339.29)
  if (homeRingFill) {
    const heroC = 339.29;
    const heroOffset = heroC - (heroC * stats.overallPercent) / 100;
    homeRingFill.style.strokeDashoffset = heroOffset;
    if (stats.status === "Normal") {
      homeRingFill.style.stroke = "#10b981";
    } else if (stats.status === "Critical") {
      homeRingFill.style.stroke = "#ef4444";
    } else {
      homeRingFill.style.stroke = "#0284c7";
    }
  }

  if (percentText) percentText.textContent = `${stats.overallPercent}%`;
  if (totalLitersText) {
    totalLitersText.textContent = `${stats.totalAvailable.toLocaleString()} / ${stats.totalCapacity.toLocaleString()} ${isMr ? "लिटर" : "Liters"}`;
  }

  if (advisoryText) {
    let daysRemain = Math.max(1, Math.round((stats.overallPercent / 100) * 16));
    if (isMr) {
      advisoryText.innerHTML = `<strong>स्थिती नोंद:</strong> एकूण जलसाठा <strong>${stats.overallPercent}%</strong> आहे. सध्याच्या नियंत्रित वाटपानुसार अंदाजे <strong>${daysRemain} दिवसांचा</strong> पिण्याचा पाणी साठा उपलब्ध आहे.`;
    } else {
      advisoryText.innerHTML = `<strong>Status Note:</strong> Overall storage is at <strong>${stats.overallPercent}%</strong>. Approximately <strong>${daysRemain} days</strong> of drinking water reserve under current rationing.`;
    }
  }

  // Ring 1: Water Storage Available
  const ringStoragePercent = document.getElementById("ringStoragePercent");
  const ringStorageFill = document.getElementById("ringStorageFill");
  const statStorageLiters = document.getElementById("statStorageLiters");
  const statStorageSub = document.getElementById("statStorageSub");
  if (ringStoragePercent) ringStoragePercent.textContent = `${stats.overallPercent}%`;
  if (ringStorageFill) {
    const C = 188.5; // 2 * PI * 30
    ringStorageFill.style.strokeDashoffset = C - (C * stats.overallPercent) / 100;
  }
  if (statStorageLiters) {
    statStorageLiters.textContent = `${stats.totalAvailable.toLocaleString()} L`;
  }
  if (statStorageSub) {
    statStorageSub.textContent = isMr ? `एकूण ${stats.totalCapacity.toLocaleString()} L क्षमतेपैकी` : `of ${stats.totalCapacity.toLocaleString()} L capacity`;
  }

  // Ring 2: Water Depletion / Usage Percentage
  const ringDepletedPercent = document.getElementById("ringDepletedPercent");
  const ringDepletedFill = document.getElementById("ringDepletedFill");
  const statDepletedValue = document.getElementById("statDepletedValue");
  const statDepletedHint = document.getElementById("statDepletedHint");
  const depletedPercent = Math.max(0, 100 - stats.overallPercent);
  if (ringDepletedPercent) ringDepletedPercent.textContent = `${depletedPercent}%`;
  if (ringDepletedFill) {
    const C = 188.5;
    ringDepletedFill.style.strokeDashoffset = C - (C * depletedPercent) / 100;
  }
  if (statDepletedValue) {
    statDepletedValue.textContent = isMr ? `${depletedPercent}% वापरले` : `${depletedPercent}% Used`;
  }
  if (statDepletedHint) {
    statDepletedHint.textContent = stats.overallPercent < 35 
      ? (isMr ? "अतितातडीचे रेशनिंग" : "Critical Rationing") 
      : (isMr ? "नियंत्रित पाणी पुरवठा" : "Controlled Supply");
  }

  // Ring 3: Active Sources Percentage
  const ringSourcesPercent = document.getElementById("ringSourcesPercent");
  const ringSourcesFill = document.getElementById("ringSourcesFill");
  const activeSourcesEl = document.getElementById("statActiveSources");
  const statSourcesHint = document.getElementById("statSourcesHint");
  const operationalCount = sources.filter(s => Number(s.currentLevelPercent) > 10).length;
  const sourcesPercent = sources.length > 0 ? Math.round((operationalCount / sources.length) * 100) : 0;
  if (ringSourcesPercent) ringSourcesPercent.textContent = `${sourcesPercent}%`;
  if (ringSourcesFill) {
    const C = 188.5;
    ringSourcesFill.style.strokeDashoffset = C - (C * sourcesPercent) / 100;
  }
  if (activeSourcesEl) {
    activeSourcesEl.textContent = isMr ? `${operationalCount} पैकी ${sources.length} स्रोत सुरू` : `${operationalCount} of ${sources.length} Online`;
  }
  if (statSourcesHint) {
    const offlineCount = sources.length - operationalCount;
    statSourcesHint.textContent = offlineCount > 0 
      ? (isMr ? `${offlineCount} कमी/बंद` : `${offlineCount} low/offline`) 
      : (isMr ? "सर्व स्रोत सक्रिय" : "All sources active");
  }

  // Ring 4: Grievance Resolution Percentage
  const ringIssuesPercent = document.getElementById("ringIssuesPercent");
  const ringIssuesFill = document.getElementById("ringIssuesFill");
  const statOpenIssues = document.getElementById("statOpenIssues");
  const statResolvedCount = document.getElementById("statResolvedCount");
  const openCount = complaints.filter(c => c.status !== "Resolved").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const totalComplaints = complaints.length;
  const resolvedPercent = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 100;
  if (ringIssuesPercent) ringIssuesPercent.textContent = `${resolvedPercent}%`;
  if (ringIssuesFill) {
    const C = 188.5;
    ringIssuesFill.style.strokeDashoffset = C - (C * resolvedPercent) / 100;
  }
  if (statOpenIssues) statOpenIssues.textContent = isMr ? `${openCount} सक्रिय` : `${openCount} Active`;
  if (statResolvedCount) statResolvedCount.textContent = isMr ? `${resolvedCount} पैकी ${totalComplaints} निवारण` : `${resolvedCount} of ${totalComplaints} resolved`;

  const homeSchedList = document.getElementById("homeSchedulePreview");
  if (homeSchedList) {
    homeSchedList.innerHTML = schedules.slice(0, 3).map(item => {
      let statusClass = "status-low";
      if (item.status === "Active Now") statusClass = "status-normal";
      if (item.status === "Completed") statusClass = "status-low";
      if (item.status === "Delayed") statusClass = "status-critical";

      const dateLabelText = item.dateLabel === "Today" ? (isMr ? "आज" : "Today") : item.dateLabel;
      const statusText = formatStatus(item.status);

      return `
        <div class="home-sched-item">
          <div>
            <div class="sched-area-name">${escapeHtml(item.area)}</div>
            <div class="sched-time-slot">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${escapeHtml(dateLabelText || "Today")} &bull; ${escapeHtml(item.timeSlot)} (${escapeHtml(item.duration)})
            </div>
          </div>
          <div>
            <span class="status-tag ${statusClass}">${escapeHtml(statusText)}</span>
          </div>
        </div>
      `;
    }).join("");
  }
}

// ==========================================================
// 7. WATER STORAGE VIEW CONTROLLER
// ==========================================================
let currentStorageFilter = "all";

function initStorageView() {
  const filterChips = document.querySelectorAll(".filter-chip");
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentStorageFilter = chip.getAttribute("data-filter");
      renderStorageView();
    });
  });
}

function renderStorageView() {
  const grid = document.getElementById("storageSourcesGrid");
  const totalPill = document.getElementById("storageTotalPill");
  const stats = getOverallStats();
  const isMr = getLanguage() === "mr";

  if (totalPill) {
    totalPill.innerHTML = isMr 
      ? `एकूण जलसाठा: <strong>${stats.overallPercent}% (${stats.totalAvailable.toLocaleString()} L)</strong>`
      : `Overall Storage: <strong>${stats.overallPercent}% (${stats.totalAvailable.toLocaleString()} L)</strong>`;
  }

  const allSources = appState.sources;
  const countAll = document.getElementById("countAllSources");
  if (countAll) countAll.textContent = allSources.length;

  const filtered = currentStorageFilter === "all" 
    ? allSources 
    : allSources.filter(s => s.type === currentStorageFilter);

  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">${isMr ? "या वर्गासाठी कोणतेही जलस्रोत उपलब्ध नाहीत." : "No water sources found for this category."}</div>`;
    return;
  }

  grid.innerHTML = filtered.map(source => {
    const availableLiters = Math.round((Number(source.totalCapacity) * Number(source.currentLevelPercent)) / 100);
    const pct = Math.min(100, Math.max(0, Number(source.currentLevelPercent) || 0));
    const C = 175.93; // 2 * PI * 28 = 175.93
    const offset = (C - (C * pct) / 100).toFixed(2);
    
    let ringClass = "ring-fill-normal";
    let statusBadgeClass = "status-normal";
    let statusText = isMr ? "पुरेसा" : "Adequate";

    if (pct <= 25) {
      ringClass = "ring-fill-critical";
      statusBadgeClass = "status-critical";
      statusText = isMr ? "अतिगंभीर" : "Critical";
    } else if (pct <= 50) {
      ringClass = "ring-fill-low";
      statusBadgeClass = "status-low";
      statusText = isMr ? "कमी" : "Low";
    }

    const purityDisplay = formatStatus(source.purityStatus || (isMr ? "पिण्यास योग्य" : "Tested Safe"));
    const inspectedDisplay = source.lastInspected === "Today" || source.lastInspected === "Today 07:00 AM" || source.lastInspected === "Today 07:30 AM"
      ? (isMr ? "आज सकाळी" : source.lastInspected)
      : (source.lastInspected === "Yesterday" ? (isMr ? "काल" : "Yesterday") : source.lastInspected);

    return `
      <div class="storage-card">
        <div>
          <div class="source-badge-strip">
            <span class="source-type-pill">${escapeHtml(source.typeLabel || source.type)}</span>
            <span class="status-tag ${statusBadgeClass}">${statusText}</span>
          </div>

          <h3 class="source-name">${escapeHtml(source.name)}</h3>
          <div class="source-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${escapeHtml(source.location)}</span>
          </div>

          <div class="source-card-body-flex">
            <div class="source-ring-box">
              <svg class="source-ring-svg" width="72" height="72" viewBox="0 0 72 72">
                <circle class="source-ring-bg" cx="36" cy="36" r="28" />
                <circle class="source-ring-fill ${ringClass}" cx="36" cy="36" r="28" style="stroke-dashoffset: ${offset};" />
              </svg>
              <div class="source-ring-center">
                <span class="source-ring-percent">${pct}%</span>
                <span class="source-ring-label">${isMr ? "पातळी" : "Level"}</span>
              </div>
            </div>

            <div class="source-details-col">
              <span class="source-capacity-label">${isMr ? "उपलब्ध पाणी साठा" : "Current Reserve"}</span>
              <div class="source-liters-bold">${availableLiters.toLocaleString()} L</div>
              <div class="source-liters-total">${isMr ? "एकूण क्षमता:" : "Total:"} ${Number(source.totalCapacity).toLocaleString()} L</div>
            </div>
          </div>
        </div>

        <div class="source-card-footer">
          <span>${isMr ? "शुद्धता:" : "Purity:"} <strong>${escapeHtml(purityDisplay)}</strong></span>
          <span>${isMr ? "तपासणी:" : "Checked:"} ${escapeHtml(inspectedDisplay || "Recently")}</span>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================================
// 8. DISTRIBUTION SCHEDULE CONTROLLER
// ==========================================================
function initScheduleView() {
  const searchInput = document.getElementById("scheduleSearchInput");
  const filterSelect = document.getElementById("scheduleStatusFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => renderScheduleView());
  }

  if (filterSelect) {
    filterSelect.addEventListener("change", () => renderScheduleView());
  }
}

function renderScheduleView() {
  const list = document.getElementById("scheduleListContainer");
  if (!list) return;

  const searchVal = (document.getElementById("scheduleSearchInput")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("scheduleStatusFilter")?.value || "all";

  let items = appState.schedules;

  if (searchVal) {
    items = items.filter(item => 
      item.area.toLowerCase().includes(searchVal) || 
      (item.lineman && item.lineman.toLowerCase().includes(searchVal)) ||
      (item.supplyType && item.supplyType.toLowerCase().includes(searchVal))
    );
  }

  if (statusFilter !== "all") {
    items = items.filter(item => item.status === statusFilter);
  }

  const isMr = getLanguage() === "mr";

  if (items.length === 0) {
    list.innerHTML = `
      <div style="background:#fff; padding:30px; text-align:center; border-radius:12px; border:1px solid #e2e8f0;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" style="margin-bottom:10px;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <h4 style="color:#334155;">${isMr ? "या शोधाशी जुळणारे वेळापत्रक आढळले नाही" : "No schedules match your search"}</h4>
        <p style="color:#64748b; font-size:0.9rem;">${isMr ? "कृपया 'सर्व वेळापत्रक' निवडा किंवा शोध रकाना रिकामा करा." : "Try selecting 'All Timings' or clearing the search box."}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items.map(item => {
    let cardStatusClass = "";
    let statusBadgeClass = "status-low";

    if (item.status === "Active Now") {
      cardStatusClass = "status-active-card";
      statusBadgeClass = "status-normal";
    } else if (item.status === "Delayed") {
      cardStatusClass = "status-delayed-card";
      statusBadgeClass = "status-critical";
    } else if (item.status === "Upcoming") {
      statusBadgeClass = "status-low";
    }

    const dateLabelText = item.dateLabel === "Today" ? (isMr ? "आज" : "Today") : (item.dateLabel || item.date);
    const supplyTypeText = formatSupplyType(item.supplyType);
    const statusText = formatStatus(item.status);

    return `
      <div class="schedule-card ${cardStatusClass}">
        <div class="sched-area-col">
          <h3>${escapeHtml(item.area)}</h3>
          <div class="sched-sub-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>${isMr ? "लाइनमन:" : "Lineman:"} ${escapeHtml(item.lineman || (isMr ? "ग्रामपंचायत कर्मचारी" : "Gram Panchayat Staff"))}</span>
          </div>
        </div>

        <div class="sched-time-col">
          <div class="time-badge">${escapeHtml(item.timeSlot)}</div>
          <div class="duration-label">${escapeHtml(dateLabelText)} &bull; ${isMr ? "कालावधी:" : "Duration:"} <strong>${escapeHtml(item.duration)}</strong></div>
        </div>

        <div>
          <span style="font-size:0.88rem; font-weight:600; color:#475569; display:inline-flex; align-items:center; gap:5px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            ${escapeHtml(supplyTypeText)}
          </span>
        </div>

        <div style="text-align: right;">
          <span class="status-tag ${statusBadgeClass}">${escapeHtml(statusText)}</span>
        </div>
      </div>
    `;
  }).join("");
}

// ==========================================================
// 9. REPORT A PROBLEM CONTROLLER (WITH BACKEND API)
// ==========================================================
function initReportForm() {
  const form = document.getElementById("problemReportForm");
  const submitBtn = document.getElementById("btnSubmitReport");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("reporterName");
    const phoneInput = document.getElementById("reporterPhone");
    const areaInput = document.getElementById("reportArea");
    const typeInput = document.getElementById("problemType");
    const urgencyInput = document.getElementById("reportUrgency");
    const descInput = document.getElementById("problemDescription");

    let isValid = true;

    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showFieldError("reporterName", "errName", true);
      isValid = false;
    } else {
      showFieldError("reporterName", "errName", false);
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneInput.value.trim())) {
      showFieldError("reporterPhone", "errPhone", true);
      isValid = false;
    } else {
      showFieldError("reporterPhone", "errPhone", false);
    }

    if (!areaInput.value) {
      showFieldError("reportArea", "errArea", true);
      isValid = false;
    } else {
      showFieldError("reportArea", "errArea", false);
    }

    if (!typeInput.value) {
      showFieldError("problemType", "errType", true);
      isValid = false;
    } else {
      showFieldError("problemType", "errType", false);
    }

    if (!descInput.value.trim() || descInput.value.trim().length < 10) {
      showFieldError("problemDescription", "errDesc", true);
      isValid = false;
    } else {
      showFieldError("problemDescription", "errDesc", false);
    }

    if (!isValid) return;

    const newComplaint = {
      id: "cmp-" + Date.now(),
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      area: areaInput.value,
      problemType: typeInput.value,
      urgency: urgencyInput.value,
      description: descInput.value.trim(),
      status: "Pending",
      timeAgo: "Just now"
    };

    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-inline"></span> Saving...`;
    }

    try {
      if (!appState.isDatabaseConnected) {
        throw new Error("MySQL database is not connected. Live complaints and civic requests cannot be saved while database is offline.");
      }
      await api.createCommunityReport(newComplaint);
      showToast("Issue submitted successfully! Ticket #" + newComplaint.id.slice(-4), "success");

      appState.complaints.unshift(newComplaint);
      form.reset();

      renderRecentReports();
      renderHomeView();
      renderAdminComplaintsTable();
    } catch (err) {
      console.error("Error submitting report:", err);
      showToast("Submission error: " + err.message, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}

function showFieldError(inputId, errorId, show) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    if (show) input.classList.add("is-invalid");
    else input.classList.remove("is-invalid");
  }
  if (error) {
    if (show) error.classList.add("visible");
    else error.classList.remove("visible");
  }
}

function renderRecentReports() {
  const container = document.getElementById("recentComplaintsList");
  const badgeCount = document.getElementById("reportsCountBadge");
  if (!container) return;

  const complaints = appState.complaints;
  if (badgeCount) badgeCount.textContent = `${complaints.length} ${t("rep_badge_reports", "Reports")}`;

  if (complaints.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;">${t("rep_empty", "No reports filed yet.")}</div>`;
    return;
  }

  container.innerHTML = complaints.map(c => {
    let statusClass = "ticket-status-pending";
    if (c.status === "Dispatched") statusClass = "ticket-status-dispatched";
    if (c.status === "Resolved") statusClass = "ticket-status-resolved";

    const byLabel = t("rep_by", "By");
    const recentLabel = getLanguage() === "mr" ? "नुकतेच" : "Recent";

    return `
      <div class="complaint-ticket">
        <div class="ticket-top">
          <span class="ticket-type">${escapeHtml(c.problemType)}</span>
          <span class="ticket-status-pill ${statusClass}">${escapeHtml(formatStatus(c.status))}</span>
        </div>
        <p class="ticket-desc">${escapeHtml(c.description)}</p>
        <div class="ticket-meta">
          <span>${escapeHtml(c.area)}</span>
          <span>${escapeHtml(byLabel)}: <strong>${escapeHtml(c.name)}</strong> &bull; ${escapeHtml(c.timeAgo || recentLabel)}</span>
        </div>
      </div>
    `;
  }).join("");
}



// ==========================================================
// 11. AUTHENTICATION & SESSION MANAGEMENT
// ==========================================================
function updateAuthUI() {
  const user = api.getCurrentUser();
  const navUserBadge = document.getElementById("navUserBadge");
  const navUserName = document.getElementById("navUserName");
  const navUserRole = document.getElementById("navUserRole");
  const navUserAvatar = document.getElementById("navUserAvatar");
  const navLoginBtn = document.getElementById("navLoginBtn");
  const navCitizen = document.getElementById("navCitizen");
  const navAdmin = document.getElementById("navAdmin");

  if (user) {
    if (navUserBadge) navUserBadge.style.display = "flex";
    if (navLoginBtn) navLoginBtn.style.display = "none";

    const displayName = user.fullName || user.full_name || user.username || user.loginId || "User";
    const displayRole = user.roleTitle || user.role_title || (user.role === "admin" ? t("role_admin_badge", "Staff") : t("role_citizen_badge", "Citizen"));

    if (navUserName) {
      navUserName.textContent = displayName;
      navUserName.title = displayName;
    }
    if (navUserRole) {
      navUserRole.textContent = displayRole;
      navUserRole.title = displayRole;
    }
    if (navUserAvatar) {
      navUserAvatar.textContent = (displayName || "U")[0].toUpperCase();
    }
    if (navUserBadge) {
      navUserBadge.title = `${displayName} (${displayRole}) • Click to configure admin profile`;
    }

    if (navCitizen) navCitizen.style.display = user.role === "admin" ? "none" : "inline-flex";
    if (navAdmin) navAdmin.style.display = user.role === "admin" ? "inline-flex" : "none";
  } else {
    if (navUserBadge) navUserBadge.style.display = "none";
    if (navLoginBtn) navLoginBtn.style.display = "inline-flex";
    if (navCitizen) navCitizen.style.display = "inline-flex";
    if (navAdmin) navAdmin.style.display = "none";
  }
}

function initAuth() {
  updateAuthUI();

  // Clicking on top-right profile badge navigates to Admin Profile Settings when logged in as admin
  const navUserBadge = document.getElementById("navUserBadge");
  if (navUserBadge) {
    navUserBadge.style.cursor = "pointer";
    navUserBadge.addEventListener("click", (e) => {
      if (e.target.closest("#navLogoutBtn")) return; // Don't trigger if clicking logout button
      const user = api.getCurrentUser();
      if (user && user.role === "admin") {
        switchPage("admin");
        const dashTab = document.querySelector(".portal-subnav-tab[data-admin-tab='dashboard']");
        if (dashTab) dashTab.click();
        const profileSec = document.getElementById("adminProfileSettingsSection");
        if (profileSec) {
          profileSec.scrollIntoView({ behavior: "smooth", block: "center" });
          profileSec.classList.remove("highlight-section");
          void profileSec.offsetWidth;
          profileSec.classList.add("highlight-section");
        }
      }
    });
  }

  // Handle session expiration and invalid token event from API
  window.addEventListener("auth:unauthorized", (e) => {
    updateAuthUI();
    showToast(e.detail?.message || "Your session has expired. Please log in again.", "warning");
    if (typeof selectLoginRole === "function") selectLoginRole("admin");
    if (typeof switchPage === "function") switchPage("login");
  });

  // Refresh profile from server on startup if token exists
  const token = api.getAuthToken();
  if (token) {
    api.getMe().then(data => {
      if (data && data.user) {
        api.setAuthSession(token, data.user);
        updateAuthUI();
        if (typeof populateAdminProfileForm === "function") {
          populateAdminProfileForm();
        }
      }
    }).catch((err) => {
      if (err && err.status === 401) {
        api.clearAuthSession();
        updateAuthUI();
      }
    });
  }

  // Role toggle tabs on Login View
  const tabCitizen = document.getElementById("tabRoleCitizen");
  const tabAdmin = document.getElementById("tabRoleAdmin");
  if (tabCitizen) tabCitizen.addEventListener("click", () => selectLoginRole("citizen"));
  if (tabAdmin) tabAdmin.addEventListener("click", () => selectLoginRole("admin"));

  // Toggle Password Visibility
  const btnTogglePwd = document.getElementById("btnToggleLoginPwd");
  const pwdInput = document.getElementById("loginPassword");
  if (btnTogglePwd && pwdInput) {
    btnTogglePwd.addEventListener("click", () => {
      pwdInput.type = pwdInput.type === "password" ? "text" : "password";
    });
  }

  // Quick Demo Logins
  const chipAdmin = document.getElementById("chipAdminLogin");
  const chipCit1 = document.getElementById("chipCitizen1Login");
  const chipCit2 = document.getElementById("chipCitizen2Login");

  if (chipAdmin) {
    chipAdmin.addEventListener("click", () => {
      selectLoginRole("admin");
      const idInput = document.getElementById("loginIdentifier");
      const pwInput = document.getElementById("loginPassword");
      if (idInput) idInput.value = "admin";
      if (pwInput) pwInput.value = "Admin@123";
      showToast("Admin demo credentials filled.", "info");
    });
  }

  if (chipCit1) {
    chipCit1.addEventListener("click", () => {
      selectLoginRole("citizen");
      const idInput = document.getElementById("loginIdentifier");
      const pwInput = document.getElementById("loginPassword");
      if (idInput) idInput.value = "CIT-101";
      if (pwInput) pwInput.value = "Citizen@123";
      showToast("Citizen 1 (Tukaram) credentials filled.", "info");
    });
  }

  if (chipCit2) {
    chipCit2.addEventListener("click", () => {
      selectLoginRole("citizen");
      const idInput = document.getElementById("loginIdentifier");
      const pwInput = document.getElementById("loginPassword");
      if (idInput) idInput.value = "CIT-102";
      if (pwInput) pwInput.value = "Citizen@123";
      showToast("Citizen 2 (Savita) credentials filled.", "info");
    });
  }

  // Login Form Submission
  const loginForm = document.getElementById("authLoginForm");
  const btnSubmit = document.getElementById("btnLoginSubmit");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const identifier = document.getElementById("loginIdentifier").value.trim();
      const password = document.getElementById("loginPassword").value;
      const role = document.getElementById("loginSelectedRole").value;

      if (!identifier || !password) {
        showToast("Please enter both ID/Username and password.", "error");
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-inline"></span> Verifying credentials...`;
      }

      try {
        const response = await api.login(identifier, password, role);
        api.setAuthSession(response.token, response.user);
        updateAuthUI();
        showToast(`Welcome back, ${response.user.fullName || response.user.username}!`, "success");

        if (response.user.role === "admin") {
          switchPage("admin");
        } else {
          switchPage("citizen");
        }
      } catch (err) {
        console.error("Login failure:", err);
        showToast("Login failed: " + err.message, "error");
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span>Sign In Securely</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        }
      }
    });
  }

  // Logout Buttons
  const navLogoutBtn = document.getElementById("navLogoutBtn");
  const btnCitizenLogout = document.getElementById("btnCitizenLogout");

  const handleLogout = () => {
    api.clearAuthSession();
    updateAuthUI();
    showToast("Signed out successfully.", "info");
    switchPage("home");
  };

  if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);
  if (btnCitizenLogout) btnCitizenLogout.addEventListener("click", handleLogout);

  // Self-Registration Modal
  const linkRegister = document.getElementById("linkCitizenRegister");
  const modalReg = document.getElementById("citizenRegisterModal");
  const btnCloseReg = document.getElementById("btnCloseCitizenRegisterModal");
  const btnCancelReg = document.getElementById("btnCancelCitizenRegisterModal");
  const regForm = document.getElementById("citizenRegisterForm");
  const btnSubmitReg = document.getElementById("btnSubmitCitizenRegister");

  if (linkRegister && modalReg) {
    linkRegister.addEventListener("click", () => {
      modalReg.hidden = false;
      if (regForm) regForm.reset();
    });
  }

  const closeReg = () => { if (modalReg) modalReg.hidden = true; };
  if (btnCloseReg) btnCloseReg.addEventListener("click", closeReg);
  if (btnCancelReg) btnCancelReg.addEventListener("click", closeReg);

  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("regFullName").value.trim();
      const phone = document.getElementById("regPhone").value.trim();
      const propertyNo = document.getElementById("regPropertyNo").value.trim();
      const ward = document.getElementById("regWard").value;
      const password = document.getElementById("regPassword").value;
      const confirmPassword = document.getElementById("regConfirmPassword").value;

      if (!fullName || !phone || !propertyNo || !ward || !password) {
        showToast("Please fill all required fields.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showToast("Passwords do not match.", "error");
        return;
      }

      if (btnSubmitReg) {
        btnSubmitReg.disabled = true;
        btnSubmitReg.innerHTML = `<span class="spinner-inline"></span> Creating Citizen Account...`;
      }

      try {
        const res = await api.registerCitizen({
          fullName,
          name: fullName,
          phone,
          mobile: phone,
          propertyNo,
          property_no: propertyNo,
          propertyNumber: propertyNo,
          wardArea: ward,
          ward_area: ward,
          ward,
          password
        });
        const cid = res.citizenId || (res.citizen && res.citizen.citizenId) || (res.citizen && res.citizen.loginId) || res.loginId || "";
        showToast(`Registration complete! Your Citizen ID is ${cid}`, "success");
        closeReg();
        selectLoginRole("citizen");
        const idInput = document.getElementById("loginIdentifier");
        const pwInput = document.getElementById("loginPassword");
        if (idInput && cid) idInput.value = cid;
        if (pwInput) pwInput.value = password;
      } catch (err) {
        console.error("Registration error:", err);
        showToast("Registration error: " + err.message, "error");
      } finally {
        if (btnSubmitReg) {
          btnSubmitReg.disabled = false;
          btnSubmitReg.innerHTML = "Create Citizen Account";
        }
      }
    });
  }
}

// ==========================================================
// 12. CITIZEN PORTAL CONTROLLER (SCOPED DATA)
// ==========================================================
function initCitizenView() {
  // Citizen Sub-Tabs Switching
  const citTabs = document.querySelectorAll(".portal-subnav-tab[data-cit-tab]");
  citTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      citTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const tabKey = tab.getAttribute("data-cit-tab");
      document.querySelectorAll(".citizen-tab-pane").forEach(pane => pane.classList.remove("active"));

      const targetPane = document.getElementById(`citPane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
      if (targetPane) targetPane.classList.add("active");

      if (tabKey === "applications") {
        loadCitizenApplications();
      } else if (tabKey === "overview") {
        loadCitizenOverview();
      } else if (tabKey === "bills") {
        loadCitizenBills();
        loadCitizenPayments();
      } else if (tabKey === "taxes") {
        loadCitizenTaxes();
      } else if (tabKey === "complaints") {
        loadCitizenComplaints();
      } else if (tabKey === "schedule") {
        loadCitizenSchedule();
      }
    });
  });

  const btnCitNewApp = document.getElementById("btnCitizenNewApp");
  if (btnCitNewApp) {
    btnCitNewApp.addEventListener("click", () => {
      switchPage("report");
      switchAppSectionTab("submit");
    });
  }

  // Refresh Records Button
  const btnRefresh = document.getElementById("btnCitizenRefresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      renderCitizenView();
      showToast("Citizen records refreshed from database.", "info");
    });
  }

  // Submit New Complaint from Citizen Dashboard
  const compForm = document.getElementById("citNewComplaintForm");
  const btnSubmitComp = document.getElementById("btnSubmitCitComplaint");

  if (compForm) {
    compForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const category = document.getElementById("citCompCategory").value;
      const urgency = document.getElementById("citCompUrgency").value;
      const description = document.getElementById("citCompDesc").value.trim();

      if (!description) {
        showToast("Please enter a description of the problem.", "error");
        return;
      }

      if (btnSubmitComp) {
        btnSubmitComp.disabled = true;
        btnSubmitComp.innerHTML = `<span class="spinner-inline"></span> Lodging Ticket...`;
      }

      try {
        await api.submitMyComplaint({ problemType: category, urgency, description });
        showToast("Complaint submitted successfully to Gram Panchayat!", "success");
        compForm.reset();
        await loadCitizenComplaints();
        await loadCitizenOverview();
      } catch (err) {
        console.error("Failed to submit grievance:", err);
        showToast("Submission failed: " + err.message, "error");
      } finally {
        if (btnSubmitComp) {
          btnSubmitComp.disabled = false;
          btnSubmitComp.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Submit Ticket to Panchayat</span>`;
        }
      }
    });
  }

  // Update Citizen Profile Form
  const profileForm = document.getElementById("citUpdateProfileForm");
  const btnSaveProfile = document.getElementById("btnSaveCitProfile");

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phone = document.getElementById("citProfilePhone").value.trim();
      const address = document.getElementById("citProfileAddress").value.trim();

      if (btnSaveProfile) {
        btnSaveProfile.disabled = true;
        btnSaveProfile.innerHTML = `<span class="spinner-inline"></span> Updating...`;
      }

      try {
        await api.updateMyProfile({ phone, address });
        showToast("Profile contact details updated!", "success");
        await loadCitizenOverview();
      } catch (err) {
        console.error("Profile update error:", err);
        showToast("Failed to update profile: " + err.message, "error");
      } finally {
        if (btnSaveProfile) {
          btnSaveProfile.disabled = false;
          btnSaveProfile.innerHTML = "Save Contact Updates";
        }
      }
    });
  }

  // Change Password Form
  const pwdForm = document.getElementById("citChangePasswordForm");
  const btnPwd = document.getElementById("btnCitChangePwd");

  if (pwdForm) {
    pwdForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById("citOldPwd").value;
      const newPassword = document.getElementById("citNewPwd").value;
      const confirmPassword = document.getElementById("citConfirmPwd").value;

      if (newPassword !== confirmPassword) {
        showToast("New passwords do not match.", "error");
        return;
      }

      if (btnPwd) {
        btnPwd.disabled = true;
        btnPwd.innerHTML = `<span class="spinner-inline"></span> Changing...`;
      }

      try {
        await api.changePassword(oldPassword, newPassword);
        showToast("Password updated successfully!", "success");
        pwdForm.reset();
      } catch (err) {
        console.error("Change password error:", err);
        showToast("Failed to update password: " + err.message, "error");
      } finally {
        if (btnPwd) {
          btnPwd.disabled = false;
          btnPwd.innerHTML = "Update Password";
        }
      }
    });
  }

  // Citizen Pay Bill Modal
  const modalPayBill = document.getElementById("citizenPayBillModal");
  const btnClosePayBill = document.getElementById("btnCloseCitizenPayBillModal");
  const btnCancelPayBill = document.getElementById("btnCancelCitizenPayBillModal");
  const formPayBill = document.getElementById("citizenPayBillForm");
  const btnConfirmPayBill = document.getElementById("btnConfirmCitizenPayBill");

  const closePayBill = () => { if (modalPayBill) modalPayBill.hidden = true; };
  if (btnClosePayBill) btnClosePayBill.addEventListener("click", closePayBill);
  if (btnCancelPayBill) btnCancelPayBill.addEventListener("click", closePayBill);

  if (formPayBill) {
    formPayBill.addEventListener("submit", async (e) => {
      e.preventDefault();
      const billId = document.getElementById("citPayBillId").value;
      const methodRadio = document.querySelector('input[name="citPayMethod"]:checked');
      const method = methodRadio ? methodRadio.value : "UPI / QR Code";

      if (btnConfirmPayBill) {
        btnConfirmPayBill.disabled = true;
        btnConfirmPayBill.innerHTML = `<span class="spinner-inline"></span> Processing Payment...`;
      }

      try {
        const res = await api.payMyBill(billId, null, method);
        showToast(`Payment successful! Receipt #${res.payment.receiptNumber}`, "success");
        closePayBill();
        await loadCitizenBills();
        await loadCitizenPayments();
        await loadCitizenOverview();
      } catch (err) {
        console.error("Payment failed:", err);
        showToast("Payment failed: " + err.message, "error");
      } finally {
        if (btnConfirmPayBill) {
          btnConfirmPayBill.disabled = false;
          btnConfirmPayBill.innerHTML = "Confirm & Pay";
        }
      }
    });
  }

  // Citizen Pay Tax Modal
  const modalPayTax = document.getElementById("citizenPayTaxModal");
  const btnClosePayTax = document.getElementById("btnCloseCitizenPayTaxModal");
  const btnCancelPayTax = document.getElementById("btnCancelCitizenPayTaxModal");
  const formPayTax = document.getElementById("citizenPayTaxForm");
  const btnConfirmPayTax = document.getElementById("btnConfirmCitizenPayTax");

  const closePayTax = () => { if (modalPayTax) modalPayTax.hidden = true; };
  if (btnClosePayTax) btnClosePayTax.addEventListener("click", closePayTax);
  if (btnCancelPayTax) btnCancelPayTax.addEventListener("click", closePayTax);

  if (formPayTax) {
    formPayTax.addEventListener("submit", async (e) => {
      e.preventDefault();
      const taxId = document.getElementById("citPayTaxId").value;
      const methodRadio = document.querySelector('input[name="citPayTaxMethod"]:checked');
      const method = methodRadio ? methodRadio.value : "UPI";

      if (btnConfirmPayTax) {
        btnConfirmPayTax.disabled = true;
        btnConfirmPayTax.innerHTML = `<span class="spinner-inline"></span> Processing Tax Payment...`;
      }

      try {
        await api.payMyTax(taxId, method);
        showToast("Tax payment recorded and cleared!", "success");
        closePayTax();
        await loadCitizenTaxes();
        await loadCitizenOverview();
      } catch (err) {
        console.error("Tax payment error:", err);
        showToast("Tax payment error: " + err.message, "error");
      } finally {
        if (btnConfirmPayTax) {
          btnConfirmPayTax.disabled = false;
          btnConfirmPayTax.innerHTML = "Pay Tax Now";
        }
      }
    });
  }
}

// Global modal triggers for citizen tables
window.openCitizenPayBillModal = function(billId, month, amount) {
  const modal = document.getElementById("citizenPayBillModal");
  if (!modal) return;
  document.getElementById("citPayBillId").value = billId;
  document.getElementById("citPayBillMonth").textContent = `Billing Period: ${month}`;
  document.getElementById("citPayBillAmount").textContent = `₹${Number(amount).toFixed(2)}`;
  modal.hidden = false;
};

window.openCitizenPayTaxModal = function(taxId, title, amount) {
  const modal = document.getElementById("citizenPayTaxModal");
  if (!modal) return;
  document.getElementById("citPayTaxId").value = taxId;
  document.getElementById("citPayTaxTitle").textContent = title;
  document.getElementById("citPayTaxAmount").textContent = `₹${Number(amount).toFixed(2)}`;
  modal.hidden = false;
};

async function renderCitizenView() {
  await Promise.all([
    loadCitizenOverview(),
    loadCitizenBills(),
    loadCitizenPayments(),
    loadCitizenTaxes(),
    loadCitizenComplaints(),
    loadCitizenApplications(),
    loadCitizenSchedule()
  ]);
}

export async function loadCitizenProfile() {
  return loadCitizenOverview();
}
window.loadCitizenProfile = loadCitizenProfile;

async function loadCitizenOverview() {
  try {
    const rawProfile = await api.getMyProfile();
    if (!rawProfile) return;

    const citId = rawProfile.id || rawProfile.citizenId || rawProfile.login_id;
    const fName = rawProfile.full_name || rawProfile.fullName || "Citizen";
    const propNo = rawProfile.prop_number || rawProfile.property_no || rawProfile.propertyNo || "H-104";
    const ward = rawProfile.prop_ward || rawProfile.ward_area || rawProfile.ward || "Village Ward";
    const meter = rawProfile.prop_meter_no || rawProfile.meter_no || rawProfile.meterNo || "Unmetered";
    const propType = rawProfile.prop_type || rawProfile.property_type || "Residential";
    const connType = rawProfile.prop_connection_type || rawProfile.connection_type || "Domestic Metered Tap";
    const annualTax = rawProfile.prop_annual_tax ? Number(rawProfile.prop_annual_tax) : 250.00;
    const address = rawProfile.prop_address || rawProfile.address || rawProfile.property_no || "Registered Village Household";
    const isActive = String(rawProfile.status || "").toLowerCase() === "active";

    const bName = document.getElementById("citBannerName");
    const bId = document.getElementById("citBannerId");
    const bMeta = document.getElementById("citBannerMeta");
    const bAvatar = document.getElementById("citBannerAvatar");
    const bStatus = document.getElementById("citBannerStatus");

    if (bName) bName.textContent = fName;
    if (bId) bId.textContent = citId;
    if (bAvatar) bAvatar.textContent = (fName || "C")[0].toUpperCase();
    if (bMeta) {
      const lblProp = getLanguage() === "mr" ? "मालमत्ता" : "Property";
      const lblWard = getLanguage() === "mr" ? "वॉर्ड" : "Ward";
      const lblMeter = getLanguage() === "mr" ? "मीटर" : "Water Meter";
      bMeta.innerHTML = `${lblProp}: <strong>${escapeHtml(propNo)}</strong> &bull; ${lblWard}: <strong>${escapeHtml(ward)}</strong> &bull; ${lblMeter}: <strong>${escapeHtml(meter)}</strong>`;
    }
    if (bStatus) {
      bStatus.className = `citizen-status-badge ${isActive ? 'status-active' : ''}`;
      bStatus.textContent = isActive ? t("cit_active_citizen", "Active Citizen") : t("cit_inactive_citizen", "Account Inactive");
    }

    // Populate Associated Property Card
    const elPropNo = document.getElementById("citPropNumber");
    const elPropType = document.getElementById("citPropType");
    const elPropWard = document.getElementById("citPropWard");
    const elPropMeter = document.getElementById("citPropMeter");
    const elPropConn = document.getElementById("citPropConn");
    const elPropTax = document.getElementById("citPropTax");
    const elPropAddr = document.getElementById("citPropAddress");

    if (elPropNo) elPropNo.textContent = propNo;
    if (elPropType) elPropType.textContent = propType;
    if (elPropWard) elPropWard.textContent = ward;
    if (elPropMeter) elPropMeter.textContent = meter;
    if (elPropConn) elPropConn.textContent = connType;
    if (elPropTax) elPropTax.textContent = `₹${annualTax.toFixed(2)} / yr`;
    if (elPropAddr) elPropAddr.textContent = address;

    // Populate profile edit form inputs
    const pId = document.getElementById("citProfileId");
    const pName = document.getElementById("citProfileName");
    const pPhone = document.getElementById("citProfilePhone");
    const pEmail = document.getElementById("citProfileEmail");
    const pMembers = document.getElementById("citProfileFamilyMembers");

    if (pId) pId.value = citId;
    if (pName) pName.value = fName;
    if (pPhone) pPhone.value = rawProfile.phone || "";
    if (pEmail) pEmail.value = rawProfile.email || "";
    if (pMembers) pMembers.value = rawProfile.family_members || 4;
  } catch (err) {
    console.warn("Could not load citizen overview:", err);
  }
}

async function loadCitizenBills() {
  const tbody = document.getElementById("citBillsTableBody");
  const kpiUnpaid = document.getElementById("citKpiUnpaidBills");
  const kpiCount = document.getElementById("citKpiBillsCount");

  try {
    const res = await api.getMyBills();
    const bills = Array.isArray(res) ? res : (res?.bills || []);
    let totalUnpaid = res?.summary?.totalOutstanding !== undefined ? Number(res.summary.totalOutstanding) : 0;
    let unpaidCount = 0;

    if (!tbody) return;

    if (bills.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">${t("cit_no_bills", "No water bills found.")}</td></tr>`;
    } else {
      let computedUnpaid = 0;
      tbody.innerHTML = bills.map(b => {
        const isPaid = b.status === "Paid";
        const billNo = b.bill_number || b.billNumber || b.id;
        const period = b.billing_period || b.billingPeriod || "Water Charge";
        const amt = Number(b.amount || 0);
        const paidAmt = Number(b.paid_amount || b.paidAmount || 0);
        const due = b.due_date || b.dueDate;

        if (!isPaid) {
          computedUnpaid += amt - paidAmt;
          unpaidCount++;
        }

        return `
          <tr>
            <td><strong>#${escapeHtml(billNo)}</strong></td>
            <td>${escapeHtml(period)}</td>
            <td><strong>₹${amt.toFixed(2)}</strong></td>
            <td>${escapeHtml(due ? String(due).slice(0, 10) : "N/A")}</td>
            <td>
              <span class="ticket-status-pill ${isPaid ? 'ticket-status-resolved' : 'ticket-status-pending'}">
                ${escapeHtml(formatStatus(b.status))}
              </span>
            </td>
            <td>
              ${isPaid 
                ? `<span style="color:#0f766e; font-weight:700; font-size:0.85rem;">✓ ${t("status_paid", "Paid")}</span>`
                : `<button class="btn btn-primary btn-sm" onclick="window.openCitizenPayBillModal('${b.id}', '${escapeHtml(period)}', ${amt})">${t("cit_btn_pay", "Pay Now")}</button>`
              }
            </td>
          </tr>
        `;
      }).join("");

      if (res?.summary?.totalOutstanding === undefined) {
        totalUnpaid = computedUnpaid;
      }
    }

    if (kpiUnpaid) kpiUnpaid.textContent = `₹${totalUnpaid.toFixed(2)}`;
    if (kpiCount) {
      kpiCount.textContent = getLanguage() === "mr" 
        ? `${unpaidCount} थकबाकी बिले` 
        : `${unpaidCount} unpaid bill${unpaidCount === 1 ? '' : 's'}`;
    }
  } catch (err) {
    console.error("loadCitizenBills error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; text-align:center;">Failed to load bills.</td></tr>`;
  }
}

async function loadCitizenPayments() {
  const tbody = document.getElementById("citPaymentsTableBody");
  try {
    const res = await api.getMyPayments();
    const payments = Array.isArray(res) ? res : (res?.payments || []);
    if (!tbody) return;

    if (payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px;">${t("cit_no_payments", "No payment receipts found.")}</td></tr>`;
    } else {
      tbody.innerHTML = payments.map(p => {
        const recNo = p.receipt_no || p.receiptNumber || p.id;
        const billLabel = p.billing_period || p.billNumber || (p.bill_id ? `#${p.bill_id}` : (getLanguage() === "mr" ? "पाणी बिल" : "Water Bill"));
        const pDate = p.payment_date || p.paymentDate;
        const pMode = p.payment_mode || p.paymentMethod || "UPI";
        const recorded = p.notes || p.recordedBy || (getLanguage() === "mr" ? "ग्रामपंचायत काउंटर" : "Gram Panchayat Counter");

        return `
          <tr>
            <td><strong style="color:#0284c7;">#${escapeHtml(recNo)}</strong></td>
            <td>${escapeHtml(billLabel)}</td>
            <td><strong>₹${Number(p.amount || 0).toFixed(2)}</strong></td>
            <td>${escapeHtml(pDate ? String(pDate).slice(0, 10) : (getLanguage() === "mr" ? "नुकतेच" : "Recent"))}</td>
            <td>${escapeHtml(pMode)}</td>
            <td>${escapeHtml(recorded)}</td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("loadCitizenPayments error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; text-align:center;">Failed to load payments.</td></tr>`;
  }
}

async function loadCitizenTaxes() {
  const tbody = document.getElementById("citTaxesTableBody");
  const kpiUnpaid = document.getElementById("citKpiUnpaidTaxes");
  const kpiCount = document.getElementById("citKpiTaxesCount");

  try {
    const res = await api.getMyTaxes();
    const taxes = Array.isArray(res) ? res : (res?.taxes || []);
    let totalUnpaid = 0;
    let unpaidCount = 0;

    if (!tbody) return;

    if (taxes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:20px;">${t("cit_no_taxes", "No applicable Panchayat taxes.")}</td></tr>`;
    } else {
      tbody.innerHTML = taxes.map(taxItem => {
        const isPaid = taxItem.status === "Paid";
        const amt = Number(taxItem.amount || 0);
        const title = taxItem.charge_type || taxItem.title || "Gram Panchayat Cess";
        const cat = taxItem.description || taxItem.category || "General";
        const due = taxItem.due_date || taxItem.dueDate;

        if (!isPaid) {
          totalUnpaid += amt;
          unpaidCount++;
        }

        return `
          <tr>
            <td><strong>#${escapeHtml(taxItem.id)}</strong></td>
            <td><strong>${escapeHtml(title)}</strong></td>
            <td><span class="source-type-pill">${escapeHtml(cat)}</span></td>
            <td><strong>₹${amt.toFixed(2)}</strong></td>
            <td>${escapeHtml(due ? String(due).slice(0, 10) : "N/A")}</td>
            <td>
              <span class="ticket-status-pill ${isPaid ? 'ticket-status-resolved' : 'ticket-status-pending'}">
                ${escapeHtml(formatStatus(taxItem.status))}
              </span>
            </td>
            <td>
              ${isPaid 
                ? `<span style="color:#0f766e; font-weight:700; font-size:0.85rem;">✓ ${t("status_cleared", "Cleared")}</span>`
                : `<button class="btn btn-primary btn-sm" onclick="window.openCitizenPayTaxModal('${taxItem.id}', '${escapeHtml(title)}', ${amt})">${t("tax_btn_pay", "Pay Tax")}</button>`
              }
            </td>
          </tr>
        `;
      }).join("");
    }

    if (kpiUnpaid) kpiUnpaid.textContent = `₹${totalUnpaid.toFixed(2)}`;
    if (kpiCount) {
      kpiCount.textContent = getLanguage() === "mr" 
        ? `${unpaidCount} प्रलंबित कर` 
        : `${unpaidCount} pending charge${unpaidCount === 1 ? '' : 's'}`;
    }
  } catch (err) {
    console.error("loadCitizenTaxes error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444; text-align:center;">Failed to load taxes.</td></tr>`;
  }
}

async function loadCitizenComplaints() {
  const feed = document.getElementById("citComplaintsFeed");
  const kpiCount = document.getElementById("citKpiComplaintsCount");

  try {
    const res = await api.getMyComplaints();
    const complaints = Array.isArray(res) ? res : (res?.complaints || []);
    if (kpiCount) kpiCount.textContent = String(complaints.length);
    if (!feed) return;

    if (complaints.length === 0) {
      feed.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px;">${t("cit_no_complaints", "No grievances filed yet.")}</div>`;
    } else {
      feed.innerHTML = complaints.map(c => {
        const pType = c.problem_type || c.problemType || "Water Supply Issue";
        const created = c.created_at || c.createdAt;
        const urgency = c.urgency || "Normal";
        const adminResp = c.admin_response || c.adminResponse;

        return `
          <div class="cit-complaint-card">
            <div class="cit-complaint-top">
              <span class="cit-complaint-type">${escapeHtml(pType)}</span>
              <span class="ticket-status-pill ${c.status === 'Resolved' ? 'ticket-status-resolved' : c.status === 'Dispatched' ? 'ticket-status-dispatched' : 'ticket-status-pending'}">
                ${escapeHtml(formatStatus(c.status))}
              </span>
            </div>
            <p style="font-size:0.9rem; color:#334155; margin:6px 0;">${escapeHtml(c.description)}</p>
            <div style="font-size:0.78rem; color:#64748b;">${getLanguage() === "mr" ? "नोंदणी तारीख:" : "Filed on:"} ${escapeHtml(created ? String(created).slice(0, 10) : (getLanguage() === "mr" ? "नुकतेच" : "Recent"))} &bull; ${getLanguage() === "mr" ? "तीव्रता:" : "Urgency:"} <strong>${escapeHtml(formatUrgency(urgency))}</strong></div>
            ${adminResp ? `
              <div class="cit-admin-response-box">
                <div class="cit-admin-response-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>${t("cit_gp_response", "Gram Panchayat Response:")}</span>
                </div>
                <div>${escapeHtml(adminResp)}</div>
              </div>
            ` : `<div style="font-size:0.8rem; color:#94a3b8; margin-top:8px;">${getLanguage() === "mr" ? "प्रशासकीय पडताळणी प्रलंबित आहे." : "Awaiting official administrative review."}</div>`}
          </div>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("loadCitizenComplaints error:", err);
    if (feed) feed.innerHTML = `<div style="color:#ef4444; text-align:center;">Failed to load complaints.</div>`;
  }
}

async function loadCitizenSchedule() {
  const tbody = document.getElementById("citScheduleTableBody");
  const kpiNextSupply = document.getElementById("citKpiNextSupply");

  try {
    const res = await api.getMySchedule();
    const schedules = Array.isArray(res) ? res : (res?.schedules || []);
    if (!tbody) return;

    if (schedules.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:20px;">${t("cit_no_schedules", "No schedules available for your ward.")}</td></tr>`;
      if (kpiNextSupply) kpiNextSupply.textContent = t("cit_standby", "Standby");
    } else {
      if (kpiNextSupply && schedules[0]) {
        kpiNextSupply.textContent = schedules[0].timeSlot || schedules[0].time_slot || (getLanguage() === "mr" ? "नियोजित" : "Scheduled");
      }

      tbody.innerHTML = schedules.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.area || s.ward || "Gram Area")}</strong></td>
          <td>${escapeHtml(s.dateLabel || s.date_label || s.date || (getLanguage() === "mr" ? "आज" : "Today"))}</td>
          <td><span style="font-weight:700; color:#0284c7;">${escapeHtml(s.timeSlot || s.time_slot || (getLanguage() === "mr" ? "सकाळ" : "Morning"))}</span></td>
          <td>${escapeHtml(s.duration || "2 hrs")}</td>
          <td>${escapeHtml(formatSupplyType(s.supplyType || s.supply_type || "Piped Tap"))}</td>
          <td><span class="source-type-pill">${escapeHtml(formatStatus(s.status || "Active"))}</span></td>
          <td>${escapeHtml(s.lineman || (getLanguage() === "mr" ? "ग्रामपंचायत लाईनमन" : "Gram Panchayat Lineman"))}</td>
        </tr>
      `).join("");
    }
  } catch (err) {
    console.error("loadCitizenSchedule error:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444; text-align:center;">Failed to load schedule.</td></tr>`;
  }
}

// ==========================================================
// 13. ADMIN PORTAL CONTROLLER (COMPREHENSIVE)
// ==========================================================
function initAdminView() {
  const navContainer = document.getElementById("adminNavContainer");
  const mobileToggle = document.getElementById("btnToggleAdminNavMenu");
  const activeNameEl = document.getElementById("adminNavActiveName");
  const activeIconEl = document.getElementById("adminNavActiveIcon");

  // Mobile menu dropdown toggle
  if (mobileToggle && navContainer) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = navContainer.classList.toggle("is-menu-open");
      mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Admin Sub-Tabs Switching
  const adminTabs = document.querySelectorAll(".portal-subnav-tab[data-admin-tab]");
  adminTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      adminTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Sync active state to mobile switcher
      const textSpan = tab.querySelector("span");
      const iconSvg = tab.querySelector("svg");
      if (activeNameEl && textSpan) {
        activeNameEl.textContent = textSpan.textContent.trim();
        const i18nKey = textSpan.getAttribute("data-i18n");
        if (i18nKey) activeNameEl.setAttribute("data-i18n", i18nKey);
        else activeNameEl.removeAttribute("data-i18n");
      }
      if (activeIconEl && iconSvg) {
        activeIconEl.innerHTML = iconSvg.outerHTML;
      }

      // Auto-collapse mobile navigation dropdown on selection
      if (navContainer && navContainer.classList.contains("is-menu-open")) {
        navContainer.classList.remove("is-menu-open");
        if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
      }

      const tabKey = tab.getAttribute("data-admin-tab");
      document.querySelectorAll(".admin-tab-pane").forEach(pane => pane.classList.remove("active"));

      const targetPane = document.getElementById(`adminPane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
      if (targetPane) targetPane.classList.add("active");

      if (tabKey === "applications") loadAdminApplications();
      else if (tabKey === "rti") loadAdminRtiRegister();
      else if (tabKey === "tasks") loadAdminTasks();
      else if (tabKey === "notices") loadAdminNotices();
      else if (tabKey === "services") loadAdminServicesTable();
      else if (tabKey === "dashboard") {
        loadAdminExecutiveKPIs();
        renderAdminStats();
      } else if (tabKey === "bills") renderAdminBills();
      else if (tabKey === "citizens") renderAdminCitizensTable();
      else if (tabKey === "properties") renderAdminPropertiesTable();
      else if (tabKey === "sources") renderAdminSourcesTable();
      else if (tabKey === "taxes") renderAdminTaxesTable();
      else if (tabKey === "schedule") renderAdminScheduleTable();
      else if (tabKey === "complaints") renderAdminComplaintsTable();
      else if (tabKey === "reports") renderAdminReportsView();
    });
  });

  // Refresh DB Data Button
  const btnRefresh = document.getElementById("btnAdminRefresh");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      renderAdminView();
      showToast("Records refreshed successfully.", "success");
    });
  }

  // Save Admin Profile & Header Badge Settings Form
  const profileForm = document.getElementById("adminProfileForm");
  const inputFullName = document.getElementById("adminProfileFullName");
  const inputRoleTitle = document.getElementById("adminProfileRoleTitle");
  const inputPhone = document.getElementById("adminProfilePhone");
  const inputEmail = document.getElementById("adminProfileEmail");
  const btnSaveProfile = document.getElementById("btnSaveAdminProfile");
  const statusSaved = document.getElementById("adminProfileLastSaved");
  const prevName = document.getElementById("prevBadgeName");
  const prevRole = document.getElementById("prevBadgeRole");
  const prevAvatar = document.getElementById("prevBadgeAvatar");

  const updateBadgePreview = () => {
    const dName = inputFullName?.value?.trim() || "Admin";
    const dRole = inputRoleTitle?.value?.trim() || "Staff";
    if (prevName) prevName.textContent = dName;
    if (prevRole) prevRole.textContent = dRole;
    if (prevAvatar) prevAvatar.textContent = (dName || "A")[0].toUpperCase();
  };

  if (inputFullName) inputFullName.addEventListener("input", updateBadgePreview);
  if (inputRoleTitle) inputRoleTitle.addEventListener("input", updateBadgePreview);

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = inputFullName?.value?.trim();
      const roleTitle = inputRoleTitle?.value?.trim();
      const phone = inputPhone?.value?.trim();
      const email = inputEmail?.value?.trim();

      if (!fullName) {
        showToast("Display name cannot be empty.", "error");
        return;
      }
      if (!roleTitle) {
        showToast("Display role / badge title cannot be empty.", "error");
        return;
      }

      if (btnSaveProfile) {
        btnSaveProfile.disabled = true;
        btnSaveProfile.innerHTML = `<span class="spinner-inline"></span> Saving to MySQL...`;
      }

      try {
        const res = await api.updateProfile({ fullName, roleTitle, phone, email });
        if (res.token && res.user) {
          api.setAuthSession(res.token, res.user);
        }
        updateAuthUI();
        updateBadgePreview();

        if (statusSaved) {
          statusSaved.textContent = `Saved to MySQL at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
          statusSaved.style.color = "#047857";
        }

        showToast(`Profile updated! Badge now displays "${fullName}" (${roleTitle}).`, "success");
      } catch (err) {
        console.error("Failed to save admin profile:", err);
        showToast("Error updating profile: " + err.message, "error");
      } finally {
        if (btnSaveProfile) {
          btnSaveProfile.disabled = false;
          btnSaveProfile.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> <span>Save Profile & Update Badge</span>`;
        }
      }
    });
  }

  // Save Village Overall Settings
  const villageForm = document.getElementById("adminVillageSettingsForm");
  const btnSaveVillage = document.getElementById("btnSaveVillageInfo");

  if (villageForm) {
    villageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const villageName = document.getElementById("adminVillageName")?.value.trim();
      const villageNameMr = document.getElementById("adminVillageNameMr")?.value.trim();
      const taluka = document.getElementById("adminTaluka")?.value.trim();
      const district = document.getElementById("adminDistrict")?.value.trim();
      const state = document.getElementById("adminState")?.value.trim();
      const sarpanchName = document.getElementById("adminSarpanchName")?.value.trim();
      const sarpanchPhoto = document.getElementById("adminSarpanchPhoto")?.value.trim();
      const gramSevakName = document.getElementById("adminGramSevakName")?.value.trim();
      const gramSevakPhoto = document.getElementById("adminGramSevakPhoto")?.value.trim();
      const secretaryName = document.getElementById("adminSecretaryName")?.value.trim();
      const secretaryPhoto = document.getElementById("adminSecretaryPhoto")?.value.trim();
      const officePhone = document.getElementById("adminOfficePhone")?.value.trim();
      const officeEmail = document.getElementById("adminOfficeEmail")?.value.trim();
      const officeHours = document.getElementById("adminOfficeHours")?.value.trim();
      const officeAddress = document.getElementById("adminOfficeAddress")?.value.trim();
      const introText = document.getElementById("adminIntroText")?.value.trim();
      const introTextMr = document.getElementById("adminIntroTextMr")?.value.trim();
      const droughtStatus = document.getElementById("adminDroughtStatus")?.value;
      const noticeText = document.getElementById("adminNoticeText")?.value.trim();

      const updates = {
        village_name: villageName || "Gram Panchayat",
        villageName: villageName || "Gram Panchayat",
        village_name_mr: villageNameMr || "",
        villageNameMr: villageNameMr || "",
        taluka, district, state,
        sarpanch_name: sarpanchName,
        sarpanch_photo: sarpanchPhoto,
        gram_sevak_name: gramSevakName,
        gram_sevak_photo: gramSevakPhoto,
        secretary_name: secretaryName,
        secretary_photo: secretaryPhoto,
        office_phone: officePhone,
        office_email: officeEmail,
        office_hours: officeHours,
        office_address: officeAddress,
        intro_text: introText,
        intro_text_mr: introTextMr,
        drought_status: droughtStatus,
        overallStatus: droughtStatus,
        alert_banner_text: noticeText,
        noticeText: noticeText,
        lastUpdated: "Just now (" + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ")"
      };

      if (btnSaveVillage) {
        btnSaveVillage.disabled = true;
        btnSaveVillage.innerHTML = `<span class="spinner-inline"></span> Saving...`;
      }

      try {
        await api.updateVillageSettings(updates);
        Object.assign(appState.villageInfo, updates);
        showToast("Official Gram Panchayat details saved successfully!", "success");
        renderPanchayatWelcomeHero(appState.villageInfo);
        renderAllViews();
      } catch (err) {
        console.error("Error updating village info:", err);
        showToast("Failed to update: " + err.message, "error");
      } finally {
        if (btnSaveVillage) {
          btnSaveVillage.disabled = false;
          btnSaveVillage.innerHTML = "Save Official Village Settings";
        }
      }
    });
  }

  // Citizen Directory Search & Filters
  const searchInput = document.getElementById("adminCitizenSearch");
  const filterWard = document.getElementById("adminCitizenFilterWard");
  const filterStatus = document.getElementById("adminCitizenFilterStatus");

  const runCitizenFilter = () => {
    const q = searchInput ? searchInput.value.trim() : "";
    const w = filterWard ? filterWard.value : "";
    const s = filterStatus ? filterStatus.value : "";
    renderAdminCitizensTable(q, s, w);
  };

  if (searchInput) searchInput.addEventListener("input", runCitizenFilter);
  if (filterWard) filterWard.addEventListener("change", runCitizenFilter);
  if (filterStatus) filterStatus.addEventListener("change", runCitizenFilter);

  // Add Citizen Modal
  const modalAddCit = document.getElementById("adminAddCitizenModal");
  const btnOpenAddCit = document.getElementById("btnOpenAddCitizenModal");
  const btnCloseAddCit = document.getElementById("btnCloseAddCitizenModal");
  const btnCancelAddCit = document.getElementById("btnCancelAddCitizenModal");
  const formAddCit = document.getElementById("adminAddCitizenForm");
  const btnSaveAddCit = document.getElementById("btnSaveNewCitizen");

  if (btnOpenAddCit && modalAddCit) {
    btnOpenAddCit.addEventListener("click", () => {
      modalAddCit.hidden = false;
      if (formAddCit) formAddCit.reset();
      const randId = "CIT-" + Math.floor(100 + Math.random() * 900);
      const idInput = document.getElementById("newCitLoginId");
      if (idInput) idInput.value = randId;
    });
  }

  const closeAddCit = () => { if (modalAddCit) modalAddCit.hidden = true; };
  if (btnCloseAddCit) btnCloseAddCit.addEventListener("click", closeAddCit);
  if (btnCancelAddCit) btnCancelAddCit.addEventListener("click", closeAddCit);

  if (formAddCit) {
    formAddCit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const citizenId = document.getElementById("newCitLoginId").value.trim();
      const fullName = document.getElementById("newCitFullName").value.trim();
      const phone = document.getElementById("newCitPhone").value.trim();
      const password = document.getElementById("newCitPassword").value;
      const propertyNo = document.getElementById("newCitPropertyNo").value.trim();
      const ward = document.getElementById("newCitWard").value;
      const meterNo = document.getElementById("newCitMeterNo").value.trim();
      const address = document.getElementById("newCitAddress").value.trim();

      if (!citizenId || !fullName || !phone || !password || !propertyNo || !ward) {
        showToast("Please fill all required citizen fields (Name, Phone, ID, Password, Property No, and Ward).", "error");
        return;
      }

      if (btnSaveAddCit) {
        btnSaveAddCit.disabled = true;
        btnSaveAddCit.innerHTML = `<span class="spinner-inline"></span> Saving...`;
      }

      try {
        await api.createAdminCitizen({
          citizenId,
          fullName,
          name: fullName,
          phone,
          mobile: phone,
          password,
          initialPassword: password,
          propertyNo,
          property_no: propertyNo,
          propertyNumber: propertyNo,
          wardArea: ward,
          ward_area: ward,
          ward,
          meterNo,
          meter_no: meterNo,
          address
        });
        showToast(`Citizen ${fullName} (${citizenId}) registered successfully!`, "success");
        closeAddCit();
        await renderAdminCitizensTable();
        await renderAdminStats();
      } catch (err) {
        console.error("Create citizen error:", err);
        showToast("Failed to create citizen: " + err.message, "error");
      } finally {
        if (btnSaveAddCit) {
          btnSaveAddCit.disabled = false;
          btnSaveAddCit.innerHTML = "Register Citizen";
        }
      }
    });
  }

  // Edit Citizen Modal
  const modalEditCit = document.getElementById("adminEditCitizenModal");
  const btnCloseEditCit = document.getElementById("btnCloseEditCitizenModal");
  const btnCancelEditCit = document.getElementById("btnCancelEditCitizenModal");
  const formEditCit = document.getElementById("adminEditCitizenForm");
  const btnSaveEditCit = document.getElementById("btnSaveEditedCitizen");

  const closeEditCit = () => { if (modalEditCit) modalEditCit.hidden = true; };
  if (btnCloseEditCit) btnCloseEditCit.addEventListener("click", closeEditCit);
  if (btnCancelEditCit) btnCancelEditCit.addEventListener("click", closeEditCit);

  if (formEditCit) {
    formEditCit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const citizenId = document.getElementById("editCitizenDbId").value;
      const fullName = document.getElementById("editCitFullName").value.trim();
      const phone = document.getElementById("editCitPhone").value.trim();
      const propertyNo = document.getElementById("editCitPropertyNo").value.trim();
      const ward = document.getElementById("editCitWard").value;
      const meterNo = document.getElementById("editCitMeterNo").value.trim();
      const status = document.getElementById("editCitStatus").value;

      if (!fullName || !phone || !propertyNo || !ward) {
        showToast("Please fill all required citizen fields.", "error");
        return;
      }

      if (btnSaveEditCit) {
        btnSaveEditCit.disabled = true;
        btnSaveEditCit.innerHTML = `<span class="spinner-inline"></span> Updating...`;
      }

      try {
        await api.updateAdminCitizen(citizenId, {
          fullName,
          name: fullName,
          phone,
          mobile: phone,
          propertyNo,
          property_no: propertyNo,
          propertyNumber: propertyNo,
          wardArea: ward,
          ward_area: ward,
          ward,
          meterNo,
          meter_no: meterNo,
          status
        });
        showToast(`Citizen details for ${citizenId} updated successfully!`, "success");
        closeEditCit();
        await renderAdminCitizensTable();
      } catch (err) {
        console.error("Update citizen error:", err);
        showToast("Failed to update citizen: " + err.message, "error");
      } finally {
        if (btnSaveEditCit) {
          btnSaveEditCit.disabled = false;
          btnSaveEditCit.innerHTML = "Update Details";
        }
      }
    });
  }

  // Add Water Source Modal
  const modalAddSrc = document.getElementById("adminAddSourceModal");
  const btnOpenAddSrc = document.getElementById("btnOpenAddSourceModal");
  const btnCloseAddSrc = document.getElementById("btnCloseAddSourceModal");
  const btnCancelAddSrc = document.getElementById("btnCancelAddSourceModal");
  const formAddSrc = document.getElementById("adminAddSourceForm");
  const btnSaveAddSrc = document.getElementById("btnSaveNewSource");

  if (btnOpenAddSrc && modalAddSrc) {
    btnOpenAddSrc.addEventListener("click", () => {
      modalAddSrc.hidden = false;
      if (formAddSrc) formAddSrc.reset();
    });
  }

  const closeAddSrc = () => { if (modalAddSrc) modalAddSrc.hidden = true; };
  if (btnCloseAddSrc) btnCloseAddSrc.addEventListener("click", closeAddSrc);
  if (btnCancelAddSrc) btnCancelAddSrc.addEventListener("click", closeAddSrc);

  if (formAddSrc) {
    formAddSrc.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("newSourceName").value.trim();
      const type = document.getElementById("newSourceType").value;
      const totalCapacity = Number(document.getElementById("newSourceCapacity").value);
      const currentLevelPercent = Number(document.getElementById("newSourceLevel").value);
      const location = document.getElementById("newSourceLocation").value.trim();
      const purityStatus = document.getElementById("newSourcePurity").value.trim() || "Potable";

      if (!name || !totalCapacity || !location) {
        showToast("Please enter source name, capacity, and location.", "error");
        return;
      }

      if (btnSaveAddSrc) {
        btnSaveAddSrc.disabled = true;
        btnSaveAddSrc.innerHTML = `<span class="spinner-inline"></span> Adding Source...`;
      }

      try {
        const newSource = {
          id: "src-" + Date.now(),
          name,
          type,
          typeLabel: type.toUpperCase(),
          totalCapacity,
          currentLevelPercent,
          location,
          purityStatus,
          lastInspected: "Today"
        };
        await api.createWaterSource(newSource);
        appState.sources.push(newSource);
        showToast(`Water source '${name}' registered successfully!`, "success");
        closeAddSrc();
        renderAdminSourcesTable();
        renderHomeView();
        renderStorageView();
        renderAdminStats();
      } catch (err) {
        console.error("Create source error:", err);
        showToast("Failed to add source: " + err.message, "error");
      } finally {
        if (btnSaveAddSrc) {
          btnSaveAddSrc.disabled = false;
          btnSaveAddSrc.innerHTML = "Add Water Source";
        }
      }
    });
  }

  // Create Bill Modal
  const modalBill = document.getElementById("adminCreateBillModal");
  const btnOpenBill = document.getElementById("btnOpenCreateBillModal");
  const btnCloseBill = document.getElementById("btnCloseCreateBillModal");
  const btnCancelBill = document.getElementById("btnCancelCreateBillModal");
  const formBill = document.getElementById("adminCreateBillForm");
  const btnSaveBill = document.getElementById("btnSaveNewBill");

  if (btnOpenBill && modalBill) {
    btnOpenBill.addEventListener("click", async () => {
      modalBill.hidden = false;
      if (formBill) formBill.reset();
      await populateCitizenSelect("billCitizenSelect");
      const today = new Date();
      today.setDate(today.getDate() + 15);
      const dueDateInput = document.getElementById("billDueDate");
      if (dueDateInput) dueDateInput.value = today.toISOString().split("T")[0];
      const monthInput = document.getElementById("billMonth");
      if (monthInput) monthInput.value = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    });
  }

  const closeBill = () => { if (modalBill) modalBill.hidden = true; };
  if (btnCloseBill) btnCloseBill.addEventListener("click", closeBill);
  if (btnCancelBill) btnCancelBill.addEventListener("click", closeBill);

  if (formBill) {
    formBill.addEventListener("submit", async (e) => {
      e.preventDefault();
      const citizenId = document.getElementById("billCitizenSelect").value;
      const billingPeriod = document.getElementById("billMonth").value.trim();
      const amount = Number(document.getElementById("billAmount").value);
      const dueDate = document.getElementById("billDueDate").value;
      const unitsConsumed = Number(document.getElementById("billUnits").value || 0);

      if (!citizenId || !billingPeriod || !amount || !dueDate) {
        showToast("Please enter all required billing fields.", "error");
        return;
      }

      if (btnSaveBill) {
        btnSaveBill.disabled = true;
        btnSaveBill.innerHTML = `<span class="spinner-inline"></span> Issuing Bill...`;
      }

      try {
        const res = await api.createAdminBill({ citizenId, billingPeriod, amount, dueDate, unitsConsumed });
        showToast(`Bill #${res.bill.billNumber} issued for ${billingPeriod}!`, "success");
        closeBill();
        await renderAdminBillsTable();
        await renderAdminStats();
      } catch (err) {
        console.error("Create bill error:", err);
        showToast("Failed to issue bill: " + err.message, "error");
      } finally {
        if (btnSaveBill) {
          btnSaveBill.disabled = false;
          btnSaveBill.innerHTML = "Generate & Issue Bill";
        }
      }
    });
  }

  // Record Offline Payment Modal
  const modalPay = document.getElementById("adminRecordPaymentModal");
  const btnOpenPay = document.getElementById("btnOpenRecordPaymentModal");
  const btnClosePay = document.getElementById("btnCloseRecordPaymentModal");
  const btnCancelPay = document.getElementById("btnCancelRecordPaymentModal");
  const formPay = document.getElementById("adminRecordPaymentForm");
  const btnSavePay = document.getElementById("btnSavePaymentRecord");

  if (btnOpenPay && modalPay) {
    btnOpenPay.addEventListener("click", async () => {
      modalPay.hidden = false;
      if (formPay) formPay.reset();
      await populateUnpaidBillsSelect("payBillSelect");
    });
  }

  const closePay = () => { if (modalPay) modalPay.hidden = true; };
  if (btnClosePay) btnClosePay.addEventListener("click", closePay);
  if (btnCancelPay) btnCancelPay.addEventListener("click", closePay);

  if (formPay) {
    formPay.addEventListener("submit", async (e) => {
      e.preventDefault();
      const billId = document.getElementById("payBillSelect").value;
      const amount = Number(document.getElementById("payAmount").value);
      const paymentMethod = document.getElementById("payMethod").value;
      const notes = document.getElementById("payNotes").value.trim();

      if (!billId || !amount) {
        showToast("Please select a bill and enter payment amount.", "error");
        return;
      }

      if (btnSavePay) {
        btnSavePay.disabled = true;
        btnSavePay.innerHTML = `<span class="spinner-inline"></span> Recording Payment...`;
      }

      try {
        const res = await api.recordAdminPayment({ billId, amount, paymentMethod, notes });
        showToast(`Payment recorded! Receipt #${res.payment.receiptNumber}`, "success");
        closePay();
        await renderAdminBillsTable();
        await renderAdminPaymentsTable();
        await renderAdminStats();
      } catch (err) {
        console.error("Record payment error:", err);
        showToast("Failed to record payment: " + err.message, "error");
      } finally {
        if (btnSavePay) {
          btnSavePay.disabled = false;
          btnSavePay.innerHTML = "Record & Issue Receipt";
        }
      }
    });
  }

  // Create Tax / Charge Modal
  const modalTax = document.getElementById("adminCreateTaxModal");
  const btnOpenTax = document.getElementById("btnOpenCreateTaxModal");
  const btnCloseTax = document.getElementById("btnCloseCreateTaxModal");
  const btnCancelTax = document.getElementById("btnCancelCreateTaxModal");
  const formTax = document.getElementById("adminCreateTaxForm");
  const btnSaveTax = document.getElementById("btnSaveNewTax");

  if (btnOpenTax && modalTax) {
    btnOpenTax.addEventListener("click", async () => {
      modalTax.hidden = false;
      if (formTax) formTax.reset();
      await populateCitizenSelect("taxCitizenSelect");
      const today = new Date();
      today.setDate(today.getDate() + 30);
      const dueDateInput = document.getElementById("taxDueDate");
      if (dueDateInput) dueDateInput.value = today.toISOString().split("T")[0];
    });
  }

  const closeTax = () => { if (modalTax) modalTax.hidden = true; };
  if (btnCloseTax) btnCloseTax.addEventListener("click", closeTax);
  if (btnCancelTax) btnCancelTax.addEventListener("click", closeTax);

  if (formTax) {
    formTax.addEventListener("submit", async (e) => {
      e.preventDefault();
      const citizenId = document.getElementById("taxCitizenSelect").value;
      const title = document.getElementById("taxTitle").value.trim();
      const category = document.getElementById("taxCategory").value;
      const amount = Number(document.getElementById("taxAmount").value);
      const dueDate = document.getElementById("taxDueDate").value;

      if (!citizenId || !title || !amount || !dueDate) {
        showToast("Please enter all required tax charge fields.", "error");
        return;
      }

      if (btnSaveTax) {
        btnSaveTax.disabled = true;
        btnSaveTax.innerHTML = `<span class="spinner-inline"></span> Saving...`;
      }

      try {
        await api.createAdminTax({ citizenId, title, category, amount, dueDate });
        showToast(`Tax '${title}' applied to resident!`, "success");
        closeTax();
        await renderAdminTaxesTable();
        await renderAdminStats();
      } catch (err) {
        console.error("Create tax error:", err);
        showToast("Failed to create tax: " + err.message, "error");
      } finally {
        if (btnSaveTax) {
          btnSaveTax.disabled = false;
          btnSaveTax.innerHTML = "Levy Charge";
        }
      }
    });
  }

  // Admin Complaint Response Modal
  const modalResp = document.getElementById("adminComplaintResponseModal");
  const btnCloseResp = document.getElementById("btnCloseComplaintResponseModal");
  const btnCancelResp = document.getElementById("btnCancelComplaintResponseModal");
  const formResp = document.getElementById("adminComplaintResponseForm");
  const btnSaveResp = document.getElementById("btnSaveComplaintResponse");

  const closeResp = () => { if (modalResp) modalResp.hidden = true; };
  if (btnCloseResp) btnCloseResp.addEventListener("click", closeResp);
  if (btnCancelResp) btnCancelResp.addEventListener("click", closeResp);

  if (formResp) {
    formResp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const complaintId = document.getElementById("respComplaintId").value;
      const status = document.getElementById("respStatusSelect").value;
      const adminResponse = document.getElementById("respAdminText").value.trim();

      if (!adminResponse) {
        showToast("Please write an administrative response for the citizen.", "error");
        return;
      }

      if (btnSaveResp) {
        btnSaveResp.disabled = true;
        btnSaveResp.innerHTML = `<span class="spinner-inline"></span> Saving Response...`;
      }

      try {
        await api.updateAdminComplaint(complaintId, { status, adminResponse });
        showToast("Administrative response saved and citizen notified!", "success");
        closeResp();
        renderAdminComplaintsTable();
        renderRecentReports();
        renderAdminStats();
      } catch (err) {
        console.error("Save response error:", err);
        showToast("Failed to save response: " + err.message, "error");
      } finally {
        if (btnSaveResp) {
          btnSaveResp.disabled = false;
          btnSaveResp.innerHTML = "Save & Notify Citizen";
        }
      }
    });
  }

  // Add / Edit Schedule Modal
  const btnOpenSched = document.getElementById("btnOpenAddScheduleModal");
  const modalSched = document.getElementById("scheduleModal");
  const btnCloseSched = document.getElementById("btnCloseScheduleModal");
  const btnCancelSched = document.getElementById("btnCancelScheduleModal");
  const schedForm = document.getElementById("scheduleForm");
  const btnSaveSched = document.getElementById("btnSaveSchedule");

  if (btnOpenSched && modalSched) {
    btnOpenSched.addEventListener("click", () => {
      document.getElementById("scheduleModalTitle").textContent = "Add New Distribution Slot";
      document.getElementById("editScheduleId").value = "";
      if (schedForm) schedForm.reset();
      const schedDate = document.getElementById("schedDate");
      if (schedDate) schedDate.value = new Date().toISOString().split("T")[0];
      modalSched.hidden = false;
    });
  }

  const closeSched = () => { if (modalSched) modalSched.hidden = true; };
  if (btnCloseSched) btnCloseSched.addEventListener("click", closeSched);
  if (btnCancelSched) btnCancelSched.addEventListener("click", closeSched);

  if (schedForm) {
    schedForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const editId = document.getElementById("editScheduleId").value;
      const area = document.getElementById("schedArea").value.trim();
      const date = document.getElementById("schedDate").value;
      const supplyType = document.getElementById("schedSupplyType").value;
      const timeSlot = document.getElementById("schedTimeSlot").value.trim();
      const duration = document.getElementById("schedDuration").value.trim();
      const status = document.getElementById("schedStatus").value;
      const lineman = document.getElementById("schedLineman").value.trim() || "Panchayat Lineman";

      if (!area || !timeSlot || !duration) {
        showToast("Please enter Area, Time slot, and Duration.", "error");
        return;
      }

      if (btnSaveSched) {
        btnSaveSched.disabled = true;
        btnSaveSched.innerHTML = `<span class="spinner-inline"></span> Saving...`;
      }

      try {
        if (editId) {
          const updates = { area, date, dateLabel: "Scheduled", supplyType, timeSlot, duration, status, lineman };
          await api.updateDistributionSchedule(editId, updates);
          const item = appState.schedules.find(s => s.id === editId);
          if (item) Object.assign(item, updates);
          showToast("Distribution schedule slot updated!", "success");
        } else {
          const newSched = {
            id: "sch-" + Date.now(),
            area,
            date,
            dateLabel: "Scheduled",
            timeSlot,
            duration,
            supplyType,
            status,
            lineman
          };
          await api.createDistributionSchedule(newSched);
          appState.schedules.push(newSched);
          showToast("Distribution slot saved successfully!", "success");
        }
        closeSched();
        renderAdminScheduleTable();
        renderScheduleView();
        renderHomeView();
      } catch (err) {
        console.error("Save schedule error:", err);
        showToast("Error saving schedule: " + err.message, "error");
      } finally {
        if (btnSaveSched) {
          btnSaveSched.disabled = false;
          btnSaveSched.innerHTML = "Save Schedule";
        }
      }
    });
  }

  // ==========================================
  // Property & Household Management Controllers
  // ==========================================
  const propSearch = document.getElementById("adminPropertySearch");
  const propWard = document.getElementById("adminPropertyFilterWard");
  const propType = document.getElementById("adminPropertyFilterType");

  const runPropertyFilter = () => {
    const q = propSearch ? propSearch.value.trim() : "";
    const w = propWard ? propWard.value : "";
    const t = propType ? propType.value : "";
    renderAdminPropertiesTable(q, w, t);
  };

  if (propSearch) propSearch.addEventListener("input", runPropertyFilter);
  if (propWard) propWard.addEventListener("change", runPropertyFilter);
  if (propType) propType.addEventListener("change", runPropertyFilter);

  // Add Property Modal
  const modalAddProp = document.getElementById("adminAddPropertyModal");
  const btnOpenAddProp = document.getElementById("btnOpenAddPropertyModal");
  const btnCloseAddProp = document.getElementById("btnCloseAddPropertyModal");
  const btnCancelAddProp = document.getElementById("btnCancelAddPropertyModal");
  const formAddProp = document.getElementById("adminAddPropertyForm");
  const btnSaveAddProp = document.getElementById("btnSaveNewProperty");

  if (btnOpenAddProp && modalAddProp) {
    btnOpenAddProp.addEventListener("click", async () => {
      modalAddProp.hidden = false;
      if (formAddProp) formAddProp.reset();
      await populatePropertyCitizensSelect("newPropOwnerCitizen");
      const citSelect = document.getElementById("newPropOwnerCitizen");
      if (citSelect) {
        citSelect.onchange = () => {
          const selectedText = citSelect.options[citSelect.selectedIndex]?.text || "";
          if (citSelect.value && selectedText) {
            const nameMatch = selectedText.split(" (")[0];
            const nameField = document.getElementById("newPropOwnerName");
            if (nameField && nameMatch) nameField.value = nameMatch;
          }
        };
      }
    });
  }

  const closeAddProp = () => { if (modalAddProp) modalAddProp.hidden = true; };
  if (btnCloseAddProp) btnCloseAddProp.addEventListener("click", closeAddProp);
  if (btnCancelAddProp) btnCancelAddProp.addEventListener("click", closeAddProp);

  if (formAddProp) {
    formAddProp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const propertyNumber = document.getElementById("newPropNumber").value.trim();
      const propertyType = document.getElementById("newPropType").value;
      const ownerCitizenId = document.getElementById("newPropOwnerCitizen").value || null;
      const ownerName = document.getElementById("newPropOwnerName").value.trim();
      const wardArea = document.getElementById("newPropWard").value;
      const waterMeterNo = document.getElementById("newPropMeterNo").value.trim() || null;
      const address = document.getElementById("newPropAddress").value.trim();
      const connectionType = document.getElementById("newPropConnType").value;
      const annualTax = parseFloat(document.getElementById("newPropAnnualTax").value) || 250.00;

      if (!propertyNumber || !ownerName || !address) {
        showToast("Property number, owner name, and address are required.", "error");
        return;
      }

      if (btnSaveAddProp) {
        btnSaveAddProp.disabled = true;
        btnSaveAddProp.innerHTML = `<span class="spinner-inline"></span> Saving Property...`;
      }

      try {
        await api.createProperty({
          propertyNumber, propertyType, ownerCitizenId, ownerName, wardArea, waterMeterNo, address, connectionType, annualTax
        });
        showToast(`Property ${propertyNumber} registered successfully!`, "success");
        closeAddProp();
        await renderAdminPropertiesTable();
        await renderAdminStats();
      } catch (err) {
        console.error("Create property error:", err);
        showToast("Failed to create property: " + err.message, "error");
      } finally {
        if (btnSaveAddProp) {
          btnSaveAddProp.disabled = false;
          btnSaveAddProp.innerHTML = "Save Property";
        }
      }
    });
  }

  // Edit Property Modal
  const modalEditProp = document.getElementById("adminEditPropertyModal");
  const btnCloseEditProp = document.getElementById("btnCloseEditPropertyModal");
  const btnCancelEditProp = document.getElementById("btnCancelEditPropertyModal");
  const formEditProp = document.getElementById("adminEditPropertyForm");
  const btnUpdateProp = document.getElementById("btnUpdateProperty");

  const closeEditProp = () => { if (modalEditProp) modalEditProp.hidden = true; };
  if (btnCloseEditProp) btnCloseEditProp.addEventListener("click", closeEditProp);
  if (btnCancelEditProp) btnCancelEditProp.addEventListener("click", closeEditProp);

  if (formEditProp) {
    formEditProp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editPropId").value;
      const propertyNumber = document.getElementById("editPropNumber").value.trim();
      const propertyType = document.getElementById("editPropType").value;
      const ownerCitizenId = document.getElementById("editPropOwnerCitizen").value || null;
      const ownerName = document.getElementById("editPropOwnerName").value.trim();
      const wardArea = document.getElementById("editPropWard").value;
      const waterMeterNo = document.getElementById("editPropMeterNo").value.trim() || null;
      const address = document.getElementById("editPropAddress").value.trim();
      const connectionType = document.getElementById("editPropConnType").value;
      const annualTax = parseFloat(document.getElementById("editPropAnnualTax").value) || 250.00;

      if (btnUpdateProp) {
        btnUpdateProp.disabled = true;
        btnUpdateProp.innerHTML = `<span class="spinner-inline"></span> Updating...`;
      }

      try {
        await api.updateProperty(id, {
          propertyNumber, propertyType, ownerCitizenId, ownerName, wardArea, waterMeterNo, address, connectionType, annualTax
        });
        showToast(`Property ${propertyNumber} updated successfully!`, "success");
        closeEditProp();
        await renderAdminPropertiesTable();
      } catch (err) {
        console.error("Update property error:", err);
        showToast("Failed to update property: " + err.message, "error");
      } finally {
        if (btnUpdateProp) {
          btnUpdateProp.disabled = false;
          btnUpdateProp.innerHTML = "Save Changes";
        }
      }
    });
  }

  // Complaints & Requests Excel (.xlsx) Export
  const btnExport = document.getElementById("btnExportComplaintsExcel");
  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      const origText = btnExport.innerHTML;
      try {
        btnExport.disabled = true;
        btnExport.innerHTML = `<span class="spinner-inline"></span> Generating Excel (.xlsx)...`;
        await api.exportComplaintsExcel();
        showToast("Official complaints & requests Excel spreadsheet downloaded successfully!", "success");
      } catch (err) {
        console.error("Export complaints Excel error:", err);
        showToast("Export failed: " + err.message, "error");
      } finally {
        btnExport.disabled = false;
        btnExport.innerHTML = origText;
      }
    });
  }

  // Initialize Water Monitoring Modals
  initWaterMonitoringModals();

  // Initialize Gram Panchayat Services Management
  initAdminServicesModule();
}

// ==========================================================
// GRAM PANCHAYAT SERVICES MANAGEMENT (ADMIN & PUBLIC)
// ==========================================================
function initAdminServicesModule() {
  const modalService = document.getElementById("adminServiceModal");
  const btnOpenAdd = document.getElementById("btnOpenAddServiceModal");
  const btnClose = document.getElementById("btnCloseServiceModal");
  const btnCancel = document.getElementById("btnCancelServiceModal");
  const formService = document.getElementById("adminServiceForm");

  const searchInput = document.getElementById("adminServiceSearch");
  const catFilter = document.getElementById("adminServiceCategoryFilter");
  const statusFilter = document.getElementById("adminServiceStatusFilter");

  if (searchInput) searchInput.addEventListener("input", () => loadAdminServicesTable());
  if (catFilter) catFilter.addEventListener("change", () => loadAdminServicesTable());
  if (statusFilter) statusFilter.addEventListener("change", () => loadAdminServicesTable());

  const updatePreview = () => {
    const icon = document.getElementById("serviceIcon")?.value.trim() || "🏛️";
    const name = document.getElementById("serviceNameEn")?.value.trim() || "Service Title";
    const desc = document.getElementById("serviceDescEn")?.value.trim() || "Service description preview...";
    const badge = document.getElementById("serviceBadgeText")?.value.trim() || "Office Counter";
    const badgeType = document.getElementById("serviceBadgeType")?.value || "counter";

    const pIcon = document.getElementById("previewIcon");
    const pTitle = document.getElementById("previewTitle");
    const pDesc = document.getElementById("previewDesc");
    const pBadge = document.getElementById("previewBadge");

    if (pIcon) pIcon.textContent = icon;
    if (pTitle) pTitle.textContent = name;
    if (pDesc) pDesc.textContent = desc;
    if (pBadge) {
      pBadge.textContent = badge;
      pBadge.className = `service-badge-pill service-badge-${badgeType}`;
    }
  };

  ["serviceIcon", "serviceNameEn", "serviceDescEn", "serviceBadgeText", "serviceBadgeType"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updatePreview);
  });

  const closeServiceModal = () => {
    if (modalService) modalService.hidden = true;
  };

  if (btnClose) btnClose.addEventListener("click", closeServiceModal);
  if (btnCancel) btnCancel.addEventListener("click", closeServiceModal);

  if (btnOpenAdd && modalService) {
    btnOpenAdd.addEventListener("click", async () => {
      if (formService) formService.reset();
      const idEl = document.getElementById("serviceEditId");
      if (idEl) idEl.value = "";
      const titleEl = document.getElementById("serviceModalTitle");
      if (titleEl) titleEl.textContent = "+ Add New Gram Panchayat Service";
      const codeEl = document.getElementById("serviceCode");
      if (codeEl) codeEl.readOnly = false;
      const orderEl = document.getElementById("serviceDisplayOrder");
      
      // Assign the next available order number by default so it appears at the end of the list
      let nextOrder = 1;
      try {
        const res = await api.getAdminServices();
        const svcs = (res && res.services) ? res.services : (Array.isArray(res) ? res : []);
        if (svcs.length > 0) {
          const maxOrder = Math.max(...svcs.map(s => Number(s.display_order) || 0));
          nextOrder = maxOrder + 1;
        }
      } catch (e) {
        nextOrder = 1;
      }
      if (orderEl) orderEl.value = String(nextOrder);

      const activeEl = document.getElementById("serviceIsActive");
      if (activeEl) activeEl.value = "1";
      const badgeTypeEl = document.getElementById("serviceBadgeType");
      if (badgeTypeEl) badgeTypeEl.value = "counter";
      const targetEl = document.getElementById("serviceActionTarget");
      if (targetEl) targetEl.value = "counter_info";
      updatePreview();
      modalService.hidden = false;
    });
  }

  if (formService) {
    formService.addEventListener("submit", async (e) => {
      e.preventDefault();
      const editId = document.getElementById("serviceEditId")?.value;
      const serviceCode = document.getElementById("serviceCode")?.value.trim();
      const nameEn = document.getElementById("serviceNameEn")?.value.trim();
      const nameMr = document.getElementById("serviceNameMr")?.value.trim();
      const category = document.getElementById("serviceCategory")?.value;
      const icon = document.getElementById("serviceIcon")?.value.trim() || "🏛️";
      const displayOrder = parseInt(document.getElementById("serviceDisplayOrder")?.value, 10) || 1;
      const isActive = document.getElementById("serviceIsActive")?.value === "1";
      const badgeText = document.getElementById("serviceBadgeText")?.value.trim();
      const badgeType = document.getElementById("serviceBadgeType")?.value;
      const actionTarget = document.getElementById("serviceActionTarget")?.value;
      const descEn = document.getElementById("serviceDescEn")?.value.trim();
      const descMr = document.getElementById("serviceDescMr")?.value.trim();
      const eligibility = document.getElementById("serviceEligibility")?.value.trim();
      const documents = document.getElementById("serviceDocuments")?.value.trim();
      const contactDept = document.getElementById("serviceContactDept")?.value.trim();

      if (!serviceCode || !nameEn || !nameMr) {
        showToast("Please enter service code, English name, and Marathi name.", "error");
        return;
      }

      const payload = {
        service_code: serviceCode,
        name_en: nameEn,
        name_mr: nameMr,
        category,
        icon,
        display_order: displayOrder,
        is_active: isActive,
        service_badge_text: badgeText,
        badge_type: badgeType,
        action_target: actionTarget,
        desc_en: descEn,
        desc_mr: descMr,
        eligibility_instructions: eligibility,
        required_documents: documents,
        contact_department: contactDept
      };

      const btnSave = document.getElementById("btnSaveService");
      const origText = btnSave ? btnSave.innerHTML : "Save Service";
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = `<span class="spinner-inline"></span> Saving...`;
      }

      try {
        if (editId) {
          await api.updateAdminService(editId, payload);
          showToast(`Service "${nameEn}" updated successfully!`, "success");
        } else {
          await api.createAdminService(payload);
          showToast(`Service "${nameEn}" created successfully!`, "success");
        }
        closeServiceModal();
        await loadAdminServicesTable();
        await renderHomeServices();
      } catch (err) {
        console.error("Save service error:", err);
        showToast("Failed to save service: " + err.message, "error");
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = origText;
        }
      }
    });
  }
}

export async function loadAdminServicesTable() {
  const tbody = document.getElementById("adminServicesTableBody");
  const emptyState = document.getElementById("adminServicesEmpty");
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px;"><span class="spinner-inline"></span> Loading services...</td></tr>`;

    const res = await api.getAdminServices();
    let services = (res && res.services) ? res.services : (Array.isArray(res) ? res : []);

    const search = document.getElementById("adminServiceSearch")?.value.trim().toLowerCase() || "";
    const cat = document.getElementById("adminServiceCategoryFilter")?.value || "";
    const status = document.getElementById("adminServiceStatusFilter")?.value || "";

    if (search) {
      services = services.filter(s =>
        (s.name_en && s.name_en.toLowerCase().includes(search)) ||
        (s.name_mr && s.name_mr.includes(search)) ||
        (s.service_code && s.service_code.toLowerCase().includes(search)) ||
        (s.category && s.category.toLowerCase().includes(search))
      );
    }
    if (cat) {
      services = services.filter(s => s.category === cat);
    }
    if (status === "active") {
      services = services.filter(s => s.is_active);
    } else if (status === "disabled") {
      services = services.filter(s => !s.is_active);
    }

    // Stable sort strictly by display_order in ascending order
    services.sort((a, b) => {
      const orderA = Number(a.display_order) || 0;
      const orderB = Number(b.display_order) || 0;
      if (orderA !== orderB) return orderA - orderB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    if (services.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = services.map((s, idx) => {
      const sJson = encodeURIComponent(JSON.stringify(s));
      const badgeType = s.badge_type || "counter";
      const badgeText = s.service_badge_text || "Standard";
      const isActive = !!s.is_active;

      return `
        <tr>
          <td style="text-align:center; white-space:nowrap;">
            <div class="service-order-cell">
              <span class="service-order-pill">#${s.display_order || 1}</span>
              <div class="service-order-actions">
                <button type="button" class="btn-order-btn" onclick="window.moveAdminService(${s.id}, 'up')" ${idx === 0 ? 'disabled' : ''} title="Move Up (Display earlier)" aria-label="Move Up">▲</button>
                <button type="button" class="btn-order-btn" onclick="window.moveAdminService(${s.id}, 'down')" ${idx === services.length - 1 ? 'disabled' : ''} title="Move Down (Display later)" aria-label="Move Down">▼</button>
              </div>
            </div>
          </td>
          <td style="font-size:1.3rem; text-align:center;">${escapeHtml(s.icon || "🏛️")}</td>
          <td>
            <div style="font-weight:600; color:var(--text-main);">${escapeHtml(s.name_en || "")}</div>
            <div style="font-size:0.84rem; color:var(--text-muted);">${escapeHtml(s.name_mr || "")}</div>
            <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${escapeHtml(s.service_code || "")}</div>
          </td>
          <td><span class="source-type-pill" style="font-size:0.78rem;">${escapeHtml(s.category || "General")}</span></td>
          <td><span class="service-badge-pill service-badge-${escapeHtml(badgeType)}" style="font-size:0.75rem;">${escapeHtml(badgeText)}</span></td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(s.action_target || "None")}</td>
          <td>
            <button type="button" class="btn btn-sm ${isActive ? 'btn-outline-success' : 'btn-outline-secondary'}" 
                    style="font-size:0.75rem; padding: 3px 8px;"
                    onclick="window.toggleAdminService(${s.id}, ${isActive})">
              ${isActive ? '✓ Active' : '✕ Disabled'}
            </button>
          </td>
          <td style="text-align: center;">
            <div class="action-btn-group" style="display:inline-flex; gap:6px;">
              <button type="button" class="btn btn-sm btn-outline-primary" style="padding:4px 8px; font-size:0.78rem;" onclick="window.editAdminService('${sJson}')" title="Edit Service">
                Edit
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" style="padding:4px 8px; font-size:0.78rem;" onclick="window.deleteAdminService(${s.id}, '${escapeHtml(s.name_en || '')}')" title="Delete Service">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("loadAdminServicesTable error:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="color:#ef4444; text-align:center; padding: 24px;">Failed to load services: ${escapeHtml(err.message)}</td></tr>`;
  }
}

window.moveAdminService = async function(serviceId, direction) {
  try {
    await api.moveAdminService(serviceId, direction);
    showToast(`Service order updated.`, "success");
    await loadAdminServicesTable();
    await renderHomeServices();
  } catch (err) {
    console.error("moveAdminService error:", err);
    showToast("Failed to move service: " + err.message, "error");
  }
};

window.editAdminService = function(serviceJson) {
  const s = typeof serviceJson === "string" ? JSON.parse(decodeURIComponent(serviceJson)) : serviceJson;
  const modal = document.getElementById("adminServiceModal");
  if (!modal) return;

  document.getElementById("serviceEditId").value = s.id;
  document.getElementById("serviceCode").value = s.service_code || "";
  document.getElementById("serviceCode").readOnly = true;
  document.getElementById("serviceNameEn").value = s.name_en || "";
  document.getElementById("serviceNameMr").value = s.name_mr || "";
  document.getElementById("serviceCategory").value = s.category || "Civic Utilities";
  document.getElementById("serviceIcon").value = s.icon || "🏛️";
  document.getElementById("serviceDisplayOrder").value = s.display_order || 1;
  document.getElementById("serviceIsActive").value = s.is_active ? "1" : "0";
  document.getElementById("serviceBadgeText").value = s.service_badge_text || "";
  document.getElementById("serviceBadgeType").value = s.badge_type || "counter";
  document.getElementById("serviceActionTarget").value = s.action_target || "counter_info";
  document.getElementById("serviceDescEn").value = s.desc_en || "";
  document.getElementById("serviceDescMr").value = s.desc_mr || "";
  document.getElementById("serviceEligibility").value = s.eligibility_instructions || "";
  document.getElementById("serviceDocuments").value = s.required_documents || "";
  document.getElementById("serviceContactDept").value = s.contact_department || "";

  document.getElementById("serviceModalTitle").textContent = `Edit Service: ${s.name_en}`;

  const pIcon = document.getElementById("previewIcon");
  const pTitle = document.getElementById("previewTitle");
  const pDesc = document.getElementById("previewDesc");
  const pBadge = document.getElementById("previewBadge");
  if (pIcon) pIcon.textContent = s.icon || "🏛️";
  if (pTitle) pTitle.textContent = s.name_en || "Service Title";
  if (pDesc) pDesc.textContent = s.desc_en || "";
  if (pBadge) {
    pBadge.textContent = s.service_badge_text || "Office Counter";
    pBadge.className = `service-badge-pill service-badge-${s.badge_type || 'counter'}`;
  }

  modal.hidden = false;
};

window.toggleAdminService = async function(serviceId, currentStatus) {
  const newStatus = !currentStatus;
  try {
    await api.toggleAdminServiceStatus(serviceId, newStatus);
    showToast(`Service ${newStatus ? 'enabled' : 'disabled'} successfully.`, "success");
    await loadAdminServicesTable();
    await renderHomeServices();
  } catch (err) {
    console.error("toggleAdminService error:", err);
    showToast("Failed to update status: " + err.message, "error");
  }
};

window.deleteAdminService = async function(serviceId, serviceName) {
  const isMr = getLanguage() === "mr";
  const promptMsg = isMr
    ? `तुम्हाला '${serviceName}' ही सेवा नक्की हटवायची आहे का?\n\nही प्रशासकीय कृती ऑडिट लॉगमध्ये नोंदवली जाईल.`
    : `Are you sure you want to delete service "${serviceName}"?\n\nThis administrative change will be logged in the audit trail.`;

  if (confirm(promptMsg)) {
    try {
      await api.deleteAdminService(serviceId);
      showToast(`Service "${serviceName}" deleted successfully.`, "success");
      await loadAdminServicesTable();
      await renderHomeServices();
    } catch (err) {
      console.error("deleteAdminService error:", err);
      showToast("Failed to delete service: " + err.message, "error");
    }
  }
};

export async function renderHomeServices() {
  const container = document.getElementById("homeServicesGrid");
  if (!container) return;

  try {
    const res = await api.getPublicServices();
    let services = (res && res.services) ? res.services : (Array.isArray(res) ? res : []);
    if (!services || services.length === 0) return;

    // Strict ascending sort by display_order
    services.sort((a, b) => {
      const orderA = Number(a.display_order) || 0;
      const orderB = Number(b.display_order) || 0;
      if (orderA !== orderB) return orderA - orderB;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    const isMr = getLanguage() === "mr";

    container.innerHTML = services.map(s => {
      const name = (isMr && s.name_mr) ? s.name_mr : (s.name_en || "");
      const desc = (isMr && s.desc_mr) ? s.desc_mr : (s.desc_en || "");
      const icon = s.icon || "🏛️";
      const badgeText = s.service_badge_text || (isMr ? "नागरी सेवा" : "Civic Utility");
      const badgeType = s.badge_type || "counter";
      const target = s.action_target || "storage";

      let btnText = isMr ? "माहिती व अर्ज →" : "Access Service →";
      if (target === "storage") btnText = isMr ? "पाणी साठा पहा →" : "View Water Levels →";
      else if (target === "bills") btnText = isMr ? "पाणी बिले तपासा →" : "Check Bills →";
      else if (target === "taxes") btnText = isMr ? "कर माहिती पहा →" : "View Tax Details →";
      else if (target === "schedule") btnText = isMr ? "वेळापत्रक पहा →" : "View Timetable →";
      else if (target === "report") btnText = isMr ? "तक्रार नोंदवा →" : "Report Problem →";
      else if (target === "complaints") btnText = isMr ? "तक्रार निवारण →" : "Grievance Portal →";
      else if (target === "citizen") btnText = isMr ? "नागरिक पोर्टल →" : "Citizen Portal →";
      else if (target === "counter_info") btnText = isMr ? "कागदपत्रे व प्रक्रिया →" : "Service Guidance →";

      return `
        <div class="service-card" data-service-code="${escapeHtml(s.service_code || '')}">
          <div>
            <div class="service-card-top">
              <div class="service-icon-box">${escapeHtml(icon)}</div>
              <span class="service-badge-pill service-badge-${escapeHtml(badgeType)}">${escapeHtml(badgeText)}</span>
            </div>
            <h3 class="service-title">${escapeHtml(name)}</h3>
            <p class="service-desc">${escapeHtml(desc)}</p>
          </div>
          <button type="button" class="service-btn" data-target="${escapeHtml(target)}" data-id="${s.id}">${btnText}</button>
        </div>
      `;
    }).join("");

    container.querySelectorAll(".service-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        const sId = btn.getAttribute("data-id");
        handleHomeServiceClick(target, sId, services);
      });
    });
  } catch (err) {
    console.warn("renderHomeServices error:", err);
  }
}

function handleHomeServiceClick(target, serviceId, services) {
  if (target === "storage" || target === "schedule" || target === "report") {
    switchPage(target);
  } else if (target === "citizen") {
    switchPage("citizen");
  } else if (target === "bills" || target === "taxes" || target === "complaints") {
    switchPage("citizen");
    const tBtn = document.querySelector(`.portal-subnav-tab[data-cit-tab="${target}"]`);
    if (tBtn) tBtn.click();
  } else {
    const s = services.find(x => String(x.id) === String(serviceId));
    if (s) showServiceDetailsModal(s);
  }
}

function showServiceDetailsModal(s) {
  const isMr = getLanguage() === "mr";
  const name = (isMr && s.name_mr) ? s.name_mr : (s.name_en || "Gram Panchayat Service");
  const desc = (isMr && s.desc_mr) ? s.desc_mr : (s.desc_en || "");
  const eligibility = s.eligibility_instructions || (isMr ? "ग्रामपंचायतीच्या अधिकृत कार्यालयात प्रत्यक्ष संपर्क साधा." : "Please contact the Gram Panchayat office for standard eligibility.");
  const docs = s.required_documents || (isMr ? "ओळख पुरावा (आधार कार्ड), रहिवासी दाखला, कर पावती." : "Identity Proof (Aadhaar), Residence Certificate, Tax Receipt.");
  const contact = s.contact_department || (isMr ? "ग्रामपंचायत कार्यालय / ग्रामसेवक कक्ष" : "Gram Panchayat Office / Gram Sevak Section");

  let infoModal = document.getElementById("publicServiceInfoModal");
  if (!infoModal) {
    infoModal = document.createElement("div");
    infoModal.id = "publicServiceInfoModal";
    infoModal.className = "modal-backdrop";
    infoModal.role = "dialog";
    infoModal.innerHTML = `
      <div class="modal-dialog" style="max-width:580px;">
        <div class="modal-header">
          <h3 id="infoModalTitle"></h3>
          <button class="modal-close-btn" id="btnCloseInfoModal">&times;</button>
        </div>
        <div class="modal-body" id="infoModalBody" style="line-height:1.6;"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btnDismissInfoModal">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(infoModal);
    document.getElementById("btnCloseInfoModal").onclick = () => infoModal.hidden = true;
    document.getElementById("btnDismissInfoModal").onclick = () => infoModal.hidden = true;
  }

  document.getElementById("infoModalTitle").innerHTML = `${escapeHtml(s.icon || "🏛️")} ${escapeHtml(name)}`;
  document.getElementById("infoModalBody").innerHTML = `
    <div style="margin-bottom:14px; color:var(--text-main); font-size:0.95rem;">${escapeHtml(desc)}</div>
    <div style="background:var(--bg-surface-alt, #f8fafc); border:1px solid var(--border-color, #e2e8f0); border-radius:8px; padding:12px 14px; margin-bottom:12px;">
      <div style="font-weight:700; color:var(--primary, #0284c7); font-size:0.85rem; text-transform:uppercase; margin-bottom:4px;">
        ${isMr ? 'पात्रता आणि प्रक्रिया' : 'Eligibility & Application Process'}
      </div>
      <div style="font-size:0.88rem; color:var(--text-muted);">${escapeHtml(eligibility)}</div>
    </div>
    <div style="background:var(--bg-surface-alt, #f8fafc); border:1px solid var(--border-color, #e2e8f0); border-radius:8px; padding:12px 14px; margin-bottom:12px;">
      <div style="font-weight:700; color:var(--primary, #0284c7); font-size:0.85rem; text-transform:uppercase; margin-bottom:4px;">
        ${isMr ? 'आवश्यक कागदपत्रे' : 'Required Documents'}
      </div>
      <div style="font-size:0.88rem; color:var(--text-muted);">${escapeHtml(docs)}</div>
    </div>
    <div style="font-size:0.84rem; color:var(--text-muted); font-weight:600;">
      ${isMr ? 'संपर्क विभाग:' : 'Responsible Official / Section:'} <span style="color:var(--text-main);">${escapeHtml(contact)}</span>
    </div>
  `;
  infoModal.hidden = false;
}

// Global window actions for Admin tables
window.editAdminCitizen = function(citizenJson) {
  const c = typeof citizenJson === "string" ? JSON.parse(decodeURIComponent(citizenJson)) : citizenJson;
  const modal = document.getElementById("adminEditCitizenModal");
  if (!modal) return;

  const citId = c.id || c.citizenId || "";
  const loginId = c.login_id || c.citizenId || c.id || "";
  const fullName = c.full_name || c.fullName || "";
  const phone = c.phone || "";
  const propNo = c.property_no || c.propertyNo || "";
  const ward = c.ward_area || c.ward || "Ward 1 - Patel Falia (North)";
  const meter = c.meter_no || c.meterNo || "";
  const status = c.status || "Active";

  document.getElementById("editCitizenDbId").value = citId;
  document.getElementById("editCitLoginId").value = loginId;
  document.getElementById("editCitFullName").value = fullName;
  document.getElementById("editCitPhone").value = phone;
  document.getElementById("editCitPropertyNo").value = propNo;
  document.getElementById("editCitWard").value = ward;
  document.getElementById("editCitMeterNo").value = meter;
  document.getElementById("editCitStatus").value = status;

  modal.hidden = false;
};

window.toggleCitizenStatus = async function(citizenId, currentStatus) {
  const isCurrentlyActive = String(currentStatus || "").toLowerCase() === "active";
  const newStatus = isCurrentlyActive ? "Inactive" : "Active";
  if (confirm(`Are you sure you want to change status of ${citizenId} to '${newStatus}'?`)) {
    try {
      await api.toggleAdminCitizenStatus(citizenId, newStatus);
      showToast(`Citizen ${citizenId} status updated to ${newStatus}.`, "success");
      renderAdminCitizensTable();
    } catch (err) {
      showToast("Status update failed: " + err.message, "error");
    }
  }
};

window.deleteWaterSource = async function(sourceId, sourceName) {
  if (confirm(`Are you sure you want to delete water source '${sourceName}'? This cannot be undone.`)) {
    try {
      await api.deleteWaterSource(sourceId);
      appState.sources = appState.sources.filter(s => s.id !== sourceId);
      showToast(`Water source '${sourceName}' deleted successfully.`, "success");
      renderAdminSourcesTable();
      renderHomeView();
      renderStorageView();
      renderAdminStats();
    } catch (err) {
      showToast("Failed to delete source: " + err.message, "error");
    }
  }
};

window.openAdminComplaintResponseModal = function(complaintJson) {
  const c = typeof complaintJson === "string" ? JSON.parse(decodeURIComponent(complaintJson)) : complaintJson;
  const modal = document.getElementById("adminComplaintResponseModal");
  if (!modal) return;

  document.getElementById("respComplaintId").value = c.id;
  document.getElementById("respTicketMeta").textContent = `Ticket #${c.id.slice(-6)} • Citizen: ${c.name || "Resident"} (${c.area || "Ward"})`;
  document.getElementById("respTicketTitle").textContent = c.problemType;
  document.getElementById("respTicketDesc").textContent = c.description;
  document.getElementById("respStatusSelect").value = c.status || "Pending";
  document.getElementById("respAdminText").value = c.adminResponse || "";

  modal.hidden = false;
};

window.markTaxPaidAdmin = async function(taxId, title) {
  if (confirm(`Mark tax charge '${title}' as Paid?`)) {
    try {
      await api.markAdminTaxPaid(taxId);
      showToast(`Tax '${title}' marked as Paid!`, "success");
      await renderAdminTaxesTable();
      await renderAdminStats();
    } catch (err) {
      showToast("Failed to update tax: " + err.message, "error");
    }
  }
};

window.editAdminProperty = async function(pJson) {
  const p = typeof pJson === "string" ? JSON.parse(decodeURIComponent(pJson)) : pJson;
  const modal = document.getElementById("adminEditPropertyModal");
  if (!modal) return;

  await populatePropertyCitizensSelect("editPropOwnerCitizen");

  document.getElementById("editPropId").value = p.id;
  document.getElementById("editPropNumber").value = p.property_number || "";
  document.getElementById("editPropType").value = p.property_type || "Residential";
  document.getElementById("editPropOwnerCitizen").value = p.owner_citizen_id || "";
  document.getElementById("editPropOwnerName").value = p.owner_name || "";
  document.getElementById("editPropWard").value = p.ward_area || "Ward 1 - Patel Falia (North)";
  document.getElementById("editPropMeterNo").value = p.water_meter_no || "";
  document.getElementById("editPropAddress").value = p.address || "";
  document.getElementById("editPropConnType").value = p.connection_type || "Domestic Metered Tap";
  document.getElementById("editPropAnnualTax").value = p.annual_tax ? Number(p.annual_tax).toFixed(2) : "250.00";

  modal.hidden = false;
};

window.deleteAdminProperty = async function(propId, propNumber) {
  if (confirm(`Are you sure you want to delete property '${propNumber}'?\n\nGram Panchayat records warning: This action cannot be undone.`)) {
    try {
      await api.deleteProperty(propId);
      showToast(`Property '${propNumber}' deleted successfully.`, "success");
      await renderAdminPropertiesTable();
      await renderAdminStats();
    } catch (err) {
      console.error("Delete property error:", err);
      showToast("Cannot delete property: " + err.message, "error");
    }
  }
};

window.deleteAdminCitizen = async function(citId, fullName) {
  if (confirm(`Are you sure you want to permanently delete citizen account '${fullName}' (${citId})?\n\nWarning: Check that all water bills and dues are settled first.`)) {
    try {
      await api.deleteCitizen(citId);
      showToast(`Citizen '${fullName}' deleted successfully.`, "success");
      await renderAdminCitizensTable();
      await renderAdminStats();
    } catch (err) {
      console.error("Delete citizen error:", err);
      showToast("Cannot delete citizen: " + err.message, "error");
    }
  }
};

async function populatePropertyCitizensSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const citizens = await api.getAdminCitizens();
    select.innerHTML = '<option value="">-- No linked citizen (Select or Leave Empty) --</option>' +
      citizens.map(c => {
        const citId = c.id || c.citizenId || c.login_id;
        const name = c.full_name || c.fullName || "Citizen";
        const prop = c.property_no || c.propertyNo || "H-?";
        return `<option value="${citId}">${escapeHtml(name)} (${citId} - ${escapeHtml(prop)})</option>`;
      }).join("");
  } catch (err) {
    console.warn("populatePropertyCitizensSelect error:", err);
  }
}

async function populateCitizenSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const citizens = await api.getAdminCitizens();
    select.innerHTML = '<option value="">-- Choose Resident --</option>' + 
      citizens.map(c => {
        const citId = c.id || c.citizenId || c.login_id;
        const name = c.full_name || c.fullName || "Citizen";
        const prop = c.property_no || c.propertyNo || "H-?";
        return `<option value="${citId}">${escapeHtml(name)} (${citId} - ${escapeHtml(prop)})</option>`;
      }).join("");
  } catch (err) {
    console.warn("Failed to populate citizen select:", err);
  }
}

async function populateUnpaidBillsSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const bills = await api.getAdminBills();
    const unpaid = (bills || []).filter(b => b.status !== "Paid");
    if (unpaid.length === 0) {
      select.innerHTML = '<option value="">-- No Outstanding Bills Available --</option>';
    } else {
      select.innerHTML = '<option value="">-- Choose Unpaid Bill --</option>' +
        unpaid.map(b => {
          const billNo = b.bill_number || b.billNumber || b.id;
          const name = b.full_name || b.fullName || "Citizen";
          const period = b.billing_period || b.billingPeriod || "Bill";
          const amt = Number(b.amount || 0);
          return `<option value="${b.id}">#${billNo} - ${escapeHtml(name)} (₹${amt.toFixed(2)} for ${escapeHtml(period)})</option>`;
        }).join("");
    }
  } catch (err) {
    console.warn("Failed to populate bills select:", err);
  }
}

// Populates the Logged-in Administrator Profile & Badge Settings Form
export function populateAdminProfileForm() {
  const user = api.getCurrentUser();
  if (!user) return;
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };

  const loginId = user.loginId || user.login_id || user.username || "admin";
  const fullName = user.fullName || user.full_name || "";
  const roleTitle = user.roleTitle || user.role_title || (user.role === "admin" ? "Administrator" : "Staff");
  const phone = user.phone || "";
  const email = user.email || "";

  setVal("adminProfileLoginId", loginId);
  setVal("adminProfileFullName", fullName);
  setVal("adminProfileRoleTitle", roleTitle);
  setVal("adminProfilePhone", phone);
  setVal("adminProfileEmail", email);

  const prevAvatar = document.getElementById("prevBadgeAvatar");
  const prevName = document.getElementById("prevBadgeName");
  const prevRole = document.getElementById("prevBadgeRole");

  if (prevName) prevName.textContent = fullName || "Admin";
  if (prevRole) prevRole.textContent = roleTitle || "Staff";
  if (prevAvatar) prevAvatar.textContent = (fullName || "A")[0].toUpperCase();
}
window.populateAdminProfileForm = populateAdminProfileForm;

// ==========================================================
// 14. ADMIN RENDERING SUB-ROUTINES
// ==========================================================
async function renderAdminView() {
  populateAdminProfileForm();
  const vi = appState.villageInfo || {};
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  };

  setVal("adminVillageName", vi.village_name || vi.villageName || "");
  setVal("adminVillageNameMr", vi.village_name_mr || vi.villageNameMr || "");
  setVal("adminTaluka", vi.taluka || "");
  setVal("adminDistrict", vi.district || "");
  setVal("adminState", vi.state || "Maharashtra");
  setVal("adminSarpanchName", vi.sarpanch_name || "Shri. Vitthalrao Deshmukh");
  setVal("adminSarpanchPhoto", vi.sarpanch_photo || "");
  setVal("adminGramSevakName", vi.gram_sevak_name || "Shri. Ramesh Patil");
  setVal("adminGramSevakPhoto", vi.gram_sevak_photo || "");
  setVal("adminSecretaryName", vi.secretary_name || "Smt. Sunita Kulkarni");
  setVal("adminSecretaryPhoto", vi.secretary_photo || "");
  setVal("adminOfficePhone", vi.office_phone || vi.helpline || "02489-234567 / 1800-120-JAL");
  setVal("adminOfficeEmail", vi.office_email || "grampanchayat.sundarpur@gov.in");
  setVal("adminOfficeHours", vi.office_hours || "Mon – Sat: 10:00 AM – 05:30 PM");
  setVal("adminOfficeAddress", vi.office_address || "Gram Panchayat Karyalaya, Main Chowk, Sundarpur");
  setVal("adminIntroText", vi.intro_text || t("gp_intro_default"));
  setVal("adminIntroTextMr", vi.intro_text_mr || t("gp_intro_default"));
  setVal("adminDroughtStatus", vi.drought_status || vi.overallStatus || "Low");
  setVal("adminNoticeText", vi.alert_banner_text || vi.noticeText || "");

  await Promise.all([
    renderAdminStats(),
    loadAdminExecutiveKPIs(),
    renderAdminCitizensTable(),
    renderAdminPropertiesTable(),
    loadAdminServicesTable(),
    renderAdminTanks(),
    renderAdminSourcesTable(),
    renderAdminBills(),
    renderAdminTaxesTable(),
    renderAdminScheduleTable(),
    renderAdminComplaintsTable(),
    loadAdminApplications(),
    loadAdminRtiRegister(),
    loadAdminTasks(),
    loadAdminNotices(),
    renderAdminReportsView()
  ]);
}

async function renderAdminStats() {
  try {
    const stats = await api.getAdminDashboardStats();
    if (!stats) return;

    const elCitizens = document.getElementById("admKpiCitizens");
    const elSources = document.getElementById("admKpiSources");
    const elCap = document.getElementById("admKpiTotalCapacity");
    const elBills = document.getElementById("admKpiOutstandingBills");
    const elBillsCount = document.getElementById("admKpiUnpaidBillsCount");
    const elRev = document.getElementById("admKpiRevenueCollected");
    const elComp = document.getElementById("admKpiTotalComplaints");
    const elPend = document.getElementById("admKpiPendingComplaints");

    const totalCitizens = stats.citizens?.total ?? stats.totalCitizens ?? 0;
    const totalSources = stats.waterSources?.total ?? stats.totalSources ?? 0;
    const totalCap = stats.waterSources?.totalCapacity ?? stats.totalStorageCapacityLiters ?? 0;
    const outBills = stats.billing?.totalOutstanding ?? stats.outstandingBillsAmount ?? 0;
    const unpaidCount = stats.billing?.unpaidCount ?? stats.unpaidBillsCount ?? 0;
    const totalRev = stats.billing?.totalRevenue ?? stats.totalRevenueCollected ?? 0;
    const totalComplaints = stats.complaints?.total ?? stats.totalComplaints ?? 0;
    const pendingComplaints = stats.complaints?.pending ?? stats.pendingComplaints ?? 0;

    if (elCitizens) elCitizens.textContent = String(totalCitizens);
    if (elSources) elSources.textContent = String(totalSources);
    if (elCap) elCap.textContent = `${Number(totalCap).toLocaleString()} L capacity`;
    if (elBills) elBills.textContent = `₹${Number(outBills).toFixed(2)}`;
    if (elBillsCount) elBillsCount.textContent = `${unpaidCount} unpaid bill${unpaidCount === 1 ? '' : 's'}`;
    if (elRev) elRev.textContent = `₹${Number(totalRev).toFixed(2)}`;
    if (elComp) elComp.textContent = String(totalComplaints);
    if (elPend) elPend.textContent = String(pendingComplaints);
  } catch (err) {
    console.warn("Could not load admin stats:", err);
  }
}

async function renderAdminCitizensTable(search = "", status = "", ward = "") {
  const tbody = document.getElementById("adminCitizensTableBody");
  if (!tbody) return;

  try {
    const citizens = await api.getAdminCitizens(search, status, ward);
    if (!citizens || citizens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_citizens", "No matching citizen records found.")}</td></tr>`;
      return;
    }

    tbody.innerHTML = citizens.map(c => {
      const cJson = encodeURIComponent(JSON.stringify(c));
      const isActive = String(c.status || "").toLowerCase() === "active";
      const citId = c.login_id || c.citizenId || c.id;
      const fName = c.full_name || c.fullName || "Resident";
      const propNo = c.property_no || c.propertyNo || "H-?";
      const wardName = c.ward_area || c.ward || "Village Ward";
      const phoneNo = c.phone || "N/A";
      const meter = c.meter_no || c.meterNo || "Unmetered";

      return `
        <tr>
          <td><strong style="color:#0284c7; font-family:monospace;">${escapeHtml(citId)}</strong></td>
          <td><strong>${escapeHtml(fName)}</strong></td>
          <td>${escapeHtml(propNo)}</td>
          <td>${escapeHtml(wardName)}</td>
          <td>${escapeHtml(phoneNo)}</td>
          <td>${escapeHtml(meter)}</td>
          <td>
            <span class="ticket-status-pill ${isActive ? 'ticket-status-resolved' : 'ticket-status-pending'}">
              ${escapeHtml(formatStatus(isActive ? 'Active' : 'Inactive'))}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.editAdminCitizen('${cJson}')">${t("btn_edit", "Edit")}</button>
              <button class="btn btn-secondary btn-sm" style="color:${isActive ? '#b91c1c' : '#16a34a'};" onclick="window.toggleCitizenStatus('${c.id || citId}', '${c.status}')">
                ${isActive ? t("btn_deactivate", "Deactivate") : t("btn_activate", "Activate")}
              </button>
              <button class="btn btn-secondary btn-sm" style="color:#dc2626;" onclick="window.deleteAdminCitizen('${c.id || citId}', '${escapeHtml(fName)}')">
                ${t("btn_delete", "Delete")}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("renderAdminCitizensTable error:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="color:#ef4444; text-align:center;">Failed to load citizens.</td></tr>`;
  }
}

async function renderAdminPropertiesTable(search = "", ward = "", type = "") {
  const tbody = document.getElementById("adminPropertiesTableBody");
  if (!tbody) return;

  try {
    const properties = await api.getAdminProperties(search);
    if (!properties || properties.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_properties", "No matching village properties found.")}</td></tr>`;
      return;
    }

    let filtered = properties;
    if (ward) {
      filtered = filtered.filter(p => (p.ward_area || "").toLowerCase().includes(ward.toLowerCase()));
    }
    if (type) {
      filtered = filtered.filter(p => (p.property_type || "").toLowerCase() === type.toLowerCase());
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_properties", "No properties match the selected filters.")}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const pJson = encodeURIComponent(JSON.stringify(p));
      const propNo = p.property_number || "N/A";
      const owner = p.linked_citizen_name || p.owner_name || (getLanguage() === "mr" ? "ग्रामपंचायत मालमत्ता" : "Gram Panchayat Property");
      const citTag = p.owner_citizen_id ? `<span style="font-size:0.75rem; color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px; margin-left:4px;">${escapeHtml(p.owner_citizen_id)}</span>` : "";
      const wardArea = p.ward_area || "Ward 1";
      const propType = p.property_type || "Residential";
      const meterNo = p.water_meter_no || "Unmetered";
      const conn = p.connection_type || "Domestic Metered Tap";
      const annualTax = Number(p.annual_tax || 0);
      const waterDues = Number(p.unpaid_water_dues || 0);
      const taxDues = Number(p.unpaid_tax_dues || 0);
      const totalDues = waterDues + taxDues;

      const duesBadge = totalDues > 0
        ? `<span style="color:#b91c1c; font-weight:700; background:#fef2f2; padding:3px 8px; border-radius:4px; border:1px solid #fecaca; font-size:0.85rem;">₹${totalDues.toFixed(2)} ${t("prop_due", "Due")}</span>`
        : `<span style="color:#16a34a; font-weight:600; background:#f0fdf4; padding:3px 8px; border-radius:4px; font-size:0.85rem;">✓ ${t("prop_clear", "Clear")}</span>`;

      return `
        <tr>
          <td><strong style="color:#0f172a; font-family:monospace; font-size:0.95rem;">${escapeHtml(propNo)}</strong></td>
          <td><strong>${escapeHtml(owner)}</strong> ${citTag}</td>
          <td>${escapeHtml(wardArea)}<br><small style="color:#64748b;">${escapeHtml(p.address || "")}</small></td>
          <td><span class="source-type-pill" style="font-size:0.8rem;">${escapeHtml(propType)}</span></td>
          <td><strong>${escapeHtml(meterNo)}</strong><br><small style="color:#64748b;">${escapeHtml(conn)}</small></td>
          <td>₹${annualTax.toFixed(2)}</td>
          <td>${duesBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="window.editAdminProperty('${pJson}')">${t("btn_edit", "Edit")}</button>
              <button class="btn btn-secondary btn-sm" style="color:#dc2626;" onclick="window.deleteAdminProperty('${p.id}', '${escapeHtml(propNo)}')">${t("btn_delete", "Delete")}</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("renderAdminPropertiesTable error:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="color:#ef4444; text-align:center; padding:20px;">Failed to load properties: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderAdminSourcesTable() {
  const tbody = document.getElementById("adminSourcesTableBody");
  if (!tbody) return;

  tbody.innerHTML = appState.sources.map(source => {
    const availableLiters = Math.round((Number(source.totalCapacity) * Number(source.currentLevelPercent)) / 100);
    const statusText = source.currentLevelPercent <= 25 ? 'Critical' : source.currentLevelPercent <= 50 ? 'Low' : 'Normal';

    return `
      <tr>
        <td><strong>${escapeHtml(source.name)}</strong></td>
        <td><span class="source-type-pill">${escapeHtml(source.typeLabel || source.type)}</span></td>
        <td>${Number(source.totalCapacity).toLocaleString()} L</td>
        <td>
          <div class="inline-slider-group">
            <input type="range" min="0" max="100" value="${source.currentLevelPercent}" 
              oninput="window.handleSourceLevelChange('${source.id}', this.value)">
            <span class="inline-slider-val" id="src-slider-val-${source.id}">${source.currentLevelPercent}%</span>
          </div>
        </td>
        <td id="src-liters-val-${source.id}"><strong>${availableLiters.toLocaleString()} L</strong></td>
        <td>
          <span class="status-tag ${source.currentLevelPercent <= 25 ? 'status-critical' : source.currentLevelPercent <= 50 ? 'status-low' : 'status-normal'}" id="src-status-tag-${source.id}">
            ${escapeHtml(formatStatus(statusText))}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" id="btn-save-src-${source.id}" onclick="window.saveSourceQuick('${source.id}')">${t("btn_save", "Save")}</button>
            <button class="btn btn-secondary btn-sm" style="color:#b91c1c;" onclick="window.deleteWaterSource('${source.id}', '${escapeHtml(source.name)}')">${t("btn_delete", "Delete")}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Global handler for slider adjustment
window.handleSourceLevelChange = function(sourceId, newPercent) {
  const source = appState.sources.find(s => s.id === sourceId);
  if (!source) return;

  newPercent = parseInt(newPercent, 10);
  source.currentLevelPercent = newPercent;
  
  const valSpan = document.getElementById(`src-slider-val-${sourceId}`);
  if (valSpan) valSpan.textContent = `${newPercent}%`;

  const litersTd = document.getElementById(`src-liters-val-${sourceId}`);
  const avail = Math.round((Number(source.totalCapacity) * newPercent) / 100);
  if (litersTd) litersTd.innerHTML = `<strong>${avail.toLocaleString()} L</strong>`;

  const tag = document.getElementById(`src-status-tag-${sourceId}`);
  if (tag) {
    tag.className = `status-tag ${newPercent <= 25 ? 'status-critical' : newPercent <= 50 ? 'status-low' : 'status-normal'}`;
    tag.textContent = newPercent <= 25 ? 'Critical' : newPercent <= 50 ? 'Low' : 'Normal';
  }

  renderHomeView();
  renderStorageView();
};

window.saveSourceQuick = async function(sourceId) {
  const source = appState.sources.find(s => s.id === sourceId);
  if (!source) return;

  const btn = document.getElementById(`btn-save-src-${sourceId}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-inline spinner-dark"></span> Saving...`;
  }

  const updates = {
    currentLevelPercent: source.currentLevelPercent,
    lastInspected: "Today " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  try {
    await api.updateWaterSource(sourceId, updates);
    showToast(`Water level for ${source.name} updated successfully!`, "success");
    source.lastInspected = updates.lastInspected;
    renderAllViews();
  } catch (err) {
    console.error("Error updating source:", err);
    showToast("Failed to update water source: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Save";
    }
  }
};

// ==========================================================
// ADMIN BILLS & PAYMENTS MODULE
// ==========================================================
export async function renderAdminBills() {
  const isMr = getLanguage() === "mr";
  const billsTbody = document.getElementById("adminBillsTableBody");
  const paymentsTbody = document.getElementById("adminPaymentsTableBody");

  if (billsTbody && (!billsTbody.children.length || billsTbody.innerHTML.includes("Failed to load"))) {
    billsTbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;"><span class="spinner-inline spinner-dark"></span> ${isMr ? "डेटाबेसमधून पाणी बिले लोड होत आहेत..." : "Loading water bills from database..."}</td></tr>`;
  }
  if (paymentsTbody && (!paymentsTbody.children.length || paymentsTbody.innerHTML.includes("Failed to load"))) {
    paymentsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;"><span class="spinner-inline spinner-dark"></span> ${isMr ? "पावती नोंदी लोड होत आहेत..." : "Loading payment records..."}</td></tr>`;
  }

  try {
    const results = await Promise.allSettled([
      renderAdminBillsTable(),
      renderAdminPaymentsTable()
    ]);
    return results;
  } catch (err) {
    console.error("renderAdminBills error:", err);
  }
}
window.renderAdminBills = renderAdminBills;

async function renderAdminBillsTable() {
  const tbody = document.getElementById("adminBillsTableBody");
  if (!tbody) return;

  const isMr = getLanguage() === "mr";
  if (!tbody.children.length || tbody.innerHTML.includes("Failed to load")) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;"><span class="spinner-inline spinner-dark"></span> ${isMr ? "डेटाबेसमधून पाणी बिले लोड होत आहेत..." : "Loading water bills from database..."}</td></tr>`;
  }

  try {
    const bills = await api.getAdminBills();
    if (!bills || bills.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_bills", "No water bills generated yet.")}</td></tr>`;
      return;
    }

    tbody.innerHTML = bills.map(b => {
      const isPaid = b.status === "Paid";
      const billNo = b.bill_number || b.billNumber || b.id;
      const fName = b.full_name || b.fullName || "Citizen";
      const citId = b.citizen_id || b.citizenId || "";
      const propNo = b.property_no || b.propertyNo || "H-?";
      const period = b.billing_period || b.billingPeriod || "Water Charge";
      const amt = Number(b.amount || 0);
      const paidAmt = Number(b.paid_amount || b.paidAmount || 0);
      const due = b.due_date || b.dueDate;

      return `
        <tr>
          <td><strong style="color:#0284c7;">#${escapeHtml(billNo)}</strong></td>
          <td>
            <strong>${escapeHtml(fName)}</strong><br>
            <small style="color:#64748b; font-family:monospace;">${escapeHtml(citId)} • ${escapeHtml(propNo)}</small>
          </td>
          <td>${escapeHtml(period)}</td>
          <td><strong>₹${amt.toFixed(2)}</strong></td>
          <td>₹${paidAmt.toFixed(2)}</td>
          <td>${escapeHtml(due ? String(due).slice(0, 10) : "N/A")}</td>
          <td>
            <span class="ticket-status-pill ${isPaid ? 'ticket-status-resolved' : 'ticket-status-pending'}">
              ${escapeHtml(formatStatus(b.status))}
            </span>
          </td>
          <td>
            ${isPaid 
              ? `<span style="color:#0f766e; font-weight:700; font-size:0.85rem;">✓ ${t("status_paid", "Paid")}</span>`
              : `<button class="btn btn-secondary btn-sm" onclick="window.quickPayBillAdmin('${b.id}', ${amt})">${t("adm_record_pay", "Record Pay")}</button>`
            }
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("renderAdminBillsTable error:", err);
    tbody.innerHTML = `<tr><td colspan="8" style="color:#ef4444; text-align:center; padding:20px;">${isMr ? "पाणी बिले लोड करण्यात त्रुटी आली." : "Failed to load bills."}</td></tr>`;
  }
}

window.quickPayBillAdmin = function(billId, amount) {
  const modal = document.getElementById("adminRecordPaymentModal");
  if (!modal) return;
  modal.hidden = false;
  populateUnpaidBillsSelect("payBillSelect").then(() => {
    const select = document.getElementById("payBillSelect");
    if (select) select.value = billId;
    const amtInput = document.getElementById("payAmount");
    if (amtInput) amtInput.value = amount;
  });
};

async function renderAdminPaymentsTable() {
  const tbody = document.getElementById("adminPaymentsTableBody");
  if (!tbody) return;

  const isMr = getLanguage() === "mr";
  if (!tbody.children.length || tbody.innerHTML.includes("Failed to load")) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;"><span class="spinner-inline spinner-dark"></span> ${isMr ? "पावती नोंदी लोड होत आहेत..." : "Loading payment records..."}</td></tr>`;
  }

  try {
    const payments = await api.getAdminPayments();
    if (!payments || payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_payments", "No payment receipts recorded.")}</td></tr>`;
      return;
    }

    tbody.innerHTML = payments.map(p => {
      const recNo = p.receipt_no || p.receiptNumber || p.id;
      const billLabel = p.billing_period || p.billNumber || (p.bill_id ? `#${p.bill_id}` : "N/A");
      const fName = p.full_name || p.fullName || "Citizen";
      const citId = p.citizen_id || p.citizenId || "";
      const amt = Number(p.amount || 0);
      const pDate = p.payment_date || p.paymentDate;
      const pMode = p.payment_mode || p.paymentMethod || "UPI";
      const recorded = p.notes || p.recordedBy || t("adm_staff", "Admin Staff");

      return `
        <tr>
          <td><strong style="color:#0284c7;">#${escapeHtml(recNo)}</strong></td>
          <td>#${escapeHtml(billLabel)}</td>
          <td>
            <strong>${escapeHtml(fName)}</strong><br>
            <small style="color:#64748b; font-family:monospace;">${escapeHtml(citId)}</small>
          </td>
          <td><strong>₹${amt.toFixed(2)}</strong></td>
          <td>${escapeHtml(pDate ? String(pDate).slice(0, 10) : (getLanguage() === "mr" ? "नुकतेच" : "Recent"))}</td>
          <td><span class="source-type-pill">${escapeHtml(pMode)}</span></td>
          <td>${escapeHtml(recorded)}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("renderAdminPaymentsTable error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444; text-align:center; padding:20px;">${isMr ? "पावती नोंदी लोड करण्यात त्रुटी आली." : "Failed to load payments."}</td></tr>`;
  }
}

async function renderAdminTaxesTable() {
  const tbody = document.getElementById("adminTaxesTableBody");
  if (!tbody) return;

  try {
    const taxes = await api.getAdminTaxes();
    if (!taxes || taxes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_taxes", "No Panchayat taxes levied yet.")}</td></tr>`;
      return;
    }

    tbody.innerHTML = taxes.map(tItem => {
      const isPaid = tItem.status === "Paid";
      const fName = tItem.full_name || tItem.fullName || "Resident";
      const citId = tItem.citizen_id || tItem.citizenId || "";
      const propNo = tItem.property_no || tItem.propertyNo || "H-?";
      const title = tItem.charge_type || tItem.title || "Panchayat Cess";
      const cat = tItem.description || tItem.category || "Tax";
      const amt = Number(tItem.amount || 0);
      const due = tItem.due_date || tItem.dueDate;

      return `
        <tr>
          <td><strong>#${escapeHtml(tItem.id)}</strong></td>
          <td>
            <strong>${escapeHtml(fName)}</strong><br>
            <small style="color:#64748b; font-family:monospace;">${escapeHtml(citId)} • ${escapeHtml(propNo)}</small>
          </td>
          <td>
            <div style="font-weight:600;">${escapeHtml(title)}</div>
            <small class="source-type-pill">${escapeHtml(cat)}</small>
          </td>
          <td><strong>₹${amt.toFixed(2)}</strong></td>
          <td>${escapeHtml(due ? String(due).slice(0, 10) : "N/A")}</td>
          <td>
            <span class="ticket-status-pill ${isPaid ? 'ticket-status-resolved' : 'ticket-status-pending'}">
              ${escapeHtml(formatStatus(tItem.status))}
            </span>
          </td>
          <td>
            ${isPaid 
              ? `<span style="color:#0f766e; font-weight:700; font-size:0.85rem;">✓ ${t("status_cleared", "Cleared")}</span>`
              : `<button class="btn btn-secondary btn-sm" onclick="window.markTaxPaidAdmin('${tItem.id}', '${escapeHtml(title)}')">${t("adm_mark_paid", "Mark Paid")}</button>`
            }
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("renderAdminTaxesTable error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444; text-align:center;">Failed to load taxes.</td></tr>`;
  }
}

function renderAdminScheduleTable() {
  const tbody = document.getElementById("adminScheduleTableBody");
  if (!tbody) return;

  tbody.innerHTML = appState.schedules.map(item => {
    return `
      <tr>
        <td><strong>${escapeHtml(item.area)}</strong></td>
        <td>${escapeHtml(item.dateLabel || item.date)}</td>
        <td>${escapeHtml(item.timeSlot)}</td>
        <td>${escapeHtml(item.duration)}</td>
        <td>${escapeHtml(formatSupplyType(item.supplyType))}</td>
        <td>
          <select class="form-control" style="padding:4px 8px; font-size:0.85rem;" onchange="window.handleAdminScheduleStatusChange('${item.id}', this.value)">
            <option value="Upcoming" ${item.status === 'Upcoming' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'येणारा पुरवठा' : 'Upcoming'}</option>
            <option value="Active Now" ${item.status === 'Active Now' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'सध्या सुरू आहे' : 'Active Now'}</option>
            <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'पूर्ण झाले' : 'Completed'}</option>
            <option value="Tomorrow" ${item.status === 'Tomorrow' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'उद्या' : 'Tomorrow'}</option>
            <option value="Delayed" ${item.status === 'Delayed' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'विलंबित' : 'Delayed'}</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="window.editScheduleItem('${item.id}')">${t("btn_edit", "Edit")}</button>
            <button class="btn btn-secondary btn-sm" style="color:#b91c1c;" onclick="window.deleteScheduleItem('${item.id}')">${t("btn_delete", "Delete")}</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

window.handleAdminScheduleStatusChange = async function(schedId, newStatus) {
  const item = appState.schedules.find(s => s.id === schedId);
  if (!item) return;

  try {
    await api.updateDistributionSchedule(schedId, { status: newStatus });
    showToast(`Schedule status updated to '${newStatus}'!`, "success");
    item.status = newStatus;
    renderScheduleView();
    renderHomeView();
  } catch (err) {
    console.error("Error updating schedule status:", err);
    showToast("Failed to update status: " + err.message, "error");
  }
};

window.editScheduleItem = function(schedId) {
  const item = appState.schedules.find(s => s.id === schedId);
  if (!item) return;

  const modal = document.getElementById("scheduleModal");
  document.getElementById("scheduleModalTitle").textContent = getLanguage() === "mr" ? "पाणी वितरण वेळ बदला" : "Edit Distribution Slot";
  document.getElementById("editScheduleId").value = item.id;
  document.getElementById("schedArea").value = item.area;
  document.getElementById("schedDate").value = item.date || new Date().toISOString().split("T")[0];
  document.getElementById("schedSupplyType").value = item.supplyType || "Pipeline Tap";
  document.getElementById("schedTimeSlot").value = item.timeSlot;
  document.getElementById("schedDuration").value = item.duration;
  document.getElementById("schedStatus").value = item.status;
  document.getElementById("schedLineman").value = item.lineman || "";

  if (modal) modal.hidden = false;
};

window.deleteScheduleItem = async function(schedId) {
  const confirmMsg = getLanguage() === "mr" ? "तुम्हाला ही पाणी पुरवठा वेळ नक्की हटवायची आहे का?" : "Are you sure you want to delete this schedule slot?";
  if (confirm(confirmMsg)) {
    try {
      await api.deleteDistributionSchedule(schedId);
      showToast("Schedule slot deleted successfully.", "success");
      appState.schedules = appState.schedules.filter(s => s.id !== schedId);
      renderAllViews();
    } catch (err) {
      console.error("Error deleting schedule slot:", err);
      showToast("Failed to delete schedule: " + err.message, "error");
    }
  }
};

function renderAdminComplaintsTable() {
  const tbody = document.getElementById("adminComplaintsTableBody");
  if (!tbody) return;

  if (appState.complaints.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:20px;">${t("adm_no_complaints", "No complaints reported.")}</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.complaints.map(c => {
    const cJson = encodeURIComponent(JSON.stringify(c));
    return `
      <tr>
        <td>
          <strong>${escapeHtml(c.name)}</strong><br>
          <small style="color:#64748b;">${escapeHtml(c.phone)}</small>
        </td>
        <td>${escapeHtml(c.area)}</td>
        <td>
          <div style="font-weight:600;">${escapeHtml(c.problemType)}</div>
          <small style="color:#475569;">${escapeHtml((c.description || '').slice(0, 60))}${(c.description || '').length > 60 ? '...' : ''}</small>
        </td>
        <td>
          <span style="font-size:0.82rem; font-weight:700; color:${c.urgency === 'Critical' ? '#b91c1c' : '#475569'};">
            ${escapeHtml(formatUrgency(c.urgency || "Normal"))}
          </span>
        </td>
        <td><small style="color:#64748b;">${escapeHtml(c.timeAgo || (c.createdAt ? String(c.createdAt).slice(0, 10) : (getLanguage() === "mr" ? "नुकतेच" : "Recent")))}</small></td>
        <td>
          <select class="form-control" style="padding:4px 8px; font-size:0.85rem;" onchange="window.handleComplaintStatusChange('${c.id}', this.value)">
            <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'प्रलंबित' : 'Pending'}</option>
            <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'प्रगतीपथावर' : 'In Progress'}</option>
            <option value="Dispatched" ${c.status === 'Dispatched' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'कार्यवाही सुरू' : 'Dispatched'}</option>
            <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'निवारण झाले' : 'Resolved'}</option>
            <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>${getLanguage() === 'mr' ? 'नाकारले' : 'Rejected'}</option>
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.openAdminComplaintResponseModal('${cJson}')">
            ${c.adminResponse ? t("adm_notes", "View / Edit Notes") : t("adm_respond", "Respond")}
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.handleComplaintStatusChange = async function(complaintId, newStatus) {
  const c = appState.complaints.find(comp => comp.id === complaintId);
  if (!c) return;

  try {
    await api.updateCommunityReportStatus(complaintId, newStatus);
    showToast(`Complaint status updated to '${newStatus}'!`, "success");
    c.status = newStatus;
    renderRecentReports();
    renderHomeView();
    renderAdminComplaintsTable();
    renderAdminStats();
  } catch (err) {
    console.error("Error updating complaint status:", err);
    showToast("Failed to update complaint: " + err.message, "error");
  }
};

async function renderAdminReportsView() {
  const container = document.getElementById("adminReportsContainer");
  if (!container) return;

  try {
    const reports = await api.getAdminReports();
    if (!reports) return;

    const { financial, complaints, waterReserves } = reports;

    container.innerHTML = `
      <div class="report-summary-card">
        <h3 class="report-card-title">💰 Financial & Collections Summary</h3>
        <div class="report-stat-row">
          <span>Total Demand Billed:</span>
          <span class="report-stat-val">₹${Number(financial.totalBilled || 0).toFixed(2)}</span>
        </div>
        <div class="report-stat-row">
          <span>Total Collections Verified:</span>
          <span class="report-stat-val" style="color:#0f766e;">₹${Number(financial.totalCollected || 0).toFixed(2)}</span>
        </div>
        <div class="report-stat-row">
          <span>Outstanding Dues Balance:</span>
          <span class="report-stat-val" style="color:#e11d48;">₹${Number(financial.outstandingBalance || 0).toFixed(2)}</span>
        </div>
        <div class="report-stat-row">
          <span>Revenue Realization Rate:</span>
          <span class="report-stat-val"><strong>${financial.collectionPercentage}%</strong></span>
        </div>
      </div>

      <div class="report-summary-card">
        <h3 class="report-card-title">📋 Grievances Resolution Performance</h3>
        <div class="report-stat-row">
          <span>Total Lodged Issues:</span>
          <span class="report-stat-val">${complaints.totalComplaints}</span>
        </div>
        <div class="report-stat-row">
          <span>Resolved & Closed:</span>
          <span class="report-stat-val" style="color:#16a34a;">${complaints.resolvedCount}</span>
        </div>
        <div class="report-stat-row">
          <span>In Progress / Dispatched:</span>
          <span class="report-stat-val" style="color:#0284c7;">${complaints.inProgressCount}</span>
        </div>
        <div class="report-stat-row">
          <span>Pending Action:</span>
          <span class="report-stat-val" style="color:#d97706;">${complaints.pendingCount}</span>
        </div>
        <div class="report-stat-row">
          <span>Resolution Rate:</span>
          <span class="report-stat-val"><strong>${complaints.resolutionRate}%</strong></span>
        </div>
      </div>

      <div class="report-summary-card">
        <h3 class="report-card-title">💧 Village Water Reserves Aggregation</h3>
        <div class="report-stat-row">
          <span>Active Water Sources:</span>
          <span class="report-stat-val">${waterReserves.totalSources} sources</span>
        </div>
        <div class="report-stat-row">
          <span>Cumulative Village Capacity:</span>
          <span class="report-stat-val">${Number(waterReserves.totalCapacityLiters).toLocaleString()} Liters</span>
        </div>
        <div class="report-stat-row">
          <span>Current Available Storage:</span>
          <span class="report-stat-val" style="color:#0284c7;">${Number(waterReserves.totalAvailableLiters).toLocaleString()} Liters</span>
        </div>
        <div class="report-stat-row">
          <span>Overall Village Reserve Fill:</span>
          <span class="report-stat-val"><strong>${waterReserves.overallFillPercent}%</strong></span>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:#ef4444; padding:20px;">Could not generate live reports from database.</div>`;
  }
}

// ==========================================================
// 15. UTILITIES
// ==========================================================

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================================
// 16. WATER TANK MONITORING & LIVE LEVEL MODULE
// ==========================================================
let currentTankFilter = "all";
let activeHistoryTankId = null;

function getTankStatusInfo(percent) {
  const p = Number(percent);
  if (p <= 0) return { status: "Empty", colorClass: "status-color-empty", bgPill: "status-critical", label: "Empty (0%)" };
  if (p < 10) return { status: "Very Critical", colorClass: "status-color-verycritical", bgPill: "status-critical", label: "Very Critical (<10%)" };
  if (p < 25) return { status: "Critical", colorClass: "status-color-critical", bgPill: "status-critical", label: "Critical (10%-24%)" };
  if (p <= 50) return { status: "Low", colorClass: "status-color-low", bgPill: "status-low", label: "Low (25%-50%)" };
  return { status: "Normal", colorClass: "status-color-normal", bgPill: "status-normal", label: "Normal (>50%)" };
}

async function renderAdminTanks() {
  const grid = document.getElementById("adminTanksGrid");
  if (!grid) return;

  try {
    const [tanksRes, sumRes] = await Promise.all([
      api.getWaterTanks().catch(() => ({ success: false, tanks: [] })),
      api.getWaterTanksSummary().catch(() => ({ success: false, summary: null }))
    ]);

    const tanks = tanksRes.tanks || [];
    appState.tanks = tanks;
    const summary = sumRes.summary || {
      totalTanks: tanks.length,
      totalCapacity: tanks.reduce((a, t) => a + Number(t.total_capacity || 0), 0),
      totalCurrentStorage: tanks.reduce((a, t) => a + Number(t.current_quantity || 0), 0),
      overallStoragePercent: 0,
      lowOrCriticalCount: 0,
      activeAlertsCount: 0,
      overallStatus: "Normal"
    };

    if (summary.totalCapacity > 0) {
      summary.overallStoragePercent = Number(((summary.totalCurrentStorage / summary.totalCapacity) * 100).toFixed(1));
    }
    appState.tankSummary = summary;

    // Update KPI strip
    const elTotal = document.getElementById("admTankTotalCount");
    const elCurrent = document.getElementById("admTankCombinedCurrent");
    const elCap = document.getElementById("admTankCombinedCap");
    const elPercent = document.getElementById("admTankOverallPercent");
    const elStatus = document.getElementById("admTankOverallStatus");
    const elCrit = document.getElementById("admTankCriticalCount");
    const elAlertsSub = document.getElementById("admTankAlertsSub");
    const elAlertBadge = document.getElementById("admTankAlertBadge");
    const elCountAdmin = document.getElementById("countAdminTanks");

    if (elTotal) elTotal.textContent = String(summary.totalTanks);
    if (elCurrent) elCurrent.textContent = `${Number(summary.totalCurrentStorage).toLocaleString()} L`;
    if (elCap) elCap.textContent = getLanguage() === "mr" 
      ? `एकूण ${Number(summary.totalCapacity).toLocaleString()} L क्षमता`
      : `of ${Number(summary.totalCapacity).toLocaleString()} L capacity`;
    if (elPercent) elPercent.textContent = `${summary.overallStoragePercent}%`;
    if (elStatus) elStatus.textContent = `${t("tank_overall_status", "Status")}: ${formatStatus(summary.overallStatus)}`;
    if (elCrit) elCrit.textContent = String(summary.lowOrCriticalCount);
    if (elAlertsSub) {
      elAlertsSub.textContent = getLanguage() === "mr"
        ? `${summary.activeAlertsCount} सक्रिय इशारे`
        : `${summary.activeAlertsCount} active alert${summary.activeAlertsCount === 1 ? '' : 's'}`;
    }
    if (elAlertBadge) elAlertBadge.textContent = String(summary.activeAlertsCount);
    if (elCountAdmin) elCountAdmin.textContent = String(tanks.length);

    // Apply Filter
    let filteredTanks = tanks;
    if (currentTankFilter === "low-critical") {
      filteredTanks = tanks.filter(t => t.status === "Low" || t.status === "Critical" || t.status === "Very Critical" || t.status === "Empty");
    } else if (currentTankFilter !== "all") {
      filteredTanks = tanks.filter(t => t.tank_type === currentTankFilter);
    }

    if (filteredTanks.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:30px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; color:#64748b;">
        ${getLanguage() === "mr" ? 'या वर्गवारीत कोणतीही पाण्याची टाकी सापडली नाही. नवीन टाकी जोडण्यासाठी "नोंदणी करा" बटणावर क्लिक करा.' : 'No water storage tanks match the selected filter category. Click <strong>"Register Tank"</strong> to add a new tank unit.'}
      </div>`;
      return;
    }

    grid.innerHTML = filteredTanks.map(tank => {
      const pct = Math.min(100, Math.max(0, Number(tank.current_level_percent) || 0));
      const cap = Number(tank.total_capacity) || 1;
      const current = Number(tank.current_quantity) || 0;
      const statusInfo = getTankStatusInfo(pct);

      // SVG Ring: r=36, circumference C = 2 * PI * 36 = 226.19
      const C = 226.19;
      const offset = (C - (C * pct) / 100).toFixed(2);

      const isOutdated = tank.is_outdated;
      const lastTimeFormatted = tank.last_measured_at 
        ? new Date(tank.last_measured_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
        : t("tank_pending_meas", "Pending measurement");

      const methodLabel = tank.measurement_method === "Sensor" ? t("tank_method_sensor", "IoT Sensor") : t("tank_method_manual", "Manual Dipstick");
      const methodBadgeClass = tank.measurement_method === "Sensor" ? "method-sensor" : "method-manual";

      const tankJson = encodeURIComponent(JSON.stringify(tank));

      return `
        <div class="tank-card" id="tank-card-${escapeHtml(tank.id)}">
          <div class="tank-card-header">
            <div class="tank-name-wrap">
              <span class="tank-type-badge">${escapeHtml(tank.tank_type)}</span>
              <h3>${escapeHtml(tank.name)}</h3>
              <div class="tank-location-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${escapeHtml(tank.village_location)}</span>
              </div>
            </div>
            <span class="status-tag ${statusInfo.bgPill}">${escapeHtml(formatStatus(statusInfo.status))}</span>
          </div>

          <div class="tank-card-body">
            <div class="progress-ring-container">
              <svg class="progress-ring-svg" viewBox="0 0 88 88">
                <circle class="progress-ring-bg" cx="44" cy="44" r="36" />
                <circle class="progress-ring-fill ${statusInfo.colorClass}" 
                  cx="44" cy="44" r="36" 
                  stroke-dasharray="${C}" 
                  stroke-dashoffset="${offset}" />
              </svg>
              <div class="progress-ring-center">
                <span class="ring-percent-text">${pct}%</span>
                <span class="ring-status-label ${statusInfo.colorClass}">${escapeHtml(formatStatus(statusInfo.status))}</span>
              </div>
            </div>

            <div class="tank-stats-list">
              <div class="tank-stat-row">
                <span class="tank-stat-label">${t("tank_current_storage", "Current Storage:")}</span>
                <span class="tank-stat-value" style="color:#0284c7;">${current.toLocaleString()} L</span>
              </div>
              <div class="tank-stat-row">
                <span class="tank-stat-label">${t("tank_total_capacity", "Total Capacity:")}</span>
                <span class="tank-stat-value">${cap.toLocaleString()} L</span>
              </div>
              <div class="tank-stat-row">
                <span class="tank-stat-label">${t("tank_free_headroom", "Free Headroom:")}</span>
                <span class="tank-stat-value" style="color:#64748b;">${Math.max(0, cap - current).toLocaleString()} L</span>
              </div>
              <div class="tank-stat-row">
                <span class="tank-stat-label">${t("tank_measurement", "Measurement:")}</span>
                <span class="method-badge ${methodBadgeClass}">${methodLabel}</span>
              </div>
            </div>
          </div>

          <div class="tank-freshness-strip">
            <span class="freshness-pill ${isOutdated ? 'pill-outdated' : 'pill-live'}">
              <span class="status-dot"></span>
              <span>${isOutdated ? t("tank_needs_update", "Needs Update (>24h)") : t("tank_verified_live", "Verified Live")}</span>
            </span>
            <span style="font-size:0.75rem; color:#64748b;">${lastTimeFormatted}</span>
          </div>

          <div class="tank-card-actions">
            <button class="btn btn-primary btn-sm" onclick="window.openRecordReadingForTank('${tank.id}')" title="Record fresh water quantity measurement">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>${t("tank_btn_record", "Record")}</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.viewTankHistory('${tank.id}')" title="View historical readings">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span>${t("tank_btn_history", "History")}</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.viewTankEstimate('${tank.id}')" title="Calculate depletion projection based on consumption">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              <span>${t("tank_btn_estimate", "Estimate")}</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.editTank('${tankJson}')" title="Edit tank parameters">${t("btn_edit", "Edit")}</button>
            <button class="btn btn-secondary btn-sm" style="color:#b91c1c;" onclick="window.deleteTank('${tank.id}', '${escapeHtml(tank.name)}')" title="Delete tank unit">${t("btn_delete", "Delete")}</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("renderAdminTanks error:", err);
    grid.innerHTML = `<div style="grid-column: 1 / -1; color:#ef4444; padding:20px; text-align:center;">Failed to load water tanks: ${escapeHtml(err.message)}</div>`;
  }
}

function initWaterMonitoringModals() {
  // Tank filter chip listeners
  document.querySelectorAll("[data-tank-filter]").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-tank-filter]").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentTankFilter = chip.getAttribute("data-tank-filter");
      renderAdminTanks();
    });
  });

  // Modal 1: Record Water Level Measurement
  const modalReading = document.getElementById("adminRecordReadingModal");
  const btnOpenReading = document.getElementById("btnOpenRecordReadingModal");
  const btnCloseReading = document.getElementById("btnCloseRecordReadingModal");
  const btnCancelReading = document.getElementById("btnCancelRecordReadingModal");
  const formReading = document.getElementById("adminRecordReadingForm");
  const selectTank = document.getElementById("readingTankSelect");
  const inputQty = document.getElementById("readingQuantity");
  const inputHeight = document.getElementById("readingWaterHeight");
  const grpHeight = document.getElementById("grpWaterHeightOption");
  const btnSaveReading = document.getElementById("btnSaveReading");

  function populateTankDropdown() {
    if (!selectTank) return;
    const tanks = appState.tanks || [];
    selectTank.innerHTML = `<option value="">-- Choose Water Tank (${tanks.length} Available) --</option>` +
      tanks.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.village_location)}) - Capacity: ${Number(t.total_capacity).toLocaleString()} L</option>`).join("");
  }

  function updateReadingLiveCalc() {
    if (!selectTank) return;
    const tankId = selectTank.value;
    const tank = (appState.tanks || []).find(t => t.id === tankId);

    const ringFill = document.getElementById("previewRingFill");
    const ringText = document.getElementById("previewRingText");
    const pctHeading = document.getElementById("previewLevelPercent");
    const statusPill = document.getElementById("previewStatusPill");
    const barFill = document.getElementById("previewBarFill");
    const capLabel = document.getElementById("previewCapacityLabel");

    if (!tank) {
      if (capLabel) capLabel.textContent = "Please select a water tank above";
      if (grpHeight) grpHeight.style.display = "none";
      return;
    }

    if (grpHeight) {
      grpHeight.style.display = (tank.tank_shape && tank.tank_shape !== "Direct Quantity") ? "block" : "none";
    }

    const cap = Number(tank.total_capacity) || 1;
    let qty = inputQty.value !== "" ? Number(inputQty.value) : NaN;

    if (isNaN(qty) && inputHeight && inputHeight.value !== "") {
      const h = Number(inputHeight.value);
      if (tank.tank_shape === "Cylindrical Vertical" && tank.dim_diameter) {
        const r = Number(tank.dim_diameter) / 2;
        qty = Math.round(Math.PI * Math.pow(r, 2) * h * 1000);
      } else if (tank.tank_shape === "Rectangular Box" && tank.dim_length && tank.dim_width) {
        qty = Math.round(Number(tank.dim_length) * Number(tank.dim_width) * h * 1000);
      } else if (tank.dim_height) {
        qty = Math.round((h / Number(tank.dim_height)) * cap);
      }
      if (!isNaN(qty)) inputQty.placeholder = `Calculated: ${qty} L`;
    }

    if (isNaN(qty)) {
      qty = 0;
    }

    const pct = Number(((qty / cap) * 100).toFixed(1));
    const statusInfo = getTankStatusInfo(pct);

    if (capLabel) {
      capLabel.innerHTML = `Calculated: <strong>${qty.toLocaleString()} L</strong> of <strong>${cap.toLocaleString()} L</strong> total capacity`;
    }

    if (qty < 0) {
      if (pctHeading) pctHeading.textContent = "Invalid (<0)";
      if (statusPill) {
        statusPill.className = "preview-status-pill status-tag status-critical";
        statusPill.textContent = "Negative Value";
      }
      return;
    }

    if (qty > cap) {
      if (pctHeading) pctHeading.textContent = `${pct}% (Over-capacity)`;
      if (statusPill) {
        statusPill.className = "preview-status-pill status-tag status-critical";
        statusPill.textContent = "Exceeds Capacity";
      }
      if (barFill) {
        barFill.style.width = "100%";
        barFill.style.background = "#dc2626";
      }
      return;
    }

    const C = 188.5; // 2 * PI * 30 = 188.49
    const offset = (C - (C * Math.min(100, Math.max(0, pct))) / 100).toFixed(2);

    if (ringFill) {
      ringFill.style.strokeDashoffset = offset;
      ringFill.style.stroke = statusInfo.colorClass === "status-color-normal" ? "#0284c7" :
                              statusInfo.colorClass === "status-color-low" ? "#f59e0b" :
                              statusInfo.colorClass === "status-color-critical" ? "#ef4444" :
                              statusInfo.colorClass === "status-color-verycritical" ? "#b91c1c" : "#94a3b8";
    }
    if (ringText) ringText.textContent = `${pct}%`;
    if (pctHeading) pctHeading.textContent = `${pct}%`;
    if (statusPill) {
      statusPill.className = `preview-status-pill status-tag ${statusInfo.bgPill}`;
      statusPill.textContent = statusInfo.status;
    }
    if (barFill) {
      barFill.style.width = `${Math.min(100, pct)}%`;
      barFill.style.background = statusInfo.colorClass === "status-color-normal" ? "#0284c7" :
                                 statusInfo.colorClass === "status-color-low" ? "#f59e0b" :
                                 statusInfo.colorClass === "status-color-critical" ? "#ef4444" : "#b91c1c";
    }
  }

  if (selectTank) selectTank.addEventListener("change", () => {
    updateReadingLiveCalc();
    const tank = (appState.tanks || []).find(t => t.id === selectTank.value);
    const prevEl = document.getElementById("prevReadingNotice");
    if (prevEl && tank) {
      prevEl.innerHTML = `Previous Reading: <strong>${Number(tank.current_quantity).toLocaleString()} L (${tank.current_level_percent}%)</strong> on ${tank.last_measured_at ? new Date(tank.last_measured_at).toLocaleString() : 'N/A'}`;
    }
  });
  if (inputQty) inputQty.addEventListener("input", updateReadingLiveCalc);
  if (inputHeight) inputHeight.addEventListener("input", updateReadingLiveCalc);

  if (btnOpenReading && modalReading) {
    btnOpenReading.addEventListener("click", () => {
      populateTankDropdown();
      modalReading.hidden = false;
      if (formReading) formReading.reset();
      updateReadingLiveCalc();
    });
  }

  const closeReading = () => { if (modalReading) modalReading.hidden = true; };
  if (btnCloseReading) btnCloseReading.addEventListener("click", closeReading);
  if (btnCancelReading) btnCancelReading.addEventListener("click", closeReading);

  if (formReading) {
    formReading.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tankId = selectTank.value;
      if (!tankId) {
        showToast("Please choose a water tank to record measurement for.", "error");
        return;
      }

      const tank = (appState.tanks || []).find(t => t.id === tankId);
      if (!tank) return;

      const qty = Number(inputQty.value);
      if (isNaN(qty)) {
        showToast("Please enter a valid water quantity in litres.", "error");
        return;
      }
      if (qty < 0) {
        showToast("Water quantity cannot be negative.", "error");
        return;
      }
      if (qty > Number(tank.total_capacity)) {
        showToast(`Water quantity (${qty.toLocaleString()} L) cannot exceed tank capacity (${Number(tank.total_capacity).toLocaleString()} L).`, "error");
        return;
      }

      const method = document.getElementById("readingMethod")?.value || "Manual";
      const notes = document.getElementById("readingNotes")?.value || "";

      if (btnSaveReading) {
        btnSaveReading.disabled = true;
        btnSaveReading.innerHTML = `<span class="spinner-inline spinner-dark"></span> Saving...`;
      }

      try {
        const res = await api.recordWaterReading(tankId, {
          measuredQuantity: qty,
          measurementMethod: method,
          notes: notes.trim()
        });

        showToast(res.message || "Water level measurement saved successfully!", "success");
        closeReading();
        await renderAdminTanks();
        renderAllViews();
      } catch (err) {
        console.error("Record reading error:", err);
        showToast("Failed to record measurement: " + err.message, "error");
      } finally {
        if (btnSaveReading) {
          btnSaveReading.disabled = false;
          btnSaveReading.innerHTML = "Save Measurement";
        }
      }
    });
  }

  // Modal 2: Register / Edit Water Tank
  const modalTank = document.getElementById("adminAddTankModal");
  const btnOpenAddTank = document.getElementById("btnOpenAddTankModal");
  const btnCloseTank = document.getElementById("btnCloseAddTankModal");
  const btnCancelTank = document.getElementById("btnCancelAddTankModal");
  const formTank = document.getElementById("adminAddTankForm");
  const shapeSelect = document.getElementById("tankShape");
  const rowDims = document.getElementById("rowDimensions");
  const grpHeightDim = document.getElementById("grpDimHeight");
  const grpDiamDim = document.getElementById("grpDimDiameter");
  const grpLenDim = document.getElementById("grpDimLength");
  const grpWidDim = document.getElementById("grpDimWidth");
  const btnSaveTank = document.getElementById("btnSaveTank");

  if (shapeSelect) {
    shapeSelect.addEventListener("change", () => {
      const shape = shapeSelect.value;
      if (shape === "Direct Quantity") {
        if (rowDims) rowDims.style.display = "none";
      } else if (shape === "Cylindrical Vertical") {
        if (rowDims) rowDims.style.display = "flex";
        if (grpHeightDim) grpHeightDim.style.display = "block";
        if (grpDiamDim) grpDiamDim.style.display = "block";
        if (grpLenDim) grpLenDim.style.display = "none";
        if (grpWidDim) grpWidDim.style.display = "none";
      } else if (shape === "Rectangular Box") {
        if (rowDims) rowDims.style.display = "flex";
        if (grpHeightDim) grpHeightDim.style.display = "block";
        if (grpDiamDim) grpDiamDim.style.display = "none";
        if (grpLenDim) grpLenDim.style.display = "block";
        if (grpWidDim) grpWidDim.style.display = "block";
      }
    });
  }

  if (btnOpenAddTank && modalTank) {
    btnOpenAddTank.addEventListener("click", () => {
      document.getElementById("addTankModalTitle").textContent = "Register New Water Tank";
      document.getElementById("tankEditId").value = "";
      if (document.getElementById("rowInitialQty")) document.getElementById("rowInitialQty").style.display = "flex";
      modalTank.hidden = false;
      if (formTank) formTank.reset();
      if (shapeSelect) shapeSelect.dispatchEvent(new Event("change"));
    });
  }

  const closeTankModal = () => { if (modalTank) modalTank.hidden = true; };
  if (btnCloseTank) btnCloseTank.addEventListener("click", closeTankModal);
  if (btnCancelTank) btnCancelTank.addEventListener("click", closeTankModal);

  if (formTank) {
    formTank.addEventListener("submit", async (e) => {
      e.preventDefault();
      const editId = document.getElementById("tankEditId").value;
      const name = document.getElementById("tankName").value.trim();
      const tankType = document.getElementById("tankType").value;
      const villageLocation = document.getElementById("tankLocation").value.trim();
      const totalCapacity = Number(document.getElementById("tankCapacity").value);
      const initialQtyVal = document.getElementById("tankInitialQty").value;
      const initialQuantity = initialQtyVal !== "" ? Number(initialQtyVal) : undefined;
      const tankShape = document.getElementById("tankShape").value;
      const dimHeight = document.getElementById("tankDimHeight").value;
      const dimDiameter = document.getElementById("tankDimDiameter").value;
      const dimLength = document.getElementById("tankDimLength").value;
      const dimWidth = document.getElementById("tankDimWidth").value;

      if (!name || !villageLocation || !totalCapacity) {
        showToast("Please enter Tank Name, Location, and Total Storage Capacity.", "error");
        return;
      }
      if (totalCapacity <= 0) {
        showToast("Total capacity must be a positive number of litres.", "error");
        return;
      }
      if (initialQuantity !== undefined && (initialQuantity < 0 || initialQuantity > totalCapacity)) {
        showToast(`Initial quantity (${initialQuantity} L) cannot be negative or exceed capacity (${totalCapacity} L).`, "error");
        return;
      }

      if (btnSaveTank) {
        btnSaveTank.disabled = true;
        btnSaveTank.innerHTML = `<span class="spinner-inline spinner-dark"></span> Saving...`;
      }

      try {
        if (editId) {
          await api.updateWaterTank(editId, {
            name,
            tank_type: tankType,
            village_location: villageLocation,
            total_capacity: totalCapacity,
            tank_shape: tankShape,
            dim_height: dimHeight ? Number(dimHeight) : null,
            dim_diameter: dimDiameter ? Number(dimDiameter) : null,
            dim_length: dimLength ? Number(dimLength) : null,
            dim_width: dimWidth ? Number(dimWidth) : null
          });
          showToast(`Water tank "${name}" updated successfully!`, "success");
        } else {
          await api.createWaterTank({
            name,
            tank_type: tankType,
            village_location: villageLocation,
            total_capacity: totalCapacity,
            initial_quantity: initialQuantity,
            tank_shape: tankShape,
            dim_height: dimHeight ? Number(dimHeight) : null,
            dim_diameter: dimDiameter ? Number(dimDiameter) : null,
            dim_length: dimLength ? Number(dimLength) : null,
            dim_width: dimWidth ? Number(dimWidth) : null
          });
          showToast(`New water tank "${name}" registered successfully!`, "success");
        }

        closeTankModal();
        await renderAdminTanks();
        renderAllViews();
      } catch (err) {
        console.error("Save tank error:", err);
        showToast("Failed to save tank: " + err.message, "error");
      } finally {
        if (btnSaveTank) {
          btnSaveTank.disabled = false;
          btnSaveTank.innerHTML = "Save Tank";
        }
      }
    });
  }

  // Modal 3: Tank Measurement History
  const modalHistory = document.getElementById("adminTankHistoryModal");
  const btnCloseHistory = document.getElementById("btnCloseTankHistoryModal");
  const btnCloseHistoryBtm = document.getElementById("btnCloseTankHistoryBottom");
  const btnFilterHist = document.getElementById("btnFilterHistory");
  const btnResetHist = document.getElementById("btnResetHistoryFilter");

  const closeHistoryModal = () => { if (modalHistory) modalHistory.hidden = true; };
  if (btnCloseHistory) btnCloseHistory.addEventListener("click", closeHistoryModal);
  if (btnCloseHistoryBtm) btnCloseHistoryBtm.addEventListener("click", closeHistoryModal);

  if (btnFilterHist) {
    btnFilterHist.addEventListener("click", () => {
      if (activeHistoryTankId) window.viewTankHistory(activeHistoryTankId);
    });
  }
  if (btnResetHist) {
    btnResetHist.addEventListener("click", () => {
      document.getElementById("historyDateFrom").value = "";
      document.getElementById("historyDateTo").value = "";
      if (activeHistoryTankId) window.viewTankHistory(activeHistoryTankId);
    });
  }

  // Modal 4: Water Supply Distribution Logging
  const modalDist = document.getElementById("adminLogDistributionModal");
  const btnOpenDist = document.getElementById("btnOpenLogDistributionModal");
  const btnCloseDist = document.getElementById("btnCloseLogDistributionModal");
  const btnCancelDist = document.getElementById("btnCancelLogDistributionModal");
  const formDist = document.getElementById("adminLogDistributionForm");
  const selectDistTank = document.getElementById("distTankSelect");
  const btnSaveDist = document.getElementById("btnSaveDistribution");

  if (btnOpenDist && modalDist) {
    btnOpenDist.addEventListener("click", () => {
      if (selectDistTank) {
        selectDistTank.innerHTML = `<option value="">-- Village General Supply --</option>` +
          (appState.tanks || []).map(t => `<option value="${t.id}">${escapeHtml(t.name)} (Current: ${Number(t.current_quantity).toLocaleString()} L)</option>`).join("");
      }
      document.getElementById("distDate").value = new Date().toISOString().split("T")[0];
      modalDist.hidden = false;
      if (formDist) formDist.reset();
    });
  }

  const closeDistModal = () => { if (modalDist) modalDist.hidden = true; };
  if (btnCloseDist) btnCloseDist.addEventListener("click", closeDistModal);
  if (btnCancelDist) btnCancelDist.addEventListener("click", closeDistModal);

  if (formDist) {
    formDist.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tankId = selectDistTank.value || null;
      const targetArea = document.getElementById("distTargetArea").value.trim();
      const distDate = document.getElementById("distDate").value;
      const quantity = Number(document.getElementById("distQuantity").value);
      const duration = Number(document.getElementById("distDuration").value) || 2.0;
      const inflow = Number(document.getElementById("distInflow").value) || 0;
      const notes = document.getElementById("distNotes").value.trim();

      if (!targetArea || !distDate || isNaN(quantity) || quantity <= 0) {
        showToast("Please enter target area, date, and valid quantity released.", "error");
        return;
      }

      if (btnSaveDist) {
        btnSaveDist.disabled = true;
        btnSaveDist.innerHTML = `<span class="spinner-inline spinner-dark"></span> Logging...`;
      }

      try {
        await api.recordWaterDistribution({
          tank_id: tankId,
          target_area: targetArea,
          distribution_date: distDate,
          quantity_supplied: quantity,
          duration_hours: duration,
          inflow_litres: inflow,
          outflow_litres: quantity,
          notes
        });
        showToast("Water supply distribution record logged successfully!", "success");
        closeDistModal();
      } catch (err) {
        console.error("Distribution log error:", err);
        showToast("Failed to log distribution: " + err.message, "error");
      } finally {
        if (btnSaveDist) {
          btnSaveDist.disabled = false;
          btnSaveDist.innerHTML = "Log Supply Record";
        }
      }
    });
  }

  // Modal 5: Alerts Modal
  const modalAlerts = document.getElementById("adminTankAlertsModal");
  const btnOpenAlerts = document.getElementById("btnOpenTankAlertsModal");
  const btnCloseAlerts = document.getElementById("btnCloseTankAlertsModal");
  const btnCloseAlertsBtm = document.getElementById("btnCloseTankAlertsBottom");

  if (btnOpenAlerts && modalAlerts) {
    btnOpenAlerts.addEventListener("click", () => window.openTankAlertsModal());
  }

  const closeAlertsModal = () => { if (modalAlerts) modalAlerts.hidden = true; };
  if (btnCloseAlerts) btnCloseAlerts.addEventListener("click", closeAlertsModal);
  if (btnCloseAlertsBtm) btnCloseAlertsBtm.addEventListener("click", closeAlertsModal);

  // Modal 6: Estimate Modal Close
  const modalEst = document.getElementById("adminTankEstimateModal");
  const btnCloseEst = document.getElementById("btnCloseTankEstimateModal");
  const btnCloseEstBtm = document.getElementById("btnCloseTankEstimateBottom");
  const closeEstModal = () => { if (modalEst) modalEst.hidden = true; };
  if (btnCloseEst) btnCloseEst.addEventListener("click", closeEstModal);
  if (btnCloseEstBtm) btnCloseEstBtm.addEventListener("click", closeEstModal);
}

// Global actions for Water Tank cards
window.openRecordReadingForTank = function(tankId) {
  const modalReading = document.getElementById("adminRecordReadingModal");
  const selectTank = document.getElementById("readingTankSelect");
  if (!modalReading || !selectTank) return;

  const tanks = appState.tanks || [];
  selectTank.innerHTML = `<option value="">-- Choose Water Tank --</option>` +
    tanks.map(t => `<option value="${t.id}" ${t.id === tankId ? 'selected' : ''}>${escapeHtml(t.name)} (${escapeHtml(t.village_location)}) - Capacity: ${Number(t.total_capacity).toLocaleString()} L</option>`).join("");

  selectTank.value = tankId;
  selectTank.dispatchEvent(new Event("change"));
  modalReading.hidden = false;
};

window.viewTankHistory = async function(tankId) {
  activeHistoryTankId = tankId;
  const modal = document.getElementById("adminTankHistoryModal");
  const tbody = document.getElementById("tankHistoryTableBody");
  const subtitle = document.getElementById("historyModalSubtitle");
  if (!modal || !tbody) return;

  const tank = (appState.tanks || []).find(t => t.id === tankId);
  if (subtitle && tank) {
    subtitle.textContent = `Historical dipstick and sensor measurements for ${tank.name} (${tank.village_location}).`;
  }

  const from = document.getElementById("historyDateFrom")?.value || "";
  const to = document.getElementById("historyDateTo")?.value || "";

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;"><span class="spinner-inline spinner-dark"></span> Loading historical measurements...</td></tr>`;
  modal.hidden = false;

  try {
    const res = await api.getWaterTankReadings(tankId, { from, to });
    const readings = res.readings || [];

    if (readings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No measurement records found for the selected date range.</td></tr>`;
      return;
    }

    tbody.innerHTML = readings.map(r => {
      const dt = new Date(r.recorded_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const statusInfo = getTankStatusInfo(r.percentage);
      const isSensor = r.measurement_method === "Sensor";

      return `
        <tr>
          <td><strong>${dt}</strong></td>
          <td><strong style="color:#0284c7;">${Number(r.measured_quantity).toLocaleString()} L</strong></td>
          <td><strong>${Number(r.percentage).toFixed(1)}%</strong></td>
          <td><span class="status-tag ${statusInfo.bgPill}">${escapeHtml(statusInfo.status)}</span></td>
          <td><span class="method-badge ${isSensor ? 'method-sensor' : 'method-manual'}">${isSensor ? 'Sensor' : 'Manual'}</span></td>
          <td>${escapeHtml(r.recorded_by || "staff")}</td>
          <td>${escapeHtml(r.notes || "-")}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("viewTankHistory error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444; padding:20px; text-align:center;">Failed to load readings: ${escapeHtml(err.message)}</td></tr>`;
  }
};

window.viewTankEstimate = async function(tankId) {
  const modal = document.getElementById("adminTankEstimateModal");
  const body = document.getElementById("tankEstimateBody");
  if (!modal || !body) return;

  body.innerHTML = `<div style="text-align:center; padding:30px;"><span class="spinner-inline spinner-dark"></span> Calculating consumption rate and depletion projection...</div>`;
  modal.hidden = false;

  try {
    const res = await api.getWaterDepletionEstimate(tankId);
    if (!res || !res.hasSufficientData) {
      body.innerHTML = `
        <div class="empty-state" style="padding:24px; text-align:center;">
          <p style="font-size:1rem; color:#64748b; margin-bottom:12px;">${escapeHtml(res?.message || "Insufficient distribution history to calculate a reliable depletion projection.")}</p>
          <p style="font-size:0.85rem; color:#94a3b8;">Log scheduled water releases using <strong>"Log Distribution"</strong> to build consumption telemetry for this tank.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = `
      <div class="estimate-highlight-box">
        <strong>⚠️ Proportional Projection Disclaimer:</strong><br>
        ${escapeHtml(res.estimateLabel)}
      </div>

      <div class="estimate-stat-grid">
        <div class="estimate-stat-card">
          <div style="font-size:0.8rem; color:#64748b;">Current Tank Reserve</div>
          <div class="estimate-stat-num" style="color:#0284c7;">${Number(res.currentStorageLitres).toLocaleString()} L</div>
        </div>

        <div class="estimate-stat-card">
          <div style="font-size:0.8rem; color:#64748b;">Avg Daily Release</div>
          <div class="estimate-stat-num">${Number(res.avgDailyOutflowLitres).toLocaleString()} L/day</div>
        </div>

        <div class="estimate-stat-card">
          <div style="font-size:0.8rem; color:#64748b;">Estimated Days Left</div>
          <div class="estimate-stat-num" style="color:${res.estimatedDaysRemaining <= 3 ? '#dc2626' : res.estimatedDaysRemaining <= 7 ? '#d97706' : '#16a34a'};">
            ${res.estimatedDaysRemaining !== null ? res.estimatedDaysRemaining + ' days' : 'Depleted'}
          </div>
        </div>

        <div class="estimate-stat-card">
          <div style="font-size:0.8rem; color:#64748b;">Estimated Depletion Date</div>
          <div class="estimate-stat-num" style="font-size:1.1rem; margin-top:8px;">${escapeHtml(res.estimatedDepletionDate || "Immediate")}</div>
        </div>
      </div>

      <p style="font-size:0.85rem; color:#64748b; margin-top:14px; text-align:center;">
        Calculated across <strong>${res.recordsAnalyzedCount} recorded distribution cycles</strong> for ${escapeHtml(res.tank.name)}.
      </p>
    `;
  } catch (err) {
    console.error("viewTankEstimate error:", err);
    body.innerHTML = `<div style="color:#ef4444; padding:20px; text-align:center;">Failed to calculate estimate: ${escapeHtml(err.message)}</div>`;
  }
};

window.editTank = function(tankJson) {
  const t = typeof tankJson === "string" ? JSON.parse(decodeURIComponent(tankJson)) : tankJson;
  const modal = document.getElementById("adminAddTankModal");
  if (!modal) return;

  document.getElementById("addTankModalTitle").textContent = `Edit Water Tank: ${t.name}`;
  document.getElementById("tankEditId").value = t.id;
  document.getElementById("tankName").value = t.name;
  document.getElementById("tankType").value = t.tank_type;
  document.getElementById("tankLocation").value = t.village_location;
  document.getElementById("tankCapacity").value = t.total_capacity;

  if (document.getElementById("rowInitialQty")) {
    document.getElementById("rowInitialQty").style.display = "none";
  }

  const shapeSelect = document.getElementById("tankShape");
  if (shapeSelect) {
    shapeSelect.value = t.tank_shape || "Direct Quantity";
    shapeSelect.dispatchEvent(new Event("change"));
  }

  document.getElementById("tankDimHeight").value = t.dim_height || "";
  document.getElementById("tankDimDiameter").value = t.dim_diameter || "";
  document.getElementById("tankDimLength").value = t.dim_length || "";
  document.getElementById("tankDimWidth").value = t.dim_width || "";

  modal.hidden = false;
};

window.deleteTank = async function(tankId, tankName) {
  if (!confirm(`Are you sure you want to delete water tank "${tankName}"?\n\nThis will also remove historical measurement logs for this tank. This action cannot be undone.`)) {
    return;
  }

  try {
    await api.deleteWaterTank(tankId);
    showToast(`Water tank "${tankName}" deleted successfully.`, "success");
    await renderAdminTanks();
    renderAllViews();
  } catch (err) {
    console.error("Delete tank error:", err);
    showToast("Failed to delete water tank: " + err.message, "error");
  }
};

window.openTankAlertsModal = async function() {
  const modal = document.getElementById("adminTankAlertsModal");
  const tbody = document.getElementById("tankAlertsTableBody");
  if (!modal || !tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;"><span class="spinner-inline spinner-dark"></span> Loading alerts...</td></tr>`;
  modal.hidden = false;

  try {
    const res = await api.getWaterAlerts();
    const alerts = res.alerts || [];

    if (alerts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#16a34a;">No active water level alerts. All storage units are in safe thresholds.</td></tr>`;
      return;
    }

    tbody.innerHTML = alerts.map(a => {
      const dt = new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      const isAck = Number(a.is_acknowledged) === 1;

      return `
        <tr>
          <td><strong>${escapeHtml(a.tank_name || a.tank_id)}</strong></td>
          <td><span class="status-tag status-critical">${escapeHtml(a.alert_type)}</span></td>
          <td><strong>${Number(a.percentage).toFixed(1)}%</strong></td>
          <td>${escapeHtml(a.message)}</td>
          <td><span style="font-size:0.78rem; color:#64748b;">${dt}</span></td>
          <td>
            ${isAck 
              ? `<span style="color:#16a34a; font-size:0.8rem; font-weight:700;">Acknowledged</span>` 
              : `<button class="btn btn-primary btn-sm" onclick="window.acknowledgeAlert('${a.id}')">Acknowledge</button>`
            }
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("openTankAlertsModal error:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; padding:20px; text-align:center;">Failed to load alerts: ${escapeHtml(err.message)}</td></tr>`;
  }
};

window.acknowledgeAlert = async function(alertId) {
  try {
    await api.acknowledgeWaterAlert(alertId);
    showToast("Water level alert acknowledged successfully!", "success");
    await window.openTankAlertsModal();
    await renderAdminTanks();
  } catch (err) {
    console.error("Acknowledge alert error:", err);
    showToast("Failed to acknowledge alert: " + err.message, "error");
  }
};


