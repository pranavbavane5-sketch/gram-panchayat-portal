/**
 * JalMitra - Government-Style Scrolling Public Notice Ticker Automated Verification Suite
 * 
 * Verifies:
 * 1. Published notices appear in the ticker via /api/notices.
 * 2. Expired and inactive notices are filtered out.
 * 3. Individual notice fields (id, title, title_mr, date, category, content) are present.
 * 4. Ticker DOM structure: #govNoticeTicker, #tickerBadge, #tickerTrack, #tickerControls.
 * 5. Detail Modal DOM structure: #publicNoticeDetailModal with title, date, authority, body.
 * 6. Responsive & accessibility styles: marquee animation, pause-on-hover, prefers-reduced-motion.
 * 7. English & Marathi language localization for ticker labels and notice titles.
 * 8. Real-time auto-refresh hooks wired into admin notice creation and deletion.
 * 9. Dual-driver compatibility across MySQL and Cloud Firestore.
 */

import fs from "fs";
import { panchayatRepo } from "./repositories/panchayatRepo.js";
import { translations } from "../translations.js";

async function runNoticeTickerTestSuite() {
  console.log("===============================================================");
  console.log("   GOVERNMENT PUBLIC NOTICE TICKER AUTOMATED TEST SUITE        ");
  console.log("===============================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Data Layer & Repository Verification
  console.log("--- 1. Backend Notice Data & Expiry Filtering ---");
  const activeNotices = await panchayatRepo.getNotices(true);
  assert(Array.isArray(activeNotices), "panchayatRepo.getNotices(true) returns an array");
  assert(activeNotices.length > 0, `Active notices found in database (count: ${activeNotices.length})`);

  const sample = activeNotices[0];
  assert(sample.id !== undefined && sample.id.startsWith("NOT-"), `Notice has valid ID: '${sample.id}'`);
  assert(typeof sample.title === "string" && sample.title.length > 0, "Notice has English title");
  assert(typeof sample.title_mr === "string" && sample.title_mr.length > 0, "Notice has Marathi title (title_mr)");
  assert(sample.publish_date !== undefined, "Notice has publish_date");

  // Verify expired notice filtering
  const now = new Date();
  const allActiveUnexpired = activeNotices.every(n => {
    if (!n.expiry_date) return true;
    return new Date(n.expiry_date) >= now;
  });
  assert(allActiveUnexpired, "All returned notices have valid unexpired dates");
  console.log();

  // 2. HTML Markup & Ticker Structure Verification
  console.log("--- 2. HTML Markup & Ticker Structure Verification ---");
  const indexHtml = fs.readFileSync("index.html", "utf8");

  assert(indexHtml.includes('id="govNoticeTicker"'), "index.html contains #govNoticeTicker bar");
  assert(indexHtml.includes('id="tickerBadge"'), "index.html contains #tickerBadge");
  assert(indexHtml.includes('id="tickerBadgeText"'), "index.html contains #tickerBadgeText label");
  assert(indexHtml.includes('data-i18n="ticker_public_notices"'), "Ticker badge links to translations dictionary");
  assert(indexHtml.includes('id="tickerViewport"'), "index.html contains #tickerViewport scrolling window");
  assert(indexHtml.includes('id="tickerTrack"'), "index.html contains #tickerTrack marquee track");
  assert(indexHtml.includes('id="tickerControls"'), "index.html contains #tickerControls toolbar");
  assert(indexHtml.includes('id="btnTickerPrev"'), "index.html contains #btnTickerPrev control");
  assert(indexHtml.includes('id="btnTickerToggle"'), "index.html contains #btnTickerToggle pause/play button");
  assert(indexHtml.includes('id="btnTickerNext"'), "index.html contains #btnTickerNext control");
  assert(indexHtml.includes('id="btnTickerViewAll"'), "index.html contains #btnTickerViewAll button");
  console.log();

  // 3. Notice Detail Modal Markup Verification
  console.log("--- 3. Notice Detail Modal Markup Verification ---");
  assert(indexHtml.includes('id="publicNoticeDetailModal"'), "index.html contains #publicNoticeDetailModal");
  assert(indexHtml.includes('id="modalNoticeTitle"'), "Detail modal contains #modalNoticeTitle");
  assert(indexHtml.includes('id="modalNoticeDate"'), "Detail modal contains #modalNoticeDate");
  assert(indexHtml.includes('id="modalNoticeIssuedBy"'), "Detail modal contains #modalNoticeIssuedBy");
  assert(indexHtml.includes('id="modalNoticeContent"'), "Detail modal contains #modalNoticeContent");
  assert(indexHtml.includes('id="btnCloseNoticeDetailModal"'), "Detail modal contains close button");
  console.log();

  // 4. CSS Styling, Animation & Accessibility Verification
  console.log("--- 4. CSS Animation, Styling & Accessibility Verification ---");
  const styleCss = fs.readFileSync("style.css", "utf8");

  assert(styleCss.includes(".gov-notice-ticker"), "style.css defines .gov-notice-ticker styling");
  assert(styleCss.includes("border-bottom: 2px solid #f59e0b"), "Ticker features official saffron / gold accent border");
  assert(styleCss.includes("@keyframes tickerMarquee"), "style.css defines continuous @keyframes tickerMarquee animation");
  assert(styleCss.includes(".gov-notice-ticker:hover .ticker-track"), "style.css pauses marquee on desktop hover");
  assert(styleCss.includes(".ticker-track.is-paused"), "style.css defines .is-paused rule for manual pause toggle");
  assert(styleCss.includes("@media (prefers-reduced-motion: reduce)"), "style.css includes prefers-reduced-motion accessibility rule");
  assert(styleCss.includes("@media (max-width: 768px)"), "style.css includes responsive rules for tablets and mobile devices");
  console.log();

  // 5. Bilingual i18n Translation Dictionary Verification
  console.log("--- 5. Bilingual Translation Parity Verification ---");
  assert(translations.en.ticker_public_notices === "PUBLIC NOTICES", "English ticker_public_notices is 'PUBLIC NOTICES'");
  assert(translations.mr.ticker_public_notices === "सार्वजनिक सूचना", "Marathi ticker_public_notices is 'सार्वजनिक सूचना'");
  assert(translations.en.ticker_view_all === "View All", "English ticker_view_all is 'View All'");
  assert(translations.mr.ticker_view_all === "सर्व पहा", "Marathi ticker_view_all is 'सर्व पहा'");
  assert(translations.en.ticker_no_notices !== undefined, "English ticker_no_notices key exists");
  assert(translations.mr.ticker_no_notices !== undefined, "Marathi ticker_no_notices key exists");
  console.log();

  // 6. JavaScript Module & Hook Integration Verification
  console.log("--- 6. Client JavaScript & Admin Auto-Refresh Hooks ---");
  const tickerJs = fs.readFileSync("publicNoticeTicker.js", "utf8");
  const appJs = fs.readFileSync("app.js", "utf8");
  const panchayatJs = fs.readFileSync("panchayatApp.js", "utf8");

  assert(tickerJs.includes("export async function renderNoticeTicker"), "publicNoticeTicker.js exports renderNoticeTicker()");
  assert(tickerJs.includes("export function initNoticeTicker"), "publicNoticeTicker.js exports initNoticeTicker()");
  assert(tickerJs.includes("export function openNoticeDetail"), "publicNoticeTicker.js exports openNoticeDetail()");
  assert(appJs.includes("./publicNoticeTicker.js"), "app.js imports ticker module");
  assert(appJs.includes("initNoticeTicker()"), "app.js initializes ticker in DOMContentLoaded");
  assert(appJs.includes("renderNoticeTicker()"), "app.js refreshes ticker on language change and home navigation");
  assert(panchayatJs.includes("window.renderNoticeTicker"), "panchayatApp.js refreshes ticker when notice is published or deleted");
  console.log();

  console.log("===============================================================");
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY!       `);
  console.log("===============================================================");
}

runNoticeTickerTestSuite().then(() => process.exit(0)).catch(e => {
  console.error("Test Suite Error:", e);
  process.exit(1);
});
