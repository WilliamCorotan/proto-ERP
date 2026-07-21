SET LOCAL lock_timeout = '5s';
LOCK TABLE "JournalEntry", "Payment" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" child JOIN "JournalEntry" parent ON parent."id" = child."journalEntryId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Payment.journalEntryId';
  END IF;
END $$;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_journalEntryId_fkey"
  FOREIGN KEY ("tenantId", "journalEntryId") REFERENCES "JournalEntry"("tenantId", "id")
  ON DELETE SET NULL ("journalEntryId") ON UPDATE RESTRICT NOT VALID;
