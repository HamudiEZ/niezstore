import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPasswordHash = process.env.SEED_ADMIN_PASSWORD_HASH;
  const adminFullName = process.env.SEED_ADMIN_FULL_NAME ?? "Admin Niez Store";

  // Keep initial seed minimal. Categories/products will be loaded manually from admin.
  if (adminEmail && adminPasswordHash) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        fullName: adminFullName,
        role: "ADMIN",
      },
      create: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        fullName: adminFullName,
        role: "ADMIN",
      },
    });
    console.log(`Admin seeded: ${adminEmail}`);
  } else {
    console.log("No admin seeded. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD_HASH to create one.");
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
