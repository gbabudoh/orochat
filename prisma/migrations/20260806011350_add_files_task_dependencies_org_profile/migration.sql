-- AlterTable
ALTER TABLE "NestTask" ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "description" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "NestFile" (
    "id" TEXT NOT NULL,
    "nestId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "objectName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NestTaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NestTaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NestFile_nestId_idx" ON "NestFile"("nestId");

-- CreateIndex
CREATE INDEX "NestTaskDependency_dependsOnId_idx" ON "NestTaskDependency"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "NestTaskDependency_taskId_dependsOnId_key" ON "NestTaskDependency"("taskId", "dependsOnId");

-- AddForeignKey
ALTER TABLE "NestFile" ADD CONSTRAINT "NestFile_nestId_fkey" FOREIGN KEY ("nestId") REFERENCES "Nest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestFile" ADD CONSTRAINT "NestFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestTaskDependency" ADD CONSTRAINT "NestTaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NestTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NestTaskDependency" ADD CONSTRAINT "NestTaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "NestTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
