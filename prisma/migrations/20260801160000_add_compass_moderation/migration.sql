-- AlterTable
ALTER TABLE "Compass" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false;
