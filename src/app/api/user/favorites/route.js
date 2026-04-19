import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

function getDiscountPercentage(compareAtPrice, price) {
  if (
    typeof compareAtPrice !== "number" ||
    typeof price !== "number" ||
    !Number.isFinite(compareAtPrice) ||
    !Number.isFinite(price) ||
    compareAtPrice <= price
  ) {
    return null;
  }
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            variants: { orderBy: { price: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedFavorites = favorites.map((fav) => {
      const p = fav.product;
      const firstVariant = p.variants?.[0];
      const imageUrl = p.images?.[0]?.url || firstVariant?.imageUrl || "";
      const price = firstVariant ? Number(firstVariant.price) : 0;
      const compareAtPrice = firstVariant?.compareAtPrice ? Number(firstVariant.compareAtPrice) : null;
      
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        imageUrl,
        price,
        previousPrice: compareAtPrice,
        discountPercentage: getDiscountPercentage(compareAtPrice, price),
      };
    });

    return NextResponse.json({ favorites: parsedFavorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  try {
    const body = await request.json();
    const { action, productIds, productId } = body;

    if (action === "merge" && Array.isArray(productIds)) {
      if (productIds.length > 0) {
        // Filtrar IDs contra los que de hecho existen en la DB para evitar Foreign Key error
        const validProducts = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true }
        });
        const validProductIds = validProducts.map(p => p.id);

        if (validProductIds.length > 0) {
          const data = validProductIds.map(id => ({ userId, productId: id }));
          await prisma.userFavorite.createMany({
            data,
            skipDuplicates: true, // Postgres handles this
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "add" && productId) {
      await prisma.userFavorite.upsert({
        where: { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "remove" && productId) {
      await prisma.userFavorite.delete({
        where: { userId_productId: { userId, productId } },
      }).catch(() => {}); // Ignore if it doesn't exist
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error modifying favorites:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
