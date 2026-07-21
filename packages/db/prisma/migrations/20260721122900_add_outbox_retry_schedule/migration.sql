ALTER TABLE "OutboxEvent" ADD COLUMN "nextAttemptAt" TIMESTAMP(3);

CREATE INDEX "OutboxEvent_status_nextAttemptAt_createdAt_idx"
  ON "OutboxEvent"("status", "nextAttemptAt", "createdAt");
