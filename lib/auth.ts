import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { Session, User } from '@/models/Auth';

const SESSION_COOKIE = 'carwash_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_RENEW_WINDOW_SECONDS = 60 * 60 * 24;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pin, salt, 64);
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPin(pin: string, storedHash: string) {
  const [algorithm, saltHex, keyHex] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, 'hex');
    const actual = crypto.scryptSync(pin, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function setSessionCookie(token: string, maxAge: number) {
  return cookies().then((cookieStore) => cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  }));
}

export async function createSession(userId: string) {
  await connectToDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await Session.create({ userId, tokenHash, expiresAt });
  await setSessionCookie(token, SESSION_TTL_SECONDS);
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await connectToDatabase();

  const tokenHash = hashToken(token);
  const session = await Session.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).populate('userId');

  if (!session) {
    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return null;
  }

  if (!session.userId || !('active' in session.userId) || !session.userId.active) {
    await Session.deleteOne({ _id: session._id });
    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return null;
  }

  const user = session.userId as unknown as { _id: string; name: string; role: 'cashier' | 'manager' };
  const secondsRemaining = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));

  if (secondsRemaining <= SESSION_RENEW_WINDOW_SECONDS) {
    const renewedExpiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
    await Session.updateOne({ _id: session._id, tokenHash, expiresAt: { $gt: new Date() } }, { $set: { expiresAt: renewedExpiresAt } });
    await setSessionCookie(token, SESSION_TTL_SECONDS);
  }

  return { id: String(user._id), name: user.name, role: user.role };
}

export async function destroySession() {
  await connectToDatabase();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await Session.deleteOne({ tokenHash: hashToken(token) });

  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export { User };
