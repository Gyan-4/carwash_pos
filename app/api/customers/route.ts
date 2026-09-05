import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Customer } from '@/models/Customer';
import { Transaction } from '@/models/Transaction';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const q = new URL(req.url).searchParams.get('q')?.trim() || '';
    const regex = q ? new RegExp(escapeRegex(q), 'i') : null;
    const stored = await Customer.find().sort({ lastVisitAt: -1, name: 1 }).limit(1000).lean();
    const transactions = await Transaction.find({ status: 'completed', customerName: { $nin: ['', null] } }).sort({ createdAt: -1 }).limit(5000).lean();

    type Vehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: Date };
    type History = { transactionNo: string; plate: string; vehicleType: string; vehicleSize?: string; services: { name: string; price: number }[]; total: number; discount: number; paymentMethod?: string; createdAt: Date };
    type View = { _id: string; name: string; vehicles: Vehicle[]; totalVisits: number; totalSpent: number; lastVisitAt?: Date; lastService?: string; history: History[] };

    const result = new Map<string, View>();
    for (const c of stored) {
      const name = c.name || 'Customer';
      result.set(String(c._id), { _id: String(c._id), name, vehicles: (c.vehicles || []).map((v: any) => ({ plate: v.plate, vehicleType: v.vehicleType, vehicleSize: v.vehicleSize, visitCount: 0, lastVisitAt: undefined })), totalVisits: 0, totalSpent: 0, lastVisitAt: undefined, lastService: undefined, history: [] });
    }

    const byName = new Map<string, View>();
    const byPlate = new Map<string, View>();
    for (const c of result.values()) {
      byName.set(normalizeName(c.name), c);
      for (const v of c.vehicles) byPlate.set(v.plate.toUpperCase(), c);
    }

    for (const tx of transactions) {
      const plate = String(tx.plate || '').trim().toUpperCase();
      const name = String(tx.customerName || '').trim();
      if (!plate || !name) continue;
      let customer = byPlate.get(plate) || byName.get(normalizeName(name));
      if (!customer) {
        const key = `legacy:${normalizeName(name)}`;
        customer = result.get(key) || { _id: key, name, vehicles: [], totalVisits: 0, totalSpent: 0, lastVisitAt: undefined, lastService: undefined, history: [] };
        result.set(key, customer);
        byName.set(normalizeName(name), customer);
      }
      let vehicle = customer.vehicles.find(v => v.plate === plate);
      if (!vehicle) { vehicle = { plate, vehicleType: tx.vehicleType, vehicleSize: tx.vehicleSize, visitCount: 0, lastVisitAt: undefined }; customer.vehicles.push(vehicle); }
      vehicle.visitCount += 1;
      if (!vehicle.lastVisitAt || new Date(tx.createdAt) > new Date(vehicle.lastVisitAt)) { vehicle.lastVisitAt = tx.createdAt; vehicle.vehicleType = tx.vehicleType; vehicle.vehicleSize = tx.vehicleSize; }
      byPlate.set(plate, customer);
      customer.totalVisits += 1;
      customer.totalSpent += Number(tx.total || 0);
      if (!customer.lastVisitAt || new Date(tx.createdAt) > new Date(customer.lastVisitAt)) { customer.lastVisitAt = tx.createdAt; customer.lastService = (tx.services || []).map((s: any) => s.name).join(', ') || 'Car wash'; }
      if (customer.history.length < 20) customer.history.push({ transactionNo: tx.transactionNo, plate, vehicleType: tx.vehicleType, vehicleSize: tx.vehicleSize, services: (tx.services || []).map((s: any) => ({ name: s.name, price: Number(s.price || 0) })), total: Number(tx.total || 0), discount: Number(tx.discount || 0), paymentMethod: tx.paymentMethod, createdAt: tx.createdAt });
    }

    const customers = [...result.values()].filter(c => c.name !== 'Walk-in Customer' && (!regex || regex.test(c.name) || c.vehicles.some(v => regex.test(v.plate)))).sort((a, b) => (b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0) - (a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0) || a.name.localeCompare(b.name));
    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error('[Customers API] GET failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load customers.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    const body = await req.json();
    const name = String(body.name || '').trim();
    const vehicle = body.vehicle || {};
    const plate = String(vehicle.plate || '').trim().toUpperCase();
    const vehicleType = String(vehicle.vehicleType || '').trim();
    const vehicleSize = String(vehicle.vehicleSize || '').trim();
    if (!name || !plate || !vehicleType) return NextResponse.json({ success: false, error: 'Customer name, plate, and vehicle type are required.' }, { status: 400 });
    if (vehicleType !== 'motorcycle' && !['small','medium','large','xl','xxl'].includes(vehicleSize)) return NextResponse.json({ success: false, error: 'Vehicle size is required for this vehicle type.' }, { status: 400 });
    if (vehicleType === 'motorcycle' && vehicleSize) return NextResponse.json({ success: false, error: 'Motorcycles must not have a vehicle size.' }, { status: 400 });
    await connectToDatabase();
    if (await Customer.findOne({ 'vehicles.plate': plate })) return NextResponse.json({ success: false, error: 'That plate is already registered.' }, { status: 409 });
    const customer = await Customer.create({ name, normalizedName: normalizeName(name), vehicles: [{ plate, vehicleType, ...(vehicleType === 'motorcycle' ? {} : { vehicleSize }), visitCount: 0 }], totalVisits: 0 });
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error('[Customers API] POST failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to create customer.' }, { status: 500 });
  }
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
    const vehicleType = String(vehicle.vehicleType || '').trim();
    const vehicleSize = String(vehicle.vehicleSize || '').trim();
    if (!customerId || !name || !plate || !vehicleType) return NextResponse.json({ success: false, error: 'Customer name, plate, and vehicle type are required.' }, { status: 400 });
    if (vehicleType !== 'motorcycle' && !['small','medium','large','xl','xxl'].includes(vehicleSize)) return NextResponse.json({ success: false, error: 'Vehicle size is required for this vehicle type.' }, { status: 400 });
    await connectToDatabase();
    let customer = mongoose.isValidObjectId(customerId) ? await Customer.findById(customerId) : null;
    if (!customer) {
      customer = await Customer.create({ name, normalizedName: normalizeName(name), vehicles: [{ plate, vehicleType, ...(vehicleType === 'motorcycle' ? {} : { vehicleSize }) }], totalVisits: 0 });
      return NextResponse.json({ success: true, customer });
    }
    const duplicate = await Customer.findOne({ _id: { $ne: customer._id }, 'vehicles.plate': plate });
    if (duplicate) return NextResponse.json({ success: false, error: 'That plate is already linked to another customer.' }, { status: 409 });
    customer.name = name;
    customer.normalizedName = normalizeName(name);
    const existing = customer.vehicles.find((v: any) => v.plate === plate);
    if (existing) { existing.vehicleType = vehicleType; existing.vehicleSize = vehicleType === 'motorcycle' ? undefined : vehicleSize; }
    else customer.vehicles.push({ plate, vehicleType, ...(vehicleType === 'motorcycle' ? {} : { vehicleSize }) } as any);
    await customer.save();
    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('[Customers API] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update customer.' }, { status: 500 });
  }
}
