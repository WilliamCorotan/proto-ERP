SET LOCAL lock_timeout = '5s';
LOCK TABLE "Supplier", "SupplierQuotation" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "SupplierQuotation" child JOIN "Supplier" parent ON parent."id" = child."supplierId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for SupplierQuotation.supplierId';
  END IF;
END $$;
ALTER TABLE "SupplierQuotation" ADD CONSTRAINT "SupplierQuotation_tenantId_supplierId_fkey"
  FOREIGN KEY ("tenantId", "supplierId") REFERENCES "Supplier"("tenantId", "id")
  ON DELETE RESTRICT ON UPDATE RESTRICT NOT VALID;
