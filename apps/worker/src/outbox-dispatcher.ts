import { createPrismaClient } from "@erp/db";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  SecureWebhookTransport,
  type WebhookTransportResult,
} from "./webhook-transport.js";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LEASE_MS = 5 * 60 * 1_000;
const MAX_RETRY_MS = 24 * 60 * 60 * 1_000;

export type DispatchableOutboxEvent = {
  id: string;
  tenantId: string;
  eventType: string;
  status: "pending" | "failed";
  attempts: number;
};

export type OutboxDispatchOutcome = {
  id: string;
  eventType: string;
  status: "dead_letter" | "dispatched" | "failed";
  attempts: number;
};

export type OutboxDispatchBatchResult = {
  claimed: number;
  deadLettered: number;
  dispatched: number;
  failed: number;
  outcomes: OutboxDispatchOutcome[];
};

export type OutboxDispatchPort = {
  deadLetterTerminalOutboxEvents?(now: Date): Promise<OutboxDispatchOutcome[]>;
  claimDispatchableOutboxEvents(
    limit: number,
    now: Date,
  ): Promise<DispatchableOutboxEvent[]>;
  dispatchOutboxEvent(
    tenantId: string,
    outboxEventId: string,
    now: Date,
  ): Promise<OutboxDispatchOutcome>;
};

export type WebhookSecretResolver = {
  resolve(subscription: {
    id: string;
    secretPrefix: string;
  }): Promise<string | null>;
};

export class EnvironmentWebhookSecretResolver implements WebhookSecretResolver {
  private readonly secrets: Record<string, string>;

  constructor(value = process.env.WEBHOOK_SIGNING_SECRETS_JSON ?? "{}") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
        throw new Error();
      this.secrets = Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    } catch {
      throw new Error(
        "WEBHOOK_SIGNING_SECRETS_JSON must be a JSON object of subscription IDs or secret prefixes to secrets.",
      );
    }
  }

  async resolve(subscription: {
    id: string;
    secretPrefix: string;
  }): Promise<string | null> {
    return (
      this.secrets[subscription.id] ??
      this.secrets[subscription.secretPrefix] ??
      null
    );
  }
}

export class OutboxDispatcher {
  constructor(private readonly port: OutboxDispatchPort) {}

  async dispatchBatch(
    limit = 25,
    now = new Date(),
  ): Promise<OutboxDispatchBatchResult> {
    const terminalOutcomes =
      (await this.port.deadLetterTerminalOutboxEvents?.(now)) ?? [];
    const events = await this.port.claimDispatchableOutboxEvents(limit, now);
    const outcomes: OutboxDispatchOutcome[] = [...terminalOutcomes];
    for (const event of events) {
      outcomes.push(
        await this.port.dispatchOutboxEvent(event.tenantId, event.id, now),
      );
    }
    return {
      claimed: events.length,
      deadLettered: outcomes.filter(
        (outcome) => outcome.status === "dead_letter",
      ).length,
      dispatched: outcomes.filter((outcome) => outcome.status === "dispatched")
        .length,
      failed: outcomes.filter((outcome) => outcome.status === "failed").length,
      outcomes,
    };
  }
}

export class PrismaOutboxDispatchPort implements OutboxDispatchPort {
  private readonly maxAttempts: number;
  private readonly leaseMs: number;

  constructor(
    private readonly prisma: PrismaClient = createPrismaClient(),
    private readonly transport = new SecureWebhookTransport(),
    private readonly secretResolver: WebhookSecretResolver = new EnvironmentWebhookSecretResolver(),
    private readonly random: () => number = Math.random,
  ) {
    this.maxAttempts = positiveInteger(
      process.env.WEBHOOK_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
    );
    this.leaseMs = positiveInteger(
      process.env.WEBHOOK_LEASE_MS,
      DEFAULT_LEASE_MS,
    );
  }

  async claimDispatchableOutboxEvents(
    limit: number,
    now: Date,
  ): Promise<DispatchableOutboxEvent[]> {
    const lockExpiredBefore = new Date(now.getTime() - this.leaseMs);
    const candidates = await this.prisma.outboxEvent.findMany({
      where: {
        status: { in: ["pending", "failed"] },
        OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    const claimed: DispatchableOutboxEvent[] = [];
    for (const event of candidates) {
      const result = await this.prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: event.status,
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }],
        },
        data: { lockedAt: now },
      });
      if (
        result.count === 1 &&
        (event.status === "pending" || event.status === "failed")
      ) {
        claimed.push({
          id: event.id,
          tenantId: event.tenantId,
          eventType: event.eventType,
          status: event.status,
          attempts: event.attempts,
        });
      }
    }
    return claimed;
  }

  async dispatchOutboxEvent(
    tenantId: string,
    outboxEventId: string,
    now: Date,
  ): Promise<OutboxDispatchOutcome> {
    const event = await this.prisma.outboxEvent.findFirstOrThrow({
      where: { id: outboxEventId, tenantId },
    });
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: {
        tenantId,
        active: true,
        eventTypes: { has: event.eventType },
        ...(event.subscriptionId ? { id: event.subscriptionId } : {}),
      },
      orderBy: { id: "asc" },
    });
    if (subscriptions.length === 0) {
      return this.failOutboxWithoutSubscriptions(event);
    }

    const payloadBody = JSON.stringify(event.payload ?? {});
    const deliveries = [];
    for (const subscription of subscriptions) {
      deliveries.push(
        await this.prisma.webhookDelivery.upsert({
          where: {
            tenantId_subscriptionId_outboxEventId: {
              tenantId,
              subscriptionId: subscription.id,
              outboxEventId: event.id,
            },
          },
          update: {},
          create: {
            tenantId,
            subscriptionId: subscription.id,
            outboxEventId: event.id,
            eventType: event.eventType,
            status: "pending",
            attempts: 0,
            nextAttemptAt: now,
            payload: event.payload as Prisma.InputJsonValue,
            payloadBody,
          },
        }),
      );
    }

    for (const delivery of deliveries) {
      if (delivery.status === "delivered" || delivery.status === "dead_letter")
        continue;
      if (delivery.nextAttemptAt && delivery.nextAttemptAt > now) continue;
      await this.deliver(
        subscriptionFor(subscriptions, delivery.subscriptionId),
        delivery,
        event.id,
        now,
      );
    }
    return this.reconcileOutbox(event.id, tenantId, event.eventType, now);
  }

  private async deliver(
    subscription: { id: string; url: string; secretPrefix: string },
    delivery: { id: string; attempts: number; payloadBody: string },
    eventId: string,
    now: Date,
  ) {
    const lockExpiredBefore = new Date(now.getTime() - this.leaseMs);
    const claimed = await this.prisma.webhookDelivery.updateMany({
      where: {
        id: delivery.id,
        status: { in: ["pending", "failed"] },
        OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }],
      },
      data: { lockedAt: now },
    });
    if (claimed.count !== 1) return;

    const secret = await this.secretResolver.resolve(subscription);
    const result = secret
      ? await this.transport.send({
          url: subscription.url,
          secret,
          eventId,
          deliveryId: delivery.id,
          eventType: (
            await this.prisma.webhookDelivery.findUniqueOrThrow({
              where: { id: delivery.id },
            })
          ).eventType,
          rawBody: new TextEncoder().encode(delivery.payloadBody),
        })
      : ({
          classification: "retryable",
          error: "Webhook signing secret is unavailable.",
        } satisfies WebhookTransportResult);
    const attempts = delivery.attempts + 1;
    if (result.classification === "delivered") {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "delivered",
          attempts,
          deliveredAt: now,
          nextAttemptAt: null,
          lockedAt: null,
          lastError: null,
          responseStatus: result.status ?? null,
        },
      });
      return;
    }

    const terminal =
      result.classification === "permanent" || attempts >= this.maxAttempts;
    const error =
      result.error ??
      (result.status
        ? `Webhook returned HTTP ${result.status}.`
        : "Webhook delivery failed.");
    await this.prisma.$transaction(async (tx) => {
      await tx.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: terminal ? "dead_letter" : "failed",
          attempts,
          nextAttemptAt: terminal
            ? null
            : new Date(
                now.getTime() +
                  retryDelayMs(attempts, result.retryAfterMs, this.random),
              ),
          lockedAt: null,
          lastError: error,
          responseStatus: result.status ?? null,
        },
      });
      if (terminal) {
        await tx.deadLetterRecord.upsert({
          where: { deliveryId: delivery.id },
          update: { reason: error },
          create: {
            tenantId: (
              await tx.webhookDelivery.findUniqueOrThrow({
                where: { id: delivery.id },
              })
            ).tenantId,
            deliveryId: delivery.id,
            reason: error,
          },
        });
      }
    });
  }

  private async reconcileOutbox(
    id: string,
    tenantId: string,
    eventType: string,
    now: Date,
  ): Promise<OutboxDispatchOutcome> {
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: { tenantId, outboxEventId: id },
    });
    const attempts = deliveries.reduce(
      (maximum, delivery) => Math.max(maximum, delivery.attempts),
      0,
    );
    const terminalFailure = deliveries.some(
      (delivery) => delivery.status === "dead_letter",
    );
    const delivered = deliveries.every(
      (delivery) => delivery.status === "delivered",
    );
    const status = terminalFailure
      ? "dead_letter"
      : delivered
        ? "dispatched"
        : "failed";
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status,
        attempts,
        lockedAt: null,
        dispatchedAt: delivered ? now : null,
        error: terminalFailure
          ? "One or more webhook deliveries were dead-lettered."
          : delivered
            ? null
            : "One or more webhook deliveries remain retryable.",
      },
    });
    if (terminalFailure) {
      await this.prisma.deadLetterRecord.upsert({
        where: { outboxEventId: id },
        update: {
          reason: `Outbox ${eventType} has a dead-lettered webhook delivery.`,
        },
        create: {
          tenantId,
          outboxEventId: id,
          reason: `Outbox ${eventType} has a dead-lettered webhook delivery.`,
        },
      });
    }
    return { id, eventType, status, attempts };
  }

  private async failOutboxWithoutSubscriptions(
    event: {
      id: string;
      tenantId: string;
      eventType: string;
      attempts: number;
    },
  ): Promise<OutboxDispatchOutcome> {
    const attempts = event.attempts + 1;
    const terminal = attempts >= this.maxAttempts;
    const error = `No active webhook subscriptions for ${event.eventType}.`;
    await this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: terminal ? "dead_letter" : "failed",
        attempts,
        lockedAt: null,
        error,
      },
    });
    if (terminal) {
      await this.prisma.deadLetterRecord.upsert({
        where: { outboxEventId: event.id },
        update: { reason: error },
        create: {
          tenantId: event.tenantId,
          outboxEventId: event.id,
          reason: error,
        },
      });
    }
    return {
      id: event.id,
      eventType: event.eventType,
      status: terminal ? "dead_letter" : "failed",
      attempts,
    };
  }

  async deadLetterTerminalOutboxEvents(): Promise<OutboxDispatchOutcome[]> {
    return [];
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export function retryDelayMs(
  attempts: number,
  retryAfterMs: number | undefined,
  random: () => number,
): number {
  if (retryAfterMs !== undefined) return Math.min(retryAfterMs, MAX_RETRY_MS);
  const ceiling = Math.min(
    1_000 * 2 ** Math.max(0, attempts - 1),
    MAX_RETRY_MS,
  );
  return Math.max(1_000, Math.floor(random() * ceiling));
}

function subscriptionFor<T extends { id: string }>(
  subscriptions: T[],
  id: string,
): T {
  const subscription = subscriptions.find((candidate) => candidate.id === id);
  if (!subscription) throw new Error(`Webhook subscription not found: ${id}`);
  return subscription;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
