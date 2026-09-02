import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Transaction, Queue, Client } from '@/models';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const ticketNo = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await Transaction.create({
      ticketNo,
      plate: body.plate,
      clientName: body.clientName,
      vehicleType: body.vehicleType,
      serviceName: body.serviceName,
      addons: body.addons || [],
      subtotal: body.subtotal,
      discountAmount: body.discountAmount || 0,
      grandTotal: body.grandTotal,
      paymentMethod: body.paymentMethod
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB Atlas is connected and ready!' 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}