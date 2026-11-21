import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api-security";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BATCH_IDS = 100;

export async function POST(request) {
  const rl = rateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    keyPrefix: "products-batch",
  });
  if (!rl.ok) {
    return NextResponse.json({ error: rl.error }, { status: 429 });
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;

  try {
    const body = parsed.data;
    const rawVariantIds = Array.isArray(body.variantIds)
      ? Array.from(
          new Set(
            body.variantIds
              .filter((id) => typeof id === "string" && id.trim().length > 0)
              .map((id) => id.trim())
          )
        ).slice(0, MAX_BATCH_IDS)
      : [];

    const rawProductIds = Array.isArray(body.productIds)
      ? Array.from(
          new Set(
            body.productIds
              .filter((id) => typeof id === "string" && id.trim().length > 0)
              .map((id) => id.trim())
          )
        ).slice(0, MAX_BATCH_IDS)
      : [];

    const [variants, products] = await Promise.all([
      rawVariantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: rawVariantIds } },
            select: {
              id: true,
              price: true,
              compareAtPrice: true,
              stock: true,
              imageUrl: true,
              isActive: true,
              product: {
                select: {
                  isActive: true,
                  images: {
                    orderBy: { position: "asc" },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          })
        : null,
      rawProductIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: rawProductIds } },
            select: {
              id: true,
              isActive: true,
              variants: {
                where: { isActive: true },
                orderBy: { price: "asc" },
                take: 1,
                select: { price: true, compareAtPrice: true },
              },
            },
          })
        : null,
    ]);

    const responseData = {};
    if (variants) {
      responseData.variants = variants.map((v) => ({
        ...v,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
      }));
    }
    if (products) {
      responseData.products = products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
        })),
      }));
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Batch fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
