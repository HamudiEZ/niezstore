import { prisma } from "@/lib/prisma";

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

export async function getPublicCategories() {
  return prisma.category.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getFeaturedProducts(take = 8) {
  const products = await prisma.product.findMany({
    where: { isActive: true, variants: { some: { isActive: true } } },
    orderBy: { createdAt: "desc" },
    take,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function getOfferProducts(take = 100) {
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
    include: productCardInclude,
  });
  
  // Filter in memory since Prisma doesn't support field-to-field comparison easily
  return products
    .map(toProductCard)
    .filter(p => p && p.discountPercentage !== null && p.discountPercentage > 0)
    .slice(0, take);
}

export async function getCategoryBySlug(slug) {
  if (!slug) return null;
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCategoryBrands(slug) {
  if (!slug) return [];
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

export async function getProductsByCategorySlug(slug, options = {}) {
  if (!slug) return { category: null, products: [], totalItems: 0, totalPages: 0 };

  const {
    page = 1,
    pageSize = 20,
    minPrice,
    maxPrice,
    brand,
    sort,
    onSale,
  } = options;

  const skip = (Math.max(1, page) - 1) * pageSize;

  // First get the category
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { category: null, products: [], totalItems: 0, totalPages: 0 };

  const where = {
    categoryId: category.id,
    isActive: true,
    variants: { some: { isActive: true } },
  };

  // Add brand filter if provided
  if (brand) {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  // Add price and sale filters
  if (minPrice || maxPrice || onSale) {
    where.variants = {
      some: {
        isActive: true,
        AND: [
          minPrice ? { price: { gte: Number(minPrice) } } : {},
          maxPrice ? { price: { lte: Number(maxPrice) } } : {},
          onSale ? { compareAtPrice: { not: null } } : {},
        ],
      },
    };
  }

  let orderBy = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  if (sort === "name_asc") orderBy = { name: "asc" };
  if (sort === "name_desc") orderBy = { name: "desc" };

  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const finalProducts = products
    .map(toProductCard)
    .filter(p => {
      if (!p) return false;
      if (onSale) return p.discountPercentage !== null && p.discountPercentage > 0;
      return true;
    });

  return {
    category,
    products: finalProducts,
    totalItems: onSale ? finalProducts.length : totalItems,
    totalPages: Math.ceil((onSale ? finalProducts.length : totalItems) / pageSize),
    currentPage: page,
  };
}

export async function getProductById(productIdOrSlug) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id: productIdOrSlug },
        { slug: productIdOrSlug }
      ]
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
        include: { values: true },
        orderBy: { position: "asc" },
      },
    },
  });
  return product;
}

export async function getNewestProducts(take = 12) {
  const products = await prisma.product.findMany({
    where: { isActive: true, variants: { some: { isActive: true } } },
    orderBy: { createdAt: "desc" },
    take,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function getRelatedProducts(categoryId, excludeId, take = 4) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      categoryId,
      id: { not: excludeId },
      variants: { some: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function searchProducts(query, options = {}) {
  if (!query) return { products: [], totalItems: 0, totalPages: 0, currentPage: 1 };

  const {
    page = 1,
    pageSize = 20,
    minPrice,
    maxPrice,
    brand,
    sort,
    onSale,
  } = options;

  const skip = (Math.max(1, page) - 1) * pageSize;

  const where = {
    isActive: true,
    variants: { some: { isActive: true } },
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { brand: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ],
  };

  // Add brand filter if provided
  if (brand) {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  // Add price filters (filtering based on the cheapest variant)
  if (minPrice || maxPrice || onSale) {
    where.variants = {
      some: {
        isActive: true,
        AND: [
          minPrice ? { price: { gte: Number(minPrice) } } : {},
          maxPrice ? { price: { lte: Number(maxPrice) } } : {},
          onSale ? { compareAtPrice: { not: null } } : {},
        ],
      },
    };
  }

  let orderBy = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  if (sort === "name_asc") orderBy = { name: "asc" };
  if (sort === "name_desc") orderBy = { name: "desc" };

  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const finalProducts = products
    .map(toProductCard)
    .filter(p => {
      if (!p) return false;
      if (onSale) return p.discountPercentage !== null && p.discountPercentage > 0;
      return true;
    });

  return {
    products: finalProducts,
    totalItems: onSale ? finalProducts.length : totalItems,
    totalPages: Math.ceil((onSale ? finalProducts.length : totalItems) / pageSize),
    currentPage: page,
  };
}

export async function getSearchBrands(query) {
  if (!query) return [];
  const results = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { brand: true },
    distinct: ["brand"],
  });
  return results.map((r) => r.brand).filter(Boolean).sort();
}
