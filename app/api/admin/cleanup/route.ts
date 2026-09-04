import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';
import { AuditLog } from '@/models/AuditLog';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    await connectToDatabase();

    if (action === 'purge-deleted-transactions') {
      const result = await Transaction.deleteMany({ status: 'deleted' });
      await AuditLog.create({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'PURGE_DELETED_TRANSACTIONS',
        reason: String(body.reason || 'Manager cleanup'),
        metadata: { deletedCount: result.deletedCount },
      });
      return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    }

    if (action === 'purge-all-transactions') {
      if (body.confirmation !== 'DELETE ALL TRANSACTIONS') {
        return NextResponse.json({ success: false, error: 'Exact confirmation is required.' }, { status: 400 });
      }
      const result = await Transaction.deleteMany({});
      await AuditLog.create({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'PURGE_ALL_TRANSACTIONS',
        reason: String(body.reason || 'Manager database cleanup'),
        metadata: { deletedCount: result.deletedCount, warning: 'Audit logs were preserved.' },
      });
      return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    }

    return NextResponse.json({ success: false, error: 'Unknown cleanup action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to clean database.' }, { status: 500 });
  }
}
