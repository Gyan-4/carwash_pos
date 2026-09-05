import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/Auth';
import { createSession, verifyPin } from '@/lib/auth';

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
      ...(trimmedName ? { name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } } : {}),
    });

    if (!user || !verifyPin(pin, user.pinHash)) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    await createSession(String(user._id));

    return NextResponse.json({
      success: true,
      user: { id: String(user._id), name: user.name, role: user.role },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to sign in.' }, { status: 500 });
  }
}
