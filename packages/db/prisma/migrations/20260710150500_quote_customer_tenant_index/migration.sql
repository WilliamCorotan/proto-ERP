CREATE INDEX CONCURRENTLY "Quote_tenantId_customerId_idx"
  ON "Quote"("tenantId", "customerId");
