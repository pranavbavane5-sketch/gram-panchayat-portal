import fs from "fs";

console.log("============================================================");
console.log("🧪 TESTING UGWA GRAM PANCHAYAT AUTHENTIC HEADER & HERO LAYOUT");
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

// Main White Top Header
assert(html.includes('id="mainHeader"') && html.includes('gp-official-header'), "Main header exists with .gp-official-header class");
assert(html.includes('class="gp-top-white-header"'), "Clean white header container (.gp-top-white-header) exists");
assert(html.includes('class="gp-identity-left"'), "Gram Panchayat identity section exists on the left");
assert(html.includes('id="headerBrandTitle"') && html.includes('उगवा ग्रामपंचायत'), "Devanagari title 'उगवा ग्रामपंचायत' exists");
assert(html.includes('id="headerBrandEnSub"') && html.includes('Gram Panchayat Ugwa'), "English subtitle 'Gram Panchayat Ugwa' exists");
assert(html.includes('id="headerVillageName"') && html.includes('तालुका: Akola • जिल्हा: Akola • महाराष्ट्र'), "Jurisdiction line contains Akola district & taluka");

// Strict Branding: Ensure "आपले सरकार" is NOT in the header
const headerSlice = html.substring(html.indexOf('id="mainHeader"'), html.indexOf('</header>'));
assert(!headerSlice.includes('आपले सरकार') && !headerSlice.includes('Aaple Sarkar'), "Strict branding: 'आपले सरकार' is NOT present in the header");

// Officials Profiles in Header (Right Side)
assert(html.includes('id="headerOfficialsRow"'), "Officials profile row (#headerOfficialsRow) exists in header");
assert(html.includes('id="headerOfficialSarpanch"'), "Sarpanch card (#headerOfficialSarpanch) exists");
assert(html.includes('id="headerSarpanchPhoto"') && html.includes('src="/sarpanch.jpg"'), "Sarpanch photo points to /sarpanch.jpg");
assert(html.includes('id="headerSarpanchName"'), "Sarpanch name element exists");
assert(html.includes('data-i18n="gp_sarpanch"'), "Sarpanch designation has i18n binding");

assert(html.includes('id="headerOfficialDeputy"'), "Deputy Sarpanch card (#headerOfficialDeputy) exists");
assert(html.includes('id="headerDeputyPhoto"') && html.includes('src="/deputy_sarpanch.jpg"'), "Deputy photo points to /deputy_sarpanch.jpg");
assert(html.includes('data-i18n="gp_deputy_sarpanch"'), "Deputy Sarpanch designation has i18n binding");

assert(html.includes('id="headerOfficialGramSevak"'), "Gram Sevak card (#headerOfficialGramSevak) exists");
assert(html.includes('id="headerGramSevakPhoto"') && html.includes('src="/gram_sevak.jpg"'), "Gram Sevak photo points to /gram_sevak.jpg");
assert(html.includes('data-i18n="gp_gram_sevak"'), "Gram Sevak designation has i18n binding");

assert(html.includes('id="headerOfficialOfficer"'), "IT/Info Officer card (#headerOfficialOfficer) exists");
assert(html.includes('id="headerOfficerPhoto"') && html.includes('src="/secretary.jpg"'), "Officer photo points to /secretary.jpg");
assert(html.includes('data-i18n="gp_it_officer"'), "Officer designation has i18n binding");

assert(html.includes('class="official-separator-line"'), "Subtle vertical separators exist between officials");

// Dark Navy Navigation Bar
assert(html.includes('id="gpNavBar"') && html.includes('gp-nav-bar'), "Dark navy navigation bar (#gpNavBar) exists");
assert(html.includes('id="navHome"') && html.includes('data-i18n="nav_home"'), "Home nav item exists");
assert(html.includes('id="navGpInfo"') && html.includes('data-i18n="nav_gp_info"'), "GP Info nav item exists");
assert(html.includes('id="navCitizen"') && html.includes('data-i18n="nav_citizen_services"'), "Citizen services nav item exists");
assert(html.includes('id="navStorage"') && html.includes('data-i18n="nav_schemes"'), "Schemes nav item exists");
assert(html.includes('id="navReport"') && html.includes('data-i18n="nav_reports"'), "Reports nav item exists");
assert(html.includes('id="navContact"') && html.includes('data-i18n="nav_contact"'), "Contact nav item exists");
assert(html.includes('id="langSwitcherWrap"'), "Language switcher wrap exists in nav bar");
assert(html.includes('id="navLoginBtn"'), "Login button exists in nav bar");

// Public Notice Ticker
assert(html.includes('id="govNoticeTicker"') && html.includes('data-i18n="ticker_public_notices"'), "Public Notice Ticker exists with i18n binding");

// Authentic Hero Section & Gram Panchayat Building Visual
assert(html.includes('id="gpWelcomeHero"') && html.includes('hero-card-v2'), "Hero section (#gpWelcomeHero) with 2-column card exists");
assert(html.includes('id="btnHeroServices"') && html.includes('data-i18n="hero_btn_services"'), "Hero Citizen Services button exists");
assert(html.includes('id="btnHeroComplaint"') && html.includes('data-i18n="hero_btn_complaint"'), "Hero Register Complaint button exists");
assert(html.includes('id="btnHeroTrack"') && html.includes('data-i18n="hero_btn_track"'), "Hero Track Application button exists");
assert(html.includes('src="/gp_building.jpg"'), "Hero section features authentic Gram Panchayat building image");

// 4 Frosted Contact Information Cards
assert(html.includes('id="gpContactStrip"') && html.includes('gp-contact-strip-v2'), "Contact strip (#gpContactStrip) exists");
assert(html.includes('id="gpOfficePhoneDisplay"'), "Office phone card element exists");
assert(html.includes('id="gpOfficeEmailDisplay"'), "Office email card element exists");
assert(html.includes('id="gpOfficeHoursDisplay"'), "Office hours card element exists");
assert(html.includes('id="gpOfficeAddressDisplay"'), "Office address card element exists");

// 2. Check Assets Existence in public/
assert(fs.existsSync("public/sarpanch.jpg"), "public/sarpanch.jpg exists");
assert(fs.existsSync("public/deputy_sarpanch.jpg"), "public/deputy_sarpanch.jpg exists");
assert(fs.existsSync("public/gram_sevak.jpg"), "public/gram_sevak.jpg exists");
assert(fs.existsSync("public/secretary.jpg"), "public/secretary.jpg exists");
assert(fs.existsSync("public/gp_building.jpg"), "public/gp_building.jpg exists");

// 3. Check style.css
const css = fs.readFileSync("style.css", "utf8");
assert(css.includes(".gp-official-header"), "CSS rule for .gp-official-header exists");
assert(css.includes(".gp-top-white-header"), "CSS rule for .gp-top-white-header exists");
assert(css.includes(".gp-header-officials-row"), "CSS rule for .gp-header-officials-row exists");
assert(css.includes(".gp-official-card"), "CSS rule for .gp-official-card exists");
assert(css.includes(".gp-nav-bar"), "CSS rule for .gp-nav-bar exists");
assert(css.includes(".gp-hero-section-v2"), "CSS rule for .gp-hero-section-v2 exists");
assert(css.includes(".hero-building-frame"), "CSS rule for .hero-building-frame exists");
assert(css.includes(".gp-contact-strip-v2"), "CSS rule for .gp-contact-strip-v2 exists");
assert(css.includes(".contact-card-v2"), "CSS rule for .contact-card-v2 exists");

// 4. Check translations.js
const trans = fs.readFileSync("translations.js", "utf8");
assert(trans.includes('nav_gp_info: "Panchayat Info"') && trans.includes('nav_gp_info: "ग्रामपंचायत माहिती"'), "nav_gp_info bilingual translation present");
assert(trans.includes('nav_citizen_services: "Citizen Services"') && trans.includes('nav_citizen_services: "नागरिक सेवा"'), "nav_citizen_services bilingual translation present");
assert(trans.includes('gp_deputy_sarpanch: "Deputy Sarpanch"') && trans.includes('gp_deputy_sarpanch: "उपसरपंच"'), "gp_deputy_sarpanch bilingual translation present");
assert(trans.includes('gp_it_officer: "IT & Info Officer"') && trans.includes('gp_it_officer: "माहिती तंत्रज्ञान अधिकारी"'), "gp_it_officer bilingual translation present");

console.log("============================================================");
console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("============================================================");

if (failed > 0) {
  process.exit(1);
}
