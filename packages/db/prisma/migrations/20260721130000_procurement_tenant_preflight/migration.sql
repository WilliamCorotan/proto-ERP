-- Abort before catalog changes. Existing mismatches require operator review.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "RequestForQuote" child
    LEFT JOIN "Supplier" parent ON parent."id" = child."supplierId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for RequestForQuote.supplierId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "SupplierQuotation" child
    LEFT JOIN "Supplier" parent ON parent."id" = child."supplierId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for SupplierQuotation.supplierId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "PurchaseOrder" child
    LEFT JOIN "Supplier" parent ON parent."id" = child."supplierId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseOrder.supplierId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "PurchaseReceipt" child
    LEFT JOIN "PurchaseOrder" parent ON parent."id" = child."purchaseOrderId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseReceipt.purchaseOrderId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "PurchaseInvoice" child
    LEFT JOIN "PurchaseOrder" parent ON parent."id" = child."purchaseOrderId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseInvoice.purchaseOrderId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "SupplierPayment" child
    LEFT JOIN "PurchaseInvoice" parent ON parent."id" = child."purchaseInvoiceId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for SupplierPayment.purchaseInvoiceId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "PurchaseReceipt" child
    LEFT JOIN "Product" parent ON parent."id" = child."productId"
    WHERE child."productId" IS NOT NULL
      AND (parent."id" IS NULL OR child."tenantId" <> parent."tenantId")
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseReceipt.productId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "PurchaseInvoice" child
    LEFT JOIN "JournalEntry" parent ON parent."id" = child."journalEntryId"
    WHERE child."journalEntryId" IS NOT NULL
      AND (parent."id" IS NULL OR child."tenantId" <> parent."tenantId")
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for PurchaseInvoice.journalEntryId'; END IF;

  IF EXISTS (
    SELECT 1 FROM "SupplierPayment" child
    LEFT JOIN "JournalEntry" parent ON parent."id" = child."journalEntryId"
    WHERE child."journalEntryId" IS NOT NULL
      AND (parent."id" IS NULL OR child."tenantId" <> parent."tenantId")
  ) THEN RAISE EXCEPTION 'Tenant integrity preflight failed for SupplierPayment.journalEntryId'; END IF;
END $$;
