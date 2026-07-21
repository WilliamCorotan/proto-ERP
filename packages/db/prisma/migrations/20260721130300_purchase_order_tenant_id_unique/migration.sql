CREATE UNIQUE INDEX CONCURRENTLY "PurchaseOrder_tenantId_id_key"
  ON "PurchaseOrder"("tenantId", "id");
