import { createPrismaClient } from "@erp/db";
import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  Account,
  AccountingSnapshot,
  BankAccount,
  BankReconciliation,
  BankTransaction,
  DepreciationRun,
  ExchangeRate,
  FiscalPeriod,
  FixedAsset,
  JournalEntry,
  JournalLine,
  LandedCostAllocation,
  Payment,
  PeriodClose,
  TaxRate,
  TrialBalance,
  TrialBalanceLine,
} from "@erp/accounting";
import {
  demoProcurementData,
  type MaterialRequest,
  type ProcurementSnapshot,
  type PurchaseInvoice,
  type PurchaseOrder,
  type PurchaseReceipt,
  type Supplier,
  type SupplierPayment,
} from "@erp/procurement";
import {
  type BarcodeScan,
  demoInventoryData,
  type CycleCount,
  type InventorySnapshot,
  type PackRecord,
  type PickList,
  type PickTask,
  type PutAwayTask,
  type Shipment,
  type StockLedgerEntry,
  type StockReservation,
  type StockTransfer,
} from "@erp/inventory";
import {
  demoManufacturingData,
  type BillOfMaterial,
  type DowntimeEntry,
  type JobCard,
  type ManufacturingSnapshot,
  type MrpSuggestion,
  type ProductionPlan,
  type Routing,
  type WorkOrder,
} from "@erp/manufacturing";
import {
  demoQualityData,
  type CorrectiveAction,
  type NonConformance,
  type QualityInspection,
  type QualitySnapshot,
  type Recall,
  type TraceGenealogy,
  type TraceMovement,
  type TraceRecord,
} from "@erp/quality";
import {
  demoReportingData,
  type ExportJob,
  type PrintFormat,
  type PrintPreview,
  type ReportingSnapshot,
  type ReportPreview,
  type ReportRun,
  type SavedReport,
} from "@erp/reporting";
import {
  type ChannelCatalogItem,
  type ChannelOrder,
  type CommerceSnapshot,
  demoCommerceData,
  type PosSale,
  type PosShift,
} from "@erp/commerce";
import {
  type AttendanceRecord,
  demoHrData,
  type EmployeeAdvance,
  type ExpenseClaim,
  type HrSnapshot,
  type PayrollRun,
} from "@erp/hr";
import {
  demoIntegrationData,
  type ApiKeyRecord,
  type Connector,
  type DeadLetterRecord,
  type IntegrationMapping,
  type IntegrationSnapshot,
  type OutboxEvent,
  type WebhookDelivery,
  type WebhookSubscription,
  type WorkflowTaskOperation,
  type WorkflowTaskRecord,
} from "@erp/integration";
import {
  demoOperationsData,
  type Employee,
  type Lead,
  type LeaveRequest,
  type OperationsSnapshot,
  type Project,
  type ServiceCase,
} from "@erp/operations";
import {
  demoSalesData,
  type Customer,
  type Invoice,
  type Product,
  type Quote,
  type SalesDocumentLine,
  type SalesOrder,
  type StockMovement,
} from "@erp/sales";
import type { AuditEvent, Money } from "@erp/core";
import type {
  WorkflowDocumentRef,
  WorkflowInstance,
  WorkflowTask,
  WorkflowTransitionRecord,
} from "@erp/platform-workflow";

export type CustomFieldValue = string | number | boolean | null;

export type CreateCustomerInput = {
  code: string;
  name: string;
  owner: string;
  email: string;
  creditLimit: Money;
  customFields?: Record<string, CustomFieldValue>;
};

export type CreateProductInput = {
  sku: string;
  name: string;
  category: string;
  price: Money;
  stockOnHand: number;
};

export type UpdateCustomerInput = CreateCustomerInput & {
  id: string;
};

export type UpdateProductInput = CreateProductInput & {
  id: string;
};

export type DocumentTransitionInput = {
  id: string;
  status: string;
};

export type SalesSnapshot = {
  customers: Customer[];
  products: Product[];
  quotes: Quote[];
  orders: SalesOrder[];
  invoices: Invoice[];
  stockMovements: StockMovement[];
};

export type CustomFieldDefinition = {
  id: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: "boolean" | "date" | "number" | "select" | "text";
  required: boolean;
  options: string[];
  displayOrder: number;
};

export type ViewDefinition = {
  id: string;
  entityType: string;
  name: string;
  fields: string[];
};

export type AutomationRule = {
  id: string;
  name: string;
  triggerType: "event" | "schedule";
  triggerEvent: string | null;
  schedule: string | null;
  enabled: boolean;
  actions: Array<Record<string, unknown>>;
  runCount: number;
  lastRunAt: string | null;
  lastError: string | null;
};

export type WorkflowAssignmentRule = {
  id: string;
  workflowId: string;
  fromState: string;
  toState: string;
  role: string;
  delegateRole: string | null;
  delegateStartsAt: string | null;
  delegateEndsAt: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  active: boolean;
};

export type WorkflowEscalationRule = {
  id: string;
  workflowId: string;
  fromState: string;
  toState: string;
  targetRole: string;
  dueInHours: number;
  escalationRole: string;
  notificationChannel: "email" | "in_app" | "slack" | "webhook";
  active: boolean;
};

export type CustomizationSnapshot = {
  customFields: CustomFieldDefinition[];
  views: ViewDefinition[];
  automationRules: AutomationRule[];
  workflowAssignmentRules: WorkflowAssignmentRule[];
  workflowEscalationRules: WorkflowEscalationRule[];
  enabledModules: string[];
};

export type CreateCustomFieldInput = {
  entityType: string;
  key: string;
  label: string;
  fieldType: CustomFieldDefinition["fieldType"];
  required: boolean;
  options: string[];
  displayOrder: number;
};

export type RecordPaymentInput = {
  invoiceId: string;
  amount: Money;
  method: string;
  receivedAt: string;
};

export type CreateBankTransactionInput = {
  bankAccountId: string;
  reference: string;
  direction: BankTransaction["direction"];
  amount: Money;
  transactionDate: string;
  matchedEntity?: string | null | undefined;
  matchedEntityId?: string | null | undefined;
};

export type ReconcileBankAccountInput = {
  bankAccountId: string;
  statementDate: string;
  statementBalance: Money;
  transactionIds: string[];
};

export type CloseFiscalPeriodInput = {
  fiscalPeriodId: string;
  closedAt: string;
};

export type AllocateLandedCostInput = {
  purchaseReceiptId: string;
  amount: Money;
  method: LandedCostAllocation["method"];
};

export type CreateFixedAssetInput = {
  assetTag: string;
  name: string;
  purchaseDate: string;
  cost: Money;
  usefulLifeMonths: number;
};

export type RunDepreciationInput = {
  fixedAssetId: string;
  runDate: string;
};

export type SetExchangeRateInput = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  effectiveDate: string;
};

export type CreateSupplierInput = {
  code: string;
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
};

export type CreateMaterialRequestInput = {
  requester: string;
  requiredBy: string;
  lines: SalesDocumentLine[];
};

export type CreatePurchaseOrderInput = {
  supplierId: string;
  expectedDate: string;
  lines: SalesDocumentLine[];
};

export type SupplierPaymentInput = {
  purchaseInvoiceId: string;
  amount: Money;
  method: string;
  paidAt: string;
};

export type CreateStockReservationInput = {
  productId: string;
  quantity: number;
  sourceEntity: string;
  sourceId: string;
};

export type CreateStockTransferInput = {
  productId: string;
  fromBinId: string;
  toBinId: string;
  quantity: number;
};

export type CreateCycleCountInput = {
  productId: string;
  binId: string;
  countedQuantity: number;
};

export type CreatePickListInput = {
  salesOrderId: string;
};

export type ConfirmPickTaskInput = {
  pickTaskId: string;
  pickedQuantity: number;
  barcode: string;
};

export type PackPickListInput = {
  pickListId: string;
  packageCode: string;
};

export type ShipPackInput = {
  packRecordId: string;
  carrier: string;
  trackingNumber: string;
};

export type CreatePutAwayTasksInput = {
  purchaseReceiptId: string;
};

export type ConfirmPutAwayTaskInput = {
  putAwayTaskId: string;
  barcode: string;
};

export type CreateProductionPlanInput = {
  productId: string;
  demandQuantity: number;
  demandDate: string;
  sourceEntity: string;
  sourceId: string;
};

export type CreateQualityInspectionInput = {
  templateId: string;
  traceRecordId: string;
  inspectedBy: string;
  results: Array<{ checkpoint: string; passed: boolean; note: string }>;
};

export type StartJobCardInput = {
  jobCardId: string;
  operator: string;
};

export type CompleteJobCardInput = {
  jobCardId: string;
  actualMinutes: number;
};

export type RecordDowntimeInput = {
  workCenterId: string;
  jobCardId?: string | null | undefined;
  reason: string;
  minutes: number;
};

export type CreateRecallInput = {
  lotNumber: string;
  reason: string;
};

export type OpenPosShiftInput = {
  registerId: string;
  openedBy: string;
  openingCash: Money;
};

export type ClosePosShiftInput = {
  shiftId: string;
  closingCash: Money;
};

export type CheckoutPosSaleInput = {
  shiftId: string;
  customerId: string;
  tenderType: PosSale["tenderType"];
  lines: SalesDocumentLine[];
};

export type PublishChannelCatalogInput = {
  channelId: string;
  productIds: string[];
};

export type IngestChannelOrderInput = {
  channelId: string;
  externalOrderId: string;
  customerId: string;
  lines: SalesDocumentLine[];
};

export type RunReportInput = {
  reportId: string;
};

export type CreateSavedReportInput = {
  name: string;
  entityType: string;
  columns: string[];
  filters: SavedReport["filters"];
  parameters: SavedReport["parameters"];
  sorts: SavedReport["sorts"];
  groupBy: string[];
  chart: SavedReport["chart"];
  owner: string;
};

export type CreateExportJobInput = {
  reportId: string;
  format: "csv" | "json";
};

export type CreatePrintFormatInput = {
  name: string;
  entityType: string;
  template: string;
  blocks: PrintFormat["blocks"];
  active: boolean;
};

export type PreviewReportInput = {
  reportId: string;
};

export type PreviewPrintFormatInput = {
  printFormatId: string;
  recordId: string;
};

export type CreateApiKeyInput = {
  name: string;
  scopes: string[];
};

export type DispatchWebhookInput = {
  subscriptionId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export type PublishOutboxEventInput = {
  eventType: string;
  payload: Record<string, unknown>;
};

export type MaterializeWorkflowTasksInput = {
  tasks: WorkflowTask[];
};

export type CompleteWorkflowTaskInput = {
  workflowId: string;
  entity: string;
  documentId: string;
  completedAction: string;
  previousState: string;
  currentState: string;
};

export type ReassignWorkflowTaskInput = {
  taskId: string;
  role: string;
  actorId: string;
  reason?: string | null | undefined;
};

export type SnoozeWorkflowTaskInput = {
  taskId: string;
  dueAt: string;
  actorId: string;
  reason: string;
};

export type RetryWorkflowTaskNotificationInput = {
  taskId: string;
  notification: "assigned" | "cancelled" | "completed" | "escalated";
  actorId: string;
  reason?: string | null | undefined;
};

export type CreateAutomationRuleInput = {
  name: string;
  triggerEvent: string;
  enabled: boolean;
  actions: Array<Record<string, unknown>>;
};

export type CreateWorkflowAssignmentRuleInput = {
  workflowId: string;
  fromState: string;
  toState: string;
  role: string;
  delegateRole?: string | null | undefined;
  delegateStartsAt?: string | null | undefined;
  delegateEndsAt?: string | null | undefined;
  minAmount?: number | null | undefined;
  maxAmount?: number | null | undefined;
  active: boolean;
};

export type CreateWorkflowEscalationRuleInput = {
  workflowId: string;
  fromState: string;
  toState: string;
  targetRole: string;
  dueInHours: number;
  escalationRole: string;
  notificationChannel: WorkflowEscalationRule["notificationChannel"];
  active: boolean;
};

export type CreateLeadInput = {
  companyName: string;
  contactName: string;
  email: string;
  source: string;
  owner: string;
};

export type CreateProjectInput = {
  code: string;
  name: string;
  customerName: string;
  budget: Money;
  startDate: string;
  endDate: string;
};

export type CreateServiceCaseInput = {
  customerName: string;
  subject: string;
  priority: ServiceCase["priority"];
  owner: string;
};

export type CreateLeaveRequestInput = {
  employeeId: string;
  leaveType: LeaveRequest["leaveType"];
  startDate: string;
  endDate: string;
};

export type RecordAttendanceInput = {
  employeeId: string;
  workDate: string;
  checkIn: string;
  checkOut: string;
};

export type SubmitExpenseClaimInput = {
  employeeId: string;
  category: string;
  description: string;
  amount: Money;
  submittedAt: string;
};

export type ExpenseClaimStatusInput = {
  id: string;
  approvedAt?: string | undefined;
  paidAt?: string | undefined;
};

export type CreateEmployeeAdvanceInput = {
  employeeId: string;
  amount: Money;
  requestedAt: string;
};

export type PayEmployeeAdvanceInput = {
  id: string;
  paidAt: string;
  paymentReference: string;
};

export type RunPayrollInput = {
  periodStart: string;
  periodEnd: string;
  postedAt: string;
};

export type WorkflowInstanceLookupInput = {
  workflowId: string;
  document: WorkflowDocumentRef;
};

export type EnsureWorkflowInstanceInput = WorkflowInstanceLookupInput & {
  state: string;
  startedAt?: string | undefined;
  updatedAt?: string | undefined;
};

export type PersistedDocumentTransitionInput = DocumentTransitionInput & {
  workflowTransition?: WorkflowTransitionRecord | undefined;
};

type WorkflowPersistenceClient = Pick<
  Prisma.TransactionClient,
  "workflowInstance" | "workflowTransition"
>;

type PrismaWorkflowTransitionRecord = {
  id: string;
  workflowId: string;
  entity: string;
  documentId: string;
  actorId: string;
  fromState: string;
  toState: string;
  reason: string | null;
  occurredAt: Date;
};

type PrismaWorkflowInstanceRecord = {
  id: string;
  workflowId: string;
  entity: string;
  documentId: string;
  state: string;
  startedAt: Date;
  updatedAt: Date;
  transitions: PrismaWorkflowTransitionRecord[];
};

export type ErpRepository = {
  tenant(tenantId: string): Promise<{ id: string; name: string; slug: string }>;
  sales(tenantId: string): Promise<SalesSnapshot>;
  accounting(tenantId: string): Promise<AccountingSnapshot>;
  procurement(tenantId: string): Promise<ProcurementSnapshot>;
  inventory(tenantId: string): Promise<InventorySnapshot>;
  manufacturing(tenantId: string): Promise<ManufacturingSnapshot>;
  quality(tenantId: string): Promise<QualitySnapshot>;
  commerce(tenantId: string): Promise<CommerceSnapshot>;
  hr(tenantId: string): Promise<HrSnapshot>;
  reporting(tenantId: string): Promise<ReportingSnapshot>;
  integration(tenantId: string): Promise<IntegrationSnapshot>;
  operations(tenantId: string): Promise<OperationsSnapshot>;
  customization(tenantId: string): Promise<CustomizationSnapshot>;
  auditTrail(tenantId: string): Promise<AuditEvent[]>;
  workflowInstance(
    tenantId: string,
    input: WorkflowInstanceLookupInput,
  ): Promise<WorkflowInstance | null>;
  ensureWorkflowInstance(
    tenantId: string,
    input: EnsureWorkflowInstanceInput,
  ): Promise<WorkflowInstance>;
  recordWorkflowTransition(
    tenantId: string,
    transition: WorkflowTransitionRecord,
  ): Promise<WorkflowInstance>;
  createCustomer(
    tenantId: string,
    input: CreateCustomerInput,
  ): Promise<Customer>;
  updateCustomer(
    tenantId: string,
    input: UpdateCustomerInput,
  ): Promise<Customer>;
  createProduct(tenantId: string, input: CreateProductInput): Promise<Product>;
  updateProduct(tenantId: string, input: UpdateProductInput): Promise<Product>;
  transitionQuote(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ): Promise<Quote>;
  transitionOrder(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ): Promise<SalesOrder>;
  transitionInvoice(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ): Promise<Invoice>;
  generateOrderFromQuote(
    tenantId: string,
    quoteId: string,
  ): Promise<SalesOrder>;
  generateInvoiceFromOrder(tenantId: string, orderId: string): Promise<Invoice>;
  createCustomField(
    tenantId: string,
    input: CreateCustomFieldInput,
  ): Promise<CustomFieldDefinition>;
  createAutomationRule(
    tenantId: string,
    input: CreateAutomationRuleInput,
  ): Promise<AutomationRule>;
  createWorkflowAssignmentRule(
    tenantId: string,
    input: CreateWorkflowAssignmentRuleInput,
  ): Promise<WorkflowAssignmentRule>;
  createWorkflowEscalationRule(
    tenantId: string,
    input: CreateWorkflowEscalationRuleInput,
  ): Promise<WorkflowEscalationRule>;
  setModuleEnabled(
    tenantId: string,
    moduleId: string,
    enabled: boolean,
  ): Promise<string[]>;
  recordPayment(tenantId: string, input: RecordPaymentInput): Promise<Payment>;
  createBankTransaction(
    tenantId: string,
    input: CreateBankTransactionInput,
  ): Promise<BankTransaction>;
  reconcileBankAccount(
    tenantId: string,
    input: ReconcileBankAccountInput,
  ): Promise<BankReconciliation>;
  closeFiscalPeriod(
    tenantId: string,
    input: CloseFiscalPeriodInput,
  ): Promise<PeriodClose>;
  allocateLandedCost(
    tenantId: string,
    input: AllocateLandedCostInput,
  ): Promise<LandedCostAllocation>;
  createFixedAsset(
    tenantId: string,
    input: CreateFixedAssetInput,
  ): Promise<FixedAsset>;
  runDepreciation(
    tenantId: string,
    input: RunDepreciationInput,
  ): Promise<DepreciationRun>;
  setExchangeRate(
    tenantId: string,
    input: SetExchangeRateInput,
  ): Promise<ExchangeRate>;
  createSupplier(
    tenantId: string,
    input: CreateSupplierInput,
  ): Promise<Supplier>;
  createMaterialRequest(
    tenantId: string,
    input: CreateMaterialRequestInput,
  ): Promise<MaterialRequest>;
  createPurchaseOrder(
    tenantId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrder>;
  transitionPurchaseOrder(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ): Promise<PurchaseOrder>;
  receivePurchaseOrder(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseReceipt>;
  createPurchaseInvoiceFromOrder(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseInvoice>;
  payPurchaseInvoice(
    tenantId: string,
    input: SupplierPaymentInput,
  ): Promise<SupplierPayment>;
  reserveStock(
    tenantId: string,
    input: CreateStockReservationInput,
  ): Promise<StockReservation>;
  transferStock(
    tenantId: string,
    input: CreateStockTransferInput,
  ): Promise<StockTransfer>;
  postCycleCount(
    tenantId: string,
    input: CreateCycleCountInput,
  ): Promise<CycleCount>;
  createPickList(
    tenantId: string,
    input: CreatePickListInput,
  ): Promise<PickList>;
  confirmPickTask(
    tenantId: string,
    input: ConfirmPickTaskInput,
  ): Promise<PickTask>;
  packPickList(tenantId: string, input: PackPickListInput): Promise<PackRecord>;
  shipPackRecord(tenantId: string, input: ShipPackInput): Promise<Shipment>;
  createPutAwayTasks(
    tenantId: string,
    input: CreatePutAwayTasksInput,
  ): Promise<PutAwayTask[]>;
  confirmPutAwayTask(
    tenantId: string,
    input: ConfirmPutAwayTaskInput,
  ): Promise<PutAwayTask>;
  createProductionPlan(
    tenantId: string,
    input: CreateProductionPlanInput,
  ): Promise<ProductionPlan>;
  createWorkOrderFromSuggestion(
    tenantId: string,
    suggestionId: string,
  ): Promise<WorkOrder>;
  releaseWorkOrder(tenantId: string, workOrderId: string): Promise<WorkOrder>;
  startJobCard(tenantId: string, input: StartJobCardInput): Promise<JobCard>;
  completeJobCard(
    tenantId: string,
    input: CompleteJobCardInput,
  ): Promise<JobCard>;
  recordDowntime(
    tenantId: string,
    input: RecordDowntimeInput,
  ): Promise<DowntimeEntry>;
  completeWorkOrder(tenantId: string, workOrderId: string): Promise<WorkOrder>;
  traceGenealogy(
    tenantId: string,
    traceRecordId: string,
  ): Promise<TraceGenealogy>;
  createQualityInspection(
    tenantId: string,
    input: CreateQualityInspectionInput,
  ): Promise<QualityInspection>;
  createRecall(tenantId: string, input: CreateRecallInput): Promise<Recall>;
  openPosShift(tenantId: string, input: OpenPosShiftInput): Promise<PosShift>;
  closePosShift(tenantId: string, input: ClosePosShiftInput): Promise<PosShift>;
  checkoutPosSale(
    tenantId: string,
    input: CheckoutPosSaleInput,
  ): Promise<PosSale>;
  publishChannelCatalog(
    tenantId: string,
    input: PublishChannelCatalogInput,
  ): Promise<ChannelCatalogItem[]>;
  ingestChannelOrder(
    tenantId: string,
    input: IngestChannelOrderInput,
  ): Promise<ChannelOrder>;
  recordAttendance(
    tenantId: string,
    input: RecordAttendanceInput,
  ): Promise<AttendanceRecord>;
  submitExpenseClaim(
    tenantId: string,
    input: SubmitExpenseClaimInput,
  ): Promise<ExpenseClaim>;
  approveExpenseClaim(
    tenantId: string,
    input: ExpenseClaimStatusInput,
  ): Promise<ExpenseClaim>;
  payExpenseClaim(
    tenantId: string,
    input: ExpenseClaimStatusInput,
  ): Promise<ExpenseClaim>;
  createEmployeeAdvance(
    tenantId: string,
    input: CreateEmployeeAdvanceInput,
  ): Promise<EmployeeAdvance>;
  payEmployeeAdvance(
    tenantId: string,
    input: PayEmployeeAdvanceInput,
  ): Promise<EmployeeAdvance>;
  runPayroll(tenantId: string, input: RunPayrollInput): Promise<PayrollRun>;
  createSavedReport(
    tenantId: string,
    input: CreateSavedReportInput,
  ): Promise<SavedReport>;
  runReport(tenantId: string, input: RunReportInput): Promise<ReportRun>;
  previewReport(
    tenantId: string,
    input: PreviewReportInput,
  ): Promise<ReportPreview>;
  createExportJob(
    tenantId: string,
    input: CreateExportJobInput,
  ): Promise<ExportJob>;
  createPrintFormat(
    tenantId: string,
    input: CreatePrintFormatInput,
  ): Promise<PrintFormat>;
  previewPrintFormat(
    tenantId: string,
    input: PreviewPrintFormatInput,
  ): Promise<PrintPreview>;
  createApiKey(
    tenantId: string,
    input: CreateApiKeyInput,
  ): Promise<ApiKeyRecord>;
  dispatchWebhook(
    tenantId: string,
    input: DispatchWebhookInput,
  ): Promise<WebhookDelivery>;
  retryWebhookDelivery(
    tenantId: string,
    deliveryId: string,
  ): Promise<WebhookDelivery>;
  publishOutboxEvent(
    tenantId: string,
    input: PublishOutboxEventInput,
  ): Promise<OutboxEvent>;
  dispatchOutboxEvent(
    tenantId: string,
    outboxEventId: string,
  ): Promise<OutboxEvent>;
  materializeWorkflowTasks(
    tenantId: string,
    input: MaterializeWorkflowTasksInput,
  ): Promise<WorkflowTaskRecord[]>;
  completeWorkflowTask(
    tenantId: string,
    input: CompleteWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord[]>;
  reassignWorkflowTask(
    tenantId: string,
    input: ReassignWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord>;
  snoozeWorkflowTask(
    tenantId: string,
    input: SnoozeWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord>;
  retryWorkflowTaskNotification(
    tenantId: string,
    input: RetryWorkflowTaskNotificationInput,
  ): Promise<WorkflowTaskRecord>;
  createLead(tenantId: string, input: CreateLeadInput): Promise<Lead>;
  createProject(tenantId: string, input: CreateProjectInput): Promise<Project>;
  createServiceCase(
    tenantId: string,
    input: CreateServiceCaseInput,
  ): Promise<ServiceCase>;
  createLeaveRequest(
    tenantId: string,
    input: CreateLeaveRequestInput,
  ): Promise<LeaveRequest>;
  closeServiceCase(tenantId: string, caseId: string): Promise<ServiceCase>;
};

const tenant = {
  id: "ten_demo",
  name: "Acme Operations",
  slug: "acme",
};

function todayId(prefix: string, count: number): string {
  return `${prefix}_${String(count + 1).padStart(3, "0")}`;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function money(amount: unknown, currency: string): Money {
  return {
    amount: Number(amount),
    currency,
  };
}

export class MemoryErpRepository implements ErpRepository {
  constructor() {
    return new Proxy(this, {
      get: (target, property, receiver) => {
        const value = Reflect.get(target, property, receiver);
        if (typeof value !== "function") {
          return value;
        }
        return async (...args: unknown[]) => {
          const [tenantId] = args;
          if (typeof tenantId === "string") {
            target.assertTenant(tenantId);
          }
          return await Reflect.apply(value, target, args);
        };
      },
    });
  }

  private readonly data: SalesSnapshot = {
    customers: structuredClone(demoSalesData.customers),
    products: structuredClone(demoSalesData.products),
    quotes: structuredClone(demoSalesData.quotes),
    orders: structuredClone(demoSalesData.orders),
    invoices: structuredClone(demoSalesData.invoices),
    stockMovements: [],
  };

  private readonly procurementData: ProcurementSnapshot = {
    suppliers: [...demoProcurementData.suppliers],
    materialRequests: [...demoProcurementData.materialRequests],
    rfqs: [...demoProcurementData.rfqs],
    supplierQuotations: [...demoProcurementData.supplierQuotations],
    purchaseOrders: [...demoProcurementData.purchaseOrders],
    purchaseReceipts: [...demoProcurementData.purchaseReceipts],
    purchaseInvoices: [...demoProcurementData.purchaseInvoices],
    supplierPayments: [...demoProcurementData.supplierPayments],
  };

  private readonly inventoryData: InventorySnapshot = {
    warehouses: [...demoInventoryData.warehouses],
    bins: [...demoInventoryData.bins],
    ledger: demoSalesData.products.map((product): StockLedgerEntry => ({
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
    reorderPoints: [...demoInventoryData.reorderPoints],
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
    pickLists: [...demoInventoryData.pickLists],
    pickTasks: [...demoInventoryData.pickTasks],
    packRecords: [...demoInventoryData.packRecords],
    shipments: [...demoInventoryData.shipments],
    putAwayTasks: [...demoInventoryData.putAwayTasks],
    barcodeScans: [...demoInventoryData.barcodeScans],
    reconciled: true,
  };

  private readonly manufacturingData: ManufacturingSnapshot = {
    boms: [...demoManufacturingData.boms],
    workCenters: [...demoManufacturingData.workCenters],
    routings: [...demoManufacturingData.routings],
    workOrders: [],
    jobCards: [],
    downtimeEntries: [],
    capacitySchedule: [],
    productionPlans: [],
    mrpSuggestions: [],
  };

  private readonly qualityData: QualitySnapshot = {
    traceRecords: [...demoQualityData.traceRecords],
    traceMovements: [...demoQualityData.traceMovements],
    inspectionTemplates: [...demoQualityData.inspectionTemplates],
    inspections: [],
    nonConformances: [],
    correctiveActions: [],
    supplierScorecards: [...demoQualityData.supplierScorecards],
    recalls: [],
  };

  private readonly reportingData: ReportingSnapshot = {
    reports: [...demoReportingData.reports],
    runs: [],
    printFormats: [...demoReportingData.printFormats],
    exportJobs: [],
    dashboards: [...demoReportingData.dashboards],
    scheduledDeliveries: [],
  };

  private readonly commerceData: CommerceSnapshot = {
    channels: [...demoCommerceData.channels],
    priceLists: [...demoCommerceData.priceLists],
    posProfiles: [...demoCommerceData.posProfiles],
    registers: [...demoCommerceData.registers],
    shifts: [],
    sales: [],
    catalogItems: [],
    channelOrders: [],
  };

  private readonly hrData: HrSnapshot = {
    departments: [...demoHrData.departments],
    workShifts: [...demoHrData.workShifts],
    attendance: [],
    expenseClaims: [],
    employeeAdvances: [],
    salaryStructures: [...demoHrData.salaryStructures],
    payrollRuns: [],
    payslips: [],
  };

  private readonly integrationData: IntegrationSnapshot = {
    apiKeys: [...demoIntegrationData.apiKeys],
    webhookSubscriptions: [...demoIntegrationData.webhookSubscriptions],
    webhookDeliveries: [...demoIntegrationData.webhookDeliveries],
    deadLetters: [...demoIntegrationData.deadLetters],
    outboxEvents: [...demoIntegrationData.outboxEvents],
    workflowTasks: [...demoIntegrationData.workflowTasks],
    mappings: [...demoIntegrationData.mappings],
    connectors: [...demoIntegrationData.connectors],
  };

  private readonly operationsData: OperationsSnapshot = {
    leads: [...demoOperationsData.leads],
    opportunities: [...demoOperationsData.opportunities],
    projects: [...demoOperationsData.projects],
    tasks: [...demoOperationsData.tasks],
    employees: [...demoOperationsData.employees],
    leaveRequests: [...demoOperationsData.leaveRequests],
    serviceCases: [...demoOperationsData.serviceCases],
  };

  private readonly audit: AuditEvent[] = [
    {
      id: "aud_001",
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "Quote",
      entityId: "quo_001",
      action: "submitted",
      message: "Quote Q-2026-0001 submitted for approval.",
      createdAt: "2026-07-01T03:15:00.000Z",
    },
    {
      id: "aud_002",
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "SalesOrder",
      entityId: "ord_001",
      action: "approved",
      message: "Sales order SO-2026-0001 approved.",
      createdAt: "2026-07-01T04:20:00.000Z",
    },
    {
      id: "aud_003",
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "Invoice",
      entityId: "inv_001",
      action: "posted",
      message: "Invoice INV-2026-0001 posted.",
      createdAt: "2026-07-01T05:05:00.000Z",
    },
  ];

  private readonly customFields: CustomFieldDefinition[] = [
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
  ];

  private readonly views: ViewDefinition[] = [
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
  ];

  private readonly automationRules: AutomationRule[] = [
    {
      id: "auto_customer_created_notify_owner",
      name: "Customer created owner notification",
      triggerType: "event",
      triggerEvent: "sales.customer.created",
      schedule: null,
      enabled: false,
      actions: [
        { type: "audit", message: "Notify owner when a customer is created." },
      ],
      runCount: 0,
      lastRunAt: null,
      lastError: null,
    },
  ];

  private readonly workflowAssignmentRules: WorkflowAssignmentRule[] = [
    {
      id: "wfar_quote_high_value_approval",
      workflowId: "sales.quote",
      fromState: "submitted",
      toState: "approved",
      role: "admin",
      delegateRole: "buyer",
      delegateStartsAt: "2026-07-01T00:00:00.000Z",
      delegateEndsAt: "2026-12-31T23:59:59.000Z",
      minAmount: 50_000,
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
  ];

  private readonly workflowEscalationRules: WorkflowEscalationRule[] = [
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
    {
      id: "wfer_purchase_order_approval_escalation",
      workflowId: "procurement.purchase-order",
      fromState: "submitted",
      toState: "approved",
      targetRole: "admin",
      dueInHours: 48,
      escalationRole: "manager",
      notificationChannel: "webhook",
      active: true,
    },
  ];

  private enabledModules = [
    "accounting",
    "commerce",
    "core",
    "hr",
    "integration",
    "inventory",
    "manufacturing",
    "operations",
    "procurement",
    "quality",
    "reporting",
    "sales",
  ];

  private readonly accounts: Account[] = [
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
      id: "acct_inventory",
      code: "1200",
      name: "Inventory",
      type: "asset",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_fixed_assets",
      code: "1300",
      name: "Fixed Assets",
      type: "asset",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_accum_depr",
      code: "1310",
      name: "Accumulated Depreciation",
      type: "asset",
      normalBalance: "credit",
      active: true,
    },
    {
      id: "acct_employee_advances",
      code: "1150",
      name: "Employee Advances",
      type: "asset",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_ap",
      code: "2000",
      name: "Accounts Payable",
      type: "liability",
      normalBalance: "credit",
      active: true,
    },
    {
      id: "acct_payroll_payable",
      code: "2200",
      name: "Payroll Payable",
      type: "liability",
      normalBalance: "credit",
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
    {
      id: "acct_landed_cost",
      code: "5000",
      name: "Landed Cost",
      type: "expense",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_depr_expense",
      code: "5100",
      name: "Depreciation Expense",
      type: "expense",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_payroll_expense",
      code: "5200",
      name: "Payroll Expense",
      type: "expense",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_employee_expense",
      code: "5300",
      name: "Employee Expense",
      type: "expense",
      normalBalance: "debit",
      active: true,
    },
    {
      id: "acct_tax",
      code: "2100",
      name: "Sales Tax Payable",
      type: "liability",
      normalBalance: "credit",
      active: true,
    },
  ];

  private readonly fiscalPeriods: FiscalPeriod[] = [
    {
      id: "fp_2026",
      name: "FY2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "open",
    },
  ];

  private readonly taxRates: TaxRate[] = [
    { id: "tax_standard", name: "Standard", rate: 0 },
  ];
  private readonly journalEntries: JournalEntry[] = [];
  private readonly payments: Payment[] = [];
  private readonly bankAccounts: BankAccount[] = [
    {
      id: "bank_operating",
      code: "OPERATING",
      name: "Operating Bank",
      currency: "USD",
      balance: { amount: 0, currency: "USD" },
      lastReconciledAt: null,
    },
  ];
  private readonly bankTransactions: BankTransaction[] = [];
  private readonly bankReconciliations: BankReconciliation[] = [];
  private readonly periodCloses: PeriodClose[] = [];
  private readonly landedCostAllocations: LandedCostAllocation[] = [];
  private readonly fixedAssets: FixedAsset[] = [];
  private readonly depreciationRuns: DepreciationRun[] = [];
  private readonly exchangeRates: ExchangeRate[] = [
    {
      id: "fx_usd_php",
      baseCurrency: "USD",
      quoteCurrency: "PHP",
      rate: 58,
      effectiveDate: "2026-07-01",
    },
  ];
  private readonly workflowInstances = new Map<string, WorkflowInstance>();

  async tenant(tenantId: string) {
    this.assertTenant(tenantId);
    return tenant;
  }

  async sales(tenantId: string) {
    this.assertTenant(tenantId);
    return this.data;
  }

  async accounting(tenantId: string): Promise<AccountingSnapshot> {
    this.assertTenant(tenantId);
    return {
      accounts: [...this.accounts],
      fiscalPeriods: [...this.fiscalPeriods],
      taxRates: [...this.taxRates],
      journalEntries: [...this.journalEntries],
      payments: [...this.payments],
      aging: buildMemoryAging(
        this.data.invoices,
        this.payments,
        this.procurementData.purchaseInvoices,
        this.procurementData.supplierPayments,
      ),
      bankAccounts: [...this.bankAccounts],
      bankTransactions: [...this.bankTransactions],
      bankReconciliations: [...this.bankReconciliations],
      periodCloses: [...this.periodCloses],
      landedCostAllocations: [...this.landedCostAllocations],
      fixedAssets: [...this.fixedAssets],
      depreciationRuns: [...this.depreciationRuns],
      exchangeRates: [...this.exchangeRates],
      trialBalance: buildTrialBalance(this.accounts, this.journalEntries),
    };
  }

  async procurement(tenantId: string): Promise<ProcurementSnapshot> {
    this.assertTenant(tenantId);
    return this.procurementData;
  }

  async inventory(tenantId: string): Promise<InventorySnapshot> {
    this.assertTenant(tenantId);
    return {
      ...this.inventoryData,
      reconciled: this.memoryInventoryReconciles(),
    };
  }

  async manufacturing(tenantId: string): Promise<ManufacturingSnapshot> {
    this.assertTenant(tenantId);
    return {
      ...this.manufacturingData,
      capacitySchedule: this.memoryCapacitySchedule(),
    };
  }

  async quality(tenantId: string): Promise<QualitySnapshot> {
    this.assertTenant(tenantId);
    return this.qualityData;
  }

  async commerce(tenantId: string): Promise<CommerceSnapshot> {
    this.assertTenant(tenantId);
    return this.commerceData;
  }

  async hr(tenantId: string): Promise<HrSnapshot> {
    this.assertTenant(tenantId);
    return this.hrData;
  }

  async reporting(tenantId: string): Promise<ReportingSnapshot> {
    this.assertTenant(tenantId);
    return this.reportingData;
  }

  async integration(tenantId: string): Promise<IntegrationSnapshot> {
    this.assertTenant(tenantId);
    return this.integrationData;
  }

  async operations(tenantId: string): Promise<OperationsSnapshot> {
    this.assertTenant(tenantId);
    return this.operationsData;
  }

  async customization(tenantId: string): Promise<CustomizationSnapshot> {
    this.assertTenant(tenantId);
    return {
      customFields: [...this.customFields].sort(byDisplayOrder),
      views: [...this.views],
      automationRules: [...this.automationRules],
      workflowAssignmentRules: [...this.workflowAssignmentRules],
      workflowEscalationRules: [...this.workflowEscalationRules],
      enabledModules: [...this.enabledModules],
    };
  }

  async auditTrail(tenantId: string) {
    this.assertTenant(tenantId);
    return this.audit.slice(0, 12);
  }

  private assertTenant(tenantId: string): void {
    if (tenantId !== tenant.id) {
      throw new Error(`Unknown memory repository tenant: ${tenantId}`);
    }
  }

  async workflowInstance(
    tenantId: string,
    input: WorkflowInstanceLookupInput,
  ): Promise<WorkflowInstance | null> {
    this.assertTenant(tenantId);
    return this.cloneWorkflowInstance(
      this.workflowInstances.get(workflowKey(tenantId, input)) ?? null,
    );
  }

  async ensureWorkflowInstance(
    tenantId: string,
    input: EnsureWorkflowInstanceInput,
  ): Promise<WorkflowInstance> {
    this.assertTenant(tenantId);
    return this.cloneWorkflowInstance(
      this.ensureMemoryWorkflowInstance(tenantId, input),
    ) as WorkflowInstance;
  }

  async recordWorkflowTransition(
    tenantId: string,
    transition: WorkflowTransitionRecord,
  ): Promise<WorkflowInstance> {
    this.assertTenant(tenantId);
    const instance = this.ensureMemoryWorkflowInstance(tenantId, {
      workflowId: transition.workflowId,
      document: transition.document,
      state: transition.from,
      startedAt: transition.occurredAt,
      updatedAt: transition.occurredAt,
    });
    if (!instance.transitions.some((record) => record.id === transition.id)) {
      instance.transitions.push(transition);
    }
    instance.state = transition.to;
    instance.updatedAt = transition.occurredAt;
    this.recordMemoryAudit(
      "WorkflowTransition",
      transition.id,
      "recorded",
      `Workflow ${transition.workflowId} moved ${transition.document.entity} ${transition.document.id} to ${transition.to}.`,
    );
    return this.cloneWorkflowInstance(instance) as WorkflowInstance;
  }

  async createCustomer(tenantId: string, input: CreateCustomerInput) {
    this.assertTenant(tenantId);
    const customer: Customer = {
      id: todayId("cus", this.data.customers.length),
      code: input.code,
      name: input.name,
      status: "active",
      owner: input.owner,
      email: input.email,
      creditLimit: input.creditLimit,
      customFields: input.customFields ?? {},
    };
    this.data.customers.unshift(customer);
    this.audit.unshift({
      id: todayId("aud", this.audit.length),
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "Customer",
      entityId: customer.id,
      action: "created",
      message: `Customer ${customer.name} created.`,
      createdAt: new Date().toISOString(),
    });
    return customer;
  }

  async createProduct(_tenantId: string, input: CreateProductInput) {
    const product: Product = {
      id: todayId("prd", this.data.products.length),
      sku: input.sku,
      name: input.name,
      category: input.category,
      price: input.price,
      stockOnHand: input.stockOnHand,
    };
    this.data.products.unshift(product);
    if (product.stockOnHand > 0) {
      this.recordMemoryLedger(
        product,
        product.stockOnHand,
        "MAIN-01",
        "OpeningBalance",
        `opening_${product.id}`,
      );
    }
    this.audit.unshift({
      id: todayId("aud", this.audit.length),
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "Product",
      entityId: product.id,
      action: "created",
      message: `Product ${product.name} created.`,
      createdAt: new Date().toISOString(),
    });
    return product;
  }

  async createSupplier(
    _tenantId: string,
    input: CreateSupplierInput,
  ): Promise<Supplier> {
    const supplier: Supplier = {
      id: todayId("sup", this.procurementData.suppliers.length),
      code: input.code,
      name: input.name,
      email: input.email,
      phone: input.phone,
      paymentTerms: input.paymentTerms,
      status: "active",
    };
    this.procurementData.suppliers.unshift(supplier);
    this.recordMemoryAudit(
      "Supplier",
      supplier.id,
      "created",
      `Supplier ${supplier.name} created.`,
    );
    return supplier;
  }

  async createMaterialRequest(
    _tenantId: string,
    input: CreateMaterialRequestInput,
  ): Promise<MaterialRequest> {
    const request: MaterialRequest = {
      id: todayId("mr", this.procurementData.materialRequests.length),
      number: nextDocumentNumber(
        "MR",
        this.procurementData.materialRequests.length,
      ),
      requester: input.requester,
      status: "draft",
      requiredBy: input.requiredBy,
      lines: input.lines,
    };
    this.procurementData.materialRequests.unshift(request);
    this.recordMemoryAudit(
      "MaterialRequest",
      request.id,
      "created",
      `Material request ${request.number} created.`,
    );
    return request;
  }

  async createPurchaseOrder(
    _tenantId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    const supplier = this.procurementData.suppliers.find(
      (record) => record.id === input.supplierId,
    );
    if (!supplier) {
      throw new Error(`Supplier not found: ${input.supplierId}`);
    }
    const order: PurchaseOrder = {
      id: todayId("po", this.procurementData.purchaseOrders.length),
      number: nextDocumentNumber(
        "PO",
        this.procurementData.purchaseOrders.length,
      ),
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: "draft",
      expectedDate: input.expectedDate,
      total: totalLines(input.lines),
      lines: input.lines,
    };
    this.procurementData.purchaseOrders.unshift(order);
    this.ensureMemoryWorkflowInstance(_tenantId, {
      workflowId: "procurement.purchase-order",
      document: { entity: "PurchaseOrder", id: order.id },
      state: order.status,
    });
    this.recordMemoryAudit(
      "PurchaseOrder",
      order.id,
      "created",
      `Purchase order ${order.number} created.`,
    );
    return order;
  }

  async transitionPurchaseOrder(
    _tenantId: string,
    input: PersistedDocumentTransitionInput,
  ): Promise<PurchaseOrder> {
    const order = this.procurementData.purchaseOrders.find(
      (record) => record.id === input.id,
    );
    if (!order) {
      throw new Error(`Purchase order not found: ${input.id}`);
    }
    const nextStatus = parseRecordStatus(input.status);
    assertRecordTransition("PurchaseOrder", order.status, nextStatus);
    order.status = nextStatus;
    if (input.workflowTransition) {
      await this.recordWorkflowTransition(_tenantId, input.workflowTransition);
    }
    this.recordMemoryAudit(
      "PurchaseOrder",
      order.id,
      "transitioned",
      `Purchase order ${order.number} moved to ${order.status}.`,
    );
    return order;
  }

  async receivePurchaseOrder(
    _tenantId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseReceipt> {
    const order = this.procurementData.purchaseOrders.find(
      (record) => record.id === purchaseOrderId,
    );
    if (!order) {
      throw new Error(`Purchase order not found: ${purchaseOrderId}`);
    }
    const existing = this.procurementData.purchaseReceipts.find(
      (receipt) => receipt.purchaseOrderId === order.id,
    );
    if (existing) {
      return existing;
    }
    if (order.status !== "approved") {
      throw new Error(
        `Purchase order ${order.number} must be approved before receipt.`,
      );
    }
    const receipt: PurchaseReceipt = {
      id: todayId("prc", this.procurementData.purchaseReceipts.length),
      number: nextDocumentNumber(
        "PRC",
        this.procurementData.purchaseReceipts.length,
      ),
      purchaseOrderId: order.id,
      supplierName: order.supplierName,
      status: "posted",
      receivedAt: new Date().toISOString(),
      lines: order.lines,
    };
    this.procurementData.purchaseReceipts.unshift(receipt);
    this.applyMemoryProcurementStock(receipt);
    this.recordMemoryAudit(
      "PurchaseReceipt",
      receipt.id,
      "posted",
      `Purchase receipt ${receipt.number} posted.`,
    );
    return receipt;
  }

  async createPurchaseInvoiceFromOrder(
    _tenantId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseInvoice> {
    const order = this.procurementData.purchaseOrders.find(
      (record) => record.id === purchaseOrderId,
    );
    if (!order) {
      throw new Error(`Purchase order not found: ${purchaseOrderId}`);
    }
    const existing = this.procurementData.purchaseInvoices.find(
      (invoice) => invoice.purchaseOrderId === order.id,
    );
    if (existing) {
      return existing;
    }
    const invoice: PurchaseInvoice = {
      id: todayId("pinv", this.procurementData.purchaseInvoices.length),
      number: nextDocumentNumber(
        "PINV",
        this.procurementData.purchaseInvoices.length,
      ),
      purchaseOrderId: order.id,
      supplierName: order.supplierName,
      status: "posted",
      dueDate: dateOnly(daysFromNow(30)),
      total: order.total,
    };
    this.procurementData.purchaseInvoices.unshift(invoice);
    this.postMemoryPurchaseInvoiceJournal(invoice);
    this.recordMemoryAudit(
      "PurchaseInvoice",
      invoice.id,
      "posted",
      `Purchase invoice ${invoice.number} posted.`,
    );
    return invoice;
  }

  async payPurchaseInvoice(
    _tenantId: string,
    input: SupplierPaymentInput,
  ): Promise<SupplierPayment> {
    const invoice = this.procurementData.purchaseInvoices.find(
      (record) => record.id === input.purchaseInvoiceId,
    );
    if (!invoice) {
      throw new Error(`Purchase invoice not found: ${input.purchaseInvoiceId}`);
    }
    const payment: SupplierPayment = {
      id: todayId("spay", this.procurementData.supplierPayments.length),
      purchaseInvoiceId: invoice.id,
      purchaseInvoiceNumber: invoice.number,
      supplierName: invoice.supplierName,
      amount: input.amount,
      method: input.method,
      paidAt: input.paidAt,
    };
    invoice.status = "paid";
    this.procurementData.supplierPayments.unshift(payment);
    this.postMemorySupplierPaymentJournal(payment);
    this.recordMemoryAudit(
      "SupplierPayment",
      payment.id,
      "recorded",
      `Supplier payment for ${invoice.number} recorded.`,
    );
    return payment;
  }

  async reserveStock(
    _tenantId: string,
    input: CreateStockReservationInput,
  ): Promise<StockReservation> {
    const product = this.requireMemoryProduct(input.productId);
    const available = this.memoryAvailableStock(product.id);
    if (available < input.quantity) {
      throw new Error(`Insufficient available stock for ${product.sku}.`);
    }
    const existing = this.inventoryData.reservations.find(
      (reservation) =>
        reservation.sourceEntity === input.sourceEntity &&
        reservation.sourceId === input.sourceId &&
        reservation.productId === input.productId,
    );
    if (existing) {
      return existing;
    }
    const reservation: StockReservation = {
      id: todayId("res", this.inventoryData.reservations.length),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      warehouseCode: "MAIN",
      binCode: "MAIN-01",
      quantity: input.quantity,
      sourceEntity: input.sourceEntity,
      sourceId: input.sourceId,
      status: "active",
    };
    this.inventoryData.reservations.unshift(reservation);
    this.recordMemoryAudit(
      "StockReservation",
      reservation.id,
      "created",
      `Reserved ${input.quantity} ${product.sku}.`,
    );
    return reservation;
  }

  async transferStock(
    _tenantId: string,
    input: CreateStockTransferInput,
  ): Promise<StockTransfer> {
    const product = this.requireMemoryProduct(input.productId);
    const fromBin = this.inventoryData.bins.find(
      (bin) => bin.id === input.fromBinId,
    );
    const toBin = this.inventoryData.bins.find(
      (bin) => bin.id === input.toBinId,
    );
    if (!fromBin || !toBin) {
      throw new Error("Transfer bins must exist.");
    }
    const transfer: StockTransfer = {
      id: todayId("stf", this.inventoryData.transfers.length),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      fromBinCode: fromBin.code,
      toBinCode: toBin.code,
      quantity: input.quantity,
      status: "posted",
      postedAt: new Date().toISOString(),
    };
    this.inventoryData.transfers.unshift(transfer);
    this.recordMemoryLedger(
      product,
      -input.quantity,
      fromBin.code,
      "StockTransfer",
      `${transfer.id}:out`,
    );
    this.recordMemoryLedger(
      product,
      input.quantity,
      toBin.code,
      "StockTransfer",
      `${transfer.id}:in`,
    );
    this.recordMemoryAudit(
      "StockTransfer",
      transfer.id,
      "posted",
      `Transferred ${input.quantity} ${product.sku}.`,
    );
    return transfer;
  }

  async postCycleCount(
    _tenantId: string,
    input: CreateCycleCountInput,
  ): Promise<CycleCount> {
    const product = this.requireMemoryProduct(input.productId);
    const bin = this.inventoryData.bins.find(
      (record) => record.id === input.binId,
    );
    if (!bin) {
      throw new Error(`Bin not found: ${input.binId}`);
    }
    const systemQuantity = this.memoryLedgerQuantity(product.id, bin.code);
    const variance = input.countedQuantity - systemQuantity;
    const count: CycleCount = {
      id: todayId("cnt", this.inventoryData.cycleCounts.length),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      binCode: bin.code,
      countedQuantity: input.countedQuantity,
      systemQuantity,
      variance,
      status: "posted",
      countedAt: new Date().toISOString(),
    };
    this.inventoryData.cycleCounts.unshift(count);
    if (variance !== 0) {
      product.stockOnHand += variance;
      this.recordMemoryLedger(
        product,
        variance,
        bin.code,
        "CycleCount",
        count.id,
      );
    }
    this.recordMemoryAudit(
      "CycleCount",
      count.id,
      "posted",
      `Cycle count for ${product.sku} posted.`,
    );
    return count;
  }

  async createPickList(
    _tenantId: string,
    input: CreatePickListInput,
  ): Promise<PickList> {
    const order = this.data.orders.find(
      (record) => record.id === input.salesOrderId,
    );
    if (!order) {
      throw new Error(`Sales order not found: ${input.salesOrderId}`);
    }
    const quote = this.data.quotes.find(
      (record) => record.id === order.quoteId,
    );
    if (!quote) {
      throw new Error(`Quote not found for sales order: ${order.id}`);
    }
    const existing = this.inventoryData.pickLists.find(
      (record) => record.salesOrderId === order.id,
    );
    if (existing) {
      return existing;
    }
    const list: PickList = {
      id: todayId("pick", this.inventoryData.pickLists.length),
      salesOrderId: order.id,
      salesOrderNumber: order.number,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    this.inventoryData.pickLists.unshift(list);
    for (const line of quote.lines) {
      const product = this.requireMemoryProduct(line.productId);
      this.inventoryData.pickTasks.unshift({
        id: todayId("ptask", this.inventoryData.pickTasks.length),
        pickListId: list.id,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        binCode: "MAIN-01",
        quantity: line.quantity,
        pickedQuantity: 0,
        status: "open",
      });
    }
    this.recordMemoryAudit(
      "PickList",
      list.id,
      "created",
      `Pick list created for ${order.number}.`,
    );
    return list;
  }

  async confirmPickTask(
    _tenantId: string,
    input: ConfirmPickTaskInput,
  ): Promise<PickTask> {
    const task = this.inventoryData.pickTasks.find(
      (record) => record.id === input.pickTaskId,
    );
    if (!task) {
      throw new Error(`Pick task not found: ${input.pickTaskId}`);
    }
    task.pickedQuantity = input.pickedQuantity;
    task.status = input.pickedQuantity >= task.quantity ? "picked" : "short";
    this.recordMemoryBarcodeScan("pick", input.barcode, "PickTask", task.id);
    const list = this.inventoryData.pickLists.find(
      (record) => record.id === task.pickListId,
    );
    if (list) {
      const tasks = this.inventoryData.pickTasks.filter(
        (record) => record.pickListId === list.id,
      );
      list.status = tasks.every((record) => record.status === "picked")
        ? "picked"
        : "picking";
    }
    this.recordMemoryAudit(
      "PickTask",
      task.id,
      task.status,
      `Pick task ${task.id} ${task.status}.`,
    );
    return task;
  }

  async packPickList(
    _tenantId: string,
    input: PackPickListInput,
  ): Promise<PackRecord> {
    const list = this.inventoryData.pickLists.find(
      (record) => record.id === input.pickListId,
    );
    if (!list) {
      throw new Error(`Pick list not found: ${input.pickListId}`);
    }
    const existing = this.inventoryData.packRecords.find(
      (record) => record.pickListId === list.id,
    );
    if (existing) {
      return existing;
    }
    const pack: PackRecord = {
      id: todayId("pack", this.inventoryData.packRecords.length),
      pickListId: list.id,
      packageCode: input.packageCode,
      status: "packed",
      packedAt: new Date().toISOString(),
    };
    this.inventoryData.packRecords.unshift(pack);
    list.status = "packed";
    this.recordMemoryBarcodeScan(
      "pack",
      input.packageCode,
      "PackRecord",
      pack.id,
    );
    this.recordMemoryAudit(
      "PackRecord",
      pack.id,
      "packed",
      `Package ${pack.packageCode} packed.`,
    );
    return pack;
  }

  async shipPackRecord(
    _tenantId: string,
    input: ShipPackInput,
  ): Promise<Shipment> {
    const pack = this.inventoryData.packRecords.find(
      (record) => record.id === input.packRecordId,
    );
    if (!pack) {
      throw new Error(`Pack record not found: ${input.packRecordId}`);
    }
    const existing = this.inventoryData.shipments.find(
      (record) => record.packRecordId === pack.id,
    );
    if (existing) {
      return existing;
    }
    const shipment: Shipment = {
      id: todayId("ship", this.inventoryData.shipments.length),
      packRecordId: pack.id,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      status: "shipped",
      shippedAt: new Date().toISOString(),
    };
    this.inventoryData.shipments.unshift(shipment);
    pack.status = "shipped";
    const list = this.inventoryData.pickLists.find(
      (record) => record.id === pack.pickListId,
    );
    if (list) {
      list.status = "shipped";
      const tasks = this.inventoryData.pickTasks.filter(
        (task) => task.pickListId === list.id,
      );
      for (const task of tasks) {
        const product = this.requireMemoryProduct(task.productId);
        this.recordMemoryTraceMovement(
          product,
          "shipment",
          "Shipment",
          shipment.id,
          task.pickedQuantity || task.quantity,
          "out",
        );
      }
    }
    this.recordMemoryBarcodeScan(
      "ship",
      input.trackingNumber,
      "Shipment",
      shipment.id,
    );
    this.recordMemoryAudit(
      "Shipment",
      shipment.id,
      "shipped",
      `Shipment ${shipment.trackingNumber} shipped.`,
    );
    return shipment;
  }

  async createPutAwayTasks(
    _tenantId: string,
    input: CreatePutAwayTasksInput,
  ): Promise<PutAwayTask[]> {
    const receipt = this.procurementData.purchaseReceipts.find(
      (record) => record.id === input.purchaseReceiptId,
    );
    if (!receipt) {
      throw new Error(`Purchase receipt not found: ${input.purchaseReceiptId}`);
    }
    const existing = this.inventoryData.putAwayTasks.filter(
      (record) => record.purchaseReceiptId === receipt.id,
    );
    if (existing.length > 0) {
      return existing;
    }
    const tasks = receipt.lines.map((line): PutAwayTask => {
      const product = this.requireMemoryProduct(line.productId);
      return {
        id: todayId("put", this.inventoryData.putAwayTasks.length),
        purchaseReceiptId: receipt.id,
        receiptNumber: receipt.number,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        fromBinCode: "QC-HOLD",
        toBinCode: "MAIN-01",
        quantity: line.quantity,
        status: "open",
      };
    });
    this.inventoryData.putAwayTasks.unshift(...tasks);
    this.recordMemoryAudit(
      "PutAwayTask",
      receipt.id,
      "created",
      `Put-away tasks created for ${receipt.number}.`,
    );
    return tasks;
  }

  async confirmPutAwayTask(
    _tenantId: string,
    input: ConfirmPutAwayTaskInput,
  ): Promise<PutAwayTask> {
    const task = this.inventoryData.putAwayTasks.find(
      (record) => record.id === input.putAwayTaskId,
    );
    if (!task) {
      throw new Error(`Put-away task not found: ${input.putAwayTaskId}`);
    }
    task.status = "completed";
    const product = this.requireMemoryProduct(task.productId);
    this.recordMemoryTraceMovement(
      product,
      "putaway",
      "PutAwayTask",
      task.id,
      task.quantity,
      "reference",
    );
    this.recordMemoryBarcodeScan(
      "putaway",
      input.barcode,
      "PutAwayTask",
      task.id,
    );
    this.recordMemoryAudit(
      "PutAwayTask",
      task.id,
      "completed",
      `Put-away task ${task.id} completed.`,
    );
    return task;
  }

  async createProductionPlan(
    _tenantId: string,
    input: CreateProductionPlanInput,
  ): Promise<ProductionPlan> {
    const product = this.requireMemoryProduct(input.productId);
    const availableQuantity = this.memoryLedgerQuantity(product.id);
    const plannedQuantity = Math.max(
      input.demandQuantity - availableQuantity,
      0,
    );
    const plan: ProductionPlan = {
      id: todayId("plan", this.manufacturingData.productionPlans.length),
      number: nextDocumentNumber(
        "PLAN",
        this.manufacturingData.productionPlans.length,
      ),
      sourceEntity: input.sourceEntity,
      sourceId: input.sourceId,
      status: "submitted",
      demandDate: input.demandDate,
      lines: [
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          demandQuantity: input.demandQuantity,
          availableQuantity,
          plannedQuantity,
        },
      ],
    };
    this.manufacturingData.productionPlans.unshift(plan);
    this.createMemoryMrpSuggestions(plan);
    this.recordMemoryAudit(
      "ProductionPlan",
      plan.id,
      "created",
      `Production plan ${plan.number} created.`,
    );
    return plan;
  }

  async createWorkOrderFromSuggestion(
    _tenantId: string,
    suggestionId: string,
  ): Promise<WorkOrder> {
    const suggestion = this.manufacturingData.mrpSuggestions.find(
      (record) => record.id === suggestionId,
    );
    if (!suggestion || suggestion.suggestionType !== "work_order") {
      throw new Error(`Work order suggestion not found: ${suggestionId}`);
    }
    const bom = this.manufacturingData.boms.find(
      (record) =>
        record.productId === suggestion.productId &&
        record.status === "approved",
    );
    if (!bom) {
      throw new Error(`Approved BOM not found for ${suggestion.sku}.`);
    }
    const routing = this.manufacturingData.routings.find(
      (record) =>
        record.productId === suggestion.productId &&
        record.status === "approved",
    );
    const workOrder = this.makeMemoryWorkOrder(suggestion, bom, routing);
    this.manufacturingData.workOrders.unshift(workOrder);
    suggestion.status = "accepted";
    this.recordMemoryAudit(
      "WorkOrder",
      workOrder.id,
      "created",
      `Work order ${workOrder.number} created.`,
    );
    return workOrder;
  }

  async releaseWorkOrder(
    _tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrder> {
    const workOrder = this.requireMemoryWorkOrder(workOrderId);
    if (workOrder.status !== "draft") {
      return workOrder;
    }
    workOrder.status = "released";
    this.ensureMemoryJobCards(workOrder);
    this.recordMemoryAudit(
      "WorkOrder",
      workOrder.id,
      "released",
      `Work order ${workOrder.number} released.`,
    );
    return workOrder;
  }

  async startJobCard(
    _tenantId: string,
    input: StartJobCardInput,
  ): Promise<JobCard> {
    const jobCard = this.requireMemoryJobCard(input.jobCardId);
    if (jobCard.status === "open") {
      jobCard.status = "in_process";
      jobCard.startedAt = new Date().toISOString();
      jobCard.operator = input.operator;
    }
    const workOrder = this.requireMemoryWorkOrder(jobCard.workOrderId);
    if (workOrder.status === "released") {
      workOrder.status = "in_process";
    }
    this.recordMemoryAudit(
      "JobCard",
      jobCard.id,
      "started",
      `Job card ${jobCard.operationName} started.`,
    );
    return jobCard;
  }

  async completeJobCard(
    _tenantId: string,
    input: CompleteJobCardInput,
  ): Promise<JobCard> {
    const jobCard = this.requireMemoryJobCard(input.jobCardId);
    jobCard.status = "completed";
    jobCard.actualMinutes = input.actualMinutes;
    jobCard.completedAt = new Date().toISOString();
    this.recordMemoryAudit(
      "JobCard",
      jobCard.id,
      "completed",
      `Job card ${jobCard.operationName} completed.`,
    );
    return jobCard;
  }

  async recordDowntime(
    _tenantId: string,
    input: RecordDowntimeInput,
  ): Promise<DowntimeEntry> {
    const workCenter = this.manufacturingData.workCenters.find(
      (record) => record.id === input.workCenterId,
    );
    if (!workCenter) {
      throw new Error(`Work center not found: ${input.workCenterId}`);
    }
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - input.minutes * 60_000);
    const downtime: DowntimeEntry = {
      id: todayId("down", this.manufacturingData.downtimeEntries.length),
      workCenterId: workCenter.id,
      workCenterCode: workCenter.code,
      jobCardId: input.jobCardId ?? null,
      reason: input.reason,
      minutes: input.minutes,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    };
    this.manufacturingData.downtimeEntries.unshift(downtime);
    this.recordMemoryAudit(
      "DowntimeEntry",
      downtime.id,
      "recorded",
      `${input.minutes} minutes downtime recorded for ${workCenter.code}.`,
    );
    return downtime;
  }

  async completeWorkOrder(
    _tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrder> {
    const workOrder = this.requireMemoryWorkOrder(workOrderId);
    if (workOrder.status === "completed") {
      return workOrder;
    }
    const jobCards = this.manufacturingData.jobCards.filter(
      (record) => record.workOrderId === workOrder.id,
    );
    if (
      jobCards.length > 0 &&
      !jobCards.every((record) => record.status === "completed")
    ) {
      throw new Error(
        `All job cards for ${workOrder.number} must be completed before work-order completion.`,
      );
    }
    const bom = this.manufacturingData.boms.find(
      (record) => record.id === workOrder.bomId,
    );
    if (!bom) {
      throw new Error(`BOM not found: ${workOrder.bomId}`);
    }
    for (const item of bom.items) {
      const component = this.requireMemoryProduct(item.productId);
      const requiredQuantity = Math.ceil(
        (item.quantity / bom.outputQuantity) * workOrder.quantity,
      );
      if (component.stockOnHand < requiredQuantity) {
        throw new Error(`Insufficient component stock for ${component.sku}.`);
      }
    }
    for (const item of bom.items) {
      const component = this.requireMemoryProduct(item.productId);
      const requiredQuantity = Math.ceil(
        (item.quantity / bom.outputQuantity) * workOrder.quantity,
      );
      component.stockOnHand -= requiredQuantity;
      this.recordMemoryLedger(
        component,
        -requiredQuantity,
        "MAIN-01",
        "WorkOrderIssue",
        workOrder.id,
      );
      this.recordMemoryTraceMovement(
        component,
        "work_order_issue",
        "WorkOrderIssue",
        workOrder.id,
        requiredQuantity,
        "transform",
      );
    }
    const finished = this.requireMemoryProduct(workOrder.productId);
    finished.stockOnHand += workOrder.quantity;
    this.recordMemoryLedger(
      finished,
      workOrder.quantity,
      "MAIN-01",
      "WorkOrderReceipt",
      workOrder.id,
    );
    const outputTrace = this.ensureMemoryTraceRecord(
      finished,
      "WorkOrder",
      workOrder.id,
      `LOT-${workOrder.number}-${finished.sku}`,
    );
    this.recordMemoryTraceMovement(
      finished,
      "work_order_receipt",
      "WorkOrderReceipt",
      workOrder.id,
      workOrder.quantity,
      "in",
      outputTrace,
    );
    workOrder.status = "completed";
    this.recordMemoryAudit(
      "WorkOrder",
      workOrder.id,
      "completed",
      `Work order ${workOrder.number} completed.`,
    );
    return workOrder;
  }

  async traceGenealogy(
    _tenantId: string,
    traceRecordId: string,
  ): Promise<TraceGenealogy> {
    const traceRecord = this.qualityData.traceRecords.find(
      (record) => record.id === traceRecordId,
    );
    if (!traceRecord) {
      throw new Error(`Trace record not found: ${traceRecordId}`);
    }
    return {
      traceRecord,
      movements: this.qualityData.traceMovements.filter(
        (movement) => movement.traceRecordId === traceRecord.id,
      ),
      inspections: this.qualityData.inspections.filter(
        (inspection) => inspection.traceRecordId === traceRecord.id,
      ),
      nonConformances: this.qualityData.nonConformances.filter(
        (ncr) => ncr.traceRecordId === traceRecord.id,
      ),
      recalls: this.qualityData.recalls.filter((recall) =>
        recall.affectedTraceIds.includes(traceRecord.id),
      ),
    };
  }

  async createQualityInspection(
    _tenantId: string,
    input: CreateQualityInspectionInput,
  ): Promise<QualityInspection> {
    const template = this.qualityData.inspectionTemplates.find(
      (record) => record.id === input.templateId,
    );
    const trace = this.qualityData.traceRecords.find(
      (record) => record.id === input.traceRecordId,
    );
    if (!template || !trace) {
      throw new Error("Inspection template and trace record are required.");
    }
    const passed = input.results.every((result) => result.passed);
    const inspection: QualityInspection = {
      id: todayId("qins", this.qualityData.inspections.length),
      templateId: template.id,
      templateName: template.name,
      traceRecordId: trace.id,
      lotNumber: trace.lotNumber,
      status: passed ? "passed" : "failed",
      inspectedBy: input.inspectedBy,
      inspectedAt: new Date().toISOString(),
      results: input.results,
    };
    this.qualityData.inspections.unshift(inspection);
    this.recordMemoryTraceMovement(
      this.requireMemoryProduct(trace.productId),
      "inspection",
      "QualityInspection",
      inspection.id,
      0,
      "reference",
      trace,
    );
    if (!passed) {
      trace.status = "quarantined";
      const ncr: NonConformance = {
        id: todayId("ncr", this.qualityData.nonConformances.length),
        inspectionId: inspection.id,
        traceRecordId: trace.id,
        lotNumber: trace.lotNumber,
        severity: "high",
        status: "open",
        description: `Failed inspection ${inspection.id}.`,
      };
      const action: CorrectiveAction = {
        id: todayId("capa", this.qualityData.correctiveActions.length),
        nonConformanceId: ncr.id,
        owner: input.inspectedBy,
        dueDate: dateOnly(daysFromNow(7)),
        status: "open",
        action: "Contain affected lot and complete root cause analysis.",
      };
      this.qualityData.nonConformances.unshift(ncr);
      this.qualityData.correctiveActions.unshift(action);
    }
    this.recordMemoryAudit(
      "QualityInspection",
      inspection.id,
      inspection.status,
      `Inspection ${inspection.id} ${inspection.status}.`,
    );
    return inspection;
  }

  async createRecall(
    _tenantId: string,
    input: CreateRecallInput,
  ): Promise<Recall> {
    const affected = this.qualityData.traceRecords.filter(
      (trace) => trace.lotNumber === input.lotNumber,
    );
    for (const trace of affected) {
      trace.status = "recalled";
    }
    const recall: Recall = {
      id: todayId("recall", this.qualityData.recalls.length),
      lotNumber: input.lotNumber,
      status: "active",
      reason: input.reason,
      affectedTraceIds: affected.map((trace) => trace.id),
      openedAt: new Date().toISOString(),
    };
    this.qualityData.recalls.unshift(recall);
    for (const trace of affected) {
      this.recordMemoryTraceMovement(
        this.requireMemoryProduct(trace.productId),
        "recall",
        "Recall",
        recall.id,
        0,
        "reference",
        trace,
      );
    }
    this.recordMemoryAudit(
      "Recall",
      recall.id,
      "opened",
      `Recall opened for ${input.lotNumber}.`,
    );
    return recall;
  }

  async openPosShift(
    _tenantId: string,
    input: OpenPosShiftInput,
  ): Promise<PosShift> {
    const register = this.commerceData.registers.find(
      (record) => record.id === input.registerId,
    );
    if (!register) {
      throw new Error(`POS register not found: ${input.registerId}`);
    }
    if (
      register.status === "open" ||
      this.commerceData.shifts.some(
        (shift) => shift.registerId === register.id && shift.status === "open",
      )
    ) {
      throw new Error(
        `POS register ${register.code} already has an open shift.`,
      );
    }
    register.status = "open";
    const shift: PosShift = {
      id: todayId("shift", this.commerceData.shifts.length),
      registerId: register.id,
      registerCode: register.code,
      openedBy: input.openedBy,
      status: "open",
      openingCash: input.openingCash,
      closingCash: null,
      expectedCash: input.openingCash,
      openedAt: new Date().toISOString(),
      closedAt: null,
    };
    this.commerceData.shifts.unshift(shift);
    this.recordMemoryAudit(
      "PosShift",
      shift.id,
      "opened",
      `POS shift opened for ${register.code}.`,
    );
    return shift;
  }

  async closePosShift(
    _tenantId: string,
    input: ClosePosShiftInput,
  ): Promise<PosShift> {
    const shift = this.commerceData.shifts.find(
      (record) => record.id === input.shiftId,
    );
    if (!shift) {
      throw new Error(`POS shift not found: ${input.shiftId}`);
    }
    const cashSales = this.commerceData.sales
      .filter((sale) => sale.shiftId === shift.id && sale.tenderType === "cash")
      .reduce((sum, sale) => sum + sale.total.amount, 0);
    shift.status = "closed";
    shift.closingCash = input.closingCash;
    shift.expectedCash = {
      amount: shift.openingCash.amount + cashSales,
      currency: shift.openingCash.currency,
    };
    shift.closedAt = new Date().toISOString();
    const register = this.commerceData.registers.find(
      (record) => record.id === shift.registerId,
    );
    if (register) {
      register.status = "closed";
    }
    this.recordMemoryAudit(
      "PosShift",
      shift.id,
      "closed",
      `POS shift closed for ${shift.registerCode}.`,
    );
    return shift;
  }

  async checkoutPosSale(
    _tenantId: string,
    input: CheckoutPosSaleInput,
  ): Promise<PosSale> {
    const shift = this.commerceData.shifts.find(
      (record) => record.id === input.shiftId && record.status === "open",
    );
    if (!shift) {
      throw new Error(`Open POS shift not found: ${input.shiftId}`);
    }
    const customer = this.data.customers.find(
      (record) => record.id === input.customerId,
    );
    if (!customer) {
      throw new Error(`Customer not found: ${input.customerId}`);
    }
    const total = totalLines(input.lines);
    const quote: Quote = {
      id: todayId("quote_pos", this.data.quotes.length),
      number: nextDocumentNumber("QPOS", this.data.quotes.length),
      customerId: customer.id,
      customerName: customer.name,
      status: "approved",
      validUntil: dateOnly(daysFromNow(1)),
      total,
      lines: input.lines,
    };
    this.data.quotes.unshift(quote);
    const order: SalesOrder = {
      id: todayId("order_pos", this.data.orders.length),
      number: nextDocumentNumber("POS-SO", this.data.orders.length),
      quoteId: quote.id,
      customerName: customer.name,
      status: "approved",
      promisedDate: dateOnly(new Date()),
      total,
    };
    this.data.orders.unshift(order);
    this.applyMemoryStockForOrder(order);
    const invoice: Invoice = {
      id: todayId("invoice_pos", this.data.invoices.length),
      number: nextDocumentNumber("POS-INV", this.data.invoices.length),
      orderId: order.id,
      customerName: customer.name,
      status: "posted",
      dueDate: dateOnly(new Date()),
      total,
    };
    this.data.invoices.unshift(invoice);
    this.postMemoryInvoiceJournal(invoice);
    const payment: Payment = {
      id: todayId("pay", this.payments.length),
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: total,
      method: `pos_${input.tenderType}`,
      receivedAt: new Date().toISOString(),
    };
    this.payments.unshift(payment);
    invoice.status = "paid";
    this.postMemoryPaymentJournal(payment);
    const sale: PosSale = {
      id: todayId("possale", this.commerceData.sales.length),
      shiftId: shift.id,
      receiptNumber: nextDocumentNumber("RCPT", this.commerceData.sales.length),
      customerName: customer.name,
      tenderType: input.tenderType,
      status: "posted",
      total,
      invoiceId: invoice.id,
      paymentId: payment.id,
      lines: input.lines,
      postedAt: new Date().toISOString(),
    };
    this.commerceData.sales.unshift(sale);
    if (input.tenderType === "cash") {
      shift.expectedCash = {
        amount: shift.expectedCash.amount + total.amount,
        currency: total.currency,
      };
    }
    this.recordMemoryAudit(
      "PosSale",
      sale.id,
      "posted",
      `POS receipt ${sale.receiptNumber} posted.`,
    );
    this.publishMemoryOutboxEvent("commerce.pos-sale.posted", {
      posSaleId: sale.id,
      receiptNumber: sale.receiptNumber,
      total,
    });
    return sale;
  }

  async publishChannelCatalog(
    _tenantId: string,
    input: PublishChannelCatalogInput,
  ): Promise<ChannelCatalogItem[]> {
    const channel = this.commerceData.channels.find(
      (record) => record.id === input.channelId,
    );
    if (!channel) {
      throw new Error(`Commerce channel not found: ${input.channelId}`);
    }
    const published: ChannelCatalogItem[] = [];
    for (const productId of [...new Set(input.productIds)]) {
      const product = this.data.products.find(
        (record) => record.id === productId,
      );
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      const existing = this.commerceData.catalogItems.find(
        (item) =>
          item.channelId === channel.id && item.productId === product.id,
      );
      if (existing) {
        existing.title = product.name;
        existing.price = product.price;
        existing.published = true;
        published.push(existing);
        continue;
      }
      const item: ChannelCatalogItem = {
        id: todayId("catalog", this.commerceData.catalogItems.length),
        channelId: channel.id,
        productId: product.id,
        sku: product.sku,
        title: product.name,
        price: product.price,
        published: true,
      };
      this.commerceData.catalogItems.unshift(item);
      published.push(item);
    }
    this.recordMemoryAudit(
      "ChannelCatalogItem",
      channel.id,
      "published",
      `${published.length} products published to ${channel.name}.`,
    );
    this.publishMemoryOutboxEvent("commerce.catalog.published", {
      channelId: channel.id,
      productIds: published.map((item) => item.productId),
    });
    return published;
  }

  async ingestChannelOrder(
    _tenantId: string,
    input: IngestChannelOrderInput,
  ): Promise<ChannelOrder> {
    const existing = this.commerceData.channelOrders.find(
      (record) =>
        record.channelId === input.channelId &&
        record.externalOrderId === input.externalOrderId,
    );
    if (existing) {
      return existing;
    }
    const channel = this.commerceData.channels.find(
      (record) => record.id === input.channelId,
    );
    const customer = this.data.customers.find(
      (record) => record.id === input.customerId,
    );
    if (!channel) {
      throw new Error(`Commerce channel not found: ${input.channelId}`);
    }
    if (!customer) {
      throw new Error(`Customer not found: ${input.customerId}`);
    }
    const total = totalLines(input.lines);
    const quote: Quote = {
      id: todayId("quote_channel", this.data.quotes.length),
      number: nextDocumentNumber("QCH", this.data.quotes.length),
      customerId: customer.id,
      customerName: customer.name,
      status: "approved",
      validUntil: dateOnly(daysFromNow(7)),
      total,
      lines: input.lines,
    };
    this.data.quotes.unshift(quote);
    const order: SalesOrder = {
      id: todayId("order_channel", this.data.orders.length),
      number: nextDocumentNumber("CH-SO", this.data.orders.length),
      quoteId: quote.id,
      customerName: customer.name,
      status: "approved",
      promisedDate: dateOnly(daysFromNow(3)),
      total,
    };
    this.data.orders.unshift(order);
    this.applyMemoryStockForOrder(order);
    const channelOrder: ChannelOrder = {
      id: todayId("chorder", this.commerceData.channelOrders.length),
      channelId: channel.id,
      channelName: channel.name,
      externalOrderId: input.externalOrderId,
      customerName: customer.name,
      status: "imported",
      total,
      salesOrderId: order.id,
      lines: input.lines,
      importedAt: new Date().toISOString(),
    };
    this.commerceData.channelOrders.unshift(channelOrder);
    this.recordMemoryAudit(
      "ChannelOrder",
      channelOrder.id,
      "imported",
      `Channel order ${input.externalOrderId} imported.`,
    );
    this.publishMemoryOutboxEvent("commerce.channel-order.imported", {
      channelOrderId: channelOrder.id,
      externalOrderId: channelOrder.externalOrderId,
      salesOrderId: order.id,
    });
    return channelOrder;
  }

  async recordAttendance(
    _tenantId: string,
    input: RecordAttendanceInput,
  ): Promise<AttendanceRecord> {
    const employee = this.operationsData.employees.find(
      (record) => record.id === input.employeeId,
    );
    if (!employee) {
      throw new Error(`Employee not found: ${input.employeeId}`);
    }
    const hours = attendanceHours(input.checkIn, input.checkOut);
    const status: AttendanceRecord["status"] =
      hours <= 0
        ? "absent"
        : new Date(input.checkIn).getUTCHours() > 9
          ? "late"
          : "present";
    const existing = this.hrData.attendance.find(
      (record) =>
        record.employeeId === employee.id && record.workDate === input.workDate,
    );
    if (existing) {
      existing.checkIn = input.checkIn;
      existing.checkOut = input.checkOut;
      existing.hours = hours;
      existing.status = status;
      return existing;
    }
    const attendance: AttendanceRecord = {
      id: todayId("att", this.hrData.attendance.length),
      employeeId: employee.id,
      employeeName: employee.name,
      workDate: input.workDate,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      hours,
      status,
    };
    this.hrData.attendance.unshift(attendance);
    this.recordMemoryAudit(
      "AttendanceRecord",
      attendance.id,
      "recorded",
      `Attendance recorded for ${employee.name}.`,
    );
    this.publishMemoryOutboxEvent("hr.attendance.recorded", {
      attendanceId: attendance.id,
      employeeId: employee.id,
      workDate: input.workDate,
    });
    return attendance;
  }

  async submitExpenseClaim(
    _tenantId: string,
    input: SubmitExpenseClaimInput,
  ): Promise<ExpenseClaim> {
    const employee = this.operationsData.employees.find(
      (record) => record.id === input.employeeId,
    );
    if (!employee) {
      throw new Error(`Employee not found: ${input.employeeId}`);
    }
    const claim: ExpenseClaim = {
      id: todayId("exp", this.hrData.expenseClaims.length),
      employeeId: employee.id,
      employeeName: employee.name,
      number: nextDocumentNumber("EXP", this.hrData.expenseClaims.length),
      status: "submitted",
      category: input.category,
      description: input.description,
      amount: input.amount,
      submittedAt: input.submittedAt,
      approvedAt: null,
      paidAt: null,
      journalEntryId: null,
    };
    this.hrData.expenseClaims.unshift(claim);
    this.recordMemoryAudit(
      "ExpenseClaim",
      claim.id,
      "submitted",
      `Expense claim ${claim.number} submitted.`,
    );
    return claim;
  }

  async approveExpenseClaim(
    tenantId: string,
    input: ExpenseClaimStatusInput,
  ): Promise<ExpenseClaim> {
    this.assertTenant(tenantId);
    const claim = this.hrData.expenseClaims.find(
      (record) => record.id === input.id,
    );
    if (!claim) {
      throw new Error(`Expense claim not found: ${input.id}`);
    }
    claim.status = "approved";
    claim.approvedAt = input.approvedAt ?? new Date().toISOString();
    this.recordMemoryAudit(
      "ExpenseClaim",
      claim.id,
      "approved",
      `Expense claim ${claim.number} approved.`,
    );
    return claim;
  }

  async payExpenseClaim(
    _tenantId: string,
    input: ExpenseClaimStatusInput,
  ): Promise<ExpenseClaim> {
    const claim = this.hrData.expenseClaims.find(
      (record) => record.id === input.id,
    );
    if (!claim) {
      throw new Error(`Expense claim not found: ${input.id}`);
    }
    if (claim.status === "submitted") {
      throw new Error(
        `Expense claim ${claim.number} must be approved before payment.`,
      );
    }
    claim.status = "paid";
    claim.paidAt = input.paidAt ?? new Date().toISOString();
    claim.journalEntryId = this.postMemoryExpenseClaimJournal(claim).id;
    this.recordMemoryAudit(
      "ExpenseClaim",
      claim.id,
      "paid",
      `Expense claim ${claim.number} paid.`,
    );
    this.publishMemoryOutboxEvent("hr.expense.paid", {
      expenseClaimId: claim.id,
      employeeId: claim.employeeId,
      amount: claim.amount,
    });
    return claim;
  }

  async createEmployeeAdvance(
    _tenantId: string,
    input: CreateEmployeeAdvanceInput,
  ): Promise<EmployeeAdvance> {
    const employee = this.operationsData.employees.find(
      (record) => record.id === input.employeeId,
    );
    if (!employee) {
      throw new Error(`Employee not found: ${input.employeeId}`);
    }
    const advance: EmployeeAdvance = {
      id: todayId("adv", this.hrData.employeeAdvances.length),
      employeeId: employee.id,
      employeeName: employee.name,
      number: nextDocumentNumber("ADV", this.hrData.employeeAdvances.length),
      status: "requested",
      amount: input.amount,
      requestedAt: input.requestedAt,
      paidAt: null,
      paymentReference: null,
      journalEntryId: null,
    };
    this.hrData.employeeAdvances.unshift(advance);
    this.recordMemoryAudit(
      "EmployeeAdvance",
      advance.id,
      "requested",
      `Employee advance ${advance.number} requested.`,
    );
    return advance;
  }

  async payEmployeeAdvance(
    _tenantId: string,
    input: PayEmployeeAdvanceInput,
  ): Promise<EmployeeAdvance> {
    const advance = this.hrData.employeeAdvances.find(
      (record) => record.id === input.id,
    );
    if (!advance) {
      throw new Error(`Employee advance not found: ${input.id}`);
    }
    advance.status = "paid";
    advance.paidAt = input.paidAt;
    advance.paymentReference = input.paymentReference;
    advance.journalEntryId = this.postMemoryEmployeeAdvanceJournal(advance).id;
    this.recordMemoryAudit(
      "EmployeeAdvance",
      advance.id,
      "paid",
      `Employee advance ${advance.number} paid.`,
    );
    return advance;
  }

  async runPayroll(
    _tenantId: string,
    input: RunPayrollInput,
  ): Promise<PayrollRun> {
    const existing = this.hrData.payrollRuns.find(
      (record) =>
        record.periodStart === input.periodStart &&
        record.periodEnd === input.periodEnd,
    );
    if (existing) {
      return existing;
    }
    const structures = this.hrData.salaryStructures.filter(
      (structure) => structure.active,
    );
    const payslips = structures.map((structure) => {
      const extraEarnings = structure.earnings.reduce(
        (sum, item) => sum + item.amount.amount,
        0,
      );
      const deductions = structure.deductions.reduce(
        (sum, item) => sum + item.amount.amount,
        0,
      );
      const gross = structure.basePay.amount + extraEarnings;
      return {
        structure,
        gross,
        deductions,
        net: gross - deductions,
      };
    });
    const grossPay = payslips.reduce((sum, item) => sum + item.gross, 0);
    const deductions = payslips.reduce((sum, item) => sum + item.deductions, 0);
    const netPay = payslips.reduce((sum, item) => sum + item.net, 0);
    const payrollRun: PayrollRun = {
      id: todayId("payroll", this.hrData.payrollRuns.length),
      number: nextDocumentNumber("PAY", this.hrData.payrollRuns.length),
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: "posted",
      grossPay: { amount: grossPay, currency: "USD" },
      deductions: { amount: deductions, currency: "USD" },
      netPay: { amount: netPay, currency: "USD" },
      postedAt: input.postedAt,
      journalEntryId: null,
    };
    payrollRun.journalEntryId = this.postMemoryPayrollJournal(payrollRun).id;
    this.hrData.payrollRuns.unshift(payrollRun);
    for (const item of payslips) {
      this.hrData.payslips.unshift({
        id: todayId("payslip", this.hrData.payslips.length),
        payrollRunId: payrollRun.id,
        employeeId: item.structure.employeeId,
        employeeName: item.structure.employeeName,
        grossPay: { amount: item.gross, currency: "USD" },
        deductions: { amount: item.deductions, currency: "USD" },
        netPay: { amount: item.net, currency: "USD" },
        status: "posted",
      });
    }
    this.recordMemoryAudit(
      "PayrollRun",
      payrollRun.id,
      "posted",
      `Payroll run ${payrollRun.number} posted.`,
    );
    this.publishMemoryOutboxEvent("hr.payroll.posted", {
      payrollRunId: payrollRun.id,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });
    return payrollRun;
  }

  async createSavedReport(
    _tenantId: string,
    input: CreateSavedReportInput,
  ): Promise<SavedReport> {
    const existing = this.reportingData.reports.find(
      (record) => record.name === input.name,
    );
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const report: SavedReport = {
      id: todayId("rpt", this.reportingData.reports.length),
      ...input,
    };
    this.reportingData.reports.unshift(report);
    this.recordMemoryAudit(
      "SavedReport",
      report.id,
      "created",
      `Report ${report.name} created.`,
    );
    return report;
  }

  async runReport(
    _tenantId: string,
    input: RunReportInput,
  ): Promise<ReportRun> {
    const report = this.reportingData.reports.find(
      (record) => record.id === input.reportId,
    );
    if (!report) {
      throw new Error(`Report not found: ${input.reportId}`);
    }
    const rows = projectReportRows(
      this.memoryReportRows(report.entityType),
      report,
    );
    const run: ReportRun = {
      id: todayId("run", this.reportingData.runs.length),
      reportId: report.id,
      reportName: report.name,
      status: "completed",
      rowCount: rows.length,
      ranAt: new Date().toISOString(),
      rows,
    };
    this.reportingData.runs.unshift(run);
    this.recordMemoryAudit(
      "ReportRun",
      run.id,
      "completed",
      `Report ${report.name} ran.`,
    );
    return run;
  }

  async previewReport(
    _tenantId: string,
    input: PreviewReportInput,
  ): Promise<ReportPreview> {
    const report = this.reportingData.reports.find(
      (record) => record.id === input.reportId,
    );
    if (!report) {
      throw new Error(`Report not found: ${input.reportId}`);
    }
    const rows = projectReportRows(
      this.memoryReportRows(report.entityType),
      report,
    );
    return {
      reportId: report.id,
      reportName: report.name,
      generatedAt: new Date().toISOString(),
      columns: report.columns.map((column) => ({
        key: column,
        label: labelize(column),
      })),
      rows,
      chart: report.chart,
    };
  }

  async createExportJob(
    _tenantId: string,
    input: CreateExportJobInput,
  ): Promise<ExportJob> {
    const report = this.reportingData.reports.find(
      (record) => record.id === input.reportId,
    );
    if (!report) {
      throw new Error(`Report not found: ${input.reportId}`);
    }
    const job: ExportJob = {
      id: todayId("export", this.reportingData.exportJobs.length),
      reportId: report.id,
      reportName: report.name,
      format: input.format,
      status: "completed",
      downloadUrl: `/exports/${report.id}.${input.format}`,
      createdAt: new Date().toISOString(),
    };
    this.reportingData.exportJobs.unshift(job);
    this.recordMemoryAudit(
      "ExportJob",
      job.id,
      "completed",
      `Export for ${report.name} completed.`,
    );
    return job;
  }

  async createPrintFormat(
    _tenantId: string,
    input: CreatePrintFormatInput,
  ): Promise<PrintFormat> {
    const existing = this.reportingData.printFormats.find(
      (record) => record.name === input.name,
    );
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const format: PrintFormat = {
      id: todayId("pf", this.reportingData.printFormats.length),
      ...input,
    };
    this.reportingData.printFormats.unshift(format);
    this.recordMemoryAudit(
      "PrintFormat",
      format.id,
      "created",
      `Print format ${format.name} created.`,
    );
    return format;
  }

  async previewPrintFormat(
    _tenantId: string,
    input: PreviewPrintFormatInput,
  ): Promise<PrintPreview> {
    const format = this.reportingData.printFormats.find(
      (record) => record.id === input.printFormatId,
    );
    if (!format) {
      throw new Error(`Print format not found: ${input.printFormatId}`);
    }
    const record = this.memoryPrintRecord(format.entityType, input.recordId);
    const preview: PrintPreview = {
      printFormatId: format.id,
      formatName: format.name,
      entityType: format.entityType,
      recordId: input.recordId,
      generatedAt: new Date().toISOString(),
      html: renderPrintHtml(format, record),
    };
    this.recordMemoryAudit(
      "PrintPreview",
      format.id,
      "rendered",
      `Print format ${format.name} preview rendered.`,
    );
    return preview;
  }

  async createApiKey(
    _tenantId: string,
    input: CreateApiKeyInput,
  ): Promise<ApiKeyRecord> {
    const key: ApiKeyRecord = {
      id: todayId("apikey", this.integrationData.apiKeys.length),
      name: input.name,
      keyPrefix: `erp_${String(this.integrationData.apiKeys.length + 1).padStart(4, "0")}`,
      scopes: [...new Set(input.scopes)].sort(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.integrationData.apiKeys.unshift(key);
    this.recordMemoryAudit(
      "ApiKeyRecord",
      key.id,
      "created",
      `API key ${key.name} created.`,
    );
    this.publishMemoryOutboxEvent("integration.api-key.created", {
      apiKeyId: key.id,
      name: key.name,
      scopes: key.scopes,
    });
    return key;
  }

  async dispatchWebhook(
    _tenantId: string,
    input: DispatchWebhookInput,
  ): Promise<WebhookDelivery> {
    const subscription = this.integrationData.webhookSubscriptions.find(
      (record) => record.id === input.subscriptionId,
    );
    if (!subscription) {
      throw new Error(
        `Webhook subscription not found: ${input.subscriptionId}`,
      );
    }
    if (!subscription.eventTypes.includes(input.eventType)) {
      throw new Error(
        `Webhook subscription ${subscription.id} is not subscribed to ${input.eventType}.`,
      );
    }
    const delivery: WebhookDelivery = {
      id: todayId("whdel", this.integrationData.webhookDeliveries.length),
      subscriptionId: subscription.id,
      eventType: input.eventType,
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date().toISOString(),
      deliveredAt: null,
    };
    this.integrationData.webhookDeliveries.unshift(delivery);
    this.publishMemoryOutboxEvent(input.eventType, input.payload);
    this.recordMemoryAudit(
      "WebhookDelivery",
      delivery.id,
      delivery.status,
      `Webhook ${delivery.eventType} ${delivery.status}.`,
    );
    return delivery;
  }

  async retryWebhookDelivery(
    _tenantId: string,
    deliveryId: string,
  ): Promise<WebhookDelivery> {
    const delivery = this.integrationData.webhookDeliveries.find(
      (record) => record.id === deliveryId,
    );
    if (!delivery) {
      throw new Error(`Webhook delivery not found: ${deliveryId}`);
    }
    if (delivery.status === "delivered" || delivery.status === "pending") {
      return delivery;
    }
    delivery.status = "pending";
    delivery.deliveredAt = null;
    delivery.nextAttemptAt = new Date().toISOString();
    removeMatchingDeadLetters(this.integrationData.deadLetters, delivery.id);
    this.recordMemoryAudit(
      "WebhookDelivery",
      delivery.id,
      "requeued",
      `Webhook ${delivery.eventType} requeued for worker delivery.`,
    );
    return delivery;
  }

  async publishOutboxEvent(
    _tenantId: string,
    input: PublishOutboxEventInput,
  ): Promise<OutboxEvent> {
    return this.publishMemoryOutboxEvent(input.eventType, input.payload);
  }

  async dispatchOutboxEvent(
    _tenantId: string,
    outboxEventId: string,
  ): Promise<OutboxEvent> {
    const event = this.integrationData.outboxEvents.find(
      (record) => record.id === outboxEventId,
    );
    if (!event) {
      throw new Error(`Outbox event not found: ${outboxEventId}`);
    }
    if (event.status === "pending") {
      return event;
    }
    event.status = "pending";
    event.error = null;
    event.dispatchedAt = null;
    removeMatchingDeadLetters(
      this.integrationData.deadLetters,
      undefined,
      event.id,
    );
    this.recordMemoryAudit(
      "OutboxEvent",
      event.id,
      "requeued",
      `Outbox event ${event.eventType} requeued for worker delivery.`,
    );
    return event;
  }

  async materializeWorkflowTasks(
    _tenantId: string,
    input: MaterializeWorkflowTasksInput,
  ): Promise<WorkflowTaskRecord[]> {
    const materialized: WorkflowTaskRecord[] = [];
    for (const task of input.tasks) {
      const taskKey = workflowTaskKey(task);
      const existing = this.integrationData.workflowTasks.find(
        (record) => record.taskKey === taskKey,
      );
      const now = new Date().toISOString();
      if (existing) {
        existing.status = "open";
        existing.title = task.title;
        existing.assigneeRoles = task.assigneeRoles;
        existing.escalatedRoles = task.escalatedRoles;
        existing.notificationChannels = task.notificationChannels;
        existing.dueStatus = task.dueStatus;
        existing.dueAt = task.dueAt ?? null;
        existing.updatedAt = now;
        existing.closedAt = null;
        if (task.escalated && !existing.escalatedNotifiedAt) {
          existing.escalatedNotifiedAt = now;
          this.publishMemoryOutboxEvent("workflow.task.escalated", {
            ...workflowTaskPayload(task),
            idempotencyKey: `${taskKey}:escalated`,
          });
        }
        materialized.push(existing);
        continue;
      }

      const record = workflowTaskRecordFromTask(
        task,
        todayId("wftrec", this.integrationData.workflowTasks.length),
        now,
      );
      record.assignedNotifiedAt = now;
      if (task.escalated) {
        record.escalatedNotifiedAt = now;
      }
      this.integrationData.workflowTasks.unshift(record);
      this.publishMemoryOutboxEvent("workflow.task.assigned", {
        ...workflowTaskPayload(task),
        idempotencyKey: `${taskKey}:assigned`,
      });
      if (task.escalated) {
        this.publishMemoryOutboxEvent("workflow.task.escalated", {
          ...workflowTaskPayload(task),
          idempotencyKey: `${taskKey}:escalated`,
        });
      }
      materialized.push(record);
    }
    return materialized;
  }

  async completeWorkflowTask(
    _tenantId: string,
    input: CompleteWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord[]> {
    const now = new Date().toISOString();
    const records = this.integrationData.workflowTasks.filter(
      (task) =>
        task.workflowId === input.workflowId &&
        task.entity === input.entity &&
        task.documentId === input.documentId &&
        task.status === "open",
    );
    for (const task of records) {
      const completed = task.action === input.completedAction;
      task.status = completed ? "completed" : "cancelled";
      task.closedAt = now;
      task.updatedAt = now;
      if (completed && !task.completedNotifiedAt) {
        task.completedNotifiedAt = now;
        this.publishMemoryOutboxEvent("workflow.task.completed", {
          ...workflowTaskRecordPayload(task),
          previousState: input.previousState,
          currentState: input.currentState,
          idempotencyKey: `${task.taskKey}:completed`,
        });
      }
      if (!completed && !task.cancelledNotifiedAt) {
        task.cancelledNotifiedAt = now;
        this.publishMemoryOutboxEvent("workflow.task.cancelled", {
          ...workflowTaskRecordPayload(task),
          previousState: input.previousState,
          currentState: input.currentState,
          idempotencyKey: `${task.taskKey}:cancelled`,
        });
      }
    }
    return records;
  }

  async reassignWorkflowTask(
    _tenantId: string,
    input: ReassignWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord> {
    const task = this.requireMemoryWorkflowTask(input.taskId);
    const now = new Date().toISOString();
    const previousRoles = [...task.assigneeRoles];
    task.assigneeRoles = [input.role];
    task.updatedAt = now;
    this.recordMemoryWorkflowTaskOperation(task, {
      operation: "reassigned",
      actorId: input.actorId,
      reason: input.reason ?? null,
      details: { previousRoles, assigneeRoles: task.assigneeRoles },
    });
    this.recordMemoryAudit(
      "WorkflowTaskRecord",
      task.id,
      "reassigned",
      `Workflow task ${task.taskKey} reassigned to ${input.role}.`,
    );
    return { ...task, operations: [...task.operations] };
  }

  async snoozeWorkflowTask(
    _tenantId: string,
    input: SnoozeWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord> {
    const task = this.requireMemoryWorkflowTask(input.taskId);
    const now = new Date().toISOString();
    const previousDueAt = task.dueAt;
    task.dueAt = input.dueAt;
    task.dueStatus = "open";
    task.updatedAt = now;
    this.recordMemoryWorkflowTaskOperation(task, {
      operation: "snoozed",
      actorId: input.actorId,
      reason: input.reason,
      details: { previousDueAt, dueAt: task.dueAt },
    });
    this.recordMemoryAudit(
      "WorkflowTaskRecord",
      task.id,
      "snoozed",
      `Workflow task ${task.taskKey} snoozed until ${input.dueAt}.`,
    );
    return { ...task, operations: [...task.operations] };
  }

  async retryWorkflowTaskNotification(
    _tenantId: string,
    input: RetryWorkflowTaskNotificationInput,
  ): Promise<WorkflowTaskRecord> {
    const task = this.requireMemoryWorkflowTask(input.taskId);
    const now = new Date().toISOString();
    const operation = this.recordMemoryWorkflowTaskOperation(task, {
      operation: "retried",
      actorId: input.actorId,
      reason: input.reason ?? null,
      details: { notification: input.notification },
    });
    this.setWorkflowTaskNotificationTimestamp(task, input.notification, now);
    task.updatedAt = now;
    this.publishMemoryOutboxEvent(`workflow.task.${input.notification}`, {
      ...workflowTaskRecordPayload(task),
      operationId: operation.id,
      retryReason: input.reason ?? null,
      idempotencyKey: `${task.taskKey}:${input.notification}:retry:${operation.id}`,
    });
    this.recordMemoryAudit(
      "WorkflowTaskRecord",
      task.id,
      "notification_retried",
      `Workflow task ${task.taskKey} ${input.notification} notification retried.`,
    );
    return { ...task, operations: [...task.operations] };
  }

  async createLead(_tenantId: string, input: CreateLeadInput): Promise<Lead> {
    const lead: Lead = {
      id: todayId("lead", this.operationsData.leads.length),
      companyName: input.companyName,
      contactName: input.contactName,
      email: input.email,
      source: input.source,
      stage: "new",
      owner: input.owner,
    };
    this.operationsData.leads.unshift(lead);
    this.recordMemoryAudit(
      "Lead",
      lead.id,
      "created",
      `Lead ${lead.companyName} created.`,
    );
    this.publishMemoryOutboxEvent("operations.lead.created", {
      leadId: lead.id,
      companyName: lead.companyName,
      owner: lead.owner,
    });
    return lead;
  }

  async createProject(
    _tenantId: string,
    input: CreateProjectInput,
  ): Promise<Project> {
    const project: Project = {
      id: todayId("proj", this.operationsData.projects.length),
      code: input.code,
      name: input.name,
      customerName: input.customerName,
      status: "planned",
      budget: input.budget,
      startDate: input.startDate,
      endDate: input.endDate,
    };
    this.operationsData.projects.unshift(project);
    this.recordMemoryAudit(
      "Project",
      project.id,
      "created",
      `Project ${project.code} created.`,
    );
    this.publishMemoryOutboxEvent("operations.project.created", {
      projectId: project.id,
      code: project.code,
      customerName: project.customerName,
    });
    return project;
  }

  async createServiceCase(
    _tenantId: string,
    input: CreateServiceCaseInput,
  ): Promise<ServiceCase> {
    const serviceCase: ServiceCase = {
      id: todayId("case", this.operationsData.serviceCases.length),
      caseNumber: nextDocumentNumber(
        "CASE",
        this.operationsData.serviceCases.length,
      ),
      customerName: input.customerName,
      subject: input.subject,
      priority: input.priority,
      status: "open",
      owner: input.owner,
    };
    this.operationsData.serviceCases.unshift(serviceCase);
    this.recordMemoryAudit(
      "ServiceCase",
      serviceCase.id,
      "created",
      `Service case ${serviceCase.caseNumber} created.`,
    );
    this.publishMemoryOutboxEvent("operations.service-case.created", {
      serviceCaseId: serviceCase.id,
      caseNumber: serviceCase.caseNumber,
      priority: serviceCase.priority,
    });
    return serviceCase;
  }

  async createLeaveRequest(
    _tenantId: string,
    input: CreateLeaveRequestInput,
  ): Promise<LeaveRequest> {
    const employee = this.operationsData.employees.find(
      (record) => record.id === input.employeeId,
    );
    if (!employee) {
      throw new Error(`Employee not found: ${input.employeeId}`);
    }
    const request: LeaveRequest = {
      id: todayId("leave", this.operationsData.leaveRequests.length),
      employeeId: employee.id,
      employeeName: employee.name,
      leaveType: input.leaveType,
      status: "requested",
      startDate: input.startDate,
      endDate: input.endDate,
    };
    this.operationsData.leaveRequests.unshift(request);
    this.recordMemoryAudit(
      "LeaveRequest",
      request.id,
      "created",
      `Leave request for ${employee.name} created.`,
    );
    this.publishMemoryOutboxEvent("operations.leave-request.created", {
      leaveRequestId: request.id,
      employeeId: request.employeeId,
      leaveType: request.leaveType,
    });
    return request;
  }

  async closeServiceCase(
    _tenantId: string,
    caseId: string,
  ): Promise<ServiceCase> {
    const serviceCase = this.operationsData.serviceCases.find(
      (record) => record.id === caseId,
    );
    if (!serviceCase) {
      throw new Error(`Service case not found: ${caseId}`);
    }
    serviceCase.status = "closed";
    this.recordMemoryAudit(
      "ServiceCase",
      serviceCase.id,
      "closed",
      `Service case ${serviceCase.caseNumber} closed.`,
    );
    this.publishMemoryOutboxEvent("operations.service-case.closed", {
      serviceCaseId: serviceCase.id,
      caseNumber: serviceCase.caseNumber,
    });
    return serviceCase;
  }

  async updateCustomer(_tenantId: string, input: UpdateCustomerInput) {
    const customer = this.data.customers.find(
      (record) => record.id === input.id,
    );
    if (!customer) {
      throw new Error(`Customer not found: ${input.id}`);
    }
    customer.code = input.code;
    customer.name = input.name;
    customer.owner = input.owner;
    customer.email = input.email;
    customer.creditLimit = input.creditLimit;
    customer.customFields = input.customFields ?? {};
    this.audit.unshift({
      id: todayId("aud", this.audit.length),
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "Customer",
      entityId: customer.id,
      action: "updated",
      message: `Customer ${customer.name} updated.`,
      createdAt: new Date().toISOString(),
    });
    return customer;
  }

  async createCustomField(
    _tenantId: string,
    input: CreateCustomFieldInput,
  ): Promise<CustomFieldDefinition> {
    const existing = this.customFields.find(
      (field) =>
        field.entityType === input.entityType && field.key === input.key,
    );
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const definition: CustomFieldDefinition = {
      id: todayId("cf", this.customFields.length),
      ...input,
    };
    this.customFields.push(definition);
    const defaultView = this.views.find(
      (view) => view.entityType === input.entityType && view.name === "default",
    );
    defaultView?.fields.push(`custom.${input.key}`);
    return definition;
  }

  async createAutomationRule(
    _tenantId: string,
    input: CreateAutomationRuleInput,
  ): Promise<AutomationRule> {
    const existing = this.automationRules.find(
      (rule) => rule.name === input.name,
    );
    if (existing) {
      existing.triggerType = "event";
      existing.triggerEvent = input.triggerEvent;
      existing.schedule = null;
      existing.enabled = input.enabled;
      existing.actions = input.actions;
      return existing;
    }
    const rule: AutomationRule = {
      id: todayId("auto", this.automationRules.length),
      name: input.name,
      triggerType: "event",
      triggerEvent: input.triggerEvent,
      schedule: null,
      enabled: input.enabled,
      actions: input.actions,
      runCount: 0,
      lastRunAt: null,
      lastError: null,
    };
    this.automationRules.unshift(rule);
    this.recordMemoryAudit(
      "AutomationRule",
      rule.id,
      "created",
      `Automation rule ${rule.name} created.`,
    );
    return rule;
  }

  async createWorkflowAssignmentRule(
    _tenantId: string,
    input: CreateWorkflowAssignmentRuleInput,
  ): Promise<WorkflowAssignmentRule> {
    const existing = this.workflowAssignmentRules.find(
      (rule) =>
        rule.workflowId === input.workflowId &&
        rule.fromState === input.fromState &&
        rule.toState === input.toState &&
        rule.role === input.role,
    );
    if (existing) {
      existing.delegateRole = input.delegateRole ?? null;
      existing.delegateStartsAt = input.delegateStartsAt ?? null;
      existing.delegateEndsAt = input.delegateEndsAt ?? null;
      existing.minAmount = input.minAmount ?? null;
      existing.maxAmount = input.maxAmount ?? null;
      existing.active = input.active;
      return existing;
    }
    const rule: WorkflowAssignmentRule = {
      id: todayId("wfar", this.workflowAssignmentRules.length),
      workflowId: input.workflowId,
      fromState: input.fromState,
      toState: input.toState,
      role: input.role,
      delegateRole: input.delegateRole ?? null,
      delegateStartsAt: input.delegateStartsAt ?? null,
      delegateEndsAt: input.delegateEndsAt ?? null,
      minAmount: input.minAmount ?? null,
      maxAmount: input.maxAmount ?? null,
      active: input.active,
    };
    this.workflowAssignmentRules.unshift(rule);
    this.recordMemoryAudit(
      "WorkflowAssignmentRule",
      rule.id,
      "created",
      `Workflow assignment rule ${rule.workflowId} ${rule.fromState} to ${rule.toState} configured.`,
    );
    return rule;
  }

  async createWorkflowEscalationRule(
    _tenantId: string,
    input: CreateWorkflowEscalationRuleInput,
  ): Promise<WorkflowEscalationRule> {
    const existing = this.workflowEscalationRules.find(
      (rule) =>
        rule.workflowId === input.workflowId &&
        rule.fromState === input.fromState &&
        rule.toState === input.toState &&
        rule.targetRole === input.targetRole,
    );
    if (existing) {
      existing.dueInHours = input.dueInHours;
      existing.escalationRole = input.escalationRole;
      existing.notificationChannel = input.notificationChannel;
      existing.active = input.active;
      return existing;
    }
    const rule: WorkflowEscalationRule = {
      id: todayId("wfer", this.workflowEscalationRules.length),
      workflowId: input.workflowId,
      fromState: input.fromState,
      toState: input.toState,
      targetRole: input.targetRole,
      dueInHours: input.dueInHours,
      escalationRole: input.escalationRole,
      notificationChannel: input.notificationChannel,
      active: input.active,
    };
    this.workflowEscalationRules.unshift(rule);
    this.recordMemoryAudit(
      "WorkflowEscalationRule",
      rule.id,
      "created",
      `Workflow escalation rule ${rule.workflowId} ${rule.fromState} to ${rule.toState} configured.`,
    );
    return rule;
  }

  async setModuleEnabled(
    _tenantId: string,
    moduleId: string,
    enabled: boolean,
  ): Promise<string[]> {
    if (enabled && !this.enabledModules.includes(moduleId)) {
      this.enabledModules.push(moduleId);
    }
    if (!enabled) {
      this.enabledModules = this.enabledModules.filter(
        (enabledModule) => enabledModule !== moduleId,
      );
    }
    return [...this.enabledModules];
  }

  async updateProduct(_tenantId: string, input: UpdateProductInput) {
    const product = this.data.products.find((record) => record.id === input.id);
    if (!product) {
      throw new Error(`Product not found: ${input.id}`);
    }
    product.sku = input.sku;
    product.name = input.name;
    product.category = input.category;
    product.price = input.price;
    product.stockOnHand = input.stockOnHand;
    this.audit.unshift({
      id: todayId("aud", this.audit.length),
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity: "Product",
      entityId: product.id,
      action: "updated",
      message: `Product ${product.name} updated.`,
      createdAt: new Date().toISOString(),
    });
    return product;
  }

  async transitionQuote(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ) {
    this.assertTenant(tenantId);
    const quote = this.data.quotes.find((record) => record.id === input.id);
    if (!quote) {
      throw new Error(`Quote not found: ${input.id}`);
    }
    const nextStatus = parseRecordStatus(input.status);
    assertRecordTransition("Quote", quote.status, nextStatus);
    quote.status = nextStatus;
    if (input.workflowTransition) {
      await this.recordWorkflowTransition(tenantId, input.workflowTransition);
    }
    this.recordMemoryAudit(
      "Quote",
      quote.id,
      "transitioned",
      `Quote ${quote.number} moved to ${quote.status}.`,
    );
    return quote;
  }

  async transitionOrder(
    _tenantId: string,
    input: PersistedDocumentTransitionInput,
  ) {
    const order = this.data.orders.find((record) => record.id === input.id);
    if (!order) {
      throw new Error(`Sales order not found: ${input.id}`);
    }
    const nextStatus = parseRecordStatus(input.status);
    assertRecordTransition("SalesOrder", order.status, nextStatus);
    order.status = nextStatus;
    if (input.workflowTransition) {
      await this.recordWorkflowTransition(_tenantId, input.workflowTransition);
    }
    if (order.status === "approved") {
      this.applyMemoryStockForOrder(order);
    }
    this.recordMemoryAudit(
      "SalesOrder",
      order.id,
      "transitioned",
      `Sales order ${order.number} moved to ${order.status}.`,
    );
    return order;
  }

  async transitionInvoice(
    _tenantId: string,
    input: PersistedDocumentTransitionInput,
  ) {
    const invoice = this.data.invoices.find((record) => record.id === input.id);
    if (!invoice) {
      throw new Error(`Invoice not found: ${input.id}`);
    }
    const nextStatus = parseInvoiceStatus(input.status);
    assertInvoiceTransition(invoice.status, nextStatus);
    invoice.status = nextStatus;
    if (input.workflowTransition) {
      await this.recordWorkflowTransition(_tenantId, input.workflowTransition);
    }
    if (invoice.status === "posted") {
      this.postMemoryInvoiceJournal(invoice);
    }
    this.recordMemoryAudit(
      "Invoice",
      invoice.id,
      "transitioned",
      `Invoice ${invoice.number} moved to ${invoice.status}.`,
    );
    return invoice;
  }

  async generateOrderFromQuote(_tenantId: string, quoteId: string) {
    const quote = this.data.quotes.find((record) => record.id === quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }
    const existing = this.data.orders.find(
      (order) => order.quoteId === quote.id,
    );
    if (existing) {
      this.ensureMemoryWorkflowInstance(_tenantId, {
        workflowId: "sales.order",
        document: { entity: "SalesOrder", id: existing.id },
        state: existing.status,
      });
      return existing;
    }
    if (quote.status !== "approved") {
      throw new Error(
        `Quote ${quote.number} must be approved before creating an order.`,
      );
    }
    const order: SalesOrder = {
      id: todayId("ord", this.data.orders.length),
      number: nextDocumentNumber("SO", this.data.orders.length),
      quoteId: quote.id,
      customerName: quote.customerName,
      status: "draft",
      promisedDate: dateOnly(daysFromNow(14)),
      total: quote.total,
    };
    this.data.orders.unshift(order);
    this.ensureMemoryWorkflowInstance(_tenantId, {
      workflowId: "sales.order",
      document: { entity: "SalesOrder", id: order.id },
      state: order.status,
    });
    this.recordMemoryAudit(
      "SalesOrder",
      order.id,
      "created",
      `Sales order ${order.number} created from quote ${quote.number}.`,
    );
    return order;
  }

  async generateInvoiceFromOrder(_tenantId: string, orderId: string) {
    const order = this.data.orders.find((record) => record.id === orderId);
    if (!order) {
      throw new Error(`Sales order not found: ${orderId}`);
    }
    const existing = this.data.invoices.find(
      (invoice) => invoice.orderId === order.id,
    );
    if (existing) {
      this.ensureMemoryWorkflowInstance(_tenantId, {
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: existing.id },
        state: existing.status,
      });
      return existing;
    }
    if (!["approved", "closed"].includes(order.status)) {
      throw new Error(
        `Sales order ${order.number} must be approved or closed before creating an invoice.`,
      );
    }
    const invoice: Invoice = {
      id: todayId("inv", this.data.invoices.length),
      number: nextDocumentNumber("INV", this.data.invoices.length),
      orderId: order.id,
      customerName: order.customerName,
      status: "draft",
      dueDate: dateOnly(daysFromNow(30)),
      total: order.total,
    };
    this.data.invoices.unshift(invoice);
    this.ensureMemoryWorkflowInstance(_tenantId, {
      workflowId: "sales.invoice",
      document: { entity: "Invoice", id: invoice.id },
      state: invoice.status,
    });
    this.recordMemoryAudit(
      "Invoice",
      invoice.id,
      "created",
      `Invoice ${invoice.number} created from order ${order.number}.`,
    );
    return invoice;
  }

  async recordPayment(
    _tenantId: string,
    input: RecordPaymentInput,
  ): Promise<Payment> {
    const invoice = this.data.invoices.find(
      (record) => record.id === input.invoiceId,
    );
    if (!invoice) {
      throw new Error(`Invoice not found: ${input.invoiceId}`);
    }
    const previousStatus = invoice.status;
    const payment: Payment = {
      id: todayId("pay", this.payments.length),
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: input.amount,
      method: input.method,
      receivedAt: input.receivedAt,
    };
    this.payments.unshift(payment);
    this.postMemoryPaymentJournal(payment);
    invoice.status = "paid";
    if (previousStatus === "posted") {
      await this.recordWorkflowTransition(_tenantId, {
        id: `wft_invoice_payment_${payment.id}`,
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: invoice.id },
        actorId: "usr_admin",
        from: previousStatus,
        to: "paid",
        reason: `Payment ${payment.id} recorded.`,
        occurredAt: input.receivedAt,
      });
    } else {
      this.ensureMemoryWorkflowInstance(_tenantId, {
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: invoice.id },
        state: invoice.status,
        updatedAt: input.receivedAt,
      });
    }
    return payment;
  }

  async createBankTransaction(
    _tenantId: string,
    input: CreateBankTransactionInput,
  ): Promise<BankTransaction> {
    const bankAccount = this.bankAccounts.find(
      (record) => record.id === input.bankAccountId,
    );
    if (!bankAccount) {
      throw new Error(`Bank account not found: ${input.bankAccountId}`);
    }
    const transaction: BankTransaction = {
      id: todayId("btx", this.bankTransactions.length),
      bankAccountId: bankAccount.id,
      reference: input.reference,
      direction: input.direction,
      amount: input.amount,
      transactionDate: input.transactionDate,
      matchedEntity: input.matchedEntity ?? null,
      matchedEntityId: input.matchedEntityId ?? null,
      reconciledAt: null,
    };
    this.bankTransactions.unshift(transaction);
    this.refreshMemoryBankBalance(bankAccount.id);
    return transaction;
  }

  async reconcileBankAccount(
    _tenantId: string,
    input: ReconcileBankAccountInput,
  ): Promise<BankReconciliation> {
    const bankAccount = this.bankAccounts.find(
      (record) => record.id === input.bankAccountId,
    );
    if (!bankAccount) {
      throw new Error(`Bank account not found: ${input.bankAccountId}`);
    }
    const selected = this.bankTransactions.filter(
      (transaction) =>
        transaction.bankAccountId === bankAccount.id &&
        input.transactionIds.includes(transaction.id),
    );
    const clearedAmount = selected.reduce(
      (sum, transaction) =>
        sum +
        (transaction.direction === "inbound"
          ? transaction.amount.amount
          : -transaction.amount.amount),
      0,
    );
    const variance = input.statementBalance.amount - clearedAmount;
    const reconciledAt = new Date().toISOString();
    for (const transaction of selected) {
      transaction.reconciledAt = reconciledAt;
    }
    bankAccount.lastReconciledAt = reconciledAt;
    const reconciliation: BankReconciliation = {
      id: todayId("brc", this.bankReconciliations.length),
      bankAccountId: bankAccount.id,
      statementDate: input.statementDate,
      statementBalance: input.statementBalance,
      clearedBalance: {
        amount: clearedAmount,
        currency: input.statementBalance.currency,
      },
      variance: { amount: variance, currency: input.statementBalance.currency },
      status: Math.abs(variance) < 0.01 ? "balanced" : "variance",
      reconciledAt,
    };
    this.bankReconciliations.unshift(reconciliation);
    return reconciliation;
  }

  async closeFiscalPeriod(
    _tenantId: string,
    input: CloseFiscalPeriodInput,
  ): Promise<PeriodClose> {
    const fiscalPeriod = this.fiscalPeriods.find(
      (record) => record.id === input.fiscalPeriodId,
    );
    if (!fiscalPeriod) {
      throw new Error(`Fiscal period not found: ${input.fiscalPeriodId}`);
    }
    fiscalPeriod.status = "closed";
    const existing = this.periodCloses.find(
      (record) => record.fiscalPeriodId === fiscalPeriod.id,
    );
    if (existing) {
      return existing;
    }
    const close: PeriodClose = {
      id: todayId("pcl", this.periodCloses.length),
      fiscalPeriodId: fiscalPeriod.id,
      fiscalPeriodName: fiscalPeriod.name,
      status: "closed",
      closedAt: input.closedAt,
      journalEntryId: null,
    };
    this.periodCloses.unshift(close);
    return close;
  }

  async allocateLandedCost(
    _tenantId: string,
    input: AllocateLandedCostInput,
  ): Promise<LandedCostAllocation> {
    const receipt = this.procurementData.purchaseReceipts.find(
      (record) => record.id === input.purchaseReceiptId,
    );
    if (!receipt) {
      throw new Error(`Purchase receipt not found: ${input.purchaseReceiptId}`);
    }
    const allocation: LandedCostAllocation = {
      id: todayId("lca", this.landedCostAllocations.length),
      purchaseReceiptId: receipt.id,
      purchaseReceiptNumber: receipt.number,
      amount: input.amount,
      method: input.method,
      allocatedAt: new Date().toISOString(),
    };
    this.landedCostAllocations.unshift(allocation);
    this.postMemoryLandedCostJournal(allocation);
    return allocation;
  }

  async createFixedAsset(
    _tenantId: string,
    input: CreateFixedAssetInput,
  ): Promise<FixedAsset> {
    const asset: FixedAsset = {
      id: todayId("asset", this.fixedAssets.length),
      assetTag: input.assetTag,
      name: input.name,
      purchaseDate: input.purchaseDate,
      cost: input.cost,
      usefulLifeMonths: input.usefulLifeMonths,
      accumulatedDepreciation: { amount: 0, currency: input.cost.currency },
      netBookValue: input.cost,
      status: "active",
    };
    this.fixedAssets.unshift(asset);
    this.postMemoryAssetAcquisitionJournal(asset);
    return asset;
  }

  async runDepreciation(
    _tenantId: string,
    input: RunDepreciationInput,
  ): Promise<DepreciationRun> {
    const asset = this.fixedAssets.find(
      (record) => record.id === input.fixedAssetId,
    );
    if (!asset) {
      throw new Error(`Fixed asset not found: ${input.fixedAssetId}`);
    }
    const remaining = Math.max(
      asset.cost.amount - asset.accumulatedDepreciation.amount,
      0,
    );
    const monthlyAmount = Math.min(
      Math.round((asset.cost.amount / asset.usefulLifeMonths) * 100) / 100,
      remaining,
    );
    const journal = this.postMemoryDepreciationJournal(asset, monthlyAmount);
    asset.accumulatedDepreciation = {
      amount: asset.accumulatedDepreciation.amount + monthlyAmount,
      currency: asset.cost.currency,
    };
    asset.netBookValue = {
      amount: Math.max(
        asset.cost.amount - asset.accumulatedDepreciation.amount,
        0,
      ),
      currency: asset.cost.currency,
    };
    const run: DepreciationRun = {
      id: todayId("depr", this.depreciationRuns.length),
      fixedAssetId: asset.id,
      assetTag: asset.assetTag,
      amount: { amount: monthlyAmount, currency: asset.cost.currency },
      runDate: input.runDate,
      journalEntryId: journal.id,
    };
    this.depreciationRuns.unshift(run);
    return run;
  }

  async setExchangeRate(
    _tenantId: string,
    input: SetExchangeRateInput,
  ): Promise<ExchangeRate> {
    const existing = this.exchangeRates.find(
      (rate) =>
        rate.baseCurrency === input.baseCurrency &&
        rate.quoteCurrency === input.quoteCurrency &&
        rate.effectiveDate === input.effectiveDate,
    );
    if (existing) {
      existing.rate = input.rate;
      return existing;
    }
    const rate: ExchangeRate = {
      id: todayId("fx", this.exchangeRates.length),
      baseCurrency: input.baseCurrency,
      quoteCurrency: input.quoteCurrency,
      rate: input.rate,
      effectiveDate: input.effectiveDate,
    };
    this.exchangeRates.unshift(rate);
    return rate;
  }

  private recordMemoryAudit(
    entity: string,
    entityId: string,
    action: string,
    message: string,
  ) {
    this.audit.unshift({
      id: todayId("aud", this.audit.length),
      tenantId: tenant.id,
      actorId: "usr_admin",
      entity,
      entityId,
      action,
      message,
      createdAt: new Date().toISOString(),
    });
  }

  private requireMemoryWorkflowTask(taskId: string): WorkflowTaskRecord {
    const task = this.integrationData.workflowTasks.find(
      (record) => record.id === taskId,
    );
    if (!task) {
      throw new Error(`Workflow task not found: ${taskId}`);
    }
    return task;
  }

  private recordMemoryWorkflowTaskOperation(
    task: WorkflowTaskRecord,
    input: Omit<WorkflowTaskOperation, "createdAt" | "id" | "taskId">,
  ): WorkflowTaskOperation {
    const operationCount = this.integrationData.workflowTasks.reduce(
      (count, record) => count + record.operations.length,
      0,
    );
    const operation: WorkflowTaskOperation = {
      id: todayId("wftop", operationCount),
      taskId: task.id,
      operation: input.operation,
      actorId: input.actorId,
      reason: input.reason,
      details: input.details,
      createdAt: new Date().toISOString(),
    };
    task.operations.unshift(operation);
    return operation;
  }

  private setWorkflowTaskNotificationTimestamp(
    task: WorkflowTaskRecord,
    notification: RetryWorkflowTaskNotificationInput["notification"],
    timestamp: string,
  ) {
    if (notification === "assigned") {
      task.assignedNotifiedAt = timestamp;
    } else if (notification === "escalated") {
      task.escalatedNotifiedAt = timestamp;
    } else if (notification === "completed") {
      task.completedNotifiedAt = timestamp;
    } else {
      task.cancelledNotifiedAt = timestamp;
    }
  }

  private ensureMemoryWorkflowInstance(
    tenantId: string,
    input: EnsureWorkflowInstanceInput,
  ): WorkflowInstance {
    const key = workflowKey(tenantId, input);
    const existing = this.workflowInstances.get(key);
    if (existing) {
      if (existing.state !== input.state) {
        existing.state = input.state;
        existing.updatedAt = input.updatedAt ?? new Date().toISOString();
      }
      return existing;
    }

    const now = new Date().toISOString();
    const instance: WorkflowInstance = {
      id: `wf_${input.document.entity}_${input.document.id}`,
      workflowId: input.workflowId,
      document: input.document,
      state: input.state,
      startedAt: input.startedAt ?? now,
      updatedAt: input.updatedAt ?? input.startedAt ?? now,
      transitions: [],
    };
    this.workflowInstances.set(key, instance);
    return instance;
  }

  private cloneWorkflowInstance(
    instance: WorkflowInstance | null,
  ): WorkflowInstance | null {
    return instance
      ? {
          ...instance,
          document: { ...instance.document },
          transitions: instance.transitions.map((transition) => ({
            ...transition,
            document: { ...transition.document },
          })),
        }
      : null;
  }

  private recordMemoryBarcodeScan(
    scanType: BarcodeScan["scanType"],
    barcode: string,
    entity: string,
    entityId: string,
  ) {
    this.inventoryData.barcodeScans.unshift({
      id: todayId("scan", this.inventoryData.barcodeScans.length),
      scanType,
      barcode,
      entity,
      entityId,
      scannedAt: new Date().toISOString(),
    });
  }

  private publishMemoryOutboxEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): OutboxEvent {
    const event: OutboxEvent = {
      id: todayId("outbox", this.integrationData.outboxEvents.length),
      eventType,
      status: "pending",
      attempts: 0,
      payload,
      error: null,
      createdAt: new Date().toISOString(),
      dispatchedAt: null,
    };
    this.integrationData.outboxEvents.unshift(event);
    this.executeMemoryAutomations(eventType, payload);
    return event;
  }

  private executeMemoryAutomations(
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    if (eventType.startsWith("automation.")) {
      return;
    }
    const rules = this.automationRules.filter(
      (rule) =>
        rule.enabled &&
        rule.triggerType === "event" &&
        rule.triggerEvent === eventType,
    );
    for (const rule of rules) {
      try {
        for (const action of rule.actions) {
          const type = String(action.type ?? "audit");
          if (type === "outbox") {
            this.integrationData.outboxEvents.unshift({
              id: todayId("outbox", this.integrationData.outboxEvents.length),
              eventType: String(action.eventType ?? "automation.rule.executed"),
              status: "pending",
              attempts: 0,
              payload: {
                ruleId: rule.id,
                sourceEvent: eventType,
                sourcePayload: payload,
              },
              error: null,
              createdAt: new Date().toISOString(),
              dispatchedAt: null,
            });
          } else {
            this.recordMemoryAudit(
              "AutomationRule",
              rule.id,
              "executed",
              String(action.message ?? `Automation ${rule.name} executed.`),
            );
          }
        }
        rule.runCount += 1;
        rule.lastRunAt = new Date().toISOString();
        rule.lastError = null;
      } catch (error) {
        rule.lastError =
          error instanceof Error ? error.message : "Automation failed.";
      }
    }
  }

  private applyMemoryStockForOrder(order: SalesOrder) {
    const alreadyApplied = this.data.stockMovements.some(
      (movement) =>
        movement.sourceEntity === "SalesOrder" &&
        movement.sourceId === order.id,
    );
    if (alreadyApplied) {
      return;
    }
    const quote = this.data.quotes.find(
      (record) => record.id === order.quoteId,
    );
    if (!quote) {
      throw new Error(`Quote not found for order: ${order.number}`);
    }
    for (const line of quote.lines) {
      const product = this.data.products.find(
        (record) => record.id === line.productId,
      );
      if (!product) {
        throw new Error(`Product not found: ${line.productId}`);
      }
      if (product.stockOnHand < line.quantity) {
        throw new Error(`Insufficient stock for ${product.sku}.`);
      }
    }
    for (const line of quote.lines) {
      const product = this.data.products.find(
        (record) => record.id === line.productId,
      );
      if (!product) {
        throw new Error(`Product not found: ${line.productId}`);
      }
      product.stockOnHand -= line.quantity;
      this.data.stockMovements.unshift({
        id: todayId("stm", this.data.stockMovements.length),
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        sourceEntity: "SalesOrder",
        sourceId: order.id,
        quantity: -line.quantity,
        reason: `Reserved for ${order.number}`,
        createdAt: new Date().toISOString(),
      });
      this.recordMemoryLedger(
        product,
        -line.quantity,
        "MAIN-01",
        "SalesOrder",
        order.id,
      );
    }
  }

  private postMemoryInvoiceJournal(invoice: Invoice) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "Invoice" && entry.sourceId === invoice.id,
    );
    if (existing) {
      return existing;
    }
    const receivables = requireMemoryAccount(this.accounts, "1100");
    const revenue = requireMemoryAccount(this.accounts, "4000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "Invoice",
      invoice.id,
      `Invoice ${invoice.number} posted.`,
      [
        makeMemoryJournalLine(
          receivables,
          `Receivable for ${invoice.number}`,
          invoice.total.amount,
          0,
          invoice.total.currency,
        ),
        makeMemoryJournalLine(
          revenue,
          `Revenue for ${invoice.number}`,
          0,
          invoice.total.amount,
          invoice.total.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemoryPaymentJournal(payment: Payment) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "Payment" && entry.sourceId === payment.id,
    );
    if (existing) {
      return existing;
    }
    const cash = requireMemoryAccount(this.accounts, "1000");
    const receivables = requireMemoryAccount(this.accounts, "1100");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "Payment",
      payment.id,
      `Payment for ${payment.invoiceNumber} recorded.`,
      [
        makeMemoryJournalLine(
          cash,
          `Cash receipt for ${payment.invoiceNumber}`,
          payment.amount.amount,
          0,
          payment.amount.currency,
        ),
        makeMemoryJournalLine(
          receivables,
          `Receivable cleared for ${payment.invoiceNumber}`,
          0,
          payment.amount.amount,
          payment.amount.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private refreshMemoryBankBalance(bankAccountId: string) {
    const bankAccount = this.bankAccounts.find(
      (record) => record.id === bankAccountId,
    );
    if (!bankAccount) {
      return;
    }
    const balance = this.bankTransactions
      .filter((transaction) => transaction.bankAccountId === bankAccountId)
      .reduce(
        (sum, transaction) =>
          sum +
          (transaction.direction === "inbound"
            ? transaction.amount.amount
            : -transaction.amount.amount),
        0,
      );
    bankAccount.balance = { amount: balance, currency: bankAccount.currency };
  }

  private postMemoryLandedCostJournal(allocation: LandedCostAllocation) {
    const inventory = requireMemoryAccount(this.accounts, "1200");
    const landedCost = requireMemoryAccount(this.accounts, "5000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "LandedCostAllocation",
      allocation.id,
      `Landed cost allocated to ${allocation.purchaseReceiptNumber}.`,
      [
        makeMemoryJournalLine(
          inventory,
          `Inventory landed cost for ${allocation.purchaseReceiptNumber}`,
          allocation.amount.amount,
          0,
          allocation.amount.currency,
        ),
        makeMemoryJournalLine(
          landedCost,
          `Landed cost absorbed for ${allocation.purchaseReceiptNumber}`,
          0,
          allocation.amount.amount,
          allocation.amount.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemoryAssetAcquisitionJournal(asset: FixedAsset) {
    const fixedAssets = requireMemoryAccount(this.accounts, "1300");
    const cash = requireMemoryAccount(this.accounts, "1000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "FixedAsset",
      asset.id,
      `Fixed asset ${asset.assetTag} capitalized.`,
      [
        makeMemoryJournalLine(
          fixedAssets,
          `Capitalized asset ${asset.assetTag}`,
          asset.cost.amount,
          0,
          asset.cost.currency,
        ),
        makeMemoryJournalLine(
          cash,
          `Cash purchase for ${asset.assetTag}`,
          0,
          asset.cost.amount,
          asset.cost.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemoryDepreciationJournal(asset: FixedAsset, amount: number) {
    const expense = requireMemoryAccount(this.accounts, "5100");
    const accumulated = requireMemoryAccount(this.accounts, "1310");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "DepreciationRun",
      `${asset.id}:${Date.now()}`,
      `Depreciation posted for ${asset.assetTag}.`,
      [
        makeMemoryJournalLine(
          expense,
          `Depreciation expense for ${asset.assetTag}`,
          amount,
          0,
          asset.cost.currency,
        ),
        makeMemoryJournalLine(
          accumulated,
          `Accumulated depreciation for ${asset.assetTag}`,
          0,
          amount,
          asset.cost.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemoryExpenseClaimJournal(claim: ExpenseClaim) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "ExpenseClaim" && entry.sourceId === claim.id,
    );
    if (existing) {
      return existing;
    }
    const expense = requireMemoryAccount(this.accounts, "5300");
    const cash = requireMemoryAccount(this.accounts, "1000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "ExpenseClaim",
      claim.id,
      `Expense claim ${claim.number} paid.`,
      [
        makeMemoryJournalLine(
          expense,
          `Employee expense ${claim.number}`,
          claim.amount.amount,
          0,
          claim.amount.currency,
        ),
        makeMemoryJournalLine(
          cash,
          `Expense reimbursement ${claim.number}`,
          0,
          claim.amount.amount,
          claim.amount.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemoryEmployeeAdvanceJournal(advance: EmployeeAdvance) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "EmployeeAdvance" &&
        entry.sourceId === advance.id,
    );
    if (existing) {
      return existing;
    }
    const advances = requireMemoryAccount(this.accounts, "1150");
    const cash = requireMemoryAccount(this.accounts, "1000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "EmployeeAdvance",
      advance.id,
      `Employee advance ${advance.number} paid.`,
      [
        makeMemoryJournalLine(
          advances,
          `Employee advance ${advance.number}`,
          advance.amount.amount,
          0,
          advance.amount.currency,
        ),
        makeMemoryJournalLine(
          cash,
          `Cash paid for ${advance.number}`,
          0,
          advance.amount.amount,
          advance.amount.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemoryPayrollJournal(payrollRun: PayrollRun) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "PayrollRun" && entry.sourceId === payrollRun.id,
    );
    if (existing) {
      return existing;
    }
    const payrollExpense = requireMemoryAccount(this.accounts, "5200");
    const payrollPayable = requireMemoryAccount(this.accounts, "2200");
    const taxPayable = requireMemoryAccount(this.accounts, "2100");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "PayrollRun",
      payrollRun.id,
      `Payroll run ${payrollRun.number} posted.`,
      [
        makeMemoryJournalLine(
          payrollExpense,
          `Gross payroll ${payrollRun.number}`,
          payrollRun.grossPay.amount,
          0,
          payrollRun.grossPay.currency,
        ),
        makeMemoryJournalLine(
          payrollPayable,
          `Net payroll payable ${payrollRun.number}`,
          0,
          payrollRun.netPay.amount,
          payrollRun.netPay.currency,
        ),
        makeMemoryJournalLine(
          taxPayable,
          `Payroll deductions ${payrollRun.number}`,
          0,
          payrollRun.deductions.amount,
          payrollRun.deductions.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private applyMemoryProcurementStock(receipt: PurchaseReceipt) {
    const alreadyApplied = this.data.stockMovements.some(
      (movement) =>
        movement.sourceEntity === "PurchaseReceipt" &&
        movement.sourceId === receipt.id,
    );
    if (alreadyApplied) {
      return;
    }
    for (const line of receipt.lines) {
      const product = this.data.products.find(
        (record) => record.id === line.productId,
      );
      if (!product) {
        throw new Error(`Product not found: ${line.productId}`);
      }
      product.stockOnHand += line.quantity;
      this.data.stockMovements.unshift({
        id: todayId("stm", this.data.stockMovements.length),
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        sourceEntity: "PurchaseReceipt",
        sourceId: receipt.id,
        quantity: line.quantity,
        reason: `Received on ${receipt.number}`,
        createdAt: new Date().toISOString(),
      });
      this.recordMemoryLedger(
        product,
        line.quantity,
        "MAIN-01",
        "PurchaseReceipt",
        receipt.id,
      );
      const trace = this.ensureMemoryTraceRecord(
        product,
        "PurchaseReceipt",
        receipt.id,
        `LOT-${receipt.number}-${product.sku}`,
      );
      this.recordMemoryTraceMovement(
        product,
        "receipt",
        "PurchaseReceipt",
        receipt.id,
        line.quantity,
        "in",
        trace,
      );
    }
  }

  private requireMemoryProduct(productId: string): Product {
    const product = this.data.products.find(
      (record) => record.id === productId,
    );
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    return product;
  }

  private memoryLedgerQuantity(productId: string, binCode?: string): number {
    return this.inventoryData.ledger
      .filter(
        (entry) =>
          entry.productId === productId &&
          (!binCode || entry.binCode === binCode),
      )
      .reduce((sum, entry) => sum + entry.quantity, 0);
  }

  private memoryReservedQuantity(productId: string): number {
    return this.inventoryData.reservations
      .filter(
        (reservation) =>
          reservation.productId === productId &&
          reservation.status === "active",
      )
      .reduce((sum, reservation) => sum + reservation.quantity, 0);
  }

  private memoryAvailableStock(productId: string): number {
    return (
      this.memoryLedgerQuantity(productId) -
      this.memoryReservedQuantity(productId)
    );
  }

  private memoryInventoryReconciles(): boolean {
    return this.data.products.every(
      (product) =>
        this.memoryLedgerQuantity(product.id) === product.stockOnHand,
    );
  }

  private recordMemoryLedger(
    product: Product,
    quantity: number,
    binCode: string,
    sourceEntity: string,
    sourceId: string,
  ) {
    const bin = this.inventoryData.bins.find(
      (record) => record.code === binCode,
    );
    this.inventoryData.ledger.unshift({
      id: todayId("sle", this.inventoryData.ledger.length),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      warehouseCode: bin?.warehouseCode ?? "MAIN",
      binCode,
      quantity,
      unitCost: product.price,
      value: {
        amount: quantity * product.price.amount,
        currency: product.price.currency,
      },
      sourceEntity,
      sourceId,
      createdAt: new Date().toISOString(),
    });
  }

  private ensureMemoryTraceRecord(
    product: Product,
    sourceEntity: string,
    sourceId: string,
    lotNumber?: string,
  ): TraceRecord {
    const resolvedLot =
      lotNumber ??
      `LOT-${product.sku}-${sourceEntity}-${sourceId}`.replace(
        /[^A-Za-z0-9-]/g,
        "-",
      );
    const existing = this.qualityData.traceRecords.find(
      (record) =>
        record.productId === product.id &&
        record.lotNumber === resolvedLot &&
        record.serialNumber === null,
    );
    if (existing) {
      return existing;
    }
    const trace: TraceRecord = {
      id: todayId("trace", this.qualityData.traceRecords.length),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      lotNumber: resolvedLot,
      serialNumber: null,
      sourceEntity,
      sourceId,
      status: "available",
      receivedAt: new Date().toISOString(),
    };
    this.qualityData.traceRecords.unshift(trace);
    return trace;
  }

  private recordMemoryTraceMovement(
    product: Product,
    movementType: TraceMovement["movementType"],
    sourceEntity: string,
    sourceId: string,
    quantity: number,
    direction: TraceMovement["direction"],
    traceRecord?: TraceRecord,
  ) {
    const trace =
      traceRecord ??
      this.qualityData.traceRecords.find(
        (record) =>
          record.productId === product.id && record.status === "available",
      ) ??
      this.ensureMemoryTraceRecord(
        product,
        "OpeningBalance",
        `opening_${product.id}`,
        `LOT-${product.sku}-OPENING`,
      );
    const exists = this.qualityData.traceMovements.some(
      (movement) =>
        movement.traceRecordId === trace.id &&
        movement.movementType === movementType &&
        movement.sourceEntity === sourceEntity &&
        movement.sourceId === sourceId,
    );
    if (exists) {
      return;
    }
    this.qualityData.traceMovements.unshift({
      id: todayId("tmv", this.qualityData.traceMovements.length),
      traceRecordId: trace.id,
      lotNumber: trace.lotNumber,
      serialNumber: trace.serialNumber,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      movementType,
      sourceEntity,
      sourceId,
      quantity,
      direction,
      occurredAt: new Date().toISOString(),
    });
  }

  private createMemoryMrpSuggestions(plan: ProductionPlan) {
    for (const line of plan.lines) {
      if (line.plannedQuantity <= 0) {
        continue;
      }
      const product = this.requireMemoryProduct(line.productId);
      const workOrderSuggestion: MrpSuggestion = {
        id: todayId("mrp", this.manufacturingData.mrpSuggestions.length),
        productionPlanId: plan.id,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        suggestionType: "work_order",
        quantity: line.plannedQuantity,
        requiredBy: plan.demandDate,
        status: "open",
      };
      this.manufacturingData.mrpSuggestions.unshift(workOrderSuggestion);
      const bom = this.manufacturingData.boms.find(
        (record) =>
          record.productId === product.id && record.status === "approved",
      );
      if (!bom) {
        continue;
      }
      for (const item of bom.items) {
        const component = this.requireMemoryProduct(item.productId);
        const requiredQuantity = Math.ceil(
          (item.quantity / bom.outputQuantity) * line.plannedQuantity,
        );
        const shortQuantity = Math.max(
          requiredQuantity - this.memoryAvailableStock(component.id),
          0,
        );
        if (shortQuantity <= 0) {
          continue;
        }
        this.manufacturingData.mrpSuggestions.unshift({
          id: todayId("mrp", this.manufacturingData.mrpSuggestions.length),
          productionPlanId: plan.id,
          productId: component.id,
          sku: component.sku,
          productName: component.name,
          suggestionType: "purchase",
          quantity: shortQuantity,
          requiredBy: plan.demandDate,
          status: "open",
        });
      }
    }
  }

  private makeMemoryWorkOrder(
    suggestion: MrpSuggestion,
    bom: BillOfMaterial,
    routing: Routing | undefined,
  ): WorkOrder {
    return {
      id: todayId("wo", this.manufacturingData.workOrders.length),
      number: nextDocumentNumber(
        "WO",
        this.manufacturingData.workOrders.length,
      ),
      productId: suggestion.productId,
      sku: suggestion.sku,
      productName: suggestion.productName,
      bomId: bom.id,
      routingId: routing?.id ?? null,
      status: "draft",
      quantity: suggestion.quantity,
      plannedStart: dateOnly(new Date()),
      plannedEnd: suggestion.requiredBy,
      materialCost: {
        amount:
          (bom.estimatedCost.amount / bom.outputQuantity) * suggestion.quantity,
        currency: bom.estimatedCost.currency,
      },
    };
  }

  private requireMemoryWorkOrder(workOrderId: string): WorkOrder {
    const workOrder = this.manufacturingData.workOrders.find(
      (record) => record.id === workOrderId,
    );
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }
    return workOrder;
  }

  private ensureMemoryJobCards(workOrder: WorkOrder) {
    if (
      this.manufacturingData.jobCards.some(
        (record) => record.workOrderId === workOrder.id,
      )
    ) {
      return;
    }
    const routing = this.manufacturingData.routings.find(
      (record) => record.id === workOrder.routingId,
    );
    for (const operation of routing?.operations ?? []) {
      const card: JobCard = {
        id: todayId("job", this.manufacturingData.jobCards.length),
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.number,
        operationSequence: operation.sequence,
        operationName: operation.name,
        workCenterId: operation.workCenterId,
        workCenterCode: operation.workCenterCode,
        status: "open",
        plannedMinutes: operation.runMinutes * workOrder.quantity,
        actualMinutes: 0,
        startedAt: null,
        completedAt: null,
        operator: null,
      };
      this.manufacturingData.jobCards.unshift(card);
    }
  }

  private requireMemoryJobCard(jobCardId: string): JobCard {
    const jobCard = this.manufacturingData.jobCards.find(
      (record) => record.id === jobCardId,
    );
    if (!jobCard) {
      throw new Error(`Job card not found: ${jobCardId}`);
    }
    return jobCard;
  }

  private memoryCapacitySchedule(): ManufacturingSnapshot["capacitySchedule"] {
    return this.manufacturingData.workCenters.map((center) => {
      const scheduledMinutes = this.manufacturingData.jobCards
        .filter(
          (card) =>
            card.workCenterId === center.id && card.status !== "completed",
        )
        .reduce((sum, card) => sum + card.plannedMinutes, 0);
      const downtimeMinutes = this.manufacturingData.downtimeEntries
        .filter((entry) => entry.workCenterId === center.id)
        .reduce((sum, entry) => sum + entry.minutes, 0);
      const capacityMinutes = center.capacityPerDay * 60;
      return {
        workCenterId: center.id,
        workCenterCode: center.code,
        workCenterName: center.name,
        scheduledMinutes,
        capacityMinutes,
        downtimeMinutes,
        loadPercent:
          capacityMinutes > 0
            ? Math.round((scheduledMinutes / capacityMinutes) * 100)
            : 0,
      };
    });
  }

  private memoryReportRows(entityType: string): ReportRun["rows"] {
    if (entityType === "Inventory") {
      return this.data.products.map((product) => ({
        sku: product.sku,
        productName: product.name,
        stockOnHand: product.stockOnHand,
        ledgerQuantity: this.memoryLedgerQuantity(product.id),
      }));
    }
    if (entityType === "Aging") {
      const aging = buildMemoryAging(
        this.data.invoices,
        this.payments,
        this.procurementData.purchaseInvoices,
        this.procurementData.supplierPayments,
      );
      return [
        {
          bucket: "Receivables",
          total: aging.receivables.total.amount,
          current: aging.receivables.current.amount,
          over90: aging.receivables.over90.amount,
        },
        {
          bucket: "Payables",
          total: aging.payables.total.amount,
          current: aging.payables.current.amount,
          over90: aging.payables.over90.amount,
        },
      ];
    }
    return [];
  }

  private memoryPrintRecord(
    entityType: string,
    recordId: string,
  ): Record<string, unknown> {
    if (entityType === "Invoice") {
      const invoice =
        this.data.invoices.find((record) => record.id === recordId) ??
        this.data.invoices[0];
      if (!invoice) {
        throw new Error("Invoice not found for preview.");
      }
      return {
        ...invoice,
        total: `${invoice.total.currency} ${invoice.total.amount}`,
      };
    }
    if (entityType === "PurchaseReceipt") {
      const receipt =
        this.procurementData.purchaseReceipts.find(
          (record) => record.id === recordId,
        ) ?? this.procurementData.purchaseReceipts[0];
      if (!receipt) {
        throw new Error("Purchase receipt not found for preview.");
      }
      return receipt;
    }
    if (entityType === "PickList") {
      const pickList =
        this.inventoryData.pickLists.find((record) => record.id === recordId) ??
        this.inventoryData.pickLists[0];
      if (!pickList) {
        throw new Error("Pick list not found for preview.");
      }
      return pickList;
    }
    if (entityType === "Aging") {
      const aging = buildMemoryAging(
        this.data.invoices,
        this.payments,
        this.procurementData.purchaseInvoices,
        this.procurementData.supplierPayments,
      );
      return {
        number: "AGING",
        receivables: aging.receivables.total.amount,
        payables: aging.payables.total.amount,
      };
    }
    throw new Error(`Unsupported print entity: ${entityType}`);
  }

  private postMemoryPurchaseInvoiceJournal(invoice: PurchaseInvoice) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "PurchaseInvoice" &&
        entry.sourceId === invoice.id,
    );
    if (existing) {
      return existing;
    }
    const inventory = requireMemoryAccount(this.accounts, "1200");
    const payables = requireMemoryAccount(this.accounts, "2000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "PurchaseInvoice",
      invoice.id,
      `Purchase invoice ${invoice.number} posted.`,
      [
        makeMemoryJournalLine(
          inventory,
          `Inventory for ${invoice.number}`,
          invoice.total.amount,
          0,
          invoice.total.currency,
        ),
        makeMemoryJournalLine(
          payables,
          `Payable for ${invoice.number}`,
          0,
          invoice.total.amount,
          invoice.total.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }

  private postMemorySupplierPaymentJournal(payment: SupplierPayment) {
    const existing = this.journalEntries.find(
      (entry) =>
        entry.sourceEntity === "SupplierPayment" &&
        entry.sourceId === payment.id,
    );
    if (existing) {
      return existing;
    }
    const payables = requireMemoryAccount(this.accounts, "2000");
    const cash = requireMemoryAccount(this.accounts, "1000");
    const entry = makeMemoryJournalEntry(
      this.journalEntries.length,
      "SupplierPayment",
      payment.id,
      `Supplier payment for ${payment.purchaseInvoiceNumber} recorded.`,
      [
        makeMemoryJournalLine(
          payables,
          `Payable cleared for ${payment.purchaseInvoiceNumber}`,
          payment.amount.amount,
          0,
          payment.amount.currency,
        ),
        makeMemoryJournalLine(
          cash,
          `Cash paid for ${payment.purchaseInvoiceNumber}`,
          0,
          payment.amount.amount,
          payment.amount.currency,
        ),
      ],
    );
    this.journalEntries.unshift(entry);
    return entry;
  }
}

export class PrismaErpRepository implements ErpRepository {
  constructor(private readonly prisma: PrismaClient = createPrismaClient()) {}

  async readiness(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async tenant(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true },
    });
  }

  async sales(tenantId: string): Promise<SalesSnapshot> {
    const currentTenant = { id: tenantId };
    const [customers, products, quotes, orders, invoices, stockMovements] =
      await Promise.all([
        this.prisma.customer.findMany({
          where: { tenantId: currentTenant.id },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.product.findMany({
          where: { tenantId: currentTenant.id },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.quote.findMany({
          where: { tenantId: currentTenant.id },
          include: { customer: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.salesOrder.findMany({
          where: { tenantId: currentTenant.id },
          include: {
            quote: { include: { customer: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.invoice.findMany({
          where: { tenantId: currentTenant.id },
          include: {
            order: {
              include: {
                quote: { include: { customer: { select: { name: true } } } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.stockMovement.findMany({
          where: { tenantId: currentTenant.id },
          include: { product: { select: { sku: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    return {
      customers: customers.map((customer) => ({
        id: customer.id,
        code: customer.code,
        name: customer.name,
        status: customer.status,
        owner: customer.owner,
        email: customer.email,
        creditLimit: money(customer.creditLimit, customer.currency),
        customFields: normalizeCustomFields(customer.customData),
      })),
      products: products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: money(product.price, product.currency),
        stockOnHand: product.stockOnHand,
      })),
      quotes: quotes.map((quote) => ({
        id: quote.id,
        number: quote.number,
        customerId: quote.customerId,
        customerName: quote.customer.name,
        status: quote.status,
        validUntil: dateOnly(quote.validUntil),
        total: money(quote.total, quote.currency),
        lines: normalizeLines(quote.lines),
      })),
      orders: orders.map((order) => ({
        id: order.id,
        number: order.number,
        quoteId: order.quoteId,
        customerName: order.quote.customer.name,
        status: order.status,
        promisedDate: dateOnly(order.promisedDate),
        total: money(order.total, order.currency),
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        orderId: invoice.orderId,
        customerName: invoice.order.quote.customer.name,
        status: invoice.status,
        dueDate: dateOnly(invoice.dueDate),
        total: money(invoice.total, invoice.currency),
      })),
      stockMovements: stockMovements.map((movement) => ({
        id: movement.id,
        productId: movement.productId,
        sku: movement.product.sku,
        productName: movement.product.name,
        sourceEntity: movement.sourceEntity,
        sourceId: movement.sourceId,
        quantity: movement.quantity,
        reason: movement.reason,
        createdAt: movement.createdAt.toISOString(),
      })),
    };
  }

  async accounting(tenantId: string): Promise<AccountingSnapshot> {
    const currentTenant = { id: tenantId };
    await this.ensureAccountingInfrastructure(currentTenant.id);
    const [
      accounts,
      fiscalPeriods,
      taxRates,
      journalEntries,
      payments,
      invoices,
      purchaseInvoices,
      bankAccounts,
      bankTransactions,
      bankReconciliations,
      periodCloses,
      landedCostAllocations,
      fixedAssets,
      depreciationRuns,
      exchangeRates,
    ] = await Promise.all([
      this.prisma.account.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.fiscalPeriod.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { startDate: "asc" },
      }),
      this.prisma.taxRate.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.journalEntry.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          lines: { include: { account: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.payment.findMany({
        where: { tenantId: currentTenant.id },
        include: { invoice: { select: { number: true } } },
        orderBy: { receivedAt: "desc" },
        take: 50,
      }),
      this.prisma.invoice.findMany({
        where: { tenantId: currentTenant.id },
        include: { payments: true },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.purchaseInvoice.findMany({
        where: { tenantId: currentTenant.id },
        include: { payments: true },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.bankAccount.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.bankTransaction.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { transactionDate: "desc" },
        take: 50,
      }),
      this.prisma.bankReconciliation.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { reconciledAt: "desc" },
        take: 20,
      }),
      this.prisma.periodClose.findMany({
        where: { tenantId: currentTenant.id },
        include: { fiscalPeriod: { select: { name: true } } },
        orderBy: { closedAt: "desc" },
      }),
      this.prisma.landedCostAllocation.findMany({
        where: { tenantId: currentTenant.id },
        include: { purchaseReceipt: { select: { number: true } } },
        orderBy: { allocatedAt: "desc" },
        take: 20,
      }),
      this.prisma.fixedAsset.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.depreciationRun.findMany({
        where: { tenantId: currentTenant.id },
        include: { fixedAsset: { select: { assetTag: true } } },
        orderBy: { runDate: "desc" },
        take: 20,
      }),
      this.prisma.exchangeRate.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: [{ effectiveDate: "desc" }, { quoteCurrency: "asc" }],
        take: 20,
      }),
    ]);
    const mappedAccounts = accounts.map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      normalBalance: account.normalBalance,
      active: account.active,
    }));
    const mappedEntries = journalEntries.map((entry) => ({
      id: entry.id,
      number: entry.number,
      sourceEntity: entry.sourceEntity,
      sourceId: entry.sourceId,
      memo: entry.memo,
      status: entry.status,
      postedAt: entry.postedAt?.toISOString() ?? null,
      lines: entry.lines.map((line) => ({
        id: line.id,
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        description: line.description,
        debit: money(line.debit, "USD"),
        credit: money(line.credit, "USD"),
      })),
    }));
    return {
      accounts: mappedAccounts,
      fiscalPeriods: fiscalPeriods.map((period) => ({
        id: period.id,
        name: period.name,
        startDate: dateOnly(period.startDate),
        endDate: dateOnly(period.endDate),
        status: period.status,
      })),
      taxRates: taxRates.map((rate) => ({
        id: rate.id,
        name: rate.name,
        rate: Number(rate.rate),
      })),
      journalEntries: mappedEntries,
      payments: payments.map((payment) => ({
        id: payment.id,
        invoiceId: payment.invoiceId,
        invoiceNumber: payment.invoice.number,
        amount: money(payment.amount, payment.currency),
        method: payment.method,
        receivedAt: payment.receivedAt.toISOString(),
      })),
      aging: buildAgingFromOpenItems(
        "Receivables",
        invoices
          .filter(
            (invoice) =>
              invoice.status === "posted" || invoice.status === "paid",
          )
          .map((invoice) => ({
            dueDate: dateOnly(invoice.dueDate),
            openAmount: Math.max(
              Number(invoice.total) -
                invoice.payments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0,
                ),
              0,
            ),
            currency: invoice.currency,
          })),
        "Payables",
        purchaseInvoices
          .filter(
            (invoice) =>
              invoice.status === "posted" || invoice.status === "paid",
          )
          .map((invoice) => ({
            dueDate: dateOnly(invoice.dueDate),
            openAmount: Math.max(
              Number(invoice.total) -
                invoice.payments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0,
                ),
              0,
            ),
            currency: invoice.currency,
          })),
      ),
      bankAccounts: bankAccounts.map((account) => {
        const balance = bankTransactions
          .filter((transaction) => transaction.bankAccountId === account.id)
          .reduce(
            (sum, transaction) =>
              sum +
              (transaction.direction === "inbound"
                ? Number(transaction.amount)
                : -Number(transaction.amount)),
            Number(account.openingBalance),
          );
        return {
          id: account.id,
          code: account.code,
          name: account.name,
          currency: account.currency,
          balance: money(balance, account.currency),
          lastReconciledAt: account.lastReconciledAt?.toISOString() ?? null,
        };
      }),
      bankTransactions: bankTransactions.map((transaction) => ({
        id: transaction.id,
        bankAccountId: transaction.bankAccountId,
        reference: transaction.reference,
        direction:
          transaction.direction === "outbound" ? "outbound" : "inbound",
        amount: money(transaction.amount, transaction.currency),
        transactionDate: dateOnly(transaction.transactionDate),
        matchedEntity: transaction.matchedEntity,
        matchedEntityId: transaction.matchedEntityId,
        reconciledAt: transaction.reconciledAt?.toISOString() ?? null,
      })),
      bankReconciliations: bankReconciliations.map((reconciliation) => ({
        id: reconciliation.id,
        bankAccountId: reconciliation.bankAccountId,
        statementDate: dateOnly(reconciliation.statementDate),
        statementBalance: money(
          reconciliation.statementBalance,
          reconciliation.currency,
        ),
        clearedBalance: money(
          reconciliation.clearedBalance,
          reconciliation.currency,
        ),
        variance: money(reconciliation.variance, reconciliation.currency),
        status: reconciliation.status === "balanced" ? "balanced" : "variance",
        reconciledAt: reconciliation.reconciledAt.toISOString(),
      })),
      periodCloses: periodCloses.map((close) => ({
        id: close.id,
        fiscalPeriodId: close.fiscalPeriodId,
        fiscalPeriodName: close.fiscalPeriod.name,
        status: "closed",
        closedAt: close.closedAt.toISOString(),
        journalEntryId: close.journalEntryId,
      })),
      landedCostAllocations: landedCostAllocations.map((allocation) => ({
        id: allocation.id,
        purchaseReceiptId: allocation.purchaseReceiptId,
        purchaseReceiptNumber: allocation.purchaseReceipt.number,
        amount: money(allocation.amount, allocation.currency),
        method: allocation.method === "value" ? "value" : "quantity",
        allocatedAt: allocation.allocatedAt.toISOString(),
      })),
      fixedAssets: fixedAssets.map((asset) => ({
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        purchaseDate: dateOnly(asset.purchaseDate),
        cost: money(asset.cost, asset.currency),
        usefulLifeMonths: asset.usefulLifeMonths,
        accumulatedDepreciation: money(
          asset.accumulatedDepreciation,
          asset.currency,
        ),
        netBookValue: money(
          Math.max(
            Number(asset.cost) - Number(asset.accumulatedDepreciation),
            0,
          ),
          asset.currency,
        ),
        status: asset.status === "disposed" ? "disposed" : "active",
      })),
      depreciationRuns: depreciationRuns.map((run) => ({
        id: run.id,
        fixedAssetId: run.fixedAssetId,
        assetTag: run.fixedAsset.assetTag,
        amount: money(run.amount, run.currency),
        runDate: dateOnly(run.runDate),
        journalEntryId: run.journalEntryId,
      })),
      exchangeRates: exchangeRates.map((rate) => ({
        id: rate.id,
        baseCurrency: rate.baseCurrency,
        quoteCurrency: rate.quoteCurrency,
        rate: Number(rate.rate),
        effectiveDate: dateOnly(rate.effectiveDate),
      })),
      trialBalance: buildTrialBalance(mappedAccounts, mappedEntries),
    };
  }

  async procurement(tenantId: string): Promise<ProcurementSnapshot> {
    const currentTenant = { id: tenantId };
    const [
      suppliers,
      materialRequests,
      rfqs,
      supplierQuotations,
      purchaseOrders,
      purchaseReceipts,
      purchaseInvoices,
      supplierPayments,
    ] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.materialRequest.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.requestForQuote.findMany({
        where: { tenantId: currentTenant.id },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supplierQuotation.findMany({
        where: { tenantId: currentTenant.id },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { tenantId: currentTenant.id },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseReceipt.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          purchaseOrder: { include: { supplier: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.purchaseInvoice.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          purchaseOrder: { include: { supplier: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.supplierPayment.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          purchaseInvoice: {
            include: {
              purchaseOrder: {
                include: { supplier: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { paidAt: "desc" },
      }),
    ]);

    return {
      suppliers: suppliers.map((supplier) => ({
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status === "paused" ? "paused" : "active",
      })),
      materialRequests: materialRequests.map((request) => ({
        id: request.id,
        number: request.number,
        requester: request.requester,
        status: request.status,
        requiredBy: dateOnly(request.requiredBy),
        lines: normalizeLines(request.lines),
      })),
      rfqs: rfqs.map((rfq) => ({
        id: rfq.id,
        number: rfq.number,
        supplierId: rfq.supplierId,
        supplierName: rfq.supplier.name,
        status: rfq.status,
        dueDate: dateOnly(rfq.dueDate),
        lines: normalizeLines(rfq.lines),
      })),
      supplierQuotations: supplierQuotations.map((quotation) => ({
        id: quotation.id,
        number: quotation.number,
        supplierId: quotation.supplierId,
        supplierName: quotation.supplier.name,
        status: quotation.status,
        validUntil: dateOnly(quotation.validUntil),
        total: money(quotation.total, quotation.currency),
        lines: normalizeLines(quotation.lines),
      })),
      purchaseOrders: purchaseOrders.map((order) => ({
        id: order.id,
        number: order.number,
        supplierId: order.supplierId,
        supplierName: order.supplier.name,
        status: order.status,
        expectedDate: dateOnly(order.expectedDate),
        total: money(order.total, order.currency),
        lines: normalizeLines(order.lines),
      })),
      purchaseReceipts: purchaseReceipts.map((receipt) => ({
        id: receipt.id,
        number: receipt.number,
        purchaseOrderId: receipt.purchaseOrderId,
        supplierName: receipt.purchaseOrder.supplier.name,
        status: receipt.status === "void" ? "void" : "posted",
        receivedAt: receipt.receivedAt.toISOString(),
        lines: normalizeLines(receipt.lines),
      })),
      purchaseInvoices: purchaseInvoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        purchaseOrderId: invoice.purchaseOrderId,
        supplierName: invoice.purchaseOrder.supplier.name,
        status: parsePurchaseInvoiceStatus(invoice.status),
        dueDate: dateOnly(invoice.dueDate),
        total: money(invoice.total, invoice.currency),
      })),
      supplierPayments: supplierPayments.map((payment) => ({
        id: payment.id,
        purchaseInvoiceId: payment.purchaseInvoiceId,
        purchaseInvoiceNumber: payment.purchaseInvoice.number,
        supplierName: payment.purchaseInvoice.purchaseOrder.supplier.name,
        amount: money(payment.amount, payment.currency),
        method: payment.method,
        paidAt: payment.paidAt.toISOString(),
      })),
    };
  }

  async inventory(tenantId: string): Promise<InventorySnapshot> {
    const currentTenant = { id: tenantId };
    const [
      warehouses,
      bins,
      ledger,
      reservations,
      transfers,
      cycleCounts,
      reorderPoints,
      valuationLayers,
      pickLists,
      pickTasks,
      packRecords,
      shipments,
      putAwayTasks,
      barcodeScans,
      products,
      ledgerReconciliation,
    ] = await Promise.all([
      this.prisma.warehouse.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.inventoryBin.findMany({
        where: { tenantId: currentTenant.id },
        include: { warehouse: { select: { code: true } } },
        orderBy: { code: "asc" },
      }),
      this.prisma.stockLedgerEntry.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true } },
          bin: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.stockReservation.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true } },
          bin: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.stockTransfer.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          product: { select: { sku: true, name: true } },
          fromBin: { select: { code: true } },
          toBin: { select: { code: true } },
        },
        orderBy: { postedAt: "desc" },
        take: 50,
      }),
      this.prisma.cycleCount.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          product: { select: { sku: true, name: true } },
          bin: { select: { code: true } },
        },
        orderBy: { countedAt: "desc" },
        take: 50,
      }),
      this.prisma.reorderPoint.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.valuationLayer.findMany({
        where: { tenantId: currentTenant.id, remainingQuantity: { gt: 0 } },
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.pickList.findMany({
        where: { tenantId: currentTenant.id },
        include: { salesOrder: { select: { number: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.pickTask.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          product: { select: { sku: true, name: true } },
          bin: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.packRecord.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { packedAt: "desc" },
        take: 50,
      }),
      this.prisma.shipment.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { shippedAt: "desc" },
        take: 50,
      }),
      this.prisma.putAwayTask.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          purchaseReceipt: { select: { number: true } },
          product: { select: { sku: true, name: true } },
          fromBin: { select: { code: true } },
          toBin: { select: { code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.barcodeScan.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { scannedAt: "desc" },
        take: 100,
      }),
      this.prisma.product.findMany({
        where: { tenantId: currentTenant.id },
        select: { id: true, stockOnHand: true },
      }),
      this.prisma.stockLedgerEntry.groupBy({
        by: ["productId"],
        where: { tenantId: currentTenant.id },
        _sum: { quantity: true },
      }),
    ]);
    const ledgerTotals = new Map<string, number>();
    for (const entry of ledgerReconciliation) {
      ledgerTotals.set(entry.productId, entry._sum.quantity ?? 0);
    }
    return {
      warehouses: warehouses.map((warehouse) => ({
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        status: warehouse.status === "inactive" ? "inactive" : "active",
      })),
      bins: bins.map((bin) => ({
        id: bin.id,
        warehouseId: bin.warehouseId,
        warehouseCode: bin.warehouse.code,
        code: bin.code,
        name: bin.name,
        status: bin.status === "inactive" ? "inactive" : "active",
      })),
      ledger: ledger.map((entry) => ({
        id: entry.id,
        productId: entry.productId,
        sku: entry.product.sku,
        productName: entry.product.name,
        warehouseCode: entry.warehouse.code,
        binCode: entry.bin.code,
        quantity: entry.quantity,
        unitCost: money(entry.unitCost, entry.currency),
        value: money(entry.value, entry.currency),
        sourceEntity: entry.sourceEntity,
        sourceId: entry.sourceId,
        createdAt: entry.createdAt.toISOString(),
      })),
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        productId: reservation.productId,
        sku: reservation.product.sku,
        productName: reservation.product.name,
        warehouseCode: reservation.warehouse.code,
        binCode: reservation.bin.code,
        quantity: reservation.quantity,
        sourceEntity: reservation.sourceEntity,
        sourceId: reservation.sourceId,
        status: reservation.status === "released" ? "released" : "active",
      })),
      transfers: transfers.map((transfer) => ({
        id: transfer.id,
        productId: transfer.productId,
        sku: transfer.product.sku,
        productName: transfer.product.name,
        fromBinCode: transfer.fromBin.code,
        toBinCode: transfer.toBin.code,
        quantity: transfer.quantity,
        status: transfer.status === "void" ? "void" : "posted",
        postedAt: transfer.postedAt.toISOString(),
      })),
      cycleCounts: cycleCounts.map((count) => ({
        id: count.id,
        productId: count.productId,
        sku: count.product.sku,
        productName: count.product.name,
        binCode: count.bin.code,
        countedQuantity: count.countedQuantity,
        systemQuantity: count.systemQuantity,
        variance: count.variance,
        status: count.status === "void" ? "void" : "posted",
        countedAt: count.countedAt.toISOString(),
      })),
      reorderPoints: reorderPoints.map((point) => ({
        id: point.id,
        productId: point.productId,
        sku: point.product.sku,
        productName: point.product.name,
        warehouseCode: point.warehouse.code,
        minimumQuantity: point.minimumQuantity,
        reorderQuantity: point.reorderQuantity,
      })),
      valuationLayers: valuationLayers.map((layer) => ({
        id: layer.id,
        productId: layer.productId,
        sku: layer.product.sku,
        productName: layer.product.name,
        remainingQuantity: layer.remainingQuantity,
        unitCost: money(layer.unitCost, layer.currency),
        sourceEntity: layer.sourceEntity,
        sourceId: layer.sourceId,
      })),
      pickLists: pickLists.map(mapPickList),
      pickTasks: pickTasks.map(mapPickTask),
      packRecords: packRecords.map(mapPackRecord),
      shipments: shipments.map(mapShipment),
      putAwayTasks: putAwayTasks.map(mapPutAwayTask),
      barcodeScans: barcodeScans.map(mapBarcodeScan),
      reconciled: products.every(
        (product) =>
          (ledgerTotals.get(product.id) ?? 0) === product.stockOnHand,
      ),
    };
  }

  async manufacturing(tenantId: string): Promise<ManufacturingSnapshot> {
    const currentTenant = { id: tenantId };
    const [
      boms,
      workCenters,
      routings,
      workOrders,
      jobCards,
      downtimeEntries,
      productionPlans,
      mrpSuggestions,
    ] = await Promise.all([
      this.prisma.billOfMaterial.findMany({
        where: { tenantId: currentTenant.id },
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workCenter.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.routing.findMany({
        where: { tenantId: currentTenant.id },
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workOrder.findMany({
        where: { tenantId: currentTenant.id },
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.jobCard.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          workOrder: { select: { number: true } },
          workCenter: { select: { code: true } },
        },
        orderBy: [{ createdAt: "desc" }, { operationSequence: "asc" }],
      }),
      this.prisma.downtimeEntry.findMany({
        where: { tenantId: currentTenant.id },
        include: { workCenter: { select: { code: true } } },
        orderBy: { startedAt: "desc" },
        take: 50,
      }),
      this.prisma.productionPlan.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.mrpSuggestion.findMany({
        where: { tenantId: currentTenant.id },
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      boms: boms.map((bom) => ({
        id: bom.id,
        number: bom.number,
        productId: bom.productId,
        sku: bom.product.sku,
        productName: bom.product.name,
        status: bom.status,
        outputQuantity: bom.outputQuantity,
        items: normalizeBomItems(bom.items),
        estimatedCost: money(bom.estimatedCost, bom.currency),
      })),
      workCenters: workCenters.map((center) => ({
        id: center.id,
        code: center.code,
        name: center.name,
        capacityPerDay: center.capacityPerDay,
        hourlyRate: money(center.hourlyRate, center.currency),
        status: center.status === "inactive" ? "inactive" : "active",
      })),
      routings: routings.map((routing) => ({
        id: routing.id,
        number: routing.number,
        productId: routing.productId,
        sku: routing.product.sku,
        productName: routing.product.name,
        status: routing.status,
        operations: normalizeRoutingOperations(routing.operations),
      })),
      workOrders: workOrders.map((order) =>
        mapWorkOrder(order, order.product.sku, order.product.name),
      ),
      jobCards: jobCards.map(mapJobCard),
      downtimeEntries: downtimeEntries.map(mapDowntimeEntry),
      capacitySchedule: buildCapacitySchedule(
        workCenters,
        jobCards,
        downtimeEntries,
      ),
      productionPlans: productionPlans.map((plan) => ({
        id: plan.id,
        number: plan.number,
        sourceEntity: plan.sourceEntity,
        sourceId: plan.sourceId,
        status: plan.status,
        demandDate: dateOnly(plan.demandDate),
        lines: normalizeProductionPlanLines(plan.lines),
      })),
      mrpSuggestions: mrpSuggestions.map((suggestion) => ({
        id: suggestion.id,
        productionPlanId: suggestion.productionPlanId,
        productId: suggestion.productId,
        sku: suggestion.product.sku,
        productName: suggestion.product.name,
        suggestionType:
          suggestion.suggestionType === "purchase" ? "purchase" : "work_order",
        quantity: suggestion.quantity,
        requiredBy: dateOnly(suggestion.requiredBy),
        status: parseMrpSuggestionStatus(suggestion.status),
      })),
    };
  }

  async quality(tenantId: string): Promise<QualitySnapshot> {
    const currentTenant = { id: tenantId };
    const [
      traceRecords,
      traceMovements,
      templates,
      inspections,
      nonConformances,
      correctiveActions,
      supplierScorecards,
      recalls,
    ] = await Promise.all([
      this.prisma.traceRecord.findMany({
        where: { tenantId: currentTenant.id },
        include: { product: { select: { sku: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.traceMovement.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          traceRecord: { select: { lotNumber: true, serialNumber: true } },
          product: { select: { sku: true, name: true } },
        },
        orderBy: { occurredAt: "desc" },
        take: 100,
      }),
      this.prisma.inspectionTemplate.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.qualityInspection.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          template: { select: { name: true } },
          traceRecord: { select: { lotNumber: true } },
        },
        orderBy: { inspectedAt: "desc" },
      }),
      this.prisma.nonConformance.findMany({
        where: { tenantId: currentTenant.id },
        include: { traceRecord: { select: { lotNumber: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.correctiveAction.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.supplierScorecard.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { period: "desc" },
      }),
      this.prisma.recall.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { openedAt: "desc" },
      }),
    ]);
    return {
      traceRecords: traceRecords.map((trace) => ({
        id: trace.id,
        productId: trace.productId,
        sku: trace.product.sku,
        productName: trace.product.name,
        lotNumber: trace.lotNumber,
        serialNumber: trace.serialNumber,
        sourceEntity: trace.sourceEntity,
        sourceId: trace.sourceId,
        status: parseTraceStatus(trace.status),
        receivedAt: trace.receivedAt.toISOString(),
      })),
      traceMovements: traceMovements.map(mapTraceMovement),
      inspectionTemplates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        entityType: parseInspectionEntityType(template.entityType),
        checkpoints: normalizeStringArray(template.checkpoints),
        active: template.active,
      })),
      inspections: inspections.map((inspection) => ({
        id: inspection.id,
        templateId: inspection.templateId,
        templateName: inspection.template.name,
        traceRecordId: inspection.traceRecordId,
        lotNumber: inspection.traceRecord.lotNumber,
        status: parseInspectionStatus(inspection.status),
        inspectedBy: inspection.inspectedBy,
        inspectedAt: inspection.inspectedAt.toISOString(),
        results: normalizeInspectionResults(inspection.results),
      })),
      nonConformances: nonConformances.map((ncr) => ({
        id: ncr.id,
        inspectionId: ncr.inspectionId,
        traceRecordId: ncr.traceRecordId,
        lotNumber: ncr.traceRecord.lotNumber,
        severity: parseSeverity(ncr.severity),
        status: parseNonConformanceStatus(ncr.status),
        description: ncr.description,
      })),
      correctiveActions: correctiveActions.map((action) => ({
        id: action.id,
        nonConformanceId: action.nonConformanceId,
        owner: action.owner,
        dueDate: dateOnly(action.dueDate),
        status: action.status === "done" ? "done" : "open",
        action: action.action,
      })),
      supplierScorecards: supplierScorecards.map((scorecard) => ({
        id: scorecard.id,
        supplierId: scorecard.supplierId,
        supplierName: scorecard.supplierName,
        period: scorecard.period,
        inspections: scorecard.inspections,
        defects: scorecard.defects,
        score: scorecard.score,
      })),
      recalls: recalls.map((recall) => ({
        id: recall.id,
        lotNumber: recall.lotNumber,
        status: parseRecallStatus(recall.status),
        reason: recall.reason,
        affectedTraceIds: recall.affectedTraceIds,
        openedAt: recall.openedAt.toISOString(),
      })),
    };
  }

  async commerce(tenantId: string): Promise<CommerceSnapshot> {
    const currentTenant = { id: tenantId };
    await this.ensureCommerceInfrastructure(currentTenant.id);
    const [
      channels,
      priceLists,
      profiles,
      registers,
      shifts,
      sales,
      catalogItems,
      channelOrders,
    ] = await Promise.all([
      this.prisma.commerceChannel.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.priceList.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          items: {
            include: { product: { select: { sku: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.posProfile.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.posRegister.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.posShift.findMany({
        where: { tenantId: currentTenant.id },
        include: { register: { select: { code: true } } },
        orderBy: { openedAt: "desc" },
        take: 20,
      }),
      this.prisma.posSale.findMany({
        where: { tenantId: currentTenant.id },
        include: { customer: { select: { name: true } } },
        orderBy: { postedAt: "desc" },
        take: 20,
      }),
      this.prisma.channelCatalogItem.findMany({
        where: { tenantId: currentTenant.id },
        include: { product: { select: { sku: true } } },
        orderBy: { publishedAt: "desc" },
        take: 50,
      }),
      this.prisma.channelOrder.findMany({
        where: { tenantId: currentTenant.id },
        include: {
          channel: { select: { name: true } },
          customer: { select: { name: true } },
        },
        orderBy: { importedAt: "desc" },
        take: 50,
      }),
    ]);
    return {
      channels: channels.map((channel) => ({
        id: channel.id,
        code: channel.code,
        name: channel.name,
        channelType: parseChannelType(channel.channelType),
        status: channel.status === "paused" ? "paused" : "active",
      })),
      priceLists: priceLists.map((priceList) => ({
        id: priceList.id,
        name: priceList.name,
        currency: priceList.currency,
        channelId: priceList.channelId,
        items: priceList.items.map((item) => ({
          productId: item.productId,
          sku: item.product.sku,
          price: money(item.price, item.currency),
        })),
      })),
      posProfiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        warehouseCode: profile.warehouseCode,
        priceListId: profile.priceListId,
        cashAccountCode: profile.cashAccountCode,
      })),
      registers: registers.map((register) => ({
        id: register.id,
        profileId: register.profileId,
        code: register.code,
        name: register.name,
        status: register.status === "open" ? "open" : "closed",
      })),
      shifts: shifts.map((shift) => ({
        id: shift.id,
        registerId: shift.registerId,
        registerCode: shift.register.code,
        openedBy: shift.openedBy,
        status: shift.status === "closed" ? "closed" : "open",
        openingCash: money(shift.openingCash, shift.currency),
        closingCash:
          shift.closingCash === null
            ? null
            : money(shift.closingCash, shift.currency),
        expectedCash: money(shift.expectedCash, shift.currency),
        openedAt: shift.openedAt.toISOString(),
        closedAt: shift.closedAt?.toISOString() ?? null,
      })),
      sales: sales.map((sale) => ({
        id: sale.id,
        shiftId: sale.shiftId,
        receiptNumber: sale.receiptNumber,
        customerName: sale.customer.name,
        tenderType: parseTenderType(sale.tenderType),
        status: sale.status === "void" ? "void" : "posted",
        total: money(sale.total, sale.currency),
        invoiceId: sale.invoiceId,
        paymentId: sale.paymentId,
        lines: normalizeLines(sale.lines),
        postedAt: sale.postedAt.toISOString(),
      })),
      catalogItems: catalogItems.map((item) => ({
        id: item.id,
        channelId: item.channelId,
        productId: item.productId,
        sku: item.product.sku,
        title: item.title,
        price: money(item.price, item.currency),
        published: item.published,
      })),
      channelOrders: channelOrders.map((order) => ({
        id: order.id,
        channelId: order.channelId,
        channelName: order.channel.name,
        externalOrderId: order.externalOrderId,
        customerName: order.customer.name,
        status: order.status === "fulfilled" ? "fulfilled" : "imported",
        total: money(order.total, order.currency),
        salesOrderId: order.salesOrderId,
        lines: normalizeLines(order.lines),
        importedAt: order.importedAt.toISOString(),
      })),
    };
  }

  async hr(tenantId: string): Promise<HrSnapshot> {
    const currentTenant = { id: tenantId };
    await this.ensureHrInfrastructure(currentTenant.id);
    const [
      departments,
      workShifts,
      attendance,
      expenseClaims,
      employeeAdvances,
      salaryStructures,
      payrollRuns,
      payslips,
    ] = await Promise.all([
      this.prisma.department.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.workShift.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { code: "asc" },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { tenantId: currentTenant.id },
        include: { employee: { select: { name: true } } },
        orderBy: { workDate: "desc" },
        take: 50,
      }),
      this.prisma.expenseClaim.findMany({
        where: { tenantId: currentTenant.id },
        include: { employee: { select: { name: true } } },
        orderBy: { submittedAt: "desc" },
        take: 50,
      }),
      this.prisma.employeeAdvance.findMany({
        where: { tenantId: currentTenant.id },
        include: { employee: { select: { name: true } } },
        orderBy: { requestedAt: "desc" },
        take: 50,
      }),
      this.prisma.salaryStructure.findMany({
        where: { tenantId: currentTenant.id },
        include: { employee: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
      this.prisma.payrollRun.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { periodEnd: "desc" },
        take: 20,
      }),
      this.prisma.payslip.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    return {
      departments: departments.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        manager: department.manager,
        active: department.active,
      })),
      workShifts: workShifts.map((shift) => ({
        id: shift.id,
        code: shift.code,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        expectedHours: Number(shift.expectedHours),
      })),
      attendance: attendance.map((record) => ({
        id: record.id,
        employeeId: record.employeeId,
        employeeName: record.employee.name,
        workDate: dateOnly(record.workDate),
        checkIn: record.checkIn.toISOString(),
        checkOut: record.checkOut.toISOString(),
        hours: Number(record.hours),
        status: parseAttendanceStatus(record.status),
      })),
      expenseClaims: expenseClaims.map((claim) => ({
        id: claim.id,
        employeeId: claim.employeeId,
        employeeName: claim.employee.name,
        number: claim.number,
        status: parseExpenseClaimStatus(claim.status),
        category: claim.category,
        description: claim.description,
        amount: money(claim.amount, claim.currency),
        submittedAt: claim.submittedAt.toISOString(),
        approvedAt: claim.approvedAt?.toISOString() ?? null,
        paidAt: claim.paidAt?.toISOString() ?? null,
        journalEntryId: claim.journalEntryId,
      })),
      employeeAdvances: employeeAdvances.map((advance) => ({
        id: advance.id,
        employeeId: advance.employeeId,
        employeeName: advance.employee.name,
        number: advance.number,
        status: advance.status === "paid" ? "paid" : "requested",
        amount: money(advance.amount, advance.currency),
        requestedAt: advance.requestedAt.toISOString(),
        paidAt: advance.paidAt?.toISOString() ?? null,
        paymentReference: advance.paymentReference,
        journalEntryId: advance.journalEntryId,
      })),
      salaryStructures: salaryStructures.map((structure) => ({
        id: structure.id,
        employeeId: structure.employeeId,
        employeeName: structure.employee.name,
        name: structure.name,
        basePay: money(structure.basePay, structure.currency),
        earnings: normalizeCompensationItems(
          structure.earnings,
          structure.currency,
        ),
        deductions: normalizeCompensationItems(
          structure.deductions,
          structure.currency,
        ),
        active: structure.active,
      })),
      payrollRuns: payrollRuns.map((run) => ({
        id: run.id,
        number: run.number,
        periodStart: dateOnly(run.periodStart),
        periodEnd: dateOnly(run.periodEnd),
        status: run.status === "draft" ? "draft" : "posted",
        grossPay: money(run.grossPay, run.currency),
        deductions: money(run.deductions, run.currency),
        netPay: money(run.netPay, run.currency),
        postedAt: run.postedAt?.toISOString() ?? null,
        journalEntryId: run.journalEntryId,
      })),
      payslips: payslips.map((payslip) => ({
        id: payslip.id,
        payrollRunId: payslip.payrollRunId,
        employeeId: payslip.employeeId,
        employeeName: payslip.employeeName,
        grossPay: money(payslip.grossPay, payslip.currency),
        deductions: money(payslip.deductions, payslip.currency),
        netPay: money(payslip.netPay, payslip.currency),
        status: payslip.status === "draft" ? "draft" : "posted",
      })),
    };
  }

  async reporting(tenantId: string): Promise<ReportingSnapshot> {
    const currentTenant = { id: tenantId };
    const [
      reports,
      runs,
      printFormats,
      exportJobs,
      dashboards,
      scheduledDeliveries,
    ] = await Promise.all([
      this.prisma.savedReport.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.reportRun.findMany({
        where: { tenantId: currentTenant.id },
        include: { report: { select: { name: true } } },
        orderBy: { ranAt: "desc" },
        take: 50,
      }),
      this.prisma.printFormat.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.exportJob.findMany({
        where: { tenantId: currentTenant.id },
        include: { report: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.dashboardDefinition.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.scheduledDelivery.findMany({
        where: { tenantId: currentTenant.id },
        include: { report: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      reports: reports.map((report) => ({
        id: report.id,
        name: report.name,
        entityType: report.entityType,
        columns: report.columns,
        filters: normalizeReportFilters(report.filters),
        parameters: normalizeReportParameters(report.parameters),
        sorts: normalizeReportSorts(report.sorts),
        groupBy: report.groupBy,
        chart: normalizeReportChart(report.chart),
        owner: report.owner,
      })),
      runs: runs.map((run) => ({
        id: run.id,
        reportId: run.reportId,
        reportName: run.report.name,
        status: parseReportStatus(run.status),
        rowCount: run.rowCount,
        ranAt: run.ranAt.toISOString(),
        rows: normalizeReportRows(run.rows),
      })),
      printFormats: printFormats.map((format) => ({
        id: format.id,
        name: format.name,
        entityType: format.entityType,
        template: format.template,
        blocks: normalizePrintBlocks(format.blocks),
        active: format.active,
      })),
      exportJobs: exportJobs.map((job) => ({
        id: job.id,
        reportId: job.reportId,
        reportName: job.report.name,
        format: job.format === "json" ? "json" : "csv",
        status: parseReportStatus(job.status),
        downloadUrl: job.downloadUrl,
        createdAt: job.createdAt.toISOString(),
      })),
      dashboards: dashboards.map((dashboard) => ({
        id: dashboard.id,
        name: dashboard.name,
        cards: normalizeDashboardCards(dashboard.cards),
      })),
      scheduledDeliveries: scheduledDeliveries.map((delivery) => ({
        id: delivery.id,
        reportId: delivery.reportId,
        reportName: delivery.report.name,
        cron: delivery.cron,
        recipient: delivery.recipient,
        active: delivery.active,
      })),
    };
  }

  async integration(tenantId: string): Promise<IntegrationSnapshot> {
    const currentTenant = { id: tenantId };
    const [
      apiKeys,
      webhookSubscriptions,
      webhookDeliveries,
      deadLetters,
      outboxEvents,
      workflowTasks,
      mappings,
      connectors,
    ] = await Promise.all([
      this.prisma.apiKeyRecord.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.webhookSubscription.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.webhookDelivery.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.deadLetterRecord.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.outboxEvent.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.workflowTaskRecord.findMany({
        where: { tenantId: currentTenant.id },
        include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 100,
      }),
      this.prisma.integrationMapping.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.connector.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
    ]);
    return {
      apiKeys: apiKeys.map(mapApiKeyRecord),
      webhookSubscriptions: webhookSubscriptions.map(mapWebhookSubscription),
      webhookDeliveries: webhookDeliveries.map(mapWebhookDelivery),
      deadLetters: deadLetters.map(mapDeadLetterRecord),
      outboxEvents: outboxEvents.map(mapOutboxEvent),
      workflowTasks: workflowTasks.map(mapWorkflowTaskRecord),
      mappings: mappings.map(mapIntegrationMapping),
      connectors: connectors.map(mapConnector),
    };
  }

  async operations(tenantId: string): Promise<OperationsSnapshot> {
    const currentTenant = { id: tenantId };
    const [
      leads,
      opportunities,
      projects,
      tasks,
      employees,
      leaveRequests,
      serviceCases,
    ] = await Promise.all([
      this.prisma.lead.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.opportunity.findMany({
        where: { tenantId: currentTenant.id },
        include: { lead: { select: { companyName: true } } },
        orderBy: { expectedCloseDate: "asc" },
      }),
      this.prisma.projectRecord.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.projectTask.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { dueDate: "asc" },
      }),
      this.prisma.employeeRecord.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { name: "asc" },
      }),
      this.prisma.leaveRequest.findMany({
        where: { tenantId: currentTenant.id },
        include: { employee: { select: { name: true } } },
        orderBy: { startDate: "asc" },
      }),
      this.prisma.serviceCase.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return {
      leads: leads.map(mapLead),
      opportunities: opportunities.map((opportunity) => ({
        id: opportunity.id,
        leadId: opportunity.leadId,
        companyName: opportunity.lead.companyName,
        stage: parseOpportunityStage(opportunity.stage),
        expectedValue: money(opportunity.expectedValue, opportunity.currency),
        expectedCloseDate: dateOnly(opportunity.expectedCloseDate),
      })),
      projects: projects.map(mapProject),
      tasks: tasks.map(mapProjectTask),
      employees: employees.map(mapEmployee),
      leaveRequests: leaveRequests.map((request) =>
        mapLeaveRequest(request, request.employee.name),
      ),
      serviceCases: serviceCases.map(mapServiceCase),
    };
  }

  async customization(tenantId: string): Promise<CustomizationSnapshot> {
    const currentTenant = { id: tenantId };
    const [
      customFields,
      views,
      automationRules,
      workflowAssignmentRules,
      workflowEscalationRules,
      enabledModulesSetting,
    ] = await Promise.all([
      this.prisma.customFieldDefinition.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: [
          { entityType: "asc" },
          { displayOrder: "asc" },
          { label: "asc" },
        ],
      }),
      this.prisma.viewDefinition.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: [{ entityType: "asc" }, { name: "asc" }],
      }),
      this.prisma.automationRule.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: [{ enabled: "desc" }, { name: "asc" }],
      }),
      this.prisma.workflowAssignmentRule.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: [
          { active: "desc" },
          { workflowId: "asc" },
          { fromState: "asc" },
          { toState: "asc" },
          { role: "asc" },
        ],
      }),
      this.prisma.workflowEscalationRule.findMany({
        where: { tenantId: currentTenant.id },
        orderBy: [
          { active: "desc" },
          { workflowId: "asc" },
          { fromState: "asc" },
          { toState: "asc" },
          { targetRole: "asc" },
        ],
      }),
      this.prisma.setting.findUnique({
        where: {
          tenantId_key: { tenantId: currentTenant.id, key: "enabled_modules" },
        },
      }),
    ]);

    return {
      customFields: customFields.map((field) => ({
        id: field.id,
        entityType: field.entityType,
        key: field.key,
        label: field.label,
        fieldType: parseFieldType(field.fieldType),
        required: field.required,
        options: normalizeStringArray(field.options),
        displayOrder: field.displayOrder,
      })),
      views: views.map((view) => ({
        id: view.id,
        entityType: view.entityType,
        name: view.name,
        fields: normalizeStringArray(view.fields),
      })),
      automationRules: automationRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        triggerType: rule.triggerType === "schedule" ? "schedule" : "event",
        triggerEvent: rule.triggerEvent,
        schedule: rule.schedule,
        enabled: rule.enabled,
        actions: normalizeActionArray(rule.actions),
        runCount: rule.runCount,
        lastRunAt: rule.lastRunAt?.toISOString() ?? null,
        lastError: rule.lastError,
      })),
      workflowAssignmentRules: workflowAssignmentRules.map(
        mapWorkflowAssignmentRule,
      ),
      workflowEscalationRules: workflowEscalationRules.map(
        mapWorkflowEscalationRule,
      ),
      enabledModules:
        normalizeStringArray(enabledModulesSetting?.value).length > 0
          ? normalizeStringArray(enabledModulesSetting?.value)
          : ["core", "sales"],
    };
  }

  async auditTrail(tenantId: string): Promise<AuditEvent[]> {
    const currentTenant = { id: tenantId };
    const records = await this.prisma.auditEvent.findMany({
      where: { tenantId: currentTenant.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return records.map((record) => ({
      id: record.id,
      tenantId: record.tenantId,
      actorId: record.actorId,
      entity: record.entity,
      entityId: record.entityId,
      action: record.action,
      message: record.message,
      createdAt: record.createdAt.toISOString(),
    }));
  }

  async workflowInstance(
    tenantId: string,
    input: WorkflowInstanceLookupInput,
  ): Promise<WorkflowInstance | null> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: {
        tenantId_workflowId_entity_documentId: {
          tenantId,
          workflowId: input.workflowId,
          entity: input.document.entity,
          documentId: input.document.id,
        },
      },
      include: { transitions: { orderBy: { occurredAt: "asc" } } },
    });
    return instance ? mapWorkflowInstance(instance) : null;
  }

  async ensureWorkflowInstance(
    tenantId: string,
    input: EnsureWorkflowInstanceInput,
  ): Promise<WorkflowInstance> {
    const instance = await this.upsertPrismaWorkflowInstance(
      this.prisma,
      tenantId,
      input,
    );
    return mapWorkflowInstance(instance);
  }

  async recordWorkflowTransition(
    tenantId: string,
    transition: WorkflowTransitionRecord,
  ): Promise<WorkflowInstance> {
    const instance = await this.recordPrismaWorkflowTransition(
      this.prisma,
      tenantId,
      transition,
    );
    await this.recordAudit(
      tenantId,
      "WorkflowTransition",
      transition.id,
      "recorded",
      `Workflow ${transition.workflowId} moved ${transition.document.entity} ${transition.document.id} to ${transition.to}.`,
    );
    return mapWorkflowInstance(instance);
  }

  async createCustomer(tenantId: string, input: CreateCustomerInput) {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        status: "active",
        owner: input.owner,
        email: input.email,
        creditLimit: input.creditLimit.amount,
        currency: input.creditLimit.currency,
        customData: input.customFields ?? {},
      },
    });
    await this.recordAudit(
      tenantId,
      "Customer",
      customer.id,
      "created",
      `Customer ${customer.name} created.`,
    );
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      status: customer.status,
      owner: customer.owner,
      email: customer.email,
      creditLimit: money(customer.creditLimit, customer.currency),
      customFields: normalizeCustomFields(customer.customData),
    };
  }

  async createProduct(tenantId: string, input: CreateProductInput) {
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          tenantId,
          sku: input.sku,
          name: input.name,
          category: input.category,
          price: input.price.amount,
          currency: input.price.currency,
          stockOnHand: input.stockOnHand,
        },
      });
      if (input.stockOnHand > 0) {
        const bin = await tx.inventoryBin.findFirstOrThrow({
          where: { tenantId, code: "MAIN-01" },
          include: { warehouse: true },
        });
        await tx.stockLedgerEntry.create({
          data: {
            tenantId,
            productId: created.id,
            warehouseId: bin.warehouseId,
            binId: bin.id,
            quantity: input.stockOnHand,
            unitCost: input.price.amount,
            value: input.stockOnHand * input.price.amount,
            currency: input.price.currency,
            sourceEntity: "OpeningBalance",
            sourceId: `opening_${created.id}`,
          },
        });
        await tx.valuationLayer.create({
          data: {
            tenantId,
            productId: created.id,
            warehouseId: bin.warehouseId,
            binId: bin.id,
            remainingQuantity: input.stockOnHand,
            unitCost: input.price.amount,
            currency: input.price.currency,
            sourceEntity: "OpeningBalance",
            sourceId: `opening_${created.id}`,
          },
        });
      }
      return created;
    });
    await this.recordAudit(
      tenantId,
      "Product",
      product.id,
      "created",
      `Product ${product.name} created.`,
    );
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: money(product.price, product.currency),
      stockOnHand: product.stockOnHand,
    };
  }

  async createSupplier(
    tenantId: string,
    input: CreateSupplierInput,
  ): Promise<Supplier> {
    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        email: input.email,
        phone: input.phone,
        paymentTerms: input.paymentTerms,
        status: "active",
      },
    });
    await this.recordAudit(
      tenantId,
      "Supplier",
      supplier.id,
      "created",
      `Supplier ${supplier.name} created.`,
    );
    return {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      paymentTerms: supplier.paymentTerms,
      status: "active",
    };
  }

  async createMaterialRequest(
    tenantId: string,
    input: CreateMaterialRequestInput,
  ): Promise<MaterialRequest> {
    const count = await this.prisma.materialRequest.count({
      where: { tenantId },
    });
    const request = await this.prisma.materialRequest.create({
      data: {
        tenantId,
        number: nextDocumentNumber("MR", count),
        requester: input.requester,
        status: "draft",
        requiredBy: new Date(`${input.requiredBy}T00:00:00.000Z`),
        lines: input.lines,
      },
    });
    await this.recordAudit(
      tenantId,
      "MaterialRequest",
      request.id,
      "created",
      `Material request ${request.number} created.`,
    );
    return {
      id: request.id,
      number: request.number,
      requester: request.requester,
      status: request.status,
      requiredBy: dateOnly(request.requiredBy),
      lines: normalizeLines(request.lines),
    };
  }

  async createPurchaseOrder(
    tenantId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    const supplier = await this.prisma.supplier.findFirstOrThrow({
      where: { id: input.supplierId, tenantId },
      select: { id: true, name: true },
    });
    const count = await this.prisma.purchaseOrder.count({
      where: { tenantId },
    });
    const total = totalLines(input.lines);
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          tenantId,
          supplierId: supplier.id,
          number: nextDocumentNumber("PO", count),
          status: "draft",
          expectedDate: new Date(`${input.expectedDate}T00:00:00.000Z`),
          total: total.amount,
          currency: total.currency,
          lines: input.lines,
        },
      });
      await this.upsertPrismaWorkflowInstance(tx, tenantId, {
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: created.id },
        state: created.status,
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "PurchaseOrder",
          entityId: created.id,
          action: "created",
          message: `Purchase order ${created.number} created.`,
        },
      });
      return created;
    });
    return mapPurchaseOrder(order, supplier.name);
  }

  async transitionPurchaseOrder(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ): Promise<PurchaseOrder> {
    const status = parseRecordStatus(input.status);
    const order = await this.prisma.$transaction(async (tx) => {
      const before = await tx.purchaseOrder.findFirstOrThrow({
        where: { id: input.id, tenantId },
        include: { supplier: { select: { name: true } } },
      });
      assertRecordTransition("PurchaseOrder", before.status, status);
      const updated = await tx.purchaseOrder.update({
        where: { id: before.id },
        data: { status },
        include: { supplier: { select: { name: true } } },
      });
      if (input.workflowTransition) {
        await this.recordPrismaWorkflowTransition(
          tx,
          tenantId,
          input.workflowTransition,
        );
      }
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "PurchaseOrder",
          entityId: updated.id,
          action: "transitioned",
          message: `Purchase order ${updated.number} moved to ${status}.`,
        },
      });
      return updated;
    });
    return mapPurchaseOrder(order, order.supplier.name);
  }

  async receivePurchaseOrder(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseReceipt> {
    const order = await this.prisma.purchaseOrder.findFirstOrThrow({
      where: { id: purchaseOrderId, tenantId },
      include: { supplier: { select: { name: true } } },
    });
    const existing = await this.prisma.purchaseReceipt.findUnique({
      where: {
        tenantId_purchaseOrderId: { tenantId, purchaseOrderId: order.id },
      },
    });
    if (existing) {
      return {
        id: existing.id,
        number: existing.number,
        purchaseOrderId: existing.purchaseOrderId,
        supplierName: order.supplier.name,
        status: existing.status === "void" ? "void" : "posted",
        receivedAt: existing.receivedAt.toISOString(),
        lines: normalizeLines(existing.lines),
      };
    }
    if (order.status !== "approved") {
      throw new Error(
        `Purchase order ${order.number} must be approved before receipt.`,
      );
    }
    const receiptCount = await this.prisma.purchaseReceipt.count({
      where: { tenantId },
    });
    const receipt = await this.applyPrismaProcurementStock(
      tenantId,
      order.id,
      order.number,
      nextDocumentNumber("PRC", receiptCount),
      normalizeLines(order.lines),
    );
    await this.recordAudit(
      tenantId,
      "PurchaseReceipt",
      receipt.id,
      "posted",
      `Purchase receipt ${receipt.number} posted.`,
    );
    return {
      id: receipt.id,
      number: receipt.number,
      purchaseOrderId: receipt.purchaseOrderId,
      supplierName: order.supplier.name,
      status: "posted",
      receivedAt: receipt.receivedAt.toISOString(),
      lines: normalizeLines(receipt.lines),
    };
  }

  async createPurchaseInvoiceFromOrder(
    tenantId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseInvoice> {
    const order = await this.prisma.purchaseOrder.findFirstOrThrow({
      where: { id: purchaseOrderId, tenantId },
      include: {
        supplier: { select: { name: true } },
        invoices: { take: 1, orderBy: { createdAt: "desc" } },
      },
    });
    const existing = order.invoices[0];
    if (existing) {
      return {
        id: existing.id,
        number: existing.number,
        purchaseOrderId: existing.purchaseOrderId,
        supplierName: order.supplier.name,
        status: parsePurchaseInvoiceStatus(existing.status),
        dueDate: dateOnly(existing.dueDate),
        total: money(existing.total, existing.currency),
      };
    }
    const invoiceCount = await this.prisma.purchaseInvoice.count({
      where: { tenantId },
    });
    const invoice = await this.prisma.purchaseInvoice.create({
      data: {
        tenantId,
        purchaseOrderId: order.id,
        number: nextDocumentNumber("PINV", invoiceCount),
        status: "posted",
        dueDate: daysFromNow(30),
        total: order.total,
        currency: order.currency,
      },
    });
    const journalEntry = await this.postPrismaPurchaseInvoiceJournal(
      tenantId,
      invoice.id,
      invoice.number,
      money(invoice.total, invoice.currency),
    );
    await this.prisma.purchaseInvoice.update({
      where: { id: invoice.id },
      data: { journalEntryId: journalEntry.id },
    });
    await this.recordAudit(
      tenantId,
      "PurchaseInvoice",
      invoice.id,
      "posted",
      `Purchase invoice ${invoice.number} posted.`,
    );
    return {
      id: invoice.id,
      number: invoice.number,
      purchaseOrderId: invoice.purchaseOrderId,
      supplierName: order.supplier.name,
      status: "posted",
      dueDate: dateOnly(invoice.dueDate),
      total: money(invoice.total, invoice.currency),
    };
  }

  async payPurchaseInvoice(
    tenantId: string,
    input: SupplierPaymentInput,
  ): Promise<SupplierPayment> {
    const invoice = await this.prisma.purchaseInvoice.findFirstOrThrow({
      where: { id: input.purchaseInvoiceId, tenantId },
      include: {
        purchaseOrder: { include: { supplier: { select: { name: true } } } },
      },
    });
    const journalEntry = await this.postPrismaSupplierPaymentJournal(
      tenantId,
      invoice.id,
      invoice.number,
      input.amount,
    );
    const payment = await this.prisma.supplierPayment.create({
      data: {
        tenantId,
        purchaseInvoiceId: invoice.id,
        journalEntryId: journalEntry.id,
        amount: input.amount.amount,
        currency: input.amount.currency,
        method: input.method,
        paidAt: new Date(input.paidAt),
      },
    });
    if (input.amount.amount >= Number(invoice.total)) {
      await this.prisma.purchaseInvoice.update({
        where: { id: invoice.id },
        data: { status: "paid" },
      });
    }
    await this.recordAudit(
      tenantId,
      "SupplierPayment",
      payment.id,
      "recorded",
      `Supplier payment for ${invoice.number} recorded.`,
    );
    return {
      id: payment.id,
      purchaseInvoiceId: payment.purchaseInvoiceId,
      purchaseInvoiceNumber: invoice.number,
      supplierName: invoice.purchaseOrder.supplier.name,
      amount: money(payment.amount, payment.currency),
      method: payment.method,
      paidAt: payment.paidAt.toISOString(),
    };
  }

  async reserveStock(
    tenantId: string,
    input: CreateStockReservationInput,
  ): Promise<StockReservation> {
    const [product, bin] = await Promise.all([
      this.prisma.product.findFirstOrThrow({
        where: { id: input.productId, tenantId },
      }),
      this.defaultPrismaBin(tenantId),
    ]);
    const [ledgerTotal, reservedTotal] = await Promise.all([
      this.stockLedgerQuantity(tenantId, product.id),
      this.stockReservedQuantity(tenantId, product.id),
    ]);
    if (ledgerTotal - reservedTotal < input.quantity) {
      throw new Error(`Insufficient available stock for ${product.sku}.`);
    }
    const existing = await this.prisma.stockReservation.findUnique({
      where: {
        tenantId_sourceEntity_sourceId_productId: {
          tenantId,
          sourceEntity: input.sourceEntity,
          sourceId: input.sourceId,
          productId: product.id,
        },
      },
      include: {
        warehouse: { select: { code: true } },
        bin: { select: { code: true } },
      },
    });
    if (existing) {
      return {
        id: existing.id,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        warehouseCode: existing.warehouse.code,
        binCode: existing.bin.code,
        quantity: existing.quantity,
        sourceEntity: existing.sourceEntity,
        sourceId: existing.sourceId,
        status: existing.status === "released" ? "released" : "active",
      };
    }
    const reservation = await this.prisma.stockReservation.create({
      data: {
        tenantId,
        productId: product.id,
        warehouseId: bin.warehouseId,
        binId: bin.id,
        quantity: input.quantity,
        sourceEntity: input.sourceEntity,
        sourceId: input.sourceId,
        status: "active",
      },
      include: {
        warehouse: { select: { code: true } },
        bin: { select: { code: true } },
      },
    });
    await this.recordAudit(
      tenantId,
      "StockReservation",
      reservation.id,
      "created",
      `Reserved ${input.quantity} ${product.sku}.`,
    );
    return {
      id: reservation.id,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      warehouseCode: reservation.warehouse.code,
      binCode: reservation.bin.code,
      quantity: reservation.quantity,
      sourceEntity: reservation.sourceEntity,
      sourceId: reservation.sourceId,
      status: "active",
    };
  }

  async transferStock(
    tenantId: string,
    input: CreateStockTransferInput,
  ): Promise<StockTransfer> {
    const [product, fromBin, toBin] = await Promise.all([
      this.prisma.product.findFirstOrThrow({
        where: { id: input.productId, tenantId },
      }),
      this.prisma.inventoryBin.findFirstOrThrow({
        where: { id: input.fromBinId, tenantId },
        include: { warehouse: true },
      }),
      this.prisma.inventoryBin.findFirstOrThrow({
        where: { id: input.toBinId, tenantId },
        include: { warehouse: true },
      }),
    ]);
    const fromQuantity = await this.stockLedgerQuantity(
      tenantId,
      product.id,
      fromBin.id,
    );
    if (fromQuantity < input.quantity) {
      throw new Error(
        `Insufficient stock in ${fromBin.code} for ${product.sku}.`,
      );
    }
    const transfer = await this.prisma.$transaction(async (tx) => {
      const record = await tx.stockTransfer.create({
        data: {
          tenantId,
          productId: product.id,
          fromBinId: fromBin.id,
          toBinId: toBin.id,
          quantity: input.quantity,
          status: "posted",
          postedAt: new Date(),
        },
      });
      await tx.stockLedgerEntry.createMany({
        data: [
          {
            tenantId,
            productId: product.id,
            warehouseId: fromBin.warehouseId,
            binId: fromBin.id,
            quantity: -input.quantity,
            unitCost: product.price,
            value: -input.quantity * Number(product.price),
            currency: product.currency,
            sourceEntity: "StockTransfer",
            sourceId: `${record.id}:out`,
          },
          {
            tenantId,
            productId: product.id,
            warehouseId: toBin.warehouseId,
            binId: toBin.id,
            quantity: input.quantity,
            unitCost: product.price,
            value: input.quantity * Number(product.price),
            currency: product.currency,
            sourceEntity: "StockTransfer",
            sourceId: `${record.id}:in`,
          },
        ],
      });
      return record;
    });
    await this.recordAudit(
      tenantId,
      "StockTransfer",
      transfer.id,
      "posted",
      `Transferred ${input.quantity} ${product.sku}.`,
    );
    return {
      id: transfer.id,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      fromBinCode: fromBin.code,
      toBinCode: toBin.code,
      quantity: transfer.quantity,
      status: "posted",
      postedAt: transfer.postedAt.toISOString(),
    };
  }

  async postCycleCount(
    tenantId: string,
    input: CreateCycleCountInput,
  ): Promise<CycleCount> {
    const [product, bin] = await Promise.all([
      this.prisma.product.findFirstOrThrow({
        where: { id: input.productId, tenantId },
      }),
      this.prisma.inventoryBin.findFirstOrThrow({
        where: { id: input.binId, tenantId },
        include: { warehouse: true },
      }),
    ]);
    const systemQuantity = await this.stockLedgerQuantity(
      tenantId,
      product.id,
      bin.id,
    );
    const variance = input.countedQuantity - systemQuantity;
    const count = await this.prisma.$transaction(async (tx) => {
      const record = await tx.cycleCount.create({
        data: {
          tenantId,
          productId: product.id,
          binId: bin.id,
          countedQuantity: input.countedQuantity,
          systemQuantity,
          variance,
          status: "posted",
          countedAt: new Date(),
        },
      });
      if (variance !== 0) {
        await tx.product.update({
          where: { id: product.id },
          data: { stockOnHand: { increment: variance } },
        });
        await tx.stockLedgerEntry.create({
          data: {
            tenantId,
            productId: product.id,
            warehouseId: bin.warehouseId,
            binId: bin.id,
            quantity: variance,
            unitCost: product.price,
            value: variance * Number(product.price),
            currency: product.currency,
            sourceEntity: "CycleCount",
            sourceId: record.id,
          },
        });
      }
      return record;
    });
    await this.recordAudit(
      tenantId,
      "CycleCount",
      count.id,
      "posted",
      `Cycle count for ${product.sku} posted.`,
    );
    return {
      id: count.id,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      binCode: bin.code,
      countedQuantity: count.countedQuantity,
      systemQuantity: count.systemQuantity,
      variance: count.variance,
      status: "posted",
      countedAt: count.countedAt.toISOString(),
    };
  }

  async createPickList(
    tenantId: string,
    input: CreatePickListInput,
  ): Promise<PickList> {
    const order = await this.prisma.salesOrder.findFirstOrThrow({
      where: { id: input.salesOrderId, tenantId },
      include: {
        quote: true,
        pickLists: {
          include: { salesOrder: { select: { number: true } } },
          take: 1,
        },
      },
    });
    const existing = order.pickLists[0];
    if (existing) {
      return mapPickList(existing);
    }
    const bin = await this.defaultPrismaBin(tenantId);
    const lines = normalizeLines(order.quote.lines);
    const pickList = await this.prisma.$transaction(async (tx) => {
      const list = await tx.pickList.create({
        data: {
          tenantId,
          salesOrderId: order.id,
          status: "open",
        },
        include: { salesOrder: { select: { number: true } } },
      });
      await tx.pickTask.createMany({
        data: lines.map((line) => ({
          tenantId,
          pickListId: list.id,
          productId: line.productId,
          binId: bin.id,
          quantity: line.quantity,
          pickedQuantity: 0,
          status: "open",
        })),
        skipDuplicates: true,
      });
      return list;
    });
    await this.recordAudit(
      tenantId,
      "PickList",
      pickList.id,
      "created",
      `Pick list created for ${order.number}.`,
    );
    return mapPickList(pickList);
  }

  async confirmPickTask(
    tenantId: string,
    input: ConfirmPickTaskInput,
  ): Promise<PickTask> {
    const before = await this.prisma.pickTask.findFirstOrThrow({
      where: { id: input.pickTaskId, tenantId },
      include: {
        product: { select: { sku: true, name: true } },
        bin: { select: { code: true } },
      },
    });
    const status: PickTask["status"] =
      input.pickedQuantity >= before.quantity ? "picked" : "short";
    const task = await this.prisma.pickTask.update({
      where: { id: before.id },
      data: {
        pickedQuantity: input.pickedQuantity,
        status,
      },
      include: {
        product: { select: { sku: true, name: true } },
        bin: { select: { code: true } },
      },
    });
    await this.prisma.barcodeScan.create({
      data: {
        tenantId,
        scanType: "pick",
        barcode: input.barcode,
        entity: "PickTask",
        entityId: task.id,
        scannedAt: new Date(),
      },
    });
    await this.refreshPrismaPickListStatus(tenantId, task.pickListId);
    await this.recordAudit(
      tenantId,
      "PickTask",
      task.id,
      task.status,
      `Pick task ${task.id} ${task.status}.`,
    );
    return mapPickTask(task);
  }

  async packPickList(
    tenantId: string,
    input: PackPickListInput,
  ): Promise<PackRecord> {
    const pickList = await this.prisma.pickList.findFirstOrThrow({
      where: { id: input.pickListId, tenantId },
      include: {
        tasks: true,
        packRecords: { take: 1, orderBy: { packedAt: "desc" } },
      },
    });
    const existing = pickList.packRecords[0];
    if (existing) {
      return mapPackRecord(existing);
    }
    if (!pickList.tasks.every((task) => task.status === "picked")) {
      throw new Error(
        `Pick list ${pickList.id} must be fully picked before packing.`,
      );
    }
    const packedAt = new Date();
    const pack = await this.prisma.$transaction(async (tx) => {
      const record = await tx.packRecord.create({
        data: {
          tenantId,
          pickListId: pickList.id,
          packageCode: input.packageCode,
          status: "packed",
          packedAt,
        },
      });
      await tx.pickList.update({
        where: { id: pickList.id },
        data: { status: "packed" },
      });
      await tx.barcodeScan.create({
        data: {
          tenantId,
          scanType: "pack",
          barcode: input.packageCode,
          entity: "PackRecord",
          entityId: record.id,
          scannedAt: packedAt,
        },
      });
      return record;
    });
    await this.recordAudit(
      tenantId,
      "PackRecord",
      pack.id,
      "packed",
      `Package ${pack.packageCode} packed.`,
    );
    return mapPackRecord(pack);
  }

  async shipPackRecord(
    tenantId: string,
    input: ShipPackInput,
  ): Promise<Shipment> {
    const pack = await this.prisma.packRecord.findFirstOrThrow({
      where: { id: input.packRecordId, tenantId },
      include: {
        shipment: true,
        pickList: {
          include: {
            tasks: {
              include: {
                product: { select: { id: true, sku: true } },
              },
            },
          },
        },
      },
    });
    if (pack.shipment) {
      const existingShipment = pack.shipment;
      await this.prisma.$transaction(async (tx) => {
        for (const task of pack.pickList.tasks) {
          await this.recordPrismaTraceMovement(
            tx,
            tenantId,
            task.product,
            "shipment",
            "Shipment",
            existingShipment.id,
            task.pickedQuantity || task.quantity,
            "out",
          );
        }
      });
      return mapShipment(existingShipment);
    }
    const shippedAt = new Date();
    const shipment = await this.prisma.$transaction(async (tx) => {
      const record = await tx.shipment.create({
        data: {
          tenantId,
          packRecordId: pack.id,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          status: "shipped",
          shippedAt,
        },
      });
      await tx.packRecord.update({
        where: { id: pack.id },
        data: { status: "shipped" },
      });
      await tx.pickList.update({
        where: { id: pack.pickListId },
        data: { status: "shipped" },
      });
      for (const task of pack.pickList.tasks) {
        await this.recordPrismaTraceMovement(
          tx,
          tenantId,
          task.product,
          "shipment",
          "Shipment",
          record.id,
          task.pickedQuantity || task.quantity,
          "out",
        );
      }
      await tx.barcodeScan.create({
        data: {
          tenantId,
          scanType: "ship",
          barcode: input.trackingNumber,
          entity: "Shipment",
          entityId: record.id,
          scannedAt: shippedAt,
        },
      });
      return record;
    });
    await this.recordAudit(
      tenantId,
      "Shipment",
      shipment.id,
      "shipped",
      `Shipment ${shipment.trackingNumber} shipped.`,
    );
    return mapShipment(shipment);
  }

  async createPutAwayTasks(
    tenantId: string,
    input: CreatePutAwayTasksInput,
  ): Promise<PutAwayTask[]> {
    const receipt = await this.prisma.purchaseReceipt.findFirstOrThrow({
      where: { id: input.purchaseReceiptId, tenantId },
    });
    const existing = await this.prisma.putAwayTask.findMany({
      where: { tenantId, purchaseReceiptId: receipt.id },
      include: {
        purchaseReceipt: { select: { number: true } },
        product: { select: { sku: true, name: true } },
        fromBin: { select: { code: true } },
        toBin: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing.length > 0) {
      return existing.map(mapPutAwayTask);
    }
    const [defaultBin, qcBin] = await Promise.all([
      this.defaultPrismaBin(tenantId),
      this.prisma.inventoryBin.findFirst({
        where: { tenantId, code: "QC-HOLD" },
      }),
    ]);
    const fromBin = qcBin ?? defaultBin;
    await this.prisma.putAwayTask.createMany({
      data: normalizeLines(receipt.lines).map((line) => ({
        tenantId,
        purchaseReceiptId: receipt.id,
        productId: line.productId,
        fromBinId: fromBin.id,
        toBinId: defaultBin.id,
        quantity: line.quantity,
        status: "open",
      })),
      skipDuplicates: true,
    });
    await this.recordAudit(
      tenantId,
      "PutAwayTask",
      receipt.id,
      "created",
      `Put-away tasks created for ${receipt.number}.`,
    );
    const tasks = await this.prisma.putAwayTask.findMany({
      where: { tenantId, purchaseReceiptId: receipt.id },
      include: {
        purchaseReceipt: { select: { number: true } },
        product: { select: { sku: true, name: true } },
        fromBin: { select: { code: true } },
        toBin: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return tasks.map(mapPutAwayTask);
  }

  async confirmPutAwayTask(
    tenantId: string,
    input: ConfirmPutAwayTaskInput,
  ): Promise<PutAwayTask> {
    const completedAt = new Date();
    const existing = await this.prisma.putAwayTask.findFirstOrThrow({
      where: { id: input.putAwayTaskId, tenantId },
    });
    const task = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.putAwayTask.update({
        where: { id: existing.id },
        data: { status: "completed" },
        include: {
          purchaseReceipt: { select: { number: true } },
          product: { select: { sku: true, name: true } },
          fromBin: { select: { code: true } },
          toBin: { select: { code: true } },
        },
      });
      await this.recordPrismaTraceMovement(
        tx,
        tenantId,
        { id: updated.productId, sku: updated.product.sku },
        "putaway",
        "PutAwayTask",
        updated.id,
        updated.quantity,
        "reference",
      );
      await tx.barcodeScan.create({
        data: {
          tenantId,
          scanType: "putaway",
          barcode: input.barcode,
          entity: "PutAwayTask",
          entityId: updated.id,
          scannedAt: completedAt,
        },
      });
      return updated;
    });
    await this.recordAudit(
      tenantId,
      "PutAwayTask",
      task.id,
      "completed",
      `Put-away task ${task.id} completed.`,
    );
    return mapPutAwayTask(task);
  }

  async createProductionPlan(
    tenantId: string,
    input: CreateProductionPlanInput,
  ): Promise<ProductionPlan> {
    const product = await this.prisma.product.findFirstOrThrow({
      where: { id: input.productId, tenantId },
    });
    const availableQuantity = await this.stockLedgerQuantity(
      tenantId,
      product.id,
    );
    const plannedQuantity = Math.max(
      input.demandQuantity - availableQuantity,
      0,
    );
    const count = await this.prisma.productionPlan.count({
      where: { tenantId },
    });
    const plan = await this.prisma.productionPlan.create({
      data: {
        tenantId,
        number: nextDocumentNumber("PLAN", count),
        sourceEntity: input.sourceEntity,
        sourceId: input.sourceId,
        status: "submitted",
        demandDate: new Date(`${input.demandDate}T00:00:00.000Z`),
        lines: [
          {
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            demandQuantity: input.demandQuantity,
            availableQuantity,
            plannedQuantity,
          },
        ],
      },
    });
    await this.createPrismaMrpSuggestions(
      tenantId,
      plan.id,
      input.demandDate,
      product.id,
      plannedQuantity,
    );
    await this.recordAudit(
      tenantId,
      "ProductionPlan",
      plan.id,
      "created",
      `Production plan ${plan.number} created.`,
    );
    return {
      id: plan.id,
      number: plan.number,
      sourceEntity: plan.sourceEntity,
      sourceId: plan.sourceId,
      status: plan.status,
      demandDate: dateOnly(plan.demandDate),
      lines: normalizeProductionPlanLines(plan.lines),
    };
  }

  async createWorkOrderFromSuggestion(
    tenantId: string,
    suggestionId: string,
  ): Promise<WorkOrder> {
    const suggestion = await this.prisma.mrpSuggestion.findFirstOrThrow({
      where: { id: suggestionId, tenantId },
      include: { product: { select: { sku: true, name: true } } },
    });
    if (suggestion.suggestionType !== "work_order") {
      throw new Error(
        `Suggestion ${suggestionId} is not a work order suggestion.`,
      );
    }
    const [bom, routing, count] = await Promise.all([
      this.prisma.billOfMaterial.findFirstOrThrow({
        where: {
          tenantId,
          productId: suggestion.productId,
          status: "approved",
        },
      }),
      this.prisma.routing.findFirst({
        where: {
          tenantId,
          productId: suggestion.productId,
          status: "approved",
        },
      }),
      this.prisma.workOrder.count({ where: { tenantId } }),
    ]);
    const workOrder = await this.prisma.workOrder.create({
      data: {
        tenantId,
        productId: suggestion.productId,
        bomId: bom.id,
        routingId: routing?.id ?? null,
        number: nextDocumentNumber("WO", count),
        status: "draft",
        quantity: suggestion.quantity,
        plannedStart: new Date(),
        plannedEnd: suggestion.requiredBy,
        materialCost:
          (Number(bom.estimatedCost) / bom.outputQuantity) *
          suggestion.quantity,
        currency: bom.currency,
      },
    });
    await this.prisma.mrpSuggestion.update({
      where: { id: suggestion.id },
      data: { status: "accepted" },
    });
    await this.recordAudit(
      tenantId,
      "WorkOrder",
      workOrder.id,
      "created",
      `Work order ${workOrder.number} created.`,
    );
    return mapWorkOrder(
      workOrder,
      suggestion.product.sku,
      suggestion.product.name,
    );
  }

  async releaseWorkOrder(
    tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrder> {
    const before = await this.prisma.workOrder.findFirstOrThrow({
      where: { id: workOrderId, tenantId },
      include: {
        product: { select: { sku: true, name: true } },
        routing: true,
      },
    });
    if (before.status !== "draft") {
      return mapWorkOrder(before, before.product.sku, before.product.name);
    }
    const workOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: before.id },
        data: { status: "released" },
        include: { product: { select: { sku: true, name: true } } },
      });
      for (const operation of normalizeRoutingOperations(
        before.routing?.operations ?? [],
      )) {
        await tx.jobCard.upsert({
          where: {
            tenantId_workOrderId_operationSequence: {
              tenantId,
              workOrderId: before.id,
              operationSequence: operation.sequence,
            },
          },
          create: {
            tenantId,
            workOrderId: before.id,
            workCenterId: operation.workCenterId,
            operationSequence: operation.sequence,
            operationName: operation.name,
            status: "open",
            plannedMinutes: operation.runMinutes * before.quantity,
          },
          update: {},
        });
      }
      return updated;
    });
    await this.recordAudit(
      tenantId,
      "WorkOrder",
      workOrder.id,
      "released",
      `Work order ${workOrder.number} released.`,
    );
    return mapWorkOrder(
      workOrder,
      workOrder.product.sku,
      workOrder.product.name,
    );
  }

  async startJobCard(
    tenantId: string,
    input: StartJobCardInput,
  ): Promise<JobCard> {
    const jobCard = await this.prisma.$transaction(async (tx) => {
      const before = await tx.jobCard.findFirstOrThrow({
        where: { id: input.jobCardId, tenantId },
        include: {
          workOrder: { select: { id: true, number: true, status: true } },
          workCenter: { select: { code: true } },
        },
      });
      const updated = await tx.jobCard.update({
        where: { id: before.id },
        data: {
          status: before.status === "completed" ? "completed" : "in_process",
          startedAt: before.startedAt ?? new Date(),
          operator: input.operator,
        },
        include: {
          workOrder: { select: { number: true } },
          workCenter: { select: { code: true } },
        },
      });
      if (before.workOrder.status === "released") {
        await tx.workOrder.update({
          where: { id: before.workOrder.id },
          data: { status: "in_process" },
        });
      }
      return updated;
    });
    await this.recordAudit(
      tenantId,
      "JobCard",
      jobCard.id,
      "started",
      `Job card ${jobCard.operationName} started.`,
    );
    return mapJobCard(jobCard);
  }

  async completeJobCard(
    tenantId: string,
    input: CompleteJobCardInput,
  ): Promise<JobCard> {
    const completedAt = new Date();
    const before = await this.prisma.jobCard.findFirstOrThrow({
      where: { id: input.jobCardId, tenantId },
    });
    const jobCard = await this.prisma.jobCard.update({
      where: { id: before.id },
      data: {
        status: "completed",
        actualMinutes: input.actualMinutes,
        completedAt,
      },
      include: {
        workOrder: { select: { number: true } },
        workCenter: { select: { code: true } },
      },
    });
    await this.recordAudit(
      tenantId,
      "JobCard",
      jobCard.id,
      "completed",
      `Job card ${jobCard.operationName} completed.`,
    );
    return mapJobCard(jobCard);
  }

  async recordDowntime(
    tenantId: string,
    input: RecordDowntimeInput,
  ): Promise<DowntimeEntry> {
    const workCenter = await this.prisma.workCenter.findFirstOrThrow({
      where: { id: input.workCenterId, tenantId },
    });
    if (input.jobCardId) {
      await this.prisma.jobCard.findFirstOrThrow({
        where: { id: input.jobCardId, tenantId },
      });
    }
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - input.minutes * 60_000);
    const downtime = await this.prisma.downtimeEntry.create({
      data: {
        tenantId,
        workCenterId: workCenter.id,
        jobCardId: input.jobCardId ?? null,
        reason: input.reason,
        minutes: input.minutes,
        startedAt,
        endedAt,
      },
      include: { workCenter: { select: { code: true } } },
    });
    await this.recordAudit(
      tenantId,
      "DowntimeEntry",
      downtime.id,
      "recorded",
      `${input.minutes} minutes downtime recorded for ${workCenter.code}.`,
    );
    return mapDowntimeEntry(downtime);
  }

  async completeWorkOrder(
    tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrder> {
    const before = await this.prisma.workOrder.findFirstOrThrow({
      where: { id: workOrderId, tenantId },
      include: {
        product: {
          select: { sku: true, name: true, price: true, currency: true },
        },
        bom: true,
      },
    });
    if (before.status === "completed") {
      return mapWorkOrder(before, before.product.sku, before.product.name);
    }
    const jobCards = await this.prisma.jobCard.findMany({
      where: { tenantId, workOrderId: before.id },
    });
    if (
      jobCards.length > 0 &&
      !jobCards.every((card) => card.status === "completed")
    ) {
      throw new Error(
        `All job cards for ${before.number} must be completed before work-order completion.`,
      );
    }
    const defaultBin = await this.defaultPrismaBin(tenantId);
    const bomItems = normalizeBomItems(before.bom.items);
    await this.prisma.$transaction(async (tx) => {
      for (const item of bomItems) {
        const component = await tx.product.findFirstOrThrow({
          where: { id: item.productId, tenantId },
        });
        const requiredQuantity = Math.ceil(
          (item.quantity / before.bom.outputQuantity) * before.quantity,
        );
        if (component.stockOnHand < requiredQuantity) {
          throw new Error(`Insufficient component stock for ${component.sku}.`);
        }
        await tx.product.update({
          where: { id: component.id },
          data: { stockOnHand: { decrement: requiredQuantity } },
        });
        await tx.stockLedgerEntry.create({
          data: {
            tenantId,
            productId: component.id,
            warehouseId: defaultBin.warehouseId,
            binId: defaultBin.id,
            quantity: -requiredQuantity,
            unitCost: component.price,
            value: -requiredQuantity * Number(component.price),
            currency: component.currency,
            sourceEntity: "WorkOrderIssue",
            sourceId: before.id,
          },
        });
        await this.recordPrismaTraceMovement(
          tx,
          tenantId,
          { id: component.id, sku: component.sku },
          "work_order_issue",
          "WorkOrderIssue",
          before.id,
          requiredQuantity,
          "transform",
        );
      }
      await tx.product.update({
        where: { id: before.productId },
        data: { stockOnHand: { increment: before.quantity } },
      });
      await tx.stockLedgerEntry.create({
        data: {
          tenantId,
          productId: before.productId,
          warehouseId: defaultBin.warehouseId,
          binId: defaultBin.id,
          quantity: before.quantity,
          unitCost: before.product.price,
          value: before.quantity * Number(before.product.price),
          currency: before.product.currency,
          sourceEntity: "WorkOrderReceipt",
          sourceId: before.id,
        },
      });
      await tx.valuationLayer.create({
        data: {
          tenantId,
          productId: before.productId,
          warehouseId: defaultBin.warehouseId,
          binId: defaultBin.id,
          remainingQuantity: before.quantity,
          unitCost: before.product.price,
          currency: before.product.currency,
          sourceEntity: "WorkOrderReceipt",
          sourceId: before.id,
        },
      });
      const outputTrace = await this.ensurePrismaTraceRecord(
        tx,
        tenantId,
        { id: before.productId, sku: before.product.sku },
        "WorkOrder",
        before.id,
        `LOT-${before.number}-${before.product.sku}`,
      );
      await this.recordPrismaTraceMovement(
        tx,
        tenantId,
        { id: before.productId, sku: before.product.sku },
        "work_order_receipt",
        "WorkOrderReceipt",
        before.id,
        before.quantity,
        "in",
        outputTrace,
      );
      await tx.workOrder.update({
        where: { id: before.id },
        data: { status: "completed" },
      });
    });
    const workOrder = await this.prisma.workOrder.findFirstOrThrow({
      where: { id: workOrderId, tenantId },
      include: { product: { select: { sku: true, name: true } } },
    });
    await this.recordAudit(
      tenantId,
      "WorkOrder",
      workOrder.id,
      "completed",
      `Work order ${workOrder.number} completed.`,
    );
    return mapWorkOrder(
      workOrder,
      workOrder.product.sku,
      workOrder.product.name,
    );
  }

  async traceGenealogy(
    tenantId: string,
    traceRecordId: string,
  ): Promise<TraceGenealogy> {
    const [traceRecord, movements, inspections, nonConformances, recalls] =
      await Promise.all([
        this.prisma.traceRecord.findFirstOrThrow({
          where: { id: traceRecordId, tenantId },
          include: { product: { select: { sku: true, name: true } } },
        }),
        this.prisma.traceMovement.findMany({
          where: { tenantId, traceRecordId },
          include: {
            traceRecord: { select: { lotNumber: true, serialNumber: true } },
            product: { select: { sku: true, name: true } },
          },
          orderBy: { occurredAt: "asc" },
        }),
        this.prisma.qualityInspection.findMany({
          where: { tenantId, traceRecordId },
          include: {
            template: { select: { name: true } },
            traceRecord: { select: { lotNumber: true } },
          },
          orderBy: { inspectedAt: "desc" },
        }),
        this.prisma.nonConformance.findMany({
          where: { tenantId, traceRecordId },
          include: { traceRecord: { select: { lotNumber: true } } },
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.recall.findMany({
          where: { tenantId, affectedTraceIds: { has: traceRecordId } },
          orderBy: { openedAt: "desc" },
        }),
      ]);
    return {
      traceRecord: mapTraceRecord(traceRecord),
      movements: movements.map(mapTraceMovement),
      inspections: inspections.map(mapQualityInspection),
      nonConformances: nonConformances.map(mapNonConformance),
      recalls: recalls.map(mapRecall),
    };
  }

  async createQualityInspection(
    tenantId: string,
    input: CreateQualityInspectionInput,
  ): Promise<QualityInspection> {
    const passed = input.results.every((result) => result.passed);
    const inspection = await this.prisma.$transaction(async (tx) => {
      const [template, trace] = await Promise.all([
        tx.inspectionTemplate.findFirstOrThrow({
          where: { id: input.templateId, tenantId },
        }),
        tx.traceRecord.findFirstOrThrow({
          where: { id: input.traceRecordId, tenantId },
        }),
      ]);
      const record = await tx.qualityInspection.create({
        data: {
          tenantId,
          templateId: template.id,
          traceRecordId: trace.id,
          status: passed ? "passed" : "failed",
          inspectedBy: input.inspectedBy,
          inspectedAt: new Date(),
          results: input.results,
        },
        include: {
          template: { select: { name: true } },
          traceRecord: { select: { lotNumber: true } },
        },
      });
      const product = await tx.product.findFirstOrThrow({
        where: { id: trace.productId, tenantId },
        select: { id: true, sku: true },
      });
      await this.recordPrismaTraceMovement(
        tx,
        tenantId,
        product,
        "inspection",
        "QualityInspection",
        record.id,
        0,
        "reference",
        trace,
      );
      if (!passed) {
        await tx.traceRecord.update({
          where: { id: trace.id },
          data: { status: "quarantined" },
        });
        const ncr = await tx.nonConformance.create({
          data: {
            tenantId,
            inspectionId: record.id,
            traceRecordId: trace.id,
            severity: "high",
            status: "open",
            description: `Failed inspection ${record.id}.`,
          },
        });
        await tx.correctiveAction.create({
          data: {
            tenantId,
            nonConformanceId: ncr.id,
            owner: input.inspectedBy,
            dueDate: daysFromNow(7),
            status: "open",
            action: "Contain affected lot and complete root cause analysis.",
          },
        });
      }
      return record;
    });
    await this.recordAudit(
      tenantId,
      "QualityInspection",
      inspection.id,
      inspection.status,
      `Inspection ${inspection.id} ${inspection.status}.`,
    );
    return {
      id: inspection.id,
      templateId: inspection.templateId,
      templateName: inspection.template.name,
      traceRecordId: inspection.traceRecordId,
      lotNumber: inspection.traceRecord.lotNumber,
      status: parseInspectionStatus(inspection.status),
      inspectedBy: inspection.inspectedBy,
      inspectedAt: inspection.inspectedAt.toISOString(),
      results: normalizeInspectionResults(inspection.results),
    };
  }

  async createRecall(
    tenantId: string,
    input: CreateRecallInput,
  ): Promise<Recall> {
    const affected = await this.prisma.traceRecord.findMany({
      where: { tenantId, lotNumber: input.lotNumber },
      include: { product: { select: { id: true, sku: true } } },
    });
    const recall = await this.prisma.$transaction(async (tx) => {
      await tx.traceRecord.updateMany({
        where: { tenantId, lotNumber: input.lotNumber },
        data: { status: "recalled" },
      });
      const record = await tx.recall.create({
        data: {
          tenantId,
          lotNumber: input.lotNumber,
          status: "active",
          reason: input.reason,
          affectedTraceIds: affected.map((trace) => trace.id),
          openedAt: new Date(),
        },
      });
      for (const trace of affected) {
        await this.recordPrismaTraceMovement(
          tx,
          tenantId,
          trace.product,
          "recall",
          "Recall",
          record.id,
          0,
          "reference",
          trace,
        );
      }
      return record;
    });
    await this.recordAudit(
      tenantId,
      "Recall",
      recall.id,
      "opened",
      `Recall opened for ${input.lotNumber}.`,
    );
    return {
      id: recall.id,
      lotNumber: recall.lotNumber,
      status: "active",
      reason: recall.reason,
      affectedTraceIds: recall.affectedTraceIds,
      openedAt: recall.openedAt.toISOString(),
    };
  }

  async openPosShift(
    tenantId: string,
    input: OpenPosShiftInput,
  ): Promise<PosShift> {
    await this.ensureCommerceInfrastructure(tenantId);
    const register = await this.prisma.posRegister.findFirstOrThrow({
      where: { tenantId, id: input.registerId },
    });
    const openShift = await this.prisma.posShift.findFirst({
      where: { tenantId, registerId: register.id, status: "open" },
    });
    if (register.status === "open" || openShift) {
      throw new Error(
        `POS register ${register.code} already has an open shift.`,
      );
    }
    const shift = await this.prisma.$transaction(async (tx) => {
      await tx.posRegister.update({
        where: { id: register.id },
        data: { status: "open" },
      });
      return tx.posShift.create({
        data: {
          tenantId,
          registerId: register.id,
          openedBy: input.openedBy,
          openingCash: input.openingCash.amount,
          expectedCash: input.openingCash.amount,
          currency: input.openingCash.currency,
          status: "open",
        },
        include: { register: { select: { code: true } } },
      });
    });
    await this.recordAudit(
      tenantId,
      "PosShift",
      shift.id,
      "opened",
      `POS shift opened for ${register.code}.`,
    );
    return {
      id: shift.id,
      registerId: shift.registerId,
      registerCode: shift.register.code,
      openedBy: shift.openedBy,
      status: "open",
      openingCash: money(shift.openingCash, shift.currency),
      closingCash: null,
      expectedCash: money(shift.expectedCash, shift.currency),
      openedAt: shift.openedAt.toISOString(),
      closedAt: null,
    };
  }

  async closePosShift(
    tenantId: string,
    input: ClosePosShiftInput,
  ): Promise<PosShift> {
    const shift = await this.prisma.posShift.findFirstOrThrow({
      where: { tenantId, id: input.shiftId },
      include: { register: { select: { id: true, code: true } } },
    });
    const cashSales = await this.prisma.posSale.aggregate({
      where: { tenantId, shiftId: shift.id, tenderType: "cash" },
      _sum: { total: true },
    });
    const expectedCash =
      Number(shift.openingCash) + Number(cashSales._sum.total ?? 0);
    const closed = await this.prisma.$transaction(async (tx) => {
      await tx.posRegister.update({
        where: { id: shift.register.id },
        data: { status: "closed" },
      });
      return tx.posShift.update({
        where: { id: shift.id },
        data: {
          status: "closed",
          closingCash: input.closingCash.amount,
          expectedCash,
          currency: input.closingCash.currency,
          closedAt: new Date(),
        },
        include: { register: { select: { code: true } } },
      });
    });
    await this.recordAudit(
      tenantId,
      "PosShift",
      closed.id,
      "closed",
      `POS shift closed for ${closed.register.code}.`,
    );
    return {
      id: closed.id,
      registerId: closed.registerId,
      registerCode: closed.register.code,
      openedBy: closed.openedBy,
      status: "closed",
      openingCash: money(closed.openingCash, closed.currency),
      closingCash:
        closed.closingCash === null
          ? null
          : money(closed.closingCash, closed.currency),
      expectedCash: money(closed.expectedCash, closed.currency),
      openedAt: closed.openedAt.toISOString(),
      closedAt: closed.closedAt?.toISOString() ?? null,
    };
  }

  async checkoutPosSale(
    tenantId: string,
    input: CheckoutPosSaleInput,
  ): Promise<PosSale> {
    await this.ensureCommerceInfrastructure(tenantId);
    const shift = await this.prisma.posShift.findFirstOrThrow({
      where: { tenantId, id: input.shiftId, status: "open" },
      include: { register: { select: { code: true } } },
    });
    const customer = await this.prisma.customer.findFirstOrThrow({
      where: { tenantId, id: input.customerId },
      select: { id: true, name: true },
    });
    const total = totalLines(input.lines);
    const { order, invoice, payment } =
      await this.createPrismaCommerceSaleDocuments(
        tenantId,
        customer.id,
        "POS",
        input.lines,
        total,
        input.tenderType,
      );
    const saleCount = await this.prisma.posSale.count({ where: { tenantId } });
    const sale = await this.prisma.posSale.create({
      data: {
        tenantId,
        shiftId: shift.id,
        customerId: customer.id,
        orderId: order.id,
        invoiceId: invoice.id,
        paymentId: payment.id,
        receiptNumber: nextDocumentNumber("RCPT", saleCount),
        tenderType: input.tenderType,
        status: "posted",
        total: total.amount,
        currency: total.currency,
        lines: input.lines,
        postedAt: new Date(),
      },
    });
    if (input.tenderType === "cash") {
      await this.prisma.posShift.update({
        where: { id: shift.id },
        data: { expectedCash: { increment: total.amount } },
      });
    }
    await this.recordAudit(
      tenantId,
      "PosSale",
      sale.id,
      "posted",
      `POS receipt ${sale.receiptNumber} posted.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "commerce.pos-sale.posted",
      payload: {
        posSaleId: sale.id,
        receiptNumber: sale.receiptNumber,
        invoiceId: invoice.id,
        total,
      },
    });
    return {
      id: sale.id,
      shiftId: sale.shiftId,
      receiptNumber: sale.receiptNumber,
      customerName: customer.name,
      tenderType: parseTenderType(sale.tenderType),
      status: "posted",
      total: money(sale.total, sale.currency),
      invoiceId: sale.invoiceId,
      paymentId: sale.paymentId,
      lines: normalizeLines(sale.lines),
      postedAt: sale.postedAt.toISOString(),
    };
  }

  async publishChannelCatalog(
    tenantId: string,
    input: PublishChannelCatalogInput,
  ): Promise<ChannelCatalogItem[]> {
    await this.ensureCommerceInfrastructure(tenantId);
    const channel = await this.prisma.commerceChannel.findFirstOrThrow({
      where: { tenantId, id: input.channelId },
    });
    const products = await this.prisma.product.findMany({
      where: { tenantId, id: { in: [...new Set(input.productIds)] } },
    });
    const published: ChannelCatalogItem[] = [];
    for (const product of products) {
      const item = await this.prisma.channelCatalogItem.upsert({
        where: {
          tenantId_channelId_productId: {
            tenantId,
            channelId: channel.id,
            productId: product.id,
          },
        },
        update: {
          title: product.name,
          price: product.price,
          currency: product.currency,
          published: true,
          publishedAt: new Date(),
        },
        create: {
          tenantId,
          channelId: channel.id,
          productId: product.id,
          title: product.name,
          price: product.price,
          currency: product.currency,
          published: true,
        },
        include: { product: { select: { sku: true } } },
      });
      published.push({
        id: item.id,
        channelId: item.channelId,
        productId: item.productId,
        sku: item.product.sku,
        title: item.title,
        price: money(item.price, item.currency),
        published: item.published,
      });
    }
    await this.recordAudit(
      tenantId,
      "ChannelCatalogItem",
      channel.id,
      "published",
      `${published.length} products published to ${channel.name}.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "commerce.catalog.published",
      payload: {
        channelId: channel.id,
        productIds: published.map((item) => item.productId),
      },
    });
    return published;
  }

  async ingestChannelOrder(
    tenantId: string,
    input: IngestChannelOrderInput,
  ): Promise<ChannelOrder> {
    await this.ensureCommerceInfrastructure(tenantId);
    const existing = await this.prisma.channelOrder.findUnique({
      where: {
        tenantId_channelId_externalOrderId: {
          tenantId,
          channelId: input.channelId,
          externalOrderId: input.externalOrderId,
        },
      },
      include: {
        channel: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });
    if (existing) {
      return {
        id: existing.id,
        channelId: existing.channelId,
        channelName: existing.channel.name,
        externalOrderId: existing.externalOrderId,
        customerName: existing.customer.name,
        status: existing.status === "fulfilled" ? "fulfilled" : "imported",
        total: money(existing.total, existing.currency),
        salesOrderId: existing.salesOrderId,
        lines: normalizeLines(existing.lines),
        importedAt: existing.importedAt.toISOString(),
      };
    }
    const [channel, customer] = await Promise.all([
      this.prisma.commerceChannel.findFirstOrThrow({
        where: { tenantId, id: input.channelId },
      }),
      this.prisma.customer.findFirstOrThrow({
        where: { tenantId, id: input.customerId },
        select: { id: true, name: true },
      }),
    ]);
    const total = totalLines(input.lines);
    const order = await this.createPrismaCommerceOrder(
      tenantId,
      customer.id,
      "CH",
      input.lines,
      total,
    );
    const channelOrder = await this.prisma.channelOrder.create({
      data: {
        tenantId,
        channelId: channel.id,
        customerId: customer.id,
        salesOrderId: order.id,
        externalOrderId: input.externalOrderId,
        status: "imported",
        total: total.amount,
        currency: total.currency,
        lines: input.lines,
      },
    });
    await this.recordAudit(
      tenantId,
      "ChannelOrder",
      channelOrder.id,
      "imported",
      `Channel order ${input.externalOrderId} imported.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "commerce.channel-order.imported",
      payload: {
        channelOrderId: channelOrder.id,
        externalOrderId: input.externalOrderId,
        salesOrderId: order.id,
      },
    });
    return {
      id: channelOrder.id,
      channelId: channel.id,
      channelName: channel.name,
      externalOrderId: channelOrder.externalOrderId,
      customerName: customer.name,
      status: "imported",
      total: money(channelOrder.total, channelOrder.currency),
      salesOrderId: order.id,
      lines: normalizeLines(channelOrder.lines),
      importedAt: channelOrder.importedAt.toISOString(),
    };
  }

  async recordAttendance(
    tenantId: string,
    input: RecordAttendanceInput,
  ): Promise<AttendanceRecord> {
    await this.ensureHrInfrastructure(tenantId);
    const employee = await this.prisma.employeeRecord.findFirstOrThrow({
      where: { tenantId, id: input.employeeId },
    });
    const hours = attendanceHours(input.checkIn, input.checkOut);
    const status =
      hours <= 0
        ? "absent"
        : new Date(input.checkIn).getUTCHours() > 9
          ? "late"
          : "present";
    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        tenantId_employeeId_workDate: {
          tenantId,
          employeeId: employee.id,
          workDate: new Date(`${input.workDate}T00:00:00.000Z`),
        },
      },
      update: {
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        hours,
        status,
      },
      create: {
        tenantId,
        employeeId: employee.id,
        workDate: new Date(`${input.workDate}T00:00:00.000Z`),
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        hours,
        status,
      },
    });
    await this.recordAudit(
      tenantId,
      "AttendanceRecord",
      record.id,
      "recorded",
      `Attendance recorded for ${employee.name}.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "hr.attendance.recorded",
      payload: {
        attendanceId: record.id,
        employeeId: employee.id,
        workDate: input.workDate,
      },
    });
    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: employee.name,
      workDate: dateOnly(record.workDate),
      checkIn: record.checkIn.toISOString(),
      checkOut: record.checkOut.toISOString(),
      hours: Number(record.hours),
      status: parseAttendanceStatus(record.status),
    };
  }

  async submitExpenseClaim(
    tenantId: string,
    input: SubmitExpenseClaimInput,
  ): Promise<ExpenseClaim> {
    await this.ensureHrInfrastructure(tenantId);
    const [employee, count] = await Promise.all([
      this.prisma.employeeRecord.findFirstOrThrow({
        where: { tenantId, id: input.employeeId },
      }),
      this.prisma.expenseClaim.count({ where: { tenantId } }),
    ]);
    const claim = await this.prisma.expenseClaim.create({
      data: {
        tenantId,
        employeeId: employee.id,
        number: nextDocumentNumber("EXP", count),
        status: "submitted",
        category: input.category,
        description: input.description,
        amount: input.amount.amount,
        currency: input.amount.currency,
        submittedAt: new Date(input.submittedAt),
      },
    });
    await this.recordAudit(
      tenantId,
      "ExpenseClaim",
      claim.id,
      "submitted",
      `Expense claim ${claim.number} submitted.`,
    );
    return mapPrismaExpenseClaim(claim, employee.name);
  }

  async approveExpenseClaim(
    tenantId: string,
    input: ExpenseClaimStatusInput,
  ): Promise<ExpenseClaim> {
    const before = await this.prisma.expenseClaim.findFirstOrThrow({
      where: { id: input.id, tenantId },
    });
    const claim = await this.prisma.expenseClaim.update({
      where: { id: before.id },
      data: {
        status: "approved",
        approvedAt: new Date(input.approvedAt ?? new Date().toISOString()),
      },
      include: { employee: { select: { name: true } } },
    });
    await this.recordAudit(
      tenantId,
      "ExpenseClaim",
      claim.id,
      "approved",
      `Expense claim ${claim.number} approved.`,
    );
    return mapPrismaExpenseClaim(claim, claim.employee.name);
  }

  async payExpenseClaim(
    tenantId: string,
    input: ExpenseClaimStatusInput,
  ): Promise<ExpenseClaim> {
    const before = await this.prisma.expenseClaim.findFirstOrThrow({
      where: { tenantId, id: input.id },
      include: { employee: { select: { name: true } } },
    });
    if (before.status === "submitted") {
      throw new Error(
        `Expense claim ${before.number} must be approved before payment.`,
      );
    }
    const journal = await this.postPrismaExpenseClaimJournal(
      tenantId,
      before.id,
      before.number,
      money(before.amount, before.currency),
    );
    const claim = await this.prisma.expenseClaim.update({
      where: { id: before.id },
      data: {
        status: "paid",
        paidAt: new Date(input.paidAt ?? new Date().toISOString()),
        journalEntryId: journal.id,
      },
      include: { employee: { select: { name: true } } },
    });
    await this.recordAudit(
      tenantId,
      "ExpenseClaim",
      claim.id,
      "paid",
      `Expense claim ${claim.number} paid.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "hr.expense.paid",
      payload: {
        expenseClaimId: claim.id,
        employeeId: claim.employeeId,
        amount: money(claim.amount, claim.currency),
      },
    });
    return mapPrismaExpenseClaim(claim, claim.employee.name);
  }

  async createEmployeeAdvance(
    tenantId: string,
    input: CreateEmployeeAdvanceInput,
  ): Promise<EmployeeAdvance> {
    await this.ensureHrInfrastructure(tenantId);
    const [employee, count] = await Promise.all([
      this.prisma.employeeRecord.findFirstOrThrow({
        where: { tenantId, id: input.employeeId },
      }),
      this.prisma.employeeAdvance.count({ where: { tenantId } }),
    ]);
    const advance = await this.prisma.employeeAdvance.create({
      data: {
        tenantId,
        employeeId: employee.id,
        number: nextDocumentNumber("ADV", count),
        status: "requested",
        amount: input.amount.amount,
        currency: input.amount.currency,
        requestedAt: new Date(input.requestedAt),
      },
    });
    await this.recordAudit(
      tenantId,
      "EmployeeAdvance",
      advance.id,
      "requested",
      `Employee advance ${advance.number} requested.`,
    );
    return mapPrismaEmployeeAdvance(advance, employee.name);
  }

  async payEmployeeAdvance(
    tenantId: string,
    input: PayEmployeeAdvanceInput,
  ): Promise<EmployeeAdvance> {
    const before = await this.prisma.employeeAdvance.findFirstOrThrow({
      where: { tenantId, id: input.id },
      include: { employee: { select: { name: true } } },
    });
    const journal = await this.postPrismaEmployeeAdvanceJournal(
      tenantId,
      before.id,
      before.number,
      money(before.amount, before.currency),
    );
    const advance = await this.prisma.employeeAdvance.update({
      where: { id: before.id },
      data: {
        status: "paid",
        paidAt: new Date(input.paidAt),
        paymentReference: input.paymentReference,
        journalEntryId: journal.id,
      },
      include: { employee: { select: { name: true } } },
    });
    await this.recordAudit(
      tenantId,
      "EmployeeAdvance",
      advance.id,
      "paid",
      `Employee advance ${advance.number} paid.`,
    );
    return mapPrismaEmployeeAdvance(advance, advance.employee.name);
  }

  async runPayroll(
    tenantId: string,
    input: RunPayrollInput,
  ): Promise<PayrollRun> {
    await this.ensureHrInfrastructure(tenantId);
    const periodStart = new Date(`${input.periodStart}T00:00:00.000Z`);
    const periodEnd = new Date(`${input.periodEnd}T00:00:00.000Z`);
    const existing = await this.prisma.payrollRun.findUnique({
      where: {
        tenantId_periodStart_periodEnd: { tenantId, periodStart, periodEnd },
      },
    });
    if (existing) {
      return mapPrismaPayrollRun(existing);
    }
    const structures = await this.prisma.salaryStructure.findMany({
      where: { tenantId, active: true },
      include: { employee: { select: { id: true, name: true } } },
    });
    const count = await this.prisma.payrollRun.count({ where: { tenantId } });
    const computed = structures.map((structure) => {
      const earnings = normalizeCompensationItems(
        structure.earnings,
        structure.currency,
      ).reduce((sum, item) => sum + item.amount.amount, 0);
      const deductions = normalizeCompensationItems(
        structure.deductions,
        structure.currency,
      ).reduce((sum, item) => sum + item.amount.amount, 0);
      const gross = Number(structure.basePay) + earnings;
      return { structure, gross, deductions, net: gross - deductions };
    });
    const grossPay = computed.reduce((sum, item) => sum + item.gross, 0);
    const deductions = computed.reduce((sum, item) => sum + item.deductions, 0);
    const netPay = computed.reduce((sum, item) => sum + item.net, 0);
    const payroll = await this.prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          tenantId,
          number: nextDocumentNumber("PAY", count),
          periodStart,
          periodEnd,
          status: "posted",
          grossPay,
          deductions,
          netPay,
          currency: "USD",
          postedAt: new Date(input.postedAt),
        },
      });
      for (const item of computed) {
        await tx.payslip.create({
          data: {
            tenantId,
            payrollRunId: run.id,
            employeeId: item.structure.employeeId,
            employeeName: item.structure.employee.name,
            grossPay: item.gross,
            deductions: item.deductions,
            netPay: item.net,
            currency: item.structure.currency,
            status: "posted",
          },
        });
      }
      const journal = await this.postPrismaPayrollJournalTx(
        tx,
        tenantId,
        run.id,
        run.number,
        {
          grossPay: { amount: grossPay, currency: "USD" },
          deductions: { amount: deductions, currency: "USD" },
          netPay: { amount: netPay, currency: "USD" },
        },
      );
      return tx.payrollRun.update({
        where: { id: run.id },
        data: { journalEntryId: journal.id },
      });
    });
    await this.recordAudit(
      tenantId,
      "PayrollRun",
      payroll.id,
      "posted",
      `Payroll run ${payroll.number} posted.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "hr.payroll.posted",
      payload: {
        payrollRunId: payroll.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      },
    });
    return mapPrismaPayrollRun(payroll);
  }

  async createSavedReport(
    tenantId: string,
    input: CreateSavedReportInput,
  ): Promise<SavedReport> {
    const report = await this.prisma.savedReport.upsert({
      where: { tenantId_name: { tenantId, name: input.name } },
      update: {
        entityType: input.entityType,
        columns: input.columns,
        filters: input.filters,
        parameters: input.parameters,
        sorts: input.sorts,
        groupBy: input.groupBy,
        chart: input.chart,
        owner: input.owner,
      },
      create: {
        tenantId,
        name: input.name,
        entityType: input.entityType,
        columns: input.columns,
        filters: input.filters,
        parameters: input.parameters,
        sorts: input.sorts,
        groupBy: input.groupBy,
        chart: input.chart,
        owner: input.owner,
      },
    });
    await this.recordAudit(
      tenantId,
      "SavedReport",
      report.id,
      "created",
      `Report ${report.name} created.`,
    );
    return {
      id: report.id,
      name: report.name,
      entityType: report.entityType,
      columns: report.columns,
      filters: normalizeReportFilters(report.filters),
      parameters: normalizeReportParameters(report.parameters),
      sorts: normalizeReportSorts(report.sorts),
      groupBy: report.groupBy,
      chart: normalizeReportChart(report.chart),
      owner: report.owner,
    };
  }

  async runReport(tenantId: string, input: RunReportInput): Promise<ReportRun> {
    const report = await this.prisma.savedReport.findFirstOrThrow({
      where: { id: input.reportId, tenantId },
    });
    const rows = projectReportRows(
      await this.prismaReportRows(tenantId, report.entityType),
      {
        columns: report.columns,
        filters: normalizeReportFilters(report.filters),
        sorts: normalizeReportSorts(report.sorts),
      },
    );
    const run = await this.prisma.reportRun.create({
      data: {
        tenantId,
        reportId: report.id,
        status: "completed",
        rowCount: rows.length,
        ranAt: new Date(),
        rows,
      },
    });
    await this.recordAudit(
      tenantId,
      "ReportRun",
      run.id,
      "completed",
      `Report ${report.name} ran.`,
    );
    return {
      id: run.id,
      reportId: report.id,
      reportName: report.name,
      status: "completed",
      rowCount: rows.length,
      ranAt: run.ranAt.toISOString(),
      rows,
    };
  }

  async previewReport(
    tenantId: string,
    input: PreviewReportInput,
  ): Promise<ReportPreview> {
    const report = await this.prisma.savedReport.findFirstOrThrow({
      where: { id: input.reportId, tenantId },
    });
    const rows = projectReportRows(
      await this.prismaReportRows(tenantId, report.entityType),
      {
        columns: report.columns,
        filters: normalizeReportFilters(report.filters),
        sorts: normalizeReportSorts(report.sorts),
      },
    );
    return {
      reportId: report.id,
      reportName: report.name,
      generatedAt: new Date().toISOString(),
      columns: report.columns.map((column) => ({
        key: column,
        label: labelize(column),
      })),
      rows,
      chart: normalizeReportChart(report.chart),
    };
  }

  async createExportJob(
    tenantId: string,
    input: CreateExportJobInput,
  ): Promise<ExportJob> {
    const report = await this.prisma.savedReport.findFirstOrThrow({
      where: { id: input.reportId, tenantId },
    });
    const job = await this.prisma.exportJob.create({
      data: {
        tenantId,
        reportId: report.id,
        format: input.format,
        status: "completed",
        downloadUrl: `/exports/${report.id}.${input.format}`,
      },
    });
    await this.recordAudit(
      tenantId,
      "ExportJob",
      job.id,
      "completed",
      `Export for ${report.name} completed.`,
    );
    return {
      id: job.id,
      reportId: report.id,
      reportName: report.name,
      format: input.format,
      status: "completed",
      downloadUrl: job.downloadUrl,
      createdAt: job.createdAt.toISOString(),
    };
  }

  async createPrintFormat(
    tenantId: string,
    input: CreatePrintFormatInput,
  ): Promise<PrintFormat> {
    const format = await this.prisma.printFormat.upsert({
      where: { tenantId_name: { tenantId, name: input.name } },
      update: {
        entityType: input.entityType,
        template: input.template,
        blocks: input.blocks,
        active: input.active,
      },
      create: {
        tenantId,
        name: input.name,
        entityType: input.entityType,
        template: input.template,
        blocks: input.blocks,
        active: input.active,
      },
    });
    await this.recordAudit(
      tenantId,
      "PrintFormat",
      format.id,
      "created",
      `Print format ${format.name} created.`,
    );
    return {
      id: format.id,
      name: format.name,
      entityType: format.entityType,
      template: format.template,
      blocks: normalizePrintBlocks(format.blocks),
      active: format.active,
    };
  }

  async previewPrintFormat(
    tenantId: string,
    input: PreviewPrintFormatInput,
  ): Promise<PrintPreview> {
    const format = await this.prisma.printFormat.findFirstOrThrow({
      where: { tenantId, id: input.printFormatId },
    });
    const record = await this.prismaPrintRecord(
      tenantId,
      format.entityType,
      input.recordId,
    );
    const preview: PrintPreview = {
      printFormatId: format.id,
      formatName: format.name,
      entityType: format.entityType,
      recordId: input.recordId,
      generatedAt: new Date().toISOString(),
      html: renderPrintHtml(
        { ...format, blocks: normalizePrintBlocks(format.blocks) },
        record,
      ),
    };
    await this.recordAudit(
      tenantId,
      "PrintPreview",
      format.id,
      "rendered",
      `Print format ${format.name} preview rendered.`,
    );
    return preview;
  }

  async createApiKey(
    tenantId: string,
    input: CreateApiKeyInput,
  ): Promise<ApiKeyRecord> {
    const count = await this.prisma.apiKeyRecord.count({ where: { tenantId } });
    const keyPrefix = `erp_${String(count + 1).padStart(4, "0")}`;
    const key = await this.prisma.apiKeyRecord.create({
      data: {
        tenantId,
        name: input.name,
        keyPrefix,
        keyHash: `${keyPrefix}_hash`,
        scopes: [...new Set(input.scopes)].sort(),
        active: true,
      },
    });
    await this.recordAudit(
      tenantId,
      "ApiKeyRecord",
      key.id,
      "created",
      `API key ${key.name} created.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "integration.api-key.created",
      payload: { apiKeyId: key.id, name: key.name, scopes: key.scopes },
    });
    return mapApiKeyRecord(key);
  }

  async dispatchWebhook(
    tenantId: string,
    input: DispatchWebhookInput,
  ): Promise<WebhookDelivery> {
    const subscription = await this.prisma.webhookSubscription.findFirstOrThrow(
      {
        where: { id: input.subscriptionId, tenantId, active: true },
      },
    );
    if (!subscription.eventTypes.includes(input.eventType)) {
      throw new Error(
        `Webhook subscription ${subscription.id} is not subscribed to ${input.eventType}.`,
      );
    }
    const delivery = await this.prisma.$transaction(async (tx) => {
      const outbox = await tx.outboxEvent.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          eventType: input.eventType,
          payload: input.payload as Prisma.InputJsonValue,
          status: "pending",
          attempts: 0,
        },
      });
      return tx.webhookDelivery.create({
        data: {
          tenantId,
          subscriptionId: subscription.id,
          outboxEventId: outbox.id,
          eventType: input.eventType,
          status: "pending",
          attempts: 0,
          nextAttemptAt: new Date(),
          deliveredAt: null,
          payload: input.payload as Prisma.InputJsonValue,
          payloadBody: JSON.stringify(input.payload),
        },
      });
    });
    await this.recordAudit(
      tenantId,
      "WebhookDelivery",
      delivery.id,
      delivery.status,
      `Webhook ${delivery.eventType} ${delivery.status}.`,
    );
    return mapWebhookDelivery(delivery);
  }

  async retryWebhookDelivery(
    tenantId: string,
    deliveryId: string,
  ): Promise<WebhookDelivery> {
    const before = await this.prisma.webhookDelivery.findFirstOrThrow({
      where: { id: deliveryId, tenantId },
    });
    if (before.status === "delivered" || before.status === "pending") {
      return mapWebhookDelivery(before);
    }
    const delivery = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.webhookDelivery.update({
        where: { id: before.id },
        data: {
          status: "pending",
          nextAttemptAt: new Date(),
          deliveredAt: null,
          lockedAt: null,
          lastError: null,
        },
      });
      if (updated.outboxEventId) {
        await tx.outboxEvent.update({
          where: { id: updated.outboxEventId },
          data: {
            status: "pending",
            lockedAt: null,
            nextAttemptAt: null,
            error: null,
            dispatchedAt: null,
          },
        });
      }
      await tx.deadLetterRecord.deleteMany({
        where: {
          OR: [
            { deliveryId: updated.id },
            ...(updated.outboxEventId
              ? [{ outboxEventId: updated.outboxEventId }]
              : []),
          ],
        },
      });
      return updated;
    });
    await this.recordAudit(
      tenantId,
      "WebhookDelivery",
      delivery.id,
      "requeued",
      `Webhook ${delivery.eventType} requeued for worker delivery.`,
    );
    return mapWebhookDelivery(delivery);
  }

  async publishOutboxEvent(
    tenantId: string,
    input: PublishOutboxEventInput,
  ): Promise<OutboxEvent> {
    const event = await this.prisma.outboxEvent.create({
      data: {
        tenantId,
        eventType: input.eventType,
        payload: input.payload as Prisma.InputJsonValue,
        status: "pending",
        attempts: 0,
      },
    });
    await this.executePrismaAutomations(
      tenantId,
      input.eventType,
      input.payload,
    );
    return mapOutboxEvent(event);
  }

  private async executePrismaAutomations(
    tenantId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    if (eventType.startsWith("automation.")) {
      return;
    }
    const rules = await this.prisma.automationRule.findMany({
      where: {
        tenantId,
        enabled: true,
        triggerType: "event",
        triggerEvent: eventType,
      },
    });
    for (const rule of rules) {
      try {
        const actions = normalizeActionArray(rule.actions);
        for (const action of actions) {
          const type = String(action.type ?? "audit");
          if (type === "outbox") {
            await this.prisma.outboxEvent.create({
              data: {
                tenantId,
                eventType: String(
                  action.eventType ?? "automation.rule.executed",
                ),
                payload: {
                  ruleId: rule.id,
                  sourceEvent: eventType,
                  sourcePayload: payload,
                } as Prisma.InputJsonValue,
                status: "pending",
                attempts: 0,
              },
            });
          } else {
            await this.recordAudit(
              tenantId,
              "AutomationRule",
              rule.id,
              "executed",
              String(action.message ?? `Automation ${rule.name} executed.`),
            );
          }
        }
        await this.prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            runCount: { increment: 1 },
            lastRunAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        await this.prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            lastError:
              error instanceof Error ? error.message : "Automation failed.",
          },
        });
      }
    }
  }

  async dispatchOutboxEvent(
    tenantId: string,
    outboxEventId: string,
  ): Promise<OutboxEvent> {
    const event = await this.prisma.outboxEvent.findFirstOrThrow({
      where: { id: outboxEventId, tenantId },
    });
    if (event.status === "pending") {
      return mapOutboxEvent(event);
    }
    const dispatched = await this.prisma.$transaction(async (tx) => {
      const deliveries = await tx.webhookDelivery.findMany({
        where: { tenantId, outboxEventId: event.id },
        select: { id: true },
      });
      const updated = await tx.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: "pending",
          error: null,
          lockedAt: null,
          nextAttemptAt: null,
          dispatchedAt: null,
        },
      });
      await tx.webhookDelivery.updateMany({
        where: {
          tenantId,
          outboxEventId: event.id,
          status: { in: ["failed", "dead_letter"] },
        },
        data: {
          status: "pending",
          nextAttemptAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      });
      await tx.deadLetterRecord.deleteMany({
        where: {
          OR: [
            { outboxEventId: event.id },
            { deliveryId: { in: deliveries.map((delivery) => delivery.id) } },
          ],
        },
      });
      return updated;
    });
    await this.recordAudit(
      tenantId,
      "OutboxEvent",
      dispatched.id,
      "requeued",
      `Outbox event ${dispatched.eventType} requeued for worker delivery.`,
    );
    return mapOutboxEvent(dispatched);
  }

  async materializeWorkflowTasks(
    tenantId: string,
    input: MaterializeWorkflowTasksInput,
  ): Promise<WorkflowTaskRecord[]> {
    const materialized: WorkflowTaskRecord[] = [];
    for (const task of input.tasks) {
      const taskKey = workflowTaskKey(task);
      const existing = await this.prisma.workflowTaskRecord.findUnique({
        where: { tenantId_taskKey: { tenantId, taskKey } },
      });
      const now = new Date();
      if (existing) {
        const updated = await this.prisma.workflowTaskRecord.update({
          where: { id: existing.id },
          data: {
            title: task.title,
            summary: task.summary,
            currentState: task.currentState,
            status: "open",
            assigneeRoles: task.assigneeRoles,
            escalatedRoles: task.escalatedRoles,
            notificationChannels: task.notificationChannels,
            dueStatus: task.dueStatus,
            dueAt: task.dueAt ? new Date(task.dueAt) : null,
            closedAt: null,
            ...(task.escalated && !existing.escalatedNotifiedAt
              ? { escalatedNotifiedAt: now }
              : {}),
          },
        });
        if (task.escalated && !existing.escalatedNotifiedAt) {
          await this.publishOutboxEvent(tenantId, {
            eventType: "workflow.task.escalated",
            payload: {
              ...workflowTaskPayload(task),
              idempotencyKey: `${taskKey}:escalated`,
            },
          });
        }
        materialized.push(mapWorkflowTaskRecord(updated));
        continue;
      }

      const created = await this.prisma.workflowTaskRecord.create({
        data: {
          tenantId,
          taskKey,
          workflowId: task.workflowId,
          entity: task.document.entity,
          documentId: task.document.id,
          action: task.action.to,
          title: task.title,
          summary: task.summary,
          currentState: task.currentState,
          status: "open",
          assigneeRoles: task.assigneeRoles,
          escalatedRoles: task.escalatedRoles,
          notificationChannels: task.notificationChannels,
          dueStatus: task.dueStatus,
          dueAt: task.dueAt ? new Date(task.dueAt) : null,
          createdTaskAt: new Date(task.createdAt),
          assignedNotifiedAt: now,
          escalatedNotifiedAt: task.escalated ? now : null,
        },
      });
      await this.publishOutboxEvent(tenantId, {
        eventType: "workflow.task.assigned",
        payload: {
          ...workflowTaskPayload(task),
          idempotencyKey: `${taskKey}:assigned`,
        },
      });
      if (task.escalated) {
        await this.publishOutboxEvent(tenantId, {
          eventType: "workflow.task.escalated",
          payload: {
            ...workflowTaskPayload(task),
            idempotencyKey: `${taskKey}:escalated`,
          },
        });
      }
      materialized.push(mapWorkflowTaskRecord(created));
    }
    return materialized;
  }

  async completeWorkflowTask(
    tenantId: string,
    input: CompleteWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord[]> {
    const records = await this.prisma.workflowTaskRecord.findMany({
      where: {
        tenantId,
        workflowId: input.workflowId,
        entity: input.entity,
        documentId: input.documentId,
        status: "open",
      },
    });
    const now = new Date();
    const closed: WorkflowTaskRecord[] = [];
    for (const task of records) {
      const completed = task.action === input.completedAction;
      const updated = await this.prisma.workflowTaskRecord.update({
        where: { id: task.id },
        data: {
          status: completed ? "completed" : "cancelled",
          closedAt: now,
          ...(completed && !task.completedNotifiedAt
            ? { completedNotifiedAt: now }
            : {}),
          ...(!completed && !task.cancelledNotifiedAt
            ? { cancelledNotifiedAt: now }
            : {}),
        },
      });
      const mapped = mapWorkflowTaskRecord(updated);
      if (completed && !task.completedNotifiedAt) {
        await this.publishOutboxEvent(tenantId, {
          eventType: "workflow.task.completed",
          payload: {
            ...workflowTaskRecordPayload(mapped),
            previousState: input.previousState,
            currentState: input.currentState,
            idempotencyKey: `${task.taskKey}:completed`,
          },
        });
      }
      if (!completed && !task.cancelledNotifiedAt) {
        await this.publishOutboxEvent(tenantId, {
          eventType: "workflow.task.cancelled",
          payload: {
            ...workflowTaskRecordPayload(mapped),
            previousState: input.previousState,
            currentState: input.currentState,
            idempotencyKey: `${task.taskKey}:cancelled`,
          },
        });
      }
      closed.push(mapped);
    }
    return closed;
  }

  async reassignWorkflowTask(
    tenantId: string,
    input: ReassignWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord> {
    const existing = await this.prisma.workflowTaskRecord.findFirst({
      where: { id: input.taskId, tenantId },
      include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
    if (!existing) {
      throw new Error(`Workflow task not found: ${input.taskId}`);
    }
    const previousRoles = normalizeStringArray(existing.assigneeRoles);
    const updated = await this.prisma.workflowTaskRecord.update({
      where: { id: existing.id },
      data: {
        assigneeRoles: [input.role],
        operations: {
          create: {
            tenantId,
            operation: "reassigned",
            actorId: input.actorId,
            reason: input.reason ?? null,
            details: { previousRoles, assigneeRoles: [input.role] },
          },
        },
      },
      include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
    await this.recordAudit(
      tenantId,
      "WorkflowTaskRecord",
      existing.id,
      "reassigned",
      `Workflow task ${existing.taskKey} reassigned to ${input.role}.`,
    );
    return mapWorkflowTaskRecord(updated);
  }

  async snoozeWorkflowTask(
    tenantId: string,
    input: SnoozeWorkflowTaskInput,
  ): Promise<WorkflowTaskRecord> {
    const existing = await this.prisma.workflowTaskRecord.findFirst({
      where: { id: input.taskId, tenantId },
      include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
    if (!existing) {
      throw new Error(`Workflow task not found: ${input.taskId}`);
    }
    const dueAt = new Date(input.dueAt);
    const updated = await this.prisma.workflowTaskRecord.update({
      where: { id: existing.id },
      data: {
        dueAt,
        dueStatus: "open",
        operations: {
          create: {
            tenantId,
            operation: "snoozed",
            actorId: input.actorId,
            reason: input.reason,
            details: {
              previousDueAt: existing.dueAt?.toISOString() ?? null,
              dueAt: dueAt.toISOString(),
            },
          },
        },
      },
      include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
    await this.recordAudit(
      tenantId,
      "WorkflowTaskRecord",
      existing.id,
      "snoozed",
      `Workflow task ${existing.taskKey} snoozed until ${dueAt.toISOString()}.`,
    );
    return mapWorkflowTaskRecord(updated);
  }

  async retryWorkflowTaskNotification(
    tenantId: string,
    input: RetryWorkflowTaskNotificationInput,
  ): Promise<WorkflowTaskRecord> {
    const existing = await this.prisma.workflowTaskRecord.findFirst({
      where: { id: input.taskId, tenantId },
      include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
    if (!existing) {
      throw new Error(`Workflow task not found: ${input.taskId}`);
    }
    const now = new Date();
    const updated = await this.prisma.workflowTaskRecord.update({
      where: { id: existing.id },
      data: {
        ...workflowTaskNotificationTimestampUpdate(input.notification, now),
        operations: {
          create: {
            tenantId,
            operation: "retried",
            actorId: input.actorId,
            reason: input.reason ?? null,
            details: { notification: input.notification },
          },
        },
      },
      include: { operations: { orderBy: { createdAt: "desc" }, take: 12 } },
    });
    const mapped = mapWorkflowTaskRecord(updated);
    const operation = mapped.operations[0];
    await this.publishOutboxEvent(tenantId, {
      eventType: `workflow.task.${input.notification}`,
      payload: {
        ...workflowTaskRecordPayload(mapped),
        operationId: operation?.id,
        retryReason: input.reason ?? null,
        idempotencyKey: `${mapped.taskKey}:${input.notification}:retry:${operation?.id ?? now.toISOString()}`,
      },
    });
    await this.recordAudit(
      tenantId,
      "WorkflowTaskRecord",
      existing.id,
      "notification_retried",
      `Workflow task ${existing.taskKey} ${input.notification} notification retried.`,
    );
    return mapped;
  }

  async createLead(tenantId: string, input: CreateLeadInput): Promise<Lead> {
    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        source: input.source,
        stage: "new",
        owner: input.owner,
      },
    });
    await this.recordAudit(
      tenantId,
      "Lead",
      lead.id,
      "created",
      `Lead ${lead.companyName} created.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "operations.lead.created",
      payload: {
        leadId: lead.id,
        companyName: lead.companyName,
        owner: lead.owner,
      },
    });
    return mapLead(lead);
  }

  async createProject(
    tenantId: string,
    input: CreateProjectInput,
  ): Promise<Project> {
    const project = await this.prisma.projectRecord.create({
      data: {
        tenantId,
        code: input.code,
        name: input.name,
        customerName: input.customerName,
        status: "planned",
        budget: input.budget.amount,
        currency: input.budget.currency,
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        endDate: new Date(`${input.endDate}T00:00:00.000Z`),
      },
    });
    await this.recordAudit(
      tenantId,
      "Project",
      project.id,
      "created",
      `Project ${project.code} created.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "operations.project.created",
      payload: {
        projectId: project.id,
        code: project.code,
        customerName: project.customerName,
      },
    });
    return mapProject(project);
  }

  async createServiceCase(
    tenantId: string,
    input: CreateServiceCaseInput,
  ): Promise<ServiceCase> {
    const count = await this.prisma.serviceCase.count({ where: { tenantId } });
    const serviceCase = await this.prisma.serviceCase.create({
      data: {
        tenantId,
        caseNumber: nextDocumentNumber("CASE", count),
        customerName: input.customerName,
        subject: input.subject,
        priority: input.priority,
        status: "open",
        owner: input.owner,
      },
    });
    await this.recordAudit(
      tenantId,
      "ServiceCase",
      serviceCase.id,
      "created",
      `Service case ${serviceCase.caseNumber} created.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "operations.service-case.created",
      payload: {
        serviceCaseId: serviceCase.id,
        caseNumber: serviceCase.caseNumber,
        priority: serviceCase.priority,
      },
    });
    return mapServiceCase(serviceCase);
  }

  async createLeaveRequest(
    tenantId: string,
    input: CreateLeaveRequestInput,
  ): Promise<LeaveRequest> {
    const employee = await this.prisma.employeeRecord.findFirstOrThrow({
      where: { id: input.employeeId, tenantId },
    });
    const request = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        employeeId: employee.id,
        leaveType: input.leaveType,
        status: "requested",
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        endDate: new Date(`${input.endDate}T00:00:00.000Z`),
      },
    });
    await this.recordAudit(
      tenantId,
      "LeaveRequest",
      request.id,
      "created",
      `Leave request for ${employee.name} created.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "operations.leave-request.created",
      payload: {
        leaveRequestId: request.id,
        employeeId: request.employeeId,
        leaveType: request.leaveType,
      },
    });
    return mapLeaveRequest(request, employee.name);
  }

  async closeServiceCase(
    tenantId: string,
    caseId: string,
  ): Promise<ServiceCase> {
    const before = await this.prisma.serviceCase.findFirstOrThrow({
      where: { id: caseId, tenantId },
    });
    const serviceCase = await this.prisma.serviceCase.update({
      where: { id: before.id },
      data: { status: "closed" },
    });
    await this.recordAudit(
      tenantId,
      "ServiceCase",
      serviceCase.id,
      "closed",
      `Service case ${serviceCase.caseNumber} closed.`,
    );
    await this.publishOutboxEvent(tenantId, {
      eventType: "operations.service-case.closed",
      payload: {
        serviceCaseId: serviceCase.id,
        caseNumber: serviceCase.caseNumber,
      },
    });
    return mapServiceCase(serviceCase);
  }

  async updateCustomer(tenantId: string, input: UpdateCustomerInput) {
    await this.prisma.customer.updateMany({
      where: { id: input.id, tenantId },
      data: {
        code: input.code,
        name: input.name,
        owner: input.owner,
        email: input.email,
        creditLimit: input.creditLimit.amount,
        currency: input.creditLimit.currency,
        customData: input.customFields ?? {},
      },
    });
    const customer = await this.prisma.customer.findFirstOrThrow({
      where: { id: input.id, tenantId },
    });
    await this.recordAudit(
      tenantId,
      "Customer",
      customer.id,
      "updated",
      `Customer ${customer.name} updated.`,
    );
    return {
      id: customer.id,
      code: customer.code,
      name: customer.name,
      status: customer.status,
      owner: customer.owner,
      email: customer.email,
      creditLimit: money(customer.creditLimit, customer.currency),
      customFields: normalizeCustomFields(customer.customData),
    };
  }

  async createCustomField(
    tenantId: string,
    input: CreateCustomFieldInput,
  ): Promise<CustomFieldDefinition> {
    const field = await this.prisma.customFieldDefinition.upsert({
      where: {
        tenantId_entityType_key: {
          tenantId,
          entityType: input.entityType,
          key: input.key,
        },
      },
      update: {
        label: input.label,
        fieldType: input.fieldType,
        required: input.required,
        options: input.options,
        displayOrder: input.displayOrder,
      },
      create: {
        tenantId,
        entityType: input.entityType,
        key: input.key,
        label: input.label,
        fieldType: input.fieldType,
        required: input.required,
        options: input.options,
        displayOrder: input.displayOrder,
      },
    });
    const defaultView = await this.prisma.viewDefinition.findUnique({
      where: {
        tenantId_entityType_name: {
          tenantId,
          entityType: input.entityType,
          name: "default",
        },
      },
    });
    const currentFields = normalizeStringArray(defaultView?.fields);
    const customFieldKey = `custom.${field.key}`;
    if (!currentFields.includes(customFieldKey)) {
      await this.prisma.viewDefinition.upsert({
        where: {
          tenantId_entityType_name: {
            tenantId,
            entityType: input.entityType,
            name: "default",
          },
        },
        update: { fields: [...currentFields, customFieldKey] },
        create: {
          tenantId,
          entityType: input.entityType,
          name: "default",
          fields: [...defaultEntityFields(input.entityType), customFieldKey],
        },
      });
    }
    await this.recordAudit(
      tenantId,
      "CustomFieldDefinition",
      field.id,
      "upserted",
      `Custom field ${field.label} configured.`,
    );
    return {
      id: field.id,
      entityType: field.entityType,
      key: field.key,
      label: field.label,
      fieldType: parseFieldType(field.fieldType),
      required: field.required,
      options: normalizeStringArray(field.options),
      displayOrder: field.displayOrder,
    };
  }

  async createAutomationRule(
    tenantId: string,
    input: CreateAutomationRuleInput,
  ): Promise<AutomationRule> {
    const existing = await this.prisma.automationRule.findFirst({
      where: { tenantId, name: input.name },
    });
    const rule = existing
      ? await this.prisma.automationRule.update({
          where: { id: existing.id },
          data: {
            triggerType: "event",
            triggerEvent: input.triggerEvent,
            schedule: null,
            enabled: input.enabled,
            actions: input.actions as Prisma.InputJsonValue,
            lastError: null,
          },
        })
      : await this.prisma.automationRule.create({
          data: {
            tenantId,
            name: input.name,
            triggerType: "event",
            triggerEvent: input.triggerEvent,
            schedule: null,
            enabled: input.enabled,
            actions: input.actions as Prisma.InputJsonValue,
          },
        });
    await this.recordAudit(
      tenantId,
      "AutomationRule",
      rule.id,
      existing ? "updated" : "created",
      `Automation rule ${rule.name} configured.`,
    );
    return {
      id: rule.id,
      name: rule.name,
      triggerType: rule.triggerType === "schedule" ? "schedule" : "event",
      triggerEvent: rule.triggerEvent,
      schedule: rule.schedule,
      enabled: rule.enabled,
      actions: normalizeActionArray(rule.actions),
      runCount: rule.runCount,
      lastRunAt: rule.lastRunAt?.toISOString() ?? null,
      lastError: rule.lastError,
    };
  }

  async createWorkflowAssignmentRule(
    tenantId: string,
    input: CreateWorkflowAssignmentRuleInput,
  ): Promise<WorkflowAssignmentRule> {
    const existing = await this.prisma.workflowAssignmentRule.findFirst({
      where: {
        tenantId,
        workflowId: input.workflowId,
        fromState: input.fromState,
        toState: input.toState,
        role: input.role,
      },
    });
    const rule = existing
      ? await this.prisma.workflowAssignmentRule.update({
          where: { id: existing.id },
          data: {
            delegateRole: input.delegateRole ?? null,
            delegateStartsAt: input.delegateStartsAt
              ? new Date(input.delegateStartsAt)
              : null,
            delegateEndsAt: input.delegateEndsAt
              ? new Date(input.delegateEndsAt)
              : null,
            minAmount: input.minAmount ?? null,
            maxAmount: input.maxAmount ?? null,
            active: input.active,
          },
        })
      : await this.prisma.workflowAssignmentRule.create({
          data: {
            tenantId,
            workflowId: input.workflowId,
            fromState: input.fromState,
            toState: input.toState,
            role: input.role,
            delegateRole: input.delegateRole ?? null,
            delegateStartsAt: input.delegateStartsAt
              ? new Date(input.delegateStartsAt)
              : null,
            delegateEndsAt: input.delegateEndsAt
              ? new Date(input.delegateEndsAt)
              : null,
            minAmount: input.minAmount ?? null,
            maxAmount: input.maxAmount ?? null,
            active: input.active,
          },
        });
    await this.recordAudit(
      tenantId,
      "WorkflowAssignmentRule",
      rule.id,
      existing ? "updated" : "created",
      `Workflow assignment rule ${rule.workflowId} ${rule.fromState} to ${rule.toState} configured.`,
    );
    return mapWorkflowAssignmentRule(rule);
  }

  async createWorkflowEscalationRule(
    tenantId: string,
    input: CreateWorkflowEscalationRuleInput,
  ): Promise<WorkflowEscalationRule> {
    const existing = await this.prisma.workflowEscalationRule.findFirst({
      where: {
        tenantId,
        workflowId: input.workflowId,
        fromState: input.fromState,
        toState: input.toState,
        targetRole: input.targetRole,
      },
    });
    const rule = existing
      ? await this.prisma.workflowEscalationRule.update({
          where: { id: existing.id },
          data: {
            dueInHours: input.dueInHours,
            escalationRole: input.escalationRole,
            notificationChannel: input.notificationChannel,
            active: input.active,
          },
        })
      : await this.prisma.workflowEscalationRule.create({
          data: {
            tenantId,
            workflowId: input.workflowId,
            fromState: input.fromState,
            toState: input.toState,
            targetRole: input.targetRole,
            dueInHours: input.dueInHours,
            escalationRole: input.escalationRole,
            notificationChannel: input.notificationChannel,
            active: input.active,
          },
        });
    await this.recordAudit(
      tenantId,
      "WorkflowEscalationRule",
      rule.id,
      existing ? "updated" : "created",
      `Workflow escalation rule ${rule.workflowId} ${rule.fromState} to ${rule.toState} configured.`,
    );
    return mapWorkflowEscalationRule(rule);
  }

  async setModuleEnabled(
    tenantId: string,
    moduleId: string,
    enabled: boolean,
  ): Promise<string[]> {
    const setting = await this.prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: "enabled_modules" } },
    });
    const current =
      normalizeStringArray(setting?.value).length > 0
        ? normalizeStringArray(setting?.value)
        : ["core", "sales"];
    const next = enabled
      ? [...new Set([...current, moduleId])].sort()
      : current.filter((enabledModule) => enabledModule !== moduleId).sort();
    await this.prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: "enabled_modules" } },
      update: { value: next },
      create: { tenantId, key: "enabled_modules", value: next },
    });
    await this.recordAudit(
      tenantId,
      "Module",
      moduleId,
      enabled ? "enabled" : "disabled",
      `Module ${moduleId} ${enabled ? "enabled" : "disabled"}.`,
    );
    return next;
  }

  async updateProduct(tenantId: string, input: UpdateProductInput) {
    await this.prisma.product.updateMany({
      where: { id: input.id, tenantId },
      data: {
        sku: input.sku,
        name: input.name,
        category: input.category,
        price: input.price.amount,
        currency: input.price.currency,
        stockOnHand: input.stockOnHand,
      },
    });
    const product = await this.prisma.product.findFirstOrThrow({
      where: { id: input.id, tenantId },
    });
    await this.recordAudit(
      tenantId,
      "Product",
      product.id,
      "updated",
      `Product ${product.name} updated.`,
    );
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: money(product.price, product.currency),
      stockOnHand: product.stockOnHand,
    };
  }

  async transitionQuote(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ) {
    const status = parseRecordStatus(input.status);
    const quote = await this.prisma.$transaction(async (tx) => {
      const before = await tx.quote.findFirstOrThrow({
        where: { id: input.id, tenantId },
        select: { id: true, number: true, status: true },
      });
      assertRecordTransition("Quote", before.status, status);
      await tx.quote.updateMany({
        where: { id: input.id, tenantId },
        data: { status },
      });
      if (input.workflowTransition) {
        await this.recordPrismaWorkflowTransition(
          tx,
          tenantId,
          input.workflowTransition,
        );
      }
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "Quote",
          entityId: before.id,
          action: "transitioned",
          message: `Quote ${before.number} moved to ${status}.`,
        },
      });
      return tx.quote.findFirstOrThrow({
        where: { id: input.id, tenantId },
        include: { customer: { select: { name: true } } },
      });
    });
    return {
      id: quote.id,
      number: quote.number,
      customerId: quote.customerId,
      customerName: quote.customer.name,
      status: quote.status,
      validUntil: dateOnly(quote.validUntil),
      total: money(quote.total, quote.currency),
      lines: Array.isArray(quote.lines) ? (quote.lines as Quote["lines"]) : [],
    };
  }

  async transitionOrder(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ) {
    const status = parseRecordStatus(input.status);
    const before = await this.prisma.salesOrder.findFirstOrThrow({
      where: { id: input.id, tenantId },
      include: { quote: true },
    });
    assertRecordTransition("SalesOrder", before.status, status);
    if (status === "approved" && before.status !== "approved") {
      await this.applyPrismaStockForOrder(
        tenantId,
        before.id,
        before.number,
        normalizeLines(before.quote.lines),
      );
    } else if (status === "approved") {
      await this.applyPrismaStockForOrder(
        tenantId,
        before.id,
        before.number,
        normalizeLines(before.quote.lines),
      );
    }
    const order = await this.prisma.$transaction(async (tx) => {
      await tx.salesOrder.updateMany({
        where: { id: input.id, tenantId },
        data: { status },
      });
      if (input.workflowTransition) {
        await this.recordPrismaWorkflowTransition(
          tx,
          tenantId,
          input.workflowTransition,
        );
      }
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "SalesOrder",
          entityId: before.id,
          action: "transitioned",
          message: `Sales order ${before.number} moved to ${status}.`,
        },
      });
      return tx.salesOrder.findFirstOrThrow({
        where: { id: input.id, tenantId },
        include: {
          quote: { include: { customer: { select: { name: true } } } },
        },
      });
    });
    return {
      id: order.id,
      number: order.number,
      quoteId: order.quoteId,
      customerName: order.quote.customer.name,
      status: order.status,
      promisedDate: dateOnly(order.promisedDate),
      total: money(order.total, order.currency),
    };
  }

  async transitionInvoice(
    tenantId: string,
    input: PersistedDocumentTransitionInput,
  ) {
    const status = parseInvoiceStatus(input.status);
    const invoice = await this.prisma.$transaction(async (tx) => {
      const before = await tx.invoice.findFirstOrThrow({
        where: { id: input.id, tenantId },
        select: { id: true, number: true, status: true },
      });
      assertInvoiceTransition(before.status, status);
      await tx.invoice.updateMany({
        where: { id: input.id, tenantId },
        data: { status },
      });
      if (input.workflowTransition) {
        await this.recordPrismaWorkflowTransition(
          tx,
          tenantId,
          input.workflowTransition,
        );
      }
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "Invoice",
          entityId: before.id,
          action: "transitioned",
          message: `Invoice ${before.number} moved to ${status}.`,
        },
      });
      return tx.invoice.findFirstOrThrow({
        where: { id: input.id, tenantId },
        include: {
          order: {
            include: {
              quote: { include: { customer: { select: { name: true } } } },
            },
          },
        },
      });
    });
    if (invoice.status === "posted") {
      await this.postPrismaInvoiceJournal(
        tenantId,
        invoice.id,
        invoice.number,
        money(invoice.total, invoice.currency),
      );
    }
    return {
      id: invoice.id,
      number: invoice.number,
      orderId: invoice.orderId,
      customerName: invoice.order.quote.customer.name,
      status: invoice.status,
      dueDate: dateOnly(invoice.dueDate),
      total: money(invoice.total, invoice.currency),
    };
  }

  async generateOrderFromQuote(tenantId: string, quoteId: string) {
    const quote = await this.prisma.quote.findFirstOrThrow({
      where: { id: quoteId, tenantId },
      include: {
        customer: { select: { name: true } },
        orders: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    const existing = quote.orders[0];
    if (existing) {
      await this.ensureWorkflowInstance(tenantId, {
        workflowId: "sales.order",
        document: { entity: "SalesOrder", id: existing.id },
        state: existing.status,
      });
      return {
        id: existing.id,
        number: existing.number,
        quoteId: existing.quoteId,
        customerName: quote.customer.name,
        status: existing.status,
        promisedDate: dateOnly(existing.promisedDate),
        total: money(existing.total, existing.currency),
      };
    }
    if (quote.status !== "approved") {
      throw new Error(
        `Quote ${quote.number} must be approved before creating an order.`,
      );
    }
    const orderCount = await this.prisma.salesOrder.count({
      where: { tenantId },
    });
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.salesOrder.create({
        data: {
          tenantId,
          quoteId: quote.id,
          number: nextDocumentNumber("SO", orderCount),
          status: "draft",
          promisedDate: daysFromNow(14),
          total: quote.total,
          currency: quote.currency,
        },
      });
      await this.upsertPrismaWorkflowInstance(tx, tenantId, {
        workflowId: "sales.order",
        document: { entity: "SalesOrder", id: created.id },
        state: created.status,
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "SalesOrder",
          entityId: created.id,
          action: "created",
          message: `Sales order ${created.number} created from quote ${quote.number}.`,
        },
      });
      return created;
    });
    return {
      id: order.id,
      number: order.number,
      quoteId: order.quoteId,
      customerName: quote.customer.name,
      status: order.status,
      promisedDate: dateOnly(order.promisedDate),
      total: money(order.total, order.currency),
    };
  }

  async generateInvoiceFromOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.salesOrder.findFirstOrThrow({
      where: { id: orderId, tenantId },
      include: {
        quote: { include: { customer: { select: { name: true } } } },
        invoices: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    const existing = order.invoices[0];
    if (existing) {
      await this.ensureWorkflowInstance(tenantId, {
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: existing.id },
        state: existing.status,
      });
      return {
        id: existing.id,
        number: existing.number,
        orderId: existing.orderId,
        customerName: order.quote.customer.name,
        status: existing.status,
        dueDate: dateOnly(existing.dueDate),
        total: money(existing.total, existing.currency),
      };
    }
    if (!["approved", "closed"].includes(order.status)) {
      throw new Error(
        `Sales order ${order.number} must be approved or closed before creating an invoice.`,
      );
    }
    const invoiceCount = await this.prisma.invoice.count({
      where: { tenantId },
    });
    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          tenantId,
          orderId: order.id,
          number: nextDocumentNumber("INV", invoiceCount),
          status: "draft",
          dueDate: daysFromNow(30),
          total: order.total,
          currency: order.currency,
        },
      });
      await this.upsertPrismaWorkflowInstance(tx, tenantId, {
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: created.id },
        state: created.status,
      });
      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: "usr_admin",
          entity: "Invoice",
          entityId: created.id,
          action: "created",
          message: `Invoice ${created.number} created from order ${order.number}.`,
        },
      });
      return created;
    });
    return {
      id: invoice.id,
      number: invoice.number,
      orderId: invoice.orderId,
      customerName: order.quote.customer.name,
      status: invoice.status,
      dueDate: dateOnly(invoice.dueDate),
      total: money(invoice.total, invoice.currency),
    };
  }

  async recordPayment(
    tenantId: string,
    input: RecordPaymentInput,
  ): Promise<Payment> {
    const invoice = await this.prisma.invoice.findFirstOrThrow({
      where: { id: input.invoiceId, tenantId },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        currency: true,
      },
    });
    const journalEntry = await this.postPrismaPaymentJournal(
      tenantId,
      invoice.id,
      invoice.number,
      input.amount,
    );
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        journalEntryId: journalEntry.id,
        amount: input.amount.amount,
        currency: input.amount.currency,
        method: input.method,
        receivedAt: new Date(input.receivedAt),
      },
      include: { invoice: { select: { number: true } } },
    });
    if (input.amount.amount >= Number(invoice.total)) {
      await this.prisma.invoice.updateMany({
        where: { id: invoice.id, tenantId },
        data: { status: "paid" },
      });
      if (invoice.status === "posted") {
        await this.recordPrismaWorkflowTransition(this.prisma, tenantId, {
          id: `wft_invoice_payment_${payment.id}`,
          workflowId: "sales.invoice",
          document: { entity: "Invoice", id: invoice.id },
          actorId: "usr_admin",
          from: invoice.status,
          to: "paid",
          reason: `Payment ${payment.id} recorded.`,
          occurredAt: input.receivedAt,
        });
      } else {
        await this.ensureWorkflowInstance(tenantId, {
          workflowId: "sales.invoice",
          document: { entity: "Invoice", id: invoice.id },
          state: "paid",
          updatedAt: input.receivedAt,
        });
      }
    }
    await this.recordAudit(
      tenantId,
      "Payment",
      payment.id,
      "recorded",
      `Payment for invoice ${invoice.number} recorded.`,
    );
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice.number,
      amount: money(payment.amount, payment.currency),
      method: payment.method,
      receivedAt: payment.receivedAt.toISOString(),
    };
  }

  async createBankTransaction(
    tenantId: string,
    input: CreateBankTransactionInput,
  ): Promise<BankTransaction> {
    await this.ensureAccountingInfrastructure(tenantId);
    const transaction = await this.prisma.bankTransaction.create({
      data: {
        tenantId,
        bankAccountId: input.bankAccountId,
        reference: input.reference,
        direction: input.direction,
        amount: input.amount.amount,
        currency: input.amount.currency,
        transactionDate: new Date(input.transactionDate),
        matchedEntity: input.matchedEntity ?? null,
        matchedEntityId: input.matchedEntityId ?? null,
      },
    });
    await this.recordAudit(
      tenantId,
      "BankTransaction",
      transaction.id,
      "created",
      `Bank transaction ${transaction.reference} created.`,
    );
    return {
      id: transaction.id,
      bankAccountId: transaction.bankAccountId,
      reference: transaction.reference,
      direction: transaction.direction === "outbound" ? "outbound" : "inbound",
      amount: money(transaction.amount, transaction.currency),
      transactionDate: dateOnly(transaction.transactionDate),
      matchedEntity: transaction.matchedEntity,
      matchedEntityId: transaction.matchedEntityId,
      reconciledAt: transaction.reconciledAt?.toISOString() ?? null,
    };
  }

  async reconcileBankAccount(
    tenantId: string,
    input: ReconcileBankAccountInput,
  ): Promise<BankReconciliation> {
    await this.ensureAccountingInfrastructure(tenantId);
    const bankAccount = await this.prisma.bankAccount.findFirstOrThrow({
      where: { tenantId, id: input.bankAccountId },
    });
    const transactions = await this.prisma.bankTransaction.findMany({
      where: {
        tenantId,
        bankAccountId: bankAccount.id,
        id: { in: input.transactionIds },
      },
    });
    const clearedBalance = transactions.reduce(
      (sum, transaction) =>
        sum +
        (transaction.direction === "inbound"
          ? Number(transaction.amount)
          : -Number(transaction.amount)),
      Number(bankAccount.openingBalance),
    );
    const variance = input.statementBalance.amount - clearedBalance;
    const reconciledAt = new Date();
    const reconciliation = await this.prisma.$transaction(async (tx) => {
      await tx.bankTransaction.updateMany({
        where: {
          tenantId,
          bankAccountId: bankAccount.id,
          id: { in: transactions.map((transaction) => transaction.id) },
        },
        data: { reconciledAt },
      });
      await tx.bankAccount.update({
        where: { id: bankAccount.id },
        data: { lastReconciledAt: reconciledAt },
      });
      return tx.bankReconciliation.create({
        data: {
          tenantId,
          bankAccountId: bankAccount.id,
          statementDate: new Date(input.statementDate),
          statementBalance: input.statementBalance.amount,
          currency: input.statementBalance.currency,
          clearedBalance,
          variance,
          status: Math.abs(variance) < 0.01 ? "balanced" : "variance",
          transactionIds: transactions.map((transaction) => transaction.id),
          reconciledAt,
        },
      });
    });
    await this.recordAudit(
      tenantId,
      "BankReconciliation",
      reconciliation.id,
      "reconciled",
      `Bank account ${bankAccount.code} reconciled.`,
    );
    return {
      id: reconciliation.id,
      bankAccountId: reconciliation.bankAccountId,
      statementDate: dateOnly(reconciliation.statementDate),
      statementBalance: money(
        reconciliation.statementBalance,
        reconciliation.currency,
      ),
      clearedBalance: money(
        reconciliation.clearedBalance,
        reconciliation.currency,
      ),
      variance: money(reconciliation.variance, reconciliation.currency),
      status: reconciliation.status === "balanced" ? "balanced" : "variance",
      reconciledAt: reconciliation.reconciledAt.toISOString(),
    };
  }

  async closeFiscalPeriod(
    tenantId: string,
    input: CloseFiscalPeriodInput,
  ): Promise<PeriodClose> {
    await this.ensureAccountingInfrastructure(tenantId);
    const fiscalPeriod = await this.prisma.fiscalPeriod.findFirstOrThrow({
      where: { tenantId, id: input.fiscalPeriodId },
    });
    const existing = await this.prisma.periodClose.findUnique({
      where: {
        tenantId_fiscalPeriodId: { tenantId, fiscalPeriodId: fiscalPeriod.id },
      },
      include: { fiscalPeriod: { select: { name: true } } },
    });
    if (existing) {
      return {
        id: existing.id,
        fiscalPeriodId: existing.fiscalPeriodId,
        fiscalPeriodName: existing.fiscalPeriod.name,
        status: "closed",
        closedAt: existing.closedAt.toISOString(),
        journalEntryId: existing.journalEntryId,
      };
    }
    const journalEntry = await this.postPrismaPeriodCloseJournal(
      tenantId,
      fiscalPeriod.id,
      fiscalPeriod.name,
      input.closedAt,
    );
    const close = await this.prisma.$transaction(async (tx) => {
      await tx.fiscalPeriod.update({
        where: { id: fiscalPeriod.id },
        data: { status: "closed" },
      });
      return tx.periodClose.create({
        data: {
          tenantId,
          fiscalPeriodId: fiscalPeriod.id,
          journalEntryId: journalEntry.id,
          closedAt: new Date(input.closedAt),
          status: "closed",
        },
        include: { fiscalPeriod: { select: { name: true } } },
      });
    });
    await this.recordAudit(
      tenantId,
      "PeriodClose",
      close.id,
      "closed",
      `Fiscal period ${fiscalPeriod.name} closed.`,
    );
    return {
      id: close.id,
      fiscalPeriodId: close.fiscalPeriodId,
      fiscalPeriodName: close.fiscalPeriod.name,
      status: "closed",
      closedAt: close.closedAt.toISOString(),
      journalEntryId: close.journalEntryId,
    };
  }

  async allocateLandedCost(
    tenantId: string,
    input: AllocateLandedCostInput,
  ): Promise<LandedCostAllocation> {
    await this.ensureAccountingInfrastructure(tenantId);
    const receipt = await this.prisma.purchaseReceipt.findFirstOrThrow({
      where: { tenantId, id: input.purchaseReceiptId },
    });
    const layers = await this.prisma.valuationLayer.findMany({
      where: {
        tenantId,
        sourceEntity: "PurchaseReceipt",
        sourceId: receipt.id,
        remainingQuantity: { gt: 0 },
      },
    });
    if (layers.length === 0) {
      throw new Error(
        `No valuation layers found for receipt: ${receipt.number}`,
      );
    }
    const basis = layers.reduce((sum, layer) => {
      if (input.method === "value") {
        return sum + Number(layer.unitCost) * layer.remainingQuantity;
      }
      return sum + layer.remainingQuantity;
    }, 0);
    const lines = layers.map((layer) => {
      const lineBasis =
        input.method === "value"
          ? Number(layer.unitCost) * layer.remainingQuantity
          : layer.remainingQuantity;
      const allocatedAmount =
        basis === 0
          ? 0
          : Math.round((input.amount.amount * lineBasis * 100) / basis) / 100;
      const unitCostIncrement =
        layer.remainingQuantity === 0
          ? 0
          : allocatedAmount / layer.remainingQuantity;
      return { valuationLayerId: layer.id, allocatedAmount, unitCostIncrement };
    });
    const allocation = await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const layer = layers.find(
          (record) => record.id === line.valuationLayerId,
        );
        if (!layer) {
          continue;
        }
        await tx.valuationLayer.update({
          where: { id: line.valuationLayerId },
          data: { unitCost: Number(layer.unitCost) + line.unitCostIncrement },
        });
      }
      const record = await tx.landedCostAllocation.create({
        data: {
          tenantId,
          purchaseReceiptId: receipt.id,
          amount: input.amount.amount,
          currency: input.amount.currency,
          method: input.method,
          lines,
        },
        include: { purchaseReceipt: { select: { number: true } } },
      });
      const journal = await this.postPrismaLandedCostJournalTx(
        tx,
        tenantId,
        record.id,
        receipt.number,
        input.amount,
      );
      return { record, journal };
    });
    await this.recordAudit(
      tenantId,
      "LandedCostAllocation",
      allocation.record.id,
      "allocated",
      `Landed cost allocated to receipt ${receipt.number}.`,
    );
    return {
      id: allocation.record.id,
      purchaseReceiptId: allocation.record.purchaseReceiptId,
      purchaseReceiptNumber: allocation.record.purchaseReceipt.number,
      amount: money(allocation.record.amount, allocation.record.currency),
      method: allocation.record.method === "value" ? "value" : "quantity",
      allocatedAt: allocation.record.allocatedAt.toISOString(),
    };
  }

  async createFixedAsset(
    tenantId: string,
    input: CreateFixedAssetInput,
  ): Promise<FixedAsset> {
    await this.ensureAccountingInfrastructure(tenantId);
    const asset = await this.prisma.fixedAsset.create({
      data: {
        tenantId,
        assetTag: input.assetTag,
        name: input.name,
        purchaseDate: new Date(input.purchaseDate),
        cost: input.cost.amount,
        currency: input.cost.currency,
        usefulLifeMonths: input.usefulLifeMonths,
      },
    });
    await this.postPrismaAssetAcquisitionJournal(
      tenantId,
      asset.id,
      asset.assetTag,
      input.cost,
    );
    await this.recordAudit(
      tenantId,
      "FixedAsset",
      asset.id,
      "capitalized",
      `Fixed asset ${asset.assetTag} capitalized.`,
    );
    return {
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      purchaseDate: dateOnly(asset.purchaseDate),
      cost: money(asset.cost, asset.currency),
      usefulLifeMonths: asset.usefulLifeMonths,
      accumulatedDepreciation: money(
        asset.accumulatedDepreciation,
        asset.currency,
      ),
      netBookValue: money(
        Number(asset.cost) - Number(asset.accumulatedDepreciation),
        asset.currency,
      ),
      status: "active",
    };
  }

  async runDepreciation(
    tenantId: string,
    input: RunDepreciationInput,
  ): Promise<DepreciationRun> {
    await this.ensureAccountingInfrastructure(tenantId);
    const asset = await this.prisma.fixedAsset.findFirstOrThrow({
      where: { tenantId, id: input.fixedAssetId },
    });
    const runDate = new Date(input.runDate);
    const existing = await this.prisma.depreciationRun.findUnique({
      where: {
        tenantId_fixedAssetId_runDate: {
          tenantId,
          fixedAssetId: asset.id,
          runDate,
        },
      },
      include: { fixedAsset: { select: { assetTag: true } } },
    });
    if (existing) {
      return {
        id: existing.id,
        fixedAssetId: existing.fixedAssetId,
        assetTag: existing.fixedAsset.assetTag,
        amount: money(existing.amount, existing.currency),
        runDate: dateOnly(existing.runDate),
        journalEntryId: existing.journalEntryId,
      };
    }
    const remaining = Math.max(
      Number(asset.cost) - Number(asset.accumulatedDepreciation),
      0,
    );
    const amount = Math.min(
      Math.round((Number(asset.cost) / asset.usefulLifeMonths) * 100) / 100,
      remaining,
    );
    const journalEntry = await this.postPrismaDepreciationJournal(
      tenantId,
      asset.id,
      asset.assetTag,
      { amount, currency: asset.currency },
    );
    const run = await this.prisma.$transaction(async (tx) => {
      await tx.fixedAsset.update({
        where: { id: asset.id },
        data: { accumulatedDepreciation: { increment: amount } },
      });
      return tx.depreciationRun.create({
        data: {
          tenantId,
          fixedAssetId: asset.id,
          journalEntryId: journalEntry.id,
          amount,
          currency: asset.currency,
          runDate,
        },
        include: { fixedAsset: { select: { assetTag: true } } },
      });
    });
    await this.recordAudit(
      tenantId,
      "DepreciationRun",
      run.id,
      "posted",
      `Depreciation posted for ${asset.assetTag}.`,
    );
    return {
      id: run.id,
      fixedAssetId: run.fixedAssetId,
      assetTag: run.fixedAsset.assetTag,
      amount: money(run.amount, run.currency),
      runDate: dateOnly(run.runDate),
      journalEntryId: run.journalEntryId,
    };
  }

  async setExchangeRate(
    tenantId: string,
    input: SetExchangeRateInput,
  ): Promise<ExchangeRate> {
    const rate = await this.prisma.exchangeRate.upsert({
      where: {
        tenantId_baseCurrency_quoteCurrency_effectiveDate: {
          tenantId,
          baseCurrency: input.baseCurrency,
          quoteCurrency: input.quoteCurrency,
          effectiveDate: new Date(input.effectiveDate),
        },
      },
      create: {
        tenantId,
        baseCurrency: input.baseCurrency,
        quoteCurrency: input.quoteCurrency,
        rate: input.rate,
        effectiveDate: new Date(input.effectiveDate),
      },
      update: { rate: input.rate },
    });
    await this.recordAudit(
      tenantId,
      "ExchangeRate",
      rate.id,
      "updated",
      `${input.baseCurrency}/${input.quoteCurrency} rate updated.`,
    );
    return {
      id: rate.id,
      baseCurrency: rate.baseCurrency,
      quoteCurrency: rate.quoteCurrency,
      rate: Number(rate.rate),
      effectiveDate: dateOnly(rate.effectiveDate),
    };
  }

  private async recordAudit(
    tenantId: string,
    entity: string,
    entityId: string,
    action: string,
    message: string,
  ) {
    await this.prisma.auditEvent.create({
      data: {
        tenantId,
        actorId: "usr_admin",
        entity,
        entityId,
        action,
        message,
      },
    });
  }

  private async upsertPrismaWorkflowInstance(
    client: WorkflowPersistenceClient,
    tenantId: string,
    input: EnsureWorkflowInstanceInput,
  ): Promise<PrismaWorkflowInstanceRecord> {
    const timestamp = input.updatedAt ?? input.startedAt;
    return client.workflowInstance.upsert({
      where: {
        tenantId_workflowId_entity_documentId: {
          tenantId,
          workflowId: input.workflowId,
          entity: input.document.entity,
          documentId: input.document.id,
        },
      },
      create: {
        tenantId,
        workflowId: input.workflowId,
        entity: input.document.entity,
        documentId: input.document.id,
        state: input.state,
        ...(input.startedAt ? { startedAt: new Date(input.startedAt) } : {}),
        ...(timestamp ? { updatedAt: new Date(timestamp) } : {}),
      },
      update: {
        state: input.state,
        ...(timestamp ? { updatedAt: new Date(timestamp) } : {}),
      },
      include: { transitions: { orderBy: { occurredAt: "asc" } } },
    });
  }

  private async recordPrismaWorkflowTransition(
    client: WorkflowPersistenceClient,
    tenantId: string,
    transition: WorkflowTransitionRecord,
  ): Promise<PrismaWorkflowInstanceRecord> {
    const occurredAt = new Date(transition.occurredAt);
    const instance = await this.upsertPrismaWorkflowInstance(client, tenantId, {
      workflowId: transition.workflowId,
      document: transition.document,
      state: transition.from,
      startedAt: transition.occurredAt,
      updatedAt: transition.occurredAt,
    });
    await client.workflowTransition.upsert({
      where: { id: transition.id },
      create: {
        id: transition.id,
        tenantId,
        workflowInstanceId: instance.id,
        workflowId: transition.workflowId,
        entity: transition.document.entity,
        documentId: transition.document.id,
        actorId: transition.actorId,
        fromState: transition.from,
        toState: transition.to,
        reason: transition.reason,
        occurredAt,
      },
      update: {
        reason: transition.reason,
        occurredAt,
      },
    });
    return client.workflowInstance.update({
      where: { id: instance.id },
      data: {
        state: transition.to,
        updatedAt: occurredAt,
      },
      include: { transitions: { orderBy: { occurredAt: "asc" } } },
    });
  }

  private async defaultPrismaBin(tenantId: string) {
    return this.prisma.inventoryBin.findFirstOrThrow({
      where: { tenantId, code: "MAIN-01" },
      include: { warehouse: true },
    });
  }

  private async refreshPrismaPickListStatus(
    tenantId: string,
    pickListId: string,
  ) {
    const tasks = await this.prisma.pickTask.findMany({
      where: { tenantId, pickListId },
      select: { status: true },
    });
    const status = tasks.every((task) => task.status === "picked")
      ? "picked"
      : "picking";
    await this.prisma.pickList.update({
      where: { id: pickListId },
      data: { status },
    });
  }

  private async stockLedgerQuantity(
    tenantId: string,
    productId: string,
    binId?: string,
  ): Promise<number> {
    const result = await this.prisma.stockLedgerEntry.aggregate({
      where: { tenantId, productId, ...(binId ? { binId } : {}) },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async stockReservedQuantity(
    tenantId: string,
    productId: string,
  ): Promise<number> {
    const result = await this.prisma.stockReservation.aggregate({
      where: { tenantId, productId, status: "active" },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async createPrismaMrpSuggestions(
    tenantId: string,
    productionPlanId: string,
    demandDate: string,
    productId: string,
    plannedQuantity: number,
  ) {
    if (plannedQuantity <= 0) {
      return;
    }
    const [product, bom] = await Promise.all([
      this.prisma.product.findFirstOrThrow({
        where: { tenantId, id: productId },
      }),
      this.prisma.billOfMaterial.findFirst({
        where: { tenantId, productId, status: "approved" },
      }),
    ]);
    await this.prisma.mrpSuggestion.create({
      data: {
        tenantId,
        productionPlanId,
        productId: product.id,
        suggestionType: "work_order",
        quantity: plannedQuantity,
        requiredBy: new Date(`${demandDate}T00:00:00.000Z`),
        status: "open",
      },
    });
    if (!bom) {
      return;
    }
    for (const item of normalizeBomItems(bom.items)) {
      const component = await this.prisma.product.findFirstOrThrow({
        where: { tenantId, id: item.productId },
      });
      const requiredQuantity = Math.ceil(
        (item.quantity / bom.outputQuantity) * plannedQuantity,
      );
      const availableQuantity = await this.stockLedgerQuantity(
        tenantId,
        component.id,
      );
      const shortQuantity = Math.max(requiredQuantity - availableQuantity, 0);
      if (shortQuantity <= 0) {
        continue;
      }
      await this.prisma.mrpSuggestion.create({
        data: {
          tenantId,
          productionPlanId,
          productId: component.id,
          suggestionType: "purchase",
          quantity: shortQuantity,
          requiredBy: new Date(`${demandDate}T00:00:00.000Z`),
          status: "open",
        },
      });
    }
  }

  private async prismaReportRows(
    tenantId: string,
    entityType: string,
  ): Promise<ReportRun["rows"]> {
    if (entityType === "Aging") {
      const [invoices, purchaseInvoices] = await Promise.all([
        this.prisma.invoice.findMany({
          where: { tenantId },
          include: { payments: true },
          orderBy: { dueDate: "asc" },
        }),
        this.prisma.purchaseInvoice.findMany({
          where: { tenantId },
          include: { payments: true },
          orderBy: { dueDate: "asc" },
        }),
      ]);
      const aging = buildAgingFromOpenItems(
        "Receivables",
        invoices
          .filter(
            (invoice) =>
              invoice.status === "posted" || invoice.status === "paid",
          )
          .map((invoice) => ({
            dueDate: dateOnly(invoice.dueDate),
            openAmount: Math.max(
              Number(invoice.total) -
                invoice.payments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0,
                ),
              0,
            ),
            currency: invoice.currency,
          })),
        "Payables",
        purchaseInvoices
          .filter(
            (invoice) =>
              invoice.status === "posted" || invoice.status === "paid",
          )
          .map((invoice) => ({
            dueDate: dateOnly(invoice.dueDate),
            openAmount: Math.max(
              Number(invoice.total) -
                invoice.payments.reduce(
                  (sum, payment) => sum + Number(payment.amount),
                  0,
                ),
              0,
            ),
            currency: invoice.currency,
          })),
      );
      return [
        {
          bucket: "Receivables",
          total: aging.receivables.total.amount,
          current: aging.receivables.current.amount,
          over90: aging.receivables.over90.amount,
        },
        {
          bucket: "Payables",
          total: aging.payables.total.amount,
          current: aging.payables.current.amount,
          over90: aging.payables.over90.amount,
        },
      ];
    }
    if (entityType !== "Inventory") {
      return [];
    }
    const [products, ledger] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId },
        select: { id: true, sku: true, name: true, stockOnHand: true },
      }),
      this.prisma.stockLedgerEntry.groupBy({
        by: ["productId"],
        where: { tenantId },
        _sum: { quantity: true },
      }),
    ]);
    const ledgerByProduct = new Map(
      ledger.map((entry) => [entry.productId, entry._sum.quantity ?? 0]),
    );
    return products.map((product) => ({
      sku: product.sku,
      productName: product.name,
      stockOnHand: product.stockOnHand,
      ledgerQuantity: ledgerByProduct.get(product.id) ?? 0,
    }));
  }

  private async prismaPrintRecord(
    tenantId: string,
    entityType: string,
    recordId: string,
  ): Promise<Record<string, unknown>> {
    if (entityType === "Invoice") {
      const invoice = await this.prisma.invoice.findFirstOrThrow({
        where: { tenantId, id: recordId },
        include: {
          order: {
            include: {
              quote: { include: { customer: { select: { name: true } } } },
            },
          },
        },
      });
      return {
        id: invoice.id,
        number: invoice.number,
        customerName: invoice.order.quote.customer.name,
        status: invoice.status,
        dueDate: dateOnly(invoice.dueDate),
        total: `${invoice.currency} ${Number(invoice.total).toFixed(2)}`,
      };
    }
    if (entityType === "PurchaseReceipt") {
      const receipt = await this.prisma.purchaseReceipt.findFirstOrThrow({
        where: { tenantId, id: recordId },
        include: {
          purchaseOrder: { include: { supplier: { select: { name: true } } } },
        },
      });
      return {
        id: receipt.id,
        number: receipt.number,
        supplierName: receipt.purchaseOrder.supplier.name,
        status: receipt.status,
        receivedAt: receipt.receivedAt.toISOString(),
        lines: normalizeLines(receipt.lines),
      };
    }
    if (entityType === "PickList") {
      const pickList = await this.prisma.pickList.findFirstOrThrow({
        where: { tenantId, id: recordId },
        include: { tasks: true },
      });
      return {
        id: pickList.id,
        number: pickList.id,
        status: pickList.status,
        lines: pickList.tasks.map((task) => ({
          productId: task.productId,
          quantity: task.quantity,
          picked: task.pickedQuantity,
        })),
      };
    }
    if (entityType === "Aging") {
      const rows = await this.prismaReportRows(tenantId, "Aging");
      return {
        id: "aging",
        number: "AGING",
        receivables:
          rows.find((row) => row.bucket === "Receivables")?.total ?? 0,
        payables: rows.find((row) => row.bucket === "Payables")?.total ?? 0,
      };
    }
    throw new Error(`Unsupported print entity: ${entityType}`);
  }

  private async ensureCommerceInfrastructure(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      take: 10,
    });
    await this.prisma.$transaction(async (tx) => {
      const posChannel = await tx.commerceChannel.upsert({
        where: { tenantId_code: { tenantId, code: "POS" } },
        update: {
          name: "Main Store POS",
          channelType: "pos",
          status: "active",
        },
        create: {
          tenantId,
          code: "POS",
          name: "Main Store POS",
          channelType: "pos",
          status: "active",
        },
      });
      await tx.commerceChannel.upsert({
        where: { tenantId_code: { tenantId, code: "WEB" } },
        update: {
          name: "B2B Web Store",
          channelType: "ecommerce",
          status: "active",
        },
        create: {
          tenantId,
          code: "WEB",
          name: "B2B Web Store",
          channelType: "ecommerce",
          status: "active",
        },
      });
      const priceList = await tx.priceList.upsert({
        where: { tenantId_name: { tenantId, name: "Retail USD" } },
        update: { channelId: posChannel.id, currency: "USD", active: true },
        create: {
          tenantId,
          channelId: posChannel.id,
          name: "Retail USD",
          currency: "USD",
          active: true,
        },
      });
      for (const product of products) {
        await tx.priceListItem.upsert({
          where: {
            tenantId_priceListId_productId: {
              tenantId,
              priceListId: priceList.id,
              productId: product.id,
            },
          },
          update: { price: product.price, currency: product.currency },
          create: {
            tenantId,
            priceListId: priceList.id,
            productId: product.id,
            price: product.price,
            currency: product.currency,
          },
        });
      }
      const profile = await tx.posProfile.upsert({
        where: { tenantId_name: { tenantId, name: "Main Counter" } },
        update: {
          priceListId: priceList.id,
          warehouseCode: "MAIN",
          cashAccountCode: "1000",
          active: true,
        },
        create: {
          tenantId,
          priceListId: priceList.id,
          name: "Main Counter",
          warehouseCode: "MAIN",
          cashAccountCode: "1000",
          active: true,
        },
      });
      await tx.posRegister.upsert({
        where: { tenantId_code: { tenantId, code: "REG-1" } },
        update: { profileId: profile.id, name: "Main Register" },
        create: {
          tenantId,
          profileId: profile.id,
          code: "REG-1",
          name: "Main Register",
          status: "closed",
        },
      });
    });
  }

  private async createPrismaCommerceOrder(
    tenantId: string,
    customerId: string,
    prefix: string,
    lines: SalesDocumentLine[],
    total: Money,
  ) {
    const [quoteCount, orderCount] = await Promise.all([
      this.prisma.quote.count({ where: { tenantId } }),
      this.prisma.salesOrder.count({ where: { tenantId } }),
    ]);
    const quote = await this.prisma.quote.create({
      data: {
        tenantId,
        customerId,
        number: nextDocumentNumber(`${prefix}-Q`, quoteCount),
        status: "approved",
        validUntil: daysFromNow(7),
        total: total.amount,
        currency: total.currency,
        lines,
      },
    });
    const order = await this.prisma.salesOrder.create({
      data: {
        tenantId,
        quoteId: quote.id,
        number: nextDocumentNumber(`${prefix}-SO`, orderCount),
        status: "approved",
        promisedDate: daysFromNow(3),
        total: total.amount,
        currency: total.currency,
      },
    });
    await this.applyPrismaStockForOrder(
      tenantId,
      order.id,
      order.number,
      lines,
    );
    return order;
  }

  private async createPrismaCommerceSaleDocuments(
    tenantId: string,
    customerId: string,
    prefix: string,
    lines: SalesDocumentLine[],
    total: Money,
    tenderType: PosSale["tenderType"],
  ) {
    const order = await this.createPrismaCommerceOrder(
      tenantId,
      customerId,
      prefix,
      lines,
      total,
    );
    const invoiceCount = await this.prisma.invoice.count({
      where: { tenantId },
    });
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        orderId: order.id,
        number: nextDocumentNumber(`${prefix}-INV`, invoiceCount),
        status: "posted",
        dueDate: new Date(),
        total: total.amount,
        currency: total.currency,
      },
    });
    await this.postPrismaInvoiceJournal(
      tenantId,
      invoice.id,
      invoice.number,
      total,
    );
    const journalEntry = await this.postPrismaPaymentJournal(
      tenantId,
      invoice.id,
      invoice.number,
      total,
    );
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId: invoice.id,
        journalEntryId: journalEntry.id,
        amount: total.amount,
        currency: total.currency,
        method: `pos_${tenderType}`,
        receivedAt: new Date(),
      },
    });
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "paid" },
    });
    return { order, invoice, payment };
  }

  private async applyPrismaStockForOrder(
    tenantId: string,
    orderId: string,
    orderNumber: string,
    lines: SalesDocumentLine[],
  ) {
    const existingMovement = await this.prisma.stockMovement.findFirst({
      where: { tenantId, sourceEntity: "SalesOrder", sourceId: orderId },
      select: { id: true },
    });
    if (existingMovement) {
      return;
    }
    const defaultBin = await this.defaultPrismaBin(tenantId);

    await this.prisma.$transaction(async (tx) => {
      const productIds = lines.map((line) => line.productId);
      const products = await tx.product.findMany({
        where: { tenantId, id: { in: productIds } },
        select: { id: true, sku: true, stockOnHand: true },
      });
      const productById = new Map(
        products.map((product) => [product.id, product]),
      );
      for (const line of lines) {
        const product = productById.get(line.productId);
        if (!product) {
          throw new Error(`Product not found: ${line.productId}`);
        }
        if (product.stockOnHand < line.quantity) {
          throw new Error(`Insufficient stock for ${product.sku}.`);
        }
      }

      for (const line of lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stockOnHand: { decrement: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: line.productId,
            orderId,
            sourceEntity: "SalesOrder",
            sourceId: orderId,
            quantity: -line.quantity,
            reason: `Reserved for ${orderNumber}`,
          },
        });
        await tx.stockLedgerEntry.create({
          data: {
            tenantId,
            productId: line.productId,
            warehouseId: defaultBin.warehouseId,
            binId: defaultBin.id,
            quantity: -line.quantity,
            unitCost: line.unitPrice.amount,
            value: -line.total.amount,
            currency: line.total.currency,
            sourceEntity: "SalesOrder",
            sourceId: orderId,
          },
        });
      }
    });
  }

  private async applyPrismaProcurementStock(
    tenantId: string,
    purchaseOrderId: string,
    purchaseOrderNumber: string,
    receiptNumber: string,
    lines: SalesDocumentLine[],
  ) {
    const defaultBin = await this.defaultPrismaBin(tenantId);
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.purchaseReceipt.create({
        data: {
          tenantId,
          purchaseOrderId,
          productId: lines[0]?.productId ?? null,
          number: receiptNumber,
          status: "posted",
          receivedAt: new Date(),
          lines,
        },
      });
      for (const line of lines) {
        const product = await tx.product.findFirstOrThrow({
          where: { tenantId, id: line.productId },
          select: { id: true, sku: true },
        });
        await tx.product.update({
          where: { id: line.productId },
          data: { stockOnHand: { increment: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: line.productId,
            purchaseReceiptId: receipt.id,
            sourceEntity: "PurchaseReceipt",
            sourceId: receipt.id,
            quantity: line.quantity,
            reason: `Received from ${purchaseOrderNumber}`,
          },
        });
        await tx.stockLedgerEntry.create({
          data: {
            tenantId,
            productId: line.productId,
            warehouseId: defaultBin.warehouseId,
            binId: defaultBin.id,
            quantity: line.quantity,
            unitCost: line.unitPrice.amount,
            value: line.total.amount,
            currency: line.total.currency,
            sourceEntity: "PurchaseReceipt",
            sourceId: receipt.id,
          },
        });
        await tx.valuationLayer.create({
          data: {
            tenantId,
            productId: line.productId,
            warehouseId: defaultBin.warehouseId,
            binId: defaultBin.id,
            remainingQuantity: line.quantity,
            unitCost: line.unitPrice.amount,
            currency: line.unitPrice.currency,
            sourceEntity: "PurchaseReceipt",
            sourceId: receipt.id,
          },
        });
        const trace = await this.ensurePrismaTraceRecord(
          tx,
          tenantId,
          product,
          "PurchaseReceipt",
          receipt.id,
          `LOT-${receipt.number}-${product.sku}`,
        );
        await this.recordPrismaTraceMovement(
          tx,
          tenantId,
          product,
          "receipt",
          "PurchaseReceipt",
          receipt.id,
          line.quantity,
          "in",
          trace,
        );
      }
      return receipt;
    });
  }

  private async ensurePrismaTraceRecord(
    tx: Prisma.TransactionClient,
    tenantId: string,
    product: { id: string; sku: string },
    sourceEntity: string,
    sourceId: string,
    lotNumber?: string,
  ) {
    const resolvedLot =
      lotNumber ??
      `LOT-${product.sku}-${sourceEntity}-${sourceId}`.replace(
        /[^A-Za-z0-9-]/g,
        "-",
      );
    const existing = await tx.traceRecord.findFirst({
      where: {
        tenantId,
        productId: product.id,
        lotNumber: resolvedLot,
        serialNumber: null,
      },
    });
    if (existing) {
      return existing;
    }
    return tx.traceRecord.create({
      data: {
        tenantId,
        productId: product.id,
        lotNumber: resolvedLot,
        serialNumber: null,
        sourceEntity,
        sourceId,
        status: "available",
        receivedAt: new Date(),
      },
    });
  }

  private async recordPrismaTraceMovement(
    tx: Prisma.TransactionClient,
    tenantId: string,
    product: { id: string; sku: string },
    movementType: TraceMovement["movementType"],
    sourceEntity: string,
    sourceId: string,
    quantity: number,
    direction: TraceMovement["direction"],
    traceRecord?: {
      id: string;
      lotNumber: string;
      serialNumber: string | null;
    },
  ) {
    const trace =
      traceRecord ??
      (await tx.traceRecord.findFirst({
        where: { tenantId, productId: product.id, status: "available" },
        orderBy: { receivedAt: "asc" },
      })) ??
      (await this.ensurePrismaTraceRecord(
        tx,
        tenantId,
        product,
        "OpeningBalance",
        `opening_${product.id}`,
        `LOT-${product.sku}-OPENING`,
      ));
    await tx.traceMovement.upsert({
      where: {
        tenantId_traceRecordId_movementType_sourceEntity_sourceId: {
          tenantId,
          traceRecordId: trace.id,
          movementType,
          sourceEntity,
          sourceId,
        },
      },
      create: {
        tenantId,
        traceRecordId: trace.id,
        productId: product.id,
        movementType,
        sourceEntity,
        sourceId,
        quantity,
        direction,
        occurredAt: new Date(),
      },
      update: { quantity, direction },
    });
  }

  private async ensureAccountingInfrastructure(tenantId: string) {
    const accounts = [
      { code: "1000", name: "Cash", type: "asset", normalBalance: "debit" },
      {
        code: "1100",
        name: "Accounts Receivable",
        type: "asset",
        normalBalance: "debit",
      },
      {
        code: "1200",
        name: "Inventory",
        type: "asset",
        normalBalance: "debit",
      },
      {
        code: "1150",
        name: "Employee Advances",
        type: "asset",
        normalBalance: "debit",
      },
      {
        code: "1300",
        name: "Fixed Assets",
        type: "asset",
        normalBalance: "debit",
      },
      {
        code: "1310",
        name: "Accumulated Depreciation",
        type: "asset",
        normalBalance: "credit",
      },
      {
        code: "2000",
        name: "Accounts Payable",
        type: "liability",
        normalBalance: "credit",
      },
      {
        code: "2100",
        name: "Sales Tax Payable",
        type: "liability",
        normalBalance: "credit",
      },
      {
        code: "2200",
        name: "Payroll Payable",
        type: "liability",
        normalBalance: "credit",
      },
      {
        code: "4000",
        name: "Sales Revenue",
        type: "revenue",
        normalBalance: "credit",
      },
      {
        code: "5000",
        name: "Landed Cost",
        type: "expense",
        normalBalance: "debit",
      },
      {
        code: "5100",
        name: "Depreciation Expense",
        type: "expense",
        normalBalance: "debit",
      },
      {
        code: "5200",
        name: "Payroll Expense",
        type: "expense",
        normalBalance: "debit",
      },
      {
        code: "5300",
        name: "Employee Expense",
        type: "expense",
        normalBalance: "debit",
      },
    ] as const;
    await this.prisma.$transaction(async (tx) => {
      for (const account of accounts) {
        await tx.account.upsert({
          where: { tenantId_code: { tenantId, code: account.code } },
          update: {
            name: account.name,
            type: account.type,
            normalBalance: account.normalBalance,
            active: true,
          },
          create: {
            tenantId,
            code: account.code,
            name: account.name,
            type: account.type,
            normalBalance: account.normalBalance,
            active: true,
          },
        });
      }
      await tx.bankAccount.upsert({
        where: { tenantId_code: { tenantId, code: "OPERATING" } },
        update: { name: "Operating Bank", currency: "USD" },
        create: {
          tenantId,
          code: "OPERATING",
          name: "Operating Bank",
          currency: "USD",
          openingBalance: 0,
        },
      });
      await tx.exchangeRate.upsert({
        where: {
          tenantId_baseCurrency_quoteCurrency_effectiveDate: {
            tenantId,
            baseCurrency: "USD",
            quoteCurrency: "PHP",
            effectiveDate: new Date("2026-07-01T00:00:00.000Z"),
          },
        },
        update: { rate: 58 },
        create: {
          tenantId,
          baseCurrency: "USD",
          quoteCurrency: "PHP",
          rate: 58,
          effectiveDate: new Date("2026-07-01T00:00:00.000Z"),
        },
      });
    });
  }

  private async ensureHrInfrastructure(tenantId: string) {
    await this.ensureAccountingInfrastructure(tenantId);
    await this.prisma.$transaction(async (tx) => {
      for (const department of demoHrData.departments) {
        await tx.department.upsert({
          where: { tenantId_code: { tenantId, code: department.code } },
          update: {
            name: department.name,
            manager: department.manager,
            active: department.active,
          },
          create: {
            id: department.id,
            tenantId,
            code: department.code,
            name: department.name,
            manager: department.manager,
            active: department.active,
          },
        });
      }
      for (const shift of demoHrData.workShifts) {
        await tx.workShift.upsert({
          where: { tenantId_code: { tenantId, code: shift.code } },
          update: {
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            expectedHours: shift.expectedHours,
          },
          create: {
            id: shift.id,
            tenantId,
            code: shift.code,
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            expectedHours: shift.expectedHours,
          },
        });
      }
      for (const structure of demoHrData.salaryStructures) {
        const employee = await tx.employeeRecord.findFirst({
          where: { tenantId, id: structure.employeeId },
        });
        if (!employee) {
          continue;
        }
        await tx.salaryStructure.upsert({
          where: {
            tenantId_employeeId_name: {
              tenantId,
              employeeId: employee.id,
              name: structure.name,
            },
          },
          update: {
            basePay: structure.basePay.amount,
            currency: structure.basePay.currency,
            earnings: structure.earnings,
            deductions: structure.deductions,
            active: structure.active,
          },
          create: {
            id: structure.id,
            tenantId,
            employeeId: employee.id,
            name: structure.name,
            basePay: structure.basePay.amount,
            currency: structure.basePay.currency,
            earnings: structure.earnings,
            deductions: structure.deductions,
            active: structure.active,
          },
        });
      }
    });
  }

  private async postPrismaPeriodCloseJournal(
    tenantId: string,
    fiscalPeriodId: string,
    fiscalPeriodName: string,
    closedAt: string,
  ) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: {
        tenantId,
        sourceEntity: "PeriodClose",
        sourceId: fiscalPeriodId,
      },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.journalEntry.count({ where: { tenantId } });
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "PeriodClose",
          sourceId: fiscalPeriodId,
          memo: `Fiscal period ${fiscalPeriodName} closed on ${dateOnly(new Date(closedAt))}.`,
          status: "posted",
          postedAt: new Date(closedAt),
        },
        select: { id: true },
      });
    });
  }

  private async postPrismaLandedCostJournalTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    allocationId: string,
    receiptNumber: string,
    amount: Money,
  ) {
    const [inventory, landedCost, count] = await Promise.all([
      tx.account.findFirstOrThrow({ where: { tenantId, code: "1200" } }),
      tx.account.findFirstOrThrow({ where: { tenantId, code: "5000" } }),
      tx.journalEntry.count({ where: { tenantId } }),
    ]);
    return tx.journalEntry.create({
      data: {
        tenantId,
        number: nextDocumentNumber("JE", count),
        sourceEntity: "LandedCostAllocation",
        sourceId: allocationId,
        memo: `Landed cost allocated to ${receiptNumber}.`,
        status: "posted",
        postedAt: new Date(),
        lines: {
          create: [
            {
              accountId: inventory.id,
              description: `Inventory landed cost for ${receiptNumber}`,
              debit: amount.amount,
              credit: 0,
            },
            {
              accountId: landedCost.id,
              description: `Landed cost absorbed for ${receiptNumber}`,
              debit: 0,
              credit: amount.amount,
            },
          ],
        },
      },
      select: { id: true },
    });
  }

  private async postPrismaAssetAcquisitionJournal(
    tenantId: string,
    assetId: string,
    assetTag: string,
    cost: Money,
  ) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { tenantId, sourceEntity: "FixedAsset", sourceId: assetId },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.$transaction(async (tx) => {
      const [fixedAssets, cash, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1300" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1000" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "FixedAsset",
          sourceId: assetId,
          memo: `Fixed asset ${assetTag} capitalized.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: fixedAssets.id,
                description: `Capitalized asset ${assetTag}`,
                debit: cost.amount,
                credit: 0,
              },
              {
                accountId: cash.id,
                description: `Cash purchase for ${assetTag}`,
                debit: 0,
                credit: cost.amount,
              },
            ],
          },
        },
        select: { id: true },
      });
    });
  }

  private async postPrismaDepreciationJournal(
    tenantId: string,
    assetId: string,
    assetTag: string,
    amount: Money,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [expense, accumulated, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "5100" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1310" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "DepreciationRun",
          sourceId: `${assetId}:${Date.now()}`,
          memo: `Depreciation posted for ${assetTag}.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: expense.id,
                description: `Depreciation expense for ${assetTag}`,
                debit: amount.amount,
                credit: 0,
              },
              {
                accountId: accumulated.id,
                description: `Accumulated depreciation for ${assetTag}`,
                debit: 0,
                credit: amount.amount,
              },
            ],
          },
        },
        select: { id: true },
      });
    });
  }

  private async postPrismaPurchaseInvoiceJournal(
    tenantId: string,
    invoiceId: string,
    invoiceNumber: string,
    total: Money,
  ) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { tenantId, sourceEntity: "PurchaseInvoice", sourceId: invoiceId },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.$transaction(async (tx) => {
      const [inventory, payables, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1200" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "2000" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "PurchaseInvoice",
          sourceId: invoiceId,
          memo: `Purchase invoice ${invoiceNumber} posted.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: inventory.id,
                description: `Inventory for ${invoiceNumber}`,
                debit: total.amount,
                credit: 0,
              },
              {
                accountId: payables.id,
                description: `Payable for ${invoiceNumber}`,
                debit: 0,
                credit: total.amount,
              },
            ],
          },
        },
      });
    });
  }

  private async postPrismaSupplierPaymentJournal(
    tenantId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: Money,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [payables, cash, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "2000" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1000" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "SupplierPayment",
          sourceId: `supplier-payment:${invoiceId}:${Date.now()}`,
          memo: `Supplier payment for ${invoiceNumber} recorded.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: payables.id,
                description: `Payable cleared for ${invoiceNumber}`,
                debit: amount.amount,
                credit: 0,
              },
              {
                accountId: cash.id,
                description: `Cash paid for ${invoiceNumber}`,
                debit: 0,
                credit: amount.amount,
              },
            ],
          },
        },
      });
    });
  }

  private async postPrismaInvoiceJournal(
    tenantId: string,
    invoiceId: string,
    invoiceNumber: string,
    total: Money,
  ) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { tenantId, sourceEntity: "Invoice", sourceId: invoiceId },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.$transaction(async (tx) => {
      const [receivables, revenue, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1100" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "4000" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "Invoice",
          sourceId: invoiceId,
          memo: `Invoice ${invoiceNumber} posted.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: receivables.id,
                description: `Receivable for ${invoiceNumber}`,
                debit: total.amount,
                credit: 0,
              },
              {
                accountId: revenue.id,
                description: `Revenue for ${invoiceNumber}`,
                debit: 0,
                credit: total.amount,
              },
            ],
          },
        },
      });
    });
  }

  private async postPrismaPaymentJournal(
    tenantId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: Money,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [cash, receivables, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1000" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1100" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "Payment",
          sourceId: `payment:${invoiceId}:${Date.now()}`,
          memo: `Payment for ${invoiceNumber} recorded.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: cash.id,
                description: `Cash receipt for ${invoiceNumber}`,
                debit: amount.amount,
                credit: 0,
              },
              {
                accountId: receivables.id,
                description: `Receivable cleared for ${invoiceNumber}`,
                debit: 0,
                credit: amount.amount,
              },
            ],
          },
        },
      });
    });
  }

  private async postPrismaExpenseClaimJournal(
    tenantId: string,
    claimId: string,
    claimNumber: string,
    amount: Money,
  ) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { tenantId, sourceEntity: "ExpenseClaim", sourceId: claimId },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.$transaction(async (tx) => {
      const [expense, cash, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "5300" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1000" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "ExpenseClaim",
          sourceId: claimId,
          memo: `Expense claim ${claimNumber} paid.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: expense.id,
                description: `Employee expense ${claimNumber}`,
                debit: amount.amount,
                credit: 0,
              },
              {
                accountId: cash.id,
                description: `Expense reimbursement ${claimNumber}`,
                debit: 0,
                credit: amount.amount,
              },
            ],
          },
        },
        select: { id: true },
      });
    });
  }

  private async postPrismaEmployeeAdvanceJournal(
    tenantId: string,
    advanceId: string,
    advanceNumber: string,
    amount: Money,
  ) {
    const existing = await this.prisma.journalEntry.findFirst({
      where: { tenantId, sourceEntity: "EmployeeAdvance", sourceId: advanceId },
      select: { id: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.$transaction(async (tx) => {
      const [advances, cash, count] = await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1150" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "1000" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
      return tx.journalEntry.create({
        data: {
          tenantId,
          number: nextDocumentNumber("JE", count),
          sourceEntity: "EmployeeAdvance",
          sourceId: advanceId,
          memo: `Employee advance ${advanceNumber} paid.`,
          status: "posted",
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: advances.id,
                description: `Employee advance ${advanceNumber}`,
                debit: amount.amount,
                credit: 0,
              },
              {
                accountId: cash.id,
                description: `Cash paid for ${advanceNumber}`,
                debit: 0,
                credit: amount.amount,
              },
            ],
          },
        },
        select: { id: true },
      });
    });
  }

  private async postPrismaPayrollJournalTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    payrollRunId: string,
    payrollNumber: string,
    totals: { grossPay: Money; deductions: Money; netPay: Money },
  ) {
    const [payrollExpense, payrollPayable, taxPayable, count] =
      await Promise.all([
        tx.account.findFirstOrThrow({ where: { tenantId, code: "5200" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "2200" } }),
        tx.account.findFirstOrThrow({ where: { tenantId, code: "2100" } }),
        tx.journalEntry.count({ where: { tenantId } }),
      ]);
    return tx.journalEntry.create({
      data: {
        tenantId,
        number: nextDocumentNumber("JE", count),
        sourceEntity: "PayrollRun",
        sourceId: payrollRunId,
        memo: `Payroll run ${payrollNumber} posted.`,
        status: "posted",
        postedAt: new Date(),
        lines: {
          create: [
            {
              accountId: payrollExpense.id,
              description: `Gross payroll ${payrollNumber}`,
              debit: totals.grossPay.amount,
              credit: 0,
            },
            {
              accountId: payrollPayable.id,
              description: `Net payroll payable ${payrollNumber}`,
              debit: 0,
              credit: totals.netPay.amount,
            },
            {
              accountId: taxPayable.id,
              description: `Payroll deductions ${payrollNumber}`,
              debit: 0,
              credit: totals.deductions.amount,
            },
          ],
        },
      },
      select: { id: true },
    });
  }
}

function parseRecordStatus(value: string): Quote["status"] {
  if (
    ["draft", "submitted", "approved", "cancelled", "closed"].includes(value)
  ) {
    return value as Quote["status"];
  }
  throw new Error(`Invalid record status: ${value}`);
}

function mapApiKeyRecord(record: {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  active: boolean;
  createdAt: Date;
}): ApiKeyRecord {
  return {
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    scopes: record.scopes,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapWebhookSubscription(record: {
  id: string;
  url: string;
  eventTypes: string[];
  secretPrefix: string;
  active: boolean;
}): WebhookSubscription {
  return {
    id: record.id,
    url: record.url,
    eventTypes: record.eventTypes,
    secretPrefix: record.secretPrefix,
    active: record.active,
  };
}

function mapWebhookDelivery(record: {
  id: string;
  subscriptionId: string;
  eventType: string;
  status: string;
  attempts: number;
  nextAttemptAt: Date | null;
  deliveredAt: Date | null;
}): WebhookDelivery {
  return {
    id: record.id,
    subscriptionId: record.subscriptionId,
    eventType: record.eventType,
    status: parseWebhookDeliveryStatus(record.status),
    attempts: record.attempts,
    nextAttemptAt: record.nextAttemptAt?.toISOString() ?? null,
    deliveredAt: record.deliveredAt?.toISOString() ?? null,
  };
}

function mapDeadLetterRecord(record: {
  id: string;
  deliveryId: string | null;
  outboxEventId?: string | null;
  reason: string;
  createdAt: Date;
}): DeadLetterRecord {
  return {
    id: record.id,
    deliveryId: record.deliveryId,
    outboxEventId: record.outboxEventId ?? null,
    reason: record.reason,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapOutboxEvent(record: {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  payload: unknown;
  error: string | null;
  createdAt: Date;
  dispatchedAt: Date | null;
}): OutboxEvent {
  return {
    id: record.id,
    eventType: record.eventType,
    status: parseOutboxStatus(record.status),
    attempts: record.attempts,
    payload: asRecord(record.payload),
    error: record.error,
    createdAt: record.createdAt.toISOString(),
    dispatchedAt: record.dispatchedAt?.toISOString() ?? null,
  };
}

function mapWorkflowTaskRecord(record: {
  id: string;
  taskKey: string;
  workflowId: string;
  entity: string;
  documentId: string;
  action: string;
  title: string;
  status: string;
  assigneeRoles: unknown;
  escalatedRoles: unknown;
  notificationChannels?: unknown;
  dueStatus: string;
  dueAt?: Date | string | null;
  assignedNotifiedAt: Date | string | null;
  escalatedNotifiedAt: Date | string | null;
  completedNotifiedAt: Date | string | null;
  cancelledNotifiedAt: Date | string | null;
  closedAt: Date | string | null;
  operations?: Array<{
    id: string;
    workflowTaskId: string;
    operation: string;
    actorId: string;
    reason: string | null;
    details: unknown;
    createdAt: Date | string;
  }>;
  updatedAt: Date | string;
}): WorkflowTaskRecord {
  return {
    id: record.id,
    taskKey: record.taskKey,
    workflowId: record.workflowId,
    entity: record.entity,
    documentId: record.documentId,
    action: record.action,
    title: record.title,
    status: parseWorkflowTaskStatus(record.status),
    assigneeRoles: normalizeStringArray(record.assigneeRoles),
    escalatedRoles: normalizeStringArray(record.escalatedRoles),
    notificationChannels: normalizeStringArray(record.notificationChannels),
    dueStatus: parseWorkflowTaskDueStatus(record.dueStatus),
    dueAt: isoNullable(record.dueAt ?? null),
    assignedNotifiedAt: isoNullable(record.assignedNotifiedAt),
    escalatedNotifiedAt: isoNullable(record.escalatedNotifiedAt),
    completedNotifiedAt: isoNullable(record.completedNotifiedAt),
    cancelledNotifiedAt: isoNullable(record.cancelledNotifiedAt),
    closedAt: isoNullable(record.closedAt),
    operations: (record.operations ?? []).map(mapWorkflowTaskOperation),
    updatedAt:
      record.updatedAt instanceof Date
        ? record.updatedAt.toISOString()
        : record.updatedAt,
  };
}

function mapWorkflowTaskOperation(record: {
  id: string;
  workflowTaskId: string;
  operation: string;
  actorId: string;
  reason: string | null;
  details: unknown;
  createdAt: Date | string;
}): WorkflowTaskOperation {
  return {
    id: record.id,
    taskId: record.workflowTaskId,
    operation: parseWorkflowTaskOperation(record.operation),
    actorId: record.actorId,
    reason: record.reason,
    details: asRecord(record.details),
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : record.createdAt,
  };
}

function workflowTaskKey(task: WorkflowTask): string {
  return [
    task.workflowId,
    task.document.entity,
    task.document.id,
    task.action.to,
  ].join(":");
}

function workflowTaskPayload(task: WorkflowTask): Record<string, unknown> {
  return {
    taskId: task.id,
    taskKey: workflowTaskKey(task),
    workflowId: task.workflowId,
    document: task.document,
    action: task.action.to,
    title: task.title,
    currentState: task.currentState,
    assigneeRoles: task.assigneeRoles,
    escalatedRoles: task.escalatedRoles,
    notificationChannels: task.notificationChannels,
    dueAt: task.dueAt,
    dueStatus: task.dueStatus,
  };
}

function workflowTaskRecordPayload(
  task: WorkflowTaskRecord,
): Record<string, unknown> {
  return {
    taskId: task.id,
    taskKey: task.taskKey,
    workflowId: task.workflowId,
    document: { entity: task.entity, id: task.documentId },
    action: task.action,
    title: task.title,
    status: task.status,
    assigneeRoles: task.assigneeRoles,
    escalatedRoles: task.escalatedRoles,
    notificationChannels: task.notificationChannels,
    dueStatus: task.dueStatus,
    dueAt: task.dueAt ?? null,
  };
}

function workflowTaskNotificationTimestampUpdate(
  notification: RetryWorkflowTaskNotificationInput["notification"],
  timestamp: Date,
): Partial<
  Record<
    | "assignedNotifiedAt"
    | "cancelledNotifiedAt"
    | "completedNotifiedAt"
    | "escalatedNotifiedAt",
    Date
  >
> {
  if (notification === "assigned") {
    return { assignedNotifiedAt: timestamp };
  }
  if (notification === "escalated") {
    return { escalatedNotifiedAt: timestamp };
  }
  if (notification === "completed") {
    return { completedNotifiedAt: timestamp };
  }
  return { cancelledNotifiedAt: timestamp };
}

function workflowTaskRecordFromTask(
  task: WorkflowTask,
  id: string,
  now: string,
): WorkflowTaskRecord {
  return {
    id,
    taskKey: workflowTaskKey(task),
    workflowId: task.workflowId,
    entity: task.document.entity,
    documentId: task.document.id,
    action: task.action.to,
    title: task.title,
    status: "open",
    assigneeRoles: task.assigneeRoles,
    escalatedRoles: task.escalatedRoles,
    notificationChannels: task.notificationChannels,
    dueStatus: task.dueStatus,
    dueAt: task.dueAt ?? null,
    assignedNotifiedAt: null,
    escalatedNotifiedAt: null,
    completedNotifiedAt: null,
    cancelledNotifiedAt: null,
    closedAt: null,
    operations: [],
    updatedAt: now,
  };
}

function mapIntegrationMapping(record: {
  id: string;
  name: string;
  sourceType: string;
  targetType: string;
  fields: unknown;
  active: boolean;
}): IntegrationMapping {
  return {
    id: record.id,
    name: record.name,
    sourceType: record.sourceType,
    targetType: record.targetType,
    fields: normalizeIntegrationFields(record.fields),
    active: record.active,
  };
}

function mapConnector(record: {
  id: string;
  name: string;
  connectorType: string;
  status: string;
}): Connector {
  return {
    id: record.id,
    name: record.name,
    connectorType: parseConnectorType(record.connectorType),
    status: parseConnectorStatus(record.status),
  };
}

function mapTraceRecord(record: {
  id: string;
  productId: string;
  product: { sku: string; name: string };
  lotNumber: string;
  serialNumber: string | null;
  sourceEntity: string;
  sourceId: string;
  status: string;
  receivedAt: Date;
}): TraceRecord {
  return {
    id: record.id,
    productId: record.productId,
    sku: record.product.sku,
    productName: record.product.name,
    lotNumber: record.lotNumber,
    serialNumber: record.serialNumber,
    sourceEntity: record.sourceEntity,
    sourceId: record.sourceId,
    status: parseTraceStatus(record.status),
    receivedAt: record.receivedAt.toISOString(),
  };
}

function mapJobCard(record: {
  id: string;
  workOrderId: string;
  workOrder: { number: string };
  operationSequence: number;
  operationName: string;
  workCenterId: string;
  workCenter: { code: string };
  status: string;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: Date | null;
  completedAt: Date | null;
  operator: string | null;
}): JobCard {
  return {
    id: record.id,
    workOrderId: record.workOrderId,
    workOrderNumber: record.workOrder.number,
    operationSequence: record.operationSequence,
    operationName: record.operationName,
    workCenterId: record.workCenterId,
    workCenterCode: record.workCenter.code,
    status: parseJobCardStatus(record.status),
    plannedMinutes: record.plannedMinutes,
    actualMinutes: record.actualMinutes,
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    operator: record.operator,
  };
}

function mapDowntimeEntry(record: {
  id: string;
  workCenterId: string;
  workCenter: { code: string };
  jobCardId: string | null;
  reason: string;
  minutes: number;
  startedAt: Date;
  endedAt: Date;
}): DowntimeEntry {
  return {
    id: record.id,
    workCenterId: record.workCenterId,
    workCenterCode: record.workCenter.code,
    jobCardId: record.jobCardId,
    reason: record.reason,
    minutes: record.minutes,
    startedAt: record.startedAt.toISOString(),
    endedAt: record.endedAt.toISOString(),
  };
}

function buildCapacitySchedule(
  workCenters: Array<{
    id: string;
    code: string;
    name: string;
    capacityPerDay: number;
  }>,
  jobCards: Array<{
    workCenterId: string;
    status: string;
    plannedMinutes: number;
  }>,
  downtimeEntries: Array<{ workCenterId: string; minutes: number }>,
): ManufacturingSnapshot["capacitySchedule"] {
  return workCenters.map((center) => {
    const scheduledMinutes = jobCards
      .filter(
        (card) =>
          card.workCenterId === center.id && card.status !== "completed",
      )
      .reduce((sum, card) => sum + card.plannedMinutes, 0);
    const downtimeMinutes = downtimeEntries
      .filter((entry) => entry.workCenterId === center.id)
      .reduce((sum, entry) => sum + entry.minutes, 0);
    const capacityMinutes = center.capacityPerDay * 60;
    return {
      workCenterId: center.id,
      workCenterCode: center.code,
      workCenterName: center.name,
      scheduledMinutes,
      capacityMinutes,
      downtimeMinutes,
      loadPercent:
        capacityMinutes > 0
          ? Math.round((scheduledMinutes / capacityMinutes) * 100)
          : 0,
    };
  });
}

function mapTraceMovement(record: {
  id: string;
  traceRecordId: string;
  traceRecord: { lotNumber: string; serialNumber: string | null };
  productId: string;
  product: { sku: string; name: string };
  movementType: string;
  sourceEntity: string;
  sourceId: string;
  quantity: number;
  direction: string;
  occurredAt: Date;
}): TraceMovement {
  return {
    id: record.id,
    traceRecordId: record.traceRecordId,
    lotNumber: record.traceRecord.lotNumber,
    serialNumber: record.traceRecord.serialNumber,
    productId: record.productId,
    sku: record.product.sku,
    productName: record.product.name,
    movementType: parseTraceMovementType(record.movementType),
    sourceEntity: record.sourceEntity,
    sourceId: record.sourceId,
    quantity: record.quantity,
    direction: parseTraceDirection(record.direction),
    occurredAt: record.occurredAt.toISOString(),
  };
}

function mapQualityInspection(record: {
  id: string;
  templateId: string;
  template: { name: string };
  traceRecordId: string;
  traceRecord: { lotNumber: string };
  status: string;
  inspectedBy: string;
  inspectedAt: Date;
  results: unknown;
}): QualityInspection {
  return {
    id: record.id,
    templateId: record.templateId,
    templateName: record.template.name,
    traceRecordId: record.traceRecordId,
    lotNumber: record.traceRecord.lotNumber,
    status: parseInspectionStatus(record.status),
    inspectedBy: record.inspectedBy,
    inspectedAt: record.inspectedAt.toISOString(),
    results: normalizeInspectionResults(record.results),
  };
}

function mapNonConformance(record: {
  id: string;
  inspectionId: string;
  traceRecordId: string;
  traceRecord: { lotNumber: string };
  severity: string;
  status: string;
  description: string;
}): NonConformance {
  return {
    id: record.id,
    inspectionId: record.inspectionId,
    traceRecordId: record.traceRecordId,
    lotNumber: record.traceRecord.lotNumber,
    severity: parseSeverity(record.severity),
    status: parseNonConformanceStatus(record.status),
    description: record.description,
  };
}

function mapRecall(record: {
  id: string;
  lotNumber: string;
  status: string;
  reason: string;
  affectedTraceIds: string[];
  openedAt: Date;
}): Recall {
  return {
    id: record.id,
    lotNumber: record.lotNumber,
    status: parseRecallStatus(record.status),
    reason: record.reason,
    affectedTraceIds: record.affectedTraceIds,
    openedAt: record.openedAt.toISOString(),
  };
}

function mapPickList(record: {
  id: string;
  salesOrderId: string;
  salesOrder: { number: string };
  status: string;
  createdAt: Date;
}): PickList {
  return {
    id: record.id,
    salesOrderId: record.salesOrderId,
    salesOrderNumber: record.salesOrder.number,
    status: parsePickListStatus(record.status),
    createdAt: record.createdAt.toISOString(),
  };
}

function mapPickTask(record: {
  id: string;
  pickListId: string;
  productId: string;
  product: { sku: string; name: string };
  bin: { code: string };
  quantity: number;
  pickedQuantity: number;
  status: string;
}): PickTask {
  return {
    id: record.id,
    pickListId: record.pickListId,
    productId: record.productId,
    sku: record.product.sku,
    productName: record.product.name,
    binCode: record.bin.code,
    quantity: record.quantity,
    pickedQuantity: record.pickedQuantity,
    status: parsePickTaskStatus(record.status),
  };
}

function mapPackRecord(record: {
  id: string;
  pickListId: string;
  packageCode: string;
  status: string;
  packedAt: Date;
}): PackRecord {
  return {
    id: record.id,
    pickListId: record.pickListId,
    packageCode: record.packageCode,
    status: parsePackStatus(record.status),
    packedAt: record.packedAt.toISOString(),
  };
}

function mapShipment(record: {
  id: string;
  packRecordId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  shippedAt: Date;
}): Shipment {
  return {
    id: record.id,
    packRecordId: record.packRecordId,
    carrier: record.carrier,
    trackingNumber: record.trackingNumber,
    status: "shipped",
    shippedAt: record.shippedAt.toISOString(),
  };
}

function mapPutAwayTask(record: {
  id: string;
  purchaseReceiptId: string;
  purchaseReceipt: { number: string };
  productId: string;
  product: { sku: string; name: string };
  fromBin: { code: string };
  toBin: { code: string };
  quantity: number;
  status: string;
}): PutAwayTask {
  return {
    id: record.id,
    purchaseReceiptId: record.purchaseReceiptId,
    receiptNumber: record.purchaseReceipt.number,
    productId: record.productId,
    sku: record.product.sku,
    productName: record.product.name,
    fromBinCode: record.fromBin.code,
    toBinCode: record.toBin.code,
    quantity: record.quantity,
    status: record.status === "completed" ? "completed" : "open",
  };
}

function mapBarcodeScan(record: {
  id: string;
  scanType: string;
  barcode: string;
  entity: string;
  entityId: string;
  scannedAt: Date;
}): BarcodeScan {
  return {
    id: record.id,
    scanType: parseBarcodeScanType(record.scanType),
    barcode: record.barcode,
    entity: record.entity,
    entityId: record.entityId,
    scannedAt: record.scannedAt.toISOString(),
  };
}

function parseWebhookDeliveryStatus(value: string): WebhookDelivery["status"] {
  if (["pending", "delivered", "failed", "dead_letter"].includes(value)) {
    return value as WebhookDelivery["status"];
  }
  return "pending";
}

function parseOutboxStatus(value: string): OutboxEvent["status"] {
  if (["pending", "dispatched", "failed", "dead_letter"].includes(value)) {
    return value as OutboxEvent["status"];
  }
  return "pending";
}

function parseWorkflowTaskStatus(value: string): WorkflowTaskRecord["status"] {
  if (["cancelled", "completed", "open", "superseded"].includes(value)) {
    return value as WorkflowTaskRecord["status"];
  }
  return "open";
}

function parseWorkflowTaskOperation(
  value: string,
): WorkflowTaskOperation["operation"] {
  if (["reassigned", "retried", "snoozed"].includes(value)) {
    return value as WorkflowTaskOperation["operation"];
  }
  return "retried";
}

function parseWorkflowTaskDueStatus(
  value: string,
): WorkflowTaskRecord["dueStatus"] {
  if (["due_soon", "open", "overdue"].includes(value)) {
    return value as WorkflowTaskRecord["dueStatus"];
  }
  return "open";
}

function parseConnectorType(value: string): Connector["connectorType"] {
  if (["edi", "ecommerce", "marketplace", "custom"].includes(value)) {
    return value as Connector["connectorType"];
  }
  return "custom";
}

function parseConnectorStatus(value: string): Connector["status"] {
  if (["available", "enabled", "disabled"].includes(value)) {
    return value as Connector["status"];
  }
  return "available";
}

function parsePickListStatus(value: string): PickList["status"] {
  if (["open", "picking", "picked", "packed", "shipped"].includes(value)) {
    return value as PickList["status"];
  }
  return "open";
}

function parsePickTaskStatus(value: string): PickTask["status"] {
  if (["open", "picked", "short"].includes(value)) {
    return value as PickTask["status"];
  }
  return "open";
}

function parsePackStatus(value: string): PackRecord["status"] {
  if (value === "shipped") {
    return "shipped";
  }
  return "packed";
}

function parseBarcodeScanType(value: string): BarcodeScan["scanType"] {
  if (
    ["count", "move", "pack", "pick", "putaway", "receive", "ship"].includes(
      value,
    )
  ) {
    return value as BarcodeScan["scanType"];
  }
  return "pick";
}

function mapLead(record: {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  source: string;
  stage: string;
  owner: string;
}): Lead {
  return {
    id: record.id,
    companyName: record.companyName,
    contactName: record.contactName,
    email: record.email,
    source: record.source,
    stage: parseLeadStage(record.stage),
    owner: record.owner,
  };
}

function mapProject(record: {
  id: string;
  code: string;
  name: string;
  customerName: string;
  status: string;
  budget: unknown;
  currency: string;
  startDate: Date;
  endDate: Date;
}): Project {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    customerName: record.customerName,
    status: parseProjectStatus(record.status),
    budget: money(record.budget, record.currency),
    startDate: dateOnly(record.startDate),
    endDate: dateOnly(record.endDate),
  };
}

function mapProjectTask(record: {
  id: string;
  projectId: string;
  title: string;
  owner: string;
  status: string;
  dueDate: Date;
}): OperationsSnapshot["tasks"][number] {
  return {
    id: record.id,
    projectId: record.projectId,
    title: record.title,
    owner: record.owner,
    status: parseProjectTaskStatus(record.status),
    dueDate: dateOnly(record.dueDate),
  };
}

function mapEmployee(record: {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  role: string;
  status: string;
}): Employee {
  return {
    id: record.id,
    employeeNumber: record.employeeNumber,
    name: record.name,
    department: record.department,
    role: record.role,
    status: record.status === "inactive" ? "inactive" : "active",
  };
}

function mapLeaveRequest(
  record: {
    id: string;
    employeeId: string;
    leaveType: string;
    status: string;
    startDate: Date;
    endDate: Date;
  },
  employeeName: string,
): LeaveRequest {
  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName,
    leaveType: parseLeaveType(record.leaveType),
    status: parseLeaveStatus(record.status),
    startDate: dateOnly(record.startDate),
    endDate: dateOnly(record.endDate),
  };
}

function mapPrismaExpenseClaim(
  record: {
    id: string;
    employeeId: string;
    number: string;
    status: string;
    category: string;
    description: string;
    amount: unknown;
    currency: string;
    submittedAt: Date;
    approvedAt: Date | null;
    paidAt: Date | null;
    journalEntryId: string | null;
  },
  employeeName: string,
): ExpenseClaim {
  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName,
    number: record.number,
    status: parseExpenseClaimStatus(record.status),
    category: record.category,
    description: record.description,
    amount: money(record.amount, record.currency),
    submittedAt: record.submittedAt.toISOString(),
    approvedAt: record.approvedAt?.toISOString() ?? null,
    paidAt: record.paidAt?.toISOString() ?? null,
    journalEntryId: record.journalEntryId,
  };
}

function mapPrismaEmployeeAdvance(
  record: {
    id: string;
    employeeId: string;
    number: string;
    status: string;
    amount: unknown;
    currency: string;
    requestedAt: Date;
    paidAt: Date | null;
    paymentReference: string | null;
    journalEntryId: string | null;
  },
  employeeName: string,
): EmployeeAdvance {
  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName,
    number: record.number,
    status: record.status === "paid" ? "paid" : "requested",
    amount: money(record.amount, record.currency),
    requestedAt: record.requestedAt.toISOString(),
    paidAt: record.paidAt?.toISOString() ?? null,
    paymentReference: record.paymentReference,
    journalEntryId: record.journalEntryId,
  };
}

function mapPrismaPayrollRun(record: {
  id: string;
  number: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  grossPay: unknown;
  deductions: unknown;
  netPay: unknown;
  currency: string;
  postedAt: Date | null;
  journalEntryId: string | null;
}): PayrollRun {
  return {
    id: record.id,
    number: record.number,
    periodStart: dateOnly(record.periodStart),
    periodEnd: dateOnly(record.periodEnd),
    status: record.status === "draft" ? "draft" : "posted",
    grossPay: money(record.grossPay, record.currency),
    deductions: money(record.deductions, record.currency),
    netPay: money(record.netPay, record.currency),
    postedAt: record.postedAt?.toISOString() ?? null,
    journalEntryId: record.journalEntryId,
  };
}

function mapServiceCase(record: {
  id: string;
  caseNumber: string;
  customerName: string;
  subject: string;
  priority: string;
  status: string;
  owner: string;
}): ServiceCase {
  return {
    id: record.id,
    caseNumber: record.caseNumber,
    customerName: record.customerName,
    subject: record.subject,
    priority: parseServicePriority(record.priority),
    status: parseServiceStatus(record.status),
    owner: record.owner,
  };
}

function parseLeadStage(value: string): Lead["stage"] {
  if (["new", "qualified", "disqualified"].includes(value)) {
    return value as Lead["stage"];
  }
  return "new";
}

function parseOpportunityStage(
  value: string,
): OperationsSnapshot["opportunities"][number]["stage"] {
  if (["discovery", "proposal", "won", "lost"].includes(value)) {
    return value as OperationsSnapshot["opportunities"][number]["stage"];
  }
  return "discovery";
}

function parseProjectStatus(value: string): Project["status"] {
  if (["planned", "active", "completed", "on_hold"].includes(value)) {
    return value as Project["status"];
  }
  return "planned";
}

function parseProjectTaskStatus(
  value: string,
): OperationsSnapshot["tasks"][number]["status"] {
  if (["todo", "doing", "done"].includes(value)) {
    return value as OperationsSnapshot["tasks"][number]["status"];
  }
  return "todo";
}

function workflowKey(
  tenantId: string,
  input: WorkflowInstanceLookupInput,
): string {
  return [
    tenantId,
    input.workflowId,
    input.document.entity,
    input.document.id,
  ].join(":");
}

function mapWorkflowInstance(
  record: PrismaWorkflowInstanceRecord,
): WorkflowInstance {
  return {
    id: record.id,
    workflowId: record.workflowId,
    document: {
      entity: record.entity,
      id: record.documentId,
    },
    state: record.state,
    startedAt: record.startedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    transitions: record.transitions.map((transition) => ({
      id: transition.id,
      workflowId: transition.workflowId,
      document: {
        entity: transition.entity,
        id: transition.documentId,
      },
      actorId: transition.actorId,
      from: transition.fromState,
      to: transition.toState,
      reason: transition.reason,
      comment: transition.reason,
      occurredAt: transition.occurredAt.toISOString(),
    })),
  };
}

function parseLeaveType(value: string): LeaveRequest["leaveType"] {
  if (["vacation", "sick", "personal"].includes(value)) {
    return value as LeaveRequest["leaveType"];
  }
  return "personal";
}

function parseLeaveStatus(value: string): LeaveRequest["status"] {
  if (["requested", "approved", "rejected"].includes(value)) {
    return value as LeaveRequest["status"];
  }
  return "requested";
}

function parseAttendanceStatus(value: string): AttendanceRecord["status"] {
  if (["absent", "late", "present"].includes(value)) {
    return value as AttendanceRecord["status"];
  }
  return "present";
}

function parseExpenseClaimStatus(value: string): ExpenseClaim["status"] {
  if (["approved", "paid", "rejected", "submitted"].includes(value)) {
    return value as ExpenseClaim["status"];
  }
  return "submitted";
}

function parseServicePriority(value: string): ServiceCase["priority"] {
  if (["low", "medium", "high", "critical"].includes(value)) {
    return value as ServiceCase["priority"];
  }
  return "medium";
}

function parseServiceStatus(value: string): ServiceCase["status"] {
  if (["open", "in_progress", "resolved", "closed"].includes(value)) {
    return value as ServiceCase["status"];
  }
  return "open";
}

function parseInvoiceStatus(value: string): Invoice["status"] {
  if (["draft", "posted", "paid", "void"].includes(value)) {
    return value as Invoice["status"];
  }
  throw new Error(`Invalid invoice status: ${value}`);
}

function parsePurchaseInvoiceStatus(value: string): PurchaseInvoice["status"] {
  if (["draft", "posted", "paid", "void"].includes(value)) {
    return value as PurchaseInvoice["status"];
  }
  return "draft";
}

function parseWorkOrderStatus(value: string): WorkOrder["status"] {
  if (
    ["draft", "released", "in_process", "completed", "cancelled"].includes(
      value,
    )
  ) {
    return value as WorkOrder["status"];
  }
  return "draft";
}

function parseJobCardStatus(value: string): JobCard["status"] {
  if (["open", "in_process", "completed"].includes(value)) {
    return value as JobCard["status"];
  }
  return "open";
}

function parseMrpSuggestionStatus(value: string): MrpSuggestion["status"] {
  if (["open", "accepted", "cancelled"].includes(value)) {
    return value as MrpSuggestion["status"];
  }
  return "open";
}

function parseTraceStatus(
  value: string,
): QualitySnapshot["traceRecords"][number]["status"] {
  if (["available", "quarantined", "consumed", "recalled"].includes(value)) {
    return value as QualitySnapshot["traceRecords"][number]["status"];
  }
  return "available";
}

function parseTraceMovementType(value: string): TraceMovement["movementType"] {
  if (
    [
      "inspection",
      "putaway",
      "recall",
      "receipt",
      "shipment",
      "transfer_in",
      "transfer_out",
      "work_order_issue",
      "work_order_receipt",
    ].includes(value)
  ) {
    return value as TraceMovement["movementType"];
  }
  return "receipt";
}

function parseTraceDirection(value: string): TraceMovement["direction"] {
  if (["in", "out", "reference", "transform"].includes(value)) {
    return value as TraceMovement["direction"];
  }
  return "reference";
}

function parseInspectionEntityType(
  value: string,
): QualitySnapshot["inspectionTemplates"][number]["entityType"] {
  if (["PurchaseReceipt", "WorkOrder", "StockTransfer"].includes(value)) {
    return value as QualitySnapshot["inspectionTemplates"][number]["entityType"];
  }
  return "PurchaseReceipt";
}

function parseInspectionStatus(value: string): QualityInspection["status"] {
  if (["draft", "passed", "failed"].includes(value)) {
    return value as QualityInspection["status"];
  }
  return "draft";
}

function parseSeverity(value: string): NonConformance["severity"] {
  if (["low", "medium", "high", "critical"].includes(value)) {
    return value as NonConformance["severity"];
  }
  return "medium";
}

function parseNonConformanceStatus(value: string): NonConformance["status"] {
  if (["open", "contained", "closed"].includes(value)) {
    return value as NonConformance["status"];
  }
  return "open";
}

function parseRecallStatus(value: string): Recall["status"] {
  if (["draft", "active", "closed"].includes(value)) {
    return value as Recall["status"];
  }
  return "draft";
}

function parseChannelType(
  value: string,
): CommerceSnapshot["channels"][number]["channelType"] {
  if (["b2b", "ecommerce", "marketplace", "pos"].includes(value)) {
    return value as CommerceSnapshot["channels"][number]["channelType"];
  }
  return "ecommerce";
}

function parseTenderType(value: string): PosSale["tenderType"] {
  if (["bank_card", "cash", "digital_wallet"].includes(value)) {
    return value as PosSale["tenderType"];
  }
  return "cash";
}

function parseReportStatus(value: string): ReportRun["status"] {
  if (["queued", "completed", "failed"].includes(value)) {
    return value as ReportRun["status"];
  }
  return "queued";
}

function assertRecordTransition(
  entity: string,
  current: Quote["status"],
  next: Quote["status"],
): void {
  const allowed: Record<Quote["status"], Quote["status"][]> = {
    draft: ["draft", "submitted", "cancelled"],
    submitted: ["submitted", "approved", "cancelled"],
    approved: ["approved", "closed", "cancelled"],
    cancelled: ["cancelled"],
    closed: ["closed"],
  };
  if (!allowed[current].includes(next)) {
    throw new Error(`Invalid ${entity} transition: ${current} to ${next}`);
  }
}

function assertInvoiceTransition(
  current: Invoice["status"],
  next: Invoice["status"],
): void {
  const allowed: Record<Invoice["status"], Invoice["status"][]> = {
    draft: ["draft", "posted", "void"],
    posted: ["posted", "paid", "void"],
    paid: ["paid"],
    void: ["void"],
  };
  if (!allowed[current].includes(next)) {
    throw new Error(`Invalid Invoice transition: ${current} to ${next}`);
  }
}

function nextDocumentNumber(prefix: string, existingCount: number): string {
  return `${prefix}-${new Date().getUTCFullYear()}-${String(existingCount + 1).padStart(4, "0")}`;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function totalLines(lines: SalesDocumentLine[]): Money {
  const currency = lines[0]?.total.currency ?? "USD";
  return {
    amount: lines.reduce((sum, line) => sum + line.total.amount, 0),
    currency,
  };
}

function mapPurchaseOrder(
  order: {
    id: string;
    number: string;
    supplierId: string;
    status: PurchaseOrder["status"];
    expectedDate: Date;
    total: unknown;
    currency: string;
    lines: unknown;
  },
  supplierName: string,
): PurchaseOrder {
  return {
    id: order.id,
    number: order.number,
    supplierId: order.supplierId,
    supplierName,
    status: order.status,
    expectedDate: dateOnly(order.expectedDate),
    total: money(order.total, order.currency),
    lines: normalizeLines(order.lines),
  };
}

function mapWorkOrder(
  order: {
    id: string;
    number: string;
    productId: string;
    bomId: string;
    routingId: string | null;
    status: string;
    quantity: number;
    plannedStart: Date;
    plannedEnd: Date;
    materialCost: unknown;
    currency: string;
  },
  sku: string,
  productName: string,
): WorkOrder {
  return {
    id: order.id,
    number: order.number,
    productId: order.productId,
    sku,
    productName,
    bomId: order.bomId,
    routingId: order.routingId,
    status: parseWorkOrderStatus(order.status),
    quantity: order.quantity,
    plannedStart: dateOnly(order.plannedStart),
    plannedEnd: dateOnly(order.plannedEnd),
    materialCost: money(order.materialCost, order.currency),
  };
}

function normalizeBomItems(value: unknown): BillOfMaterial["items"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      productId: String(record.productId),
      sku: String(record.sku),
      description: String(record.description),
      quantity: Number(record.quantity),
    };
  });
}

function normalizeRoutingOperations(value: unknown): Routing["operations"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      sequence: Number(record.sequence),
      workCenterId: String(record.workCenterId),
      workCenterCode: String(record.workCenterCode),
      name: String(record.name),
      runMinutes: Number(record.runMinutes),
    };
  });
}

function normalizeProductionPlanLines(value: unknown): ProductionPlan["lines"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      productId: String(record.productId),
      sku: String(record.sku),
      productName: String(record.productName),
      demandQuantity: Number(record.demandQuantity),
      availableQuantity: Number(record.availableQuantity),
      plannedQuantity: Number(record.plannedQuantity),
    };
  });
}

function normalizeInspectionResults(
  value: unknown,
): QualityInspection["results"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      checkpoint: String(record.checkpoint),
      passed: Boolean(record.passed),
      note: String(record.note ?? ""),
    };
  });
}

function normalizeCompensationItems(
  value: unknown,
  defaultCurrency: string,
): Array<{ name: string; amount: Money }> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    const amountRecord = asRecord(record.amount);
    return {
      name: String(record.name ?? "Component"),
      amount: {
        amount: Number(amountRecord.amount ?? 0),
        currency: String(amountRecord.currency ?? defaultCurrency),
      },
    };
  });
}

function normalizeReportFilters(
  value: unknown,
): Record<string, string | number | boolean> {
  const record = asRecord(value);
  return Object.fromEntries(
    Object.entries(record).filter(
      (entry): entry is [string, string | number | boolean] =>
        ["string", "number", "boolean"].includes(typeof entry[1]),
    ),
  );
}

function normalizeReportParameters(value: unknown): SavedReport["parameters"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    const type = ["date", "number", "select", "text"].includes(
      String(record.type),
    )
      ? String(record.type)
      : "text";
    return {
      key: String(record.key),
      label: String(record.label ?? labelize(String(record.key))),
      type: type as SavedReport["parameters"][number]["type"],
      required: Boolean(record.required),
    };
  });
}

function normalizeReportSorts(value: unknown): SavedReport["sorts"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      field: String(record.field),
      direction: record.direction === "desc" ? "desc" : "asc",
    };
  });
}

function normalizeReportChart(value: unknown): SavedReport["chart"] {
  const record = asRecord(value);
  const type = ["bar", "line", "none"].includes(String(record.type))
    ? String(record.type)
    : "none";
  return {
    type: type as SavedReport["chart"]["type"],
    labelField:
      typeof record.labelField === "string" ? record.labelField : null,
    valueField:
      typeof record.valueField === "string" ? record.valueField : null,
  };
}

function normalizeReportRows(value: unknown): ReportRun["rows"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) =>
    Object.fromEntries(
      Object.entries(asRecord(item)).filter(
        (entry): entry is [string, string | number | boolean | null] =>
          entry[1] === null ||
          ["string", "number", "boolean"].includes(typeof entry[1]),
      ),
    ),
  );
}

function normalizePrintBlocks(value: unknown): PrintFormat["blocks"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item): PrintFormat["blocks"] => {
    const record = asRecord(item);
    const type = String(record.type);
    if (type === "barcode") {
      return [
        {
          type,
          field: String(record.field),
          label: String(record.label ?? labelize(String(record.field))),
        },
      ];
    }
    if (type === "field") {
      return [
        {
          type,
          field: String(record.field),
          label: String(record.label ?? labelize(String(record.field))),
        },
      ];
    }
    if (type === "heading") {
      return [{ type, text: String(record.text ?? "") }];
    }
    if (type === "signature") {
      return [{ type, label: String(record.label ?? "Signature") }];
    }
    if (type === "table") {
      return [
        {
          type,
          field: String(record.field),
          columns: normalizeStringArray(record.columns),
        },
      ];
    }
    if (type === "text") {
      return [{ type, text: String(record.text ?? "") }];
    }
    return [];
  });
}

function projectReportRows(
  rows: ReportRun["rows"],
  report: Pick<SavedReport, "columns" | "filters" | "sorts">,
): ReportRun["rows"] {
  const filtered = rows.filter((row) =>
    Object.entries(report.filters).every(
      ([key, value]) =>
        row[key] === value || String(row[key] ?? "") === String(value),
    ),
  );
  const [sort] = report.sorts;
  if (sort) {
    filtered.sort((a, b) => {
      const left = String(a[sort.field] ?? "");
      const right = String(b[sort.field] ?? "");
      return sort.direction === "desc"
        ? right.localeCompare(left)
        : left.localeCompare(right);
    });
  }
  return filtered.map(
    (row) =>
      Object.fromEntries(
        report.columns.map((column) => [column, row[column] ?? null]),
      ) as Record<string, string | number | boolean | null>,
  );
}

function renderPrintHtml(
  format: Pick<PrintFormat, "blocks" | "name">,
  record: Record<string, unknown>,
): string {
  const blocks =
    format.blocks.length > 0
      ? format.blocks
      : [{ type: "heading" as const, text: format.name }];
  return blocks
    .map((block) => {
      if (block.type === "heading") {
        return `<h1>${escapeHtml(block.text)}</h1>`;
      }
      if (block.type === "text") {
        return `<p>${escapeHtml(block.text)}</p>`;
      }
      if (block.type === "field") {
        return `<p><strong>${escapeHtml(block.label)}:</strong> ${escapeHtml(formatPrintValue(record[block.field]))}</p>`;
      }
      if (block.type === "barcode") {
        return `<p><strong>${escapeHtml(block.label)}:</strong> <code>${escapeHtml(formatPrintValue(record[block.field]))}</code></p>`;
      }
      if (block.type === "signature") {
        return `<p class="signature">${escapeHtml(block.label)} ____________________</p>`;
      }
      const rows = Array.isArray(record[block.field])
        ? (record[block.field] as Array<Record<string, unknown>>)
        : [];
      const header = `<tr>${block.columns.map((column) => `<th>${escapeHtml(labelize(column))}</th>`).join("")}</tr>`;
      const body = rows
        .map(
          (row) =>
            `<tr>${block.columns.map((column) => `<td>${escapeHtml(formatPrintValue(row[column]))}</td>`).join("")}</tr>`,
        )
        .join("");
      return `<table>${header}${body}</table>`;
    })
    .join("");
}

function formatPrintValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function labelize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeIntegrationFields(
  value: unknown,
): IntegrationMapping["fields"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      source: String(record.source),
      target: String(record.target),
    };
  });
}

function normalizeDashboardCards(
  value: unknown,
): ReportingSnapshot["dashboards"][number]["cards"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    const record = asRecord(item);
    return {
      label: String(record.label),
      source: String(record.source),
      metric: String(record.metric),
    };
  });
}

function normalizeLines(value: unknown): SalesDocumentLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const line = asRecord(item);
    const unitPrice = asMoney(line.unitPrice);
    const total = asMoney(line.total);
    return {
      productId: String(line.productId),
      sku: String(line.sku),
      description: String(line.description),
      quantity: Number(line.quantity),
      unitPrice,
      total,
    };
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asMoney(value: unknown): Money {
  const record = asRecord(value);
  return {
    amount: Number(record.amount),
    currency: String(record.currency ?? "USD"),
  };
}

function normalizeCustomFields(
  value: unknown,
): Record<string, CustomFieldValue> {
  const record = asRecord(value);
  return Object.fromEntries(
    Object.entries(record).filter(
      (entry): entry is [string, CustomFieldValue] =>
        isCustomFieldValue(entry[1]),
    ),
  );
}

function isCustomFieldValue(value: unknown): value is CustomFieldValue {
  return (
    value === null || ["boolean", "number", "string"].includes(typeof value)
  );
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeActionArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(asRecord);
}

function isoNullable(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
}

function mapWorkflowAssignmentRule(rule: {
  id: string;
  workflowId: string;
  fromState: string;
  toState: string;
  role: string;
  delegateRole: string | null;
  delegateStartsAt: Date | string | null;
  delegateEndsAt: Date | string | null;
  minAmount: unknown;
  maxAmount: unknown;
  active: boolean;
}): WorkflowAssignmentRule {
  return {
    id: rule.id,
    workflowId: rule.workflowId,
    fromState: rule.fromState,
    toState: rule.toState,
    role: rule.role,
    delegateRole: rule.delegateRole,
    delegateStartsAt: isoNullable(rule.delegateStartsAt),
    delegateEndsAt: isoNullable(rule.delegateEndsAt),
    minAmount: rule.minAmount === null ? null : Number(rule.minAmount),
    maxAmount: rule.maxAmount === null ? null : Number(rule.maxAmount),
    active: rule.active,
  };
}

function mapWorkflowEscalationRule(rule: {
  id: string;
  workflowId: string;
  fromState: string;
  toState: string;
  targetRole: string;
  dueInHours: number;
  escalationRole: string;
  notificationChannel: string;
  active: boolean;
}): WorkflowEscalationRule {
  return {
    id: rule.id,
    workflowId: rule.workflowId,
    fromState: rule.fromState,
    toState: rule.toState,
    targetRole: rule.targetRole,
    dueInHours: rule.dueInHours,
    escalationRole: rule.escalationRole,
    notificationChannel: parseWorkflowNotificationChannel(
      rule.notificationChannel,
    ),
    active: rule.active,
  };
}

function parseWorkflowNotificationChannel(
  value: string,
): WorkflowEscalationRule["notificationChannel"] {
  if (["email", "in_app", "slack", "webhook"].includes(value)) {
    return value as WorkflowEscalationRule["notificationChannel"];
  }
  return "in_app";
}

function parseFieldType(value: string): CustomFieldDefinition["fieldType"] {
  if (["boolean", "date", "number", "select", "text"].includes(value)) {
    return value as CustomFieldDefinition["fieldType"];
  }
  return "text";
}

function byDisplayOrder(
  a: CustomFieldDefinition,
  b: CustomFieldDefinition,
): number {
  return (
    a.entityType.localeCompare(b.entityType) ||
    a.displayOrder - b.displayOrder ||
    a.label.localeCompare(b.label)
  );
}

function defaultEntityFields(entityType: string): string[] {
  if (entityType === "Customer") {
    return ["code", "name", "email", "owner", "creditLimit"];
  }
  return ["name"];
}

function requireMemoryAccount(accounts: Account[], code: string): Account {
  const account = accounts.find((record) => record.code === code);
  if (!account) {
    throw new Error(`Account not found: ${code}`);
  }
  return account;
}

function makeMemoryJournalLine(
  account: Account,
  description: string,
  debit: number,
  credit: number,
  currency: string,
): Omit<JournalLine, "id"> {
  return {
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    description,
    debit: { amount: debit, currency },
    credit: { amount: credit, currency },
  };
}

function makeMemoryJournalEntry(
  existingCount: number,
  sourceEntity: string,
  sourceId: string,
  memo: string,
  lines: Array<Omit<JournalLine, "id">>,
): JournalEntry {
  return {
    id: todayId("je", existingCount),
    number: nextDocumentNumber("JE", existingCount),
    sourceEntity,
    sourceId,
    memo,
    status: "posted",
    postedAt: new Date().toISOString(),
    lines: lines.map((line, index) => ({
      id: `jln_${existingCount + 1}_${index + 1}`,
      ...line,
    })),
  };
}

function buildMemoryAging(
  invoices: Invoice[],
  payments: Payment[],
  purchaseInvoices: PurchaseInvoice[],
  supplierPayments: SupplierPayment[],
): AccountingSnapshot["aging"] {
  const receivablePayments = new Map<string, number>();
  for (const payment of payments) {
    receivablePayments.set(
      payment.invoiceId,
      (receivablePayments.get(payment.invoiceId) ?? 0) + payment.amount.amount,
    );
  }
  const payablePayments = new Map<string, number>();
  for (const payment of supplierPayments) {
    payablePayments.set(
      payment.purchaseInvoiceId,
      (payablePayments.get(payment.purchaseInvoiceId) ?? 0) +
        payment.amount.amount,
    );
  }
  return buildAgingFromOpenItems(
    "Receivables",
    invoices
      .filter(
        (invoice) => invoice.status === "posted" || invoice.status === "paid",
      )
      .map((invoice) => ({
        dueDate: invoice.dueDate,
        openAmount: Math.max(
          invoice.total.amount - (receivablePayments.get(invoice.id) ?? 0),
          0,
        ),
        currency: invoice.total.currency,
      })),
    "Payables",
    purchaseInvoices
      .filter(
        (invoice) => invoice.status === "posted" || invoice.status === "paid",
      )
      .map((invoice) => ({
        dueDate: invoice.dueDate,
        openAmount: Math.max(
          invoice.total.amount - (payablePayments.get(invoice.id) ?? 0),
          0,
        ),
        currency: invoice.total.currency,
      })),
  );
}

function buildAgingFromOpenItems(
  receivableLabel: string,
  receivables: Array<{ dueDate: string; openAmount: number; currency: string }>,
  payableLabel: string,
  payables: Array<{ dueDate: string; openAmount: number; currency: string }>,
): AccountingSnapshot["aging"] {
  return {
    receivables: buildAgingBucket(receivableLabel, receivables),
    payables: buildAgingBucket(payableLabel, payables),
  };
}

function buildAgingBucket(
  label: string,
  items: Array<{ dueDate: string; openAmount: number; currency: string }>,
) {
  const currency = items[0]?.currency ?? "USD";
  const today = new Date();
  const amounts = {
    current: 0,
    days1To30: 0,
    days31To60: 0,
    days61To90: 0,
    over90: 0,
  };
  for (const item of items) {
    if (item.openAmount <= 0) {
      continue;
    }
    const ageDays = Math.floor(
      (today.getTime() - new Date(`${item.dueDate}T00:00:00.000Z`).getTime()) /
        86_400_000,
    );
    if (ageDays <= 0) {
      amounts.current += item.openAmount;
    } else if (ageDays <= 30) {
      amounts.days1To30 += item.openAmount;
    } else if (ageDays <= 60) {
      amounts.days31To60 += item.openAmount;
    } else if (ageDays <= 90) {
      amounts.days61To90 += item.openAmount;
    } else {
      amounts.over90 += item.openAmount;
    }
  }
  const total =
    amounts.current +
    amounts.days1To30 +
    amounts.days31To60 +
    amounts.days61To90 +
    amounts.over90;
  return {
    label,
    current: { amount: amounts.current, currency },
    days1To30: { amount: amounts.days1To30, currency },
    days31To60: { amount: amounts.days31To60, currency },
    days61To90: { amount: amounts.days61To90, currency },
    over90: { amount: amounts.over90, currency },
    total: { amount: total, currency },
  };
}

function attendanceHours(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Attendance check-out must be after check-in.");
  }
  return Math.round(((end - start) / 3_600_000) * 100) / 100;
}

function removeMatchingDeadLetters(
  records: DeadLetterRecord[],
  deliveryId?: string,
  outboxEventId?: string,
): void {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (
      record &&
      ((deliveryId !== undefined && record.deliveryId === deliveryId) ||
        (outboxEventId !== undefined && record.outboxEventId === outboxEventId))
    ) {
      records.splice(index, 1);
    }
  }
}

function buildTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
): TrialBalance {
  const currency = "USD";
  const lines: TrialBalanceLine[] = accounts.map((account) => {
    const accountLines = entries
      .filter((entry) => entry.status === "posted")
      .flatMap((entry) => entry.lines)
      .filter((line) => line.accountId === account.id);
    const debit = accountLines.reduce(
      (sum, line) => sum + line.debit.amount,
      0,
    );
    const credit = accountLines.reduce(
      (sum, line) => sum + line.credit.amount,
      0,
    );
    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      debit: { amount: debit, currency },
      credit: { amount: credit, currency },
      balance: {
        amount:
          account.normalBalance === "debit" ? debit - credit : credit - debit,
        currency,
      },
    };
  });
  const debitTotal = lines.reduce((sum, line) => sum + line.debit.amount, 0);
  const creditTotal = lines.reduce((sum, line) => sum + line.credit.amount, 0);
  return {
    debitTotal: { amount: debitTotal, currency },
    creditTotal: { amount: creditTotal, currency },
    isBalanced: debitTotal === creditTotal,
    lines,
  };
}
