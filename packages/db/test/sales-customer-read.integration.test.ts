import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { ListSalesCustomersUseCase } from "@erp/sales";
import {
  createPrismaClient,
  PrismaSalesCustomerReadAdapter,
} from "../src/index.js";
import {
  createMigratedTestDatabase,
  type MigratedTestDatabase,
} from "./support/postgres.js";
import {
  integrationFixtureIds,
  seedTwoTenantFixture,
} from "./support/fixtures.js";

describe.sequential("paginated sales customer read adapter", () => {
  let database: MigratedTestDatabase;
  let prisma: PrismaClient;
  let useCase: ListSalesCustomersUseCase;

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
    prisma = createPrismaClient(database.databaseUrl);
    await prisma.$connect();
    await seedTwoTenantFixture(prisma);
    await prisma.customer.createMany({
      data: Array.from({ length: 105 }, (_, index) => ({
        id: `cus_page_${String(index).padStart(3, "0")}`,
        tenantId: integrationFixtureIds.tenants.alpha,
        code: `PAGE-${String(index).padStart(3, "0")}`,
        name:
          index % 2 === 0
            ? `North Customer ${index}`
            : `South Customer ${index}`,
        status: index % 3 === 0 ? ("paused" as const) : ("active" as const),
        owner: "Pagination Owner",
        email: `page-${index}@alpha.test`,
        creditLimit: index,
      })),
    });
    useCase = new ListSalesCustomersUseCase(
      new PrismaSalesCustomerReadAdapter(prisma),
    );
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await database?.dispose();
  }, 30_000);

  it("returns stable bounded pages without overlap", async () => {
    const first = await useCase.execute(integrationFixtureIds.tenants.alpha, {
      limit: 40,
    });
    const second = await useCase.execute(integrationFixtureIds.tenants.alpha, {
      after: first.pageInfo.endCursor ?? undefined,
      limit: 40,
    });

    expect(first.items).toHaveLength(40);
    expect(first.pageInfo).toMatchObject({ hasNextPage: true, limit: 40 });
    expect(second.items).toHaveLength(40);
    const firstIds = first.items.map((customer) => customer.id);
    const secondIds = second.items.map((customer) => customer.id);
    const firstIdSet = new Set(firstIds);
    expect(firstIds).toEqual([...firstIds].sort());
    expect(secondIds).toEqual([...secondIds].sort());
    expect(secondIds.filter((id) => firstIdSet.has(id))).toEqual([]);
    expect(
      [...first.items, ...second.items].every((customer) =>
        customer.email.endsWith("@alpha.test"),
      ),
    ).toBe(true);
  });

  it("applies tenant, status, and case-insensitive search filters", async () => {
    const page = await useCase.execute(integrationFixtureIds.tenants.alpha, {
      limit: 100,
      search: "NORTH",
      status: "paused",
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(
      page.items.every(
        (customer) =>
          customer.status === "paused" && customer.name.startsWith("North"),
      ),
    ).toBe(true);
  });

  it("rejects a cursor owned by another tenant", async () => {
    await expect(
      useCase.execute(integrationFixtureIds.tenants.alpha, {
        after: integrationFixtureIds.customers.beta,
        limit: 10,
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: "INVALID_CURSOR",
      }),
    );
  });
});
