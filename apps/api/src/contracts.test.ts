import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const document = JSON.parse(
  readFileSync(new URL("../../../docs/openapi.json", import.meta.url), "utf8"),
) as {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: { schemas: Record<string, unknown> };
};

type OpenApiOperation = {
  deprecated?: boolean;
  requestBody?: unknown;
  security?: Array<Record<string, string[]>>;
  responses?: Record<
    string,
    { content?: Record<string, { schema?: unknown }> }
  >;
};

describe("OpenAPI contract", () => {
  it("documents every public endpoint", () => {
    expect(Object.keys(document.paths).sort()).toEqual(
      [
        "/admin/roles",
        "/admin/users",
        "/accounting",
        "/accounting/bank-reconciliations",
        "/accounting/bank-transactions",
        "/accounting/depreciation-runs",
        "/accounting/exchange-rates",
        "/accounting/fixed-assets",
        "/accounting/landed-cost-allocations",
        "/accounting/payments",
        "/accounting/period-closes",
        "/auth/login",
        "/auth/me",
        "/commerce",
        "/commerce/catalog",
        "/commerce/channel-orders",
        "/commerce/pos-sales",
        "/commerce/pos-shifts/close",
        "/commerce/pos-shifts/open",
        "/customization",
        "/customization/automation-rules",
        "/customization/custom-fields",
        "/customization/modules/{id}",
        "/customization/workflow-assignment-rules",
        "/customization/workflow-escalation-rules",
        "/dashboard",
        "/health",
        "/hr",
        "/hr/attendance",
        "/hr/employee-advances",
        "/hr/employee-advances/pay",
        "/hr/expense-claims",
        "/hr/expense-claims/approve",
        "/hr/expense-claims/pay",
        "/hr/payroll-runs",
        "/inventory",
        "/inventory/cycle-counts",
        "/inventory/pack-records",
        "/inventory/pick-lists",
        "/inventory/pick-tasks/confirm",
        "/inventory/put-away-tasks",
        "/inventory/put-away-tasks/confirm",
        "/inventory/reservations",
        "/inventory/shipments",
        "/inventory/transfers",
        "/integrations",
        "/integrations/api-keys",
        "/integrations/outbox-events/{id}/dispatch",
        "/integrations/webhook-deliveries",
        "/integrations/webhook-deliveries/{id}/retry",
        "/integrations/workflow-tasks/{id}/reassign",
        "/integrations/workflow-tasks/{id}/retry-notification",
        "/integrations/workflow-tasks/{id}/snooze",
        "/manufacturing",
        "/manufacturing/downtime",
        "/manufacturing/job-cards/complete",
        "/manufacturing/job-cards/start",
        "/manufacturing/mrp-suggestions/{id}/work-order",
        "/manufacturing/production-plans",
        "/manufacturing/work-orders/{id}/complete",
        "/manufacturing/work-orders/{id}/release",
        "/modules",
        "/operations",
        "/operations/leads",
        "/operations/leave-requests",
        "/operations/projects",
        "/operations/service-cases",
        "/operations/service-cases/{id}/close",
        "/procurement",
        "/procurement/material-requests",
        "/procurement/purchase-orders",
        "/procurement/purchase-orders/{id}/invoice",
        "/procurement/purchase-orders/{id}/receipt",
        "/procurement/purchase-orders/{id}/status",
        "/procurement/supplier-payments",
        "/procurement/suppliers",
        "/quality",
        "/quality/inspections",
        "/quality/recalls",
        "/quality/trace-records/{id}/genealogy",
        "/reports",
        "/reports/exports",
        "/reports/previews",
        "/reports/print-formats",
        "/reports/print-previews",
        "/reports/runs",
        "/sales",
        "/sales/customers",
        "/sales/customers/{id}",
        "/sales/invoices/{id}/status",
        "/sales/orders/{id}/invoice",
        "/sales/orders/{id}/status",
        "/sales/products",
        "/sales/products/{id}",
        "/sales/quotes/{id}/order",
        "/sales/quotes/{id}/status",
        "/webhooks/events",
        "/workflows",
        "/workflows/actions",
        "/workflows/inbox",
        "/workflows/instances/lookup",
        "/workflows/transitions",
      ].sort(),
    );
  });

  it("defines response schemas and mutating request schemas", () => {
    for (const [endpoint, path] of Object.entries(document.paths)) {
      for (const [method, operation] of Object.entries(path)) {
        const success =
          operation.responses?.["200"] ?? operation.responses?.["201"];
        const documentedOutcome =
          success ??
          (operation.deprecated ? operation.responses?.["501"] : undefined);
        expect(
          documentedOutcome?.content?.["application/json"]?.schema,
          `${method} success or deprecated outcome schema`,
        ).toBeDefined();

        const mutatesWithBody =
          method === "patch" ||
          (method === "post" &&
            [
              "/accounting/payments",
              "/auth/login",
              "/admin/users",
              "/customization/custom-fields",
              "/sales/customers",
              "/sales/products",
            ].includes(endpoint)) ||
          [
            "/customization/automation-rules",
            "/commerce/catalog",
            "/commerce/channel-orders",
            "/commerce/pos-sales",
            "/commerce/pos-shifts/close",
            "/commerce/pos-shifts/open",
            "/hr/attendance",
            "/hr/employee-advances",
            "/hr/employee-advances/pay",
            "/hr/expense-claims",
            "/hr/expense-claims/approve",
            "/hr/expense-claims/pay",
            "/hr/payroll-runs",
            "/inventory/cycle-counts",
            "/inventory/pack-records",
            "/inventory/pick-lists",
            "/inventory/pick-tasks/confirm",
            "/inventory/put-away-tasks",
            "/inventory/put-away-tasks/confirm",
            "/inventory/reservations",
            "/inventory/shipments",
            "/inventory/transfers",
            "/manufacturing/downtime",
            "/manufacturing/job-cards/complete",
            "/manufacturing/job-cards/start",
            "/manufacturing/production-plans",
            "/procurement/material-requests",
            "/procurement/purchase-orders",
            "/procurement/supplier-payments",
            "/procurement/suppliers",
            "/quality/inspections",
            "/quality/recalls",
            "/integrations/api-keys",
            "/integrations/webhook-deliveries",
            "/operations/leads",
            "/operations/leave-requests",
            "/operations/projects",
            "/operations/service-cases",
            "/reports/exports",
            "/reports/runs",
            "/workflows/actions",
            "/workflows/instances/lookup",
            "/workflows/transitions",
            "/customization/workflow-assignment-rules",
            "/customization/workflow-escalation-rules",
          ].includes(endpoint);
        if (mutatesWithBody) {
          expect(operation.requestBody, `${method} request body`).toBeDefined();
        }
      }
    }
  });

  it("requires tenant-qualified login and bearer auth for tenant reads", () => {
    const login = document.components.schemas.LoginRequest as {
      required?: string[];
    };
    expect(login.required).toEqual(["tenantSlug", "email", "password"]);

    for (const endpoint of [
      "/dashboard",
      "/modules",
      "/sales",
      "/customization",
    ]) {
      expect(document.paths[endpoint]?.get?.security).toEqual([
        { bearer: [] },
      ]);
    }
  });

  it("publishes webhook payload schemas", () => {
    expect(document.components.schemas.CustomizationSnapshot).toBeDefined();
    expect(document.components.schemas.CustomFieldDefinition).toBeDefined();
    expect(document.components.schemas.WorkflowAssignmentRule).toBeDefined();
    expect(document.components.schemas.WorkflowEscalationRule).toBeDefined();
    expect(document.components.schemas.WorkflowTaskRecord).toBeDefined();
    expect(document.components.schemas.WorkflowTaskOperation).toBeDefined();
    expect(
      document.components.schemas.WorkflowTaskReassignRequest,
    ).toBeDefined();
    expect(document.components.schemas.WorkflowTaskSnoozeRequest).toBeDefined();
    expect(
      document.components.schemas.WorkflowTaskRetryNotificationRequest,
    ).toBeDefined();
    expect(document.components.schemas.AccountingSnapshot).toBeDefined();
    expect(document.components.schemas.CommerceSnapshot).toBeDefined();
    expect(document.components.schemas.PosSale).toBeDefined();
    expect(document.components.schemas.ChannelOrder).toBeDefined();
    expect(document.components.schemas.HrSnapshot).toBeDefined();
    expect(document.components.schemas.PayrollRun).toBeDefined();
    expect(document.components.schemas.ExpenseClaim).toBeDefined();
    expect(document.components.schemas.InventorySnapshot).toBeDefined();
    expect(document.components.schemas.ManufacturingSnapshot).toBeDefined();
    expect(document.components.schemas.QualitySnapshot).toBeDefined();
    expect(document.components.schemas.ReportingSnapshot).toBeDefined();
    expect(document.components.schemas.IntegrationSnapshot).toBeDefined();
    expect(document.components.schemas.OutboxEvent).toBeDefined();
    expect(document.components.schemas.OperationsSnapshot).toBeDefined();
    expect(document.components.schemas.ServiceCase).toBeDefined();
    expect(document.components.schemas.Project).toBeDefined();
    expect(document.components.schemas.Lead).toBeDefined();
    expect(document.components.schemas.WebhookDelivery).toBeDefined();
    expect(document.components.schemas.ApiKeyRecord).toBeDefined();
    expect(document.components.schemas.ReportRun).toBeDefined();
    expect(document.components.schemas.QualityInspection).toBeDefined();
    expect(document.components.schemas.TraceMovement).toBeDefined();
    expect(document.components.schemas.TraceGenealogy).toBeDefined();
    expect(document.components.schemas.WorkOrder).toBeDefined();
    expect(document.components.schemas.JobCard).toBeDefined();
    expect(document.components.schemas.DowntimeEntry).toBeDefined();
    expect(document.components.schemas.CapacitySchedule).toBeDefined();
    expect(document.components.schemas.StockLedgerEntry).toBeDefined();
    expect(document.components.schemas.PickList).toBeDefined();
    expect(document.components.schemas.PickTask).toBeDefined();
    expect(document.components.schemas.PackRecord).toBeDefined();
    expect(document.components.schemas.Shipment).toBeDefined();
    expect(document.components.schemas.PutAwayTask).toBeDefined();
    expect(document.components.schemas.BarcodeScan).toBeDefined();
    expect(document.components.schemas.ProcurementSnapshot).toBeDefined();
    expect(document.components.schemas.PurchaseOrder).toBeDefined();
    expect(document.components.schemas.TrialBalance).toBeDefined();
    expect(document.components.schemas.WebhookEventContract).toBeDefined();
    expect(document.components.schemas.WebhookEventEnvelope).toBeDefined();
    expect(document.components.schemas.SalesOrderCreatedPayload).toBeDefined();
    expect(document.components.schemas.InvoicePostedPayload).toBeDefined();
    expect(document.components.schemas.WorkflowPolicy).toBeDefined();
    expect(document.components.schemas.WorkflowActionsRequest).toBeDefined();
    expect(document.components.schemas.WorkflowActionsResponse).toBeDefined();
    expect(document.components.schemas.WorkflowInboxResponse).toBeDefined();
    expect(document.components.schemas.WorkflowTask).toBeDefined();
    expect(
      document.components.schemas.WorkflowInstanceLookupRequest,
    ).toBeDefined();
    expect(document.components.schemas.WorkflowInstance).toBeDefined();
    expect(document.components.schemas.WorkflowTransitionRequest).toBeDefined();
    expect(
      document.components.schemas.WorkflowTransitionResponse,
    ).toBeDefined();
  });
});
