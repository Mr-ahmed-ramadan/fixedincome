-- AlterTable
ALTER TABLE "YieldQuote" ADD COLUMN     "compare" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxRatePct" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "AppMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppMeta_pkey" PRIMARY KEY ("key")
);
