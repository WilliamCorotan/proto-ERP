SET LOCAL lock_timeout = '5s';
LOCK TABLE "Role", "UserRole" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "UserRole" child JOIN "Role" parent ON parent."id" = child."roleId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for UserRole.roleId';
  END IF;
END $$;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_tenantId_roleId_fkey"
  FOREIGN KEY ("tenantId", "roleId") REFERENCES "Role"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
