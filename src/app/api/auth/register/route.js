import {
  SESSION_COOKIE_NAME,
  createSession,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  const rl = rateLimit(request, { limit: 5, windowMs: 15 * 60 * 1000, keyPrefix: "register" });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Completa nombre, correo y contrase\u00f1a." },
      { status: 400 },
    );
  }

  if (fullName.length > 60) {
    return NextResponse.json(
      { error: "El nombre ingresado es demasiado largo." },
      { status: 400 }
    );
  }

  if (email.length > 120) {
    return NextResponse.json(
      { error: "El correo ingresado es demasiado largo." },
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
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Ese correo ya est\u00e1 registrado." },
      { status: 409 },
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

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return response;
}
