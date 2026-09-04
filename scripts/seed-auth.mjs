import mongoose from 'mongoose';
import crypto from 'node:crypto';

const uri = process.env.MONGODB_URI;
const cashierPin = process.env.CASHIER_PIN;
const managerPin = process.env.MANAGER_PIN;

if (!uri || !/^\d{4}$/.test(cashierPin || '') || !/^\d{4}$/.test(managerPin || '')) {
  console.error('Set MONGODB_URI, CASHIER_PIN, and MANAGER_PIN (each PIN must be 4 digits).');
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

await mongoose.connect(uri);

await User.findOneAndUpdate(
  { role: 'cashier' },
  { name: 'Cashier Station 1', role: 'cashier', pinHash: hashPin(cashierPin), active: true },
  { upsert: true, new: true }
);

await User.findOneAndUpdate(
  { role: 'manager' },
  { name: "Mr. DM (Owner)", role: 'manager', pinHash: hashPin(managerPin), active: true },
  { upsert: true, new: true }
);

console.log('Authentication users created/updated successfully.');
await mongoose.disconnect();
