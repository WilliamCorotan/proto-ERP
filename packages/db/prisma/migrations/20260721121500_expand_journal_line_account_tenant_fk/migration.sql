SET LOCAL lock_timeout = '5s';
LOCK TABLE "Account", "JournalLine" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "JournalLine" child JOIN "Account" parent ON parent."id" = child."accountId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for JournalLine.accountId';
  END IF;
END $$;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_tenantId_accountId_fkey"
  FOREIGN KEY ("tenantId", "accountId") REFERENCES "Account"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
