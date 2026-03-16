import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminPasswordHash = process.env.SEED_ADMIN_PASSWORD_HASH;
  const adminFullName = process.env.SEED_ADMIN_FULL_NAME ?? "Admin Niez Store";
  const isBcryptHash =
    typeof adminPasswordHash === "string" &&
    (adminPasswordHash.startsWith("$2a$") ||
      adminPasswordHash.startsWith("$2b$") ||
      adminPasswordHash.startsWith("$2y$"));

  let resolvedPasswordHash = null;
  if (adminPassword) {
    resolvedPasswordHash = await bcrypt.hash(adminPassword, 12);
  } else if (isBcryptHash) {
    resolvedPasswordHash = adminPasswordHash;
  } else if (adminPasswordHash) {
    throw new Error(
      "SEED_ADMIN_PASSWORD_HASH no es bcrypt. Usa SEED_ADMIN_PASSWORD o un hash bcrypt valido."
    );
  }

  const seedCategories = [
    {
      slug: "electronica",
      name: "Electronica",
      description: "Smartphones, TV, audio y wearables.",
    },
    {
      slug: "computadoras",
      name: "Computadoras",
      description: "Laptops, PCs y accesorios.",
    },
    {
      slug: "componentes-pc",
      name: "Componentes PC",
      description: "GPU, RAM, SSD y fuentes.",
    },
    {
      slug: "hogar",
      name: "Hogar",
      description: "Electrodomesticos y confort.",
    },
    {
      slug: "moda",
      name: "Moda",
      description: "Ropa, accesorios y fragancias.",
    },
    {
      slug: "deportes",
      name: "Deportes",
      description: "Entrenamiento y outdoor.",
    },
    {
      slug: "supermercado",
      name: "Supermercado",
      description: "Snacks, bebidas y despensa.",
    },
    {
      slug: "motos",
      name: "Motos",
      description: "Cascos, guantes y seguridad.",
    },
  ];

  const seedProducts = [
    {
      slug: "galaxy-s24-ultra",
      name: "Samsung Galaxy S24 Ultra 12GB 1TB",
      description:
        "Smartphone de alta gama con camara avanzada, pantalla AMOLED y gran autonomia.",
      brand: "Samsung",
      categorySlug: "electronica",
      price: 999.99,
      compareAtPrice: 1199.99,
      stock: 12,
    },
    {
      slug: "tv-lg-65-oled",
      name: "LG OLED 65 4K Smart TV",
      description: "Televisor OLED 4K con negro puro y excelente calidad de imagen.",
      brand: "LG",
      categorySlug: "electronica",
      price: 1499.99,
      compareAtPrice: 1799.99,
      stock: 8,
    },
    {
      slug: "laptop-air-13-m3",
      name: "Laptop Air 13 M3 16GB",
      description: "Laptop liviana para trabajo creativo con gran bateria.",
      brand: "Apple",
      categorySlug: "computadoras",
      price: 1249.99,
      compareAtPrice: 1399.99,
      stock: 10,
    },
    {
      slug: "pc-gamer-ryzen-7",
      name: "PC Gamer Ryzen 7 RTX 4070",
      description: "PC gamer para juegos AAA y streaming con alto rendimiento.",
      brand: "Niez",
      categorySlug: "computadoras",
      price: 1599.99,
      compareAtPrice: 1799.99,
      stock: 6,
    },
    {
      slug: "gpu-rtx-4070",
      name: "NVIDIA GeForce RTX 4070 12GB",
      description: "GPU para 1440p y 4K con trazado de rayos.",
      brand: "NVIDIA",
      categorySlug: "componentes-pc",
      price: 649.99,
      compareAtPrice: 749.99,
      stock: 15,
    },
    {
      slug: "ventilador-torre",
      name: "Ventilador de torre silencioso",
      description: "Ventilador potente con modo noche y control remoto.",
      brand: "Midea",
      categorySlug: "hogar",
      price: 89.99,
      compareAtPrice: 119.99,
      stock: 20,
    },
    {
      slug: "perfume-nuit-noire-100",
      name: "Perfume Nuit Noire 100ml",
      description: "Fragancia elegante amaderada para uso diario o noche.",
      brand: "Maison Noir",
      categorySlug: "moda",
      price: 59.99,
      compareAtPrice: 79.99,
      stock: 18,
    },
    {
      slug: "nike-invincible-3",
      name: "Nike Invincible 3 Premium",
      description: "Zapatillas con alta amortiguacion para running.",
      brand: "Nike",
      categorySlug: "deportes",
      price: 89.99,
      compareAtPrice: 129.99,
      stock: 22,
    },
    {
      slug: "cafe-premium-1kg",
      name: "Cafe en grano premium 1kg",
      description: "Cafe tostado medio con notas a cacao y frutos secos.",
      brand: "Andes Roast",
      categorySlug: "supermercado",
      price: 24.99,
      compareAtPrice: 29.99,
      stock: 40,
    },
    {
      slug: "casco-moto-niez-pro",
      name: "Casco de moto integral Niez Pro",
      description: "Casco aerodinamico con certificacion internacional.",
      brand: "Niez",
      categorySlug: "motos",
      price: 120.0,
      compareAtPrice: 160.0,
      stock: 14,
    },
  ];

  for (const category of seedCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  for (const seed of seedProducts) {
    const category = await prisma.category.findUnique({
      where: { slug: seed.categorySlug },
    });
    if (!category) continue;

    const existing = await prisma.product.findUnique({
      where: { slug: seed.slug },
      include: { variants: true },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          brand: seed.brand,
          categoryId: category.id,
          isActive: true,
          variants: {
            create: {
              optionSignature: "",
              price: seed.price,
              compareAtPrice: seed.compareAtPrice,
              stock: seed.stock,
              isActive: true,
            },
          },
        },
      });
      continue;
    }

    if (existing.variants.length === 0) {
      await prisma.productVariant.create({
        data: {
          productId: existing.id,
          optionSignature: "",
          price: seed.price,
          compareAtPrice: seed.compareAtPrice,
          stock: seed.stock,
          isActive: true,
        },
      });
    }
  }

  if (adminEmail && resolvedPasswordHash) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        fullName: adminFullName,
        role: "ADMIN",
        passwordHash: resolvedPasswordHash,
      },
      create: {
        email: adminEmail,
        passwordHash: resolvedPasswordHash,
        fullName: adminFullName,
        role: "ADMIN",
      },
    });
    console.log(`Admin seeded: ${adminEmail}`);
  } else {
    console.log(
      "No admin seeded. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (or a bcrypt SEED_ADMIN_PASSWORD_HASH)."
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
