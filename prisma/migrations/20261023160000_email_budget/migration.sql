-- AlterTable
ALTER TABLE "WaitlistUser" ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "verifySentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RateCounter" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateCounter_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "WaitlistUser_pendingEmail_idx" ON "WaitlistUser"("pendingEmail");

