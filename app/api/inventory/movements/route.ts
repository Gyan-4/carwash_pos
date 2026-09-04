import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { InventoryMovement } from '@/models/InventoryMovement';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    await connectToDatabase();
    const movements = await InventoryMovement.find().sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json({ success: true, movements });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load inventory history.' }, { status: 500 });
  }
}
