import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";

class CancelOrderError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const rl = rateLimit(request, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
    keyPrefix: "payment-cancel",
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
    const orderCode =
      typeof parsed.data.orderCode === "string"
        ? parsed.data.orderCode.trim()
        : "";

    if (!orderCode) {
      return NextResponse.json(
        { error: "Falta el código de la orden." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();

    const existingOrder = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true, status: true, userId: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 }
      );
    }

    if (existingOrder.userId && existingOrder.userId !== currentUser?.id) {
      return NextResponse.json(
        { error: "No autorizado para cancelar esta orden." },
        { status: currentUser ? 403 : 401 }
      );
    }

    if (existingOrder.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar órdenes pendientes de pago." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: existingOrder.id, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });

      if (claimed.count !== 1) {
        throw new CancelOrderError(
          "La orden ya fue cancelada o modificada.",
          409
        );
      }

      const orderItems = await tx.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: { variantId: true, quantity: true },
        orderBy: { variantId: "asc" },
      });

      for (const item of orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.payment.updateMany({
        where: { orderId: existingOrder.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof CancelOrderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("User Cancel Order API Error:", error);
    return NextResponse.json(
      { error: "Error interno al cancelar la orden." },
      { status: 500 }
    );
  }
}
