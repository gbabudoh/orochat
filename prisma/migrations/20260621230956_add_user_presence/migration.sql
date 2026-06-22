-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "presenceStatus" TEXT NOT NULL DEFAULT 'offline';
