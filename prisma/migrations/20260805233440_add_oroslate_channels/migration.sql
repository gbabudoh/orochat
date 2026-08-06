-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "nestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_conversationId_key" ON "Channel"("conversationId");

-- CreateIndex
CREATE INDEX "Channel_nestId_idx" ON "Channel"("nestId");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_nestId_fkey" FOREIGN KEY ("nestId") REFERENCES "Nest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
