CREATE UNIQUE INDEX CONCURRENTLY "Product_tenantId_id_key"
  ON "Product"("tenantId", "id");
