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

  // Keep initial seed minimal. Categories/products will be loaded manually from admin.
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
