-- CreateTable
CREATE TABLE "WaitlistUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "provider" TEXT NOT NULL DEFAULT 'email',
    "emailVerifiedAt" TIMESTAMP(3),
    "welcomeSentAt" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerRequest" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldQuote" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "tenorMonths" INTEGER NOT NULL,
    "yieldPct" DOUBLE PRECISION NOT NULL,
    "couponsPerYear" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "asOf" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YieldQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistUser_email_key" ON "WaitlistUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistUser_referralCode_key" ON "WaitlistUser"("referralCode");

-- CreateIndex
CREATE INDEX "WaitlistUser_referredById_idx" ON "WaitlistUser"("referredById");

-- CreateIndex
CREATE INDEX "WaitlistUser_createdAt_idx" ON "WaitlistUser"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerRequest_createdAt_idx" ON "PartnerRequest"("createdAt");

-- CreateIndex
CREATE INDEX "YieldQuote_currency_sortOrder_idx" ON "YieldQuote"("currency", "sortOrder");

-- AddForeignKey
ALTER TABLE "WaitlistUser" ADD CONSTRAINT "WaitlistUser_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "WaitlistUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
