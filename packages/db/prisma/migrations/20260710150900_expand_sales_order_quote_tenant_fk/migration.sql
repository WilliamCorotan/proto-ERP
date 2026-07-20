SET LOCAL lock_timeout = '5s';

LOCK TABLE "Quote", "SalesOrder" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "SalesOrder" child
    JOIN "Quote" parent ON parent."id" = child."quoteId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for SalesOrder.quoteId';
  END IF;
END $$;

ALTER TABLE "SalesOrder"
  ADD CONSTRAINT "SalesOrder_tenantId_quoteId_fkey"
  FOREIGN KEY ("tenantId", "quoteId")
  REFERENCES "Quote"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
