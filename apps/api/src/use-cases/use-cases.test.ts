import { describe, expect, it } from "vitest";
import { demoIntegrationData } from "@erp/integration";
import { demoOperationsData } from "@erp/operations";
import { procurementManifest } from "@erp/procurement";
import {
  IntegrationUseCases,
  type IntegrationUseCasePort,
  OperationsUseCases,
  type OperationsUseCasePort,
  WorkflowUseCases,
} from "./index.js";

describe("IntegrationUseCases", () => {
  it("coordinates integration commands through a framework-free port", async () => {
    const calls: string[] = [];
    const repository: IntegrationUseCasePort = {
      async integration(tenantId) {
        calls.push(`integration:${tenantId}`);
        return demoIntegrationData;
      },
      async createApiKey(tenantId, input) {
        calls.push(`createApiKey:${tenantId}:${input.name}`);
        return {
          id: "api_test",
          name: input.name,
          keyPrefix: "erp_test",
          scopes: input.scopes,
          active: true,
          createdAt: "2026-07-01T00:00:00.000Z",
        };
      },
      async dispatchWebhook(tenantId, input) {
        calls.push(`dispatchWebhook:${tenantId}:${input.eventType}`);
        return {
          id: "del_test",
          subscriptionId: input.subscriptionId,
          eventType: input.eventType,
          status: "delivered",
          attempts: 1,
          nextAttemptAt: null,
          responseCode: 200,
          error: null,
          createdAt: "2026-07-01T00:00:00.000Z",
          deliveredAt: "2026-07-01T00:00:00.000Z",
        };
      },
      async retryWebhookDelivery(tenantId, deliveryId) {
        calls.push(`retryWebhookDelivery:${tenantId}:${deliveryId}`);
        return {
          id: deliveryId,
          subscriptionId: "whsub_ops",
          eventType: "operations.lead.created",
          status: "dead_letter",
          attempts: 2,
          nextAttemptAt: null,
          responseCode: 500,
          error: "Simulated webhook failure.",
          createdAt: "2026-07-01T00:00:00.000Z",
          deliveredAt: null,
        };
      },
      async dispatchOutboxEvent(tenantId, outboxEventId) {
        calls.push(`dispatchOutboxEvent:${tenantId}:${outboxEventId}`);
        return {
          id: outboxEventId,
          eventType: "operations.lead.created",
          status: "dispatched",
          attempts: 1,
          payload: { leadId: "lead_test" },
          error: null,
          createdAt: "2026-07-01T00:00:00.000Z",
          dispatchedAt: "2026-07-01T00:00:00.000Z",
        };
      },
      async reassignWorkflowTask(tenantId, input) {
        calls.push(`reassignWorkflowTask:${tenantId}:${input.taskId}`);
        return workflowTaskRecord(input.taskId, "reassigned");
      },
      async snoozeWorkflowTask(tenantId, input) {
        calls.push(`snoozeWorkflowTask:${tenantId}:${input.taskId}`);
        return workflowTaskRecord(input.taskId, "snoozed");
      },
      async retryWorkflowTaskNotification(tenantId, input) {
        calls.push(
          `retryWorkflowTaskNotification:${tenantId}:${input.taskId}:${input.notification}`,
        );
        return workflowTaskRecord(input.taskId, "retried");
      },
    };

    const useCases = new IntegrationUseCases(repository);

    await useCases.snapshot("ten_demo");
    const key = await useCases.createApiKey("ten_demo", {
      name: "Warehouse connector",
      scopes: ["inventory.read"],
    });
    const delivery = await useCases.dispatchWebhook("ten_demo", {
      subscriptionId: "whsub_ops",
      eventType: "operations.lead.created",
      payload: { leadId: "lead_test" },
      fail: false,
    });
    const retry = await useCases.retryWebhookDelivery("ten_demo", delivery.id);
    const outbox = await useCases.dispatchOutboxEvent(
      "ten_demo",
      "outbox_test",
    );
    const reassigned = await useCases.reassignWorkflowTask("ten_demo", {
      taskId: "task_test",
      role: "manager",
      actorId: "usr_admin",
      reason: null,
    });
    const snoozed = await useCases.snoozeWorkflowTask("ten_demo", {
      taskId: "task_test",
      dueAt: "2026-07-03T00:00:00.000Z",
      actorId: "usr_admin",
      reason: "Waiting for documents",
    });
    const taskRetry = await useCases.retryWorkflowTaskNotification("ten_demo", {
      taskId: "task_test",
      notification: "assigned",
      actorId: "usr_admin",
      reason: null,
    });

    expect(key.keyPrefix).toBe("erp_test");
    expect(delivery.status).toBe("delivered");
    expect(retry.status).toBe("dead_letter");
    expect(outbox.status).toBe("dispatched");
    expect(reassigned.operations[0]?.operation).toBe("reassigned");
    expect(snoozed.operations[0]?.operation).toBe("snoozed");
    expect(taskRetry.operations[0]?.operation).toBe("retried");
    expect(calls).toEqual([
      "integration:ten_demo",
      "createApiKey:ten_demo:Warehouse connector",
      "dispatchWebhook:ten_demo:operations.lead.created",
      "retryWebhookDelivery:ten_demo:del_test",
      "dispatchOutboxEvent:ten_demo:outbox_test",
      "reassignWorkflowTask:ten_demo:task_test",
      "snoozeWorkflowTask:ten_demo:task_test",
      "retryWorkflowTaskNotification:ten_demo:task_test:assigned",
    ]);
  });
});

function workflowTaskRecord(
  id: string,
  operation: "reassigned" | "retried" | "snoozed",
) {
  return {
    id,
    taskKey: "procurement.purchase-order:PurchaseOrder:po_test:approved",
    workflowId: "procurement.purchase-order",
    entity: "PurchaseOrder",
    documentId: "po_test",
    action: "approved",
    title: "PO test",
    status: "open" as const,
    assigneeRoles: ["manager"],
    escalatedRoles: [],
    notificationChannels: ["webhook"],
    dueStatus: "open" as const,
    dueAt: "2026-07-03T00:00:00.000Z",
    assignedNotifiedAt: "2026-07-01T00:00:00.000Z",
    escalatedNotifiedAt: null,
    completedNotifiedAt: null,
    cancelledNotifiedAt: null,
    closedAt: null,
    operations: [
      {
        id: `op_${operation}`,
        taskId: id,
        operation,
        actorId: "usr_admin",
        reason: null,
        details: {},
        createdAt: "2026-07-01T00:00:00.000Z",
      },
    ],
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("OperationsUseCases", () => {
  it("coordinates operations commands through a framework-free port", async () => {
    const calls: string[] = [];
    const repository: OperationsUseCasePort = {
      async operations(tenantId) {
        calls.push(`operations:${tenantId}`);
        return demoOperationsData;
      },
      async createLead(tenantId, input) {
        calls.push(`createLead:${tenantId}:${input.companyName}`);
        return {
          id: "lead_test",
          companyName: input.companyName,
          contactName: input.contactName,
          email: input.email,
          source: input.source,
          owner: input.owner,
          stage: "new",
          createdAt: "2026-07-01T00:00:00.000Z",
        };
      },
      async createProject(tenantId, input) {
        calls.push(`createProject:${tenantId}:${input.code}`);
        return {
          id: "project_test",
          code: input.code,
          name: input.name,
          customerName: input.customerName,
          status: "planned",
          budget: input.budget,
          startDate: input.startDate,
          endDate: input.endDate,
        };
      },
      async createServiceCase(tenantId, input) {
        calls.push(`createServiceCase:${tenantId}:${input.subject}`);
        return {
          id: "case_test",
          caseNumber: "CASE-TEST",
          customerName: input.customerName,
          subject: input.subject,
          priority: input.priority,
          status: "open",
          owner: input.owner,
          createdAt: "2026-07-01T00:00:00.000Z",
          closedAt: null,
        };
      },
      async createLeaveRequest(tenantId, input) {
        calls.push(`createLeaveRequest:${tenantId}:${input.employeeId}`);
        return {
          id: "leave_test",
          employeeId: input.employeeId,
          employeeName: "Mina Cruz",
          leaveType: input.leaveType,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "requested",
        };
      },
      async closeServiceCase(tenantId, caseId) {
        calls.push(`closeServiceCase:${tenantId}:${caseId}`);
        return {
          id: caseId,
          caseNumber: "CASE-TEST",
          customerName: "Aster Labs",
          subject: "Question",
          priority: "medium",
          status: "closed",
          owner: "Support Lead",
          createdAt: "2026-07-01T00:00:00.000Z",
          closedAt: "2026-07-01T01:00:00.000Z",
        };
      },
    };

    const useCases = new OperationsUseCases(repository);

    await useCases.snapshot("ten_demo");
    const lead = await useCases.createLead("ten_demo", {
      companyName: "Aster Labs",
      contactName: "Noah Park",
      email: "noah@aster.example",
      source: "Website",
      owner: "Mina Cruz",
    });
    const project = await useCases.createProject("ten_demo", {
      code: "PRJ-TEST",
      name: "Implementation",
      customerName: "Aster Labs",
      budget: { amount: 10000, currency: "USD" },
      startDate: "2026-08-01",
      endDate: "2026-09-01",
    });
    const serviceCase = await useCases.createServiceCase("ten_demo", {
      customerName: "Aster Labs",
      subject: "Question",
      priority: "medium",
      owner: "Support Lead",
    });
    const leave = await useCases.createLeaveRequest("ten_demo", {
      employeeId: "emp_ops",
      leaveType: "vacation",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
    });
    const closed = await useCases.closeServiceCase("ten_demo", serviceCase.id);

    expect(lead.stage).toBe("new");
    expect(project.status).toBe("planned");
    expect(leave.status).toBe("requested");
    expect(closed.status).toBe("closed");
    expect(calls).toEqual([
      "operations:ten_demo",
      "createLead:ten_demo:Aster Labs",
      "createProject:ten_demo:PRJ-TEST",
      "createServiceCase:ten_demo:Question",
      "createLeaveRequest:ten_demo:emp_ops",
      "closeServiceCase:ten_demo:case_test",
    ]);
  });
});

describe("WorkflowUseCases", () => {
  it("lists policies and resolves actor-specific actions", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);
    const policies = useCases.policies();
    const actions = useCases.actions(
      {
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: "po_001" },
        currentState: "draft",
      },
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
    );

    expect(policies.map((policy) => policy.definition.id)).toEqual([
      "procurement.purchase-order",
    ]);
    expect(actions.actions.map((action) => action.to)).toContain("submitted");
    expect(actions.actions.map((action) => action.to)).toContain("cancelled");
    expect(actions.actions.map((action) => action.to)).not.toContain("closed");
  });

  it("executes workflow transitions through the shared runtime", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);

    const result = useCases.transition(
      {
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: "po_001" },
        currentState: "draft",
        targetState: "submitted",
        reason: "Ready for approval",
      },
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
    );

    expect(result.previousState).toBe("draft");
    expect(result.currentState).toBe("submitted");
    expect(result.transition).toMatchObject({
      actorId: "usr_buyer",
      from: "draft",
      comment: "Ready for approval",
      reason: "Ready for approval",
      to: "submitted",
    });
  });

  it("uses operator comments as persisted workflow transition comments", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);

    const result = useCases.transition(
      {
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: "po_001" },
        currentState: "draft",
        targetState: "submitted",
        reason: "Purchase order status update",
        comment: "Supplier quote attached.",
      },
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
    );

    expect(result.transition).toMatchObject({
      comment: "Supplier quote attached.",
      reason: "Supplier quote attached.",
    });
  });

  it("builds role-aware workflow inbox tasks from document candidates", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);

    const inbox = useCases.inbox(
      [
        {
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id: "po_001" },
          currentState: "draft",
          title: "PO-2026-0001",
          summary: "Supplier purchase order.",
          dueAt: "2026-07-10T23:59:59.000Z",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
        {
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id: "po_002" },
          currentState: "closed",
          title: "PO-2026-0002",
          summary: "Closed purchase order.",
          dueAt: "2026-07-11T23:59:59.000Z",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
      "2026-07-02T00:00:00.000Z",
    );

    expect(inbox.tasks).toEqual([
      expect.objectContaining({
        document: { entity: "PurchaseOrder", id: "po_001" },
        assigneeRole: "buyer",
        currentState: "draft",
      }),
      expect.objectContaining({
        document: { entity: "PurchaseOrder", id: "po_001" },
        assigneeRole: "buyer",
        currentState: "draft",
      }),
    ]);
    expect(inbox.tasks.map((task) => task.action.to).sort()).toEqual([
      "cancelled",
      "submitted",
    ]);
  });

  it("uses persisted assignment rules to scope inbox tasks by role", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);
    const candidate = {
      workflowId: "procurement.purchase-order",
      document: { entity: "PurchaseOrder", id: "po_001" },
      currentState: "submitted",
      title: "PO-2026-0001",
      summary: "Supplier purchase order.",
      amount: 75000,
      dueAt: "2026-07-10T23:59:59.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
    };

    const adminInbox = useCases.inbox(
      [candidate],
      {
        userId: "usr_admin",
        roles: ["admin"],
        permissions: ["procurement.manage"],
      },
      "2026-07-02T00:00:00.000Z",
      {
        assignmentRules: [
          {
            id: "wfar_001",
            workflowId: "procurement.purchase-order",
            fromState: "submitted",
            toState: "approved",
            role: "admin",
            minAmount: null,
            maxAmount: null,
            active: true,
          },
        ],
      },
    );
    const buyerInbox = useCases.inbox(
      [candidate],
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
      "2026-07-02T00:00:00.000Z",
      {
        assignmentRules: [
          {
            id: "wfar_001",
            workflowId: "procurement.purchase-order",
            fromState: "submitted",
            toState: "approved",
            role: "admin",
            minAmount: null,
            maxAmount: null,
            active: true,
          },
        ],
      },
    );

    expect(adminInbox.tasks.map((task) => task.action.to)).toContain(
      "approved",
    );
    expect(
      adminInbox.tasks.find((task) => task.action.to === "approved")
        ?.assigneeRoles,
    ).toEqual(["admin"]);
    expect(buyerInbox.tasks.map((task) => task.action.to)).not.toContain(
      "approved",
    );
  });

  it("filters assignment rules by amount threshold and falls back when no rule matches", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);
    const candidate = {
      workflowId: "procurement.purchase-order",
      document: { entity: "PurchaseOrder", id: "po_001" },
      currentState: "submitted",
      title: "PO-2026-0001",
      summary: "Supplier purchase order.",
      amount: 2500,
      dueAt: "2026-07-10T23:59:59.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
    };

    const inbox = useCases.inbox(
      [candidate],
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
      "2026-07-02T00:00:00.000Z",
      {
        assignmentRules: [
          {
            id: "wfar_001",
            workflowId: "procurement.purchase-order",
            fromState: "submitted",
            toState: "approved",
            role: "admin",
            minAmount: 50000,
            maxAmount: null,
            active: true,
          },
        ],
      },
    );

    expect(inbox.tasks.map((task) => task.action.to)).toContain("approved");
    expect(
      inbox.tasks.find((task) => task.action.to === "approved")?.assigneeRole,
    ).toBe("buyer");
  });

  it("allows active delegate roles to work assigned workflow tasks", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);
    const inbox = useCases.inbox(
      [
        {
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id: "po_001" },
          currentState: "submitted",
          title: "PO-2026-0001",
          summary: "Supplier purchase order.",
          amount: 75000,
          dueAt: "2026-07-10T23:59:59.000Z",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      {
        userId: "usr_delegate",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
      "2026-07-02T00:00:00.000Z",
      {
        assignmentRules: [
          {
            id: "wfar_001",
            workflowId: "procurement.purchase-order",
            fromState: "submitted",
            toState: "approved",
            role: "admin",
            delegateRole: "buyer",
            delegateStartsAt: "2026-07-01T00:00:00.000Z",
            delegateEndsAt: "2026-07-03T00:00:00.000Z",
            minAmount: null,
            maxAmount: null,
            active: true,
          },
        ],
      },
    );

    expect(
      inbox.tasks.find((task) => task.action.to === "approved")?.assigneeRoles,
    ).toEqual(["admin", "buyer"]);
  });

  it("computes escalation due status and escalated roles for overdue workflow tasks", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);
    const inbox = useCases.inbox(
      [
        {
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id: "po_001" },
          currentState: "submitted",
          title: "PO-2026-0001",
          summary: "Supplier purchase order.",
          amount: 75000,
          dueAt: "2026-07-10T23:59:59.000Z",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      {
        userId: "usr_admin",
        roles: ["admin"],
        permissions: ["procurement.manage"],
      },
      "2026-07-02T06:00:00.000Z",
      {
        assignmentRules: [
          {
            id: "wfar_001",
            workflowId: "procurement.purchase-order",
            fromState: "submitted",
            toState: "approved",
            role: "admin",
            minAmount: null,
            maxAmount: null,
            active: true,
          },
        ],
        escalationRules: [
          {
            id: "wfer_001",
            workflowId: "procurement.purchase-order",
            fromState: "submitted",
            toState: "approved",
            targetRole: "admin",
            dueInHours: 24,
            escalationRole: "manager",
            notificationChannel: "webhook",
            active: true,
          },
        ],
      },
    );
    const task = inbox.tasks.find((record) => record.action.to === "approved");

    expect(task).toEqual(
      expect.objectContaining({
        ageHours: 30,
        dueStatus: "overdue",
        escalated: true,
        escalatedRoles: ["manager"],
        notificationChannels: ["webhook"],
      }),
    );
    expect(task?.dueAt).toBe("2026-07-02T00:00:00.000Z");
  });

  it("filters workflow action discovery with matching assignment rules", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);
    const rule = {
      id: "wfar_001",
      workflowId: "procurement.purchase-order",
      fromState: "submitted",
      toState: "approved",
      role: "admin",
      minAmount: null,
      maxAmount: null,
      active: true,
    };

    const buyerActions = useCases.actions(
      {
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: "po_001" },
        currentState: "submitted",
        amount: 75000,
      },
      {
        userId: "usr_buyer",
        roles: ["buyer"],
        permissions: ["procurement.manage"],
      },
      { assignmentRules: [rule] },
    );
    const adminActions = useCases.actions(
      {
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: "po_001" },
        currentState: "submitted",
        amount: 75000,
      },
      {
        userId: "usr_admin",
        roles: ["admin"],
        permissions: ["procurement.manage"],
      },
      { assignmentRules: [rule] },
    );

    expect(buyerActions.actions.map((action) => action.to)).not.toContain(
      "approved",
    );
    expect(adminActions.actions.map((action) => action.to)).toContain(
      "approved",
    );
  });

  it("rejects invalid workflow transitions", () => {
    const useCases = new WorkflowUseCases([procurementManifest]);

    expect(() =>
      useCases.transition(
        {
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id: "po_001" },
          currentState: "draft",
          targetState: "closed",
        },
        {
          userId: "usr_buyer",
          roles: ["buyer"],
          permissions: ["procurement.manage"],
        },
      ),
    ).toThrow("Invalid workflow transition");
  });
});
