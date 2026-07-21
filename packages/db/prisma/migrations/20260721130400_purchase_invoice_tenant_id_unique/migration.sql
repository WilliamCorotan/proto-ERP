CREATE UNIQUE INDEX CONCURRENTLY "PurchaseInvoice_tenantId_id_key"
  ON "PurchaseInvoice"("tenantId", "id");
