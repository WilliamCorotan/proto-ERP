import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createMigratedTestDatabase,
  type MigratedTestDatabase,
} from "./support/postgres.js";

const execFileAsync = promisify(execFile);
const packageRoot = new URL("../", import.meta.url).pathname;

const acknowledgedRollbackWindowDrift = [
  'ALTER TABLE "ExpenseClaim" DROP CONSTRAINT "ExpenseClaim_employeeId_fkey";',
  'ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderId_fkey";',
  'ALTER TABLE "JournalLine" DROP CONSTRAINT "JournalLine_accountId_fkey";',
  'ALTER TABLE "JournalLine" DROP CONSTRAINT "JournalLine_entryId_fkey";',
  'ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";',
  'ALTER TABLE "Payment" DROP CONSTRAINT "Payment_journalEntryId_fkey";',
  'ALTER TABLE "PurchaseInvoice" DROP CONSTRAINT "PurchaseInvoice_journalEntryId_fkey";',
  'ALTER TABLE "PurchaseInvoice" DROP CONSTRAINT "PurchaseInvoice_purchaseOrderId_fkey";',
  'ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_supplierId_fkey";',
  'ALTER TABLE "PurchaseReceipt" DROP CONSTRAINT "PurchaseReceipt_productId_fkey";',
  'ALTER TABLE "PurchaseReceipt" DROP CONSTRAINT "PurchaseReceipt_purchaseOrderId_fkey";',
  'ALTER TABLE "Quote" DROP CONSTRAINT "Quote_customerId_fkey";',
  'ALTER TABLE "RequestForQuote" DROP CONSTRAINT "RequestForQuote_supplierId_fkey";',
  'ALTER TABLE "SalesOrder" DROP CONSTRAINT "SalesOrder_quoteId_fkey";',
  'ALTER TABLE "SupplierPayment" DROP CONSTRAINT "SupplierPayment_journalEntryId_fkey";',
  'ALTER TABLE "SupplierPayment" DROP CONSTRAINT "SupplierPayment_purchaseInvoiceId_fkey";',
  'ALTER TABLE "SupplierQuotation" DROP CONSTRAINT "SupplierQuotation_supplierId_fkey";',
  'ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";',
  'ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";',
  'ALTER INDEX "WorkflowAssignmentRule_tenantId_workflowId_fromState_toState_ac" RENAME TO "WorkflowAssignmentRule_tenantId_workflowId_fromState_toStat_idx";',
  'ALTER INDEX "WorkflowAssignmentRule_tenantId_workflowId_fromState_toState_ro" RENAME TO "WorkflowAssignmentRule_tenantId_workflowId_fromState_toStat_key";',
  'ALTER INDEX "WorkflowEscalationRule_tenantId_workflowId_fromState_toState_ac" RENAME TO "WorkflowEscalationRule_tenantId_workflowId_fromState_toStat_idx";',
  'ALTER INDEX "WorkflowEscalationRule_tenantId_workflowId_fromState_toState_ta" RENAME TO "WorkflowEscalationRule_tenantId_workflowId_fromState_toStat_key";',
];

describe.sequential("Prisma schema drift", () => {
  let database: MigratedTestDatabase;

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await database?.dispose();
  }, 30_000);

  it("rejects drift beyond the explicit rollback-window allowlist", async () => {
    const { stdout } = await execFileAsync(
      "pnpm",
      [
        "exec",
        "prisma",
        "migrate",
        "diff",
        "--from-config-datasource",
        "--to-schema",
        "prisma/schema.prisma",
        "--script",
        "--config",
        "prisma.config.ts",
      ],
      {
        cwd: packageRoot,
        env: { ...process.env, DATABASE_URL: database.databaseUrl },
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    expect(executableStatements(stdout)).toEqual(
      acknowledgedRollbackWindowDrift,
    );
  }, 30_000);
});

function executableStatements(script: string): string[] {
  return script
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith(";"));
}
