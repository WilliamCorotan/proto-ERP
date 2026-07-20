CREATE UNIQUE INDEX CONCURRENTLY "EmployeeRecord_tenantId_id_key"
  ON "EmployeeRecord"("tenantId", "id");
