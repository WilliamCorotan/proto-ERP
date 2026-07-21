CREATE INDEX CONCURRENTLY "RequestForQuote_tenantId_supplierId_idx"
  ON "RequestForQuote"("tenantId", "supplierId");
