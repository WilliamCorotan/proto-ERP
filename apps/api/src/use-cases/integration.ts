import type {
  ApiKeyRecord,
  IntegrationSnapshot,
  OutboxEvent,
  WebhookDelivery,
  WorkflowTaskRecord,
} from "@erp/integration";
import type {
  CreateApiKeyInput,
  DispatchWebhookInput,
  ReassignWorkflowTaskInput,
  RetryWorkflowTaskNotificationInput,
  SnoozeWorkflowTaskInput,
} from "../repository.js";

export type IntegrationUseCasePort = {
  integration(tenantId: string): Promise<IntegrationSnapshot>;
  createApiKey(tenantId: string, input: CreateApiKeyInput): Promise<ApiKeyRecord>;
  dispatchWebhook(tenantId: string, input: DispatchWebhookInput): Promise<WebhookDelivery>;
  retryWebhookDelivery(tenantId: string, deliveryId: string): Promise<WebhookDelivery>;
  dispatchOutboxEvent(tenantId: string, outboxEventId: string): Promise<OutboxEvent>;
  reassignWorkflowTask(tenantId: string, input: ReassignWorkflowTaskInput): Promise<WorkflowTaskRecord>;
  snoozeWorkflowTask(tenantId: string, input: SnoozeWorkflowTaskInput): Promise<WorkflowTaskRecord>;
  retryWorkflowTaskNotification(tenantId: string, input: RetryWorkflowTaskNotificationInput): Promise<WorkflowTaskRecord>;
};

export class IntegrationUseCases {
  constructor(private readonly repository: IntegrationUseCasePort) {}

  snapshot(tenantId: string): Promise<IntegrationSnapshot> {
    return this.repository.integration(tenantId);
  }

  createApiKey(tenantId: string, input: CreateApiKeyInput): Promise<ApiKeyRecord> {
    return this.repository.createApiKey(tenantId, input);
  }

  dispatchWebhook(tenantId: string, input: DispatchWebhookInput): Promise<WebhookDelivery> {
    return this.repository.dispatchWebhook(tenantId, input);
  }

  retryWebhookDelivery(tenantId: string, deliveryId: string): Promise<WebhookDelivery> {
    return this.repository.retryWebhookDelivery(tenantId, deliveryId);
  }

  dispatchOutboxEvent(tenantId: string, outboxEventId: string): Promise<OutboxEvent> {
    return this.repository.dispatchOutboxEvent(tenantId, outboxEventId);
  }

  reassignWorkflowTask(tenantId: string, input: ReassignWorkflowTaskInput): Promise<WorkflowTaskRecord> {
    return this.repository.reassignWorkflowTask(tenantId, input);
  }

  snoozeWorkflowTask(tenantId: string, input: SnoozeWorkflowTaskInput): Promise<WorkflowTaskRecord> {
    return this.repository.snoozeWorkflowTask(tenantId, input);
  }

  retryWorkflowTaskNotification(
    tenantId: string,
    input: RetryWorkflowTaskNotificationInput,
  ): Promise<WorkflowTaskRecord> {
    return this.repository.retryWorkflowTaskNotification(tenantId, input);
  }
}
