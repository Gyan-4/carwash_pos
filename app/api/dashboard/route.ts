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

    const [today, week, recent, uniqueCustomers, serviceMix] = await Promise.all([
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
        // Deterministic tie-breaker: equal counts are ordered by service name.
        { $sort: { count: -1, _id: 1 } },
        { $limit: 8 },
      ]),
    ]);

    const todayData = today[0] || { sales: 0, vehicles: 0 };
    return NextResponse.json({
      success: true,
      overview: {
        sales: Number(todayData.sales || 0),
        vehicles: Number(todayData.vehicles || 0),
        customers: Number(uniqueCustomers[0]?.count || 0),
      },
      weeklySales: week.map((item) => ({ date: item._id, sales: Number(item.sales || 0), vehicles: Number(item.vehicles || 0) })),
      recent: recent.map((tx) => ({
        transactionNo: tx.transactionNo,
        plate: tx.plate,
        vehicleType: tx.vehicleType,
        total: Number(tx.total || 0),
        status: tx.status,
        createdAt: tx.createdAt,
      })),
      serviceMix: serviceMix.map((item) => ({ name: item._id, count: item.count, sales: Number(item.sales || 0) })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load dashboard data.' }, { status: 500 });
  }
}
