-- AlterTable
ALTER TABLE "YieldQuote" ADD COLUMN     "couponRatePct" DOUBLE PRECISION,
ADD COLUMN     "isin" TEXT,
ADD COLUMN     "maturityDate" TIMESTAMP(3),
ADD COLUMN     "minInvestment" DOUBLE PRECISION;

