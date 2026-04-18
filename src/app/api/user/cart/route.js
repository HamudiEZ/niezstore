import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  try {
    const cartItems = await prisma.userCartItem.findMany({
      where: { userId },
      include: {
        product: true,
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

    const parsedCart = cartItems.map((item) => {
      const p = item.product;
      const v = item.variant;

      // Reconstruct summary like "Color: ROJO | Capacidad: 128GB"
      const summary = v.variantOptions
        .sort((a, b) => a.optionValue.option.position - b.optionValue.option.position)
        .map(vo => `${vo.optionValue.option.name}: ${vo.optionValue.value}`)
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
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
          imageUrl: v.imageUrl || p.imageUrl || "",
          stock: v.stock,
          summary: summary || "Variante unica",
        },
        quantity: item.quantity,
      };
    });

    return NextResponse.json({ cart: parsedCart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = user.id;

  try {
    const body = await request.json();
    const { action, items, item } = body;

    // Highest Quantity Override Merge
    if (action === "merge" && Array.isArray(items)) {
      if (items.length > 0) {
        const variantIds = items.map(item => item.variant.id);

        const existingItems = await prisma.userCartItem.findMany({
          where: { userId, variantId: { in: variantIds } }
        });
        const existingMap = new Map(existingItems.map(item => [item.variantId, item]));

        const operations = [];

        for (const localItem of items) {
          const variantId = localItem.variant.id;
          const productId = localItem.product.id;
          const quantity = localItem.quantity;
          const existing = existingMap.get(variantId);

          if (existing) {
            if (quantity > existing.quantity) {
              operations.push(
                prisma.userCartItem.update({
                  where: { id: existing.id },
                  data: { quantity }
                })
              );
            }
          } else {
            operations.push(
              prisma.userCartItem.create({
                data: {
                  userId,
                  productId,
                  variantId,
                  quantity
                }
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
      const { productId, variantId, quantity } = item;
      await prisma.userCartItem.upsert({
        where: { userId_variantId: { userId, variantId } },
        update: { quantity },
        create: { userId, productId, variantId, quantity },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      const { variantId } = item;
      await prisma.userCartItem.delete({
        where: { userId_variantId: { userId, variantId } },
      }).catch(() => {});
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
