import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/Auth';
import { createSession, verifyPin } from '@/lib/auth';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const validPin = verifyPin(pin, user.pinHash);
    if (!validPin) {
      const failedPinAttempts = Number(user.failedPinAttempts || 0) + 1;
      if (failedPinAttempts >= MAX_FAILED_ATTEMPTS) {
        user.failedPinAttempts = 0;
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        await user.save();
        return NextResponse.json(
          { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' },
          { status: 429 },
        );
      }

      user.failedPinAttempts = failedPinAttempts;
      await user.save();
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.failedPinAttempts || user.lockedUntil) {
      user.failedPinAttempts = 0;
      user.lockedUntil = null;
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
