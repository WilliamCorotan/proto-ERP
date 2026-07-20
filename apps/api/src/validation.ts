import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const CustomFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().trim().length(3).default("USD"),
});
const ProcurementLineSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  total: MoneySchema,
});

export const CreateCustomerSchema = z.object({
  code: z.string().trim().min(2).max(24),
  name: z.string().trim().min(2).max(160),
  owner: z.string().trim().min(2).max(120),
  email: z.email(),
  creditLimit: MoneySchema,
  customFields: z.record(z.string().min(1), CustomFieldValueSchema).default({}),
});

export const CreateProductSchema = z.object({
  sku: z.string().trim().min(2).max(48),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
  price: MoneySchema,
  stockOnHand: z.number().int().nonnegative().default(0),
});

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const LoginSchema = z.object({
  tenantSlug: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(1),
});

export const CreateUserSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(128),
  roleKeys: z.array(z.string().min(1)).min(1),
});

export const RecordTransitionSchema = z.object({
  status: z.enum(["draft", "submitted", "approved", "cancelled", "closed"]),
  comment: z.string().trim().min(1).max(240).optional(),
});

export const InvoiceTransitionSchema = z.object({
  status: z.enum(["draft", "posted", "paid", "void"]),
  comment: z.string().trim().min(1).max(240).optional(),
});

export const WorkflowInstanceLookupSchema = z.object({
  workflowId: z.string().trim().min(1),
  document: z.object({
    entity: z.string().trim().min(1),
    id: z.string().trim().min(1),
  }),
});

export const WorkflowActionsSchema = WorkflowInstanceLookupSchema.extend({
  currentState: z.string().trim().min(1).optional(),
});

export const WorkflowTransitionSchema = WorkflowInstanceLookupSchema.extend({
  currentState: z.string().trim().min(1),
  targetState: z.string().trim().min(1),
  reason: z.string().trim().min(1).max(240).nullish(),
  comment: z.string().trim().min(1).max(240).nullish(),
});

export const CreateCustomFieldSchema = z.object({
  entityType: z.enum(["Customer"]),
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().trim().min(2).max(80),
  fieldType: z
    .enum(["boolean", "date", "number", "select", "text"])
    .default("text"),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(80)).default([]),
  displayOrder: z.number().int().min(0).max(1000).default(100),
});

export const CreateAutomationRuleSchema = z.object({
  name: z.string().trim().min(2).max(160),
  triggerEvent: z.string().trim().min(2).max(160),
  enabled: z.boolean().default(true),
  actions: z
    .array(
      z.object({
        type: z.enum(["audit", "outbox"]).default("audit"),
        message: z.string().trim().min(1).max(240).optional(),
        eventType: z.string().trim().min(2).max(160).optional(),
      }),
    )
    .min(1),
});

export const CreateWorkflowAssignmentRuleSchema = z
  .object({
    workflowId: z.enum([
      "procurement.purchase-order",
      "sales.invoice",
      "sales.order",
      "sales.quote",
    ]),
    fromState: z.string().trim().min(1).max(80),
    toState: z.string().trim().min(1).max(80),
    role: z.string().trim().min(1).max(80),
    delegateRole: z.string().trim().min(1).max(80).nullish(),
    delegateStartsAt: z.string().datetime().nullish(),
    delegateEndsAt: z.string().datetime().nullish(),
    minAmount: z.number().nonnegative().nullish(),
    maxAmount: z.number().nonnegative().nullish(),
    active: z.boolean().default(true),
  })
  .refine(
    (input) =>
      input.minAmount === null ||
      input.maxAmount === null ||
      input.minAmount === undefined ||
      input.maxAmount === undefined ||
      input.maxAmount >= input.minAmount,
    {
      message: "maxAmount must be greater than or equal to minAmount",
      path: ["maxAmount"],
    },
  )
  .refine(
    (input) =>
      !input.delegateStartsAt ||
      !input.delegateEndsAt ||
      new Date(input.delegateEndsAt).getTime() >=
        new Date(input.delegateStartsAt).getTime(),
    {
      message: "delegateEndsAt must be after delegateStartsAt",
      path: ["delegateEndsAt"],
    },
  );

export const CreateWorkflowEscalationRuleSchema = z.object({
  workflowId: z.enum([
    "procurement.purchase-order",
    "sales.invoice",
    "sales.order",
    "sales.quote",
  ]),
  fromState: z.string().trim().min(1).max(80),
  toState: z.string().trim().min(1).max(80),
  targetRole: z.string().trim().min(1).max(80),
  dueInHours: z.number().int().positive().max(720),
  escalationRole: z.string().trim().min(1).max(80),
  notificationChannel: z.enum(["email", "in_app", "slack", "webhook"]),
  active: z.boolean().default(true),
});

export const WorkflowTaskReassignSchema = z.object({
  role: z.string().trim().min(1).max(80),
  actorId: z.string().trim().min(1).max(120).default("usr_admin"),
  reason: z.string().trim().min(1).max(240).nullish(),
});

export const WorkflowTaskSnoozeSchema = z.object({
  dueAt: z.string().datetime(),
  actorId: z.string().trim().min(1).max(120).default("usr_admin"),
  reason: z.string().trim().min(1).max(240),
});

export const WorkflowTaskRetryNotificationSchema = z.object({
  notification: z.enum(["assigned", "cancelled", "completed", "escalated"]),
  actorId: z.string().trim().min(1).max(120).default("usr_admin"),
  reason: z.string().trim().min(1).max(240).nullish(),
});

export const ModuleToggleSchema = z.object({
  enabled: z.boolean(),
});

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: MoneySchema.extend({ amount: z.number().positive() }),
  method: z.string().trim().min(2).max(40).default("manual"),
  receivedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export const CreateBankTransactionSchema = z.object({
  bankAccountId: z.string().min(1),
  reference: z.string().trim().min(2).max(120),
  direction: z.enum(["inbound", "outbound"]),
  amount: MoneySchema.extend({ amount: z.number().positive() }),
  transactionDate: z.string().date(),
  matchedEntity: z.string().trim().min(2).max(80).nullish(),
  matchedEntityId: z.string().trim().min(1).max(120).nullish(),
});

export const ReconcileBankAccountSchema = z.object({
  bankAccountId: z.string().min(1),
  statementDate: z.string().date(),
  statementBalance: MoneySchema,
  transactionIds: z.array(z.string().min(1)).min(1),
});

export const CloseFiscalPeriodSchema = z.object({
  fiscalPeriodId: z.string().min(1),
  closedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export const AllocateLandedCostSchema = z.object({
  purchaseReceiptId: z.string().min(1),
  amount: MoneySchema.extend({ amount: z.number().positive() }),
  method: z.enum(["quantity", "value"]).default("quantity"),
});

export const CreateFixedAssetSchema = z.object({
  assetTag: z.string().trim().min(2).max(60),
  name: z.string().trim().min(2).max(160),
  purchaseDate: z.string().date(),
  cost: MoneySchema.extend({ amount: z.number().positive() }),
  usefulLifeMonths: z.number().int().min(1).max(600),
});

export const RunDepreciationSchema = z.object({
  fixedAssetId: z.string().min(1),
  runDate: z.string().date(),
});

export const SetExchangeRateSchema = z.object({
  baseCurrency: z.string().trim().length(3),
  quoteCurrency: z.string().trim().length(3),
  rate: z.number().positive(),
  effectiveDate: z.string().date(),
});

export const CreateSupplierSchema = z.object({
  code: z.string().trim().min(2).max(24),
  name: z.string().trim().min(2).max(160),
  email: z.email(),
  phone: z.string().trim().min(3).max(40),
  paymentTerms: z.string().trim().min(2).max(80),
});

export const CreateMaterialRequestSchema = z.object({
  requester: z.string().trim().min(2).max(120),
  requiredBy: z.string().date(),
  lines: z.array(ProcurementLineSchema).min(1),
});

export const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  expectedDate: z.string().date(),
  lines: z.array(ProcurementLineSchema).min(1),
});

export const SupplierPaymentSchema = z.object({
  purchaseInvoiceId: z.string().min(1),
  amount: MoneySchema.extend({ amount: z.number().positive() }),
  method: z.string().trim().min(2).max(40).default("manual"),
  paidAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export const CreateStockReservationSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  sourceEntity: z.string().trim().min(2).max(80),
  sourceId: z.string().trim().min(1).max(120),
});

export const CreateStockTransferSchema = z.object({
  productId: z.string().min(1),
  fromBinId: z.string().min(1),
  toBinId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CreateCycleCountSchema = z.object({
  productId: z.string().min(1),
  binId: z.string().min(1),
  countedQuantity: z.number().int().nonnegative(),
});

export const CreatePickListSchema = z.object({
  salesOrderId: z.string().min(1),
});

export const ConfirmPickTaskSchema = z.object({
  pickTaskId: z.string().min(1),
  pickedQuantity: z.number().int().nonnegative(),
  barcode: z.string().trim().min(1).max(120),
});

export const PackPickListSchema = z.object({
  pickListId: z.string().min(1),
  packageCode: z.string().trim().min(1).max(120),
});

export const ShipPackSchema = z.object({
  packRecordId: z.string().min(1),
  carrier: z.string().trim().min(2).max(80),
  trackingNumber: z.string().trim().min(1).max(120),
});

export const CreatePutAwayTasksSchema = z.object({
  purchaseReceiptId: z.string().min(1),
});

export const ConfirmPutAwayTaskSchema = z.object({
  putAwayTaskId: z.string().min(1),
  barcode: z.string().trim().min(1).max(120),
});

export const CreateProductionPlanSchema = z.object({
  productId: z.string().min(1),
  demandQuantity: z.number().int().positive(),
  demandDate: z.string().date(),
  sourceEntity: z.string().trim().min(2).max(80),
  sourceId: z.string().trim().min(1).max(120),
});

export const StartJobCardSchema = z.object({
  jobCardId: z.string().min(1),
  operator: z.string().trim().min(2).max(120),
});

export const CompleteJobCardSchema = z.object({
  jobCardId: z.string().min(1),
  actualMinutes: z.number().int().positive(),
});

export const RecordDowntimeSchema = z.object({
  workCenterId: z.string().min(1),
  jobCardId: z.string().min(1).nullable().optional(),
  reason: z.string().trim().min(2).max(160),
  minutes: z.number().int().positive(),
});

export const CreateQualityInspectionSchema = z.object({
  templateId: z.string().min(1),
  traceRecordId: z.string().min(1),
  inspectedBy: z.string().trim().min(2).max(120),
  results: z
    .array(
      z.object({
        checkpoint: z.string().trim().min(1).max(160),
        passed: z.boolean(),
        note: z.string().trim().max(500).default(""),
      }),
    )
    .min(1),
});

export const CreateRecallSchema = z.object({
  lotNumber: z.string().trim().min(2).max(120),
  reason: z.string().trim().min(2).max(500),
});

export const OpenPosShiftSchema = z.object({
  registerId: z.string().min(1),
  openedBy: z.string().trim().min(2).max(120),
  openingCash: MoneySchema,
});

export const ClosePosShiftSchema = z.object({
  shiftId: z.string().min(1),
  closingCash: MoneySchema,
});

export const CheckoutPosSaleSchema = z.object({
  shiftId: z.string().min(1),
  customerId: z.string().min(1),
  tenderType: z.enum(["bank_card", "cash", "digital_wallet"]),
  lines: z.array(ProcurementLineSchema).min(1),
});

export const PublishChannelCatalogSchema = z.object({
  channelId: z.string().min(1),
  productIds: z.array(z.string().min(1)).min(1),
});

export const IngestChannelOrderSchema = z.object({
  channelId: z.string().min(1),
  externalOrderId: z.string().trim().min(2).max(120),
  customerId: z.string().min(1),
  lines: z.array(ProcurementLineSchema).min(1),
});

export const RunReportSchema = z.object({
  reportId: z.string().min(1),
});

const ReportParameterSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  type: z.enum(["date", "number", "select", "text"]).default("text"),
  required: z.boolean().default(false),
});

const ReportSortSchema = z.object({
  field: z.string().trim().min(1).max(120),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

const ReportChartSchema = z.object({
  type: z.enum(["bar", "line", "none"]).default("none"),
  labelField: z.string().trim().min(1).max(120).nullable().default(null),
  valueField: z.string().trim().min(1).max(120).nullable().default(null),
});

export const CreateSavedReportSchema = z.object({
  name: z.string().trim().min(2).max(160),
  entityType: z.string().trim().min(2).max(80),
  columns: z.array(z.string().trim().min(1).max(120)).min(1),
  filters: z
    .record(z.string().min(1), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
  parameters: z.array(ReportParameterSchema).default([]),
  sorts: z.array(ReportSortSchema).default([]),
  groupBy: z.array(z.string().trim().min(1).max(120)).default([]),
  chart: ReportChartSchema.default({
    type: "none",
    labelField: null,
    valueField: null,
  }),
  owner: z.string().trim().min(2).max(120).default("Admin"),
});

export const PreviewReportSchema = z.object({
  reportId: z.string().min(1),
});

export const CreateExportJobSchema = z.object({
  reportId: z.string().min(1),
  format: z.enum(["csv", "json"]).default("csv"),
});

const PrintBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("barcode"),
    field: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    type: z.literal("field"),
    field: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    type: z.literal("heading"),
    text: z.string().trim().min(1).max(200),
  }),
  z.object({
    type: z.literal("signature"),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    type: z.literal("table"),
    field: z.string().trim().min(1).max(120),
    columns: z.array(z.string().trim().min(1).max(120)).min(1),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().trim().min(1).max(500),
  }),
]);

export const CreatePrintFormatSchema = z.object({
  name: z.string().trim().min(2).max(160),
  entityType: z.string().trim().min(2).max(80),
  template: z.string().trim().min(2).max(120),
  blocks: z.array(PrintBlockSchema).min(1),
  active: z.boolean().default(true),
});

export const PreviewPrintFormatSchema = z.object({
  printFormatId: z.string().min(1),
  recordId: z.string().min(1),
});

export const CreateApiKeySchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z
    .array(
      z.enum([
        "accounting.read",
        "inventory.read",
        "reporting.read",
        "sales.customer.read",
        "integration.read",
      ]),
    )
    .min(1),
});

export const DispatchWebhookSchema = z.object({
  subscriptionId: z.string().min(1),
  eventType: z.string().trim().min(2).max(120),
  payload: z.record(z.string().min(1), z.unknown()).default({}),
});

export const CreateLeadSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.email(),
  source: z.string().trim().min(2).max(80),
  owner: z.string().trim().min(2).max(120),
});

export const CreateProjectSchema = z.object({
  code: z.string().trim().min(2).max(32),
  name: z.string().trim().min(2).max(160),
  customerName: z.string().trim().min(2).max(160),
  budget: MoneySchema,
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export const CreateServiceCaseSchema = z.object({
  customerName: z.string().trim().min(2).max(160),
  subject: z.string().trim().min(2).max(240),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  owner: z.string().trim().min(2).max(120),
});

export const CreateLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(["vacation", "sick", "personal"]),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

export const RecordAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  workDate: z.string().date(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
});

export const SubmitExpenseClaimSchema = z.object({
  employeeId: z.string().min(1),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(240),
  amount: MoneySchema,
  submittedAt: z.string().datetime(),
});

export const ExpenseClaimStatusSchema = z.object({
  id: z.string().min(1),
  approvedAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
});

export const CreateEmployeeAdvanceSchema = z.object({
  employeeId: z.string().min(1),
  amount: MoneySchema,
  requestedAt: z.string().datetime(),
});

export const PayEmployeeAdvanceSchema = z.object({
  id: z.string().min(1),
  paidAt: z.string().datetime(),
  paymentReference: z.string().trim().min(2).max(120),
});

export const RunPayrollSchema = z.object({
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  postedAt: z.string().datetime(),
});

export function parseBody<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException({
      message: "Invalid request body",
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  return result.data;
}
