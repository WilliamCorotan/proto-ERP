SET LOCAL lock_timeout = '5s';
LOCK TABLE "JournalEntry", "JournalLine" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "JournalLine" child JOIN "JournalEntry" parent ON parent."id" = child."entryId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for JournalLine.entryId';
  END IF;
END $$;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_tenantId_entryId_fkey"
  FOREIGN KEY ("tenantId", "entryId") REFERENCES "JournalEntry"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
