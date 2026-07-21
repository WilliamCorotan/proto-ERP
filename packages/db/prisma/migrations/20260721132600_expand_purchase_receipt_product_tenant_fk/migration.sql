SET LOCAL lock_timeout = '5s';
LOCK TABLE "Product", "PurchaseReceipt" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "PurchaseReceipt" child JOIN "Product" parent ON parent."id" = child."productId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseReceipt.productId';
  END IF;
END $$;
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_tenantId_productId_fkey"
  FOREIGN KEY ("tenantId", "productId") REFERENCES "Product"("tenantId", "id")
  ON DELETE SET NULL ("productId") ON UPDATE RESTRICT NOT VALID;
