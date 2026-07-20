CREATE UNIQUE INDEX CONCURRENTLY "Quote_tenantId_id_key"
  ON "Quote"("tenantId", "id");
