import { NextResponse } from "next/server";
import { deleteSessionByToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifySameOrigin } from "@/lib/api-security";

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  try {
    await deleteSessionByToken(token);
  } catch (error) {
    console.error("Logout session cleanup failed:", error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
