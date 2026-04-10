import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const ALLOWED_STATUSES = new Set([
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const STATUS_TRANSITIONS = {
  PENDING_PAYMENT: ["PENDING_PAYMENT", "PAID", "CANCELLED"],
  PAID: ["PAID", "PROCESSING", "CANCELLED"],
  PROCESSING: ["PROCESSING", "SHIPPED", "CANCELLED"],
  SHIPPED: ["SHIPPED", "DELIVERED"],
  DELIVERED: ["DELIVERED"],
  CANCELLED: ["CANCELLED"],
};

function normalizeOrderStatus(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PENDING") return "PENDING_PAYMENT";
  return normalized;
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const orderId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!orderId) {
    return NextResponse.json({ error: "ID de orden requerido." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = normalizeOrderStatus(body.status);

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Estado de orden invalido." }, { status: 400 });
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    const currentStatus = normalizeOrderStatus(existingOrder.status);
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [currentStatus];

    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          error: `No se puede cambiar de ${currentStatus} a ${status}.`,
          currentStatus,
          allowedTransitions,
        },
        { status: 409 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      // Restore stock if cancelled
      if (status === "CANCELLED" && currentStatus !== "CANCELLED") {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: orderId },
          select: { variantId: true, quantity: true },
        });

        for (const item of orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin Update Order Status API Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el estado de la orden." },
      { status: 500 }
    );
  }
}
