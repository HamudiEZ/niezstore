import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";

const MAX_FAVORITE_IDS = 100;

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

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            variants: {
              where: { isActive: true },
              orderBy: { price: "asc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedFavorites = favorites
      .filter((fav) => fav.product?.isActive)
      .map((fav) => {
        const p = fav.product;
        const firstVariant = p.variants?.[0];
        const imageUrl = p.images?.[0]?.url || firstVariant?.imageUrl || "";
        const price = firstVariant ? Number(firstVariant.price) : 0;
        const compareAtPrice =
          firstVariant?.compareAtPrice != null
            ? Number(firstVariant.compareAtPrice)
            : null;

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
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const { action, productIds, productId } = parsed.data;

    if (action === "merge" && Array.isArray(productIds)) {
      const cleanIds = Array.from(
        new Set(
          productIds
            .filter((id) => typeof id === "string" && id.trim().length > 0)
            .map((id) => id.trim())
        )
      ).slice(0, MAX_FAVORITE_IDS);

      if (cleanIds.length > 0) {
        const validProducts = await prisma.product.findMany({
          where: { id: { in: cleanIds }, isActive: true },
          select: { id: true },
        });
        const validProductIds = validProducts.map((p) => p.id);

        if (validProductIds.length > 0) {
          const data = validProductIds.map((id) => ({ userId, productId: id }));
          await prisma.userFavorite.createMany({
            data,
            skipDuplicates: true,
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "add") {
      const cleanId = typeof productId === "string" ? productId.trim() : "";
      if (!cleanId) {
        return NextResponse.json({ error: "ID de producto invalido." }, { status: 400 });
      }
      const exists = await prisma.product.findFirst({
        where: { id: cleanId, isActive: true },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
      }

      await prisma.userFavorite.upsert({
        where: { userId_productId: { userId, productId: cleanId } },
        update: {},
        create: { userId, productId: cleanId },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      const cleanId = typeof productId === "string" ? productId.trim() : "";
      if (!cleanId) {
        return NextResponse.json({ error: "ID de producto invalido." }, { status: 400 });
      }
      await prisma.userFavorite.deleteMany({
        where: { userId, productId: cleanId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error modifying favorites:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
