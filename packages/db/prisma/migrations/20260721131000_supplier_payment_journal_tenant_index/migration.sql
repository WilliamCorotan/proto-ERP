CREATE INDEX CONCURRENTLY "SupplierPayment_tenantId_journalEntryId_idx"
  ON "SupplierPayment"("tenantId", "journalEntryId");
