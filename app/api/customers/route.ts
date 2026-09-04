import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Customer } from '@/models/Customer';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const q = new URL(req.url).searchParams.get('q')?.trim() || '';
    const filter = q ? { $or: [{ name: { $regex: q, $options: 'i' } }, { 'vehicles.plate': { $regex: q, $options: 'i' } }] } : {};
    const customers = await Customer.find(filter).sort({ lastVisitAt: -1, name: 1 }).limit(500).lean();
    return NextResponse.json({ success: true, customers });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load customers.' }, { status: 500 });
  }
}
