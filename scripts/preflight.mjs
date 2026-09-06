import { loadEnvFile } from 'node:process';

const production = process.env.NODE_ENV === 'production';

try {
  loadEnvFile('.env.local');
} catch {
  // Vercel/CI supplies environment variables directly; local preflight may not have .env.local.
}

const required = [
  ['MONGODB_URI', process.env.MONGODB_URI],
  ['CASHIER_PIN', process.env.CASHIER_PIN],
  ['MANAGER_PIN', process.env.MANAGER_PIN],
];

const missing = required.filter(([, value]) => !String(value || '').trim()).map(([name]) => name);
const invalidPins = [
  ['CASHIER_PIN', process.env.CASHIER_PIN],
  ['MANAGER_PIN', process.env.MANAGER_PIN],
].filter(([, value]) => value !== undefined && !/^\d{4}$/.test(String(value))).map(([name]) => name);

const placeholderPatterns = [
  /CHANGE_ME/i,
  /USERNAME/i,
  /PASSWORD/i,
  /CLUSTER/i,
  /DATABASE/i,
  /your[-_ ]/i,
  /example/i,
  /replace/i,
];

const placeholderVars = required
  .filter(([, value]) => placeholderPatterns.some((pattern) => pattern.test(String(value || ''))))
  .map(([name]) => name);

const errors = [];
if (missing.length) errors.push(`Missing required environment variables: ${missing.join(', ')}`);
if (invalidPins.length) errors.push(`PINs must be exactly 4 digits: ${invalidPins.join(', ')}`);
if (placeholderVars.length) errors.push(`Placeholder/default environment values detected: ${placeholderVars.join(', ')}`);

if (production && placeholderVars.length) {
  errors.push('Production deployment cannot use placeholder credentials.');
}

if (errors.length) {
  console.error('Production preflight failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Environment preflight passed (${production ? 'production' : 'development'}).`);
