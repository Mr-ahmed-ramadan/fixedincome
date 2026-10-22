-- AlterTable
ALTER TABLE "YieldQuote" DROP COLUMN "compare",
ADD COLUMN     "bankAsOf" TIMESTAMP(3),
ADD COLUMN     "bankLabelAr" TEXT,
ADD COLUMN     "bankLabelEn" TEXT,
ADD COLUMN     "bankRatePct" DOUBLE PRECISION;

