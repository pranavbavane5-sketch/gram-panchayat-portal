import { translations, t, formatStatus, formatUrgency, formatSupplyType, formatTankShape, formatMethod, translateErrorMessage } from './translations.js';
import fs from 'fs';

console.log('--- JalMitra i18n Verification Suite ---');

let errors = 0;
let warnings = 0;

// 1. Check dictionary parity between English and Marathi
const enKeys = Object.keys(translations.en);
const mrKeys = Object.keys(translations.mr);

console.log(`Total English keys: ${enKeys.length}`);
console.log(`Total Marathi keys: ${mrKeys.length}`);

const missingInMr = enKeys.filter(k => !(k in translations.mr));
const missingInEn = mrKeys.filter(k => !(k in translations.en));

if (missingInMr.length > 0) {
  console.error(`ERROR: Missing Marathi keys (${missingInMr.length}):`, missingInMr);
  errors += missingInMr.length;
} else {
  console.log('✓ All English keys exist in Marathi dictionary.');
}

if (missingInEn.length > 0) {
  console.warn(`WARNING: Missing English keys (${missingInEn.length}):`, missingInEn);
  warnings += missingInEn.length;
}

// Check for empty string or null values
enKeys.forEach(k => {
  if (translations.en[k] === undefined || translations.en[k] === null || translations.en[k] === '') {
    console.error(`ERROR: English key "${k}" has empty value.`);
    errors++;
  }
  if (translations.mr[k] === undefined || translations.mr[k] === null || translations.mr[k] === '') {
    console.error(`ERROR: Marathi key "${k}" has empty value.`);
    errors++;
  }
});

// 2. Scan index.html for data-i18n attributes and verify they exist in dictionary
const indexHtml = fs.readFileSync('./index.html', 'utf8');

const i18nMatches = [...indexHtml.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
const i18nPlaceholderMatches = [...indexHtml.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map(m => m[1]);
const i18nHtmlMatches = [...indexHtml.matchAll(/data-i18n-html="([^"]+)"/g)].map(m => m[1]);

console.log(`\nFound in index.html:`);
console.log(`- ${i18nMatches.length} data-i18n tags`);
console.log(`- ${i18nPlaceholderMatches.length} data-i18n-placeholder tags`);
console.log(`- ${i18nHtmlMatches.length} data-i18n-html tags`);

const allHtmlKeys = new Set([...i18nMatches, ...i18nPlaceholderMatches, ...i18nHtmlMatches]);

let missingFromDict = [];
allHtmlKeys.forEach(key => {
  if (!translations.en[key] || !translations.mr[key]) {
    missingFromDict.push(key);
  }
});

if (missingFromDict.length > 0) {
  console.error(`ERROR: ${missingFromDict.length} keys in index.html missing from translations:`, missingFromDict);
  errors += missingFromDict.length;
} else {
  console.log(`✓ All ${allHtmlKeys.size} distinct keys used in index.html exist in translations.js!`);
}

// 3. Test helper formatting functions
console.log('\nTesting Helper Functions:');

// Status formatting
const statuses = ['active', 'inactive', 'pending', 'paid', 'unpaid', 'cleared', 'resolved', 'in progress', 'rejected', 'standby', 'delayed', 'verified live', 'needs update', 'pending measurement'];
statuses.forEach(s => {
  const enFmt = formatStatus(s, 'en');
  const mrFmt = formatStatus(s, 'mr');
  if (!enFmt || !mrFmt) {
    console.error(`ERROR: formatStatus failed for "${s}"`);
    errors++;
  }
});
console.log(`✓ formatStatus tested across ${statuses.length} statuses.`);

// Urgency formatting
const urgencies = ['low', 'medium', 'high', 'critical'];
urgencies.forEach(u => {
  const enFmt = formatUrgency(u, 'en');
  const mrFmt = formatUrgency(u, 'mr');
  if (!enFmt || !mrFmt) {
    console.error(`ERROR: formatUrgency failed for "${u}"`);
    errors++;
  }
});
console.log(`✓ formatUrgency tested across ${urgencies.length} urgencies.`);

// Error message translations
const sampleErrors = [
  'Invalid mobile number or password',
  'Citizen already registered with this phone number',
  'Tank not found or invalid ID',
  'All fields are required',
  'Network error occurred'
];
sampleErrors.forEach(err => {
  const tr = translateErrorMessage(err, 'mr');
  if (!tr) {
    console.error(`ERROR: translateErrorMessage returned empty for "${err}"`);
    errors++;
  }
});
console.log(`✓ translateErrorMessage tested successfully.`);

console.log(`\n--- Verification Summary ---`);
console.log(`Total Errors: ${errors}`);
console.log(`Total Warnings: ${warnings}`);

if (errors === 0) {
  console.log('SUCCESS: All translations and template bindings verified cleanly!');
  process.exit(0);
} else {
  console.error('FAILED: Errors detected.');
  process.exit(1);
}
