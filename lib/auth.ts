import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { Session, User } from '@/models';

const SESSION_COOKIE = 'carwash_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PIN_SALT_BYTES = 16;
const TOKEN_BYTES = 32;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(PIN_SALT_BYTES);
  const derivedKey = crypto.scryptSync(pin, salt, 64);
  return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export function verifyPin(pin: string, storedHash: string) {
  const [algorithm, saltHex, keyHex] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    const actual = crypto.scryptSync(pin, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createSession(userId: string) {
  await connectToDatabase();

  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await Session.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getAuthenticatedUser() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).populate('userId');

  if (!session?.userId) return null;

  const user = session.userId as unknown as {
    _id: string;
    name: string;
    role: 'cashier' | 'manager';
    active: boolean;
  };

  if (!user.active) return null;

  return {
    id: String(user._id),
    name: user.name,
    role: user.role,
  };
}

export async function destroySession() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await Session.deleteOne({ tokenHash: hashToken(token) });
  }

  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export { User };
