import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';

const SESSION_COOKIE = 'carwash_session';

export async function GET() {
  try {
    // Avoid a MongoDB connection when the browser has no session at all.
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
