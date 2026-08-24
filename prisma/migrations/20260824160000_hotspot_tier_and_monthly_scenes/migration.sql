-- CreateEnum
CREATE TYPE "HotspotTier" AS ENUM ('ANCHOR', 'COMPLEMENTARY');

-- AlterTable
ALTER TABLE "hotspots" ADD COLUMN     "tier" "HotspotTier" NOT NULL DEFAULT 'COMPLEMENTARY';

-- AlterTable
ALTER TABLE "inspiration_images" ADD COLUMN     "gregorianMonth" INTEGER;

-- CreateIndex
CREATE INDEX "hotspots_tier_active_idx" ON "hotspots"("tier", "active");

-- CreateIndex
CREATE INDEX "inspiration_images_gregorianMonth_active_sortOrder_idx" ON "inspiration_images"("gregorianMonth", "active", "sortOrder");
