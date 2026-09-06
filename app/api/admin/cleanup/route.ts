import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';
import { AuditLog } from '@/models/AuditLog';
import { Queue } from '@/models/Queue';
import { Customer } from '@/models/Customer';
import { InventoryItem } from '@/models/InventoryItem';
import { InventoryMovement } from '@/models/InventoryMovement';
import { Shift } from '@/models/Shift';
import { Promo } from '@/models/Promo';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

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

    if (action === 'reset-test-database') {
      if (body.confirmation !== 'RESET TEST DATABASE') {
        return NextResponse.json({ success: false, error: 'Exact confirmation is required.' }, { status: 400 });
      }

      const results = await Promise.all([
        Transaction.deleteMany({}),
        Queue.deleteMany({}),
        Customer.deleteMany({}),
        InventoryItem.deleteMany({}),
        InventoryMovement.deleteMany({}),
        Shift.deleteMany({}),
        Promo.deleteMany({}),
        AuditLog.deleteMany({}),
      ]);

      const [transactions, queue, customers, inventoryItems, inventoryMovements, shifts, promos] = results;
      await AuditLog.create({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'RESET_TEST_DATABASE',
        reason: String(body.reason || 'Manager reset test database'),
        metadata: {
          preserved: ['users', 'system settings'],
          deleted: {
            transactions: transactions.deletedCount,
            queue: queue.deletedCount,
            customers: customers.deletedCount,
            inventoryItems: inventoryItems.deletedCount,
            inventoryMovements: inventoryMovements.deletedCount,
            shifts: shifts.deletedCount,
            promos: promos.deletedCount,
            auditLogsBeforeReset: 'cleared',
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Test database reset successfully. Users and system settings were preserved.',
        deleted: {
          transactions: transactions.deletedCount,
          queue: queue.deletedCount,
          customers: customers.deletedCount,
          inventoryItems: inventoryItems.deletedCount,
          inventoryMovements: inventoryMovements.deletedCount,
          shifts: shifts.deletedCount,
          promos: promos.deletedCount,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown cleanup action.' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/cleanup failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to clean database.' }, { status: 500 });
  }
}
