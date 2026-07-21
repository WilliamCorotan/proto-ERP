CREATE UNIQUE INDEX CONCURRENTLY "OutboxEvent_tenantId_id_key"
  ON "OutboxEvent"("tenantId", "id");
