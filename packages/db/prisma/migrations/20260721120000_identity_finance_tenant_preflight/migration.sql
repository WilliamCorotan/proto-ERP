-- Abort before any catalog changes. Existing mismatches require operator review.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "UserRole" link
    JOIN "User" app_user ON app_user."id" = link."userId"
    JOIN "Role" role ON role."id" = link."roleId"
    WHERE app_user."tenantId" <> role."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for UserRole.userId/roleId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "JournalLine" line
    JOIN "JournalEntry" entry ON entry."id" = line."entryId"
    JOIN "Account" account ON account."id" = line."accountId"
    WHERE entry."tenantId" <> account."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for JournalLine.entryId/accountId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Payment" payment
    JOIN "Invoice" invoice ON invoice."id" = payment."invoiceId"
    WHERE payment."tenantId" <> invoice."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Payment.invoiceId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Payment" payment
    JOIN "JournalEntry" entry ON entry."id" = payment."journalEntryId"
    WHERE payment."tenantId" <> entry."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for Payment.journalEntryId';
  END IF;
END $$;
