import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { variantIds, productIds } = body;

    const responseData = {};

    if (Array.isArray(variantIds) && variantIds.length > 0) {
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          isActive: true,
          product: { select: { isActive: true } }
        }
      });
      responseData.variants = variants;
    }

    if (Array.isArray(productIds) && productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          isActive: true,
          variants: {
            where: { isActive: true },
            orderBy: { price: "asc" },
            take: 1,
            select: { price: true, compareAtPrice: true }
          }
        }
      });
      responseData.products = products;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Batch fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
