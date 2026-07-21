import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import { createPrismaClient } from "../src/index.js";
import {
  createMigratedTestDatabase,
  type MigratedTestDatabase,
} from "./support/postgres.js";
import {
  integrationFixtureIds,
  seedTwoTenantFixture,
} from "./support/fixtures.js";

const ids = {
  suppliers: { alpha: "sup_proc_alpha", beta: "sup_proc_beta" },
  rfqs: { alpha: "rfq_proc_alpha", beta: "rfq_proc_beta" },
  quotations: { alpha: "squo_proc_alpha", beta: "squo_proc_beta" },
  orders: { alpha: "po_proc_alpha", beta: "po_proc_beta" },
  receipts: { alpha: "prec_proc_alpha", beta: "prec_proc_beta" },
  invoices: { alpha: "pinv_proc_alpha", beta: "pinv_proc_beta" },
  payments: { alpha: "spay_proc_alpha", beta: "spay_proc_beta" },
  journals: { alpha: "je_proc_alpha", beta: "je_proc_beta" },
} as const;

describe.sequential("procurement tenant integrity", () => {
  let database: MigratedTestDatabase;
  let prisma: PrismaClient;
  let sql: Client;

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
    prisma = createPrismaClient(database.databaseUrl);
    sql = new Client({ connectionString: database.databaseUrl });
    await Promise.all([prisma.$connect(), sql.connect()]);
    await seedTwoTenantFixture(prisma);
    await seedProcurementFixture(prisma);
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await sql?.end();
    await database?.dispose();
  }, 30_000);

  it("accepts a complete same-tenant procurement chain", async () => {
    await expect(
      prisma.supplierPayment.findUniqueOrThrow({
        where: { id: ids.payments.alpha },
        include: {
          purchaseInvoice: { include: { purchaseOrder: true } },
          journalEntry: true,
        },
      }),
    ).resolves.toMatchObject({
      tenantId: integrationFixtureIds.tenants.alpha,
      purchaseInvoice: {
        tenantId: integrationFixtureIds.tenants.alpha,
        purchaseOrder: { tenantId: integrationFixtureIds.tenants.alpha },
      },
      journalEntry: { tenantId: integrationFixtureIds.tenants.alpha },
    });
  });

  it("rejects all nine cross-tenant relations through Prisma", async () => {
    const alpha = integrationFixtureIds.tenants.alpha;
    const betaProduct = integrationFixtureIds.products.beta;
    const cases = [
      () =>
        prisma.requestForQuote.update({
          where: { id: ids.rfqs.alpha },
          data: { supplierId: ids.suppliers.beta },
        }),
      () =>
        prisma.supplierQuotation.update({
          where: { id: ids.quotations.alpha },
          data: { supplierId: ids.suppliers.beta },
        }),
      () =>
        prisma.purchaseOrder.update({
          where: { id: ids.orders.alpha },
          data: { supplierId: ids.suppliers.beta },
        }),
      () =>
        prisma.purchaseReceipt.update({
          where: { id: ids.receipts.alpha },
          data: { purchaseOrderId: ids.orders.beta },
        }),
      () =>
        prisma.purchaseInvoice.update({
          where: { id: ids.invoices.alpha },
          data: { purchaseOrderId: ids.orders.beta },
        }),
      () =>
        prisma.supplierPayment.update({
          where: { id: ids.payments.alpha },
          data: { purchaseInvoiceId: ids.invoices.beta },
        }),
      () =>
        prisma.purchaseReceipt.update({
          where: { id: ids.receipts.alpha },
          data: { productId: betaProduct },
        }),
      () =>
        prisma.purchaseInvoice.update({
          where: { id: ids.invoices.alpha },
          data: { journalEntryId: ids.journals.beta },
        }),
      () =>
        prisma.supplierPayment.update({
          where: { id: ids.payments.alpha },
          data: { journalEntryId: ids.journals.beta },
        }),
    ];

    for (const operation of cases) {
      await expect(operation()).rejects.toMatchObject({ code: "P2003" });
    }
    await expect(
      prisma.purchaseOrder.findUniqueOrThrow({
        where: { id: ids.orders.alpha },
      }),
    ).resolves.toMatchObject({
      tenantId: alpha,
      supplierId: ids.suppliers.alpha,
    });
  });

  it("reports every composite constraint for raw SQL cross-tenant writes", async () => {
    const cases: Array<[string, string, string, string]> = [
      ["RequestForQuote", "supplierId", ids.rfqs.alpha, ids.suppliers.beta],
      [
        "SupplierQuotation",
        "supplierId",
        ids.quotations.alpha,
        ids.suppliers.beta,
      ],
      ["PurchaseOrder", "supplierId", ids.orders.alpha, ids.suppliers.beta],
      [
        "PurchaseReceipt",
        "purchaseOrderId",
        ids.receipts.alpha,
        ids.orders.beta,
      ],
      [
        "PurchaseInvoice",
        "purchaseOrderId",
        ids.invoices.alpha,
        ids.orders.beta,
      ],
      [
        "SupplierPayment",
        "purchaseInvoiceId",
        ids.payments.alpha,
        ids.invoices.beta,
      ],
      [
        "PurchaseReceipt",
        "productId",
        ids.receipts.alpha,
        integrationFixtureIds.products.beta,
      ],
      [
        "PurchaseInvoice",
        "journalEntryId",
        ids.invoices.alpha,
        ids.journals.beta,
      ],
      [
        "SupplierPayment",
        "journalEntryId",
        ids.payments.alpha,
        ids.journals.beta,
      ],
    ];

    for (const [table, field, recordId, parentId] of cases) {
      await expectConstraint(
        sql,
        `UPDATE "${table}" SET "${field}" = $1 WHERE "id" = $2`,
        [parentId, recordId],
        `${table}_tenantId_${field}_fkey`,
      );
    }
  });

  it("preserves tenant ownership when nullable parents are deleted", async () => {
    const tenantId = integrationFixtureIds.tenants.alpha;
    await prisma.product.create({
      data: {
        id: "prd_proc_delete",
        tenantId,
        sku: "PROC-DELETE",
        name: "Delete product",
        category: "Test",
        price: 1,
      },
    });
    await prisma.journalEntry.createMany({
      data: [
        {
          id: "je_proc_delete_invoice",
          tenantId,
          number: "JE-PROC-DELETE-INV",
          memo: "Invoice delete behavior",
        },
        {
          id: "je_proc_delete_payment",
          tenantId,
          number: "JE-PROC-DELETE-PAY",
          memo: "Payment delete behavior",
        },
      ],
    });
    await prisma.purchaseReceipt.update({
      where: { id: ids.receipts.alpha },
      data: { productId: "prd_proc_delete" },
    });
    await prisma.purchaseInvoice.update({
      where: { id: ids.invoices.alpha },
      data: { journalEntryId: "je_proc_delete_invoice" },
    });
    await prisma.supplierPayment.update({
      where: { id: ids.payments.alpha },
      data: { journalEntryId: "je_proc_delete_payment" },
    });

    await prisma.product.delete({ where: { id: "prd_proc_delete" } });
    await prisma.journalEntry.deleteMany({
      where: {
        id: { in: ["je_proc_delete_invoice", "je_proc_delete_payment"] },
      },
    });

    await expect(
      prisma.purchaseReceipt.findUniqueOrThrow({
        where: { id: ids.receipts.alpha },
      }),
    ).resolves.toMatchObject({ tenantId, productId: null });
    await expect(
      prisma.purchaseInvoice.findUniqueOrThrow({
        where: { id: ids.invoices.alpha },
      }),
    ).resolves.toMatchObject({ tenantId, journalEntryId: null });
    await expect(
      prisma.supplierPayment.findUniqueOrThrow({
        where: { id: ids.payments.alpha },
      }),
    ).resolves.toMatchObject({ tenantId, journalEntryId: null });
  });

  it("installs nine validated constraints with preserved delete actions", async () => {
    const constraints = await prisma.$queryRaw<
      Array<{
        name: string;
        validated: boolean;
        delete_action: string;
        update_action: string;
      }>
    >`
      SELECT conname AS name,
             convalidated AS validated,
             confdeltype::text AS delete_action,
             confupdtype::text AS update_action
      FROM pg_constraint
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
      )
      ORDER BY conname
    `;
    expect(constraints).toEqual([
      constraintCatalog("PurchaseInvoice_tenantId_journalEntryId_fkey", "n"),
      constraintCatalog("PurchaseInvoice_tenantId_purchaseOrderId_fkey", "r"),
      constraintCatalog("PurchaseOrder_tenantId_supplierId_fkey", "r"),
      constraintCatalog("PurchaseReceipt_tenantId_productId_fkey", "n"),
      constraintCatalog("PurchaseReceipt_tenantId_purchaseOrderId_fkey", "r"),
      constraintCatalog("RequestForQuote_tenantId_supplierId_fkey", "r"),
      constraintCatalog("SupplierPayment_tenantId_journalEntryId_fkey", "n"),
      constraintCatalog("SupplierPayment_tenantId_purchaseInvoiceId_fkey", "r"),
      constraintCatalog("SupplierQuotation_tenantId_supplierId_fkey", "r"),
    ]);
  });

  it("installs all required parent and child indexes", async () => {
    const expected = [
      "Product_tenantId_id_key",
      "PurchaseInvoice_tenantId_id_key",
      "PurchaseInvoice_tenantId_journalEntryId_idx",
      "PurchaseOrder_tenantId_id_key",
      "PurchaseOrder_tenantId_supplierId_idx",
      "PurchaseReceipt_tenantId_productId_idx",
      "RequestForQuote_tenantId_supplierId_idx",
      "SupplierPayment_tenantId_journalEntryId_idx",
      "SupplierQuotation_tenantId_supplierId_idx",
      "Supplier_tenantId_id_key",
    ].sort();
    const indexes = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT indexname AS name
      FROM pg_indexes
      WHERE indexname IN (
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
      )
      ORDER BY indexname
    `;
    expect(indexes.map(({ name }) => name)).toEqual(expected);
  });
});

async function seedProcurementFixture(prisma: PrismaClient): Promise<void> {
  for (const key of ["alpha", "beta"] as const) {
    const tenantId = integrationFixtureIds.tenants[key];
    await prisma.supplier.create({
      data: {
        id: ids.suppliers[key],
        tenantId,
        code: `SUP-${key}`,
        name: `${key} supplier`,
        email: `${key}@supplier.test`,
        phone: "555-0100",
        paymentTerms: "Net 30",
      },
    });
    await prisma.requestForQuote.create({
      data: {
        id: ids.rfqs[key],
        tenantId,
        supplierId: ids.suppliers[key],
        number: `RFQ-${key}`,
        dueDate: new Date("2026-08-01T00:00:00.000Z"),
        lines: [],
      },
    });
    await prisma.supplierQuotation.create({
      data: {
        id: ids.quotations[key],
        tenantId,
        supplierId: ids.suppliers[key],
        number: `SQUO-${key}`,
        validUntil: new Date("2026-08-15T00:00:00.000Z"),
        total: 100,
        lines: [],
      },
    });
    await prisma.purchaseOrder.create({
      data: {
        id: ids.orders[key],
        tenantId,
        supplierId: ids.suppliers[key],
        number: `PO-${key}`,
        expectedDate: new Date("2026-08-20T00:00:00.000Z"),
        total: 100,
        lines: [],
      },
    });
    await prisma.journalEntry.create({
      data: {
        id: ids.journals[key],
        tenantId,
        number: `JE-PROC-${key}`,
        memo: `${key} procurement journal`,
      },
    });
    await prisma.purchaseReceipt.create({
      data: {
        id: ids.receipts[key],
        tenantId,
        purchaseOrderId: ids.orders[key],
        productId: integrationFixtureIds.products[key],
        number: `PREC-${key}`,
        receivedAt: new Date("2026-08-20T00:00:00.000Z"),
        lines: [],
      },
    });
    await prisma.purchaseInvoice.create({
      data: {
        id: ids.invoices[key],
        tenantId,
        purchaseOrderId: ids.orders[key],
        journalEntryId: ids.journals[key],
        number: `PINV-${key}`,
        dueDate: new Date("2026-09-20T00:00:00.000Z"),
        total: 100,
      },
    });
    await prisma.supplierPayment.create({
      data: {
        id: ids.payments[key],
        tenantId,
        purchaseInvoiceId: ids.invoices[key],
        journalEntryId: ids.journals[key],
        amount: 100,
        method: "test",
        paidAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    });
  }
}

async function expectConstraint(
  client: Client,
  query: string,
  values: string[],
  constraint: string,
) {
  try {
    await client.query(query, values);
    throw new Error(`Expected foreign-key violation from ${constraint}.`);
  } catch (error) {
    const databaseError = error as { code?: string; constraint?: string };
    expect(databaseError.code).toBe("23503");
    expect(databaseError.constraint).toBe(constraint);
  }
}

function constraintCatalog(name: string, deleteAction: string) {
  return {
    name,
    validated: true,
    delete_action: deleteAction,
    update_action: "r",
  };
}
