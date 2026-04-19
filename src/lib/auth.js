import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "ns_session";
const SESSION_TTL_DAYS = 14;
const BCRYPT_ROUNDS = 12;
const SESSION_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
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

  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    return bcrypt.compare(String(password), hash);
  }

  return false;
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
  await maybeCleanupExpiredSessions();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

/**
 * @serverless-caveat
 * `lastSessionCleanupAt` es estado local de modulo. En un entorno serverless (Vercel, AWS Lambda)
 * o multi-worker, esto se reinicia en cada cold start. El throttle de 5 minutos solo aplica
 * por instancia. En alta concurrencia, multiples instancias ejecutaran el cleanup a la vez.
 * Como el deleteMany es idempotente, no es critico, pero el throttling es ilusorio en la nube.
 */
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
