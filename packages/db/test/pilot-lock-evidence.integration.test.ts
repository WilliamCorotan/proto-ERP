import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import {
  createMigratedTestDatabase,
  type MigratedTestDatabase,
} from "./support/postgres.js";

const populatedCutoff = "20260710150700_invoice_order_tenant_index";
const migrationPath = fileURLToPath(
  new URL(
    "../prisma/migrations/20260710150800_expand_quote_customer_tenant_fk/migration.sql",
    import.meta.url,
  ),
);

describe.sequential("pilot migration lock evidence", () => {
  let database: MigratedTestDatabase;
  let blocker: Client;
  let runner: Client;

  beforeAll(async () => {
    database = await createMigratedTestDatabase({ through: populatedCutoff });
    blocker = new Client({ connectionString: database.databaseUrl });
    runner = new Client({ connectionString: database.databaseUrl });
    await Promise.all([blocker.connect(), runner.connect()]);
    await seedProductionLikePilotRows(runner, 10_000);
  }, 120_000);

  afterAll(async () => {
    await blocker?.end();
    await runner?.end();
    await database?.dispose();
  }, 30_000);

  it("times out under a conflicting writer without partial catalog changes, then succeeds after release", async () => {
    const migrationSql = await readFile(migrationPath, "utf8");
    await blocker.query("BEGIN");
    await blocker.query('LOCK TABLE "Quote" IN ROW EXCLUSIVE MODE');

    const startedAt = performance.now();
    await runner.query("BEGIN");
    try {
      await expect(runner.query(migrationSql)).rejects.toMatchObject({
        code: "55P03",
      });
    } finally {
      await runner.query("ROLLBACK");
    }
    const elapsedMilliseconds = performance.now() - startedAt;

    expect(elapsedMilliseconds).toBeGreaterThanOrEqual(4_500);
    expect(elapsedMilliseconds).toBeLessThan(8_000);
    await expect(constraintState(runner)).resolves.toBeNull();

    await blocker.query("ROLLBACK");
    await runner.query("BEGIN");
    try {
      await runner.query(migrationSql);
      await runner.query("COMMIT");
    } catch (error) {
      await runner.query("ROLLBACK");
      throw error;
    }

    await expect(constraintState(runner)).resolves.toEqual({
      validated: false,
    });
    const rows = await runner.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM "Quote"',
    );
    expect(rows.rows[0]?.count).toBe("10000");
  }, 30_000);
});

async function seedProductionLikePilotRows(
  client: Client,
  rowCount: number,
): Promise<void> {
  await client.query(
    `INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
     VALUES ('ten_lock_evidence', 'Lock Evidence', 'lock-evidence', NOW(), NOW())`,
  );
  await client.query(
    `INSERT INTO "Customer"
       ("id", "tenantId", "code", "name", "status", "owner", "email", "creditLimit", "currency", "createdAt", "updatedAt")
     SELECT
       'cus_lock_' || sequence,
       'ten_lock_evidence',
       'C-' || sequence,
       'Customer ' || sequence,
       'active',
       'Evidence Owner',
       'customer-' || sequence || '@evidence.test',
       1000,
       'USD',
       NOW(),
       NOW()
     FROM generate_series(1, $1) AS sequence`,
    [rowCount],
  );
  await client.query(
    `INSERT INTO "Quote"
       ("id", "tenantId", "customerId", "number", "status", "validUntil", "total", "currency", "lines", "createdAt", "updatedAt")
     SELECT
       'quo_lock_' || sequence,
       'ten_lock_evidence',
       'cus_lock_' || sequence,
       'Q-' || sequence,
       'draft',
       NOW() + INTERVAL '30 days',
       100,
       'USD',
       '[]'::jsonb,
       NOW(),
       NOW()
     FROM generate_series(1, $1) AS sequence`,
    [rowCount],
  );
}

async function constraintState(
  client: Client,
): Promise<{ validated: boolean } | null> {
  const result = await client.query<{ validated: boolean }>(
    `SELECT convalidated AS validated
     FROM pg_constraint
     WHERE conname = 'Quote_tenantId_customerId_fkey'`,
  );
  return result.rows[0] ?? null;
}
