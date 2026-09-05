import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SystemSetting } from '@/models/SystemSetting';

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await SystemSetting.findOne({ key: 'default' }).lean();
    return NextResponse.json({
      success: true,
      settings: {
        storeName: settings?.storeName || 'Car Wash POS',
        address: settings?.address || '',
        contactNumber: settings?.contactNumber || '',
        receiptFooter: settings?.receiptFooter || 'Thank you for choosing us!',
        riderDiscountPercent: Number(settings?.riderDiscountPercent ?? 20),
        paymentMethods: {
          cash: settings?.paymentMethods?.cash !== false,
          gcash: settings?.paymentMethods?.gcash !== false,
          card: settings?.paymentMethods?.card !== false,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/settings/public failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load public settings.' }, { status: 500 });
  }
}
