CREATE INDEX CONCURRENTLY "Payment_tenantId_journalEntryId_idx" ON "Payment"("tenantId", "journalEntryId");
