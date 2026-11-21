import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const PARAGUAY_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Asuncion",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatAsuncionDate(date) {
  return PARAGUAY_DATE_FMT.format(date);
}

export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

    const [
      salesAgg,
      ordersToVerify,
      abandonedOrders,
      abandonedTotalCount,
      lowStockVariants,
      recentPaidOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: paidStatuses } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: {
          status: "PENDING_PAYMENT",
          payments: { some: { status: "PENDING" } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          orderCode: true,
          totalAmount: true,
          createdAt: true,
          customerName: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: "PENDING_PAYMENT",
          payments: { none: {} },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          orderCode: true,
          totalAmount: true,
          createdAt: true,
          customerName: true,
          customerPhone: true,
        },
      }),
      prisma.order.count({
        where: {
          status: "PENDING_PAYMENT",
          payments: { none: {} },
        },
      }),
      prisma.productVariant.findMany({
        where: {
          stock: { lte: 5 },
          isActive: true,
          product: { isActive: true },
        },
        include: {
          product: { select: { name: true, isActive: true } },
          variantOptions: {
            include: {
              optionValue: {
                include: {
                  option: { select: { name: true, position: true } },
                },
              },
            },
          },
        },
        orderBy: { stock: "asc" },
        take: 20,
      }),
      prisma.order.findMany({
        where: {
          status: { in: paidStatuses },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue = Number(salesAgg._sum.totalAmount || 0);
    const paidOrdersCount = salesAgg._count._all || 0;
    const averageOrderValue =
      paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

    const salesByDayMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      salesByDayMap.set(formatAsuncionDate(d), 0);
    }

    recentPaidOrders.forEach((order) => {
      const dateString = formatAsuncionDate(order.createdAt);
      if (salesByDayMap.has(dateString)) {
        salesByDayMap.set(
          dateString,
          salesByDayMap.get(dateString) + Number(order.totalAmount)
        );
      }
    });

    const salesTrend = Array.from(salesByDayMap, ([date, revenue]) => ({
      date,
      revenue,
    }));

    const formattedLowStock = lowStockVariants.map((variant) => {
      const optionSummary = [...(variant.variantOptions || [])]
        .sort(
          (a, b) =>
            (a.optionValue?.option?.position ?? 0) -
            (b.optionValue?.option?.position ?? 0)
        )
        .map((vo) =>
          vo.optionValue?.option?.name && vo.optionValue?.value
            ? `${vo.optionValue.option.name}: ${vo.optionValue.value}`
            : null
        )
        .filter(Boolean)
        .join(" | ");

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        stock: variant.stock,
        optionLabel: optionSummary || "Base",
        product: variant.product,
      };
    });

    return NextResponse.json({
      metrics: {
        totalRevenue,
        averageOrderValue,
        paidOrdersCount,
      },
      actionable: {
        toVerify: ordersToVerify.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount),
        })),
        abandoned: abandonedOrders.map((o) => ({
          ...o,
          totalAmount: Number(o.totalAmount),
        })),
        abandonedTotalCount,
        lowStock: formattedLowStock,
      },
      salesTrend,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Error al cargar las metricas." },
      { status: 500 }
    );
  }
}
