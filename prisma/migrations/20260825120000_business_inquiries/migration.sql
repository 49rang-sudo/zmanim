-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('FORM', 'POPUP');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'MATCHED', 'CLOSED');

-- CreateTable
CREATE TABLE "business_inquiries" (
    "id" TEXT NOT NULL,
    "businessName" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "monthGuess" TEXT,
    "note" TEXT,
    "source" "InquirySource" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_inquiries_status_createdAt_idx" ON "business_inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "business_inquiries_createdAt_idx" ON "business_inquiries"("createdAt");
