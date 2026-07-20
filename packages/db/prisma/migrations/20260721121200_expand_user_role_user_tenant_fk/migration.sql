SET LOCAL lock_timeout = '5s';
LOCK TABLE "User", "UserRole" IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "UserRole" child JOIN "User" parent ON parent."id" = child."userId" WHERE child."tenantId" <> parent."tenantId") THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for UserRole.userId';
  END IF;
END $$;
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_tenantId_userId_fkey"
  FOREIGN KEY ("tenantId", "userId") REFERENCES "User"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
