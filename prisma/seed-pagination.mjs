import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient({ adapter });

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: "electronica" },
  });

  if (!category) {
    console.log("Categoria 'electronica' no encontrada. Ejecuta 'npm run seed' primero.");
    return;
  }

  console.log("Creando 45 productos de prueba para paginacion...");

  for (let i = 1; i <= 45; i++) {
    const productName = `Smart TV Niez Pro Serie ${i}`;
    const productSlug = `smart-tv-niez-pro-serie-${i}`;
    const price = 499.99 + (i * 10);
    const prevPrice = price + 100;

    const existing = await prisma.product.findUnique({
      where: { slug: productSlug },
      include: { variants: true },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: productName,
          slug: productSlug,
          description: `El nuevo Smart TV Niez Pro de la serie ${i} con resolucion 4K y colores vibrantes.`,
          brand: "Niez",
          categoryId: category.id,
          isActive: true,
          variants: {
            create: {
              optionSignature: "",
              price: price,
              compareAtPrice: prevPrice,
              stock: 50,
              isActive: true,
            },
          },
        },
      });
    }
  }

  console.log("45 productos creados exitosamente!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
