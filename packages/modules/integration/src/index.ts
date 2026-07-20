import type { ModuleManifest } from "@erp/core";

export type ApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  active: boolean;
  createdAt: string;
};

export type WebhookSubscription = {
  id: string;
  url: string;
  eventTypes: string[];
  secretPrefix: string;
  active: boolean;
};

export type WebhookDelivery = {
  id: string;
  subscriptionId: string;
  eventType: string;
  status: "pending" | "delivered" | "failed" | "dead_letter";
  attempts: number;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
};

export type DeadLetterRecord = {
  id: string;
  deliveryId: string | null;
  outboxEventId: string | null;
  reason: string;
  createdAt: string;
};

export type OutboxEvent = {
  id: string;
  eventType: string;
  status: "pending" | "dispatched" | "failed" | "dead_letter";
  attempts: number;
  payload: Record<string, unknown>;
  error: string | null;
  createdAt: string;
  dispatchedAt: string | null;
};

export type WorkflowTaskOperation = {
  id: string;
  taskId: string;
  operation: "reassigned" | "retried" | "snoozed";
  actorId: string;
  reason: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type WorkflowTaskRecord = {
  id: string;
  taskKey: string;
  workflowId: string;
  entity: string;
  documentId: string;
  action: string;
  title: string;
  status: "cancelled" | "completed" | "open" | "superseded";
  assigneeRoles: string[];
  escalatedRoles: string[];
  notificationChannels: string[];
  dueStatus: "due_soon" | "open" | "overdue";
  dueAt: string | null;
  assignedNotifiedAt: string | null;
  escalatedNotifiedAt: string | null;
  completedNotifiedAt: string | null;
  cancelledNotifiedAt: string | null;
  closedAt: string | null;
  operations: WorkflowTaskOperation[];
  updatedAt: string;
};

export type IntegrationMapping = {
  id: string;
  name: string;
  sourceType: string;
  targetType: string;
  fields: Array<{ source: string; target: string }>;
  active: boolean;
};

export type Connector = {
  id: string;
  name: string;
  connectorType: "edi" | "ecommerce" | "marketplace" | "custom";
  status: "available" | "enabled" | "disabled";
};

export type IntegrationSnapshot = {
  apiKeys: ApiKeyRecord[];
  webhookSubscriptions: WebhookSubscription[];
  webhookDeliveries: WebhookDelivery[];
  deadLetters: DeadLetterRecord[];
  outboxEvents: OutboxEvent[];
  workflowTasks: WorkflowTaskRecord[];
  mappings: IntegrationMapping[];
  connectors: Connector[];
};

export const integrationManifest: ModuleManifest = {
  id: "integration",
  name: "Integration",
  version: "0.1.0",
  description:
    "API keys, webhook delivery, dead letters, import/export mappings, and connector registry.",
  dependencies: ["core", "reporting"],
  permissions: [
    { key: "integration.read", label: "Read integrations" },
    { key: "integration.manage", label: "Manage integrations" },
  ],
  navigation: [
    {
      label: "Integrations",
      path: "/integrations",
      icon: "plug",
      permission: "integration.read",
      order: 95,
    },
  ],
  entities: [
    {
      name: "ApiKeyRecord",
      label: "API Key",
      permissions: ["integration.read", "integration.manage"],
    },
    {
      name: "WebhookSubscription",
      label: "Webhook Subscription",
      permissions: ["integration.read", "integration.manage"],
    },
    {
      name: "WebhookDelivery",
      label: "Webhook Delivery",
      permissions: ["integration.read"],
    },
    {
      name: "OutboxEvent",
      label: "Outbox Event",
      permissions: ["integration.read", "integration.manage"],
    },
    {
      name: "IntegrationMapping",
      label: "Integration Mapping",
      permissions: ["integration.read", "integration.manage"],
    },
    {
      name: "Connector",
      label: "Connector",
      permissions: ["integration.read", "integration.manage"],
    },
  ],
  workflows: [],
  events: [
    "integration.webhook.delivered",
    "integration.webhook.dead-lettered",
    "integration.api-key.created",
    "workflow.task.assigned",
    "workflow.task.escalated",
    "workflow.task.completed",
    "workflow.task.cancelled",
    "workflow.transition.completed",
  ],
  jobs: [
    "integration.outbox-dispatch",
    "integration.webhook-dispatch",
    "integration.dead-letter-retry",
  ],
  settings: [
    "integration_webhook_max_attempts",
    "integration_signature_algorithm",
  ],
};

export const demoIntegrationData = {
  apiKeys: [] satisfies ApiKeyRecord[],
  webhookSubscriptions: [
    {
      id: "whsub_ops",
      url: "https://ops.example/webhooks/erp",
      eventTypes: [
        "sales.invoice.posted",
        "manufacturing.work-order.completed",
        "operations.lead.created",
        "operations.service-case.closed",
        "workflow.task.assigned",
        "workflow.task.escalated",
        "workflow.task.completed",
        "workflow.task.cancelled",
        "workflow.transition.completed",
      ],
      secretPrefix: "whsec_demo",
      active: true,
    },
  ] satisfies WebhookSubscription[],
  webhookDeliveries: [] satisfies WebhookDelivery[],
  deadLetters: [] satisfies DeadLetterRecord[],
  outboxEvents: [] satisfies OutboxEvent[],
  workflowTasks: [] satisfies WorkflowTaskRecord[],
  mappings: [
    {
      id: "map_order_import",
      name: "E-commerce order import",
      sourceType: "ShopOrder",
      targetType: "SalesOrder",
      fields: [
        { source: "customer.email", target: "customerEmail" },
        { source: "total", target: "total.amount" },
      ],
      active: true,
    },
  ] satisfies IntegrationMapping[],
  connectors: [
    {
      id: "conn_shopify",
      name: "Shopify",
      connectorType: "ecommerce",
      status: "available",
    },
    {
      id: "conn_edi_x12",
      name: "EDI X12",
      connectorType: "edi",
      status: "available",
    },
  ] satisfies Connector[],
};
