import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Customer } from '@/models/Customer';
import { Transaction } from '@/models/Transaction';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const isUnnamed = (value: string) => {
  const name = value.trim();
  return !name || name.toLowerCase() === 'walk-in customer';
};

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();

    const q = new URL(req.url).searchParams.get('q')?.trim() || '';
    const regex = q ? new RegExp(escapeRegex(q), 'i') : null;
    const stored = await Customer.find().sort({ lastVisitAt: -1, name: 1 }).limit(1000).lean();
    const transactions = await Transaction.find({ status: 'completed', plate: { $nin: ['', null] } }).sort({ createdAt: -1 }).limit(5000).lean();

    type Vehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: Date };
    type History = { transactionNo: string; plate: string; vehicleType: string; vehicleSize?: string; services: { name: string; price: number }[]; total: number; discount: number; paymentMethod?: string; createdAt: Date };
    type View = { _id: string; name: string; vehicles: Vehicle[]; totalVisits: number; totalSpent: number; lastVisitAt?: Date; lastService?: string; history: History[] };

    const result = new Map<string, View>();
    const removedByPlate = new Map<string, Date>();

    for (const c of stored) {
      const vehicles = (c.vehicles || []).map((v: any) => ({ plate: String(v.plate || '').toUpperCase(), vehicleType: v.vehicleType, vehicleSize: v.vehicleSize, visitCount: 0, lastVisitAt: undefined }));
      result.set(String(c._id), { _id: String(c._id), name: c.name || '', vehicles, totalVisits: 0, totalSpent: 0, lastVisitAt: undefined, lastService: undefined, history: [] });
      for (const removed of (c.removedVehicles || []) as any[]) {
        const removedPlate = String(removed.plate || '').trim().toUpperCase();
        if (removedPlate && removed.removedAt) removedByPlate.set(removedPlate, new Date(removed.removedAt));
      }
    }

    const byName = new Map<string, View>();
    const byPlate = new Map<string, View>();
    for (const c of result.values()) {
      if (c.name && !isUnnamed(c.name)) byName.set(normalizeName(c.name), c);
      for (const v of c.vehicles) byPlate.set(v.plate, c);
    }

    for (const tx of transactions) {
      const plate = String(tx.plate || '').trim().toUpperCase();
      const transactionName = String(tx.customerName || '').trim();
      if (!plate) continue;

      const removedAt = removedByPlate.get(plate);
      if (removedAt && new Date(tx.createdAt).getTime() <= removedAt.getTime()) continue;

      let customer = byPlate.get(plate);
      if (!customer && !isUnnamed(transactionName)) customer = byName.get(normalizeName(transactionName));
      if (!customer) {
        const key = `plate:${plate}`;
        customer = result.get(key) || { _id: key, name: '', vehicles: [], totalVisits: 0, totalSpent: 0, lastVisitAt: undefined, lastService: undefined, history: [] };
        result.set(key, customer);
      }

      if (!isUnnamed(transactionName) && !customer.name) {
        customer.name = transactionName;
        byName.set(normalizeName(transactionName), customer);
      }

      let vehicle = customer.vehicles.find(v => v.plate === plate);
      if (!vehicle) {
        vehicle = { plate, vehicleType: tx.vehicleType, vehicleSize: tx.vehicleSize, visitCount: 0, lastVisitAt: undefined };
        customer.vehicles.push(vehicle);
      }

      vehicle.visitCount += 1;
      if (!vehicle.lastVisitAt || new Date(tx.createdAt) > new Date(vehicle.lastVisitAt)) {
        vehicle.lastVisitAt = tx.createdAt;
        vehicle.vehicleType = tx.vehicleType;
        vehicle.vehicleSize = tx.vehicleSize;
      }
      byPlate.set(plate, customer);
      customer.totalVisits += 1;
      customer.totalSpent += Number(tx.total || 0);

      if (!customer.lastVisitAt || new Date(tx.createdAt) > new Date(customer.lastVisitAt)) {
        customer.lastVisitAt = tx.createdAt;
        customer.lastService = (tx.services || []).map((s: any) => s.name).join(', ') || 'Car wash';
      }

      if (customer.history.length < 20) customer.history.push({ transactionNo: tx.transactionNo, plate, vehicleType: tx.vehicleType, vehicleSize: tx.vehicleSize, services: (tx.services || []).map((s: any) => ({ name: s.name, price: Number(s.price || 0) })), total: Number(tx.total || 0), discount: Number(tx.discount || 0), paymentMethod: tx.paymentMethod, createdAt: tx.createdAt });
    }

    const customers = [...result.values()]
      .filter(c => c.vehicles.length > 0)
      .filter(c => !regex || regex.test(c.name || 'Customer') || c.vehicles.some(v => regex.test(v.plate)))
      .sort((a, b) => (b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0) - (a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0) || (a.name || a.vehicles[0]?.plate || '').localeCompare(b.name || b.vehicles[0]?.plate || ''));

    return NextResponse.json({ success: true, customers: customers.map(c => ({ ...c, name: c.name || c.vehicles[0]?.plate || 'Customer', displayName: c.name || c.vehicles[0]?.plate || 'Customer', named: Boolean(c.name) })) });
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

    if (!plate || !vehicleType) return NextResponse.json({ success: false, error: 'Plate and vehicle type are required.' }, { status: 400 });
    if (vehicleType !== 'motorcycle' && !['small', 'medium', 'large', 'xl', 'xxl'].includes(vehicleSize)) return NextResponse.json({ success: false, error: 'Vehicle size is required for this vehicle type.' }, { status: 400 });
    if (vehicleType === 'motorcycle' && vehicleSize) return NextResponse.json({ success: false, error: 'Motorcycles must not have a vehicle size.' }, { status: 400 });

    await connectToDatabase();
    if (await Customer.findOne({ 'vehicles.plate': plate })) return NextResponse.json({ success: false, error: 'That plate is already registered.' }, { status: 409 });
    const customer = await Customer.create({ name, normalizedName: name ? normalizeName(name) : '', vehicles: [{ plate, vehicleType, ...(vehicleType === 'motorcycle' ? {} : { vehicleSize }), visitCount: 0 }], totalVisits: 0 });
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
    const originalPlate = String(body.originalPlate || '').trim().toUpperCase();
    const mode = body.mode === 'add-vehicle' ? 'add-vehicle' : 'edit-vehicle';
    const name = String(body.name || '').trim();
    const vehicle = body.vehicle || {};
    const plate = String(vehicle.plate || '').trim().toUpperCase();
    const vehicleType = String(vehicle.vehicleType || '').trim();
    const vehicleSize = String(vehicle.vehicleSize || '').trim();

    if (!customerId || !plate || !vehicleType) return NextResponse.json({ success: false, error: 'Plate and vehicle type are required.' }, { status: 400 });
    if (vehicleType !== 'motorcycle' && !['small', 'medium', 'large', 'xl', 'xxl'].includes(vehicleSize)) return NextResponse.json({ success: false, error: 'Vehicle size is required for this vehicle type.' }, { status: 400 });
    if (vehicleType === 'motorcycle' && vehicleSize) return NextResponse.json({ success: false, error: 'Motorcycles must not have a vehicle size.' }, { status: 400 });

    await connectToDatabase();
    const customer = mongoose.isValidObjectId(customerId) ? await Customer.findById(customerId) : null;
    if (!customer) return NextResponse.json({ success: false, error: 'Customer record not found.' }, { status: 404 });

    const duplicate = await Customer.findOne({ _id: { $ne: customer._id }, 'vehicles.plate': plate });
    if (duplicate) return NextResponse.json({ success: false, error: 'That plate is already linked to another customer.' }, { status: 409 });

    if (mode === 'add-vehicle') {
      if (customer.vehicles.some((v: any) => v.plate === plate)) return NextResponse.json({ success: false, error: 'That vehicle is already linked to this customer.' }, { status: 409 });
      customer.vehicles.push({ plate, vehicleType, ...(vehicleType === 'motorcycle' ? {} : { vehicleSize }), visitCount: 0 } as any);
      if (!isUnnamed(name)) {
        customer.name = name;
        customer.normalizedName = normalizeName(name);
      }
      await customer.save();
      return NextResponse.json({ success: true, customer });
    }

    const targetPlate = originalPlate || String(customer.vehicles[0]?.plate || '').toUpperCase();
    const existing = customer.vehicles.find((v: any) => v.plate === targetPlate);
    if (!existing) return NextResponse.json({ success: false, error: 'The vehicle you are editing could not be found.' }, { status: 404 });

    if (customer.vehicles.some((v: any) => v !== existing && v.plate === plate)) return NextResponse.json({ success: false, error: 'That plate is already linked to this customer.' }, { status: 409 });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        existing.plate = plate;
        existing.vehicleType = vehicleType;
        existing.vehicleSize = vehicleType === 'motorcycle' ? undefined : vehicleSize;
        customer.name = name;
        customer.normalizedName = name ? normalizeName(name) : '';
        await customer.save({ session });

        await Transaction.updateMany({ plate: targetPlate }, { $set: { plate, customerName: name } }, { session });
        const otherPlates = customer.vehicles.map((v: any) => String(v.plate || '').toUpperCase()).filter((p: string) => p && p !== plate);
        if (otherPlates.length) await Transaction.updateMany({ plate: { $in: otherPlates } }, { $set: { customerName: name } }, { session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('[Customers API] PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update customer.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ success: false, error: 'Only managers can remove vehicles.' }, { status: 403 });

    const body = await req.json();
    const customerId = String(body.customerId || '');
    const plate = String(body.plate || '').trim().toUpperCase();
    if (!customerId || !plate) return NextResponse.json({ success: false, error: 'Customer and plate are required.' }, { status: 400 });
    if (!mongoose.isValidObjectId(customerId)) return NextResponse.json({ success: false, error: 'Invalid customer record.' }, { status: 400 });

    await connectToDatabase();
    const session = await mongoose.startSession();
    let remainingVehicles = 0;

    try {
      await session.withTransaction(async () => {
        const customer = await Customer.findById(customerId).session(session);
        if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

        const exists = customer.vehicles.some((vehicle: any) => String(vehicle.plate || '').toUpperCase() === plate);
        if (!exists) throw new Error('VEHICLE_NOT_FOUND');

        customer.vehicles = customer.vehicles.filter((vehicle: any) => String(vehicle.plate || '').toUpperCase() !== plate) as any;
        const removedVehicles = (customer.removedVehicles || []) as any[];
        const now = new Date();
        customer.removedVehicles = removedVehicles.filter((item: any) => String(item.plate || '').toUpperCase() !== plate) as any;
        customer.removedVehicles.push({ plate, removedAt: now } as any);
        remainingVehicles = customer.vehicles.length;
        await customer.save({ session });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'CUSTOMER_NOT_FOUND') return NextResponse.json({ success: false, error: 'Customer record not found.' }, { status: 404 });
      if (message === 'VEHICLE_NOT_FOUND') return NextResponse.json({ success: false, error: 'Vehicle record not found.' }, { status: 404 });
      throw error;
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ success: true, plate, remainingVehicles });
  } catch (error) {
    console.error('[Customers API] DELETE failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to remove vehicle.' }, { status: 500 });
  }
}
