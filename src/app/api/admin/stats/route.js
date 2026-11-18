import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [totalCategories, totalProducts, totalVariants, lowStockCount] =
      await Promise.all([
        prisma.category.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.productVariant.count({
          where: { isActive: true, product: { isActive: true } },
        }),
        prisma.productVariant.count({
          where: {
            stock: { lte: 5 },
            isActive: true,
            product: { isActive: true },
          },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalCategories,
        totalProducts,
        totalVariants,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar estadisticas" },
      { status: 500 }
    );
  }
}
