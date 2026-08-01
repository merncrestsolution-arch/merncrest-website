-- CreateTable
CREATE TABLE "HomepageOffer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT,
    "badge" TEXT,
    "category" TEXT,
    "imageUrl" TEXT,
    "bannerImageUrl" TEXT,
    "featuresJson" TEXT,
    "gradientTheme" TEXT NOT NULL DEFAULT 'blue',
    "ctaText" TEXT NOT NULL DEFAULT 'View Details',
    "ctaUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageOffer_slug_key" ON "HomepageOffer"("slug");

-- CreateIndex
CREATE INDEX "HomepageOffer_status_idx" ON "HomepageOffer"("status");

-- CreateIndex
CREATE INDEX "HomepageOffer_isEnabled_idx" ON "HomepageOffer"("isEnabled");

-- CreateIndex
CREATE INDEX "HomepageOffer_priority_idx" ON "HomepageOffer"("priority");

-- CreateIndex
CREATE INDEX "HomepageOffer_sortOrder_idx" ON "HomepageOffer"("sortOrder");

-- CreateIndex
CREATE INDEX "HomepageOffer_startDate_idx" ON "HomepageOffer"("startDate");

-- CreateIndex
CREATE INDEX "HomepageOffer_endDate_idx" ON "HomepageOffer"("endDate");
