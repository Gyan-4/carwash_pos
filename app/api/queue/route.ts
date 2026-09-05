import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Queue } from '@/models/Queue';

const ACTIVE_STATUSES = ['waiting', 'washing'] as const;
const ALL_STATUSES = ['waiting', 'washing', 'completed'] as const;

type QueueStatus = typeof ALL_STATUSES[number];

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();

    const queue = await Queue.find({ status: { $in: ACTIVE_STATUSES } })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, queue });
  } catch (error) {
    console.error('GET /api/queue failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load active queue.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();

    const body = await req.json();
    const id = String(body.id || '');
    const status = String(body.status || '') as QueueStatus;
    const washer = body.washer === undefined ? undefined : String(body.washer || '').trim();

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid queue item.' }, { status: 400 });
    }
    if (!ALL_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid queue status.' }, { status: 400 });
    }

    const current = await Queue.findById(id);
    if (!current) return NextResponse.json({ success: false, error: 'Queue item not found.' }, { status: 404 });

    const now = new Date();
    if (status === 'washing' && current.status !== 'washing') current.startedAt = now;
    if (status === 'completed' && current.status !== 'completed') current.completedAt = now;
    if (status !== 'completed') current.completedAt = undefined;
    if (status === 'waiting') current.startedAt = undefined;
    if (washer !== undefined) current.washer = washer || 'Unassigned';
    current.status = status;
    await current.save();

    return NextResponse.json({ success: true, queueItem: current });
  } catch (error) {
    console.error('PATCH /api/queue failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update queue item.' }, { status: 500 });
  }
}
