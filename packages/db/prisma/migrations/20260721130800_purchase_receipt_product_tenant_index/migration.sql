CREATE INDEX CONCURRENTLY "PurchaseReceipt_tenantId_productId_idx"
  ON "PurchaseReceipt"("tenantId", "productId");
