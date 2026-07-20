import { accountingManifest } from "@erp/accounting";
import { commerceManifest, demoCommerceData } from "@erp/commerce";
import { createDefaultRegistry } from "@erp/core";
import { demoHrData, hrManifest } from "@erp/hr";
import { demoInventoryData, inventoryManifest } from "@erp/inventory";
import { demoIntegrationData, integrationManifest } from "@erp/integration";
import {
  demoManufacturingData,
  manufacturingManifest,
} from "@erp/manufacturing";
import { demoOperationsData, operationsManifest } from "@erp/operations";
import { demoProcurementData, procurementManifest } from "@erp/procurement";
import { demoQualityData, qualityManifest } from "@erp/quality";
import { demoReportingData, reportingManifest } from "@erp/reporting";
import { demoSalesData, salesManifest } from "@erp/sales";
import { cookies } from "next/headers";
import {
  ErpClient,
  type AccountingSnapshot,
  type AdminRole,
  type AdminUser,
  type CommerceSnapshot,
  type CustomizationSnapshot,
  type DashboardSummary,
  type HrSnapshot,
  type InventorySnapshot,
  type IntegrationSnapshot,
  type ManufacturingSnapshot,
  type OperationsSnapshot,
  type ProcurementSnapshot,
  type QualitySnapshot,
  type ReportingSnapshot,
  type SalesSnapshot,
  type WorkflowActionsResponse,
  type WorkflowInboxResponse,
  type WorkflowInstance,
} from "@erp/sdk";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const demoDataEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.ERP_ENABLE_DEMO_DATA === "true";

function demoFallbackOrThrow<T>(error: unknown, fallback: () => T): T {
  if (demoDataEnabled) {
    return fallback();
  }
  throw error;
}

function requireSessionToken(
  token: string | undefined,
  capability: string,
): string {
  if (!token) {
    throw new Error(`Authentication is required to load ${capability}.`);
  }
  return token;
}

const registry = createDefaultRegistry([
  salesManifest,
  accountingManifest,
  procurementManifest,
  inventoryManifest,
  manufacturingManifest,
  qualityManifest,
  reportingManifest,
  integrationManifest,
  commerceManifest,
  operationsManifest,
  hrManifest,
]);

type DashboardModule = DashboardSummary["modules"][number];
type DashboardNavigation = DashboardSummary["navigation"][number];
export type PurchaseOrderWorkflowState = {
  actions: WorkflowActionsResponse["actions"];
  instance: WorkflowInstance | null;
};

function fallbackWorkflowInbox(): WorkflowInboxResponse {
  return {
    generatedAt: new Date().toISOString(),
    tasks: [
      {
        id: "wftask_sales.quote_Quote_quo_001_approved",
        workflowId: "sales.quote",
        document: { entity: "Quote", id: "quo_001" },
        title: "Q-2026-0001",
        summary: "Northstar Manufacturing quote for $28,600.",
        currentState: "submitted",
        action: {
          id: "sales.quote.submitted.approved",
          label: "Approved",
          to: "approved",
          requiredPermissions: [],
          requiredRoles: [],
        },
        assigneeRole: "admin",
        assigneeRoles: ["admin"],
        assigneePermissions: [],
        dueAt: "2026-07-31T23:59:59.000Z",
        createdAt: "2026-07-31T23:59:59.000Z",
        ageHours: 0,
        dueStatus: "open",
        escalated: false,
        escalatedRoles: [],
        notificationChannels: [],
      },
      {
        id: "wftask_sales.invoice_Invoice_inv_001_paid",
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: "inv_001" },
        title: "INV-2026-0001",
        summary: "Northstar Manufacturing invoice due 2026-08-31.",
        currentState: "posted",
        action: {
          id: "sales.invoice.posted.paid",
          label: "Paid",
          to: "paid",
          requiredPermissions: [],
          requiredRoles: [],
        },
        assigneeRole: "admin",
        assigneeRoles: ["admin"],
        assigneePermissions: [],
        dueAt: "2026-08-31T23:59:59.000Z",
        createdAt: "2026-08-31T23:59:59.000Z",
        ageHours: 0,
        dueStatus: "open",
        escalated: false,
        escalatedRoles: [],
        notificationChannels: [],
      },
    ],
  };
}

function fallbackDashboard(): DashboardSummary {
  return {
    tenant: {
      id: "ten_demo",
      name: "Acme Operations",
      slug: "acme",
    },
    metrics: [
      { label: "Open pipeline", value: "$28.6k", trend: "1 submitted quote" },
      { label: "Approved orders", value: "1", trend: "$28.6k committed" },
      { label: "Invoice exposure", value: "$28.6k", trend: "1 posted invoice" },
      { label: "Low stock", value: "1", trend: "scanner kits below target" },
    ],
    modules: registry.list().map(toDashboardModule),
    navigation: registry.navigation().map(toDashboardNavigation),
    recentAudit: [
      {
        id: "aud_001",
        tenantId: "ten_demo",
        actorId: "usr_admin",
        entity: "Quote",
        entityId: "quo_001",
        action: "submitted",
        message: "Quote Q-2026-0001 submitted for approval.",
        createdAt: "2026-07-01T03:15:00.000Z",
      },
      {
        id: "aud_002",
        tenantId: "ten_demo",
        actorId: "usr_admin",
        entity: "SalesOrder",
        entityId: "ord_001",
        action: "approved",
        message: "Sales order SO-2026-0001 approved.",
        createdAt: "2026-07-01T04:20:00.000Z",
      },
    ],
  };
}

function toDashboardModule(
  module: ReturnType<typeof registry.list>[number],
): DashboardModule {
  return {
    id: module.id,
    name: module.name,
    version: module.version,
    description: module.description,
    dependencies: module.dependencies,
    permissions: module.permissions.map((permission) => ({
      key: permission.key,
      label: permission.label,
      ...(permission.description
        ? { description: permission.description }
        : {}),
    })),
    navigation: module.navigation.map(toDashboardNavigation),
    entities: module.entities,
    workflows: module.workflows,
    events: module.events,
    jobs: module.jobs,
    settings: module.settings,
  };
}

function toDashboardNavigation(
  item: ReturnType<typeof registry.navigation>[number],
): DashboardNavigation {
  return {
    label: item.label,
    path: item.path,
    order: item.order,
    ...(item.icon ? { icon: item.icon } : {}),
    ...(item.permission ? { permission: item.permission } : {}),
  };
}

export async function getDashboard(): Promise<DashboardSummary> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "the dashboard",
  );
  try {
    return await new ErpClient(apiUrl, token).dashboard();
  } catch (error) {
    return demoFallbackOrThrow(error, fallbackDashboard);
  }
}

export async function getSalesSnapshot(): Promise<SalesSnapshot> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "sales data",
  );
  try {
    return await new ErpClient(apiUrl, token).sales();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoSalesData);
  }
}

export async function getProcurementSnapshot(): Promise<ProcurementSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).procurement();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoProcurementData);
  }
}

export async function getPurchaseOrderWorkflowStates(
  orders: ProcurementSnapshot["purchaseOrders"],
): Promise<Record<string, PurchaseOrderWorkflowState>> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "purchase-order workflow state",
  );
  if (orders.length === 0) {
    return {};
  }

  const client = new ErpClient(apiUrl, token);
  const entries = await Promise.all(
    orders.map(async (order) => {
      const document = { entity: "PurchaseOrder", id: order.id };
      const [instance, actions] = await Promise.all([
        client.workflowInstance({
          workflowId: "procurement.purchase-order",
          document,
        }),
        client
          .workflowActions({
            workflowId: "procurement.purchase-order",
            document,
          })
          .then((response) => response.actions)
          .catch(() =>
            client
              .workflowActions({
                workflowId: "procurement.purchase-order",
                document,
                currentState: order.status,
              })
              .then((response) => response.actions),
          ),
      ]);
      return [order.id, { actions, instance }] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function getWorkflowInbox(): Promise<WorkflowInboxResponse> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "the workflow inbox",
  );
  try {
    return await new ErpClient(apiUrl, token).workflowInbox();
  } catch (error) {
    return demoFallbackOrThrow(error, fallbackWorkflowInbox);
  }
}

export async function getSalesWorkflowStates({
  entity,
  records,
  workflowId,
}: {
  entity: "Invoice" | "Quote" | "SalesOrder";
  records: Array<{ id: string; status: string }>;
  workflowId: "sales.invoice" | "sales.order" | "sales.quote";
}): Promise<Record<string, PurchaseOrderWorkflowState>> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "sales workflow state",
  );
  if (records.length === 0) {
    return {};
  }

  const client = new ErpClient(apiUrl, token);
  const entries = await Promise.all(
    records.map(async (record) => {
      const document = { entity, id: record.id };
      const [instance, actions] = await Promise.all([
        client.workflowInstance({ workflowId, document }),
        client
          .workflowActions({ workflowId, document })
          .then((response) => response.actions)
          .catch(() =>
            client
              .workflowActions({
                workflowId,
                document,
                currentState: record.status,
              })
              .then((response) => response.actions),
          ),
      ]);
      return [record.id, { actions, instance }] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function getCommerceSnapshot(): Promise<CommerceSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).commerce();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoCommerceData);
  }
}

export async function getHrSnapshot(): Promise<HrSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).hr();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoHrData);
  }
}

export async function getInventorySnapshot(): Promise<InventorySnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).inventory();
  } catch (error) {
    return demoFallbackOrThrow(error, () => ({
      warehouses: demoInventoryData.warehouses,
      bins: demoInventoryData.bins,
      ledger: demoSalesData.products.map((product) => ({
        id: `sle_opening_${product.id}`,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        warehouseCode: "MAIN",
        binCode: "MAIN-01",
        quantity: product.stockOnHand,
        unitCost: product.price,
        value: {
          amount: product.stockOnHand * product.price.amount,
          currency: product.price.currency,
        },
        sourceEntity: "OpeningBalance",
        sourceId: `opening_${product.id}`,
        createdAt: "2026-07-01T00:00:00.000Z",
      })),
      reservations: [],
      transfers: [],
      cycleCounts: [],
      reorderPoints: demoInventoryData.reorderPoints,
      valuationLayers: demoSalesData.products.map((product) => ({
        id: `val_opening_${product.id}`,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        remainingQuantity: product.stockOnHand,
        unitCost: product.price,
        sourceEntity: "OpeningBalance",
        sourceId: `opening_${product.id}`,
      })),
      pickLists: demoInventoryData.pickLists,
      pickTasks: demoInventoryData.pickTasks,
      packRecords: demoInventoryData.packRecords,
      shipments: demoInventoryData.shipments,
      putAwayTasks: demoInventoryData.putAwayTasks,
      barcodeScans: demoInventoryData.barcodeScans,
      reconciled: true,
    }));
  }
}

export async function getManufacturingSnapshot(): Promise<ManufacturingSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).manufacturing();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoManufacturingData);
  }
}

export async function getQualitySnapshot(): Promise<QualitySnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).quality();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoQualityData);
  }
}

export async function getReportingSnapshot(): Promise<ReportingSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).reporting();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoReportingData);
  }
}

export async function getIntegrationSnapshot(): Promise<IntegrationSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).integration();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoIntegrationData);
  }
}

export async function getOperationsSnapshot(): Promise<OperationsSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).operations();
  } catch (error) {
    return demoFallbackOrThrow(error, () => demoOperationsData);
  }
}

export async function getCustomizationSnapshot(): Promise<CustomizationSnapshot> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "customization data",
  );
  try {
    return await new ErpClient(apiUrl, token).customization();
  } catch (error) {
    return demoFallbackOrThrow(error, () => ({
      customFields: [
        {
          id: "cf_customer_region",
          entityType: "Customer",
          key: "region",
          label: "Region",
          fieldType: "text",
          required: false,
          options: [],
          displayOrder: 10,
        },
      ],
      views: [
        {
          id: "view_customer_default",
          entityType: "Customer",
          name: "default",
          fields: [
            "code",
            "name",
            "email",
            "owner",
            "creditLimit",
            "custom.region",
          ],
        },
      ],
      automationRules: [
        {
          id: "auto_customer_created_notify_owner",
          name: "Customer created owner notification",
          triggerType: "event",
          triggerEvent: "sales.customer.created",
          schedule: null,
          enabled: false,
          actions: [
            {
              type: "audit",
              message: "Notify owner when a customer is created.",
            },
          ],
          runCount: 0,
          lastRunAt: null,
          lastError: null,
        },
      ],
      workflowAssignmentRules: [
        {
          id: "wfar_quote_high_value_approval",
          workflowId: "sales.quote",
          fromState: "submitted",
          toState: "approved",
          role: "admin",
          delegateRole: "buyer",
          delegateStartsAt: "2026-07-01T00:00:00.000Z",
          delegateEndsAt: "2026-12-31T23:59:59.000Z",
          minAmount: 50000,
          maxAmount: null,
          active: true,
        },
        {
          id: "wfar_purchase_order_approval",
          workflowId: "procurement.purchase-order",
          fromState: "submitted",
          toState: "approved",
          role: "admin",
          delegateRole: null,
          delegateStartsAt: null,
          delegateEndsAt: null,
          minAmount: null,
          maxAmount: null,
          active: true,
        },
      ],
      workflowEscalationRules: [
        {
          id: "wfer_quote_approval_escalation",
          workflowId: "sales.quote",
          fromState: "submitted",
          toState: "approved",
          targetRole: "admin",
          dueInHours: 24,
          escalationRole: "manager",
          notificationChannel: "in_app",
          active: true,
        },
      ],
      enabledModules: ["accounting", "commerce", "core", "hr", "sales"],
    }));
  }
}

export async function getAccountingSnapshot(): Promise<AccountingSnapshot> {
  const token = (await cookies()).get("erp_token")?.value;
  try {
    return await new ErpClient(apiUrl, token).accounting();
  } catch (error) {
    return demoFallbackOrThrow(error, () => ({
      accounts: [
        {
          id: "acct_cash",
          code: "1000",
          name: "Cash",
          type: "asset",
          normalBalance: "debit",
          active: true,
        },
        {
          id: "acct_ar",
          code: "1100",
          name: "Accounts Receivable",
          type: "asset",
          normalBalance: "debit",
          active: true,
        },
        {
          id: "acct_revenue",
          code: "4000",
          name: "Sales Revenue",
          type: "revenue",
          normalBalance: "credit",
          active: true,
        },
      ],
      fiscalPeriods: [
        {
          id: "fp_2026",
          name: "FY2026",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
          status: "open",
        },
      ],
      taxRates: [{ id: "tax_standard", name: "Standard", rate: 0 }],
      journalEntries: [],
      payments: [],
      aging: {
        receivables: {
          label: "Receivables",
          current: { amount: 0, currency: "USD" },
          days1To30: { amount: 0, currency: "USD" },
          days31To60: { amount: 0, currency: "USD" },
          days61To90: { amount: 0, currency: "USD" },
          over90: { amount: 0, currency: "USD" },
          total: { amount: 0, currency: "USD" },
        },
        payables: {
          label: "Payables",
          current: { amount: 0, currency: "USD" },
          days1To30: { amount: 0, currency: "USD" },
          days31To60: { amount: 0, currency: "USD" },
          days61To90: { amount: 0, currency: "USD" },
          over90: { amount: 0, currency: "USD" },
          total: { amount: 0, currency: "USD" },
        },
      },
      bankAccounts: [
        {
          id: "bank_operating",
          code: "OPERATING",
          name: "Operating Bank",
          currency: "USD",
          balance: { amount: 0, currency: "USD" },
          lastReconciledAt: null,
        },
      ],
      bankTransactions: [],
      bankReconciliations: [],
      periodCloses: [],
      landedCostAllocations: [],
      fixedAssets: [],
      depreciationRuns: [],
      exchangeRates: [
        {
          id: "fx_usd_php",
          baseCurrency: "USD",
          quoteCurrency: "PHP",
          rate: 58,
          effectiveDate: "2026-07-01",
        },
      ],
      trialBalance: {
        debitTotal: { amount: 0, currency: "USD" },
        creditTotal: { amount: 0, currency: "USD" },
        isBalanced: true,
        lines: [],
      },
    }));
  }
}

export async function getAdminSnapshot(): Promise<{
  users: AdminUser[];
  roles: AdminRole[];
}> {
  const token = requireSessionToken(
    (await cookies()).get("erp_token")?.value,
    "administration data",
  );
  const client = new ErpClient(apiUrl, token);
  const [users, roles] = await Promise.all([
    client.adminUsers(),
    client.adminRoles(),
  ]);
  return { users, roles };
}
