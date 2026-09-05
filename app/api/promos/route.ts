import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { Promo } from '@/models/Promo';

const platforms = ['Grab', 'Foodpanda', 'JoyRide', 'Maxim', 'inDrive', 'SPX Express', 'J&T Express'];
const vehicleTypes = ['motorcycle', 'sedan', 'suv', 'truck'];
const vehicleSizes = ['small', 'medium', 'large', 'xl', 'xxl'];

function cleanPayload(body: any) {
  const name = String(body.name || '').trim();
  const discountType = body.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Number(body.discountValue);

  if (!name || !Number.isFinite(discountValue) || discountValue < 0) {
    throw new Error('Name and valid discount are required.');
  }

  if (discountType === 'percentage' && discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100.');
  }

  return {
    name,
    description: String(body.description || '').trim(),
    discountType,
    discountValue,
    eligibleVehicleTypes: Array.isArray(body.eligibleVehicleTypes)
      ? body.eligibleVehicleTypes.filter((v: string) => vehicleTypes.includes(v))
      : [],
    eligibleVehicleSizes: Array.isArray(body.eligibleVehicleSizes)
      ? body.eligibleVehicleSizes.filter((v: string) => vehicleSizes.includes(v))
      : [],
    eligibleServiceIds: Array.isArray(body.eligibleServiceIds) ? body.eligibleServiceIds : [],
    eligibleCategories: Array.isArray(body.eligibleCategories) ? body.eligibleCategories : [],
    eligiblePlatforms: Array.isArray(body.eligiblePlatforms)
      ? body.eligiblePlatforms.filter((v: string) => platforms.includes(v))
      : [],
    requiresVerification: Boolean(body.requiresVerification),
    active: body.active !== false,
  };
}

async function requireManager() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'manager') {
    return null;
  }
  return user;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    await connectToDatabase();
    const promos = await Promo.find({}).sort({ active: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, promos });
  } catch (error) {
    console.error('GET /api/promos failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load promos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireManager();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });
    }

    const body = await req.json();
    let payload;

    try {
      payload = cleanPayload(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid promo.' },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const promo = await Promo.create(payload);

    return NextResponse.json({ success: true, promo }, { status: 201 });
  } catch (error) {
    console.error('POST /api/promos failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to create promo.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireManager();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Promo ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    let payload;

    try {
      payload = cleanPayload(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid promo.' },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const promo = await Promo.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();

    if (!promo) {
      return NextResponse.json({ success: false, error: 'Promo not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, promo });
  } catch (error) {
    console.error('PATCH /api/promos failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update promo.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireManager();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Manager authorization required.' }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Promo ID is required.' }, { status: 400 });
    }

    await connectToDatabase();
    const promo = await Promo.findByIdAndDelete(id).lean();

    if (!promo) {
      return NextResponse.json({ success: false, error: 'Promo not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/promos failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to delete promo.' }, { status: 500 });
  }
}

export { platforms as PROMO_PLATFORMS, vehicleTypes as PROMO_VEHICLE_TYPES, vehicleSizes as PROMO_VEHICLE_SIZES };
