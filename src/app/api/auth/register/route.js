import {
  SESSION_COOKIE_NAME,
  createSession,
  deleteSessionByToken,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { validatePasswordStrength } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const rl = rateLimit(request, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyPrefix: "register",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.error },
      {
        status: 429,
        headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
      }
    );
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;
  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Completa nombre, correo y contraseña." },
      { status: 400 }
    );
  }

  if (fullName.length < 2) {
    return NextResponse.json(
      { error: "El nombre debe tener al menos 2 caracteres." },
      { status: 400 }
    );
  }

  if (fullName.length > INPUT_LIMITS.userFullName) {
    return NextResponse.json(
      { error: "El nombre ingresado es demasiado largo." },
      { status: 400 }
    );
  }

  if (email.length > INPUT_LIMITS.userEmail || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido." },
      { status: 400 }
    );
  }

  const passwordValidation = validatePasswordStrength(password, {
    email,
    fullName,
  });
  if (!passwordValidation.isValid) {
    return NextResponse.json(
      { error: passwordValidation.errors[0] },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ese correo ya está registrado." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

    const existingToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (existingToken) {
      await deleteSessionByToken(existingToken).catch(() => {});
    }

    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ese correo ya está registrado." },
        { status: 409 }
      );
    }
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: "Error interno al crear la cuenta." },
      { status: 500 }
    );
  }
}
