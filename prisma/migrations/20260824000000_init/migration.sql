-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EditionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('WAITING', 'HANDLED');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "slug" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 14,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "autoHideWhenFull" BOOLEAN NOT NULL DEFAULT true,
    "distribution" INTEGER,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editions" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "hebrewLabel" TEXT NOT NULL,
    "gregorianMonth" INTEGER NOT NULL,
    "gregorianYear" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" "EditionStatus" NOT NULL DEFAULT 'OPEN',
    "marketingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspiration_images" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "aspectRatio" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspiration_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotspots" (
    "id" TEXT NOT NULL,
    "inspirationImageId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "priceAgorot" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotspots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_slots" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "col" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "colSpan" INTEGER NOT NULL DEFAULT 1,
    "rowSpan" INTEGER NOT NULL DEFAULT 1,
    "hotspotId" TEXT,
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "priceAgorot" INTEGER NOT NULL,
    "badge" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "slotId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "priceAgorot" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "packageTier" TEXT,
    "packageEditions" INTEGER NOT NULL DEFAULT 1,
    "selections" JSONB NOT NULL,
    "contactName" TEXT NOT NULL,
    "businessName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "monthlyBenefit" TEXT,
    "tosAcceptedAt" TIMESTAMP(3),
    "tosVersion" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileMime" TEXT,
    "fileUploadedAt" TIMESTAMP(3),
    "paymentProvider" TEXT,
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "productionStatus" "ProductionStatus" NOT NULL DEFAULT 'WAITING',
    "artworkDownloadedAt" TIMESTAMP(3),
    "artworkDownloadedBy" TEXT,
    "productionNote" TEXT,
    "accessToken" TEXT NOT NULL,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_reservations" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_content" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "landingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tosVersion" TEXT NOT NULL DEFAULT '1.0',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderRef" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailing_list_subscribers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mailing_list_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_submissions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "submitterName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "amountAgorot" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_draws" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winningSubmissionId" TEXT,
    "totalParticipants" INTEGER NOT NULL,
    "totalAmountAgorot" INTEGER NOT NULL,

    CONSTRAINT "raffle_draws_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_visible_sortOrder_idx" ON "cities"("visible", "sortOrder");

-- CreateIndex
CREATE INDEX "editions_cityId_status_gregorianYear_gregorianMonth_idx" ON "editions"("cityId", "status", "gregorianYear", "gregorianMonth");

-- CreateIndex
CREATE UNIQUE INDEX "editions_cityId_gregorianYear_gregorianMonth_key" ON "editions"("cityId", "gregorianYear", "gregorianMonth");

-- CreateIndex
CREATE INDEX "inspiration_images_active_sortOrder_idx" ON "inspiration_images"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "hotspots_inspirationImageId_sortOrder_idx" ON "hotspots"("inspirationImageId", "sortOrder");

-- CreateIndex
CREATE INDEX "hotspots_active_sortOrder_idx" ON "hotspots"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ad_slots_sku_key" ON "ad_slots"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ad_slots_hotspotId_key" ON "ad_slots"("hotspotId");

-- CreateIndex
CREATE INDEX "ad_slots_active_sortOrder_idx" ON "ad_slots"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_key" ON "orders"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "orders_accessToken_key" ON "orders"("accessToken");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_cityId_slotId_idx" ON "orders"("cityId", "slotId");

-- CreateIndex
CREATE INDEX "orders_cityId_productionStatus_idx" ON "orders"("cityId", "productionStatus");

-- CreateIndex
CREATE INDEX "slot_reservations_cityId_idx" ON "slot_reservations"("cityId");

-- CreateIndex
CREATE INDEX "slot_reservations_orderId_idx" ON "slot_reservations"("orderId");

-- CreateIndex
CREATE INDEX "slot_reservations_expiresAt_idx" ON "slot_reservations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "slot_reservations_editionId_slotId_key" ON "slot_reservations"("editionId", "slotId");

-- CreateIndex
CREATE INDEX "webhook_events_orderRef_idx" ON "webhook_events"("orderRef");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "mailing_list_subscribers_email_key" ON "mailing_list_subscribers"("email");

-- CreateIndex
CREATE INDEX "receipt_submissions_orderId_status_idx" ON "receipt_submissions"("orderId", "status");

-- CreateIndex
CREATE INDEX "receipt_submissions_status_submittedAt_idx" ON "receipt_submissions"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "raffle_draws_orderId_drawnAt_idx" ON "raffle_draws"("orderId", "drawnAt");

-- AddForeignKey
ALTER TABLE "editions" ADD CONSTRAINT "editions_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotspots" ADD CONSTRAINT "hotspots_inspirationImageId_fkey" FOREIGN KEY ("inspirationImageId") REFERENCES "inspiration_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_slots" ADD CONSTRAINT "ad_slots_hotspotId_fkey" FOREIGN KEY ("hotspotId") REFERENCES "hotspots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ad_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_reservations" ADD CONSTRAINT "slot_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_reservations" ADD CONSTRAINT "slot_reservations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_reservations" ADD CONSTRAINT "slot_reservations_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ad_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_reservations" ADD CONSTRAINT "slot_reservations_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_submissions" ADD CONSTRAINT "receipt_submissions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_draws" ADD CONSTRAINT "raffle_draws_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_draws" ADD CONSTRAINT "raffle_draws_winningSubmissionId_fkey" FOREIGN KEY ("winningSubmissionId") REFERENCES "receipt_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
