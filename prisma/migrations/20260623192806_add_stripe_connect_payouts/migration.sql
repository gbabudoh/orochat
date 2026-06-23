-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'NOT_CONNECTED');

-- AlterTable
ALTER TABLE "RevenueDistribution" ADD COLUMN     "payoutAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "payoutFailureReason" TEXT,
ADD COLUMN     "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripeTransferId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "RevenueDistribution_stripeTransferId_key" ON "RevenueDistribution"("stripeTransferId");

-- CreateIndex
CREATE INDEX "RevenueDistribution_payoutStatus_idx" ON "RevenueDistribution"("payoutStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeConnectAccountId_key" ON "User"("stripeConnectAccountId");

