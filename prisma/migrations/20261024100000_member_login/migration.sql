-- AlterTable
ALTER TABLE "WaitlistUser" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "loginCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "loginCodeHash" TEXT,
ADD COLUMN     "loginCodeSentAt" TIMESTAMP(3),
ADD COLUMN     "loginCodeTries" INTEGER NOT NULL DEFAULT 0;

