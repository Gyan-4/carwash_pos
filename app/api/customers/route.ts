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

    // Load customer profiles created by the newer customer flow.
    const storedCustomers = await Customer.find(q
      ? { $or: [{ name: { $regex: regex } }, { 'vehicles.plate': { $regex: regex } }] }
      : {},
    ).sort({ lastVisitAt: -1, name: 1 }).limit(500).lean();

    // Also include historical completed transactions. Older transactions may
    // predate the Customer collection, so they must still appear in Customers.
    const historicalTransactions = await Transaction.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .lean();

    type Vehicle = {
      plate: string;
      vehicleType: string;
      vehicleSize?: string;
      visitCount: number;
      lastVisitAt?: Date;
    };
    type CustomerView = {
      _id: string;
      name: string;
      vehicles: Vehicle[];
      totalVisits: number;
      lastVisitAt?: Date;
    };

    const result = new Map<string, CustomerView>();

    // Start with stored profiles so named customers retain their identity.
    for (const customer of storedCustomers) {
      result.set(String(customer._id), {
        _id: String(customer._id),
        name: customer.name || 'Walk-in Customer',
        vehicles: (customer.vehicles || []).map((v: any) => ({
          plate: v.plate,
          vehicleType: v.vehicleType,
          vehicleSize: v.vehicleSize,
          visitCount: v.visitCount || 0,
          lastVisitAt: v.lastVisitAt,
        })),
        totalVisits: customer.totalVisits || 0,
        lastVisitAt: customer.lastVisitAt,
      });
    }

    const plateOwner = new Map<string, CustomerView>();
    for (const customer of result.values()) {
      for (const vehicle of customer.vehicles) plateOwner.set(vehicle.plate, customer);
    }

    // Merge every historical plate into its existing customer when possible.
    // If no profile exists (e.g. an older transaction), expose a virtual
    // Walk-in Customer record rather than hiding the historical data.
    for (const tx of historicalTransactions) {
      const plate = String(tx.plate || '').trim().toUpperCase();
      if (!plate) continue;
      if (regex && !regex.test(plate) && !regex.test(String(tx.customerName || ''))) continue;

      let customer = plateOwner.get(plate);
      if (!customer) {
        const name = String(tx.customerName || '').trim() || 'Walk-in Customer';
        // Named historical transactions can be grouped by name; otherwise
        // use the plate so unrelated walk-in vehicles are not merged.
        const key = name !== 'Walk-in Customer' ? `legacy-name:${name.toLowerCase()}` : `legacy-plate:${plate}`;
        customer = result.get(key);
        if (!customer) {
          customer = {
            _id: key,
            name,
            vehicles: [],
            totalVisits: 0,
            lastVisitAt: tx.createdAt,
          };
          result.set(key, customer);
        }
        customer.vehicles.push({
          plate,
          vehicleType: tx.vehicleType,
          vehicleSize: tx.vehicleSize,
          visitCount: 0,
          lastVisitAt: tx.createdAt,
        });
        plateOwner.set(plate, customer);
      }

      let vehicle = customer.vehicles.find((v) => v.plate === plate);
      if (!vehicle) {
        vehicle = {
          plate,
          vehicleType: tx.vehicleType,
          vehicleSize: tx.vehicleSize,
          visitCount: 0,
          lastVisitAt: tx.createdAt,
        };
        customer.vehicles.push(vehicle);
        plateOwner.set(plate, customer);
      }

      vehicle.visitCount += 1;
      if (!vehicle.lastVisitAt || new Date(tx.createdAt) > new Date(vehicle.lastVisitAt)) {
        vehicle.lastVisitAt = tx.createdAt;
        vehicle.vehicleType = tx.vehicleType;
        vehicle.vehicleSize = tx.vehicleSize;
      }
      customer.totalVisits += 1;
      if (!customer.lastVisitAt || new Date(tx.createdAt) > new Date(customer.lastVisitAt)) {
        customer.lastVisitAt = tx.createdAt;
      }
    }

    const customers = [...result.values()]
      .filter((customer) => !q || regex!.test(customer.name) || customer.vehicles.some((v) => regex!.test(v.plate)))
      .sort((a, b) => {
        const at = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
        const bt = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
        return bt - at || a.name.localeCompare(b.name);
      })
      .slice(0, 500);

    return NextResponse.json({ success: true, customers });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load customers.' }, { status: 500 });
  }
}
