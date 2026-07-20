CREATE UNIQUE INDEX CONCURRENTLY "SalesOrder_tenantId_id_key"
  ON "SalesOrder"("tenantId", "id");
