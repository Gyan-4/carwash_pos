import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthenticatedUser, hashPin, User } from '@/lib/auth';
import { AuditLog } from '@/models/AuditLog';
import { Transaction } from '@/models/Transaction';

const LOCKOUT_FIELDS = ['lockoutAfterAttempts', 'lockoutBaseMinutes', 'lockoutMultiplier', 'lockoutMaxMinutes'] as const;

async function requireManager() {
  const user = await getAuthenticatedUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) };
  if (user.role !== 'manager') return { error: NextResponse.json({ error: 'Manager access required.' }, { status: 403 }) };
  return { user };
}

function parseLockoutSettings(body: any) {
  const values = {
    lockoutAfterAttempts: Number(body.lockoutAfterAttempts),
    lockoutBaseMinutes: Number(body.lockoutBaseMinutes),
    lockoutMultiplier: Number(body.lockoutMultiplier),
    lockoutMaxMinutes: Number(body.lockoutMaxMinutes),
  };
  if (!Number.isInteger(values.lockoutAfterAttempts) || values.lockoutAfterAttempts < 1 || values.lockoutAfterAttempts > 20) throw new Error('Failed-attempt threshold must be between 1 and 20.');
  if (!Number.isFinite(values.lockoutBaseMinutes) || values.lockoutBaseMinutes < 1 || values.lockoutBaseMinutes > 1440) throw new Error('Base lockout must be between 1 and 1440 minutes.');
  if (!Number.isFinite(values.lockoutMultiplier) || values.lockoutMultiplier < 1 || values.lockoutMultiplier > 10) throw new Error('Lockout multiplier must be between 1 and 10.');
  if (!Number.isFinite(values.lockoutMaxMinutes) || values.lockoutMaxMinutes < values.lockoutBaseMinutes || values.lockoutMaxMinutes > 10080) throw new Error('Maximum lockout must be at least the base lockout and no more than 10080 minutes.');
  return values;
}

export async function GET() {
  try {
    const auth = await requireManager();
    if (auth.error) return auth.error;
    await connectToDatabase();
    const users = await User.find({}, { pinHash: 0 }).sort({ role: 1, name: 1 }).lean();
    return NextResponse.json({ users: users.map((user) => ({ ...user, id: String(user._id), _id: undefined })) });
  } catch (error) {
    console.error('GET /api/users failed:', error);
    return NextResponse.json({ error: 'Unable to load users.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireManager();
    if (auth.error) return auth.error;
    const body = await req.json();
    const name = String(body.name || '').trim();
    const role = body.role;
    const pin = String(body.pin || '');
    if (!name || name.length > 100) return NextResponse.json({ error: 'Enter a valid name.' }, { status: 400 });
    if (!['cashier', 'manager'].includes(role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 });
    await connectToDatabase();
    const duplicate = await User.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    if (duplicate) return NextResponse.json({ error: 'A user with that name already exists.' }, { status: 409 });
    const user = await User.create({ name, role, pinHash: hashPin(pin), active: true });
    await AuditLog.create({ userId: auth.user.id, userName: auth.user.name, role: auth.user.role, action: 'USER_CREATED', reason: `Created ${role} account for ${name}`, metadata: { createdUserId: String(user._id), createdUserName: name, createdRole: role } });
    return NextResponse.json({ success: true, user: { id: String(user._id), name: user.name, role: user.role, active: user.active } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users failed:', error);
    return NextResponse.json({ error: 'Unable to create user.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireManager();
    if (auth.error) return auth.error;
    const body = await req.json();
    const id = String(body.id || '');
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid user.' }, { status: 400 });
    await connectToDatabase();
    const target = await User.findById(id);
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    if (body.resetLockout === true) {
      target.failedPinAttempts = 0;
      target.lockedUntil = null;
      target.lockoutLevel = 0;
      await target.save();
      await AuditLog.create({ userId: auth.user.id, userName: auth.user.name, role: auth.user.role, action: 'USER_LOCKOUT_RESET', reason: `Reset PIN lockout for ${target.name}`, metadata: { targetUserId: id, targetUserName: target.name } });
      return NextResponse.json({ success: true, user: { id: String(target._id), name: target.name, role: target.role, active: target.active } });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name || name.length > 100) return NextResponse.json({ error: 'Enter a valid name.' }, { status: 400 });
      const duplicate = await User.findOne({ _id: { $ne: id }, name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
      if (duplicate) return NextResponse.json({ error: 'A user with that name already exists.' }, { status: 409 });
      updates.name = name;
    }
    if (body.role !== undefined) {
      if (!['cashier', 'manager'].includes(body.role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      updates.role = body.role;
    }
    if (body.pin !== undefined) {
      const pin = String(body.pin || '');
      if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 });
      updates.pinHash = hashPin(pin);
      updates.failedPinAttempts = 0;
      updates.lockedUntil = null;
      updates.lockoutLevel = 0;
    }
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') return NextResponse.json({ error: 'Invalid active status.' }, { status: 400 });
      if (String(target._id) === auth.user.id && body.active === false) return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
      updates.active = body.active;
    }

    const hasAnyLockoutField = LOCKOUT_FIELDS.some((field) => body[field] !== undefined);
    if (hasAnyLockoutField) {
      if (target.role !== 'cashier' && body.role !== 'cashier') return NextResponse.json({ error: 'Gradual lockout settings can only be configured for cashier accounts.' }, { status: 400 });
      try {
        const lockoutSettings = parseLockoutSettings({
          lockoutAfterAttempts: body.lockoutAfterAttempts ?? target.lockoutAfterAttempts,
          lockoutBaseMinutes: body.lockoutBaseMinutes ?? target.lockoutBaseMinutes,
          lockoutMultiplier: body.lockoutMultiplier ?? target.lockoutMultiplier,
          lockoutMaxMinutes: body.lockoutMaxMinutes ?? target.lockoutMaxMinutes,
        });
        Object.assign(updates, lockoutSettings);
        updates.failedPinAttempts = 0;
        updates.lockedUntil = null;
        updates.lockoutLevel = 0;
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid lockout settings.' }, { status: 400 });
      }
    }

    Object.assign(target, updates);
    await target.save();
    const changedFields = Object.keys(updates).filter((field) => field !== 'pinHash');
    const action = body.pin !== undefined && changedFields.filter((field) => !['failedPinAttempts', 'lockedUntil', 'lockoutLevel'].includes(field)).length === 0 ? 'USER_PIN_CHANGED' : 'USER_UPDATED';
    await AuditLog.create({ userId: auth.user.id, userName: auth.user.name, role: auth.user.role, action, reason: action === 'USER_PIN_CHANGED' ? `Changed PIN for ${target.name}` : `Updated user ${target.name}`, metadata: { targetUserId: id, targetUserName: target.name, changedFields } });
    return NextResponse.json({ success: true, user: { id: String(target._id), name: target.name, role: target.role, active: target.active } });
  } catch (error) {
    console.error('PATCH /api/users failed:', error);
    return NextResponse.json({ error: 'Unable to update user.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireManager();
    if (auth.error) return auth.error;
    const body = await req.json();
    const id = String(body.id || '');
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid user.' }, { status: 400 });
    if (id === auth.user.id) return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    await connectToDatabase();
    const target = await User.findById(id);
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const transactionCount = await Transaction.countDocuments({ createdBy: target._id });
    if (transactionCount > 0) return NextResponse.json({ error: 'This user has transaction history and cannot be deleted. Deactivate the account instead.' }, { status: 409 });
    await User.deleteOne({ _id: target._id });
    await AuditLog.create({ userId: auth.user.id, userName: auth.user.name, role: auth.user.role, action: 'USER_DELETED', reason: `Deleted user ${target.name}`, metadata: { deletedUserId: id, deletedUserName: target.name, deletedRole: target.role } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users failed:', error);
    return NextResponse.json({ error: 'Unable to delete user.' }, { status: 500 });
  }
}
