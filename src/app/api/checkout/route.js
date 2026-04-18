import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateCheckoutFormData } from "@/lib/checkout-validation";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { rateLimit } from "@/lib/rate-limit";

function normalizeCheckoutItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Tu carrito esta vacio o es invalido." };
  }

  const grouped = new Map();

  for (const rawItem of items) {
    const variantId = String(rawItem?.variantId ?? "").trim();
    const quantity = Number.parseInt(String(rawItem?.quantity ?? ""), 10);

    if (
      !variantId ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > INPUT_LIMITS.stockMax
    ) {
      return { ok: false, error: "Hay productos invalidos en el carrito." };
    }

    const currentQuantity = grouped.get(variantId) || 0;
    grouped.set(variantId, currentQuantity + quantity);
  }

  const normalizedItems = Array.from(grouped.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));

  return { ok: true, items: normalizedItems };
}

export async function POST(request) {
  const rl = rateLimit(request, { limit: 10, windowMs: 10 * 60 * 1000, keyPrefix: "checkout" });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    const body = await request.json().catch(() => ({}));

    const { items, customer, shipping, notes } = body;
    const shippingLine2 = shipping?.line2 ? String(shipping.line2).trim() : "";
    const shippingRegion = shipping?.region ? String(shipping.region).trim() : "";
    const shippingCountry = shipping?.country ? String(shipping.country).trim() : "PY";
    const sanitizedNotes = notes ? String(notes).trim() : "";

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
    if (shippingCountry.length > INPUT_LIMITS.checkoutCountry) {
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

    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    if (dbVariants.length !== variantIds.length) {
      return NextResponse.json(
        { error: "Uno o mas productos ya no estan disponibles." },
        { status: 400 }
      );
    }

    let subtotalAmount = 0;
    const orderItemsRecord = [];

    for (const item of normalizedItems) {
      const dbVariant = dbVariants.find((entry) => entry.id === item.variantId);
      if (!dbVariant) {
        return NextResponse.json(
          { error: "Uno o mas productos ya no estan disponibles." },
          { status: 400 }
        );
      }

      if (dbVariant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para: ${dbVariant.product.name}` },
          { status: 400 }
        );
      }

      const unitPrice = Number(dbVariant.price);
      const lineTotal = unitPrice * item.quantity;

      subtotalAmount += lineTotal;

      orderItemsRecord.push({
        productId: dbVariant.productId,
        variantId: dbVariant.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });
    }

    const shippingAmount = 0;
    const totalAmount = subtotalAmount + shippingAmount;

    const order = await prisma.$transaction(async (tx) => {
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

      for (const item of normalizedItems) {
        const updateResult = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updateResult.count === 0) {
          throw new Error(`Ocurrió un problema con el stock del producto durante el cobro. Por favor, revisa tu carrito e intenta nuevamente.`);
        }
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, orderCode: order.orderCode }, { status: 201 });
  } catch (error) {
    console.error("Checkout API Error:", error);
    const errorMessage = error instanceof Error && error.message.includes("stock")
      ? error.message
      : "Error interno al procesar el checkout.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
