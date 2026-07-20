CREATE INDEX CONCURRENTLY "SalesOrder_tenantId_quoteId_idx"
  ON "SalesOrder"("tenantId", "quoteId");
