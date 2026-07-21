SET LOCAL lock_timeout = '5s';

ALTER TABLE "UserRole" ADD COLUMN "tenantId" TEXT;
UPDATE "UserRole" link
SET "tenantId" = app_user."tenantId"
FROM "User" app_user
WHERE app_user."id" = link."userId";
ALTER TABLE "UserRole" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "JournalLine" ADD COLUMN "tenantId" TEXT;
UPDATE "JournalLine" line
SET "tenantId" = entry."tenantId"
FROM "JournalEntry" entry
WHERE entry."id" = line."entryId";
ALTER TABLE "JournalLine" ALTER COLUMN "tenantId" SET NOT NULL;
