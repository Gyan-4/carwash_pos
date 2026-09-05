import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { InventoryItem } from '@/models/InventoryItem';
import { InventoryMovement } from '@/models/InventoryMovement';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    await connectToDatabase();
    const itemId = new URL(req.url).searchParams.get('itemId');
    const filter = itemId && mongoose.isValidObjectId(itemId) ? { itemId } : {};
    const movements = await InventoryMovement.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json({ success: true, movements });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load inventory history.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    const body = await req.json();
    const itemId = String(body.itemId || '');
    const type = body.type === 'restock' || body.type === 'adjustment' ? body.type : null;
    const quantity = Number(body.quantity);
    const reason = String(body.reason || '').trim();
    if (!mongoose.isValidObjectId(itemId)) return NextResponse.json({ success: false, error: 'Valid inventory item is required.' }, { status: 400 });
    if (!type) return NextResponse.json({ success: false, error: 'Invalid movement type.' }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity === 0) return NextResponse.json({ success: false, error: 'Quantity must be a non-zero number.' }, { status: 400 });
    if (type === 'restock' && quantity < 0) return NextResponse.json({ success: false, error: 'Restock quantity must be positive.' }, { status: 400 });
    if (!reason) return NextResponse.json({ success: false, error: 'A reason is required.' }, { status: 400 });

    await connectToDatabase();
    const session = await mongoose.startSession();
    let movement: any;
    try {
      await session.withTransaction(async () => {
        const item = await InventoryItem.findOne({ _id: itemId, active: true }).session(session);
        if (!item) throw new Error('ITEM_NOT_FOUND');
        const before = Number(item.quantity);
        const after = before + quantity;
        if (after < 0) throw new Error(`INSUFFICIENT_STOCK:${before}`);
        item.quantity = after;
        await item.save({ session });
        const created = await InventoryMovement.create([{
          itemId: item._id,
          itemName: item.name,
          type,
          quantity,
          beforeQuantity: before,
          afterQuantity: after,
          userId: user.id,
          reason,
        }], { session });
        movement = created[0];
      });
    } catch (error: any) {
      if (error?.message === 'ITEM_NOT_FOUND') return NextResponse.json({ success: false, error: 'Inventory item not found or inactive.' }, { status: 404 });
      if (String(error?.message || '').startsWith('INSUFFICIENT_STOCK:')) return NextResponse.json({ success: false, error: `Adjustment would make stock negative. Available stock: ${String(error.message).split(':')[1]}.` }, { status: 409 });
      throw error;
    } finally {
      await session.endSession();
    }
    return NextResponse.json({ success: true, movement }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to record inventory movement.' }, { status: 500 });
  }
}
