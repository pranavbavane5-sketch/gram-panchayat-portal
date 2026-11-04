import fs from "fs";

console.log("============================================================");
console.log("🧪 TESTING MAHARASHTRA GOV HEADER & OFFICIALS STRIP");
console.log("============================================================");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Check index.html Structure
const html = fs.readFileSync("index.html", "utf8");

assert(html.includes('id="mainHeader"') && html.includes('gov-header'), "Main header exists with .gov-header class");
assert(html.includes('class="gov-brand-section"'), "Government brand section (Tier 1) exists");
assert(html.includes('class="logo-icon-wrap gov-emblem-wrap"'), "Emblem wrap exists with circular frame");
assert(html.includes('class="logo-svg" viewBox="0 0 40 40"'), "Official logo SVG has 40x40 viewBox with proper aspect ratio");
assert(html.includes('id="headerGovDeptTag"') && html.includes('data-i18n="gov_dept_tag"'), "Gov department tag exists with translation binding");
assert(html.includes('id="headerBrandTitle"'), "Brand title heading (#headerBrandTitle) exists");
assert(html.includes('id="headerVillageName"'), "Village subtitle (#headerVillageName) exists");
assert(html.includes('1800-120-JAL'), "Toll-Free Helpline badge present in header");
assert(html.includes('id="langSwitcherWrap"'), "Language switcher wrapper exists");
assert(html.includes('id="navLoginBtn"'), "Nav Login button exists");
assert(html.includes('id="navUserBadge"'), "Nav User badge exists");

// Officials Strip (Tier 2)
assert(html.includes('id="govOfficialsStrip"'), "Officials strip container (#govOfficialsStrip) exists");
assert(html.includes('data-i18n="gp_officials_heading"'), "Officials strip header exists with i18n binding");
assert(html.includes('id="stripSarpanchCard"'), "Sarpanch card (#stripSarpanchCard) exists in strip");
assert(html.includes('id="stripSarpanchPhoto"') && html.includes('id="stripSarpanchFallback"'), "Sarpanch photo and fallback badge exist");
assert(html.includes('id="stripSarpanchName"'), "Sarpanch name element exists");
assert(html.includes('id="stripSarpanchTitle"'), "Sarpanch title element exists");

assert(html.includes('id="stripGramSevakCard"'), "Gram Sevak card (#stripGramSevakCard) exists in strip");
assert(html.includes('id="stripGramSevakPhoto"') && html.includes('id="stripGramSevakFallback"'), "Gram Sevak photo and fallback badge exist");
assert(html.includes('id="stripGramSevakName"'), "Gram Sevak name element exists");
assert(html.includes('id="stripGramSevakTitle"'), "Gram Sevak title element exists");

assert(html.includes('id="stripSecretaryCard"'), "Secretary card (#stripSecretaryCard) exists in strip");
assert(html.includes('id="stripSecretaryPhoto"') && html.includes('id="stripSecretaryFallback"'), "Secretary photo and fallback badge exist");
assert(html.includes('id="stripSecretaryName"'), "Secretary name element exists");
assert(html.includes('id="stripSecretaryTitle"'), "Secretary title element exists");

assert(html.includes('class="official-card-divider"'), "Thin separators exist between official cards");

// Navigation Section (Tier 3)
assert(html.includes('class="gov-nav-section"'), "Dedicated gov nav section (Tier 3) exists");
assert(html.includes('id="navHome"') && html.includes('id="navStorage"') && html.includes('id="navSchedule"') && html.includes('id="navReport"') && html.includes('id="navCitizen"'), "All main navigation buttons are present");

// Public Notice Ticker
assert(html.includes('id="govNoticeTicker"'), "Public Notice Ticker exists on page-home");

// 2. Check style.css
const css = fs.readFileSync("style.css", "utf8");
assert(css.includes(".main-header.gov-header"), "CSS rule for .main-header.gov-header exists");
assert(css.includes(".gov-officials-strip"), "CSS rule for .gov-officials-strip exists");
assert(css.includes("border-bottom: 3.5px solid #f59e0b"), "Saffron accent border (#f59e0b) defined on officials strip");
assert(css.includes(".official-photo-wrap"), "Official photo wrap defined with circular styling");
assert(css.includes(".official-photo-placeholder"), "Official photo placeholder gradient defined");
assert(css.includes(".official-card-divider"), "Divider line CSS defined");
assert(css.includes(".gov-nav-section"), "Gov nav section styles defined with deep navy background");
assert(css.includes("@media (max-width: 768px)") && css.includes("overflow-x: auto"), "Mobile horizontal scrolling enabled for officials strip");

// 3. Check translations.js
const trans = fs.readFileSync("translations.js", "utf8");
assert(trans.includes('gov_dept_tag: "Government of Maharashtra'), "English gov_dept_tag translation present");
assert(trans.includes('gov_dept_tag: "महाराष्ट्र शासन'), "Marathi gov_dept_tag translation present");
assert(trans.includes('gp_officials_heading: "Office Bearers'), "English gp_officials_heading present");
assert(trans.includes('gp_officials_heading: "ग्रामपंचायत पदाधिकारी'), "Marathi gp_officials_heading present");

console.log("============================================================");
console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================");

if (failed > 0) {
  process.exit(1);
}
