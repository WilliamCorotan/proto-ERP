CREATE UNIQUE INDEX CONCURRENTLY "Supplier_tenantId_id_key"
  ON "Supplier"("tenantId", "id");
