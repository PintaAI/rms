-- Create new enums
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE "TokoUserRole" AS ENUM ('owner');

-- Create UserToko junction table
CREATE TABLE "user_toko" (
    "userId" TEXT NOT NULL,
    "tokoId" TEXT NOT NULL,
    "role" "TokoUserRole" NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for UserToko
CREATE INDEX "user_toko_userId_idx" ON "user_toko"("userId");
CREATE INDEX "user_toko_tokoId_idx" ON "user_toko"("tokoId");

-- Add foreign key constraints for UserToko
ALTER TABLE "user_toko" ADD CONSTRAINT "user_toko_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_toko" ADD CONSTRAINT "user_toko_tokoId_fkey" FOREIGN KEY ("tokoId") REFERENCES "toko"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create primary key for UserToko
ALTER TABLE "user_toko" ADD CONSTRAINT "user_toko_pkey" PRIMARY KEY ("userId", "tokoId");

-- Create Subscription table
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create unique constraint for Subscription userId
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_unique" UNIQUE ("userId");

-- Add foreign key for Subscription
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create primary key for Subscription
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_pkey" PRIMARY KEY ("id");

-- Migration: Migrate existing staff/technician user.tokoId data to UserToko
-- Staff/technician keep their single toko assignment
INSERT INTO "user_toko" ("userId", "tokoId", "role")
SELECT "id", "tokoId", 'owner'
FROM "user"
WHERE "tokoId" IS NOT NULL AND "role" IN ('staff', 'technician');

-- Create default subscription for all admins with free plan
INSERT INTO "subscription" ("id", "userId", "plan", "updatedAt")
SELECT gen_random_uuid(), "id", 'free', CURRENT_TIMESTAMP
FROM "user"
WHERE "role" = 'admin';

-- Drop the tokoId foreign key constraint
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_tokoId_fkey";

-- Drop the tokoId index
DROP INDEX IF EXISTS "user_tokoId_idx";

-- Drop the tokoId column
ALTER TABLE "user" DROP COLUMN "tokoId";