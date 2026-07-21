SET LOCAL lock_timeout = '5s';
LOCK TABLE "PurchaseOrder", "PurchaseInvoice" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "PurchaseInvoice" child JOIN "PurchaseOrder" parent ON parent."id" = child."purchaseOrderId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseInvoice.purchaseOrderId';
  END IF;
END $$;
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_tenantId_purchaseOrderId_fkey"
  FOREIGN KEY ("tenantId", "purchaseOrderId") REFERENCES "PurchaseOrder"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
