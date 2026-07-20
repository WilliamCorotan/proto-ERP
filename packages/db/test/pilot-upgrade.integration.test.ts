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

describe.sequential("tenant-FK pilot populated upgrades", () => {
  const databases: MigratedTestDatabase[] = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.dispose()));
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
      }>(`
        SELECT
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'Quote_tenantId_customerId_fkey',
             'SalesOrder_tenantId_quoteId_fkey',
             'Invoice_tenantId_orderId_fkey',
             'ExpenseClaim_tenantId_employeeId_fkey'
           ))::text AS constraints,
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'Quote_tenantId_customerId_fkey',
             'SalesOrder_tenantId_quoteId_fkey',
             'Invoice_tenantId_orderId_fkey',
             'ExpenseClaim_tenantId_employeeId_fkey'
           ) AND convalidated)::text AS validated,
          (SELECT COUNT(*) FROM "Invoice")::text AS invoices,
          (SELECT COUNT(*) FROM "ExpenseClaim")::text AS expenses
      `);

      expect(result.rows[0]).toEqual({
        constraints: "4",
        validated: "4",
        invoices: "1",
        expenses: "1",
      });
      expect(activeMigrationTemporaryDirectories()).toEqual([]);
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

      const catalog = await sql.query<{ indexes: string; constraints: string }>(`
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
