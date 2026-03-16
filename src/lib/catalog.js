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

export async function getOfferProducts(take = 8) {
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
    take,
    include: productCardInclude,
  });
  return products.map(toProductCard).filter(Boolean);
}

export async function getCategoryBySlug(slug) {
  if (!slug) return null;
  return prisma.category.findUnique({ where: { slug } });
}

export async function getProductsByCategorySlug(slug) {
  if (!slug) return { category: null, products: [] };
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true, variants: { some: { isActive: true } } },
        orderBy: { createdAt: "desc" },
        include: productCardInclude,
      },
    },
  });

  if (!category) return { category: null, products: [] };

  return {
    category,
    products: category.products.map(toProductCard).filter(Boolean),
  };
}

export async function getProductById(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
      options: {
        include: { values: true },
        orderBy: { position: "asc" },
      },
    },
  });
  return product;
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
