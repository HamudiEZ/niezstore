import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { INPUT_LIMITS, normalizeSearchTerm } from "@/lib/input-limits";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeStatusFilter(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "active" || normalized === "inactive") return normalized;
  return "all";
}

async function getUniqueSlug(base, excludeId) {
  let slug = base;
  let counter = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = normalizeSearchTerm(searchParams.get("search"));
  const categoryId = String(searchParams.get("categoryId") ?? "").trim();
  const status = normalizeStatusFilter(searchParams.get("status"));
  const pageSize = Math.min(
    parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  );
  const requestedPage = parsePositiveInteger(
    searchParams.get("page"),
    DEFAULT_PAGE
  );

  const where = {};

  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [filteredTotal, totalAllProducts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const [products, totalVariants, lowStockCount] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: {
          select: {
            id: true,
            stock: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.productVariant.count(),
    prisma.productVariant.count({ where: { stock: { lte: 5 } } }),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      pageSize,
      total: filteredTotal,
      totalPages,
      totalAll: totalAllProducts,
    },
    stats: {
      totalProducts: totalAllProducts,
      totalVariants,
      lowStockCount,
    },
  });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const brand = String(body.brand ?? "").trim() || null;
  const categoryId = String(body.categoryId ?? "").trim();
  const isActive = body.isActive !== false;
  const rawSlug = String(body.slug ?? "").trim();

  if (!name || !description || !categoryId) {
    return NextResponse.json(
      { error: "Nombre, descripcion y categoria son obligatorios." },
      { status: 400 }
    );
  }
  if (name.length > INPUT_LIMITS.productName) {
    return NextResponse.json(
      { error: `Nombre demasiado largo (max ${INPUT_LIMITS.productName}).` },
      { status: 400 }
    );
  }
  if (description.length > INPUT_LIMITS.productDescription) {
    return NextResponse.json(
      { error: `Descripcion demasiado larga (max ${INPUT_LIMITS.productDescription}).` },
      { status: 400 }
    );
  }
  if (brand && brand.length > INPUT_LIMITS.productBrand) {
    return NextResponse.json(
      { error: `Marca demasiado larga (max ${INPUT_LIMITS.productBrand}).` },
      { status: 400 }
    );
  }
  if (rawSlug.length > INPUT_LIMITS.slug) {
    return NextResponse.json(
      { error: `Slug demasiado largo (max ${INPUT_LIMITS.slug}).` },
      { status: 400 }
    );
  }

  const baseSlug = slugify(rawSlug || name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Slug invalido." }, { status: 400 });
  }

  const slug = await getUniqueSlug(baseSlug);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      brand,
      categoryId,
      isActive,
    },
  });

  return NextResponse.json({ product });
}
