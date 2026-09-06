import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/Auth';
import { createSession, verifyPin } from '@/lib/auth';

const MANAGER_LOCKOUT_AFTER_ATTEMPTS = 5;
const MANAGER_LOCKOUT_MINUTES = 15;
const DEFAULT_CASHIER_POLICY = {
  afterAttempts: 5,
  baseMinutes: 1,
  multiplier: 3,
  maxMinutes: 60,
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCashierLockoutMinutes(user: any) {
  const base = Math.max(1, Number(user.lockoutBaseMinutes || DEFAULT_CASHIER_POLICY.baseMinutes));
  const multiplier = Math.max(1, Number(user.lockoutMultiplier || DEFAULT_CASHIER_POLICY.multiplier));
  const max = Math.max(base, Number(user.lockoutMaxMinutes || DEFAULT_CASHIER_POLICY.maxMinutes));
  const level = Math.max(0, Number(user.lockoutLevel || 0));
  return Math.min(max, Math.round(base * Math.pow(multiplier, level)));
}

export async function POST(req: Request) {
  try {
    const { role, pin, name } = await req.json();

    if (!['cashier', 'manager'].includes(role) || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 400 });
    }

    await connectToDatabase();
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const user = await User.findOne({
      role,
      active: true,
      ...(trimmedName ? { name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' } } : {}),
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
      return NextResponse.json(
        { success: false, error: `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.` },
        { status: 429 },
      );
    }

    if (user.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
      user.lockedUntil = null;
      await user.save();
    }

    const validPin = verifyPin(pin, user.pinHash);
    if (!validPin) {
      const failedPinAttempts = Number(user.failedPinAttempts || 0) + 1;
      const lockoutAfterAttempts = user.role === 'cashier'
        ? Math.max(1, Number(user.lockoutAfterAttempts || DEFAULT_CASHIER_POLICY.afterAttempts))
        : MANAGER_LOCKOUT_AFTER_ATTEMPTS;

      if (failedPinAttempts >= lockoutAfterAttempts) {
        const lockoutMinutes = user.role === 'cashier'
          ? getCashierLockoutMinutes(user)
          : MANAGER_LOCKOUT_MINUTES;
        user.failedPinAttempts = 0;
        user.lockoutLevel = user.role === 'cashier' ? Number(user.lockoutLevel || 0) + 1 : 0;
        user.lockedUntil = new Date(Date.now() + lockoutMinutes * 60000);
        await user.save();
        return NextResponse.json(
          { success: false, error: `Too many failed attempts. Account locked for ${lockoutMinutes} minute${lockoutMinutes === 1 ? '' : 's'}.` },
          { status: 429 },
        );
      }

      user.failedPinAttempts = failedPinAttempts;
      await user.save();
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.failedPinAttempts || user.lockedUntil || user.lockoutLevel) {
      user.failedPinAttempts = 0;
      user.lockedUntil = null;
      user.lockoutLevel = 0;
      await user.save();
    }

    await createSession(String(user._id));

    return NextResponse.json({
      success: true,
      user: { id: String(user._id), name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('POST /api/auth/login failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to sign in.' }, { status: 500 });
  }
}
