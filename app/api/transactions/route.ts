import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const transactions = await Transaction.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ success: true, transactions });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load transactions.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    const body = await req.json();
    if (!body.plate || !Array.isArray(body.services) || body.services.length === 0) {
      return NextResponse.json({ success: false, error: 'Plate and at least one service are required.' }, { status: 400 });
    }
    await connectToDatabase();
    const transactionNo = `TX-${Date.now().toString(36).toUpperCase()}`;
    const transaction = await Transaction.create({
      transactionNo,
      customerName: body.customerName || '',
      plate: String(body.plate).trim().toUpperCase(),
      vehicleType: body.vehicleType,
      services: body.services,
      subtotal: Number(body.subtotal),
      discount: Number(body.discount || 0),
      total: Number(body.total),
      createdBy: user.id,
      status: 'completed',
    });
    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to save transaction.' }, { status: 500 });
  }
}
