import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import {
  ALLOWED_STATUSES,
  STATUS_TRANSITIONS,
  normalizeOrderStatus,
} from "@/lib/order-status";

class OrderStatusConflictError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

export async function PATCH(request, { params }) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const orderId =
      typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    if (!orderId) {
      return NextResponse.json(
        { error: "ID de orden requerido." },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const status = normalizeOrderStatus(parsed.data.status);
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Estado de orden invalido." },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, updatedAt: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 }
      );
    }

    const currentStatus = normalizeOrderStatus(existingOrder.status);
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [
      currentStatus,
    ];

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

    if (status === currentStatus) {
      return NextResponse.json({ order: existingOrder });
    }

    const order = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: existingOrder.status },
        data: { status },
      });

      if (claimed.count !== 1) {
        throw new OrderStatusConflictError(
          "El estado de la orden cambio simultaneamente. Recarga e intenta de nuevo.",
          409
        );
      }

      if (status === "CANCELLED") {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
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
          where: { orderId, status: "PENDING" },
          data: { status: "FAILED" },
        });

        if (currentStatus === "PAID" || currentStatus === "PROCESSING") {
          await tx.payment.updateMany({
            where: { orderId, status: "APPROVED" },
            data: { status: "REFUNDED" },
          });
        }
      } else if (status === "PAID") {
        await tx.payment.updateMany({
          where: { orderId, status: "PENDING" },
          data: { status: "APPROVED" },
        });
      }

      await tx.orderAuditLog.create({
        data: {
          orderId,
          adminId: admin.id,
          action: "STATUS_CHANGED",
          details: `Estado cambiado de ${currentStatus} a ${status}`,
        },
      });

      return tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof OrderStatusConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Admin Update Order Status API Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el estado de la orden." },
      { status: 500 }
    );
  }
}
