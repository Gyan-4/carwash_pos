import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Promo } from '@/models/Promo';

const platforms = ['Grab', 'Foodpanda', 'JoyRide', 'Maxim', 'inDrive', 'SPX Express', 'J&T Express'];
const vehicleTypes = ['motorcycle', 'sedan', 'suv', 'truck'];
const vehicleSizes = ['small', 'medium', 'large', 'xl', 'xxl'];

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    await connectToDatabase();
    const promos = await Promo.find({}).sort({ active: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, promos });
  } catch { return NextResponse.json({ success: false, error: 'Unable to load promos.' }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== 'manager') return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });
    const body = await req.json();
    const name = String(body.name || '').trim();
    const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage';
    const discountValue = Number(body.discountValue);
    if (!name || !Number.isFinite(discountValue) || discountValue < 0) return NextResponse.json({ success: false, error: 'Name and valid discount are required.' }, { status: 400 });
    if (discountType === 'percentage' && discountValue > 100) return NextResponse.json({ success: false, error: 'Percentage discount cannot exceed 100.' }, { status: 400 });
    await connectToDatabase();
    const promo = await Promo.create({ name, description: String(body.description || '').trim(), discountType, discountValue, eligibleVehicleTypes: (body.eligibleVehicleTypes || []).filter((v: string) => vehicleTypes.includes(v)), eligibleVehicleSizes: (body.eligibleVehicleSizes || []).filter((v: string) => vehicleSizes.includes(v)), eligibleServiceIds: Array.isArray(body.eligibleServiceIds) ? body.eligibleServiceIds : [], eligibleCategories: Array.isArray(body.eligibleCategories) ? body.eligibleCategories : [], eligiblePlatforms: (body.eligiblePlatforms || []).filter((v: string) => platforms.includes(v)), requiresVerification: Boolean(body.requiresVerification), active: body.active !== false });
    return NextResponse.json({ success: true, promo }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: 'Unable to create promo.' }, { status: 500 }); }
}

export { platforms as PROMO_PLATFORMS, vehicleTypes as PROMO_VEHICLE_TYPES, vehicleSizes as PROMO_VEHICLE_SIZES };
