import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

type RangeKey = 'today' | '7d' | '30d';

function getRangeStart(range: RangeKey) {
  const manilaNow = new Date(Date.now() + MANILA_OFFSET_MS);
  const year = manilaNow.getUTCFullYear();
  const month = manilaNow.getUTCMonth();
  const day = manilaNow.getUTCDate();
  const todayStart = new Date(Date.UTC(year, month, day) - MANILA_OFFSET_MS);
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  return new Date(todayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ success: false, error: 'Manager access required.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const requestedRange = url.searchParams.get('range');
    const range: RangeKey = requestedRange === 'today' || requestedRange === '7d' || requestedRange === '30d' ? requestedRange : '30d';
    const startDate = getRangeStart(range);

    await connectToDatabase();

    const completedMatch = { status: 'completed', createdAt: { $gte: startDate } };
    const allMatch = { status: { $ne: 'deleted' }, createdAt: { $gte: startDate } };

    const [overview, paymentMix, vehicleMix, serviceMix, dailySales, statusMix, promoStats] = await Promise.all([
      Transaction.aggregate([
        { $match: completedMatch },
        { $group: {
          _id: null,
          sales: { $sum: '$total' },
          subtotal: { $sum: '$subtotal' },
          discounts: { $sum: '$discount' },
          transactions: { $sum: 1 },
          vehicles: { $sum: 1 },
        } },
      ]),
      Transaction.aggregate([
        { $match: completedMatch },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, sales: { $sum: '$total' } } },
        { $sort: { sales: -1, _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: completedMatch },
        { $group: { _id: '$vehicleType', count: { $sum: 1 }, sales: { $sum: '$total' } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: completedMatch },
        { $unwind: '$services' },
        { $group: { _id: '$services.name', count: { $sum: 1 }, sales: { $sum: '$services.price' } } },
        { $sort: { sales: -1, count: -1, _id: 1 } },
        { $limit: 12 },
      ]),
      Transaction.aggregate([
        { $match: completedMatch },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Manila' } },
          sales: { $sum: '$total' },
          transactions: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: allMatch },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total' } } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { ...completedMatch, discount: { $gt: 0 } } },
        { $group: { _id: null, transactions: { $sum: 1 }, discounts: { $sum: '$discount' }, salesAfterDiscount: { $sum: '$total' } } },
      ]),
    ]);

    const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
    const manilaNow = new Date(Date.now() + MANILA_OFFSET_MS);
    const year = manilaNow.getUTCFullYear();
    const month = manilaNow.getUTCMonth();
    const day = manilaNow.getUTCDate();
    const todayStart = new Date(Date.UTC(year, month, day) - MANILA_OFFSET_MS);

    const daily = Array.from({ length: days }, (_, index) => {
      const date = new Date(todayStart.getTime() - (days - 1 - index) * 24 * 60 * 60 * 1000);
      const key = date.toISOString().slice(0, 10);
      const found = dailySales.find((item) => item._id === key);
      return { date: key, sales: Number(found?.sales || 0), transactions: Number(found?.transactions || 0) };
    });

    const summary = overview[0] || {};
    const transactions = Number(summary.transactions || 0);

    return NextResponse.json({
      success: true,
      range,
      overview: {
        sales: Number(summary.sales || 0),
        subtotal: Number(summary.subtotal || 0),
        discounts: Number(summary.discounts || 0),
        transactions,
        vehicles: Number(summary.vehicles || 0),
        averageTransaction: transactions ? Number(summary.sales || 0) / transactions : 0,
      },
      dailySales: daily,
      paymentMix: paymentMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), sales: Number(item.sales || 0) })),
      vehicleMix: vehicleMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), sales: Number(item.sales || 0) })),
      serviceMix: serviceMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), sales: Number(item.sales || 0) })),
      statusMix: statusMix.map((item) => ({ name: String(item._id || 'Unknown'), count: Number(item.count || 0), amount: Number(item.amount || 0) })),
      promo: {
        transactions: Number(promoStats[0]?.transactions || 0),
        discounts: Number(promoStats[0]?.discounts || 0),
        salesAfterDiscount: Number(promoStats[0]?.salesAfterDiscount || 0),
      },
    });
  } catch (error) {
    console.error('[Analytics API] Failed to load analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to load analytics data.',
        code: 'ANALYTICS_LOAD_FAILED',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
