import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Transaction, Queue, Client } from '@/models';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    if (
      typeof body.plate !== 'string' ||
      typeof body.vehicleType !== 'string' ||
      typeof body.serviceName !== 'string' ||
      typeof body.subtotal !== 'number' ||
      typeof body.grandTotal !== 'number' ||
      !['cash', 'gcash', 'maya', 'card'].includes(body.paymentMethod)
    ) {
      return NextResponse.json({ success: false, error: 'Invalid checkout data.' }, { status: 400 });
    }

    const ticketNo = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await Transaction.create({
      ticketNo,
      plate: body.plate,
      clientName: body.clientName,
      vehicleType: body.vehicleType,
      serviceName: body.serviceName,
      addons: Array.isArray(body.addons) ? body.addons : [],
      subtotal: body.subtotal,
      discountAmount: typeof body.discountAmount === 'number' ? body.discountAmount : 0,
      grandTotal: body.grandTotal,
      paymentMethod: body.paymentMethod,
      cashierId: user.id,
      cashierName: user.name,
    });

    await Queue.create({
      ticketNo,
      plate: body.plate,
      clientName: body.clientName,
      vehicle: body.vehicleType,
      service: body.serviceName,
      status: 'waiting'
    });

    await Client.findOneAndUpdate(
      { plate: body.plate.toUpperCase() },
      {
        $inc: { stamps: 1, totalVisits: 1 },
        $set: { name: body.clientName || 'Client', vehicle: body.vehicleType, lastVisit: new Date() }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, ticketNo, transaction });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ success: false, error: 'Unable to complete checkout.' }, { status: 500 });
  }
}

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: 'MongoDB Atlas is connected and ready!',
  });
}
