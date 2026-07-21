import {
  createApiKeyAction,
  dispatchOutboxEventAction,
  dispatchWebhookAction,
  reassignWorkflowTaskAction,
  retryWorkflowTaskNotificationAction,
  retryWebhookDeliveryAction,
  snoozeWorkflowTaskAction,
} from "../actions";
import {
  Badge,
  DataTable,
  MetricTile,
  RecordPanel,
  Timeline,
  TimelineRow,
  statusTone,
} from "../../components/design-system";
import { getIntegrationSnapshot } from "../data";

type SearchParams = Record<string, string | string[] | undefined>;

const apiScopes = [
  "accounting.read",
  "inventory.read",
  "integration.read",
  "reporting.read",
  "sales.customer.read",
] as const;

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const integration = await getIntegrationSnapshot();
  const params = (await searchParams) ?? {};
  const subscription = integration.webhookSubscriptions[0];
  const failedDeliveries = integration.webhookDeliveries.filter(
    (delivery) =>
      delivery.status === "failed" || delivery.status === "dead_letter",
  );
  const dispatchableOutbox = integration.outboxEvents.filter(
    (event) => event.status === "failed" || event.status === "dead_letter",
  );
  const taskFilters = {
    status: firstParam(params.status),
    dueStatus: firstParam(params.dueStatus),
    workflowId: firstParam(params.workflowId),
    assigneeRole: firstParam(params.assigneeRole),
    notification: firstParam(params.notification),
  };
  const filteredWorkflowTasks = integration.workflowTasks.filter((task) => {
    const notifications = notificationStates(task);
    return (
      matchesFilter(task.status, taskFilters.status) &&
      matchesFilter(task.dueStatus, taskFilters.dueStatus) &&
      matchesFilter(task.workflowId, taskFilters.workflowId) &&
      matchesArrayFilter(task.assigneeRoles, taskFilters.assigneeRole) &&
      (taskFilters.notification === "all" ||
        taskFilters.notification === "" ||
        notifications.includes(taskFilters.notification))
    );
  });
  const workflowIds = uniqueSorted(
    integration.workflowTasks.map((task) => task.workflowId),
  );
  const assigneeRoles = uniqueSorted(
    integration.workflowTasks.flatMap((task) => task.assigneeRoles),
  );

  return (
    <div className="page-stack">
      <RecordPanel
        badge={
          <Badge tone="info">{integration.connectors.length} connectors</Badge>
        }
        eyebrow="Integrations"
        title="API and event operations"
      >
        <div className="metric-grid">
          <MetricTile
            label="API keys"
            tone="info"
            value={integration.apiKeys.length}
          />
          <MetricTile
            label="Subscriptions"
            tone="success"
            value={integration.webhookSubscriptions.length}
          />
          <MetricTile
            label="Deliveries"
            tone="processing"
            value={integration.webhookDeliveries.length}
          />
          <MetricTile
            label="Outbox"
            tone="automation"
            value={integration.outboxEvents.length}
          />
          <MetricTile
            label="Workflow tasks"
            tone="info"
            value={integration.workflowTasks.length}
          />
          <MetricTile
            label="Dead letters"
            tone="danger"
            value={integration.deadLetters.length}
          />
        </div>
      </RecordPanel>

      <section className="split-grid">
        <RecordPanel eyebrow="Security" title="Scoped API keys">
          <form action={createApiKeyAction} className="record-form">
            <label>
              Name
              <input
                name="name"
                defaultValue="Warehouse scanner sync"
                required
              />
            </label>
            <div className="checkbox-grid">
              {apiScopes.map((scope) => (
                <label key={scope}>
                  <input
                    name="scopes"
                    type="checkbox"
                    value={scope}
                    defaultChecked={
                      scope === "inventory.read" || scope === "integration.read"
                    }
                  />
                  {scope}
                </label>
              ))}
            </div>
            <button type="submit">Create key</button>
          </form>
          <Timeline>
            {integration.apiKeys.map((key) => (
              <TimelineRow
                key={key.id}
                label={key.active ? "active" : "inactive"}
              >
                <>
                  {key.name} - {key.keyPrefix} - {key.scopes.join(", ")}
                </>
              </TimelineRow>
            ))}
            {integration.apiKeys.length === 0 ? <p>No API keys yet.</p> : null}
          </Timeline>
        </RecordPanel>

        <RecordPanel eyebrow="Events" title="Webhook delivery queue">
          <form action={dispatchWebhookAction} className="record-form">
            <label>
              Subscription
              <select
                name="subscriptionId"
                defaultValue={subscription?.id}
                required
              >
                {integration.webhookSubscriptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.url}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Event
              <select
                name="eventType"
                defaultValue={subscription?.eventTypes[0]}
                required
              >
                {(subscription?.eventTypes ?? []).map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Entity ID
              <input name="entityId" defaultValue="wo-demo" required />
            </label>
            <button type="submit" disabled={!subscription}>
              Enqueue webhook
            </button>
          </form>
          <Timeline>
            {failedDeliveries.map((delivery) => (
              <form
                key={delivery.id}
                action={retryWebhookDeliveryAction}
                className="timeline-row inline-action"
              >
                <input type="hidden" name="id" value={delivery.id} />
                <span>{delivery.status}</span>
                <p>
                  {delivery.eventType} - attempt {delivery.attempts}
                </p>
                <button type="submit">Requeue</button>
              </form>
            ))}
            {failedDeliveries.length === 0 ? (
              <p>No replayable deliveries.</p>
            ) : null}
          </Timeline>
        </RecordPanel>
      </section>

      <section className="split-grid">
        <RecordPanel
          badge={
            <Badge tone={dispatchableOutbox.length ? "warning" : "success"}>
              {dispatchableOutbox.length} replayable
            </Badge>
          }
          eyebrow="Outbox"
          title="Durable events"
        >
          <Timeline>
            {dispatchableOutbox.map((event) => (
              <form
                key={event.id}
                action={dispatchOutboxEventAction}
                className="timeline-row inline-action"
              >
                <input type="hidden" name="id" value={event.id} />
                <span>
                  <Badge tone={statusTone(event.status)}>{event.status}</Badge>
                </span>
                <p>
                  {event.eventType} - attempts {event.attempts}
                </p>
                <button type="submit">Requeue</button>
              </form>
            ))}
            {dispatchableOutbox.length === 0 ? (
              <p>No replayable outbox events.</p>
            ) : null}
          </Timeline>
        </RecordPanel>
        <EventTable
          title="Webhook deliveries"
          rows={integration.webhookDeliveries.map((item) => ({
            id: item.id,
            status: item.status,
            eventType: item.eventType,
            attempts: item.attempts,
          }))}
        />
      </section>

      <section className="split-grid">
        <WorkflowTaskOperationsPanel
          assigneeRoles={assigneeRoles}
          filters={taskFilters}
          rows={filteredWorkflowTasks}
          workflowIds={workflowIds}
        />
        <EventTable
          title="Outbox history"
          rows={integration.outboxEvents.map((item) => ({
            id: item.id,
            status: item.status,
            eventType: item.eventType,
            attempts: item.attempts,
          }))}
        />
      </section>

      <section className="split-grid">
        <TimelinePanel
          title="Dead letters"
          rows={integration.deadLetters.map((item) => [
            item.id,
            item.outboxEventId ? "outbox" : "webhook",
            item.reason,
          ])}
        />
        <TimelinePanel
          title="Mappings"
          rows={integration.mappings.map((item) => [
            item.id,
            item.active ? "active" : "inactive",
            `${item.sourceType} to ${item.targetType}`,
          ])}
        />
      </section>

      <section className="split-grid">
        <TimelinePanel
          title="Connector registry"
          rows={integration.connectors.map((item) => [
            item.id,
            item.status,
            `${item.name} - ${item.connectorType}`,
          ])}
        />
      </section>
    </div>
  );
}

function WorkflowTaskOperationsPanel({
  assigneeRoles,
  filters,
  rows,
  workflowIds,
}: {
  assigneeRoles: string[];
  filters: {
    assigneeRole: string;
    dueStatus: string;
    notification: string;
    status: string;
    workflowId: string;
  };
  rows: Array<{
    action: string;
    assignedNotifiedAt: string | null;
    assigneeRoles: string[];
    cancelledNotifiedAt: string | null;
    completedNotifiedAt: string | null;
    dueAt: string | null;
    dueStatus: string;
    escalatedNotifiedAt: string | null;
    id: string;
    notificationChannels: string[];
    operations: Array<{
      actorId: string;
      createdAt: string;
      id: string;
      operation: string;
      reason: string | null;
    }>;
    status: string;
    title: string;
    workflowId: string;
  }>;
  workflowIds: string[];
}) {
  return (
    <RecordPanel
      badge={<Badge tone="neutral">{rows.length} tasks</Badge>}
      eyebrow="Workflow"
      title="Workflow task operations"
    >
      <form className="record-form workflow-task-filter">
        <label>
          Status
          <select name="status" defaultValue={filters.status || "all"}>
            {["all", "open", "completed", "cancelled", "superseded"].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Due
          <select name="dueStatus" defaultValue={filters.dueStatus || "all"}>
            {["all", "open", "due_soon", "overdue"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Workflow
          <select name="workflowId" defaultValue={filters.workflowId || "all"}>
            <option value="all">all</option>
            {workflowIds.map((workflowId) => (
              <option key={workflowId} value={workflowId}>
                {workflowId}
              </option>
            ))}
          </select>
        </label>
        <label>
          Role
          <select
            name="assigneeRole"
            defaultValue={filters.assigneeRole || "all"}
          >
            <option value="all">all</option>
            {assigneeRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Notification
          <select
            name="notification"
            defaultValue={filters.notification || "all"}
          >
            {[
              "all",
              "unnotified",
              "assigned",
              "escalated",
              "completed",
              "cancelled",
            ].map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Filter</button>
      </form>

      <Timeline>
        {rows.map((task) => (
          <div key={task.id} className="workflow-task-card">
            <TimelineRow label={task.status}>
              <div className="workflow-task-stack">
                <p>
                  {task.title} - {task.workflowId} - {task.action}
                </p>
                <p>
                  {task.assigneeRoles.join(", ")} - {task.dueStatus}
                  {task.dueAt ? ` - due ${formatDateTime(task.dueAt)}` : ""}
                </p>
                <p>
                  {notificationStates(task).join(", ")} -{" "}
                  {task.notificationChannels.join(", ") || "no channels"}
                </p>
                <div className="workflow-task-actions">
                  <form action={reassignWorkflowTaskAction}>
                    <input type="hidden" name="id" value={task.id} />
                    <input
                      aria-label="Role"
                      name="role"
                      defaultValue={task.assigneeRoles[0] ?? "admin"}
                    />
                    <input
                      aria-label="Reason"
                      name="reason"
                      defaultValue="Load balancing"
                    />
                    <button type="submit">Reassign</button>
                  </form>
                  <form action={snoozeWorkflowTaskAction}>
                    <input type="hidden" name="id" value={task.id} />
                    <input
                      aria-label="Due at"
                      name="dueAt"
                      type="datetime-local"
                      defaultValue={nextLocalDateTime()}
                    />
                    <input
                      aria-label="Snooze reason"
                      name="reason"
                      defaultValue="Waiting for supporting documents"
                    />
                    <button type="submit">Snooze</button>
                  </form>
                  <form action={retryWorkflowTaskNotificationAction}>
                    <input type="hidden" name="id" value={task.id} />
                    <select
                      aria-label="Notification"
                      name="notification"
                      defaultValue="assigned"
                    >
                      {["assigned", "escalated", "completed", "cancelled"].map(
                        (state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      aria-label="Retry reason"
                      name="reason"
                      defaultValue="Manual retry"
                    />
                    <button type="submit">Retry notification</button>
                  </form>
                </div>
                <Timeline>
                  {task.operations.map((operation) => (
                    <TimelineRow key={operation.id} label={operation.operation}>
                      {operation.actorId} - {formatDateTime(operation.createdAt)}
                      {operation.reason ? ` - ${operation.reason}` : ""}
                    </TimelineRow>
                  ))}
                  {task.operations.length === 0 ? (
                    <p>No task operations yet.</p>
                  ) : null}
                </Timeline>
              </div>
            </TimelineRow>
          </div>
        ))}
        {rows.length === 0 ? <p>No workflow tasks match these filters.</p> : null}
      </Timeline>
    </RecordPanel>
  );
}

function TimelinePanel({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <RecordPanel
      badge={<Badge tone="neutral">{rows.length} records</Badge>}
      eyebrow="Records"
      title={title}
    >
      <Timeline>
        {rows.map(([id, label, detail]) => (
          <TimelineRow key={id} label={label}>
            {detail}
          </TimelineRow>
        ))}
        {rows.length === 0 ? <p>No records yet.</p> : null}
      </Timeline>
    </RecordPanel>
  );
}

function EventTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    attempts: number;
    eventType: string;
    id: string;
    status: string;
  }>;
}) {
  return (
    <RecordPanel
      badge={<Badge tone="neutral">{rows.length} records</Badge>}
      eyebrow="Records"
      title={title}
    >
      <DataTable
        caption={title}
        columns={[
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge tone={statusTone(row.status)}>{row.status}</Badge>
            ),
          },
          { key: "eventType", header: "Event", render: (row) => row.eventType },
          {
            key: "attempts",
            header: "Attempts",
            align: "end",
            render: (row) => row.attempts,
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
      />
    </RecordPanel>
  );
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function matchesFilter(value: string, filter: string): boolean {
  return filter === "" || filter === "all" || value === filter;
}

function matchesArrayFilter(values: string[], filter: string): boolean {
  return filter === "" || filter === "all" || values.includes(filter);
}

function notificationStates(task: {
  assignedNotifiedAt: string | null;
  cancelledNotifiedAt: string | null;
  completedNotifiedAt: string | null;
  escalatedNotifiedAt: string | null;
}): string[] {
  const states = [
    task.assignedNotifiedAt ? "assigned" : "",
    task.escalatedNotifiedAt ? "escalated" : "",
    task.completedNotifiedAt ? "completed" : "",
    task.cancelledNotifiedAt ? "cancelled" : "",
  ].filter(Boolean);
  return states.length ? states : ["unnotified"];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function nextLocalDateTime(): string {
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return next.toISOString().slice(0, 16);
}
