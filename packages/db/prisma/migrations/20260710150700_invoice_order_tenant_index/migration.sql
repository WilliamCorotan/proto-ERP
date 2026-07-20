CREATE INDEX CONCURRENTLY "Invoice_tenantId_orderId_idx"
  ON "Invoice"("tenantId", "orderId");
