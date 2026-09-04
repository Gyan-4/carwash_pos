import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';
import { AuditLog } from '@/models/AuditLog';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const action = body.action;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!['void', 'restore', 'delete'].includes(action) || !reason) {
      return NextResponse.json({ success: false, error: 'Action and reason are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const transaction = await Transaction.findById(id);
    if (!transaction) return NextResponse.json({ success: false, error: 'Transaction not found.' }, { status: 404 });

    const previousStatus = transaction.status;
    let newStatus = previousStatus;

    if (action === 'void') {
      if (previousStatus !== 'completed') return NextResponse.json({ success: false, error: 'Only completed transactions can be voided.' }, { status: 409 });
      transaction.status = 'voided';
      transaction.voidedBy = user.id;
      transaction.voidedAt = new Date();
      transaction.voidReason = reason;
      newStatus = 'voided';
    } else if (action === 'restore') {
      if (previousStatus !== 'voided') return NextResponse.json({ success: false, error: 'Only voided transactions can be restored.' }, { status: 409 });
      transaction.status = 'completed';
      transaction.voidedBy = undefined;
      transaction.voidedAt = undefined;
      transaction.voidReason = undefined;
      newStatus = 'completed';
    } else {
      if (previousStatus === 'deleted') return NextResponse.json({ success: false, error: 'Transaction is already deleted.' }, { status: 409 });
      transaction.status = 'deleted';
      transaction.deletedBy = user.id;
      transaction.deletedAt = new Date();
      transaction.deleteReason = reason;
      newStatus = 'deleted';
    }

    await transaction.save();
    await AuditLog.create({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: action.toUpperCase() + '_TRANSACTION',
      transactionId: transaction._id,
      transactionNo: transaction.transactionNo,
      reason,
      previousStatus,
      newStatus,
    });

    return NextResponse.json({ success: true, transaction });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update transaction.' }, { status: 500 });
  }
}
