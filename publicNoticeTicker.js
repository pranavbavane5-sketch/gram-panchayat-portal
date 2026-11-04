/**
 * JalMitra - Government-Style Public Notice Ticker
 * 
 * Implements:
 * 1. Full-width scrolling public notice ticker on the public homepage.
 * 2. Real-time data synchronization with backend & Cloud Firestore.
 * 3. Smooth continuous right-to-left marquee animation with zero jump.
 * 4. Desktop hover-pause, touch scrolling, and manual prev/next/pause controls.
 * 5. Respects prefers-reduced-motion accessibility standard.
 * 6. Dual-language support (English & Marathi) with dynamic language updates.
 * 7. Full notice detail reader modal with sanitized text rendering.
 * 8. Automatic refresh integration when notices are added/deleted in admin panel.
 */

import { api } from "./api.js";
import { t, getLanguage } from "./translations.js";

let cachedNotices = [];
let isPausedByUser = false;
let isInitialized = false;

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateVal, isMr) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(isMr ? "mr-IN" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

/**
 * Renders or updates the public notice ticker from live API data
 */
export async function renderNoticeTicker() {
  const tickerEl = document.getElementById("govNoticeTicker");
  const trackEl = document.getElementById("tickerTrack");
  const badgeText = document.getElementById("tickerBadgeText");
  const controlsEl = document.getElementById("tickerControls");

  if (!tickerEl || !trackEl) return;

  const isMr = getLanguage() === "mr";

  // Update badge label
  if (badgeText) {
    badgeText.textContent = isMr ? "सार्वजनिक सूचना" : "PUBLIC NOTICES";
  }

  try {
    const rawNotices = await api.getPublicNotices();
    const now = new Date();

    // Filter active and unexpired notices
    cachedNotices = (rawNotices || []).filter(n => {
      if (n.is_active === 0 || n.is_active === false) return false;
      if (n.expiry_date) {
        const exp = new Date(n.expiry_date);
        if (!isNaN(exp.getTime()) && exp < now) return false;
      }
      return true;
    });

    if (cachedNotices.length === 0) {
      trackEl.innerHTML = `
        <div class="ticker-item" style="cursor: default;">
          <span class="ticker-item-title" style="color: #cbd5e1;">${isMr ? "सध्या कोणतीही नवीन अधिकृत सूचना प्रसिद्ध झालेली नाही." : "No active public notices published at this time."}</span>
        </div>
      `;
      trackEl.style.animation = "none";
      if (controlsEl) controlsEl.style.display = "none";
      return;
    }

    if (controlsEl) controlsEl.style.display = "flex";

    // Build notice items markup
    const buildItemHtml = (n) => {
      const title = isMr && n.title_mr ? n.title_mr : (n.title || n.title_en || "");
      const dateStr = formatDate(n.publish_date || n.created_at, isMr);
      const isPinned = Boolean(n.is_pinned);
      const category = n.category || n.notice_type || "Notice";

      return `
        <button type="button" class="ticker-item" data-notice-id="${escapeHtml(n.id)}" title="${escapeHtml(title)} - Click to read full notice">
          ${isPinned ? `<span class="ticker-item-tag pinned">📌 ${isMr ? "महत्त्वाची" : "Pinned"}</span>` : ""}
          <span class="ticker-item-tag">${escapeHtml(category)}</span>
          <span class="ticker-item-title">${escapeHtml(title)}</span>
          ${dateStr ? `<span class="ticker-item-date">[${escapeHtml(dateStr)}]</span>` : ""}
          <span class="ticker-separator" aria-hidden="true">🔸</span>
        </button>
      `;
    };

    const singleSet = cachedNotices.map(buildItemHtml).join("");

    // Duplicate list once to achieve seamless, infinite loop without gaps
    trackEl.innerHTML = singleSet + singleSet;

    // Dynamically adjust animation speed to maintain natural reading pace (~40-50 px/s)
    const animDuration = Math.max(30, cachedNotices.length * 8);
    trackEl.style.animationDuration = `${animDuration}s`;

    if (isPausedByUser) {
      trackEl.classList.add("is-paused");
    } else {
      trackEl.classList.remove("is-paused");
    }
  } catch (err) {
    console.warn("⚠️ Notice ticker load warning:", err.message);
    trackEl.innerHTML = `
      <div class="ticker-item" style="cursor: default;">
        <span class="ticker-item-title" style="color: #94a3b8;">${isMr ? "नवीन अधिकृत सूचना लोड होत आहेत..." : "Loading official public notices..."}</span>
      </div>
    `;
  }
}

/**
 * Opens full details for a clicked notice in the dedicated reader modal
 */
export function openNoticeDetail(noticeId) {
  if (!noticeId) return;
  const notice = cachedNotices.find(n => String(n.id) === String(noticeId));
  if (!notice) return;

  const modal = document.getElementById("publicNoticeDetailModal");
  if (!modal) return;

  const isMr = getLanguage() === "mr";
  const title = isMr && notice.title_mr ? notice.title_mr : (notice.title || notice.title_en || "Public Notice");
  const content = isMr && notice.content_mr ? notice.content_mr : (notice.content || notice.content_en || "Notice details not available.");
  const dateStr = formatDate(notice.publish_date || notice.created_at, isMr);
  const issuedBy = notice.issued_by || "Gram Panchayat Ugwa";
  const category = notice.category || notice.notice_type || "Public Notice";
  const isPinned = Boolean(notice.is_pinned);

  const titleEl = document.getElementById("modalNoticeTitle");
  const contentEl = document.getElementById("modalNoticeContent");
  const dateEl = document.getElementById("modalNoticeDate");
  const issuedEl = document.getElementById("modalNoticeIssuedBy");
  const catEl = document.getElementById("modalNoticeCategory");
  const pinnedEl = document.getElementById("modalNoticePinned");

  if (titleEl) titleEl.textContent = title;
  if (contentEl) contentEl.textContent = content;
  if (dateEl) dateEl.textContent = dateStr || (isMr ? "अद्यतनित" : "Published Recently");
  if (issuedEl) issuedEl.textContent = issuedBy;
  if (catEl) catEl.textContent = category;
  if (pinnedEl) pinnedEl.style.display = isPinned ? "inline-block" : "none";

  modal.hidden = false;
  modal.style.display = "flex";

  // Temporarily pause the ticker while reading notice details
  const trackEl = document.getElementById("tickerTrack");
  if (trackEl) trackEl.classList.add("is-paused");
}

export function closeNoticeDetailModal() {
  const modal = document.getElementById("publicNoticeDetailModal");
  if (modal) {
    modal.hidden = true;
    modal.style.display = "none";
  }

  // Resume ticker if not manually paused by user toggle
  const trackEl = document.getElementById("tickerTrack");
  if (trackEl && !isPausedByUser) {
    trackEl.classList.remove("is-paused");
  }
}

/**
 * Initializes ticker event controls, touch gestures, and detail modals
 */
export function initNoticeTicker() {
  if (isInitialized) return;
  isInitialized = true;

  const trackEl = document.getElementById("tickerTrack");
  const viewportEl = document.getElementById("tickerViewport");
  const btnToggle = document.getElementById("btnTickerToggle");
  const btnPrev = document.getElementById("btnTickerPrev");
  const btnNext = document.getElementById("btnTickerNext");
  const toggleIcon = document.getElementById("tickerToggleIcon");

  // Toggle Pause / Resume
  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      isPausedByUser = !isPausedByUser;
      if (trackEl) {
        if (isPausedByUser) {
          trackEl.classList.add("is-paused");
          if (toggleIcon) toggleIcon.textContent = "▶️";
          btnToggle.title = getLanguage() === "mr" ? "सुरू करा" : "Resume Ticker";
          btnToggle.setAttribute("aria-label", "Resume Ticker");
        } else {
          trackEl.classList.remove("is-paused");
          if (toggleIcon) toggleIcon.textContent = "⏸️";
          btnToggle.title = getLanguage() === "mr" ? "थांबवा" : "Pause Ticker";
          btnToggle.setAttribute("aria-label", "Pause Ticker");
        }
      }
    });
  }

  // Previous Button
  if (btnPrev && viewportEl) {
    btnPrev.addEventListener("click", () => {
      viewportEl.scrollBy({ left: -260, behavior: "smooth" });
    });
  }

  // Next Button
  if (btnNext && viewportEl) {
    btnNext.addEventListener("click", () => {
      viewportEl.scrollBy({ left: 260, behavior: "smooth" });
    });
  }

  // Click handler on track for individual notice items
  if (trackEl) {
    trackEl.addEventListener("click", (e) => {
      const item = e.target.closest(".ticker-item");
      if (item && item.dataset.noticeId) {
        e.preventDefault();
        openNoticeDetail(item.dataset.noticeId);
      }
    });
  }

  // Detail Modal Controls
  const btnClose = document.getElementById("btnCloseNoticeDetailModal");
  const btnCancel = document.getElementById("btnCancelNoticeDetailModal");
  const modal = document.getElementById("publicNoticeDetailModal");
  const btnViewAllModal = document.getElementById("btnNoticeModalViewAll");

  if (btnClose) btnClose.addEventListener("click", closeNoticeDetailModal);
  if (btnCancel) btnCancel.addEventListener("click", closeNoticeDetailModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeNoticeDetailModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden && modal.style.display !== "none") {
      closeNoticeDetailModal();
    }
  });

  if (btnViewAllModal) {
    btnViewAllModal.addEventListener("click", () => {
      closeNoticeDetailModal();
    });
  }

  // Initial render
  renderNoticeTicker();
}

// Global hook so admin notice publishing or deletion can trigger immediate ticker refresh
if (typeof window !== "undefined") {
  window.renderNoticeTicker = renderNoticeTicker;
}
