import crypto from 'crypto';
import { User, UserRole } from '../src/types/index.ts';

// In-memory token store mapped to userId and expiration
interface SessionData {
  userId: string;
  role: UserRole;
  companyId?: string | null;
  createdAt: number;
  expiresAt: number;
}

const activeSessions = new Map<string, SessionData>();

// Session validity: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
}

export function createSession(user: { id: string; role: UserRole; companyId?: string | null }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    userId: user.id,
    role: user.role,
    companyId: user.companyId || null,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  });
  return token;
}

export function validateSession(token: string): SessionData | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token: string): boolean {
  return activeSessions.delete(token);
}

export function sanitizeUser(user: any): User {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser as User;
}
