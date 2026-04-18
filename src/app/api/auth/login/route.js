import {
  SESSION_COOKIE_NAME,
  createSession,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkLoginRateLimit,
  clearLoginFailures,
  getLoginRateLimitKey,
  registerLoginFailure,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");
  const rateLimitKey = getLoginRateLimitKey(request, email);

  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contrase\u00f1a son obligatorios." },
      { status: 400 },
    );
  }

  const rateLimit = checkLoginRateLimit(rateLimitKey);
  if (rateLimit.blocked) {
    return NextResponse.json(
      {
        error: `Demasiados intentos fallidos. Intenta nuevamente en ${rateLimit.retryAfterSeconds}s.`,
      },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    registerLoginFailure(rateLimitKey);
    return NextResponse.json(
      { error: "Correo o contrase\u00f1a incorrectos." },
      { status: 401 },
    );
  }
  clearLoginFailures(rateLimitKey);

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return response;
}
