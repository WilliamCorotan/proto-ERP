SET LOCAL lock_timeout = '5s';
LOCK TABLE "PurchaseOrder", "PurchaseReceipt" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "PurchaseReceipt" child JOIN "PurchaseOrder" parent ON parent."id" = child."purchaseOrderId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseReceipt.purchaseOrderId';
  END IF;
END $$;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_tenantId_purchaseOrderId_fkey"
  FOREIGN KEY ("tenantId", "purchaseOrderId") REFERENCES "PurchaseOrder"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
