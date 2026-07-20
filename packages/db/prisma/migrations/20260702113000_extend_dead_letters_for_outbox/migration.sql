-- AlterTable
ALTER TABLE "DeadLetterRecord" ALTER COLUMN "deliveryId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DeadLetterRecord" ADD COLUMN "outboxEventId" TEXT;

-- CreateIndex
CREATE INDEX "DeadLetterRecord_tenantId_outboxEventId_idx" ON "DeadLetterRecord"("tenantId", "outboxEventId");

-- AddForeignKey
ALTER TABLE "DeadLetterRecord" ADD CONSTRAINT "DeadLetterRecord_outboxEventId_fkey" FOREIGN KEY ("outboxEventId") REFERENCES "OutboxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
