-- Preflight phase: abort before the expand phase makes any catalog changes.
-- Historical mismatches require operator review and are never repaired here.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Quote" child
    JOIN "Customer" parent ON parent."id" = child."customerId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Quote.customerId';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SalesOrder" child
    JOIN "Quote" parent ON parent."id" = child."quoteId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for SalesOrder.quoteId';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Invoice" child
    JOIN "SalesOrder" parent ON parent."id" = child."orderId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Invoice.orderId';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "ExpenseClaim" child
    JOIN "EmployeeRecord" parent ON parent."id" = child."employeeId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for ExpenseClaim.employeeId';
  END IF;
END $$;
