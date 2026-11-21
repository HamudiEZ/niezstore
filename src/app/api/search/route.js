import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSearchTerm } from "@/lib/input-limits";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request) {
  const rl = rateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    keyPrefix: "public-search",
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.error },
      {
        status: 429,
        headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const q = normalizeSearchTerm(searchParams.get("q"));

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        variants: { some: { isActive: true } },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 1,
          select: { price: true, compareAtPrice: true, imageUrl: true },
        },
      },
      take: 5,
    });

    const formattedResults = products.map((product) => {
      const variant = product.variants?.[0];
      const imageUrl = product.images?.[0]?.url || variant?.imageUrl || null;
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        price: variant?.price ? Number(variant.price) : 0,
        imageUrl,
      };
    });

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
