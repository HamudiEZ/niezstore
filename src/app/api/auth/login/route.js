import {
  SESSION_COOKIE_NAME,
  createSession,
  deleteSessionByToken,
  normalizeEmail,
  verifyPasswordConstantTime,
} from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { prisma } from "@/lib/prisma";
import {
  checkLoginRateLimit,
  clearLoginFailures,
  getLoginRateLimitKey,
  registerLoginFailure,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const MAX_LOGIN_PASSWORD_LENGTH = 256;

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contraseña son obligatorios." },
      { status: 400 }
    );
  }

  if (
    email.length > INPUT_LIMITS.userEmail ||
    password.length > MAX_LOGIN_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 }
    );
  }

  const rateLimitKey = getLoginRateLimitKey(request, email);
  const rl = checkLoginRateLimit(rateLimitKey);
  if (rl.blocked) {
    return NextResponse.json(
      {
        error: `Demasiados intentos fallidos. Intenta nuevamente en ${rl.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await verifyPasswordConstantTime(
      password,
      user?.passwordHash
    );

    if (!user || !passwordMatches) {
      registerLoginFailure(rateLimitKey);
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    clearLoginFailures(rateLimitKey);

    const existingToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (existingToken) {
      await deleteSessionByToken(existingToken).catch(() => {});
    }

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
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Error interno al iniciar sesión." },
      { status: 500 }
    );
  }
}
