-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'SCHEDULED', 'NO_SHOW_REPORTED', 'RESCHEDULE_PROPOSED', 'RESCHEDULE_ACCEPTED', 'REFUNDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consultDurations" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "consultEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consultPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "oroId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "oroId" TEXT NOT NULL,
    "availabilitySlotId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "estimatedStripeFeeCents" INTEGER NOT NULL,
    "oroAmountCents" INTEGER NOT NULL,
    "applicationFeeAmountCents" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "conversationId" TEXT,
    "callSessionId" TEXT,
    "noShowReportedAt" TIMESTAMP(3),
    "rescheduleProposedAt" TIMESTAMP(3),
    "rescheduleProposedFor" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilitySlot_oroId_startAt_idx" ON "AvailabilitySlot"("oroId", "startAt");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_oroId_isBooked_idx" ON "AvailabilitySlot"("oroId", "isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_availabilitySlotId_key" ON "Booking"("availabilitySlotId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripePaymentIntentId_key" ON "Booking"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_conversationId_key" ON "Booking"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_callSessionId_key" ON "Booking"("callSessionId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_oroId_idx" ON "Booking"("oroId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_oroId_fkey" FOREIGN KEY ("oroId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_oroId_fkey" FOREIGN KEY ("oroId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "AvailabilitySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
