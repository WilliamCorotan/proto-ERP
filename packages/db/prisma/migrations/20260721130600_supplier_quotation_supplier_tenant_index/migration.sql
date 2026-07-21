CREATE INDEX CONCURRENTLY "SupplierQuotation_tenantId_supplierId_idx"
  ON "SupplierQuotation"("tenantId", "supplierId");
