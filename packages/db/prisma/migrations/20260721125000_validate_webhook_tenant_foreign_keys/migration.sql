ALTER TABLE "WebhookDelivery" VALIDATE CONSTRAINT "WebhookDelivery_tenantId_subscriptionId_fkey";
ALTER TABLE "WebhookDelivery" VALIDATE CONSTRAINT "WebhookDelivery_tenantId_outboxEventId_fkey";
ALTER TABLE "OutboxEvent" VALIDATE CONSTRAINT "OutboxEvent_tenantId_subscriptionId_fkey";
