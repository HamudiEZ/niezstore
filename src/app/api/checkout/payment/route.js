import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  const rl = rateLimit(request, { limit: 5, windowMs: 5 * 60 * 1000, keyPrefix: "payment" });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  try {
    const { orderCode, receiptUrl } = await request.json();

    if (!receiptUrl || !orderCode) {
      return NextResponse.json(
        { error: "Faltan datos. Asegúrate de enviar la URL del comprobante y el código de la orden." },
        { status: 400 }
      );
    }

    // Validate order
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { payments: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "La orden no está pendiente de pago." }, { status: 400 });
    }

    // Create payment record
    await prisma.$transaction(async (tx) => {
      // Create payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "TRANSFER",
          status: "PENDING",
          amount: order.totalAmount,
          currency: order.currency,
          receiptUrl,
        }
      });
    });

    return NextResponse.json({ success: true, receiptUrl }, { status: 201 });
  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json(
      { error: "Error interno al procesar el pago." },
      { status: 500 }
    );
  }
}
