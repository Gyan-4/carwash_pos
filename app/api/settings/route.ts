import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { SystemSetting } from '@/models/SystemSetting';
import { AuditLog } from '@/models/AuditLog';

const KEY = 'default';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    let settings = await SystemSetting.findOne({ key: KEY }).lean();
    if (!settings) settings = await SystemSetting.create({ key: KEY }).then((doc) => doc.toObject());
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings failed:', error);
    return NextResponse.json({ error: 'Unable to load settings.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ error: 'Manager access required.' }, { status: 403 });
    const body = await req.json();
    const storeName = String(body.storeName || '').trim();
    const address = String(body.address || '').trim();
    const contactNumber = String(body.contactNumber || '').trim();
    const receiptFooter = String(body.receiptFooter || '').trim();
    const stampsRequired = Number(body.stampsRequired);
    const riderDiscountPercent = Number(body.riderDiscountPercent);
    const paymentMethods = body.paymentMethods || {};
    if (!storeName || storeName.length > 120) return NextResponse.json({ error: 'Store name is required.' }, { status: 400 });
    if (!Number.isInteger(stampsRequired) || stampsRequired < 1 || stampsRequired > 999) return NextResponse.json({ error: 'Stamps required must be a whole number from 1 to 999.' }, { status: 400 });
    if (!Number.isFinite(riderDiscountPercent) || riderDiscountPercent < 0 || riderDiscountPercent > 100) return NextResponse.json({ error: 'Rider discount must be between 0 and 100%.' }, { status: 400 });
    if (paymentMethods.cash !== true && paymentMethods.gcash !== true && paymentMethods.card !== true) return NextResponse.json({ error: 'At least one payment method must remain enabled.' }, { status: 400 });
    await connectToDatabase();
    const settings = await SystemSetting.findOneAndUpdate({ key: KEY }, {
      $set: { storeName, address, contactNumber, receiptFooter, stampsRequired, riderDiscountPercent, paymentMethods: { cash: paymentMethods.cash === true, gcash: paymentMethods.gcash === true, card: paymentMethods.card === true }, updatedBy: user.id },
      $setOnInsert: { key: KEY },
    }, { new: true, upsert: true });
    await AuditLog.create({ userId: user.id, userName: user.name, role: user.role, action: 'SETTINGS_UPDATED', reason: 'Updated system configuration', metadata: { storeName, paymentMethods: settings.paymentMethods, stampsRequired, riderDiscountPercent } });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('PATCH /api/settings failed:', error);
    return NextResponse.json({ error: 'Unable to save settings.' }, { status: 500 });
  }
}
