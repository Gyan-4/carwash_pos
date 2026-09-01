import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Queue } from '@/models';

// GET Active Queue
export async function GET() {
  try {
    await connectToDatabase();
    const queue = await Queue.find({ status: { $ne: 'completed' } }).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH Update Vehicle Wash Status
export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { id, status } = await req.json();

    const updatedItem = await Queue.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json({ success: true, queueItem: updatedItem });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}