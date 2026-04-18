const globalForRateLimit = globalThis;
const attemptsStore = globalForRateLimit.__loginAttempts ?? new Map();
const slidingStore = globalForRateLimit.__slidingRateLimit ?? new Map();

if (!globalForRateLimit.__loginAttempts) {
  globalForRateLimit.__loginAttempts = attemptsStore;
}
if (!globalForRateLimit.__slidingRateLimit) {
  globalForRateLimit.__slidingRateLimit = slidingStore;
}

/**
 * Generic sliding-window rate limiter.
 * @param {Request} request
 * @param {{ limit: number, windowMs: number, keyPrefix?: string }} options
 * @returns {{ ok: boolean, error?: string, retryAfter?: number }}
 */
export function rateLimit(request, { limit, windowMs, keyPrefix = "rl" }) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (slidingStore.get(key) || []).filter((t) => t > windowStart);
  timestamps.push(now);
  slidingStore.set(key, timestamps);

  // Periodic cleanup to avoid unbounded memory growth
  if (slidingStore.size > 5_000) {
    for (const [k, ts] of slidingStore.entries()) {
      if (ts.every((t) => t <= windowStart)) slidingStore.delete(k);
    }
  }

  if (timestamps.length > limit) {
    const retryAfter = Math.ceil(windowMs / 1000);
    return {
      ok: false,
      error: `Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`,
      retryAfter,
    };
  }

  return { ok: true };
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function getLoginRateLimitKey(request, email) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}:${email}`;
}

export function checkLoginRateLimit(key) {
  const now = Date.now();
  const entry = attemptsStore.get(key);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };

  if (entry.resetAt <= now) {
    attemptsStore.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }

  if (entry.count < MAX_ATTEMPTS) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { blocked: true, retryAfterSeconds };
}

export function registerLoginFailure(key) {
  const now = Date.now();
  const entry = attemptsStore.get(key);

  if (!entry || entry.resetAt <= now) {
    attemptsStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count += 1;
  attemptsStore.set(key, entry);
}

export function clearLoginFailures(key) {
  attemptsStore.delete(key);
}
