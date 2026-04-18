import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const q = String(searchParams.get("q") ?? "").trim();

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
      take: 5, // Exact limit to 5 products as agreed.
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
