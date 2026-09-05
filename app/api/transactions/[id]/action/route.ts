import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';
import { AuditLog } from '@/models/AuditLog';
import { InventoryItem } from '@/models/InventoryItem';
import { InventoryMovement } from '@/models/InventoryMovement';

function getServiceQuantities(services: Array<{ id: string }> = []) {
  const quantities = new Map<string, number>();
  for (const service of services) {
    quantities.set(service.id, (quantities.get(service.id) || 0) + 1);
  }
  return quantities;
}

async function getInventoryDeductions(
  serviceQuantities: Map<string, number>,
  session: mongoose.ClientSession,
) {
  const serviceIds = [...serviceQuantities.keys()];
  const items = await InventoryItem.find({
    active: true,
    'usage.serviceId': { $in: serviceIds },
  }).session(session);

  const deductions = new Map<string, { item: typeof items[number]; quantity: number }>();

  for (const item of items) {
    let required = 0;
    for (const usage of item.usage || []) {
      const count = serviceQuantities.get(usage.serviceId) || 0;
      required += count * Number(usage.quantity || 0);
    }
    if (required > 0) {
      deductions.set(String(item._id), { item, quantity: required });
    }
  }

  return deductions;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ success: false, error: 'Invalid transaction ID.' }, { status: 400 });

    const body = await req.json();
    const action = body.action;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!['void', 'restore', 'delete'].includes(action) || !reason) {
      return NextResponse.json({ success: false, error: 'Action and reason are required.' }, { status: 400 });
    }

    await connectToDatabase();
    const session = await mongoose.startSession();
    let result: { transaction: unknown } | null = null;

    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findById(id).session(session);
        if (!transaction) throw new Error('TRANSACTION_NOT_FOUND');

        const previousStatus = transaction.status;
        let newStatus = previousStatus;

        if (action === 'void') {
          if (previousStatus !== 'completed') throw new Error('ONLY_COMPLETED_CAN_VOID');

          const serviceQuantities = getServiceQuantities(transaction.services || []);
          const deductions = await getInventoryDeductions(serviceQuantities, session);

          for (const { item, quantity } of deductions.values()) {
            const before = Number(item.quantity);
            const after = before + quantity;
            item.quantity = after;
            await item.save({ session });

            await InventoryMovement.create([{
              itemId: item._id,
              itemName: item.name,
              type: 'void',
              quantity,
              beforeQuantity: before,
              afterQuantity: after,
              transactionId: transaction._id,
              transactionNo: transaction.transactionNo,
              userId: user.id,
              reason,
            }], { session });
          }

          transaction.status = 'voided';
          transaction.voidedBy = user.id;
          transaction.voidedAt = new Date();
          transaction.voidReason = reason;
          newStatus = 'voided';
        } else if (action === 'restore') {
          if (previousStatus !== 'voided') throw new Error('ONLY_VOIDED_CAN_RESTORE');

          const serviceQuantities = getServiceQuantities(transaction.services || []);
          const deductions = await getInventoryDeductions(serviceQuantities, session);

          for (const { item, quantity } of deductions.values()) {
            if (Number(item.quantity) < quantity) {
              throw new Error(`RESTORE_INVENTORY_SHORTAGE:${item.name}:${item.quantity}:${quantity}`);
            }
          }

          for (const { item, quantity } of deductions.values()) {
            const before = Number(item.quantity);
            const after = before - quantity;
            item.quantity = after;
            await item.save({ session });
            await InventoryMovement.create([{
              itemId: item._id,
              itemName: item.name,
              type: 'restore',
              quantity: -quantity,
              beforeQuantity: before,
              afterQuantity: after,
              transactionId: transaction._id,
              transactionNo: transaction.transactionNo,
              userId: user.id,
              reason,
            }], { session });
          }

          transaction.status = 'completed';
          transaction.voidedBy = undefined;
          transaction.voidedAt = undefined;
          transaction.voidReason = undefined;
          newStatus = 'completed';
        } else {
          if (previousStatus === 'deleted') throw new Error('ALREADY_DELETED');
          transaction.status = 'deleted';
          transaction.deletedBy = user.id;
          transaction.deletedAt = new Date();
          transaction.deleteReason = reason;
          newStatus = 'deleted';
        }

        await transaction.save({ session });
        await AuditLog.create([{
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: action.toUpperCase() + '_TRANSACTION',
          transactionId: transaction._id,
          transactionNo: transaction.transactionNo,
          reason,
          previousStatus,
          newStatus,
        }], { session });

        result = { transaction: transaction.toObject() };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'TRANSACTION_NOT_FOUND') return NextResponse.json({ success: false, error: 'Transaction not found.' }, { status: 404 });
      if (message === 'ONLY_COMPLETED_CAN_VOID') return NextResponse.json({ success: false, error: 'Only completed transactions can be voided.' }, { status: 409 });
      if (message === 'ONLY_VOIDED_CAN_RESTORE') return NextResponse.json({ success: false, error: 'Only voided transactions can be restored.' }, { status: 409 });
      if (message === 'ALREADY_DELETED') return NextResponse.json({ success: false, error: 'Transaction is already deleted.' }, { status: 409 });
      if (message.startsWith('RESTORE_INVENTORY_SHORTAGE:')) {
        const [, itemName, available, required] = message.split(':');
        return NextResponse.json({ success: false, error: `Cannot restore transaction because ${itemName} has insufficient stock (${available} available, ${required} required).` }, { status: 409 });
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, ...(result || {}) });
  } catch (error) {
    console.error('[Transaction Action API] Failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update transaction.' }, { status: 500 });
  }
}
