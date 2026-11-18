import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  isValidCloudinaryReceiptUrl,
  parseJsonBody,
  verifySameOrigin,
} from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";

class PaymentBusinessError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function GET(request) {
  const rl = rateLimit(request, {
    limit: 30,
    windowMs: 5 * 60 * 1000,
    keyPrefix: "payment-get",
  });
  if (!rl.ok) {
    return NextResponse.json({ error: rl.error }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderCode = String(searchParams.get("orderCode") ?? "").trim();
    if (!orderCode) {
      return NextResponse.json(
        { error: "Codigo de orden requerido." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: {
        orderCode: true,
        status: true,
        totalAmount: true,
        currency: true,
        userId: true,
        payments: {
          select: {
            id: true,
            status: true,
            receiptUrl: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    if (
      order.userId &&
      order.userId !== currentUser?.id &&
      currentUser?.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "No autorizado para ver esta orden." },
        { status: currentUser ? 403 : 401 }
      );
    }

    return NextResponse.json({
      order: {
        orderCode: order.orderCode,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        hasReceipt: order.payments.some((p) => Boolean(p.receiptUrl)),
      },
    });
  } catch (error) {
    console.error("Payment GET API Error:", error);
    return NextResponse.json(
      { error: "Error interno al consultar la orden." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  const rl = rateLimit(request, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
    keyPrefix: "payment",
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
    const receiptUrl =
      typeof parsed.data.receiptUrl === "string"
        ? parsed.data.receiptUrl.trim()
        : "";

    if (!receiptUrl || !orderCode) {
      return NextResponse.json(
        {
          error:
            "Faltan datos. Asegúrate de enviar la URL del comprobante y el código de la orden.",
        },
        { status: 400 }
      );
    }

    if (!isValidCloudinaryReceiptUrl(receiptUrl)) {
      return NextResponse.json(
        { error: "La URL del comprobante no es válida." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderCode },
        include: {
          payments: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!order) {
        throw new PaymentBusinessError("Orden no encontrada.", 404);
      }

      if (
        order.userId &&
        order.userId !== currentUser?.id &&
        currentUser?.role !== "ADMIN"
      ) {
        throw new PaymentBusinessError(
          "No autorizado para registrar pago en esta orden.",
          currentUser ? 403 : 401
        );
      }

      if (order.status !== "PENDING_PAYMENT") {
        throw new PaymentBusinessError(
          "La orden no está pendiente de pago.",
          400
        );
      }

      const existingPending = order.payments?.[0];
      if (existingPending) {
        await tx.payment.update({
          where: { id: existingPending.id },
          data: { receiptUrl },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: "TRANSFER",
            status: "PENDING",
            amount: order.totalAmount,
            currency: order.currency,
            receiptUrl,
          },
        });
      }
    });

    return NextResponse.json({ success: true, receiptUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentBusinessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Payment API Error:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el pago." },
      { status: 500 }
    );
  }
}
