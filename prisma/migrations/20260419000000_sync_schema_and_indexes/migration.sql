-- Idempotent migration synchronizing schema.prisma changes and adding performance indexes.
-- Safe to run on both clean databases and databases previously synced via `prisma db push`.

-- 1. Enum value added to PaymentProvider
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'TRANSFER';

-- 2. Missing column on Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT;

-- 3. Missing tables: UserFavorite, UserCartItem, OrderAuditLog
CREATE TABLE IF NOT EXISTS "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserCartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCartItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrderAuditLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAuditLog_pkey" PRIMARY KEY ("id")
);

-- 4. Unique indexes and secondary indexes
CREATE UNIQUE INDEX IF NOT EXISTS "UserFavorite_userId_productId_key" ON "UserFavorite"("userId", "productId");
CREATE INDEX IF NOT EXISTS "UserFavorite_userId_idx" ON "UserFavorite"("userId");
CREATE INDEX IF NOT EXISTS "UserFavorite_productId_idx" ON "UserFavorite"("productId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserCartItem_userId_variantId_key" ON "UserCartItem"("userId", "variantId");
CREATE INDEX IF NOT EXISTS "UserCartItem_userId_idx" ON "UserCartItem"("userId");
CREATE INDEX IF NOT EXISTS "UserCartItem_variantId_idx" ON "UserCartItem"("variantId");
CREATE INDEX IF NOT EXISTS "UserCartItem_productId_idx" ON "UserCartItem"("productId");

DROP INDEX IF EXISTS "OrderAuditLog_orderId_idx";
CREATE INDEX IF NOT EXISTS "OrderAuditLog_orderId_createdAt_idx" ON "OrderAuditLog"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "OrderAuditLog_adminId_idx" ON "OrderAuditLog"("adminId");

CREATE INDEX IF NOT EXISTS "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isActive_createdAt_idx" ON "Product"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt");

CREATE INDEX IF NOT EXISTS "ProductVariant_isActive_price_idx" ON "ProductVariant"("isActive", "price");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Payment_externalId_idx" ON "Payment"("externalId");

-- 5. Foreign keys (guarded by pg_constraint check for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserFavorite_userId_fkey') THEN
    ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserFavorite_productId_fkey') THEN
    ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserCartItem_userId_fkey') THEN
    ALTER TABLE "UserCartItem" ADD CONSTRAINT "UserCartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserCartItem_productId_fkey') THEN
    ALTER TABLE "UserCartItem" ADD CONSTRAINT "UserCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserCartItem_variantId_fkey') THEN
    ALTER TABLE "UserCartItem" ADD CONSTRAINT "UserCartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderAuditLog_orderId_fkey') THEN
    ALTER TABLE "OrderAuditLog" ADD CONSTRAINT "OrderAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderAuditLog_adminId_fkey') THEN
    ALTER TABLE "OrderAuditLog" ADD CONSTRAINT "OrderAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
