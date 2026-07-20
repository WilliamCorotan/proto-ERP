import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import { createPrismaClient } from "../src/index.js";
import {
  createMigratedTestDatabase,
  requireTestDatabaseUrl,
  type MigratedTestDatabase,
} from "./support/postgres.js";
import {
  integrationFixtureIds,
  seedTwoTenantFixture,
} from "./support/fixtures.js";

describe.sequential("PostgreSQL migration foundation", () => {
  let database: MigratedTestDatabase;
  let prisma: PrismaClient;

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
    prisma = createPrismaClient(database.databaseUrl);
    await prisma.$connect();
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await database?.dispose();
  }, 30_000);

  it("deploys every migration successfully to an empty database", async () => {
    const migrations = await prisma.$queryRaw<
      Array<{ total: bigint; unfinished: bigint }>
    >`SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL) AS unfinished
      FROM "_prisma_migrations"`;

    expect(Number(migrations[0]?.total)).toBeGreaterThan(0);
    expect(Number(migrations[0]?.unfinished)).toBe(0);
  });

  it("loads deterministic, reusable records for two isolated tenants", async () => {
    await seedTwoTenantFixture(prisma);

    const tenants = await prisma.tenant.findMany({
      orderBy: { id: "asc" },
      include: {
        users: { include: { roles: { include: { role: true } } } },
        customers: true,
        products: true,
        accounts: true,
        warehouses: { include: { bins: true } },
      },
    });

    expect(tenants.map((tenant) => tenant.id)).toEqual([
      integrationFixtureIds.tenants.alpha,
      integrationFixtureIds.tenants.beta,
    ]);
    expect(tenants[0]?.customers[0]?.name).toBe("Alpha Customer");
    expect(tenants[0]?.users[0]?.roles[0]?.role.permissions).toEqual([
      "sales.customer.read",
    ]);
    expect(tenants[1]?.products[0]?.stockOnHand).toBe(20);
    expect(tenants[1]?.warehouses[0]?.bins[0]?.code).toBe("MAIN-01");
  });

  it("drops the isolated database and permits idempotent cleanup", async () => {
    const databaseName = database.databaseName;
    await prisma.$disconnect();
    await database.dispose();
    await database.dispose();

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
  });
});
