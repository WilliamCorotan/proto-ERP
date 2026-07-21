SET LOCAL lock_timeout = '5s';
LOCK TABLE "WebhookSubscription", "WebhookDelivery", "OutboxEvent" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "WebhookDelivery" child
    JOIN "WebhookSubscription" parent ON parent."id" = child."subscriptionId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for WebhookDelivery.subscriptionId';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "WebhookDelivery" child
    JOIN "OutboxEvent" parent ON parent."id" = child."outboxEventId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for WebhookDelivery.outboxEventId';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "OutboxEvent" child
    JOIN "WebhookSubscription" parent ON parent."id" = child."subscriptionId"
    WHERE child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for OutboxEvent.subscriptionId';
  END IF;
END $$;

ALTER TABLE "WebhookDelivery" DROP CONSTRAINT "WebhookDelivery_subscriptionId_fkey";
ALTER TABLE "WebhookDelivery" DROP CONSTRAINT "WebhookDelivery_outboxEventId_fkey";
ALTER TABLE "OutboxEvent" DROP CONSTRAINT "OutboxEvent_subscriptionId_fkey";
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_tenantId_subscriptionId_fkey"
  FOREIGN KEY ("tenantId", "subscriptionId")
  REFERENCES "WebhookSubscription"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_tenantId_outboxEventId_fkey"
  FOREIGN KEY ("tenantId", "outboxEventId")
  REFERENCES "OutboxEvent"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_tenantId_subscriptionId_fkey"
  FOREIGN KEY ("tenantId", "subscriptionId")
  REFERENCES "WebhookSubscription"("tenantId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT NOT VALID;
