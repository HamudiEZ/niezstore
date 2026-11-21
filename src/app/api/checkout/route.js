import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { validateCheckoutFormData } from "@/lib/checkout-validation";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { rateLimit } from "@/lib/rate-limit";

const MAX_CHECKOUT_ITEMS = 100;
const ABANDONED_TTL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_THROTTLE_MS = 5 * 60 * 1000;
let lastAbandonedCleanupAt = 0;

class CheckoutBusinessError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

async function maybeExpireAbandonedOrders() {
  const now = Date.now();
  if (now - lastAbandonedCleanupAt < CLEANUP_THROTTLE_MS) return;
  lastAbandonedCleanupAt = now;

  try {
    const cutoff = new Date(now - ABANDONED_TTL_MS);
    const staleOrders = await prisma.order.findMany({
      where: {
        status: "PENDING_PAYMENT",
        createdAt: { lt: cutoff },
        payments: { none: {} },
      },
      select: { id: true },
      take: 50,
    });

    for (const order of staleOrders) {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING_PAYMENT" },
          data: { status: "CANCELLED" },
        });
        if (claimed.count !== 1) return;

        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
          select: { variantId: true, quantity: true },
          orderBy: { variantId: "asc" },
        });

        for (const item of items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    }
  } catch (err) {
    console.error("Abandoned order cleanup error:", err);
  }
}

function parseStrictPositiveInt(rawValue) {
  if (typeof rawValue === "number") {
    return Number.isInteger(rawValue) ? rawValue : NaN;
  }
  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!/^\d+$/.test(trimmed)) return NaN;
    return Number.parseInt(trimmed, 10);
  }
  return NaN;
}

function normalizeCheckoutItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Tu carrito esta vacio o es invalido." };
  }
  if (items.length > MAX_CHECKOUT_ITEMS) {
    return { ok: false, error: `Maximo ${MAX_CHECKOUT_ITEMS} items por pedido.` };
  }

  const grouped = new Map();

  for (const rawItem of items) {
    const variantId =
      typeof rawItem?.variantId === "string" ? rawItem.variantId.trim() : "";
    const quantity = parseStrictPositiveInt(rawItem?.quantity);

    if (
      !variantId ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > INPUT_LIMITS.stockMax
    ) {
      return { ok: false, error: "Hay productos invalidos en el carrito." };
    }

    const nextQuantity = (grouped.get(variantId) || 0) + quantity;
    if (nextQuantity > INPUT_LIMITS.stockMax) {
      return { ok: false, error: "La cantidad solicitada supera el maximo permitido." };
    }
    grouped.set(variantId, nextQuantity);
  }

  const normalizedItems = Array.from(grouped.entries())
    .map(([variantId, quantity]) => ({ variantId, quantity }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));

  return { ok: true, items: normalizedItems };
}

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const rl = rateLimit(request, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
    keyPrefix: "checkout",
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
    await maybeExpireAbandonedOrders();

    const user = await getCurrentUser();
    const userId = user?.id;
    const body = parsed.data;

    const { items, customer, shipping, notes } = body;
    const shippingLine2 =
      typeof shipping?.line2 === "string" ? shipping.line2.trim() : "";
    const shippingRegion =
      typeof shipping?.region === "string" ? shipping.region.trim() : "";
    const shippingCountry =
      typeof shipping?.country === "string" && shipping.country.trim()
        ? shipping.country.trim().toUpperCase()
        : "PY";
    const sanitizedNotes = typeof notes === "string" ? notes.trim() : "";

    const itemsValidation = normalizeCheckoutItems(items);
    if (!itemsValidation.ok) {
      return NextResponse.json({ error: itemsValidation.error }, { status: 400 });
    }

    const formValidation = validateCheckoutFormData({
      fullName: customer?.fullName,
      email: customer?.email,
      phone: customer?.phone,
      line1: shipping?.line1,
      city: shipping?.city,
      postalCode: shipping?.postalCode,
    });

    if (!formValidation.isValid) {
      return NextResponse.json(
        {
          error: "Datos de cliente o envio invalidos.",
          fieldErrors: formValidation.errors,
        },
        { status: 400 }
      );
    }
    if (shippingLine2.length > INPUT_LIMITS.checkoutLine2) {
      return NextResponse.json(
        { error: `Linea 2 demasiado larga (max ${INPUT_LIMITS.checkoutLine2}).` },
        { status: 400 }
      );
    }
    if (shippingRegion.length > INPUT_LIMITS.checkoutRegion) {
      return NextResponse.json(
        { error: `Region demasiado larga (max ${INPUT_LIMITS.checkoutRegion}).` },
        { status: 400 }
      );
    }
    if (shippingCountry.length !== INPUT_LIMITS.checkoutCountry) {
      return NextResponse.json(
        { error: `Codigo de pais invalido (max ${INPUT_LIMITS.checkoutCountry}).` },
        { status: 400 }
      );
    }
    if (sanitizedNotes.length > INPUT_LIMITS.notes) {
      return NextResponse.json(
        { error: `La nota supera el maximo de ${INPUT_LIMITS.notes} caracteres.` },
        { status: 400 }
      );
    }

    const normalizedItems = itemsValidation.items;
    const variantIds = normalizedItems.map((item) => item.variantId);

    const order = await prisma.$transaction(async (tx) => {
      const dbVariants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });
      const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

      let subtotalAmount = 0;
      const orderItemsRecord = [];

      for (const item of normalizedItems) {
        const dbVariant = variantMap.get(item.variantId);

        if (!dbVariant || !dbVariant.isActive || !dbVariant.product?.isActive) {
          throw new CheckoutBusinessError(
            "Uno o mas productos ya no estan disponibles.",
            409
          );
        }

        if (dbVariant.stock < item.quantity) {
          throw new CheckoutBusinessError(
            `Stock insuficiente para: ${dbVariant.product.name}`,
            409
          );
        }

        const unitPrice = Number(dbVariant.price);
        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
        subtotalAmount = Math.round((subtotalAmount + lineTotal) * 100) / 100;

        orderItemsRecord.push({
          productId: dbVariant.productId,
          variantId: dbVariant.id,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      const shippingAmount = 0;
      const totalAmount = Math.round((subtotalAmount + shippingAmount) * 100) / 100;

      for (const item of normalizedItems) {
        const updateResult = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updateResult.count === 0) {
          throw new CheckoutBusinessError(
            "Ocurrio un problema con el stock del producto durante el cobro. Por favor, revisa tu carrito e intenta nuevamente.",
            409
          );
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          customerName: formValidation.normalized.fullName,
          customerEmail: formValidation.normalized.email,
          customerPhone: formValidation.normalized.phone || null,
          shippingLine1: formValidation.normalized.line1,
          shippingLine2: shippingLine2 || null,
          shippingCity: formValidation.normalized.city,
          shippingRegion: shippingRegion || null,
          shippingPostal: formValidation.normalized.postalCode || null,
          subtotalAmount,
          shippingAmount,
          totalAmount,
          shippingCountry: shippingCountry || "PY",
          notes: sanitizedNotes || null,
          user: userId ? { connect: { id: userId } } : undefined,
          items: {
            create: orderItemsRecord,
          },
        },
      });

      if (userId) {
        await tx.userCartItem.deleteMany({ where: { userId } });
      }

      return createdOrder;
    });

    return NextResponse.json(
      { success: true, orderCode: order.orderCode },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof CheckoutBusinessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el checkout." },
      { status: 500 }
    );
  }
}
