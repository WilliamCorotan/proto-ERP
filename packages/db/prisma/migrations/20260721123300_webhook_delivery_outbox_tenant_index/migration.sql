CREATE INDEX CONCURRENTLY "WebhookDelivery_tenantId_outboxEventId_idx"
  ON "WebhookDelivery"("tenantId", "outboxEventId");
