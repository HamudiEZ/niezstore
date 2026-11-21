import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "ns_session";
const SESSION_TTL_DAYS = 14;
const BCRYPT_ROUNDS = 12;
const SESSION_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  "$2b$12$lotmwhdvZB.W8yYxwI8s8unBLM.eLB18568wXoP5I020RIRQZuI/W";
const BCRYPT_HASH_PREFIX_REGEX = /^\$2[aby]\$/;

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
};

let lastSessionCleanupAt = 0;

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export async function hashPassword(password) {
  return bcrypt.hash(String(password), BCRYPT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  const hash = String(passwordHash ?? "");
  if (!hash) return false;

  if (BCRYPT_HASH_PREFIX_REGEX.test(hash)) {
    return bcrypt.compare(String(password), hash);
  }

  return false;
}

export async function verifyPasswordConstantTime(password, passwordHash) {
  const hash = String(passwordHash ?? "");
  if (!hash || !BCRYPT_HASH_PREFIX_REGEX.test(hash)) {
    await bcrypt.compare(String(password), DUMMY_PASSWORD_HASH);
    return false;
  }

  return bcrypt.compare(String(password), hash);
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId) {
  await maybeCleanupExpiredSessions();
  const token = randomBytes(48).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token) {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  await maybeCleanupExpiredSessions();

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: SAFE_USER_SELECT,
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function maybeCleanupExpiredSessions() {
  const now = Date.now();
  if (now - lastSessionCleanupAt < SESSION_CLEANUP_INTERVAL_MS) return;
  lastSessionCleanupAt = now;

  try {
    await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date(now) } },
    });
  } catch {
    // Ignore cleanup failures to avoid blocking auth flow.
  }
}
