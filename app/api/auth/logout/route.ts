import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/auth/logout failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to sign out.' }, { status: 500 });
  }
}
