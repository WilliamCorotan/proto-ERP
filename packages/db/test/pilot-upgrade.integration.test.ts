import { afterEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import {
  activeMigrationTemporaryDirectories,
  createMigratedTestDatabase,
  deployTestMigrations,
  requireTestDatabaseUrl,
  type MigratedTestDatabase,
} from "./support/postgres.js";

const predecessorCutoff = "20260702200000_add_workflow_task_operations";
const identityFinancePredecessorCutoff =
  "20260710152300_validate_expense_employee_tenant_fk";

describe.sequential("tenant-FK pilot populated upgrades", () => {
  const databases: MigratedTestDatabase[] = [];

  afterEach(async () => {
    await Promise.all(
      databases.splice(0).map((database) => database.dispose()),
    );
    expect(activeMigrationTemporaryDirectories()).toEqual([]);
  });

  it("upgrades populated valid predecessor data through the full pilot", async () => {
    const database = await createMigratedTestDatabase({
      through: predecessorCutoff,
    });
    databases.push(database);
    const sql = new Client({ connectionString: database.databaseUrl });
    await sql.connect();
    try {
      await seedValidPredecessor(sql);
      await deployTestMigrations(database.databaseUrl);

      const result = await sql.query<{
        constraints: string;
        validated: string;
        invoices: string;
        expenses: string;
        userRoles: string;
        journalLines: string;
        payments: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'Quote_tenantId_customerId_fkey',
             'SalesOrder_tenantId_quoteId_fkey',
             'Invoice_tenantId_orderId_fkey',
             'ExpenseClaim_tenantId_employeeId_fkey',
             'UserRole_tenantId_userId_fkey',
             'UserRole_tenantId_roleId_fkey',
             'JournalLine_tenantId_entryId_fkey',
             'JournalLine_tenantId_accountId_fkey',
             'Payment_tenantId_invoiceId_fkey',
             'Payment_tenantId_journalEntryId_fkey'
           ))::text AS constraints,
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'Quote_tenantId_customerId_fkey',
             'SalesOrder_tenantId_quoteId_fkey',
             'Invoice_tenantId_orderId_fkey',
             'ExpenseClaim_tenantId_employeeId_fkey',
             'UserRole_tenantId_userId_fkey',
             'UserRole_tenantId_roleId_fkey',
             'JournalLine_tenantId_entryId_fkey',
             'JournalLine_tenantId_accountId_fkey',
             'Payment_tenantId_invoiceId_fkey',
             'Payment_tenantId_journalEntryId_fkey'
           ) AND convalidated)::text AS validated,
          (SELECT COUNT(*) FROM "Invoice")::text AS invoices,
          (SELECT COUNT(*) FROM "ExpenseClaim")::text AS expenses,
          (SELECT COUNT(*) FROM "UserRole")::text AS "userRoles",
          (SELECT COUNT(*) FROM "JournalLine")::text AS "journalLines",
          (SELECT COUNT(*) FROM "Payment")::text AS payments
      `);

      expect(result.rows[0]).toEqual({
        constraints: "10",
        validated: "10",
        invoices: "1",
        expenses: "1",
        userRoles: "1",
        journalLines: "2",
        payments: "1",
      });
      expect(activeMigrationTemporaryDirectories()).toEqual([]);
    } finally {
      await sql.end();
      await database.dispose();
      databases.splice(databases.indexOf(database), 1);
    }
    await expectDatabaseAbsent(database.databaseName);
  }, 120_000);

  it("aborts dirty identity data before creating the identity/finance contract", async () => {
    const database = await createMigratedTestDatabase({
      through: identityFinancePredecessorCutoff,
    });
    databases.push(database);
    const sql = new Client({ connectionString: database.databaseUrl });
    await sql.connect();
    try {
      await seedDirtyIdentityPredecessor(sql);

      await expect(deployTestMigrations(database.databaseUrl)).rejects.toThrow(
        "Tenant integrity preflight failed for UserRole.userId/roleId",
      );

      const catalog = await sql.query<{
        columns: string;
        constraints: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM information_schema.columns
           WHERE (table_name, column_name) IN (
             ('UserRole', 'tenantId'),
             ('JournalLine', 'tenantId')
           ))::text AS columns,
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'UserRole_tenantId_userId_fkey',
             'UserRole_tenantId_roleId_fkey',
             'JournalLine_tenantId_entryId_fkey',
             'JournalLine_tenantId_accountId_fkey',
             'Payment_tenantId_invoiceId_fkey',
             'Payment_tenantId_journalEntryId_fkey'
           ))::text AS constraints
      `);

      expect(catalog.rows[0]).toEqual({ columns: "0", constraints: "0" });
    } finally {
      await sql.end();
      await database.dispose();
      databases.splice(databases.indexOf(database), 1);
    }
    await expectDatabaseAbsent(database.databaseName);
  }, 120_000);

  it("aborts dirty predecessor data before creating any pilot contract", async () => {
    const database = await createMigratedTestDatabase({
      through: predecessorCutoff,
    });
    databases.push(database);
    const sql = new Client({ connectionString: database.databaseUrl });
    await sql.connect();
    try {
      await seedDirtyPredecessor(sql);

      await expect(deployTestMigrations(database.databaseUrl)).rejects.toThrow(
        "Tenant integrity preflight failed for Quote.customerId",
      );

      const catalog = await sql.query<{
        indexes: string;
        constraints: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM pg_class
           WHERE relkind = 'i' AND relname IN (
             'Customer_tenantId_id_key',
             'Quote_tenantId_id_key',
             'SalesOrder_tenantId_id_key',
             'EmployeeRecord_tenantId_id_key',
             'Quote_tenantId_customerId_idx',
             'SalesOrder_tenantId_quoteId_idx',
             'Invoice_tenantId_orderId_idx'
           ))::text AS indexes,
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'Quote_tenantId_customerId_fkey',
             'SalesOrder_tenantId_quoteId_fkey',
             'Invoice_tenantId_orderId_fkey',
             'ExpenseClaim_tenantId_employeeId_fkey'
           ))::text AS constraints
      `);

      expect(catalog.rows[0]).toEqual({ indexes: "0", constraints: "0" });
      expect(activeMigrationTemporaryDirectories()).toEqual([]);
    } finally {
      await sql.end();
      await database.dispose();
      databases.splice(databases.indexOf(database), 1);
    }
    await expectDatabaseAbsent(database.databaseName);
  }, 120_000);
});

async function seedValidPredecessor(sql: Client): Promise<void> {
  await sql.query(`
    INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
    VALUES ('ten_upgrade_alpha', 'Upgrade Alpha', 'upgrade-alpha', NOW(), NOW());

    INSERT INTO "Customer"
      ("id", "tenantId", "code", "name", "status", "owner", "email", "creditLimit", "currency", "createdAt", "updatedAt")
    VALUES
      ('cus_upgrade_alpha', 'ten_upgrade_alpha', 'CUST-UPGRADE', 'Upgrade Customer', 'active', 'Owner', 'customer@upgrade.test', 100, 'USD', NOW(), NOW());

    INSERT INTO "Quote"
      ("id", "tenantId", "customerId", "number", "status", "validUntil", "total", "currency", "lines", "createdAt", "updatedAt")
    VALUES
      ('quo_upgrade_alpha', 'ten_upgrade_alpha', 'cus_upgrade_alpha', 'Q-UPGRADE', 'draft', NOW(), 100, 'USD', '[]'::jsonb, NOW(), NOW());

    INSERT INTO "SalesOrder"
      ("id", "tenantId", "quoteId", "number", "status", "promisedDate", "total", "currency", "createdAt", "updatedAt")
    VALUES
      ('ord_upgrade_alpha', 'ten_upgrade_alpha', 'quo_upgrade_alpha', 'SO-UPGRADE', 'draft', NOW(), 100, 'USD', NOW(), NOW());

    INSERT INTO "Invoice"
      ("id", "tenantId", "orderId", "number", "status", "dueDate", "total", "currency", "createdAt", "updatedAt")
    VALUES
      ('inv_upgrade_alpha', 'ten_upgrade_alpha', 'ord_upgrade_alpha', 'INV-UPGRADE', 'draft', NOW(), 100, 'USD', NOW(), NOW());

    INSERT INTO "EmployeeRecord"
      ("id", "tenantId", "employeeNumber", "name", "department", "role", "status", "createdAt", "updatedAt")
    VALUES
      ('emp_upgrade_alpha', 'ten_upgrade_alpha', 'EMP-UPGRADE', 'Upgrade Employee', 'Test', 'Tester', 'active', NOW(), NOW());

    INSERT INTO "ExpenseClaim"
      ("id", "tenantId", "employeeId", "number", "status", "category", "description", "amount", "currency", "submittedAt", "createdAt", "updatedAt")
    VALUES
      ('exp_upgrade_alpha', 'ten_upgrade_alpha', 'emp_upgrade_alpha', 'EXP-UPGRADE', 'submitted', 'Test', 'Upgrade expense', 10, 'USD', NOW(), NOW(), NOW());

    INSERT INTO "User"
      ("id", "tenantId", "email", "name", "createdAt", "updatedAt")
    VALUES ('usr_upgrade_alpha', 'ten_upgrade_alpha', 'user@upgrade.test', 'Upgrade User', NOW(), NOW());

    INSERT INTO "Role"
      ("id", "tenantId", "key", "name", "permissions", "createdAt", "updatedAt")
    VALUES ('role_upgrade_alpha', 'ten_upgrade_alpha', 'upgrade', 'Upgrade Role', ARRAY['accounting.read'], NOW(), NOW());

    INSERT INTO "UserRole" ("userId", "roleId")
    VALUES ('usr_upgrade_alpha', 'role_upgrade_alpha');

    INSERT INTO "Account"
      ("id", "tenantId", "code", "name", "type", "normalBalance", "active", "createdAt", "updatedAt")
    VALUES
      ('acct_upgrade_debit', 'ten_upgrade_alpha', '1000', 'Upgrade Debit', 'asset', 'debit', true, NOW(), NOW()),
      ('acct_upgrade_credit', 'ten_upgrade_alpha', '4000', 'Upgrade Credit', 'revenue', 'credit', true, NOW(), NOW());

    INSERT INTO "JournalEntry"
      ("id", "tenantId", "number", "memo", "status", "createdAt", "updatedAt")
    VALUES ('je_upgrade_alpha', 'ten_upgrade_alpha', 'JE-UPGRADE', 'Upgrade journal', 'posted', NOW(), NOW());

    INSERT INTO "JournalLine"
      ("id", "entryId", "accountId", "description", "debit", "credit", "createdAt")
    VALUES
      ('jl_upgrade_debit', 'je_upgrade_alpha', 'acct_upgrade_debit', 'Upgrade debit', 100, 0, NOW()),
      ('jl_upgrade_credit', 'je_upgrade_alpha', 'acct_upgrade_credit', 'Upgrade credit', 0, 100, NOW());

    INSERT INTO "Payment"
      ("id", "tenantId", "invoiceId", "journalEntryId", "amount", "currency", "method", "receivedAt", "createdAt")
    VALUES ('pay_upgrade_alpha', 'ten_upgrade_alpha', 'inv_upgrade_alpha', 'je_upgrade_alpha', 100, 'USD', 'test', NOW(), NOW());
  `);
}

async function seedDirtyIdentityPredecessor(sql: Client): Promise<void> {
  await sql.query(`
    INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
    VALUES
      ('ten_identity_alpha', 'Identity Alpha', 'identity-alpha', NOW(), NOW()),
      ('ten_identity_beta', 'Identity Beta', 'identity-beta', NOW(), NOW());

    INSERT INTO "User" ("id", "tenantId", "email", "name", "createdAt", "updatedAt")
    VALUES ('usr_identity_alpha', 'ten_identity_alpha', 'alpha@identity.test', 'Alpha User', NOW(), NOW());

    INSERT INTO "Role" ("id", "tenantId", "key", "name", "permissions", "createdAt", "updatedAt")
    VALUES ('role_identity_beta', 'ten_identity_beta', 'beta-role', 'Beta Role', ARRAY[]::text[], NOW(), NOW());

    INSERT INTO "UserRole" ("userId", "roleId")
    VALUES ('usr_identity_alpha', 'role_identity_beta');
  `);
}

async function seedDirtyPredecessor(sql: Client): Promise<void> {
  await sql.query(`
    INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
    VALUES
      ('ten_dirty_alpha', 'Dirty Alpha', 'dirty-alpha', NOW(), NOW()),
      ('ten_dirty_beta', 'Dirty Beta', 'dirty-beta', NOW(), NOW());

    INSERT INTO "Customer"
      ("id", "tenantId", "code", "name", "status", "owner", "email", "creditLimit", "currency", "createdAt", "updatedAt")
    VALUES
      ('cus_dirty_beta', 'ten_dirty_beta', 'CUST-DIRTY', 'Dirty Customer', 'active', 'Owner', 'customer@dirty.test', 100, 'USD', NOW(), NOW());

    INSERT INTO "Quote"
      ("id", "tenantId", "customerId", "number", "status", "validUntil", "total", "currency", "lines", "createdAt", "updatedAt")
    VALUES
      ('quo_dirty_alpha', 'ten_dirty_alpha', 'cus_dirty_beta', 'Q-DIRTY', 'draft', NOW(), 100, 'USD', '[]'::jsonb, NOW(), NOW());
  `);
}

async function expectDatabaseAbsent(databaseName: string): Promise<void> {
  const admin = new Client({
    connectionString: requireTestDatabaseUrl(process.env.TEST_DATABASE_URL),
  });
  await admin.connect();
  try {
    const result = await admin.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [databaseName],
    );
    expect(result.rows[0]?.exists).toBe(false);
  } finally {
    await admin.end();
  }
}
