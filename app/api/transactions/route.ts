import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Transaction } from '@/models/Transaction';
import { Customer } from '@/models/Customer';
import { InventoryItem } from '@/models/InventoryItem';
import { InventoryMovement } from '@/models/InventoryMovement';
import { Promo } from '@/models/Promo';
import { Shift } from '@/models/Shift';
import { SystemSetting } from '@/models/SystemSetting';
import { AuditLog } from '@/models/AuditLog';
import { Queue } from '@/models/Queue';
import { SERVICE_CATALOG, getPrice, hasPrice, type CatalogItem, type VehicleSize, type VehicleType } from '@/lib/serviceCatalog';

const VEHICLE_TYPES: VehicleType[] = ['motorcycle', 'sedan', 'suv', 'truck'];
const VEHICLE_SIZES: VehicleSize[] = ['small', 'medium', 'large', 'xl', 'xxl'];
const PAYMENT_METHODS = ['cash', 'gcash', 'card'] as const;
type PaymentMethod = typeof PAYMENT_METHODS[number];

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const transactions = await Transaction.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ success: true, transactions });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to load transactions.' }, { status: 500 });
  }
}

function promoMatches(promo: any, body: any, services: CatalogItem[]) {
  if (!promo.active) return false;
  if (promo.eligibleVehicleTypes?.length && !promo.eligibleVehicleTypes.includes(body.vehicleType)) return false;
  if (promo.eligibleVehicleSizes?.length && !promo.eligibleVehicleSizes.includes(body.vehicleSize)) return false;
  if (promo.eligibleServiceIds?.length && !services.some((service) => promo.eligibleServiceIds.includes(service.id))) return false;
  if (promo.eligibleCategories?.length && !services.some((service) => promo.eligibleCategories.includes(service.category))) return false;
  if (promo.eligiblePlatforms?.length && !promo.eligiblePlatforms.includes(String(body.riderPlatform || ''))) return false;
  return true;
}

function makeTransactionNo() {
  return `TX-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const body = await req.json();
    const plate = String(body.plate || '').trim().toUpperCase();
    const vehicleType = String(body.vehicleType || '') as VehicleType;
    const vehicleSize = body.vehicleSize ? String(body.vehicleSize) as VehicleSize : undefined;

    if (!plate || !Array.isArray(body.services) || body.services.length === 0) {
      return NextResponse.json({ success: false, error: 'Plate and at least one service are required.' }, { status: 400 });
    }
    if (!VEHICLE_TYPES.includes(vehicleType)) return NextResponse.json({ success: false, error: 'Invalid vehicle type.' }, { status: 400 });
    if (vehicleType === 'motorcycle') {
      if (vehicleSize !== undefined) return NextResponse.json({ success: false, error: 'Motorcycles must not include a vehicle size.' }, { status: 400 });
    } else if (!vehicleSize || !VEHICLE_SIZES.includes(vehicleSize)) {
      return NextResponse.json({ success: false, error: 'A valid vehicle size is required.' }, { status: 400 });
    }

    const paymentMethod = PAYMENT_METHODS.includes(body.paymentMethod as PaymentMethod) ? body.paymentMethod as PaymentMethod : null;
    if (!paymentMethod) return NextResponse.json({ success: false, error: 'Invalid payment method.' }, { status: 400 });

    const serviceIds = body.services.map((service: any) => String(service?.id || '').trim());
    if (serviceIds.some((id: string) => !id) || new Set(serviceIds).size !== serviceIds.length) {
      return NextResponse.json({ success: false, error: 'Invalid or duplicate services.' }, { status: 400 });
    }

    const catalogById = new Map(SERVICE_CATALOG.map((service) => [service.id, service]));
    const services: CatalogItem[] = [];
    for (const id of serviceIds) {
      const service = catalogById.get(id);
      if (!service) return NextResponse.json({ success: false, error: `Unknown service: ${id}.` }, { status: 400 });
      const validForVehicle = vehicleType === 'motorcycle'
        ? service.category === 'Motorcycle'
        : service.category !== 'Motorcycle' && hasPrice(service, vehicleType, vehicleSize as VehicleSize);
      if (!validForVehicle || getPrice(service, vehicleType, vehicleSize as VehicleSize) <= 0) {
        return NextResponse.json({ success: false, error: `${service.name} is not available for this vehicle.` }, { status: 400 });
      }
      services.push(service);
    }

    const pricedServices = services.map((service) => ({ id: service.id, name: service.name, category: service.category, price: getPrice(service, vehicleType, vehicleSize as VehicleSize) }));
    const subtotal = pricedServices.reduce((sum, service) => sum + service.price, 0);

    await connectToDatabase();
    const shift = await Shift.findOne({ cashierId: user.id, status: 'open' }).sort({ openedAt: -1 });
    if (!shift) return NextResponse.json({ success: false, error: 'No open cashier shift. Open a shift before processing a sale.' }, { status: 409 });

    const settings = await SystemSetting.findOne({ key: 'default' }).lean();
    const enabledPaymentMethods = settings?.paymentMethods || { cash: true, gcash: true, card: true };
    if (enabledPaymentMethods[paymentMethod] !== true) {
      return NextResponse.json({ success: false, error: `${paymentMethod.toUpperCase()} payments are currently disabled in system settings.` }, { status: 409 });
    }

    let discount = 0;
    let promoId = undefined;
    let promoName = '';
    let promoType = undefined;

    if (body.promoId) {
      const promo = await Promo.findOne({ _id: body.promoId, active: true }).lean();
      if (!promo || !promoMatches(promo, { ...body, vehicleType, vehicleSize }, services)) {
        return NextResponse.json({ success: false, error: 'Selected promotion is not eligible for this order.' }, { status: 400 });
      }
      if (promo.requiresVerification && body.promoVerified !== true) {
        return NextResponse.json({ success: false, error: 'This promotion requires cashier verification.' }, { status: 400 });
      }
      discount = promo.discountType === 'percentage' ? subtotal * (Number(promo.discountValue) / 100) : Number(promo.discountValue);
      discount = Math.min(subtotal, Math.max(0, discount));
      promoId = promo._id;
      promoName = promo.name;
      promoType = promo.discountType;
    }

    const total = Math.max(0, subtotal - discount);
    const amountPaid = Number(body.amountPaid);
    if (!Number.isFinite(amountPaid) || amountPaid < total) {
      return NextResponse.json({ success: false, error: paymentMethod === 'cash' ? 'Cash received is less than the total.' : 'Payment amount is insufficient.' }, { status: 400 });
    }
    if (paymentMethod !== 'cash' && Math.abs(amountPaid - total) > 0.005) {
      return NextResponse.json({ success: false, error: 'For GCash or card, payment amount must equal the total.' }, { status: 400 });
    }

    const change = paymentMethod === 'cash' ? Math.max(0, amountPaid - total) : 0;
    const transactionNo = makeTransactionNo();
    const now = new Date();
    const session = await mongoose.startSession();

    try {
      let transaction: any;
      await session.withTransaction(async () => {
        const inventoryItems = await InventoryItem.find({ active: true, 'usage.serviceId': { $in: serviceIds } }).session(session).lean();
        const deductions = inventoryItems.map((item: any) => ({ item, quantity: item.usage.filter((usage: any) => serviceIds.includes(String(usage.serviceId))).reduce((sum: number, usage: any) => sum + Number(usage.quantity || 0), 0) })).filter((entry: any) => entry.quantity > 0);

        for (const entry of deductions) {
          if (Number(entry.item.quantity) < entry.quantity) throw new Error(`INSUFFICIENT_INVENTORY:${entry.item.name}:${entry.item.quantity}:${entry.quantity}:${entry.item.unit}`);
        }

        const created = await Transaction.create([{
          transactionNo,
          customerName: String(body.customerName || '').trim(),
          plate,
          vehicleType,
          vehicleSize,
          services: pricedServices,
          subtotal,
          discount,
          promoId,
          promoName,
          promoType,
          total,
          paymentMethod,
          amountPaid,
          change,
          shiftId: shift._id,
          createdBy: user.id,
          status: 'completed',
        }], { session });
        transaction = created[0];

        await Queue.create([{
          transactionId: transaction._id,
          transactionNo,
          plate,
          customerName: String(body.customerName || '').trim() || 'Walk-in Customer',
          vehicleType,
          vehicleSize,
          services: pricedServices.map((service) => service.name),
          total,
          status: 'waiting',
          washer: 'Unassigned',
          createdBy: user.id,
        }], { session });

        for (const entry of deductions) {
          const before = Number(entry.item.quantity);
          const after = before - entry.quantity;
          const updated = await InventoryItem.updateOne({ _id: entry.item._id, active: true, quantity: { $gte: entry.quantity } }, { $inc: { quantity: -entry.quantity } }, { session });
          if (updated.modifiedCount !== 1) throw new Error(`INVENTORY_CHANGED:${entry.item.name}`);
          await InventoryMovement.create([{ itemId: entry.item._id, itemName: entry.item.name, type: 'sale', quantity: -entry.quantity, beforeQuantity: before, afterQuantity: after, transactionId: transaction._id, transactionNo, userId: user.id, reason: 'POS sale' }], { session });
        }

        const customerName = String(body.customerName || '').trim() || 'Walk-in Customer';
        const normalizedName = customerName.toLowerCase();
        const customer = await Customer.findOne({ 'vehicles.plate': plate }).session(session);
        if (customer) {
          const vehicle = customer.vehicles.find((item: any) => item.plate === plate);
          if (vehicle) { vehicle.vehicleType = vehicleType; vehicle.vehicleSize = vehicleSize || vehicle.vehicleSize; vehicle.visitCount = Number(vehicle.visitCount || 0) + 1; vehicle.lastVisitAt = now; }
          else customer.vehicles.push({ plate, vehicleType, vehicleSize, visitCount: 1, lastVisitAt: now });
          customer.totalVisits = Number(customer.totalVisits || 0) + 1;
          customer.lastVisitAt = now;
          if (customer.name === 'Walk-in Customer' && customerName !== 'Walk-in Customer') { customer.name = customerName; customer.normalizedName = normalizedName; }
          await customer.save({ session });
        } else {
          await Customer.create([{ name: customerName, normalizedName, vehicles: [{ plate, vehicleType, vehicleSize, visitCount: 1, lastVisitAt: now }], totalVisits: 1, lastVisitAt: now }], { session });
        }

        await AuditLog.create([{
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: 'SALE_COMPLETED',
          transactionId: transaction._id,
          transactionNo,
          reason: 'POS sale completed',
          metadata: {
            total,
            discount,
            paymentMethod,
            plate,
            vehicleType,
            vehicleSize,
            serviceIds,
            promoName: promoName || undefined,
            shiftId: shift._id,
          },
        }], { session });
      });
      return NextResponse.json({ success: true, transaction, pricing: { subtotal, discount, total, change } }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.startsWith('INSUFFICIENT_INVENTORY:')) { const [, name, available, required, unit] = message.split(':'); return NextResponse.json({ success: false, error: `Insufficient inventory: ${name}. Available ${available} ${unit}, required ${required} ${unit}.` }, { status: 409 }); }
      if (message.startsWith('INVENTORY_CHANGED:')) { const [, name] = message.split(':'); return NextResponse.json({ success: false, error: `Inventory changed while saving ${name}. Please review stock and try again.` }, { status: 409 }); }
      throw error;
    } finally { await session.endSession(); }
  } catch (error) {
    console.error('POST /api/transactions failed:', error);
    return NextResponse.json({ success: false, error: error instanceof Error && error.message.includes('No open cashier shift') ? error.message : 'Unable to save transaction.' }, { status: 500 });
  }
}
