import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { Client } from "pg";
import {
  PrismaOutboxDispatchPort,
  type WebhookSecretResolver,
  type WebhookTransportPort,
} from "../../../apps/worker/src/outbox-dispatcher.js";
import type { WebhookTransportResult } from "../../../apps/worker/src/webhook-transport.js";
import { PrismaErpRepository } from "../../../apps/api/src/repository.js";
import { createPrismaClient } from "../src/index.js";
import {
  createMigratedTestDatabase,
  type MigratedTestDatabase,
} from "./support/postgres.js";
import {
  integrationFixtureIds,
  seedTwoTenantFixture,
} from "./support/fixtures.js";

describe.sequential("durable webhook delivery", () => {
  let database: MigratedTestDatabase;
  let prisma: PrismaClient;
  let sql: Client;
  const subscriptions = { alpha: "whsub_it_alpha", beta: "whsub_it_beta" };
  const outbox = { alpha: "out_it_alpha", beta: "out_it_beta" };

  beforeAll(async () => {
    database = await createMigratedTestDatabase();
    prisma = createPrismaClient(database.databaseUrl);
    sql = new Client({ connectionString: database.databaseUrl });
    await Promise.all([prisma.$connect(), sql.connect()]);
    await seedTwoTenantFixture(prisma);
    await prisma.webhookSubscription.createMany({
      data: [
        subscriptionData(
          subscriptions.alpha,
          integrationFixtureIds.tenants.alpha,
          ["test.integrity"],
        ),
        subscriptionData(
          subscriptions.beta,
          integrationFixtureIds.tenants.beta,
          ["test.integrity"],
        ),
      ],
    });
    await prisma.outboxEvent.createMany({
      data: [
        outboxData(
          outbox.alpha,
          integrationFixtureIds.tenants.alpha,
          "test.integrity",
          subscriptions.alpha,
        ),
        outboxData(
          outbox.beta,
          integrationFixtureIds.tenants.beta,
          "test.integrity",
          subscriptions.beta,
        ),
      ],
    });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await sql?.end();
    await database?.dispose();
  }, 30_000);

  it("accepts same-tenant webhook relations", async () => {
    await expect(
      prisma.webhookDelivery.create({
        data: deliveryData(
          "whdel_it_same",
          integrationFixtureIds.tenants.alpha,
          subscriptions.alpha,
          outbox.alpha,
        ),
      }),
    ).resolves.toMatchObject({ tenantId: integrationFixtureIds.tenants.alpha });
  });

  it("rejects all cross-tenant webhook relations through Prisma", async () => {
    await expect(
      prisma.webhookDelivery.create({
        data: deliveryData(
          "whdel_it_cross_subscription",
          integrationFixtureIds.tenants.alpha,
          subscriptions.beta,
          outbox.alpha,
        ),
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.webhookDelivery.create({
        data: deliveryData(
          "whdel_it_cross_outbox",
          integrationFixtureIds.tenants.alpha,
          subscriptions.alpha,
          outbox.beta,
        ),
      }),
    ).rejects.toMatchObject({ code: "P2003" });

    await expect(
      prisma.outboxEvent.create({
        data: outboxData(
          "out_it_cross_subscription",
          integrationFixtureIds.tenants.alpha,
          "test.integrity",
          subscriptions.beta,
        ),
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("reports each violated composite constraint for raw SQL", async () => {
    await expectConstraint(
      sql,
      `INSERT INTO "WebhookDelivery" ("id", "tenantId", "subscriptionId", "outboxEventId", "eventType", "payload", "payloadBody", "createdAt", "updatedAt")
       VALUES ('whdel_it_cross_subscription_sql', $1, $2, $3, 'test.integrity', '{}', '{}', NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, subscriptions.beta, outbox.alpha],
      "WebhookDelivery_tenantId_subscriptionId_fkey",
    );
    await expectConstraint(
      sql,
      `INSERT INTO "WebhookDelivery" ("id", "tenantId", "subscriptionId", "outboxEventId", "eventType", "payload", "payloadBody", "createdAt", "updatedAt")
       VALUES ('whdel_it_cross_outbox_sql', $1, $2, $3, 'test.integrity', '{}', '{}', NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, subscriptions.alpha, outbox.beta],
      "WebhookDelivery_tenantId_outboxEventId_fkey",
    );
    await expectConstraint(
      sql,
      `INSERT INTO "OutboxEvent" ("id", "tenantId", "subscriptionId", "eventType", "payload", "createdAt", "updatedAt")
       VALUES ('out_it_cross_subscription_sql', $1, $2, 'test.integrity', '{}', NOW(), NOW())`,
      [integrationFixtureIds.tenants.alpha, subscriptions.beta],
      "OutboxEvent_tenantId_subscriptionId_fkey",
    );
  });

  it("installs validated tenant-safe constraints and supporting indexes", async () => {
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
        'WebhookDelivery_tenantId_subscriptionId_fkey',
        'WebhookDelivery_tenantId_outboxEventId_fkey',
        'OutboxEvent_tenantId_subscriptionId_fkey'
      )
      ORDER BY conname
    `;
    expect(constraints).toEqual([
      {
        name: "OutboxEvent_tenantId_subscriptionId_fkey",
        validated: true,
        delete_action: "c",
        update_action: "r",
      },
      {
        name: "WebhookDelivery_tenantId_outboxEventId_fkey",
        validated: true,
        delete_action: "c",
        update_action: "r",
      },
      {
        name: "WebhookDelivery_tenantId_subscriptionId_fkey",
        validated: true,
        delete_action: "c",
        update_action: "r",
      },
    ]);

    const indexes = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT indexname AS name
      FROM pg_indexes
      WHERE indexname IN (
        'WebhookSubscription_tenantId_id_key',
        'OutboxEvent_tenantId_id_key',
        'WebhookDelivery_tenantId_outboxEventId_idx',
        'OutboxEvent_status_nextAttemptAt_createdAt_idx'
      )
      ORDER BY indexname
    `;
    expect(indexes.map(({ name }) => name)).toEqual([
      "OutboxEvent_status_nextAttemptAt_createdAt_idx",
      "OutboxEvent_tenantId_id_key",
      "WebhookDelivery_tenantId_outboxEventId_idx",
      "WebhookSubscription_tenantId_id_key",
    ]);
  });

  it("keeps retryable subscribers dispatchable after another subscriber dead-letters", async () => {
    const tenantId = integrationFixtureIds.tenants.alpha;
    await prisma.webhookSubscription.createMany({
      data: [
        subscriptionData("whsub_multi_dead", tenantId, ["test.multi"]),
        subscriptionData("whsub_multi_retry", tenantId, ["test.multi"]),
      ],
    });
    await prisma.outboxEvent.create({
      data: outboxData("out_multi", tenantId, "test.multi"),
    });
    const transport = new QueueTransport([
      { classification: "permanent", status: 400 },
      { classification: "retryable", status: 503 },
      { classification: "delivered", status: 204 },
    ]);
    const port = dispatchPort(prisma, transport);
    const startedAt = new Date("2026-07-21T00:00:00.000Z");

    await expect(
      port.dispatchOutboxEvent(tenantId, "out_multi", startedAt),
    ).resolves.toMatchObject({ status: "failed" });
    await expect(
      port.dispatchOutboxEvent(
        tenantId,
        "out_multi",
        new Date(startedAt.getTime() + 1_001),
      ),
    ).resolves.toMatchObject({ status: "dead_letter" });

    expect(transport.requests).toHaveLength(3);
    expect(
      await prisma.webhookDelivery.findMany({
        where: { outboxEventId: "out_multi" },
        orderBy: { subscriptionId: "asc" },
        select: { status: true },
      }),
    ).toEqual([{ status: "dead_letter" }, { status: "delivered" }]);
  });

  it("does not let an old delayed retry starve a fresh pending event", async () => {
    const tenantId = integrationFixtureIds.tenants.alpha;
    const now = new Date("2026-07-21T01:00:00.000Z");
    await prisma.outboxEvent.updateMany({
      where: { status: { in: ["pending", "failed"] } },
      data: { status: "dispatched", nextAttemptAt: null, lockedAt: null },
    });
    await prisma.outboxEvent.createMany({
      data: [
        {
          ...outboxData("out_delayed", tenantId, "test.starvation"),
          status: "failed",
          nextAttemptAt: new Date(now.getTime() + 60_000),
          createdAt: new Date(now.getTime() - 60_000),
        },
        {
          ...outboxData("out_fresh", tenantId, "test.starvation"),
          createdAt: now,
        },
      ],
    });

    await expect(
      dispatchPort(
        prisma,
        new QueueTransport([]),
      ).claimDispatchableOutboxEvents(1, now),
    ).resolves.toEqual([
      expect.objectContaining({ id: "out_fresh", status: "pending" }),
    ]);
  });

  it("removes stale delivery and outbox dead letters when replay is requested", async () => {
    const tenantId = integrationFixtureIds.tenants.alpha;
    await prisma.webhookSubscription.create({
      data: subscriptionData("whsub_replay", tenantId, ["test.replay"]),
    });
    await prisma.outboxEvent.create({
      data: {
        ...outboxData("out_replay_delivery", tenantId, "test.replay"),
        status: "dead_letter",
      },
    });
    await prisma.webhookDelivery.create({
      data: {
        ...deliveryData(
          "whdel_replay",
          tenantId,
          "whsub_replay",
          "out_replay_delivery",
        ),
        status: "dead_letter",
      },
    });
    await prisma.deadLetterRecord.createMany({
      data: [
        {
          id: "dl_replay_delivery",
          tenantId,
          deliveryId: "whdel_replay",
          reason: "Terminal delivery",
        },
        {
          id: "dl_replay_outbox",
          tenantId,
          outboxEventId: "out_replay_delivery",
          reason: "Terminal outbox",
        },
      ],
    });
    const repository = new PrismaErpRepository(prisma);

    await expect(
      repository.retryWebhookDelivery(tenantId, "whdel_replay"),
    ).resolves.toMatchObject({ status: "pending" });
    await expect(
      prisma.deadLetterRecord.count({
        where: {
          OR: [
            { deliveryId: "whdel_replay" },
            { outboxEventId: "out_replay_delivery" },
          ],
        },
      }),
    ).resolves.toBe(0);

    await prisma.outboxEvent.create({
      data: {
        ...outboxData("out_replay_event", tenantId, "test.replay"),
        status: "dead_letter",
      },
    });
    await prisma.webhookDelivery.create({
      data: {
        ...deliveryData(
          "whdel_replay_event",
          tenantId,
          "whsub_replay",
          "out_replay_event",
        ),
        status: "dead_letter",
      },
    });
    await prisma.deadLetterRecord.createMany({
      data: [
        {
          id: "dl_replay_event_delivery",
          tenantId,
          deliveryId: "whdel_replay_event",
          reason: "Terminal delivery",
        },
        {
          id: "dl_replay_event_outbox",
          tenantId,
          outboxEventId: "out_replay_event",
          reason: "Terminal outbox",
        },
      ],
    });

    await expect(
      repository.dispatchOutboxEvent(tenantId, "out_replay_event"),
    ).resolves.toMatchObject({ status: "pending" });
    await expect(
      prisma.deadLetterRecord.count({
        where: {
          OR: [
            { deliveryId: "whdel_replay_event" },
            { outboxEventId: "out_replay_event" },
          ],
        },
      }),
    ).resolves.toBe(0);
  });
});

const secretResolver: WebhookSecretResolver = {
  resolve: async () => "integration-secret",
};

class QueueTransport implements WebhookTransportPort {
  readonly requests: Parameters<WebhookTransportPort["send"]>[0][] = [];

  constructor(private readonly results: WebhookTransportResult[]) {}

  async send(request: Parameters<WebhookTransportPort["send"]>[0]) {
    this.requests.push(request);
    const result = this.results.shift();
    if (!result) throw new Error("Unexpected webhook transport call.");
    return result;
  }
}

function dispatchPort(prisma: PrismaClient, transport: QueueTransport) {
  return new PrismaOutboxDispatchPort(
    prisma,
    transport,
    secretResolver,
    () => 0,
  );
}

function subscriptionData(id: string, tenantId: string, eventTypes: string[]) {
  return {
    id,
    tenantId,
    url: "https://hooks.example.test/events",
    eventTypes,
    secretPrefix: `prefix-${id}`,
    secretHash: "integration-test-only",
  };
}

function outboxData(
  id: string,
  tenantId: string,
  eventType: string,
  subscriptionId?: string,
) {
  return { id, tenantId, eventType, subscriptionId, payload: { id } };
}

function deliveryData(
  id: string,
  tenantId: string,
  subscriptionId: string,
  outboxEventId: string,
) {
  return {
    id,
    tenantId,
    subscriptionId,
    outboxEventId,
    eventType: "test.integrity",
    payload: { id },
    payloadBody: JSON.stringify({ id }),
  };
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
