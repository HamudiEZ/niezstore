import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

const MAX_CART_ITEMS = 100;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const cartItems = await prisma.userCartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
          },
        },
        variant: {
          include: {
            variantOptions: {
              include: {
                optionValue: {
                  include: {
                    option: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const parsedCart = cartItems
      .filter((item) => item.product?.isActive && item.variant?.isActive && item.variant.stock > 0)
      .map((item) => {
        const p = item.product;
        const v = item.variant;

        const summary = [...(v.variantOptions || [])]
          .sort((a, b) => (a.optionValue?.option?.position ?? 0) - (b.optionValue?.option?.position ?? 0))
          .map((vo) =>
            vo.optionValue?.option?.name && vo.optionValue?.value
              ? `${vo.optionValue.option.name}: ${vo.optionValue.value}`
              : null
          )
          .filter(Boolean)
          .join(" | ");

        return {
          product: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            brand: p.brand,
          },
          variant: {
            id: v.id,
            sku: v.sku,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
            imageUrl: v.imageUrl || p.images?.[0]?.url || "",
            stock: v.stock,
            summary: summary || "Variante unica",
          },
          quantity: Math.max(1, Math.min(item.quantity, v.stock)),
        };
      });

    return NextResponse.json({ cart: parsedCart });
  } catch (error) {
    console.error("Error fetching cart:", error);
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

    const { action, items, item } = parsed.data;

    if (action === "merge" && Array.isArray(items)) {
      const mergedByVariant = new Map();
      for (const localItem of items.slice(0, MAX_CART_ITEMS)) {
        const variantId =
          typeof localItem?.variant?.id === "string"
            ? localItem.variant.id.trim()
            : "";
        const qty = Number(localItem?.quantity);
        if (
          !variantId ||
          !Number.isInteger(qty) ||
          qty < 1 ||
          qty > INPUT_LIMITS.stockMax
        ) {
          continue;
        }
        const prevQty = mergedByVariant.get(variantId) || 0;
        mergedByVariant.set(variantId, Math.max(prevQty, qty));
      }

      if (mergedByVariant.size > 0) {
        const rawVariantIds = Array.from(mergedByVariant.keys());
        const validVariants = await prisma.productVariant.findMany({
          where: {
            id: { in: rawVariantIds },
            isActive: true,
            stock: { gt: 0 },
            product: { isActive: true },
          },
          select: { id: true, productId: true, stock: true },
        });
        const validVariantMap = new Map(validVariants.map((v) => [v.id, v]));
        const validVariantIds = Array.from(validVariantMap.keys());

        const existingItems = await prisma.userCartItem.findMany({
          where: { userId, variantId: { in: validVariantIds } },
        });
        const existingMap = new Map(existingItems.map((i) => [i.variantId, i]));

        const operations = [];

        for (const [variantId, requestedQty] of mergedByVariant.entries()) {
          const validVariant = validVariantMap.get(variantId);
          if (!validVariant) continue;

          const clampedQty = Math.min(requestedQty, validVariant.stock);
          if (clampedQty < 1) continue;

          const existing = existingMap.get(variantId);
          if (existing) {
            if (clampedQty > existing.quantity) {
              operations.push(
                prisma.userCartItem.update({
                  where: { id: existing.id },
                  data: { quantity: clampedQty },
                })
              );
            }
          } else {
            operations.push(
              prisma.userCartItem.create({
                data: {
                  userId,
                  productId: validVariant.productId,
                  variantId,
                  quantity: clampedQty,
                },
              })
            );
          }
        }

        if (operations.length > 0) {
          await prisma.$transaction(operations);
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "set") {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return NextResponse.json({ error: "Item invalido." }, { status: 400 });
      }
      const variantId =
        typeof item.variantId === "string" ? item.variantId.trim() : "";
      const quantity = Number(item.quantity);

      if (
        !variantId ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > INPUT_LIMITS.stockMax
      ) {
        return NextResponse.json({ error: "Cantidad o variante invalida." }, { status: 400 });
      }

      const dbVariant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          isActive: true,
          product: { isActive: true },
        },
        select: { id: true, productId: true, stock: true },
      });

      if (!dbVariant || dbVariant.stock <= 0) {
        return NextResponse.json(
          { error: "Producto no disponible o sin stock." },
          { status: 400 }
        );
      }

      const safeQty = Math.min(quantity, dbVariant.stock);
      await prisma.userCartItem.upsert({
        where: { userId_variantId: { userId, variantId } },
        update: { quantity: safeQty },
        create: {
          userId,
          productId: dbVariant.productId,
          variantId,
          quantity: safeQty,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      const variantId =
        typeof item?.variantId === "string" ? item.variantId.trim() : "";
      if (!variantId) {
        return NextResponse.json({ error: "Variante invalida." }, { status: 400 });
      }
      await prisma.userCartItem.deleteMany({
        where: { userId, variantId },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "clear") {
      await prisma.userCartItem.deleteMany({
        where: { userId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error modifying cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
