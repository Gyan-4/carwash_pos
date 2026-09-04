import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile('.env.local');
} catch (error) {
  console.error('Could not load .env.local. Make sure the file exists in the project root.');
  console.error(error?.message || error);
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const cashierPin = process.env.CASHIER_PIN;
const managerPin = process.env.MANAGER_PIN;

if (!uri || !/^\d{4}$/.test(cashierPin || '') || !/^\d{4}$/.test(managerPin || '')) {
  console.error('Invalid environment configuration. Check .env.local for MONGODB_URI, CASHIER_PIN, and MANAGER_PIN.');
  process.exit(1);
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pin, salt, 64);
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

const UserSchema = new mongoose.Schema({
  name: String,
  role: { type: String, enum: ['cashier', 'manager'] },
  pinHash: String,
  active: { type: Boolean, default: true },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  await User.findOneAndUpdate(
    { role: 'cashier' },
    { name: 'Cashier Station 1', role: 'cashier', pinHash: hashPin(cashierPin), active: true },
    { upsert: true, new: true }
  );

  await User.findOneAndUpdate(
    { role: 'manager' },
    { name: 'Mr. DM (Owner)', role: 'manager', pinHash: hashPin(managerPin), active: true },
    { upsert: true, new: true }
  );

  console.log('Authentication users created/updated successfully.');
} catch (error) {
  console.error('Could not connect to MongoDB Atlas or seed users.');
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
