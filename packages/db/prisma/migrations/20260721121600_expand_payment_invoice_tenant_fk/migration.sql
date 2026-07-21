SET LOCAL lock_timeout = '5s';
LOCK TABLE "Invoice", "Payment" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" child JOIN "Invoice" parent ON parent."id" = child."invoiceId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Payment.invoiceId';
  END IF;
END $$;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_invoiceId_fkey"
  FOREIGN KEY ("tenantId", "invoiceId") REFERENCES "Invoice"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
