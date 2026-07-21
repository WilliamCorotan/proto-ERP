SET LOCAL lock_timeout = '5s';
LOCK TABLE "Supplier", "RequestForQuote" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "RequestForQuote" child JOIN "Supplier" parent ON parent."id" = child."supplierId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for RequestForQuote.supplierId';
  END IF;
END $$;
ALTER TABLE "RequestForQuote" ADD CONSTRAINT "RequestForQuote_tenantId_supplierId_fkey"
  FOREIGN KEY ("tenantId", "supplierId") REFERENCES "Supplier"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
