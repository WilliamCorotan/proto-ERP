-- Abort before catalog changes. Existing mismatches require operator review.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "WebhookDelivery" child
    LEFT JOIN "WebhookSubscription" parent ON parent."id" = child."subscriptionId"
    WHERE parent."id" IS NULL OR child."tenantId" <> parent."tenantId"
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for WebhookDelivery.subscriptionId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "WebhookDelivery" child
    LEFT JOIN "OutboxEvent" parent ON parent."id" = child."outboxEventId"
    WHERE child."outboxEventId" IS NOT NULL
      AND (parent."id" IS NULL OR child."tenantId" <> parent."tenantId")
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for WebhookDelivery.outboxEventId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "OutboxEvent" child
    LEFT JOIN "WebhookSubscription" parent ON parent."id" = child."subscriptionId"
    WHERE child."subscriptionId" IS NOT NULL
      AND (parent."id" IS NULL OR child."tenantId" <> parent."tenantId")
  ) THEN
    RAISE EXCEPTION 'Tenant integrity preflight failed for OutboxEvent.subscriptionId';
  END IF;
END $$;
