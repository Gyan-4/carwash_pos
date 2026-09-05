import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Shift } from '@/models/Shift';
import { Transaction } from '@/models/Transaction';
import { AuditLog } from '@/models/AuditLog';

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

async function currentShift(userId: string) {
  return Shift.findOne({ cashierId: userId, status: 'open' }).sort({ openedAt: -1 });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();

    const filter = user.role === 'manager' ? {} : { cashierId: user.id };
    const shifts = await Shift.find(filter).sort({ openedAt: -1 }).limit(100).lean();
    const active = shifts.find((shift: any) => shift.status === 'open') || null;

    if (active) {
      const totals = await Transaction.aggregate([
        { $match: { shiftId: active._id, status: 'completed' } },
        { $group: {
          _id: null,
          cashSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] } },
          gcashSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'gcash'] }, '$total', 0] } },
          cardSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$total', 0] } },
          sales: { $sum: '$total' },
          transactions: { $sum: 1 },
        } },
      ]);
      const summary = totals[0] || { cashSales: 0, gcashSales: 0, cardSales: 0, sales: 0, transactions: 0 };
      const expectedCash = money(Number(active.openingCash) + Number(active.cashIn || 0) - Number(active.cashOut || 0) + Number(summary.cashSales));
      return NextResponse.json({ success: true, active: { ...active, expectedCash, summary }, shifts });
    }

    return NextResponse.json({ success: true, active: null, shifts });
  } catch (error) {
    console.error('GET /api/shifts failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load shifts.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'open') {
      if (user.role !== 'cashier' && user.role !== 'manager') return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
      if (await currentShift(user.id)) return NextResponse.json({ success: false, error: 'You already have an open shift.' }, { status: 409 });
      const openingCash = money(body.openingCash);
      if (!Number.isFinite(openingCash) || openingCash < 0) return NextResponse.json({ success: false, error: 'Opening cash must be zero or greater.' }, { status: 400 });
      const shift = await Shift.create({ cashierId: user.id, cashierName: user.name, openingCash, openedAt: new Date(), status: 'open' });
      await AuditLog.create({ userId: user.id, userName: user.name, action: 'SHIFT_OPENED', module: 'shifts', status: 'success', reason: 'Cashier opened a shift', metadata: { shiftId: String(shift._id), openingCash } });
      return NextResponse.json({ success: true, shift }, { status: 201 });
    }

    const shiftId = String(body.shiftId || '');
    if (!mongoose.isValidObjectId(shiftId)) return NextResponse.json({ success: false, error: 'Invalid shift.' }, { status: 400 });
    const shift = await Shift.findById(shiftId);
    if (!shift) return NextResponse.json({ success: false, error: 'Shift not found.' }, { status: 404 });
    if (user.role !== 'manager' && String(shift.cashierId) !== user.id) return NextResponse.json({ success: false, error: 'You can only manage your own shift.' }, { status: 403 });

    if (action === 'cash-in' || action === 'cash-out') {
      if (shift.status !== 'open') return NextResponse.json({ success: false, error: 'Shift is already closed.' }, { status: 409 });
      const amount = money(body.amount);
      const reason = String(body.reason || '').trim();
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ success: false, error: 'Amount must be greater than zero.' }, { status: 400 });
      if (!reason) return NextResponse.json({ success: false, error: 'A reason is required.' }, { status: 400 });
      if (action === 'cash-in') shift.cashIn = Number(shift.cashIn || 0) + amount;
      else {
        const available = Number(shift.openingCash) + Number(shift.cashIn || 0) - Number(shift.cashOut || 0);
        const cashSales = await Transaction.aggregate([{ $match: { shiftId: shift._id, status: 'completed', paymentMethod: 'cash' } }, { $group: { _id: null, total: { $sum: '$total' } } }]);
        const currentCash = available + Number(cashSales[0]?.total || 0);
        if (amount > currentCash) return NextResponse.json({ success: false, error: `Cash-out exceeds the available cash of ₱${currentCash.toFixed(2)}.` }, { status: 409 });
        shift.cashOut = Number(shift.cashOut || 0) + amount;
      }
      await shift.save();
      await AuditLog.create({ userId: user.id, userName: user.name, action: action === 'cash-in' ? 'SHIFT_CASH_IN' : 'SHIFT_CASH_OUT', module: 'shifts', status: 'success', reason, metadata: { shiftId, amount } });
      return NextResponse.json({ success: true, shift });
    }

    if (action === 'close') {
      if (shift.status !== 'open') return NextResponse.json({ success: false, error: 'Shift is already closed.' }, { status: 409 });
      const actualCash = money(body.actualCash);
      const closingNote = String(body.closingNote || '').trim();
      if (!Number.isFinite(actualCash) || actualCash < 0) return NextResponse.json({ success: false, error: 'Actual cash must be zero or greater.' }, { status: 400 });
      const totals = await Transaction.aggregate([{ $match: { shiftId: shift._id, status: 'completed' } }, { $group: { _id: null, cashSales: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$total', 0] } }, sales: { $sum: '$total' }, transactions: { $sum: 1 } } }]);
      const summary = totals[0] || { cashSales: 0, sales: 0, transactions: 0 };
      const expectedCash = money(Number(shift.openingCash) + Number(shift.cashIn || 0) - Number(shift.cashOut || 0) + Number(summary.cashSales));
      const variance = money(actualCash - expectedCash);
      shift.actualCash = actualCash;
      shift.expectedCash = expectedCash;
      shift.variance = variance;
      shift.closingNote = closingNote;
      shift.closedAt = new Date();
      shift.status = 'closed';
      await shift.save();
      await AuditLog.create({ userId: user.id, userName: user.name, action: 'SHIFT_CLOSED', module: 'shifts', status: 'success', reason: closingNote || 'Cashier closed a shift', metadata: { shiftId, actualCash, expectedCash, variance } });
      return NextResponse.json({ success: true, shift: { ...shift.toObject(), summary } });
    }

    return NextResponse.json({ success: false, error: 'Unknown shift action.' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/shifts failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update shift.' }, { status: 500 });
  }
}
