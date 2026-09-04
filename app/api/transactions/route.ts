import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';
import { Customer } from '@/models/Customer';
import { InventoryItem } from '@/models/InventoryItem';
import { InventoryMovement } from '@/models/InventoryMovement';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const transactions = await Transaction.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ success: true, transactions });
  } catch { return NextResponse.json({ success: false, error: 'Unable to load transactions.' }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    const body = await req.json();
    if (!body.plate || !Array.isArray(body.services) || body.services.length === 0) return NextResponse.json({ success: false, error: 'Plate and at least one service are required.' }, { status: 400 });
    const paymentMethod = ['cash', 'gcash', 'card'].includes(body.paymentMethod) ? body.paymentMethod : 'cash';
    const total = Number(body.total);
    const amountPaid = Number(body.amountPaid);
    if (!Number.isFinite(total) || total < 0) return NextResponse.json({ success: false, error: 'Invalid transaction total.' }, { status: 400 });
    if (!Number.isFinite(amountPaid) || amountPaid < total) return NextResponse.json({ success: false, error: paymentMethod === 'cash' ? 'Cash received is less than the total.' : 'Payment amount is insufficient.' }, { status: 400 });
    const change = paymentMethod === 'cash' ? amountPaid - total : 0;
    await connectToDatabase();
    const transactionNo = `TX-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const serviceIds = body.services.map((service: any) => String(service.id));
    const inventoryItems = await InventoryItem.find({ active: true, 'usage.serviceId': { $in: serviceIds } }).lean();
    const deductions = inventoryItems.map((item: any) => ({ item, quantity: item.usage.filter((u: any) => serviceIds.includes(String(u.serviceId))).reduce((sum: number, u: any) => sum + Number(u.quantity || 0), 0) })).filter((entry: any) => entry.quantity > 0);
    for (const entry of deductions) if (Number(entry.item.quantity) < entry.quantity) return NextResponse.json({ success: false, error: `Insufficient inventory: ${entry.item.name}. Available ${entry.item.quantity} ${entry.item.unit}, required ${entry.quantity} ${entry.item.unit}.` }, { status: 409 });

    const transaction = await Transaction.create({ transactionNo, customerName: body.customerName || '', plate: String(body.plate).trim().toUpperCase(), vehicleType: body.vehicleType, vehicleSize: body.vehicleSize || undefined, services: body.services, subtotal: Number(body.subtotal), discount: Number(body.discount || 0), total, paymentMethod, amountPaid, change, createdBy: user.id, status: 'completed' });

    for (const entry of deductions) {
      const before = Number(entry.item.quantity), after = before - entry.quantity;
      await InventoryItem.updateOne({ _id: entry.item._id }, { $set: { quantity: after } });
      await InventoryMovement.create({ itemId: entry.item._id, itemName: entry.item.name, type: 'sale', quantity: -entry.quantity, beforeQuantity: before, afterQuantity: after, transactionId: transaction._id, transactionNo, userId: user.id, reason: 'POS sale' });
    }

    const plate = String(body.plate).trim().toUpperCase();
    const customerName = String(body.customerName || '').trim() || 'Walk-in Customer';
    const normalizedName = customerName.toLowerCase();
    const customer = await Customer.findOne({ 'vehicles.plate': plate });
    if (customer) {
      const vehicle = customer.vehicles.find((v: any) => v.plate === plate);
      if (vehicle) { vehicle.vehicleType = body.vehicleType; vehicle.vehicleSize = body.vehicleSize || vehicle.vehicleSize; vehicle.visitCount = Number(vehicle.visitCount || 0) + 1; vehicle.lastVisitAt = now; }
      else customer.vehicles.push({ plate, vehicleType: body.vehicleType, vehicleSize: body.vehicleSize, visitCount: 1, lastVisitAt: now });
      customer.totalVisits = Number(customer.totalVisits || 0) + 1; customer.lastVisitAt = now;
      if (customer.name === 'Walk-in Customer' && customerName !== 'Walk-in Customer') { customer.name = customerName; customer.normalizedName = normalizedName; }
      await customer.save();
    } else await Customer.create({ name: customerName, normalizedName, vehicles: [{ plate, vehicleType: body.vehicleType, vehicleSize: body.vehicleSize, visitCount: 1, lastVisitAt: now }], totalVisits: 1, lastVisitAt: now });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: 'Unable to save transaction.' }, { status: 500 }); }
}
