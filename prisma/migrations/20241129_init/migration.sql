-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CompassRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "title" TEXT,
    "company" TEXT,
    "location" TEXT,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "qualifiedAt" TIMESTAMP(3),
    "verifiedOrosCount" INTEGER NOT NULL DEFAULT 0,
    "compassMembershipsCount" INTEGER NOT NULL DEFAULT 0,
    "currentTES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTESUpdate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compass" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "creatorId" TEXT NOT NULL,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsorName" TEXT,
    "sponsorLogo" TEXT,
    "sponsorLink" TEXT,
    "sponsorExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompassMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "compassId" TEXT NOT NULL,
    "role" "CompassRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompassMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "compassId" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TESLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tesValue" DOUBLE PRECISION NOT NULL,
    "changeReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TESLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdRevenuePool" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "distributed" BOOLEAN NOT NULL DEFAULT false,
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdRevenuePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueDistribution" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tesShare" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isPartner_idx" ON "User"("isPartner");

-- CreateIndex
CREATE INDEX "Connection_senderId_idx" ON "Connection"("senderId");

-- CreateIndex
CREATE INDEX "Connection_receiverId_idx" ON "Connection"("receiverId");

-- CreateIndex
CREATE INDEX "Connection_status_idx" ON "Connection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_senderId_receiverId_key" ON "Connection"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Compass_slug_key" ON "Compass"("slug");

-- CreateIndex
CREATE INDEX "Compass_slug_idx" ON "Compass"("slug");

-- CreateIndex
CREATE INDEX "Compass_creatorId_idx" ON "Compass"("creatorId");

-- CreateIndex
CREATE INDEX "CompassMembership_userId_idx" ON "CompassMembership"("userId");

-- CreateIndex
CREATE INDEX "CompassMembership_compassId_idx" ON "CompassMembership"("compassId");

-- CreateIndex
CREATE UNIQUE INDEX "CompassMembership_userId_compassId_key" ON "CompassMembership"("userId", "compassId");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "FeedPost_authorId_idx" ON "FeedPost"("authorId");

-- CreateIndex
CREATE INDEX "FeedPost_compassId_idx" ON "FeedPost"("compassId");

-- CreateIndex
CREATE INDEX "FeedPost_createdAt_idx" ON "FeedPost"("createdAt");

-- CreateIndex
CREATE INDEX "TESLog_userId_idx" ON "TESLog"("userId");

-- CreateIndex
CREATE INDEX "TESLog_createdAt_idx" ON "TESLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdRevenuePool_year_month_idx" ON "AdRevenuePool"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AdRevenuePool_month_year_key" ON "AdRevenuePool"("month", "year");

-- CreateIndex
CREATE INDEX "RevenueDistribution_poolId_idx" ON "RevenueDistribution"("poolId");

-- CreateIndex
CREATE INDEX "RevenueDistribution_userId_idx" ON "RevenueDistribution"("userId");

-- CreateIndex
CREATE INDEX "RevenueDistribution_paid_idx" ON "RevenueDistribution"("paid");

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compass" ADD CONSTRAINT "Compass_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompassMembership" ADD CONSTRAINT "CompassMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompassMembership" ADD CONSTRAINT "CompassMembership_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_compassId_fkey" FOREIGN KEY ("compassId") REFERENCES "Compass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TESLog" ADD CONSTRAINT "TESLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

