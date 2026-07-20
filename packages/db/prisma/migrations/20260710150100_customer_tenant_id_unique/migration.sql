CREATE UNIQUE INDEX CONCURRENTLY "Customer_tenantId_id_key"
  ON "Customer"("tenantId", "id");
