import { createPrismaClient } from "@erp/db";
import type { Prisma } from "@prisma/client";

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
  claimDispatchableOutboxEvents(limit: number, now: Date): Promise<DispatchableOutboxEvent[]>;
  dispatchOutboxEvent(tenantId: string, outboxEventId: string, now: Date): Promise<OutboxDispatchOutcome>;
};

export class OutboxDispatcher {
  constructor(private readonly port: OutboxDispatchPort) {}

  async dispatchBatch(limit = 25, now = new Date()): Promise<OutboxDispatchBatchResult> {
    const terminalOutcomes = (await this.port.deadLetterTerminalOutboxEvents?.(now)) ?? [];
    const events = await this.port.claimDispatchableOutboxEvents(limit, now);
    const outcomes: OutboxDispatchOutcome[] = [...terminalOutcomes];

    for (const event of events) {
      outcomes.push(await this.port.dispatchOutboxEvent(event.tenantId, event.id, now));
    }

    return {
      claimed: events.length,
      deadLettered: outcomes.filter((outcome) => outcome.status === "dead_letter").length,
      dispatched: outcomes.filter((outcome) => outcome.status === "dispatched").length,
      failed: outcomes.filter((outcome) => outcome.status === "failed").length,
      outcomes
    };
  }
}

export class PrismaOutboxDispatchPort implements OutboxDispatchPort {
  private readonly prisma = createPrismaClient();
  private readonly maxAttempts = Number(process.env.OUTBOX_MAX_ATTEMPTS ?? 3);

  async claimDispatchableOutboxEvents(limit: number, now: Date): Promise<DispatchableOutboxEvent[]> {
    const lockExpiredBefore = new Date(now.getTime() - 5 * 60 * 1000);
    const candidates = await this.prisma.outboxEvent.findMany({
      where: {
        status: { in: ["pending", "failed"] },
        attempts: { lt: this.maxAttempts },
        OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }]
      },
      orderBy: { createdAt: "asc" },
      take: limit
    });
    const claimed: DispatchableOutboxEvent[] = [];

    for (const event of candidates) {
      const result = await this.prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: event.status,
          attempts: { lt: this.maxAttempts },
          OR: [{ lockedAt: null }, { lockedAt: { lt: lockExpiredBefore } }]
        },
        data: { lockedAt: now }
      });
      if (result.count === 1 && (event.status === "pending" || event.status === "failed")) {
        claimed.push({
          id: event.id,
          tenantId: event.tenantId,
          eventType: event.eventType,
          status: event.status,
          attempts: event.attempts
        });
      }
    }

    return claimed;
  }

  async dispatchOutboxEvent(tenantId: string, outboxEventId: string, now: Date): Promise<OutboxDispatchOutcome> {
    const event = await this.prisma.outboxEvent.findFirstOrThrow({ where: { id: outboxEventId, tenantId } });
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { tenantId, active: true, eventTypes: { has: event.eventType } }
    });
    const attempts = event.attempts + 1;

    if (subscriptions.length === 0) {
      const error = `No active webhook subscriptions for ${event.eventType}.`;
      if (attempts >= this.maxAttempts) {
        const deadLettered = await this.deadLetterOutboxEvent(event.id, tenantId, attempts, error);
        return {
          id: deadLettered.id,
          eventType: deadLettered.eventType,
          status: "dead_letter",
          attempts: deadLettered.attempts
        };
      }
      const failed = await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          attempts,
          status: "failed",
          lockedAt: null,
          error
        }
      });
      await this.recordAudit(tenantId, "OutboxEvent", failed.id, "failed", failed.error ?? `Outbox event ${failed.eventType} failed.`);
      return {
        id: failed.id,
        eventType: failed.eventType,
        status: "failed",
        attempts: failed.attempts
      };
    }

    const dispatched = await this.prisma.$transaction(async (tx) => {
      for (const subscription of subscriptions) {
        await tx.webhookDelivery.create({
          data: {
            tenantId,
            subscriptionId: subscription.id,
            eventType: event.eventType,
            status: "delivered",
            attempts: 1,
            nextAttemptAt: null,
            deliveredAt: now,
            payload: (event.payload ?? {}) as Prisma.InputJsonValue
          }
        });
      }

      return tx.outboxEvent.update({
        where: { id: event.id },
        data: {
          attempts,
          status: "dispatched",
          lockedAt: null,
          dispatchedAt: now,
          error: null
        }
      });
    });
    await this.recordAudit(tenantId, "OutboxEvent", dispatched.id, "dispatched", `Outbox event ${dispatched.eventType} dispatched.`);
    return {
      id: dispatched.id,
      eventType: dispatched.eventType,
      status: "dispatched",
      attempts: dispatched.attempts
    };
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  private async recordAudit(tenantId: string, entity: string, entityId: string, action: string, message: string) {
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId: "worker",
        entity,
        entityId,
        action,
        message
      }
    });
  }

  async deadLetterTerminalOutboxEvents(now: Date): Promise<OutboxDispatchOutcome[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        status: "failed",
        attempts: { gte: this.maxAttempts },
        OR: [{ lockedAt: null }, { lockedAt: { lt: now } }]
      },
      take: 100
    });
    const outcomes: OutboxDispatchOutcome[] = [];
    for (const event of events) {
      const deadLettered = await this.deadLetterOutboxEvent(
        event.id,
        event.tenantId,
        event.attempts,
        event.error ?? `Outbox event ${event.eventType} exceeded ${this.maxAttempts} attempts.`
      );
      outcomes.push({
        id: deadLettered.id,
        eventType: deadLettered.eventType,
        status: "dead_letter",
        attempts: deadLettered.attempts
      });
    }
    return outcomes;
  }

  private async deadLetterOutboxEvent(outboxEventId: string, tenantId: string, attempts: number, reason: string) {
    const event = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.outboxEvent.update({
        where: { id: outboxEventId },
        data: {
          attempts,
          status: "dead_letter",
          lockedAt: null,
          error: reason
        }
      });
      const existing = await tx.deadLetterRecord.findFirst({
        where: { tenantId, outboxEventId: updated.id },
        select: { id: true }
      });
      if (!existing) {
        await tx.deadLetterRecord.create({
          data: {
            tenantId,
            outboxEventId: updated.id,
            reason: `Outbox ${updated.eventType} failed after ${attempts} attempts: ${reason}`
          }
        });
      }
      return updated;
    });
    await this.recordAudit(tenantId, "OutboxEvent", event.id, "dead-lettered", `Outbox event ${event.eventType} moved to dead letter.`);
    return event;
  }
}
