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

const expectedConstraints = [
  {
    name: "ExpenseClaim_tenantId_employeeId_fkey",
    childTable: "ExpenseClaim",
    parentTable: "EmployeeRecord",
    childColumns: ["tenantId", "employeeId"],
    parentColumns: ["tenantId", "id"],
    deleteAction: "c",
  },
  {
    name: "Invoice_tenantId_orderId_fkey",
    childTable: "Invoice",
    parentTable: "SalesOrder",
    childColumns: ["tenantId", "orderId"],
    parentColumns: ["tenantId", "id"],
    deleteAction: "r",
  },
  {
    name: "Quote_tenantId_customerId_fkey",
    childTable: "Quote",
    parentTable: "Customer",
    childColumns: ["tenantId", "customerId"],
    parentColumns: ["tenantId", "id"],
    deleteAction: "r",
  },
  {
    name: "SalesOrder_tenantId_quoteId_fkey",
    childTable: "SalesOrder",
    parentTable: "Quote",
    childColumns: ["tenantId", "quoteId"],
    parentColumns: ["tenantId", "id"],
    deleteAction: "r",
  },
] as const;

const expectedIndexes = [
  {
    name: "Customer_tenantId_id_key",
    table: "Customer",
    columns: ["tenantId", "id"],
    unique: true,
  },
  {
    name: "EmployeeRecord_tenantId_id_key",
    table: "EmployeeRecord",
    columns: ["tenantId", "id"],
    unique: true,
  },
  {
    name: "Invoice_tenantId_orderId_idx",
    table: "Invoice",
    columns: ["tenantId", "orderId"],
    unique: false,
  },
  {
    name: "Quote_tenantId_customerId_idx",
    table: "Quote",
    columns: ["tenantId", "customerId"],
    unique: false,
  },
  {
    name: "Quote_tenantId_id_key",
    table: "Quote",
    columns: ["tenantId", "id"],
    unique: true,
  },
  {
    name: "SalesOrder_tenantId_id_key",
    table: "SalesOrder",
    columns: ["tenantId", "id"],
    unique: true,
  },
  {
    name: "SalesOrder_tenantId_quoteId_idx",
    table: "SalesOrder",
    columns: ["tenantId", "quoteId"],
    unique: false,
  },
] as const;

describe.sequential("database-enforced tenant integrity pilot", () => {
  let database: MigratedTestDatabase;
  let prisma: PrismaClient;
  let sql: Client;

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
    prisma = createPrismaClient(database.databaseUrl);
    sql = new Client({ connectionString: database.databaseUrl });
    await Promise.all([prisma.$connect(), sql.connect()]);
    await seedTwoTenantFixture(prisma);
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await sql?.end();
    await database?.dispose();
  }, 30_000);

  it("accepts same-tenant relation connects after migration", async () => {
    const quote = await prisma.quote.create({
      data: {
        id: "quo_it_connect",
        number: "Q-IT-CONNECT",
        validUntil: new Date("2026-12-31T00:00:00.000Z"),
        total: 10,
        lines: [],
        tenant: { connect: { id: integrationFixtureIds.tenants.alpha } },
        customer: {
          connect: {
            tenantId_id: {
              tenantId: integrationFixtureIds.tenants.alpha,
              id: integrationFixtureIds.customers.alpha,
            },
          },
        },
      },
    });
    const order = await prisma.salesOrder.create({
      data: {
        id: "ord_it_connect",
        number: "SO-IT-CONNECT",
        promisedDate: new Date("2026-12-31T00:00:00.000Z"),
        total: 10,
        tenant: { connect: { id: integrationFixtureIds.tenants.alpha } },
        quote: {
          connect: {
            tenantId_id: {
              tenantId: integrationFixtureIds.tenants.alpha,
              id: quote.id,
            },
          },
        },
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        id: "inv_it_connect",
        number: "INV-IT-CONNECT",
        dueDate: new Date("2027-01-31T00:00:00.000Z"),
        total: 10,
        tenant: { connect: { id: integrationFixtureIds.tenants.alpha } },
        order: {
          connect: {
            tenantId_id: {
              tenantId: integrationFixtureIds.tenants.alpha,
              id: order.id,
            },
          },
        },
      },
      include: { order: { include: { quote: { include: { customer: true } } } } },
    });
    const expense = await prisma.expenseClaim.create({
      data: {
        id: "exp_it_connect",
        number: "EXP-IT-CONNECT",
        category: "Travel",
        description: "Checked relation create",
        amount: 10,
        submittedAt: new Date("2026-07-01T00:00:00.000Z"),
        tenant: { connect: { id: integrationFixtureIds.tenants.alpha } },
        employee: {
          connect: {
            tenantId_id: {
              tenantId: integrationFixtureIds.tenants.alpha,
              id: integrationFixtureIds.employees.alpha,
            },
          },
        },
      },
      include: { employee: true },
    });

    expect(invoice.order.quote.customer.tenantId).toBe(
      integrationFixtureIds.tenants.alpha,
    );
    expect(expense.employee.tenantId).toBe(
      integrationFixtureIds.tenants.alpha,
    );
  });

  it("rejects cross-tenant relations submitted through Prisma", async () => {
    await expect(
      prisma.quote.create({
        data: {
          id: "quo_it_cross_prisma",
          tenantId: integrationFixtureIds.tenants.alpha,
          customerId: integrationFixtureIds.customers.beta,
          number: "Q-IT-CROSS-PRISMA",
          validUntil: new Date("2026-12-31T00:00:00.000Z"),
          total: 1,
          lines: [],
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.salesOrder.create({
        data: {
          id: "ord_it_cross_prisma",
          tenantId: integrationFixtureIds.tenants.alpha,
          quoteId: integrationFixtureIds.quotes.beta,
          number: "SO-IT-CROSS-PRISMA",
          promisedDate: new Date("2026-12-31T00:00:00.000Z"),
          total: 1,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.invoice.create({
        data: {
          id: "inv_it_cross_prisma",
          tenantId: integrationFixtureIds.tenants.alpha,
          orderId: integrationFixtureIds.orders.beta,
          number: "INV-IT-CROSS-PRISMA",
          dueDate: new Date("2027-01-31T00:00:00.000Z"),
          total: 1,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.expenseClaim.create({
        data: {
          id: "exp_it_cross_prisma",
          tenantId: integrationFixtureIds.tenants.alpha,
          employeeId: integrationFixtureIds.employees.beta,
          number: "EXP-IT-CROSS-PRISMA",
          category: "Travel",
          description: "Must not cross tenants",
          amount: 1,
          submittedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("reports SQLSTATE and the violated composite constraint for raw SQL", async () => {
    await expectForeignKeyViolation(
      sql,
      `INSERT INTO "Quote"
        ("id", "tenantId", "customerId", "number", "status", "validUntil", "total", "currency", "lines", "createdAt", "updatedAt")
       VALUES ('quo_it_cross_sql', $1, $2, 'Q-IT-CROSS-SQL', 'draft', NOW(), 1, 'USD', '[]'::jsonb, NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, integrationFixtureIds.customers.beta],
      "Quote_tenantId_customerId_fkey",
    );
    await expectForeignKeyViolation(
      sql,
      `INSERT INTO "SalesOrder"
        ("id", "tenantId", "quoteId", "number", "status", "promisedDate", "total", "currency", "createdAt", "updatedAt")
       VALUES ('ord_it_cross_sql', $1, $2, 'SO-IT-CROSS-SQL', 'draft', NOW(), 1, 'USD', NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, integrationFixtureIds.quotes.beta],
      "SalesOrder_tenantId_quoteId_fkey",
    );
    await expectForeignKeyViolation(
      sql,
      `INSERT INTO "Invoice"
        ("id", "tenantId", "orderId", "number", "status", "dueDate", "total", "currency", "createdAt", "updatedAt")
       VALUES ('inv_it_cross_sql', $1, $2, 'INV-IT-CROSS-SQL', 'draft', NOW(), 1, 'USD', NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, integrationFixtureIds.orders.beta],
      "Invoice_tenantId_orderId_fkey",
    );
    await expectForeignKeyViolation(
      sql,
      `INSERT INTO "ExpenseClaim"
        ("id", "tenantId", "employeeId", "number", "status", "category", "description", "amount", "currency", "submittedAt", "createdAt", "updatedAt")
       VALUES ('exp_it_cross_sql', $1, $2, 'EXP-IT-CROSS-SQL', 'submitted', 'Travel', 'Must not cross tenants', 1, 'USD', NOW(), NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, integrationFixtureIds.employees.beta],
      "ExpenseClaim_tenantId_employeeId_fkey",
    );
  });

  it("rejects parent and child tenant reassignment without changing records", async () => {
    const customer = await prisma.customer.create({
      data: {
        id: "cus_it_reassign",
        tenantId: integrationFixtureIds.tenants.alpha,
        code: "CUST-REASSIGN",
        name: "Reassignment Customer",
        owner: "Test",
        email: "reassign-customer@alpha.test",
        creditLimit: 1,
      },
    });
    const quote = await prisma.quote.create({
      data: {
        id: "quo_it_reassign",
        tenantId: integrationFixtureIds.tenants.alpha,
        customerId: customer.id,
        number: "Q-IT-REASSIGN",
        validUntil: new Date("2026-12-31T00:00:00.000Z"),
        total: 1,
        lines: [],
      },
    });
    const employee = await prisma.employeeRecord.create({
      data: {
        id: "emp_it_reassign",
        tenantId: integrationFixtureIds.tenants.alpha,
        employeeNumber: "EMP-REASSIGN",
        name: "Reassignment Employee",
        department: "Test",
        role: "Test",
      },
    });
    const expense = await prisma.expenseClaim.create({
      data: {
        id: "exp_it_reassign",
        tenantId: integrationFixtureIds.tenants.alpha,
        employeeId: employee.id,
        number: "EXP-IT-REASSIGN",
        category: "Test",
        description: "Reassignment test",
        amount: 1,
        submittedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    });

    await expectForeignKeyViolation(
      sql,
      'UPDATE "Customer" SET "tenantId" = $1 WHERE "id" = $2',
      [integrationFixtureIds.tenants.beta, customer.id],
      "Quote_tenantId_customerId_fkey",
      "23001",
    );
    await expectForeignKeyViolation(
      sql,
      'UPDATE "Quote" SET "tenantId" = $1 WHERE "id" = $2',
      [integrationFixtureIds.tenants.beta, quote.id],
      "Quote_tenantId_customerId_fkey",
    );
    await expectForeignKeyViolation(
      sql,
      'UPDATE "EmployeeRecord" SET "tenantId" = $1 WHERE "id" = $2',
      [integrationFixtureIds.tenants.beta, employee.id],
      "ExpenseClaim_tenantId_employeeId_fkey",
      "23001",
    );
    await expectForeignKeyViolation(
      sql,
      'UPDATE "ExpenseClaim" SET "tenantId" = $1 WHERE "id" = $2',
      [integrationFixtureIds.tenants.beta, expense.id],
      "ExpenseClaim_tenantId_employeeId_fkey",
    );

    const [storedCustomer, storedQuote, storedEmployee, storedExpense] = await Promise.all([
      prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
      }),
      prisma.quote.findUniqueOrThrow({
        where: { id: quote.id },
      }),
      prisma.employeeRecord.findUniqueOrThrow({
        where: { id: employee.id },
      }),
      prisma.expenseClaim.findUniqueOrThrow({
        where: { id: expense.id },
      }),
    ]);
    expect([
      storedCustomer.tenantId,
      storedQuote.tenantId,
      storedEmployee.tenantId,
      storedExpense.tenantId,
    ]).toEqual([
      integrationFixtureIds.tenants.alpha,
      integrationFixtureIds.tenants.alpha,
      integrationFixtureIds.tenants.alpha,
      integrationFixtureIds.tenants.alpha,
    ]);
  });

  it("preserves expense-claim cascade deletion", async () => {
    const employee = await prisma.employeeRecord.create({
      data: {
        id: "emp_it_delete",
        tenantId: integrationFixtureIds.tenants.alpha,
        employeeNumber: "EMP-DELETE",
        name: "Delete Test Employee",
        department: "Test",
        role: "Test",
      },
    });
    await prisma.expenseClaim.create({
      data: {
        id: "exp_it_delete",
        tenantId: integrationFixtureIds.tenants.alpha,
        employeeId: employee.id,
        number: "EXP-IT-DELETE",
        category: "Test",
        description: "Cascade test",
        amount: 1,
        submittedAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    });

    await prisma.employeeRecord.delete({ where: { id: employee.id } });

    await expect(
      prisma.expenseClaim.findUnique({ where: { id: "exp_it_delete" } }),
    ).resolves.toBeNull();
  });

  it("installs the complete validated contract and retains rollback FKs", async () => {
    const constraints = await prisma.$queryRaw<
      Array<{
        name: string;
        child_table: string;
        parent_table: string;
        child_columns: string[];
        parent_columns: string[];
        validated: boolean;
        delete_action: string;
        update_action: string;
      }>
    >`
      SELECT constraint_record.conname AS name,
             child_table.relname AS child_table,
             parent_table.relname AS parent_table,
             constraint_record.convalidated AS validated,
             constraint_record.confdeltype::text AS delete_action,
             constraint_record.confupdtype::text AS update_action,
             ARRAY(
               SELECT attribute.attname
               FROM UNNEST(constraint_record.conkey)
                 WITH ORDINALITY AS key_column(attnum, ordinality)
               JOIN pg_attribute attribute
                 ON attribute.attrelid = constraint_record.conrelid
                AND attribute.attnum = key_column.attnum
               ORDER BY key_column.ordinality
             )::text[] AS child_columns,
             ARRAY(
               SELECT attribute.attname
               FROM UNNEST(constraint_record.confkey)
                 WITH ORDINALITY AS key_column(attnum, ordinality)
               JOIN pg_attribute attribute
                 ON attribute.attrelid = constraint_record.confrelid
                AND attribute.attnum = key_column.attnum
               ORDER BY key_column.ordinality
             )::text[] AS parent_columns
      FROM pg_constraint constraint_record
      JOIN pg_class child_table ON child_table.oid = constraint_record.conrelid
      JOIN pg_class parent_table ON parent_table.oid = constraint_record.confrelid
      WHERE constraint_record.conname IN (
        'Quote_tenantId_customerId_fkey',
        'SalesOrder_tenantId_quoteId_fkey',
        'Invoice_tenantId_orderId_fkey',
        'ExpenseClaim_tenantId_employeeId_fkey'
      )
      ORDER BY constraint_record.conname
    `;
    const indexes = await prisma.$queryRaw<
      Array<{
        name: string;
        table_name: string;
        columns: string[];
        valid: boolean;
        ready: boolean;
        unique_index: boolean;
      }>
    >`
      SELECT index_table.relname AS name,
             parent_table.relname AS table_name,
             index_record.indisvalid AS valid,
             index_record.indisready AS ready,
             index_record.indisunique AS unique_index,
             ARRAY(
               SELECT attribute.attname
               FROM UNNEST(index_record.indkey::smallint[])
                 WITH ORDINALITY AS key_column(attnum, ordinality)
               JOIN pg_attribute attribute
                 ON attribute.attrelid = index_record.indrelid
                AND attribute.attnum = key_column.attnum
               WHERE key_column.attnum > 0
               ORDER BY key_column.ordinality
             )::text[] AS columns
      FROM pg_index index_record
      JOIN pg_class index_table ON index_table.oid = index_record.indexrelid
      JOIN pg_class parent_table ON parent_table.oid = index_record.indrelid
      WHERE index_table.relname IN (
        'Customer_tenantId_id_key',
        'EmployeeRecord_tenantId_id_key',
        'Invoice_tenantId_orderId_idx',
        'Quote_tenantId_customerId_idx',
        'Quote_tenantId_id_key',
        'SalesOrder_tenantId_id_key',
        'SalesOrder_tenantId_quoteId_idx'
      )
      ORDER BY index_table.relname
    `;
    const legacyConstraints = await prisma.$queryRaw<
      Array<{ name: string; validated: boolean }>
    >`
      SELECT conname AS name, convalidated AS validated
      FROM pg_constraint
      WHERE conname IN (
        'Quote_customerId_fkey',
        'SalesOrder_quoteId_fkey',
        'Invoice_orderId_fkey',
        'ExpenseClaim_employeeId_fkey'
      )
      ORDER BY conname
    `;

    expect(constraints).toEqual(
      expectedConstraints.map((constraint) => ({
        name: constraint.name,
        child_table: constraint.childTable,
        parent_table: constraint.parentTable,
        child_columns: [...constraint.childColumns],
        parent_columns: [...constraint.parentColumns],
        validated: true,
        delete_action: constraint.deleteAction,
        update_action: "r",
      })),
    );
    expect(indexes).toEqual(
      expectedIndexes.map((index) => ({
        name: index.name,
        table_name: index.table,
        columns: [...index.columns],
        valid: true,
        ready: true,
        unique_index: index.unique,
      })),
    );
    expect(legacyConstraints).toHaveLength(4);
    expect(legacyConstraints.every((constraint) => constraint.validated)).toBe(
      true,
    );
  });
});

async function expectForeignKeyViolation(
  client: Client,
  query: string,
  values: string[],
  constraint: string,
  expectedCode = "23503",
): Promise<void> {
  try {
    await client.query(query, values);
    throw new Error(`Expected foreign-key violation from ${constraint}.`);
  } catch (error) {
    const databaseError = error as {
      code?: string;
      constraint?: string;
      message?: string;
    };
    expect(databaseError.code).toBe(expectedCode);
    expect(databaseError.constraint).toBe(constraint);
    expect(databaseError.message).not.toContain(values[0] ?? "");
  }
}
