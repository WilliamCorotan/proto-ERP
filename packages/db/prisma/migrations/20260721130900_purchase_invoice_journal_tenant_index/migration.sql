CREATE INDEX CONCURRENTLY "PurchaseInvoice_tenantId_journalEntryId_idx"
  ON "PurchaseInvoice"("tenantId", "journalEntryId");
