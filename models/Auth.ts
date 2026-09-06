import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['cashier', 'manager'], required: true },
  pinHash: { type: String, required: true },
  active: { type: Boolean, default: true },
  failedPinAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lockoutLevel: { type: Number, default: 0 },
  lockoutAfterAttempts: { type: Number, default: 5, min: 1, max: 20 },
  lockoutBaseMinutes: { type: Number, default: 1, min: 1, max: 1440 },
  lockoutMultiplier: { type: Number, default: 3, min: 1, max: 10 },
  lockoutMaxMinutes: { type: Number, default: 60, min: 1, max: 10080 },
}, { timestamps: true });

const SessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
