import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { rateLimit } from "@/lib/rate-limit";

const CLOUDINARY_PRODUCTS_FOLDER = "niezstore";
const CLOUDINARY_RECEIPTS_FOLDER = INPUT_LIMITS.receiptCloudinaryFolder;
const MAX_RECEIPTS_PER_ORDER = 5;

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const rl = rateLimit(request, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
    keyPrefix: "cloudinary-sig",
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

  try {
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.role === "ADMIN";
    const body = parsed.data;
    const requestedFolder =
      typeof body.folder === "string" && body.folder.trim()
        ? body.folder.trim()
        : CLOUDINARY_PRODUCTS_FOLDER;

    if (
      requestedFolder !== CLOUDINARY_PRODUCTS_FOLDER &&
      requestedFolder !== CLOUDINARY_RECEIPTS_FOLDER
    ) {
      return NextResponse.json(
        { error: "Carpeta de subida invalida." },
        { status: 400 }
      );
    }

    if (requestedFolder === CLOUDINARY_PRODUCTS_FOLDER) {
      if (!currentUser) {
        return NextResponse.json({ error: "No autorizado." }, { status: 401 });
      }
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Permisos insuficientes para esta carpeta." },
          { status: 403 }
        );
      }
    }

    let allowedFormats = "jpg,jpeg,png,webp";
    let publicId = null;

    if (requestedFolder === CLOUDINARY_RECEIPTS_FOLDER) {
      const orderCode =
        typeof body.orderCode === "string" ? body.orderCode.trim() : "";
      if (!orderCode) {
        return NextResponse.json(
          { error: "Se requiere el codigo de orden para subir el comprobante." },
          { status: 400 }
        );
      }

      const order = await prisma.order.findUnique({
        where: { orderCode },
        select: {
          id: true,
          orderCode: true,
          status: true,
          userId: true,
          _count: { select: { payments: true } },
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Orden no encontrada." },
          { status: 404 }
        );
      }
      if (order.userId && order.userId !== currentUser?.id && !isAdmin) {
        return NextResponse.json(
          { error: "No autorizado para subir comprobante a esta orden." },
          { status: currentUser ? 403 : 401 }
        );
      }
      if (order.status !== "PENDING_PAYMENT") {
        return NextResponse.json(
          { error: "La orden ya no admite nuevos comprobantes." },
          { status: 400 }
        );
      }
      if (order._count.payments >= MAX_RECEIPTS_PER_ORDER) {
        return NextResponse.json(
          { error: "Se alcanzo el limite de comprobantes para esta orden." },
          { status: 429 }
        );
      }

      allowedFormats = INPUT_LIMITS.receiptAllowedFormats;
      publicId = `receipt_${order.id}_${crypto.randomBytes(6).toString("hex")}`;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary no configurado en el servidor." },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const params = {
      allowed_formats: allowedFormats,
      folder: requestedFolder,
      timestamp,
      ...(publicId ? { public_id: publicId } : {}),
    };

    const sortedKeys = Object.keys(params).sort();
    const paramsToSign = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: requestedFolder,
      allowedFormats,
      ...(publicId ? { publicId } : {}),
    });
  } catch (error) {
    console.error("Cloudinary signature API Error:", error);
    return NextResponse.json(
      { error: "Error interno generando firma de subida." },
      { status: 500 }
    );
  }
}
