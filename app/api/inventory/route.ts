import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { InventoryItem } from '@/models/InventoryItem';

async function manager() {
  const user = await getAuthenticatedUser();
  return user && user.role === 'manager' ? user : null;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const items = await InventoryItem.find().sort({ active: -1, name: 1 }).lean();
    return NextResponse.json({ success: true, items });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load inventory.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await manager();
    if (!user) return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    const body = await req.json();
    if (!body.name || !body.unit) return NextResponse.json({ success: false, error: 'Name and unit are required.' }, { status: 400 });
    await connectToDatabase();
    const item = await InventoryItem.create({
      name: String(body.name).trim(), unit: String(body.unit).trim(), quantity: Number(body.quantity || 0),
      lowStockThreshold: Number(body.lowStockThreshold || 0), costPerUnit: Number(body.costPerUnit || 0),
      active: body.active !== false, usage: Array.isArray(body.usage) ? body.usage : [],
    });
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.code === 11000 ? 'An inventory item with this name already exists.' : 'Unable to create inventory item.' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await manager();
    if (!user) return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Inventory item id is required.' }, { status: 400 });
    await connectToDatabase();
    const update: any = {};
    for (const key of ['name', 'unit', 'quantity', 'lowStockThreshold', 'costPerUnit', 'active', 'usage']) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const item = await InventoryItem.findByIdAndUpdate(body.id, update, { returnDocument: 'after', runValidators: true }).lean();
    if (!item) return NextResponse.json({ success: false, error: 'Inventory item not found.' }, { status: 404 });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update inventory item.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await manager();
    if (!user) return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Inventory item id is required.' }, { status: 400 });
    await connectToDatabase();
    await InventoryItem.findByIdAndUpdate(id, { active: false });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to deactivate inventory item.' }, { status: 400 });
  }
}
