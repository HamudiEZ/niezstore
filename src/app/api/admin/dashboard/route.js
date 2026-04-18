import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total Revenue (from non-cancelled/non-pending orders)
    const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
    
    // Using simple findMany and reduce because Prisma aggregate on Decimal can sometimes be tricky
    // but aggregate is better for performance. Let's use aggregate.
    const revenueAgg = await prisma.order.aggregate({
      where: { status: { in: paidStatuses } },
      _sum: { totalAmount: true },
    });
    
    const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

    // 2. Average Order Value
    const paidOrdersCount = await prisma.order.count({
      where: { status: { in: paidStatuses } },
    });
    
    const averageOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;

    // 3. Customers Count
    const totalCustomers = await prisma.user.count({
      where: { role: "CUSTOMER" },
    });

    // 4. Pending Verification (User uploaded receipt, Admin needs to check)
    const ordersToVerify = await prisma.order.findMany({
      where: {
        status: "PENDING_PAYMENT",
        payments: { some: {} } // Has at least one payment record
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderCode: true,
        totalAmount: true,
        createdAt: true,
        customerName: true
      }
    });

    // 5. Abandoned Carts (User created order but never uploaded receipt)
    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: "PENDING_PAYMENT",
        payments: { none: {} } // No payment records
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderCode: true,
        totalAmount: true,
        createdAt: true,
        customerName: true,
        customerPhone: true
      }
    });

    // 6. Low Stock Alerts (Variants with stock <= 5)
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: 5 },
        isActive: true,
      },
      include: {
        product: { select: { name: true, isActive: true } }
      },
      orderBy: { stock: "asc" },
      take: 20
    });
    
    // Filter out inactive products conceptually
    const validLowStock = lowStockVariants.filter(v => v.product?.isActive);

    // 7. Recent Orders for quick glance
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderCode: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        customerName: true
      }
    });

    // 8. Sales Trend (Last 30 Days)
    const recentPaidOrders = await prisma.order.findMany({
      where: {
        status: { in: paidStatuses },
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        createdAt: true,
        totalAmount: true
      },
      orderBy: { createdAt: "asc" }
    });

    // Group by Day
    const salesByDayMap = new Map();
    // Initialize last 30 days with 0
    for(let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD
        salesByDayMap.set(dateString, 0);
    }

    recentPaidOrders.forEach(order => {
        const dateString = order.createdAt.toISOString().split("T")[0];
        if (salesByDayMap.has(dateString)) {
            salesByDayMap.set(dateString, salesByDayMap.get(dateString) + Number(order.totalAmount));
        }
    });

    const salesTrend = Array.from(salesByDayMap, ([date, revenue]) => ({ date, revenue }));

    return NextResponse.json({
      metrics: {
        totalRevenue,
        averageOrderValue,
        totalCustomers,
        paidOrdersCount,
      },
      actionable: {
        toVerify: ordersToVerify,
        abandoned: abandonedOrders,
        lowStock: validLowStock,
      },
      recentOrders,
      salesTrend
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Error al cargar las metricas." },
      { status: 500 }
    );
  }
}
