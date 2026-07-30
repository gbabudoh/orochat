-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING_PAYMENT', 'SCHEDULED', 'RESCHEDULE_ACCEPTED', 'REFUNDED', 'CANCELLED');
ALTER TABLE "public"."Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- DropIndex
DROP INDEX "AvailabilitySlot_oroId_isBooked_idx";

-- DropIndex
DROP INDEX "Booking_availabilitySlotId_key";

-- DropIndex
DROP INDEX "Booking_callSessionId_key";

-- DropIndex
DROP INDEX "Booking_conversationId_key";

-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "isBooked",
ADD COLUMN     "bookedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "callSessionId" TEXT,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "noShowReportedAt" TIMESTAMP(3),
ADD COLUMN     "rescheduleProposedAt" TIMESTAMP(3),
ADD COLUMN     "rescheduleProposedFor" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "noShowReportedAt",
DROP COLUMN "rescheduleProposedAt",
DROP COLUMN "rescheduleProposedFor";

-- CreateIndex
CREATE INDEX "AvailabilitySlot_oroId_bookedCount_idx" ON "AvailabilitySlot"("oroId", "bookedCount");

