CREATE INDEX CONCURRENTLY "PurchaseOrder_tenantId_supplierId_idx"
  ON "PurchaseOrder"("tenantId", "supplierId");
