import type { components, paths } from "./openapi-types.js";

type Schemas = components["schemas"];

export type OpenApiPaths = paths;

export type DashboardSummary = Schemas["DashboardSummary"];
export type SalesSnapshot = Schemas["SalesSnapshot"];
export type SalesCustomerPage = Schemas["SalesCustomerPage"];
export type ListSalesCustomersQuery = {
  after?: string;
  limit?: number;
  search?: string;
  status?: "active" | "paused";
};
export type ModuleManifest = Schemas["ModuleManifest"];
export type WorkflowPolicy = Schemas["WorkflowPolicy"];
export type WorkflowActionsRequest = Schemas["WorkflowActionsRequest"];
export type WorkflowActionsResponse = Schemas["WorkflowActionsResponse"];
export type WorkflowInboxResponse = Schemas["WorkflowInboxResponse"];
export type WorkflowInstanceLookupRequest =
  Schemas["WorkflowInstanceLookupRequest"];
export type WorkflowInstance = Schemas["WorkflowInstance"];
export type WorkflowTransitionRequest = Schemas["WorkflowTransitionRequest"];
export type WorkflowTransitionResponse = Schemas["WorkflowTransitionResponse"];
export type Customer = Schemas["Customer"];
export type Product = Schemas["Product"];
export type Quote = Schemas["Quote"];
export type SalesOrder = Schemas["SalesOrder"];
export type Invoice = Schemas["Invoice"];
export type AccountingSnapshot = Schemas["AccountingSnapshot"];
export type Payment = Schemas["Payment"];
export type BankTransaction = Schemas["BankTransaction"];
export type BankReconciliation = Schemas["BankReconciliation"];
export type PeriodClose = Schemas["PeriodClose"];
export type LandedCostAllocation = Schemas["LandedCostAllocation"];
export type FixedAsset = Schemas["FixedAsset"];
export type DepreciationRun = Schemas["DepreciationRun"];
export type ExchangeRate = Schemas["ExchangeRate"];
export type CommerceSnapshot = Schemas["CommerceSnapshot"];
export type PosShift = Schemas["PosShift"];
export type PosSale = Schemas["PosSale"];
export type ChannelCatalogItem = Schemas["ChannelCatalogItem"];
export type ChannelOrder = Schemas["ChannelOrder"];
export type HrSnapshot = Schemas["HrSnapshot"];
export type AttendanceRecord = Schemas["AttendanceRecord"];
export type ExpenseClaim = Schemas["ExpenseClaim"];
export type EmployeeAdvance = Schemas["EmployeeAdvance"];
export type PayrollRun = Schemas["PayrollRun"];
export type ProcurementSnapshot = Schemas["ProcurementSnapshot"];
export type InventorySnapshot = Schemas["InventorySnapshot"];
export type ManufacturingSnapshot = Schemas["ManufacturingSnapshot"];
export type QualitySnapshot = Schemas["QualitySnapshot"];
export type ReportingSnapshot = Schemas["ReportingSnapshot"];
export type IntegrationSnapshot = Schemas["IntegrationSnapshot"];
export type OperationsSnapshot = Schemas["OperationsSnapshot"];
export type SavedReport = Schemas["SavedReport"];
export type PrintFormat = Schemas["PrintFormat"];
export type ReportPreview = Schemas["ReportPreview"];
export type PrintPreview = Schemas["PrintPreview"];
export type Supplier = Schemas["Supplier"];
export type MaterialRequest = Schemas["MaterialRequest"];
export type PurchaseOrder = Schemas["PurchaseOrder"];
export type PurchaseReceipt = Schemas["PurchaseReceipt"];
export type PurchaseInvoice = Schemas["PurchaseInvoice"];
export type SupplierPayment = Schemas["SupplierPayment"];
export type StockReservation = Schemas["StockReservation"];
export type StockTransfer = Schemas["StockTransfer"];
export type CycleCount = Schemas["CycleCount"];
export type PickList = Schemas["PickList"];
export type PickTask = Schemas["PickTask"];
export type PackRecord = Schemas["PackRecord"];
export type Shipment = Schemas["Shipment"];
export type PutAwayTask = Schemas["PutAwayTask"];
export type BarcodeScan = Schemas["BarcodeScan"];
export type ProductionPlan = Schemas["ProductionPlan"];
export type WorkOrder = Schemas["WorkOrder"];
export type JobCard = Schemas["JobCard"];
export type DowntimeEntry = Schemas["DowntimeEntry"];
export type CapacitySchedule = Schemas["CapacitySchedule"];
export type QualityInspection = Schemas["QualityInspection"];
export type Recall = Schemas["Recall"];
export type TraceMovement = Schemas["TraceMovement"];
export type TraceGenealogy = Schemas["TraceGenealogy"];
export type ReportRun = Schemas["ReportRun"];
export type ExportJob = Schemas["ExportJob"];
export type ApiKeyRecord = Schemas["ApiKeyRecord"];
export type WebhookDelivery = Schemas["WebhookDelivery"];
export type OutboxEvent = Schemas["OutboxEvent"];
export type WorkflowTaskOperation = Schemas["WorkflowTaskOperation"];
export type WorkflowTaskRecord = Schemas["WorkflowTaskRecord"];
export type Lead = Schemas["Lead"];
export type Project = Schemas["Project"];
export type ServiceCase = Schemas["ServiceCase"];
export type LeaveRequest = Schemas["LeaveRequest"];
export type CustomizationSnapshot = Schemas["CustomizationSnapshot"];
export type CustomFieldDefinition = Schemas["CustomFieldDefinition"];
export type WorkflowAssignmentRule = Schemas["WorkflowAssignmentRule"];
export type WorkflowEscalationRule = Schemas["WorkflowEscalationRule"];
export type WebhookEventContract = Schemas["WebhookEventContract"];

export type CreateCustomerRequest = Schemas["CreateCustomerRequest"];
export type CreateProductRequest = Schemas["CreateProductRequest"];
export type CreateAutomationRuleRequest =
  Schemas["CreateAutomationRuleRequest"];
export type CreateWorkflowAssignmentRuleRequest =
  Schemas["CreateWorkflowAssignmentRuleRequest"];
export type CreateWorkflowEscalationRuleRequest =
  Schemas["CreateWorkflowEscalationRuleRequest"];
export type WorkflowTaskReassignRequest =
  Schemas["WorkflowTaskReassignRequest"];
export type WorkflowTaskSnoozeRequest = Schemas["WorkflowTaskSnoozeRequest"];
export type WorkflowTaskRetryNotificationRequest =
  Schemas["WorkflowTaskRetryNotificationRequest"];
export type LoginRequest = Schemas["LoginRequest"];
export type LoginResponse = Schemas["AuthSession"];
export type AdminUser = Schemas["AdminUser"];
export type AdminRole = Schemas["AdminRole"];
export type CreateUserRequest = Schemas["CreateUserRequest"];
export type RecordTransitionRequest = Schemas["RecordTransitionRequest"];
export type InvoiceTransitionRequest = Schemas["InvoiceTransitionRequest"];
export type CreateCustomFieldRequest = Schemas["CreateCustomFieldRequest"];
export type ModuleToggleRequest = Schemas["ModuleToggleRequest"];
export type RecordPaymentRequest = Schemas["RecordPaymentRequest"];
export type CreateBankTransactionRequest =
  Schemas["CreateBankTransactionRequest"];
export type ReconcileBankAccountRequest =
  Schemas["ReconcileBankAccountRequest"];
export type CloseFiscalPeriodRequest = Schemas["CloseFiscalPeriodRequest"];
export type AllocateLandedCostRequest = Schemas["AllocateLandedCostRequest"];
export type CreateFixedAssetRequest = Schemas["CreateFixedAssetRequest"];
export type RunDepreciationRequest = Schemas["RunDepreciationRequest"];
export type SetExchangeRateRequest = Schemas["SetExchangeRateRequest"];
export type OpenPosShiftRequest = Schemas["OpenPosShiftRequest"];
export type ClosePosShiftRequest = Schemas["ClosePosShiftRequest"];
export type CheckoutPosSaleRequest = Schemas["CheckoutPosSaleRequest"];
export type PublishChannelCatalogRequest =
  Schemas["PublishChannelCatalogRequest"];
export type IngestChannelOrderRequest = Schemas["IngestChannelOrderRequest"];
export type RecordAttendanceRequest = Schemas["RecordAttendanceRequest"];
export type SubmitExpenseClaimRequest = Schemas["SubmitExpenseClaimRequest"];
export type ExpenseClaimStatusRequest = Schemas["ExpenseClaimStatusRequest"];
export type CreateEmployeeAdvanceRequest =
  Schemas["CreateEmployeeAdvanceRequest"];
export type PayEmployeeAdvanceRequest = Schemas["PayEmployeeAdvanceRequest"];
export type RunPayrollRequest = Schemas["RunPayrollRequest"];
export type CreateSupplierRequest = Schemas["CreateSupplierRequest"];
export type CreateMaterialRequestRequest =
  Schemas["CreateMaterialRequestRequest"];
export type CreatePurchaseOrderRequest = Schemas["CreatePurchaseOrderRequest"];
export type SupplierPaymentRequest = Schemas["SupplierPaymentRequest"];
export type CreateStockReservationRequest =
  Schemas["CreateStockReservationRequest"];
export type CreateStockTransferRequest = Schemas["CreateStockTransferRequest"];
export type CreateCycleCountRequest = Schemas["CreateCycleCountRequest"];
export type CreatePickListRequest = Schemas["CreatePickListRequest"];
export type ConfirmPickTaskRequest = Schemas["ConfirmPickTaskRequest"];
export type PackPickListRequest = Schemas["PackPickListRequest"];
export type ShipPackRequest = Schemas["ShipPackRequest"];
export type CreatePutAwayTasksRequest = Schemas["CreatePutAwayTasksRequest"];
export type ConfirmPutAwayTaskRequest = Schemas["ConfirmPutAwayTaskRequest"];
export type CreateProductionPlanRequest =
  Schemas["CreateProductionPlanRequest"];
export type StartJobCardRequest = Schemas["StartJobCardRequest"];
export type CompleteJobCardRequest = Schemas["CompleteJobCardRequest"];
export type RecordDowntimeRequest = Schemas["RecordDowntimeRequest"];
export type CreateQualityInspectionRequest =
  Schemas["CreateQualityInspectionRequest"];
export type CreateRecallRequest = Schemas["CreateRecallRequest"];
export type RunReportRequest = Schemas["RunReportRequest"];
export type CreateSavedReportRequest = Schemas["CreateSavedReportRequest"];
export type PreviewReportRequest = Schemas["PreviewReportRequest"];
export type CreateExportJobRequest = Schemas["CreateExportJobRequest"];
export type CreatePrintFormatRequest = Schemas["CreatePrintFormatRequest"];
export type PreviewPrintFormatRequest = Schemas["PreviewPrintFormatRequest"];
export type CreateApiKeyRequest = Schemas["CreateApiKeyRequest"];
export type DispatchWebhookRequest = Schemas["DispatchWebhookRequest"];
export type CreateLeadRequest = Schemas["CreateLeadRequest"];
export type CreateProjectRequest = Schemas["CreateProjectRequest"];
export type CreateServiceCaseRequest = Schemas["CreateServiceCaseRequest"];
export type CreateLeaveRequestRequest = Schemas["CreateLeaveRequestRequest"];

export class ErpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  async dashboard(): Promise<DashboardSummary> {
    return this.get("/dashboard");
  }

  async sales(): Promise<SalesSnapshot> {
    return this.get("/sales");
  }

  async salesCustomers(
    query: ListSalesCustomersQuery = {},
  ): Promise<SalesCustomerPage> {
    const parameters = new URLSearchParams();
    if (query.after) parameters.set("after", query.after);
    if (query.limit !== undefined) parameters.set("limit", String(query.limit));
    if (query.search) parameters.set("search", query.search);
    if (query.status) parameters.set("status", query.status);
    const suffix = parameters.size > 0 ? `?${parameters.toString()}` : "";
    return this.get(`/sales/customers${suffix}`);
  }

  async customization(): Promise<CustomizationSnapshot> {
    return this.get("/customization");
  }

  async accounting(): Promise<AccountingSnapshot> {
    return this.get("/accounting");
  }

  async commerce(): Promise<CommerceSnapshot> {
    return this.get("/commerce");
  }

  async hr(): Promise<HrSnapshot> {
    return this.get("/hr");
  }

  async procurement(): Promise<ProcurementSnapshot> {
    return this.get("/procurement");
  }

  async inventory(): Promise<InventorySnapshot> {
    return this.get("/inventory");
  }

  async manufacturing(): Promise<ManufacturingSnapshot> {
    return this.get("/manufacturing");
  }

  async quality(): Promise<QualitySnapshot> {
    return this.get("/quality");
  }

  async traceGenealogy(id: string): Promise<TraceGenealogy> {
    return this.get(`/quality/trace-records/${id}/genealogy`);
  }

  async reporting(): Promise<ReportingSnapshot> {
    return this.get("/reports");
  }

  async integration(): Promise<IntegrationSnapshot> {
    return this.get("/integrations");
  }

  async operations(): Promise<OperationsSnapshot> {
    return this.get("/operations");
  }

  async modules(): Promise<ModuleManifest[]> {
    return this.get("/modules");
  }

  async workflowPolicies(): Promise<WorkflowPolicy[]> {
    return this.get("/workflows");
  }

  async workflowActions(
    input: WorkflowActionsRequest,
  ): Promise<WorkflowActionsResponse> {
    return this.post("/workflows/actions", input);
  }

  async workflowInbox(): Promise<WorkflowInboxResponse> {
    return this.get("/workflows/inbox");
  }

  async workflowInstance(
    input: WorkflowInstanceLookupRequest,
  ): Promise<WorkflowInstance | null> {
    return this.post("/workflows/instances/lookup", input);
  }

  async workflowTransition(
    input: WorkflowTransitionRequest,
  ): Promise<WorkflowTransitionResponse> {
    return this.post("/workflows/transitions", input);
  }

  async login(input: LoginRequest): Promise<LoginResponse> {
    return this.post("/auth/login", input);
  }

  async createCustomer(input: CreateCustomerRequest): Promise<Customer> {
    return this.post("/sales/customers", input);
  }

  async createProduct(input: CreateProductRequest): Promise<Product> {
    return this.post("/sales/products", input);
  }

  async updateCustomer(
    id: string,
    input: CreateCustomerRequest,
  ): Promise<Customer> {
    return this.patch(`/sales/customers/${id}`, input);
  }

  async updateProduct(
    id: string,
    input: CreateProductRequest,
  ): Promise<Product> {
    return this.patch(`/sales/products/${id}`, input);
  }

  async adminUsers(): Promise<AdminUser[]> {
    return this.get("/admin/users");
  }

  async adminRoles(): Promise<AdminRole[]> {
    return this.get("/admin/roles");
  }

  async createUser(input: CreateUserRequest): Promise<AdminUser> {
    return this.post("/admin/users", input);
  }

  async createCustomField(
    input: CreateCustomFieldRequest,
  ): Promise<CustomFieldDefinition> {
    return this.post("/customization/custom-fields", input);
  }

  async createAutomationRule(
    input: CreateAutomationRuleRequest,
  ): Promise<Schemas["AutomationRule"]> {
    return this.post("/customization/automation-rules", input);
  }

  async createWorkflowAssignmentRule(
    input: CreateWorkflowAssignmentRuleRequest,
  ): Promise<WorkflowAssignmentRule> {
    return this.post("/customization/workflow-assignment-rules", input);
  }

  async createWorkflowEscalationRule(
    input: CreateWorkflowEscalationRuleRequest,
  ): Promise<WorkflowEscalationRule> {
    return this.post("/customization/workflow-escalation-rules", input);
  }

  async setModuleEnabled(
    id: string,
    input: ModuleToggleRequest,
  ): Promise<string[]> {
    const response = await this.patch<Schemas["EnabledModulesResponse"]>(
      `/customization/modules/${id}`,
      input,
    );
    return response.enabledModules;
  }

  async recordPayment(input: RecordPaymentRequest): Promise<Payment> {
    return this.post("/accounting/payments", input);
  }

  async createBankTransaction(
    input: CreateBankTransactionRequest,
  ): Promise<BankTransaction> {
    return this.post("/accounting/bank-transactions", input);
  }

  async reconcileBankAccount(
    input: ReconcileBankAccountRequest,
  ): Promise<BankReconciliation> {
    return this.post("/accounting/bank-reconciliations", input);
  }

  async closeFiscalPeriod(
    input: CloseFiscalPeriodRequest,
  ): Promise<PeriodClose> {
    return this.post("/accounting/period-closes", input);
  }

  async allocateLandedCost(
    input: AllocateLandedCostRequest,
  ): Promise<LandedCostAllocation> {
    return this.post("/accounting/landed-cost-allocations", input);
  }

  async createFixedAsset(input: CreateFixedAssetRequest): Promise<FixedAsset> {
    return this.post("/accounting/fixed-assets", input);
  }

  async runDepreciation(
    input: RunDepreciationRequest,
  ): Promise<DepreciationRun> {
    return this.post("/accounting/depreciation-runs", input);
  }

  async setExchangeRate(input: SetExchangeRateRequest): Promise<ExchangeRate> {
    return this.post("/accounting/exchange-rates", input);
  }

  async openPosShift(input: OpenPosShiftRequest): Promise<PosShift> {
    return this.post("/commerce/pos-shifts/open", input);
  }

  async closePosShift(input: ClosePosShiftRequest): Promise<PosShift> {
    return this.post("/commerce/pos-shifts/close", input);
  }

  async checkoutPosSale(input: CheckoutPosSaleRequest): Promise<PosSale> {
    return this.post("/commerce/pos-sales", input);
  }

  async publishChannelCatalog(
    input: PublishChannelCatalogRequest,
  ): Promise<ChannelCatalogItem[]> {
    return this.post("/commerce/catalog", input);
  }

  async ingestChannelOrder(
    input: IngestChannelOrderRequest,
  ): Promise<ChannelOrder> {
    return this.post("/commerce/channel-orders", input);
  }

  async recordAttendance(
    input: RecordAttendanceRequest,
  ): Promise<AttendanceRecord> {
    return this.post("/hr/attendance", input);
  }

  async submitExpenseClaim(
    input: SubmitExpenseClaimRequest,
  ): Promise<ExpenseClaim> {
    return this.post("/hr/expense-claims", input);
  }

  async approveExpenseClaim(
    input: ExpenseClaimStatusRequest,
  ): Promise<ExpenseClaim> {
    return this.post("/hr/expense-claims/approve", input);
  }

  async payExpenseClaim(
    input: ExpenseClaimStatusRequest,
  ): Promise<ExpenseClaim> {
    return this.post("/hr/expense-claims/pay", input);
  }

  async createEmployeeAdvance(
    input: CreateEmployeeAdvanceRequest,
  ): Promise<EmployeeAdvance> {
    return this.post("/hr/employee-advances", input);
  }

  async payEmployeeAdvance(
    input: PayEmployeeAdvanceRequest,
  ): Promise<EmployeeAdvance> {
    return this.post("/hr/employee-advances/pay", input);
  }

  async runPayroll(input: RunPayrollRequest): Promise<PayrollRun> {
    return this.post("/hr/payroll-runs", input);
  }

  async createSupplier(input: CreateSupplierRequest): Promise<Supplier> {
    return this.post("/procurement/suppliers", input);
  }

  async createMaterialRequest(
    input: CreateMaterialRequestRequest,
  ): Promise<MaterialRequest> {
    return this.post("/procurement/material-requests", input);
  }

  async createPurchaseOrder(
    input: CreatePurchaseOrderRequest,
  ): Promise<PurchaseOrder> {
    return this.post("/procurement/purchase-orders", input);
  }

  async transitionPurchaseOrder(
    id: string,
    input: RecordTransitionRequest,
  ): Promise<PurchaseOrder> {
    return this.patch(`/procurement/purchase-orders/${id}/status`, input);
  }

  async receivePurchaseOrder(id: string): Promise<PurchaseReceipt> {
    return this.post(`/procurement/purchase-orders/${id}/receipt`, {});
  }

  async createPurchaseInvoiceFromOrder(id: string): Promise<PurchaseInvoice> {
    return this.post(`/procurement/purchase-orders/${id}/invoice`, {});
  }

  async payPurchaseInvoice(
    input: SupplierPaymentRequest,
  ): Promise<SupplierPayment> {
    return this.post("/procurement/supplier-payments", input);
  }

  async reserveStock(
    input: CreateStockReservationRequest,
  ): Promise<StockReservation> {
    return this.post("/inventory/reservations", input);
  }

  async transferStock(
    input: CreateStockTransferRequest,
  ): Promise<StockTransfer> {
    return this.post("/inventory/transfers", input);
  }

  async postCycleCount(input: CreateCycleCountRequest): Promise<CycleCount> {
    return this.post("/inventory/cycle-counts", input);
  }

  async createPickList(input: CreatePickListRequest): Promise<PickList> {
    return this.post("/inventory/pick-lists", input);
  }

  async confirmPickTask(input: ConfirmPickTaskRequest): Promise<PickTask> {
    return this.post("/inventory/pick-tasks/confirm", input);
  }

  async packPickList(input: PackPickListRequest): Promise<PackRecord> {
    return this.post("/inventory/pack-records", input);
  }

  async shipPackRecord(input: ShipPackRequest): Promise<Shipment> {
    return this.post("/inventory/shipments", input);
  }

  async createPutAwayTasks(
    input: CreatePutAwayTasksRequest,
  ): Promise<PutAwayTask[]> {
    return this.post("/inventory/put-away-tasks", input);
  }

  async confirmPutAwayTask(
    input: ConfirmPutAwayTaskRequest,
  ): Promise<PutAwayTask> {
    return this.post("/inventory/put-away-tasks/confirm", input);
  }

  async createProductionPlan(
    input: CreateProductionPlanRequest,
  ): Promise<ProductionPlan> {
    return this.post("/manufacturing/production-plans", input);
  }

  async createWorkOrderFromSuggestion(id: string): Promise<WorkOrder> {
    return this.post(`/manufacturing/mrp-suggestions/${id}/work-order`, {});
  }

  async releaseWorkOrder(id: string): Promise<WorkOrder> {
    return this.post(`/manufacturing/work-orders/${id}/release`, {});
  }

  async startJobCard(input: StartJobCardRequest): Promise<JobCard> {
    return this.post("/manufacturing/job-cards/start", input);
  }

  async completeJobCard(input: CompleteJobCardRequest): Promise<JobCard> {
    return this.post("/manufacturing/job-cards/complete", input);
  }

  async recordDowntime(input: RecordDowntimeRequest): Promise<DowntimeEntry> {
    return this.post("/manufacturing/downtime", input);
  }

  async completeWorkOrder(id: string): Promise<WorkOrder> {
    return this.post(`/manufacturing/work-orders/${id}/complete`, {});
  }

  async createQualityInspection(
    input: CreateQualityInspectionRequest,
  ): Promise<QualityInspection> {
    return this.post("/quality/inspections", input);
  }

  async createRecall(input: CreateRecallRequest): Promise<Recall> {
    return this.post("/quality/recalls", input);
  }

  async createSavedReport(
    input: CreateSavedReportRequest,
  ): Promise<SavedReport> {
    return this.post("/reports", input);
  }

  async runReport(input: RunReportRequest): Promise<ReportRun> {
    return this.post("/reports/runs", input);
  }

  async previewReport(input: PreviewReportRequest): Promise<ReportPreview> {
    return this.post("/reports/previews", input);
  }

  async createExportJob(input: CreateExportJobRequest): Promise<ExportJob> {
    return this.post("/reports/exports", input);
  }

  async createPrintFormat(
    input: CreatePrintFormatRequest,
  ): Promise<PrintFormat> {
    return this.post("/reports/print-formats", input);
  }

  async previewPrintFormat(
    input: PreviewPrintFormatRequest,
  ): Promise<PrintPreview> {
    return this.post("/reports/print-previews", input);
  }

  async createApiKey(input: CreateApiKeyRequest): Promise<ApiKeyRecord> {
    return this.post("/integrations/api-keys", input);
  }

  async dispatchWebhook(
    input: DispatchWebhookRequest,
  ): Promise<WebhookDelivery> {
    return this.post("/integrations/webhook-deliveries", input);
  }

  async retryWebhookDelivery(id: string): Promise<WebhookDelivery> {
    return this.post(`/integrations/webhook-deliveries/${id}/retry`, {});
  }

  async dispatchOutboxEvent(id: string): Promise<OutboxEvent> {
    return this.post(`/integrations/outbox-events/${id}/dispatch`, {});
  }

  async reassignWorkflowTask(
    id: string,
    input: WorkflowTaskReassignRequest,
  ): Promise<WorkflowTaskRecord> {
    return this.post(`/integrations/workflow-tasks/${id}/reassign`, input);
  }

  async snoozeWorkflowTask(
    id: string,
    input: WorkflowTaskSnoozeRequest,
  ): Promise<WorkflowTaskRecord> {
    return this.post(`/integrations/workflow-tasks/${id}/snooze`, input);
  }

  async retryWorkflowTaskNotification(
    id: string,
    input: WorkflowTaskRetryNotificationRequest,
  ): Promise<WorkflowTaskRecord> {
    return this.post(
      `/integrations/workflow-tasks/${id}/retry-notification`,
      input,
    );
  }

  async createLead(input: CreateLeadRequest): Promise<Lead> {
    return this.post("/operations/leads", input);
  }

  async createProject(input: CreateProjectRequest): Promise<Project> {
    return this.post("/operations/projects", input);
  }

  async createServiceCase(
    input: CreateServiceCaseRequest,
  ): Promise<ServiceCase> {
    return this.post("/operations/service-cases", input);
  }

  async createLeaveRequest(
    input: CreateLeaveRequestRequest,
  ): Promise<LeaveRequest> {
    return this.post("/operations/leave-requests", input);
  }

  async closeServiceCase(id: string): Promise<ServiceCase> {
    return this.post(`/operations/service-cases/${id}/close`, {});
  }

  async transitionQuote(
    id: string,
    input: RecordTransitionRequest,
  ): Promise<Quote> {
    return this.patch(`/sales/quotes/${id}/status`, input);
  }

  async transitionOrder(
    id: string,
    input: RecordTransitionRequest,
  ): Promise<SalesOrder> {
    return this.patch(`/sales/orders/${id}/status`, input);
  }

  async transitionInvoice(
    id: string,
    input: InvoiceTransitionRequest,
  ): Promise<Invoice> {
    return this.patch(`/sales/invoices/${id}/status`, input);
  }

  async generateOrderFromQuote(id: string): Promise<SalesOrder> {
    return this.post(`/sales/quotes/${id}/order`, {});
  }

  async generateInvoiceFromOrder(id: string): Promise<Invoice> {
    return this.post(`/sales/orders/${id}/invoice`, {});
  }

  async webhookEvents(): Promise<WebhookEventContract[]> {
    return this.get("/webhooks/events");
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `ERP API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.write("POST", path, body);
  }

  private async patch<T>(path: string, body: unknown): Promise<T> {
    return this.write("PATCH", path, body);
  }

  private async write<T>(
    method: "PATCH" | "POST",
    path: string,
    body: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers({ "content-type": "application/json" }),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `ERP API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      accept: "application/json",
      ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      ...extra,
    };
  }
}
