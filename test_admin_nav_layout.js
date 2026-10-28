/**
 * Test: Admin Navigation Structure & CSS Verification
 */
import fs from 'fs';
import path from 'path';

console.log("============================================================");
console.log("🧪 TESTING ADMIN NAVIGATION & RESPONSIVE LAYOUT");
console.log("============================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`✅ PASS: ${name} ${details ? `(${details})` : ""}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

// 1. Navigation Container Elements
assert(html.includes('id="adminNavContainer"'), "Admin Navigation Container element exists (#adminNavContainer)");
assert(html.includes('id="adminNavMobileBar"'), "Mobile navigation bar header exists (#adminNavMobileBar)");
assert(html.includes('id="adminNavActivePill"'), "Active section badge exists for mobile header (#adminNavActivePill)");
assert(html.includes('id="btnToggleAdminNavMenu"'), "Mobile navigation accordion toggle button exists (#btnToggleAdminNavMenu)");
assert(html.includes('id="adminSubnavBar"'), "Admin sub-navigation tabs bar exists (#adminSubnavBar)");

// 2. All 14 Admin Tabs Exist
const requiredTabs = [
  "dashboard",
  "services",
  "citizens",
  "properties",
  "sources",
  "bills",
  "taxes",
  "schedule",
  "complaints",
  "applications",
  "rti",
  "tasks",
  "notices",
  "reports"
];

let allTabsFound = true;
requiredTabs.forEach(tabKey => {
  const hasTab = html.includes(`data-admin-tab="${tabKey}"`);
  if (!hasTab) allTabsFound = false;
  assert(hasTab, `Admin tab '${tabKey}' is present and accessible`);
});
assert(allTabsFound, "All 14 required admin tabs are fully present");

// 3. All 14 Matching Tab Panes Exist
let allPanesFound = true;
requiredTabs.forEach(tabKey => {
  const paneId = `adminPane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`;
  const hasPane = html.includes(`id="${paneId}"`);
  if (!hasPane) allPanesFound = false;
  assert(hasPane, `Admin pane '#${paneId}' is present in DOM`);
});
assert(allPanesFound, "All 14 matching admin tab panes are fully present");

// 4. CSS Rules for Wrapping and Responsive Layout
assert(css.includes(".portal-subnav-bar.admin-subnav-bar"), "Dedicated CSS rule for .admin-subnav-bar exists");
assert(css.includes("flex-wrap: wrap"), "Multi-row wrapping (flex-wrap: wrap) enabled to prevent horizontal overflow");
assert(css.includes(".admin-nav-container"), "Admin nav card container styles present");
assert(css.includes("@media (max-width: 767px)"), "Mobile media query (< 768px) defined for responsive stacked/collapsible nav");
assert(css.includes(".admin-nav-container.is-menu-open"), "Collapsible menu toggling styles defined for mobile screens");

// 5. Manage Services Order UI Styles
assert(css.includes(".service-order-cell"), "Service order cell styles defined");
assert(css.includes(".service-order-pill"), "Service order pill badge defined");
assert(css.includes(".btn-order-btn"), "Service Move Up / Move Down arrow buttons defined");

console.log("\n============================================================");
console.log(`📊 ADMIN NAV TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================\n");

if (failed > 0) {
  process.exit(1);
}

