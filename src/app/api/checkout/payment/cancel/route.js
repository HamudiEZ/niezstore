import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const { orderCode } = await request.json();

    if (!orderCode) {
      return NextResponse.json({ error: "Falta el código de la orden." }, { status: 400 });
    }

    const currentUser = await getCurrentUser();

    const existingOrder = await prisma.order.findUnique({
      where: { orderCode },
      select: { id: true, status: true, userId: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    // Require authentication match for registered orders
    if (existingOrder.userId && existingOrder.userId !== currentUser?.id) {
      return NextResponse.json({ error: "No autorizado para cancelar esta orden." }, { status: 401 });
    }

    if (existingOrder.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "Solo se pueden cancelar órdenes pendientes de pago." },
        { status: 400 }
      );
    }

    // Cancel order and restore stock in parallel
    await prisma.$transaction(async (tx) => {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: { variantId: true, quantity: true },
      });

      await Promise.all([
        ...orderItems.map((item) =>
          tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          })
        ),
        tx.order.update({
          where: { id: existingOrder.id },
          data: { status: "CANCELLED" },
        }),
      ]);
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("User Cancel Order API Error:", error);
    return NextResponse.json(
      { error: "Error interno al cancelar la orden." },
      { status: 500 }
    );
  }
}
