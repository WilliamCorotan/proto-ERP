SET LOCAL lock_timeout = '5s';

LOCK TABLE "EmployeeRecord", "ExpenseClaim" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ExpenseClaim" child
    JOIN "EmployeeRecord" parent ON parent."id" = child."employeeId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for ExpenseClaim.employeeId';
  END IF;
END $$;

ALTER TABLE "ExpenseClaim"
  ADD CONSTRAINT "ExpenseClaim_tenantId_employeeId_fkey"
  FOREIGN KEY ("tenantId", "employeeId")
  REFERENCES "EmployeeRecord"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
