import { describe, expect, it } from "vitest";
import {
  OutboxDispatcher,
  EnvironmentWebhookSecretResolver,
  retryDelayMs,
  type DispatchableOutboxEvent,
  type OutboxDispatchOutcome,
  type OutboxDispatchPort,
} from "./outbox-dispatcher.js";

class FakeOutboxDispatchPort implements OutboxDispatchPort {
  readonly claimedAt: Date[] = [];
  readonly dispatched: Array<{ tenantId: string; id: string; now: Date }> = [];
  terminalOutcomes: OutboxDispatchOutcome[] = [];

  constructor(
    readonly events: DispatchableOutboxEvent[],
    private readonly outcomes: Record<string, OutboxDispatchOutcome>,
  ) {}

  async claimDispatchableOutboxEvents(
    limit: number,
    now: Date,
  ): Promise<DispatchableOutboxEvent[]> {
    this.claimedAt.push(now);
    return this.events.slice(0, limit);
  }

  async deadLetterTerminalOutboxEvents(): Promise<OutboxDispatchOutcome[]> {
    return this.terminalOutcomes;
  }

  async dispatchOutboxEvent(
    tenantId: string,
    outboxEventId: string,
    now: Date,
  ): Promise<OutboxDispatchOutcome> {
    this.dispatched.push({ tenantId, id: outboxEventId, now });
    const outcome = this.outcomes[outboxEventId];
    if (!outcome) {
      throw new Error(`Missing fake outcome for ${outboxEventId}.`);
    }
    return outcome;
  }
}

describe("OutboxDispatcher", () => {
  it("claims and dispatches a bounded batch of outbox events", async () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const port = new FakeOutboxDispatchPort(
      [
        {
          id: "evt_1",
          tenantId: "ten_demo",
          eventType: "operations.lead.created",
          status: "pending",
          attempts: 0,
        },
        {
          id: "evt_2",
          tenantId: "ten_demo",
          eventType: "operations.service-case.closed",
          status: "failed",
          attempts: 1,
        },
        {
          id: "evt_3",
          tenantId: "ten_demo",
          eventType: "integration.api-key.created",
          status: "pending",
          attempts: 0,
        },
      ],
      {
        evt_1: {
          id: "evt_1",
          eventType: "operations.lead.created",
          status: "dispatched",
          attempts: 1,
        },
        evt_2: {
          id: "evt_2",
          eventType: "operations.service-case.closed",
          status: "failed",
          attempts: 2,
        },
      },
    );

    const result = await new OutboxDispatcher(port).dispatchBatch(2, now);

    expect(result).toEqual({
      claimed: 2,
      deadLettered: 0,
      dispatched: 1,
      failed: 1,
      outcomes: [
        {
          id: "evt_1",
          eventType: "operations.lead.created",
          status: "dispatched",
          attempts: 1,
        },
        {
          id: "evt_2",
          eventType: "operations.service-case.closed",
          status: "failed",
          attempts: 2,
        },
      ],
    });
    expect(port.claimedAt).toEqual([now]);
    expect(port.dispatched).toEqual([
      { tenantId: "ten_demo", id: "evt_1", now },
      { tenantId: "ten_demo", id: "evt_2", now },
    ]);
  });

  it("reports dead-lettered outcomes separately from retryable failures", async () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const port = new FakeOutboxDispatchPort(
      [
        {
          id: "evt_dead",
          tenantId: "ten_demo",
          eventType: "integration.api-key.created",
          status: "failed",
          attempts: 2,
        },
      ],
      {
        evt_dead: {
          id: "evt_dead",
          eventType: "integration.api-key.created",
          status: "dead_letter",
          attempts: 3,
        },
      },
    );

    const result = await new OutboxDispatcher(port).dispatchBatch(10, now);

    expect(result).toEqual({
      claimed: 1,
      deadLettered: 1,
      dispatched: 0,
      failed: 0,
      outcomes: [
        {
          id: "evt_dead",
          eventType: "integration.api-key.created",
          status: "dead_letter",
          attempts: 3,
        },
      ],
    });
  });

  it("counts terminal failures swept before claiming retryable events", async () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const port = new FakeOutboxDispatchPort(
      [
        {
          id: "evt_pending",
          tenantId: "ten_demo",
          eventType: "operations.lead.created",
          status: "pending",
          attempts: 0,
        },
      ],
      {
        evt_pending: {
          id: "evt_pending",
          eventType: "operations.lead.created",
          status: "dispatched",
          attempts: 1,
        },
      },
    );
    port.terminalOutcomes = [
      {
        id: "evt_terminal",
        eventType: "integration.api-key.created",
        status: "dead_letter",
        attempts: 3,
      },
    ];

    const result = await new OutboxDispatcher(port).dispatchBatch(10, now);

    expect(result).toEqual({
      claimed: 1,
      deadLettered: 1,
      dispatched: 1,
      failed: 0,
      outcomes: [
        {
          id: "evt_terminal",
          eventType: "integration.api-key.created",
          status: "dead_letter",
          attempts: 3,
        },
        {
          id: "evt_pending",
          eventType: "operations.lead.created",
          status: "dispatched",
          attempts: 1,
        },
      ],
    });
  });

  it("does not dispatch events withheld by the max-attempt claim policy", async () => {
    const now = new Date("2026-07-01T00:00:00.000Z");
    const port = new FakeOutboxDispatchPort(
      [
        {
          id: "evt_retryable",
          tenantId: "ten_demo",
          eventType: "operations.lead.created",
          status: "failed",
          attempts: 2,
        },
      ],
      {
        evt_retryable: {
          id: "evt_retryable",
          eventType: "operations.lead.created",
          status: "failed",
          attempts: 3,
        },
      },
    );
    port.events.splice(0, port.events.length);

    const result = await new OutboxDispatcher(port).dispatchBatch(10, now);

    expect(result).toEqual({
      claimed: 0,
      deadLettered: 0,
      dispatched: 0,
      failed: 0,
      outcomes: [],
    });
    expect(port.dispatched).toEqual([]);
  });

  it("dispatches workflow notification outbox events", async () => {
    const now = new Date("2026-07-02T00:00:00.000Z");
    const port = new FakeOutboxDispatchPort(
      [
        {
          id: "evt_workflow_escalated",
          tenantId: "ten_demo",
          eventType: "workflow.task.escalated",
          status: "pending",
          attempts: 0,
        },
      ],
      {
        evt_workflow_escalated: {
          id: "evt_workflow_escalated",
          eventType: "workflow.task.escalated",
          status: "dispatched",
          attempts: 1,
        },
      },
    );

    const result = await new OutboxDispatcher(port).dispatchBatch(10, now);

    expect(result.dispatched).toBe(1);
    expect(result.outcomes).toEqual([
      {
        id: "evt_workflow_escalated",
        eventType: "workflow.task.escalated",
        status: "dispatched",
        attempts: 1,
      },
    ]);
    expect(port.dispatched).toEqual([
      { tenantId: "ten_demo", id: "evt_workflow_escalated", now },
    ]);
  });
});

describe("durable webhook delivery policy", () => {
  it("resolves worker-only signing secrets by subscription id or prefix", async () => {
    const resolver = new EnvironmentWebhookSecretResolver(
      JSON.stringify({ whsub_1: "id-secret", whsec_2: "prefix-secret" }),
    );
    await expect(
      resolver.resolve({ id: "whsub_1", secretPrefix: "ignored" }),
    ).resolves.toBe("id-secret");
    await expect(
      resolver.resolve({ id: "whsub_2", secretPrefix: "whsec_2" }),
    ).resolves.toBe("prefix-secret");
    await expect(
      resolver.resolve({ id: "missing", secretPrefix: "missing" }),
    ).resolves.toBeNull();
  });

  it("fails closed on malformed secret configuration", () => {
    expect(() => new EnvironmentWebhookSecretResolver("[]")).toThrow(
      "WEBHOOK_SIGNING_SECRETS_JSON must be a JSON object",
    );
  });

  it("uses full jitter unless Retry-After provides a bounded delay", () => {
    expect(retryDelayMs(3, undefined, () => 0.5)).toBe(2_000);
    expect(retryDelayMs(3, 30_000, () => 0)).toBe(30_000);
    expect(retryDelayMs(3, 48 * 60 * 60 * 1_000, () => 0)).toBe(
      24 * 60 * 60 * 1_000,
    );
  });
});
