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

describe.sequential("identity and finance tenant integrity", () => {
  let database: MigratedTestDatabase;
  let prisma: PrismaClient;
  let sql: Client;
  const journals = { alpha: "je_it_alpha", beta: "je_it_beta" };

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
    prisma = createPrismaClient(database.databaseUrl);
    sql = new Client({ connectionString: database.databaseUrl });
    await Promise.all([prisma.$connect(), sql.connect()]);
    await seedTwoTenantFixture(prisma);
    await prisma.journalEntry.createMany({
      data: [
        {
          id: journals.alpha,
          tenantId: integrationFixtureIds.tenants.alpha,
          number: "JE-IT-ALPHA",
          memo: "Alpha journal",
        },
        {
          id: journals.beta,
          tenantId: integrationFixtureIds.tenants.beta,
          number: "JE-IT-BETA",
          memo: "Beta journal",
        },
      ],
    });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await sql?.end();
    await database?.dispose();
  }, 30_000);

  it("accepts same-tenant identity and finance relations", async () => {
    await expect(
      prisma.journalLine.create({
        data: {
          id: "jl_it_same",
          tenantId: integrationFixtureIds.tenants.alpha,
          entryId: journals.alpha,
          accountId: integrationFixtureIds.accounts.alpha,
          description: "Same tenant",
          debit: 1,
        },
      }),
    ).resolves.toMatchObject({ tenantId: integrationFixtureIds.tenants.alpha });

    await expect(
      prisma.payment.create({
        data: {
          id: "pay_it_same",
          tenantId: integrationFixtureIds.tenants.alpha,
          invoiceId: integrationFixtureIds.invoices.alpha,
          journalEntryId: journals.alpha,
          amount: 1,
          method: "test",
          receivedAt: new Date("2026-07-21T00:00:00.000Z"),
        },
      }),
    ).resolves.toMatchObject({ tenantId: integrationFixtureIds.tenants.alpha });
  });

  it("rejects cross-tenant relations submitted through Prisma", async () => {
    await expect(
      prisma.userRole.create({
        data: {
          tenantId: integrationFixtureIds.tenants.beta,
          userId: integrationFixtureIds.users.alpha,
          roleId: integrationFixtureIds.roles.beta,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.userRole.create({
        data: {
          tenantId: integrationFixtureIds.tenants.alpha,
          userId: integrationFixtureIds.users.alpha,
          roleId: integrationFixtureIds.roles.beta,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.journalLine.create({
        data: {
          tenantId: integrationFixtureIds.tenants.alpha,
          entryId: journals.beta,
          accountId: integrationFixtureIds.accounts.alpha,
          description: "Cross tenant entry",
          debit: 1,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.journalLine.create({
        data: {
          tenantId: integrationFixtureIds.tenants.alpha,
          entryId: journals.alpha,
          accountId: integrationFixtureIds.accounts.beta,
          description: "Cross tenant",
          debit: 1,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.payment.create({
        data: {
          tenantId: integrationFixtureIds.tenants.alpha,
          invoiceId: integrationFixtureIds.invoices.beta,
          journalEntryId: journals.alpha,
          amount: 1,
          method: "test",
          receivedAt: new Date("2026-07-21T00:00:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.payment.create({
        data: {
          tenantId: integrationFixtureIds.tenants.alpha,
          invoiceId: integrationFixtureIds.invoices.alpha,
          journalEntryId: journals.beta,
          amount: 1,
          method: "test",
          receivedAt: new Date("2026-07-21T00:00:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("reports the violated composite constraint for raw SQL", async () => {
    await expectConstraint(
      sql,
      `INSERT INTO "UserRole" ("tenantId", "userId", "roleId") VALUES ($1, $2, $3)`,
      [
        integrationFixtureIds.tenants.alpha,
        integrationFixtureIds.users.alpha,
        integrationFixtureIds.roles.beta,
      ],
      "UserRole_tenantId_roleId_fkey",
    );
    await expectConstraint(
      sql,
      `INSERT INTO "JournalLine" ("id", "tenantId", "entryId", "accountId", "description", "debit", "credit", "createdAt")
       VALUES ('jl_it_cross_sql', $1, $2, $3, 'Cross tenant', 1, 0, NOW())`,
      [
        integrationFixtureIds.tenants.alpha,
        journals.alpha,
        integrationFixtureIds.accounts.beta,
      ],
      "JournalLine_tenantId_accountId_fkey",
    );
    await expectConstraint(
      sql,
      `INSERT INTO "Payment" ("id", "tenantId", "invoiceId", "journalEntryId", "amount", "currency", "method", "receivedAt", "createdAt")
       VALUES ('pay_it_cross_sql', $1, $2, $3, 1, 'USD', 'test', NOW(), NOW())`,
      [
        integrationFixtureIds.tenants.alpha,
        integrationFixtureIds.invoices.alpha,
        journals.beta,
      ],
      "Payment_tenantId_journalEntryId_fkey",
    );
  });

  it("preserves nullable journal deletion while retaining payment tenant ownership", async () => {
    const journal = await prisma.journalEntry.create({
      data: {
        id: "je_it_delete",
        tenantId: integrationFixtureIds.tenants.alpha,
        number: "JE-IT-DELETE",
        memo: "Delete test",
      },
    });
    const payment = await prisma.payment.create({
      data: {
        id: "pay_it_delete",
        tenantId: integrationFixtureIds.tenants.alpha,
        invoiceId: integrationFixtureIds.invoices.alpha,
        journalEntryId: journal.id,
        amount: 1,
        method: "test",
        receivedAt: new Date("2026-07-21T00:00:00.000Z"),
      },
    });

    await prisma.journalEntry.delete({ where: { id: journal.id } });

    await expect(
      prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }),
    ).resolves.toMatchObject({
      tenantId: integrationFixtureIds.tenants.alpha,
      journalEntryId: null,
    });
  });

  it("installs six validated tenant constraints with restrictive ownership updates", async () => {
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
        'UserRole_tenantId_userId_fkey',
        'UserRole_tenantId_roleId_fkey',
        'JournalLine_tenantId_entryId_fkey',
        'JournalLine_tenantId_accountId_fkey',
        'Payment_tenantId_invoiceId_fkey',
        'Payment_tenantId_journalEntryId_fkey'
      )
      ORDER BY conname
    `;

    expect(constraints).toEqual([
      {
        name: "JournalLine_tenantId_accountId_fkey",
        validated: true,
        delete_action: "r",
        update_action: "r",
      },
      {
        name: "JournalLine_tenantId_entryId_fkey",
        validated: true,
        delete_action: "c",
        update_action: "r",
      },
      {
        name: "Payment_tenantId_invoiceId_fkey",
        validated: true,
        delete_action: "r",
        update_action: "r",
      },
      {
        name: "Payment_tenantId_journalEntryId_fkey",
        validated: true,
        delete_action: "n",
        update_action: "r",
      },
      {
        name: "UserRole_tenantId_roleId_fkey",
        validated: true,
        delete_action: "c",
        update_action: "r",
      },
      {
        name: "UserRole_tenantId_userId_fkey",
        validated: true,
        delete_action: "c",
        update_action: "r",
      },
    ]);
  });
});

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
