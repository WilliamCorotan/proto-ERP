SET LOCAL lock_timeout = '5s';

LOCK TABLE "SalesOrder", "Invoice" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Invoice" child
    JOIN "SalesOrder" parent ON parent."id" = child."orderId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Invoice.orderId';
  END IF;
END $$;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_tenantId_orderId_fkey"
  FOREIGN KEY ("tenantId", "orderId")
  REFERENCES "SalesOrder"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
