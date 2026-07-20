-- AlterTable
ALTER TABLE "AutomationRule" ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "runCount" INTEGER NOT NULL DEFAULT 0;
