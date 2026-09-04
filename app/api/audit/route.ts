import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });
    await connectToDatabase();
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ success: true, logs });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load audit logs.' }, { status: 500 });
  }
}
