import { afterEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import {
  activeMigrationTemporaryDirectories,
  createMigratedTestDatabase,
  deployTestMigrations,
  requireTestDatabaseUrl,
  type MigratedTestDatabase,
} from "./support/postgres.js";

const predecessorCutoff = "20260721125000_validate_webhook_tenant_foreign_keys";

describe.sequential("procurement tenant-FK populated upgrades", () => {
  const databases: MigratedTestDatabase[] = [];

  afterEach(async () => {
    await Promise.all(
      databases.splice(0).map((database) => database.dispose()),
    );
    expect(activeMigrationTemporaryDirectories()).toEqual([]);
  });

  it("upgrades a populated valid procurement chain without changing links", async () => {
    const database = await createMigratedTestDatabase({
      through: predecessorCutoff,
    });
    databases.push(database);
    const sql = new Client({ connectionString: database.databaseUrl });
    await sql.connect();
    try {
      await seedValidProcurementPredecessor(sql);
      await deployTestMigrations(database.databaseUrl);

      const result = await sql.query<{
        constraints: string;
        validated: string;
        linked: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'RequestForQuote_tenantId_supplierId_fkey',
             'SupplierQuotation_tenantId_supplierId_fkey',
             'PurchaseOrder_tenantId_supplierId_fkey',
             'PurchaseReceipt_tenantId_purchaseOrderId_fkey',
             'PurchaseInvoice_tenantId_purchaseOrderId_fkey',
             'SupplierPayment_tenantId_purchaseInvoiceId_fkey',
             'PurchaseReceipt_tenantId_productId_fkey',
             'PurchaseInvoice_tenantId_journalEntryId_fkey',
             'SupplierPayment_tenantId_journalEntryId_fkey'
           ))::text AS constraints,
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'RequestForQuote_tenantId_supplierId_fkey',
             'SupplierQuotation_tenantId_supplierId_fkey',
             'PurchaseOrder_tenantId_supplierId_fkey',
             'PurchaseReceipt_tenantId_purchaseOrderId_fkey',
             'PurchaseInvoice_tenantId_purchaseOrderId_fkey',
             'SupplierPayment_tenantId_purchaseInvoiceId_fkey',
             'PurchaseReceipt_tenantId_productId_fkey',
             'PurchaseInvoice_tenantId_journalEntryId_fkey',
             'SupplierPayment_tenantId_journalEntryId_fkey'
           ) AND convalidated)::text AS validated,
          (SELECT COUNT(*)
             FROM "SupplierPayment" payment
             JOIN "PurchaseInvoice" invoice
               ON (invoice."tenantId", invoice."id") = (payment."tenantId", payment."purchaseInvoiceId")
             JOIN "PurchaseOrder" purchase_order
               ON (purchase_order."tenantId", purchase_order."id") = (invoice."tenantId", invoice."purchaseOrderId")
             JOIN "Supplier" supplier
               ON (supplier."tenantId", supplier."id") = (purchase_order."tenantId", purchase_order."supplierId")
             JOIN "PurchaseReceipt" receipt
               ON (receipt."tenantId", receipt."purchaseOrderId") = (purchase_order."tenantId", purchase_order."id")
             JOIN "Product" product
               ON (product."tenantId", product."id") = (receipt."tenantId", receipt."productId")
            WHERE payment."id" = 'spay_upgrade_proc')::text AS linked
      `);

      expect(result.rows[0]).toEqual({
        constraints: "9",
        validated: "9",
        linked: "1",
      });
      expect(activeMigrationTemporaryDirectories()).toEqual([]);
    } finally {
      await sql.end();
      await database.dispose();
      databases.splice(databases.indexOf(database), 1);
    }
    await expectDatabaseAbsent(database.databaseName);
  }, 120_000);

  it("aborts a dirty procurement predecessor before catalog changes", async () => {
    const database = await createMigratedTestDatabase({
      through: predecessorCutoff,
    });
    databases.push(database);
    const sql = new Client({ connectionString: database.databaseUrl });
    await sql.connect();
    try {
      await seedDirtyProcurementPredecessor(sql);

      await expect(deployTestMigrations(database.databaseUrl)).rejects.toThrow(
        "Tenant integrity preflight failed for RequestForQuote.supplierId",
      );

      const catalog = await sql.query<{
        indexes: string;
        constraints: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM pg_class
           WHERE relkind = 'i' AND relname IN (
             'Product_tenantId_id_key',
             'Supplier_tenantId_id_key',
             'PurchaseOrder_tenantId_id_key',
             'PurchaseInvoice_tenantId_id_key',
             'RequestForQuote_tenantId_supplierId_idx',
             'SupplierQuotation_tenantId_supplierId_idx',
             'PurchaseOrder_tenantId_supplierId_idx',
             'PurchaseReceipt_tenantId_productId_idx',
             'PurchaseInvoice_tenantId_journalEntryId_idx',
             'SupplierPayment_tenantId_journalEntryId_idx'
           ))::text AS indexes,
          (SELECT COUNT(*) FROM pg_constraint
           WHERE conname IN (
             'RequestForQuote_tenantId_supplierId_fkey',
             'SupplierQuotation_tenantId_supplierId_fkey',
             'PurchaseOrder_tenantId_supplierId_fkey',
             'PurchaseReceipt_tenantId_purchaseOrderId_fkey',
             'PurchaseInvoice_tenantId_purchaseOrderId_fkey',
             'SupplierPayment_tenantId_purchaseInvoiceId_fkey',
             'PurchaseReceipt_tenantId_productId_fkey',
             'PurchaseInvoice_tenantId_journalEntryId_fkey',
             'SupplierPayment_tenantId_journalEntryId_fkey'
           ))::text AS constraints
      `);

      expect(catalog.rows[0]).toEqual({ indexes: "0", constraints: "0" });
    } finally {
      await sql.end();
      await database.dispose();
      databases.splice(databases.indexOf(database), 1);
    }
    await expectDatabaseAbsent(database.databaseName);
  }, 120_000);
});

async function seedValidProcurementPredecessor(sql: Client): Promise<void> {
  await sql.query(`
    INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
    VALUES ('ten_upgrade_proc', 'Procurement Upgrade', 'procurement-upgrade', NOW(), NOW());

    INSERT INTO "Product"
      ("id", "tenantId", "sku", "name", "category", "price", "currency", "stockOnHand", "createdAt", "updatedAt")
    VALUES ('prd_upgrade_proc', 'ten_upgrade_proc', 'PROC-UPGRADE', 'Upgrade Product', 'Test', 10, 'USD', 1, NOW(), NOW());

    INSERT INTO "Supplier"
      ("id", "tenantId", "code", "name", "email", "phone", "paymentTerms", "status", "createdAt", "updatedAt")
    VALUES ('sup_upgrade_proc', 'ten_upgrade_proc', 'SUP-UPGRADE', 'Upgrade Supplier', 'supplier@upgrade.test', '555-0100', 'Net 30', 'active', NOW(), NOW());

    INSERT INTO "RequestForQuote"
      ("id", "tenantId", "supplierId", "number", "status", "dueDate", "lines", "createdAt", "updatedAt")
    VALUES ('rfq_upgrade_proc', 'ten_upgrade_proc', 'sup_upgrade_proc', 'RFQ-UPGRADE', 'draft', NOW(), '[]'::jsonb, NOW(), NOW());

    INSERT INTO "SupplierQuotation"
      ("id", "tenantId", "supplierId", "number", "status", "validUntil", "total", "currency", "lines", "createdAt", "updatedAt")
    VALUES ('squo_upgrade_proc', 'ten_upgrade_proc', 'sup_upgrade_proc', 'SQUO-UPGRADE', 'draft', NOW(), 100, 'USD', '[]'::jsonb, NOW(), NOW());

    INSERT INTO "PurchaseOrder"
      ("id", "tenantId", "supplierId", "number", "status", "expectedDate", "total", "currency", "lines", "createdAt", "updatedAt")
    VALUES ('po_upgrade_proc', 'ten_upgrade_proc', 'sup_upgrade_proc', 'PO-UPGRADE', 'draft', NOW(), 100, 'USD', '[]'::jsonb, NOW(), NOW());

    INSERT INTO "JournalEntry"
      ("id", "tenantId", "number", "memo", "status", "createdAt", "updatedAt")
    VALUES ('je_upgrade_proc', 'ten_upgrade_proc', 'JE-PROC-UPGRADE', 'Procurement upgrade', 'draft', NOW(), NOW());

    INSERT INTO "PurchaseReceipt"
      ("id", "tenantId", "purchaseOrderId", "productId", "number", "status", "receivedAt", "lines", "createdAt")
    VALUES ('prec_upgrade_proc', 'ten_upgrade_proc', 'po_upgrade_proc', 'prd_upgrade_proc', 'PREC-UPGRADE', 'posted', NOW(), '[]'::jsonb, NOW());

    INSERT INTO "PurchaseInvoice"
      ("id", "tenantId", "purchaseOrderId", "journalEntryId", "number", "status", "dueDate", "total", "currency", "createdAt", "updatedAt")
    VALUES ('pinv_upgrade_proc', 'ten_upgrade_proc', 'po_upgrade_proc', 'je_upgrade_proc', 'PINV-UPGRADE', 'draft', NOW(), 100, 'USD', NOW(), NOW());

    INSERT INTO "SupplierPayment"
      ("id", "tenantId", "purchaseInvoiceId", "journalEntryId", "amount", "currency", "method", "paidAt", "createdAt")
    VALUES ('spay_upgrade_proc', 'ten_upgrade_proc', 'pinv_upgrade_proc', 'je_upgrade_proc', 100, 'USD', 'test', NOW(), NOW());
  `);
}

async function seedDirtyProcurementPredecessor(sql: Client): Promise<void> {
  await sql.query(`
    INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
    VALUES
      ('ten_dirty_proc_alpha', 'Procurement Dirty Alpha', 'proc-dirty-alpha', NOW(), NOW()),
      ('ten_dirty_proc_beta', 'Procurement Dirty Beta', 'proc-dirty-beta', NOW(), NOW());

    INSERT INTO "Supplier"
      ("id", "tenantId", "code", "name", "email", "phone", "paymentTerms", "status", "createdAt", "updatedAt")
    VALUES ('sup_dirty_proc_beta', 'ten_dirty_proc_beta', 'SUP-DIRTY', 'Dirty Supplier', 'supplier@dirty.test', '555-0100', 'Net 30', 'active', NOW(), NOW());

    INSERT INTO "RequestForQuote"
      ("id", "tenantId", "supplierId", "number", "status", "dueDate", "lines", "createdAt", "updatedAt")
    VALUES ('rfq_dirty_proc_alpha', 'ten_dirty_proc_alpha', 'sup_dirty_proc_beta', 'RFQ-DIRTY', 'draft', NOW(), '[]'::jsonb, NOW(), NOW());
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
