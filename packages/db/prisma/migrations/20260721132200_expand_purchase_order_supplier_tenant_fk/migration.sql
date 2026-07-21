SET LOCAL lock_timeout = '5s';
LOCK TABLE "Supplier", "PurchaseOrder" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "PurchaseOrder" child JOIN "Supplier" parent ON parent."id" = child."supplierId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseOrder.supplierId';
  END IF;
END $$;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_tenantId_supplierId_fkey"
  FOREIGN KEY ("tenantId", "supplierId") REFERENCES "Supplier"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
