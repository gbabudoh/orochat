-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('PENDING', 'EXECUTED');

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "initiatorKey" JSONB NOT NULL,
    "initiatorSignature" TEXT NOT NULL,
    "messageId" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementSigner" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKeyJwk" JSONB,
    "signature" TEXT,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "AgreementSigner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_messageId_key" ON "Agreement"("messageId");

-- CreateIndex
CREATE INDEX "Agreement_conversationId_idx" ON "Agreement"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementSigner_agreementId_userId_key" ON "AgreementSigner"("agreementId", "userId");

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementSigner" ADD CONSTRAINT "AgreementSigner_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementSigner" ADD CONSTRAINT "AgreementSigner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
