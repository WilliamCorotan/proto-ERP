ALTER TABLE "WebhookDelivery"
  ADD COLUMN "outboxEventId" TEXT,
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT,
  ADD COLUMN "responseStatus" INTEGER,
  ADD COLUMN "payloadBody" TEXT;

UPDATE "WebhookDelivery"
SET "payloadBody" = "payload"::text
WHERE "payloadBody" IS NULL;

ALTER TABLE "WebhookDelivery" ALTER COLUMN "payloadBody" SET NOT NULL;

CREATE UNIQUE INDEX "WebhookDelivery_tenantId_subscriptionId_outboxEventId_key"
  ON "WebhookDelivery"("tenantId", "subscriptionId", "outboxEventId");

CREATE INDEX "WebhookDelivery_tenantId_status_nextAttemptAt_idx"
  ON "WebhookDelivery"("tenantId", "status", "nextAttemptAt");

ALTER TABLE "WebhookDelivery"
  ADD CONSTRAINT "WebhookDelivery_outboxEventId_fkey"
  FOREIGN KEY ("outboxEventId") REFERENCES "OutboxEvent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "DeadLetterRecord_deliveryId_key" ON "DeadLetterRecord"("deliveryId");
CREATE UNIQUE INDEX "DeadLetterRecord_outboxEventId_key" ON "DeadLetterRecord"("outboxEventId");

ALTER TABLE "OutboxEvent" ADD COLUMN "subscriptionId" TEXT;
CREATE INDEX "OutboxEvent_tenantId_subscriptionId_idx" ON "OutboxEvent"("tenantId", "subscriptionId");
ALTER TABLE "OutboxEvent"
  ADD CONSTRAINT "OutboxEvent_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
