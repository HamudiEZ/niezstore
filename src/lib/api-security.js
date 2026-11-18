import { NextResponse } from "next/server";
import { INPUT_LIMITS } from "./input-limits";

const ALLOWED_IMAGE_HOSTS = new Set(["res.cloudinary.com", "images.unsplash.com"]);

/**
 * Verifies same-origin for cookie-authenticated or state-changing requests.
 */
export function verifySameOrigin(request) {
  const origin = request.headers.get("origin");
  const rawHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  let expectedHost = rawHost.split(",")[0].trim();

  if (!expectedHost && request.url) {
    try {
      expectedHost = new URL(request.url).host;
    } catch {
      expectedHost = "";
    }
  }

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (expectedHost && parsedOrigin.host !== expectedHost) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Solicitud cross-origin bloqueada." },
            { status: 403 }
          ),
        };
      }
    } catch {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Origen invalido." },
          { status: 403 }
        ),
      };
    }
  } else if (request.headers.get("sec-fetch-site") === "cross-site") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Solicitud cross-origin bloqueada." },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

/**
 * Safely parses a JSON request body and guarantees a plain non-null object.
 */
export async function parseJsonBody(request) {
  try {
    const value = await request.json();
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Formato JSON invalido." },
          { status: 400 }
        ),
      };
    }
    return { ok: true, data: value };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Formato JSON invalido." },
        { status: 400 }
      ),
    };
  }
}

export function isValidAllowedImageUrl(url) {
  if (typeof url !== "string" || !url || url.length > INPUT_LIMITS.imageUrl) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function isValidCloudinaryReceiptUrl(url) {
  if (typeof url !== "string" || !url || url.length > INPUT_LIMITS.imageUrl) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") {
      return false;
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName && !parsed.pathname.startsWith(`/${cloudName}/`)) {
      return false;
    }
    return (
      parsed.pathname.includes("/upload/") &&
      parsed.pathname.includes("/niezstore/receipts/")
    );
  } catch {
    return false;
  }
}
