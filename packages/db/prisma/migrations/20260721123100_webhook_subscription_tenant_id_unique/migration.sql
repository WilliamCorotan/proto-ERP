CREATE UNIQUE INDEX CONCURRENTLY "WebhookSubscription_tenantId_id_key"
  ON "WebhookSubscription"("tenantId", "id");
