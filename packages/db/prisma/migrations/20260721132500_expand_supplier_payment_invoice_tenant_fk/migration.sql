SET LOCAL lock_timeout = '5s';
LOCK TABLE "PurchaseInvoice", "SupplierPayment" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "SupplierPayment" child JOIN "PurchaseInvoice" parent ON parent."id" = child."purchaseInvoiceId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for SupplierPayment.purchaseInvoiceId';
  END IF;
END $$;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_tenantId_purchaseInvoiceId_fkey"
  FOREIGN KEY ("tenantId", "purchaseInvoiceId") REFERENCES "PurchaseInvoice"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
