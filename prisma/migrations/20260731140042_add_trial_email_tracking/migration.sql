-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "trialExpiredEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "trialReminderSentAt" TIMESTAMP(3);
