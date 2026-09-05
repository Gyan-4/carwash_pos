import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    }

    await connectToDatabase();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const [today, week, recent, uniqueCustomers, serviceMix, paymentMix, vehicleMix] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, sales: { $sum: '$total' }, vehicles: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$total' }, vehicles: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(8).lean(),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$plate' } },
        { $count: 'count' },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$services' },
        { $group: { _id: '$services.name', count: { $sum: 1 }, sales: { $sum: '$services.price' } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 8 },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, sales: { $sum: '$total' } } },
        { $sort: { sales: -1, _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: '$vehicleType', count: { $sum: 1 }, sales: { $sum: '$total' } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
    ]);

    const todayData = today[0] || { sales: 0, vehicles: 0 };
    const weeklySales = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const found = week.find((item) => item._id === key);
      return { date: key, sales: Number(found?.sales || 0), vehicles: Number(found?.vehicles || 0) };
    });

    return NextResponse.json({
      success: true,
      overview: {
        sales: Number(todayData.sales || 0),
        vehicles: Number(todayData.vehicles || 0),
        customers: Number(uniqueCustomers[0]?.count || 0),
      },
      weeklySales,
      recent: recent.map((tx) => ({
        transactionNo: String(tx.transactionNo || ''),
        plate: String(tx.plate || ''),
        vehicleType: String(tx.vehicleType || ''),
        total: Number(tx.total || 0),
        status: String(tx.status || ''),
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : String(tx.createdAt || ''),
      })),
      serviceMix: serviceMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), sales: Number(item.sales || 0) })),
      paymentMix: paymentMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), sales: Number(item.sales || 0) })),
      vehicleMix: vehicleMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), sales: Number(item.sales || 0) })),
    });
  } catch (error) {
    console.error('[Dashboard API] Failed to load dashboard:', error);
    const details = error instanceof Error ? error.message : 'Unknown dashboard error';
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to load dashboard data.',
        code: 'DASHBOARD_LOAD_FAILED',
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
      { status: 500 },
    );
  }
}
