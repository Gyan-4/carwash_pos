import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Customer } from '@/models/Customer';
import { Transaction } from '@/models/Transaction';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const q = new URL(req.url).searchParams.get('q')?.trim() || '';
    const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const storedCustomers = await Customer.find(q ? { $or: [{ name: { $regex: regex } }, { 'vehicles.plate': { $regex: regex } }] } : {}).sort({ lastVisitAt: -1, name: 1 }).limit(500).lean();
    const historicalTransactions = await Transaction.find({ status: 'completed' }).sort({ createdAt: -1 }).lean();

    type Vehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: Date };
    type CustomerView = { _id: string; name: string; vehicles: Vehicle[]; totalVisits: number; lastVisitAt?: Date };
    const result = new Map<string, CustomerView>();
    for (const c of storedCustomers) {
      result.set(String(c._id), { _id: String(c._id), name: c.name || 'Walk-in Customer', vehicles: (c.vehicles || []).map((v: any) => ({ plate: v.plate, vehicleType: v.vehicleType, vehicleSize: v.vehicleSize, visitCount: v.visitCount || 0, lastVisitAt: v.lastVisitAt })), totalVisits: c.totalVisits || 0, lastVisitAt: c.lastVisitAt });
    }
    const plateOwner = new Map<string, CustomerView>();
    for (const c of result.values()) for (const v of c.vehicles) plateOwner.set(v.plate, c);

    for (const tx of historicalTransactions) {
      const plate = String(tx.plate || '').trim().toUpperCase();
      if (!plate || (regex && !regex.test(plate) && !regex.test(String(tx.customerName || '')))) continue;
      let customer = plateOwner.get(plate);
      if (!customer) {
        const name = String(tx.customerName || '').trim() || 'Walk-in Customer';
        const key = name !== 'Walk-in Customer' ? `legacy-name:${name.toLowerCase()}` : `legacy-plate:${plate}`;
        customer = result.get(key);
        if (!customer) { customer = { _id: key, name, vehicles: [], totalVisits: 0, lastVisitAt: tx.createdAt }; result.set(key, customer); }
        plateOwner.set(plate, customer);
      }
      let vehicle = customer.vehicles.find(v => v.plate === plate);
      if (!vehicle) { vehicle = { plate, vehicleType: tx.vehicleType, vehicleSize: tx.vehicleSize, visitCount: 0, lastVisitAt: tx.createdAt }; customer.vehicles.push(vehicle); }
      vehicle.visitCount += 1;
      if (!vehicle.lastVisitAt || new Date(tx.createdAt) > new Date(vehicle.lastVisitAt)) { vehicle.lastVisitAt = tx.createdAt; vehicle.vehicleType = tx.vehicleType; vehicle.vehicleSize = tx.vehicleSize; }
      customer.totalVisits += 1;
      if (!customer.lastVisitAt || new Date(tx.createdAt) > new Date(customer.lastVisitAt)) customer.lastVisitAt = tx.createdAt;
    }

    const customers = [...result.values()].filter(c => !q || regex!.test(c.name) || c.vehicles.some(v => regex!.test(v.plate))).sort((a,b) => (b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0) - (a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0) || a.name.localeCompare(b.name)).slice(0,500);
    return NextResponse.json({ success: true, customers });
  } catch { return NextResponse.json({ success: false, error: 'Unable to load customers.' }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    const body = await req.json();
    const customerId = String(body.customerId || '');
    const name = String(body.name || '').trim();
    const vehicle = body.vehicle || {};
    const plate = String(vehicle.plate || '').trim().toUpperCase();
    if (!customerId || !name || !plate) return NextResponse.json({ success: false, error: 'Customer name and plate are required.' }, { status: 400 });
    await connectToDatabase();

    if (customerId.startsWith('legacy-')) {
      const created = await Customer.create({ name, normalizedName: name.toLowerCase(), vehicles: [{ plate, vehicleType: vehicle.vehicleType, vehicleSize: vehicle.vehicleSize, visitCount: Number(vehicle.visitCount || 0), lastVisitAt: vehicle.lastVisitAt ? new Date(vehicle.lastVisitAt) : undefined }], totalVisits: Number(body.totalVisits || vehicle.visitCount || 0), lastVisitAt: vehicle.lastVisitAt ? new Date(vehicle.lastVisitAt) : undefined });
      return NextResponse.json({ success: true, customer: created });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    const duplicate = await Customer.findOne({ _id: { $ne: customer._id }, 'vehicles.plate': plate });
    if (duplicate) return NextResponse.json({ success: false, error: 'That plate is already linked to another customer.' }, { status: 409 });
    customer.name = name;
    customer.normalizedName = name.toLowerCase();
    const existing = customer.vehicles.find((v: any) => v.plate === plate);
    if (existing) { if (vehicle.vehicleType) existing.vehicleType = vehicle.vehicleType; if (vehicle.vehicleSize) existing.vehicleSize = vehicle.vehicleSize; }
    else customer.vehicles.push({ plate, vehicleType: vehicle.vehicleType, vehicleSize: vehicle.vehicleSize, visitCount: Number(vehicle.visitCount || 0), lastVisitAt: vehicle.lastVisitAt ? new Date(vehicle.lastVisitAt) : undefined } as any);
    await customer.save();
    return NextResponse.json({ success: true, customer });
  } catch { return NextResponse.json({ success: false, error: 'Unable to update customer.' }, { status: 500 }); }
}
