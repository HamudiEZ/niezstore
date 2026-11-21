import { prisma } from "@/lib/prisma";
import { normalizeSearchTerm } from "@/lib/input-limits";

const toNumber = (value) => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toProductCard = (product) => {
  const variant = product.variants?.[0];
  if (!variant) return null;
  const price = toNumber(variant.price);
  const previousPrice = toNumber(variant.compareAtPrice);
  const imageUrl =
    product.images?.[0]?.url || variant.imageUrl || null;
  const discountPercentage =
    previousPrice && price && previousPrice > price
      ? Math.round(((previousPrice - price) / previousPrice) * 100)
      : null;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: price ?? 0,
    previousPrice,
    imageUrl,
    discountPercentage,
    rating: null,
    reviews: null,
    category: product.category,
  };
};

const productCardInclude = {
  category: true,
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" },
    take: 1,
  },
};

function normalizePagination(page = 1, pageSize = 20) {
  const safePage = Math.max(1, Number.parseInt(String(page ?? 1), 10) || 1);
  const safePageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(String(pageSize ?? 20), 10) || 20)
  );
  return {
    safePage,
    safePageSize,
    skip: (safePage - 1) * safePageSize,
  };
}

function parseOptionalPrice(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function getPublicCategories() {
  return prisma.category.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getFeaturedProducts(take = 8) {
  const safeTake = Math.min(50, Math.max(1, Number.parseInt(String(take ?? 8), 10) || 8));
  const products = await prisma.product.findMany({
    where: { isActive: true, variants: { some: { isActive: true } } },
    orderBy: { createdAt: "desc" },
    take: safeTake,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function getOfferProducts(take = 20) {
  const safeTake = Math.min(200, Math.max(1, Number.parseInt(String(take ?? 20), 10) || 20));
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      variants: {
        some: {
          isActive: true,
          compareAtPrice: { not: null },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(safeTake * 3, 100),
    include: productCardInclude,
  });

  // Filter in memory since Prisma doesn't support field-to-field comparison directly
  return products
    .map(toProductCard)
    .filter((p) => p && p.discountPercentage !== null && p.discountPercentage > 0)
    .slice(0, safeTake);
}

export async function getCategoryBySlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCategoryBrands(slug) {
  if (!slug || typeof slug !== "string") return [];
  const results = await prisma.product.findMany({
    where: {
      category: { slug },
      isActive: true,
      brand: { not: null },
    },
    select: { brand: true },
    distinct: ["brand"],
  });
  return results.map((r) => r.brand).filter(Boolean).sort();
}

function applyProductFilters(where, { brand, minPrice, maxPrice, onSale }) {
  const cleanBrand = typeof brand === "string" ? brand.trim() : "";
  if (cleanBrand) {
    where.brand = { equals: cleanBrand, mode: "insensitive" };
  }

  const validMinPrice = parseOptionalPrice(minPrice);
  const validMaxPrice = parseOptionalPrice(maxPrice);

  if (validMinPrice !== null || validMaxPrice !== null || onSale) {
    where.variants = {
      some: {
        isActive: true,
        AND: [
          validMinPrice !== null ? { price: { gte: validMinPrice } } : {},
          validMaxPrice !== null ? { price: { lte: validMaxPrice } } : {},
          onSale ? { compareAtPrice: { not: null } } : {},
        ],
      },
    };
  }

  return where;
}

function buildProductOrderBy(sort) {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "name_asc") return { name: "asc" };
  if (sort === "name_desc") return { name: "desc" };
  return { createdAt: "desc" };
}

function postFilterOnSale(products, onSale) {
  return products
    .map(toProductCard)
    .filter((p) => {
      if (!p) return false;
      if (onSale) return p.discountPercentage !== null && p.discountPercentage > 0;
      return true;
    });
}

export async function getProductsByCategorySlug(slug, options = {}) {
  if (!slug || typeof slug !== "string") {
    return { category: null, products: [], totalItems: 0, totalPages: 0, currentPage: 1 };
  }

  const { page = 1, pageSize = 20, minPrice, maxPrice, brand, sort, onSale } = options;
  const { safePage, safePageSize, skip } = normalizePagination(page, pageSize);

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) {
    return { category: null, products: [], totalItems: 0, totalPages: 0, currentPage: safePage };
  }

  const where = applyProductFilters(
    { categoryId: category.id, isActive: true, variants: { some: { isActive: true } } },
    { brand, minPrice, maxPrice, onSale }
  );

  const orderBy = buildProductOrderBy(sort);

  if (onSale) {
    const candidates = await prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      take: 500,
    });
    const filtered = postFilterOnSale(candidates, true);
    const totalItems = filtered.length;
    return {
      category,
      products: filtered.slice(skip, skip + safePageSize),
      totalItems,
      totalPages: Math.ceil(totalItems / safePageSize),
      currentPage: safePage,
    };
  }

  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip,
      take: safePageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    category,
    products: postFilterOnSale(products, false),
    totalItems,
    totalPages: Math.ceil(totalItems / safePageSize),
    currentPage: safePage,
  };
}

export async function getProductById(productIdOrSlug) {
  if (!productIdOrSlug || typeof productIdOrSlug !== "string") return null;

  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [
        { id: productIdOrSlug },
        { slug: productIdOrSlug },
      ],
    },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        include: {
          variantOptions: {
            include: {
              optionValue: {
                select: {
                  id: true,
                  value: true,
                  optionId: true,
                },
              },
            },
          },
        },
      },
      options: {
        include: {
          values: { orderBy: { position: "asc" } },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  return product;
}

export async function getNewestProducts(take = 12) {
  const safeTake = Math.min(50, Math.max(1, Number.parseInt(String(take ?? 12), 10) || 12));
  const products = await prisma.product.findMany({
    where: { isActive: true, variants: { some: { isActive: true } } },
    orderBy: { createdAt: "desc" },
    take: safeTake,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function getRelatedProducts(categoryId, excludeId, take = 4) {
  if (!categoryId) return [];
  const safeTake = Math.min(20, Math.max(1, Number.parseInt(String(take ?? 4), 10) || 4));
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId,
      id: { not: excludeId },
      variants: { some: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
    take: safeTake,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function searchProducts(query, options = {}) {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) return { products: [], totalItems: 0, totalPages: 0, currentPage: 1 };

  const { page = 1, pageSize = 20, minPrice, maxPrice, brand, sort, onSale } = options;
  const { safePage, safePageSize, skip } = normalizePagination(page, pageSize);

  const where = applyProductFilters(
    {
      isActive: true,
      variants: { some: { isActive: true } },
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { brand: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
      ],
    },
    { brand, minPrice, maxPrice, onSale }
  );

  const orderBy = buildProductOrderBy(sort);

  if (onSale) {
    const candidates = await prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      take: 500,
    });
    const filtered = postFilterOnSale(candidates, true);
    const totalItems = filtered.length;
    return {
      products: filtered.slice(skip, skip + safePageSize),
      totalItems,
      totalPages: Math.ceil(totalItems / safePageSize),
      currentPage: safePage,
    };
  }

  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip,
      take: safePageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: postFilterOnSale(products, false),
    totalItems,
    totalPages: Math.ceil(totalItems / safePageSize),
    currentPage: safePage,
  };
}

export async function getSearchBrands(query) {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) return [];
  const results = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { brand: { contains: cleanQuery, mode: "insensitive" } },
      ],
    },
    select: { brand: true },
    distinct: ["brand"],
  });
  return results.map((r) => r.brand).filter(Boolean).sort();
}
