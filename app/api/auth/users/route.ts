import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/Auth';

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({ active: true }, { name: 1, role: 1 }).sort({ role: 1, name: 1 }).lean();
    return NextResponse.json({ users: users.map((user) => ({ id: String(user._id), name: user.name, role: user.role })) });
  } catch (error) {
    console.error('GET /api/auth/users failed:', error);
    return NextResponse.json({ error: 'Unable to load login accounts.' }, { status: 500 });
  }
}
