const globalForRateLimit = globalThis;
const attemptsStore = globalForRateLimit.__loginAttempts ?? new Map();
const slidingStore = globalForRateLimit.__slidingRateLimit ?? new Map();

if (!globalForRateLimit.__loginAttempts) {
  globalForRateLimit.__loginAttempts = attemptsStore;
}
if (!globalForRateLimit.__slidingRateLimit) {
  globalForRateLimit.__slidingRateLimit = slidingStore;
}

const MAX_STORE_ENTRIES = 5_000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20;

export function getClientIp(request) {
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) return first;
  }

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const rightmost = parts[parts.length - 1];
    if (rightmost) return rightmost;
  }

  return "local";
}

function pruneSlidingStore(now) {
  for (const [k, entry] of slidingStore.entries()) {
    const timestamps = Array.isArray(entry) ? entry : entry?.timestamps || [];
    const entryWindowMs = Array.isArray(entry) ? WINDOW_MS : entry?.windowMs || WINDOW_MS;
    const cutoff = now - entryWindowMs;
    if (timestamps.every((t) => t <= cutoff)) {
      slidingStore.delete(k);
    }
  }

  while (slidingStore.size > MAX_STORE_ENTRIES) {
    const oldestKey = slidingStore.keys().next().value;
    if (!oldestKey) break;
    slidingStore.delete(oldestKey);
  }
}

function pruneAttemptsStore(now) {
  for (const [k, entry] of attemptsStore.entries()) {
    if (!entry || entry.resetAt <= now) {
      attemptsStore.delete(k);
    }
  }

  while (attemptsStore.size > MAX_STORE_ENTRIES) {
    const oldestKey = attemptsStore.keys().next().value;
    if (!oldestKey) break;
    attemptsStore.delete(oldestKey);
  }
}

/**
 * Generic sliding-window rate limiter.
 * @param {Request} request
 * @param {{ limit: number, windowMs: number, keyPrefix?: string }} options
 * @returns {{ ok: boolean, error?: string, retryAfter?: number }}
 */
export function rateLimit(request, { limit, windowMs, keyPrefix = "rl" }) {
  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = slidingStore.get(key);
  const rawTimestamps = Array.isArray(existing) ? existing : existing?.timestamps || [];
  const timestamps = rawTimestamps.filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
    slidingStore.set(key, { timestamps, windowMs });
    return {
      ok: false,
      error: `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`,
      retryAfter,
    };
  }

  timestamps.push(now);
  slidingStore.set(key, { timestamps, windowMs });

  if (slidingStore.size > MAX_STORE_ENTRIES) {
    pruneSlidingStore(now);
  }

  return { ok: true };
}

export function getLoginRateLimitKey(request, email) {
  const ip = getClientIp(request);
  return `${ip}:${email}`;
}

function getIpBucketKey(accountKey) {
  const idx = accountKey.lastIndexOf(":");
  const ip = idx > 0 ? accountKey.slice(0, idx) : accountKey;
  return `ip:${ip}`;
}

function checkBucket(key, maxAttempts, now) {
  const entry = attemptsStore.get(key);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };

  if (entry.resetAt <= now) {
    attemptsStore.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }

  if (entry.count < maxAttempts) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return { blocked: true, retryAfterSeconds };
}

function incrementBucket(key, now) {
  const entry = attemptsStore.get(key);
  if (!entry || entry.resetAt <= now) {
    attemptsStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
  attemptsStore.set(key, entry);
}

export function checkLoginRateLimit(key) {
  const now = Date.now();
  const accountCheck = checkBucket(key, MAX_ATTEMPTS, now);
  if (accountCheck.blocked) return accountCheck;

  const ipCheck = checkBucket(getIpBucketKey(key), MAX_IP_ATTEMPTS, now);
  if (ipCheck.blocked) return ipCheck;

  return { blocked: false, retryAfterSeconds: 0 };
}

export function registerLoginFailure(key) {
  const now = Date.now();
  incrementBucket(key, now);
  incrementBucket(getIpBucketKey(key), now);

  if (attemptsStore.size > MAX_STORE_ENTRIES) {
    pruneAttemptsStore(now);
  }
}

export function clearLoginFailures(key) {
  attemptsStore.delete(key);
}
