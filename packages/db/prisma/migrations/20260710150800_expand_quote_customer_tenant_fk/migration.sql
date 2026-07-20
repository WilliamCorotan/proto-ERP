SET LOCAL lock_timeout = '5s';

LOCK TABLE "Customer", "Quote" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Quote" child
    JOIN "Customer" parent ON parent."id" = child."customerId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Quote.customerId';
  END IF;
END $$;

ALTER TABLE "Quote"
  ADD CONSTRAINT "Quote_tenantId_customerId_fkey"
  FOREIGN KEY ("tenantId", "customerId")
  REFERENCES "Customer"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
