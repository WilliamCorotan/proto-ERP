import "reflect-metadata";
import { fileURLToPath } from "node:url";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Injectable,
  Module,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { createDefaultRegistry } from "@erp/core";
import { accountingManifest } from "@erp/accounting";
import { commerceManifest } from "@erp/commerce";
import { hrManifest } from "@erp/hr";
import { inventoryManifest } from "@erp/inventory";
import { manufacturingManifest } from "@erp/manufacturing";
import { procurementManifest } from "@erp/procurement";
import { qualityManifest } from "@erp/quality";
import { reportingManifest } from "@erp/reporting";
import { integrationManifest } from "@erp/integration";
import { operationsManifest } from "@erp/operations";
import {
  ListSalesCustomersUseCase,
  SalesCustomerReadError,
  salesManifest,
  type ListSalesCustomersInput,
} from "@erp/sales";
import { createPrismaClient, PrismaSalesCustomerReadAdapter } from "@erp/db";
import {
  PrismaErpRepository,
  type CreateCustomerInput,
  type CreateProductInput,
  type UpdateCustomerInput,
  type UpdateProductInput,
} from "./repository.js";
import { AuthService } from "./auth.js";
import {
  CreateCustomerSchema,
  CreateAutomationRuleSchema,
  CreateCustomFieldSchema,
  CreateWorkflowEscalationRuleSchema,
  CreateWorkflowAssignmentRuleSchema,
  CreateCycleCountSchema,
  CreateBankTransactionSchema,
  CreateFixedAssetSchema,
  CreateEmployeeAdvanceSchema,
  CreateApiKeySchema,
  CreateLeadSchema,
  CreateLeaveRequestSchema,
  CreateMaterialRequestSchema,
  CreateProjectSchema,
  CreateProductSchema,
  CreateProductionPlanSchema,
  CreateQualityInspectionSchema,
  CompleteJobCardSchema,
  CheckoutPosSaleSchema,
  ClosePosShiftSchema,
  ConfirmPickTaskSchema,
  ConfirmPutAwayTaskSchema,
  CreateRecallSchema,
  CreateExportJobSchema,
  CreatePickListSchema,
  CreatePutAwayTasksSchema,
  CreateServiceCaseSchema,
  DispatchWebhookSchema,
  CreatePurchaseOrderSchema,
  CreatePrintFormatSchema,
  CreateSavedReportSchema,
  CreateStockReservationSchema,
  CreateStockTransferSchema,
  CreateSupplierSchema,
  CreateUserSchema,
  IdParamSchema,
  InvoiceTransitionSchema,
  AllocateLandedCostSchema,
  CloseFiscalPeriodSchema,
  IngestChannelOrderSchema,
  LoginSchema,
  ModuleToggleSchema,
  OpenPosShiftSchema,
  PackPickListSchema,
  PayEmployeeAdvanceSchema,
  parseBody,
  PreviewPrintFormatSchema,
  PreviewReportSchema,
  PublishChannelCatalogSchema,
  ReconcileBankAccountSchema,
  RecordAttendanceSchema,
  RecordPaymentSchema,
  RecordDowntimeSchema,
  RecordTransitionSchema,
  RunDepreciationSchema,
  RunPayrollSchema,
  RunReportSchema,
  SetExchangeRateSchema,
  ShipPackSchema,
  StartJobCardSchema,
  SubmitExpenseClaimSchema,
  ExpenseClaimStatusSchema,
  SupplierPaymentSchema,
  WorkflowActionsSchema,
  WorkflowInstanceLookupSchema,
  WorkflowTaskReassignSchema,
  WorkflowTaskRetryNotificationSchema,
  WorkflowTaskSnoozeSchema,
} from "./validation.js";
import { arrayOf, ref, webhookEventContracts } from "./contracts.js";
import { configureOpenApi } from "./openapi.js";
import {
  IntegrationUseCases,
  OperationsUseCases,
  WorkflowUseCases,
  type WorkflowInboxCandidate,
} from "./use-cases/index.js";

@Injectable()
class ErpReadService {
  private readonly registry = createDefaultRegistry([
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
  private readonly repository = new PrismaErpRepository();
  private readonly customerReadClient = createPrismaClient();
  private readonly listSalesCustomers = new ListSalesCustomersUseCase(
    new PrismaSalesCustomerReadAdapter(this.customerReadClient),
  );
  private readonly integrationUseCases = new IntegrationUseCases(
    this.repository,
  );
  private readonly operationsUseCases = new OperationsUseCases(this.repository);
  private readonly workflowUseCases = new WorkflowUseCases(
    this.registry.list(),
  );

  readiness() {
    return this.repository.readiness();
  }

  async dashboard(actor: { permissions: string[]; tenantId: string }) {
    const [tenant, sales, recentAudit, customization] = await Promise.all([
      this.repository.tenant(actor.tenantId),
      this.repository.sales(actor.tenantId),
      actor.permissions.includes("core.audit.read")
        ? this.repository.auditTrail(actor.tenantId)
        : Promise.resolve([]),
      this.repository.customization(actor.tenantId),
    ]);
    const modules = this.enabledModules(customization.enabledModules);
    const openPipeline = sales.quotes.reduce(
      (sum, quote) => sum + quote.total.amount,
      0,
    );
    const approvedOrders = sales.orders.filter(
      (order) => order.status === "approved",
    );
    const invoiceExposure = sales.invoices
      .filter((invoice) => invoice.status === "posted")
      .reduce((sum, invoice) => sum + invoice.total.amount, 0);
    const lowStock = sales.products.filter(
      (product) => product.stockOnHand < 50,
    ).length;

    return {
      tenant,
      metrics: [
        {
          label: "Open pipeline",
          value: money(openPipeline),
          trend: `${sales.quotes.length} active quote`,
        },
        {
          label: "Approved orders",
          value: String(approvedOrders.length),
          trend: `${money(sumOrders(approvedOrders))} committed`,
        },
        {
          label: "Invoice exposure",
          value: money(invoiceExposure),
          trend: `${sales.invoices.length} invoice record`,
        },
        {
          label: "Low stock",
          value: String(lowStock),
          trend: "products below target",
        },
      ],
      modules,
      navigation: modules
        .flatMap((module) => module.navigation)
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label)),
      recentAudit,
    };
  }

  async modules(tenantId: string) {
    const customization = await this.repository.customization(tenantId);
    return this.enabledModules(customization.enabledModules);
  }

  workflowPolicies() {
    return this.workflowUseCases.policies();
  }

  async workflowInbox(actor: {
    permissions: string[];
    roles: string[];
    sub: string;
    tenantId: string;
  }) {
    const [sales, procurement, customization] = await Promise.all([
      this.repository.sales(actor.tenantId),
      this.repository.procurement(actor.tenantId),
      this.repository.customization(actor.tenantId),
    ]);
    const candidates: WorkflowInboxCandidate[] = [
      ...sales.quotes.map((quote) => ({
        workflowId: "sales.quote",
        document: { entity: "Quote", id: quote.id },
        currentState: quote.status,
        title: quote.number,
        summary: `${quote.customerName} quote for ${money(quote.total.amount)}.`,
        amount: quote.total.amount,
        dueAt: dueDateTime(quote.validUntil),
        createdAt: dueDateTime(quote.validUntil),
      })),
      ...sales.orders.map((order) => ({
        workflowId: "sales.order",
        document: { entity: "SalesOrder", id: order.id },
        currentState: order.status,
        title: order.number,
        summary: `${order.customerName} order promised ${order.promisedDate}.`,
        amount: order.total.amount,
        dueAt: dueDateTime(order.promisedDate),
        createdAt: dueDateTime(order.promisedDate),
      })),
      ...sales.invoices.map((invoice) => ({
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: invoice.id },
        currentState: invoice.status,
        title: invoice.number,
        summary: `${invoice.customerName} invoice due ${invoice.dueDate}.`,
        amount: invoice.total.amount,
        dueAt: dueDateTime(invoice.dueDate),
        createdAt: dueDateTime(invoice.dueDate),
      })),
      ...procurement.purchaseOrders.map((order) => ({
        workflowId: "procurement.purchase-order",
        document: { entity: "PurchaseOrder", id: order.id },
        currentState: order.status,
        title: order.number,
        summary: `${order.supplierName} purchase order expected ${order.expectedDate}.`,
        amount: order.total.amount,
        dueAt: dueDateTime(order.expectedDate),
        createdAt: dueDateTime(order.expectedDate),
      })),
    ];

    const inbox = this.workflowUseCases.inbox(
      candidates,
      {
        permissions: actor.permissions,
        roles: actor.roles,
        userId: actor.sub,
      },
      undefined,
      {
        assignmentRules: customization.workflowAssignmentRules,
        escalationRules: customization.workflowEscalationRules,
      },
    );
    await this.repository.materializeWorkflowTasks(actor.tenantId, {
      tasks: inbox.tasks,
    });
    return inbox;
  }

  async workflowInstance(actor: { tenantId: string }, input: unknown) {
    return this.repository.workflowInstance(
      actor.tenantId,
      parseBody(WorkflowInstanceLookupSchema, input),
    );
  }

  async workflowActions(
    actor: {
      permissions: string[];
      roles: string[];
      sub: string;
      tenantId: string;
    },
    input: unknown,
  ) {
    try {
      const parsed = parseBody(WorkflowActionsSchema, input);
      const [currentState, customization, amount] = await Promise.all([
        parsed.currentState ??
          this.repository
            .workflowInstance(actor.tenantId, parsed)
            .then((instance) => instance?.state),
        this.repository.customization(actor.tenantId),
        this.workflowDocumentAmount(
          actor.tenantId,
          parsed.workflowId,
          parsed.document,
        ),
      ]);
      if (!currentState) {
        throw new BadRequestException(
          `Workflow instance not found: ${parsed.workflowId} ${parsed.document.entity} ${parsed.document.id}`,
        );
      }
      return this.workflowUseCases.actions(
        {
          ...parsed,
          currentState,
          amount,
        },
        {
          permissions: actor.permissions,
          roles: actor.roles,
          userId: actor.sub,
        },
        {
          assignmentRules: customization.workflowAssignmentRules,
          escalationRules: customization.workflowEscalationRules,
        },
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async workflowDocumentAmount(
    tenantId: string,
    workflowId: string,
    document: { entity: string; id: string },
  ): Promise<number | null> {
    if (workflowId === "procurement.purchase-order") {
      const procurement = await this.repository.procurement(tenantId);
      return (
        procurement.purchaseOrders.find((order) => order.id === document.id)
          ?.total.amount ?? null
      );
    }

    if (
      workflowId === "sales.quote" ||
      workflowId === "sales.order" ||
      workflowId === "sales.invoice"
    ) {
      const sales = await this.repository.sales(tenantId);
      if (workflowId === "sales.quote") {
        return (
          sales.quotes.find((quote) => quote.id === document.id)?.total
            .amount ?? null
        );
      }
      if (workflowId === "sales.order") {
        return (
          sales.orders.find((order) => order.id === document.id)?.total
            .amount ?? null
        );
      }
      return (
        sales.invoices.find((invoice) => invoice.id === document.id)?.total
          .amount ?? null
      );
    }

    return null;
  }

  private async publishWorkflowTransitionCompleted(
    tenantId: string,
    result: {
      workflowId: string;
      document: { entity: string; id: string };
      previousState: string;
      currentState: string;
      transition: unknown;
    },
  ) {
    await this.repository.completeWorkflowTask(tenantId, {
      workflowId: result.workflowId,
      entity: result.document.entity,
      documentId: result.document.id,
      completedAction: result.currentState,
      previousState: result.previousState,
      currentState: result.currentState,
    });
    await this.repository.publishOutboxEvent(tenantId, {
      eventType: "workflow.transition.completed",
      payload: {
        ...result,
        idempotencyKey: `${result.workflowId}:${result.document.entity}:${result.document.id}:${result.currentState}:transition-completed`,
      },
    });
  }

  private evaluateDocumentWorkflowTransition(
    actor: { permissions: string[]; roles: string[]; sub: string },
    input: {
      workflowId: string;
      entity: string;
      id: string;
      currentState: string;
      targetState: string;
      reason: string;
      comment?: string | undefined;
    },
  ) {
    try {
      const result = this.workflowUseCases.transition(
        {
          workflowId: input.workflowId,
          document: { entity: input.entity, id: input.id },
          currentState: input.currentState,
          targetState: input.targetState,
          reason: input.reason,
          comment: input.comment,
        },
        {
          permissions: actor.permissions,
          roles: actor.roles,
          userId: actor.sub,
        },
      );
      return result.transition ?? undefined;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  async sales(tenantId: string) {
    return this.repository.sales(tenantId);
  }

  async salesCustomers(tenantId: string, input: ListSalesCustomersInput) {
    return this.listSalesCustomers.execute(tenantId, input);
  }

  async accounting(tenantId: string) {
    return this.repository.accounting(tenantId);
  }

  async procurement(tenantId: string) {
    return this.repository.procurement(tenantId);
  }

  async inventory(tenantId: string) {
    return this.repository.inventory(tenantId);
  }

  async manufacturing(tenantId: string) {
    return this.repository.manufacturing(tenantId);
  }

  async quality(tenantId: string) {
    return this.repository.quality(tenantId);
  }

  async commerce(tenantId: string) {
    return this.repository.commerce(tenantId);
  }

  async hr(tenantId: string) {
    return this.repository.hr(tenantId);
  }

  async reporting(tenantId: string) {
    return this.repository.reporting(tenantId);
  }

  async integration(tenantId: string) {
    return this.integrationUseCases.snapshot(tenantId);
  }

  async operations(tenantId: string) {
    return this.operationsUseCases.snapshot(tenantId);
  }

  async customization(tenantId: string) {
    return this.repository.customization(tenantId);
  }

  async createCustomer(tenantId: string, input: CreateCustomerInput) {
    return this.repository.createCustomer(tenantId, input);
  }

  async createProduct(tenantId: string, input: CreateProductInput) {
    return this.repository.createProduct(tenantId, input);
  }

  async updateCustomer(tenantId: string, input: UpdateCustomerInput) {
    return this.repository.updateCustomer(tenantId, input);
  }

  async updateProduct(tenantId: string, input: UpdateProductInput) {
    return this.repository.updateProduct(tenantId, input);
  }

  async transitionQuote(
    actor: {
      permissions: string[];
      roles: string[];
      sub: string;
      tenantId: string;
    },
    id: string,
    status: string,
    comment?: string,
  ) {
    const sales = await this.repository.sales(actor.tenantId);
    const quote = sales.quotes.find((record) => record.id === id);
    if (!quote) {
      throw new BadRequestException(`Quote not found: ${id}`);
    }
    const transition = this.evaluateDocumentWorkflowTransition(actor, {
      workflowId: "sales.quote",
      entity: "Quote",
      id,
      currentState: quote.status,
      targetState: status,
      reason: "Quote status update",
      comment,
    });
    const updated = await this.repository.transitionQuote(actor.tenantId, {
      id,
      status,
      workflowTransition: transition,
    });
    await this.publishWorkflowTransitionCompleted(actor.tenantId, {
      workflowId: "sales.quote",
      document: { entity: "Quote", id },
      previousState: quote.status,
      currentState: status,
      transition: transition ?? null,
    });
    return updated;
  }

  async transitionOrder(
    actor: {
      permissions: string[];
      roles: string[];
      sub: string;
      tenantId: string;
    },
    id: string,
    status: string,
    comment?: string,
  ) {
    const sales = await this.repository.sales(actor.tenantId);
    const order = sales.orders.find((record) => record.id === id);
    if (!order) {
      throw new BadRequestException(`Sales order not found: ${id}`);
    }
    const transition = this.evaluateDocumentWorkflowTransition(actor, {
      workflowId: "sales.order",
      entity: "SalesOrder",
      id,
      currentState: order.status,
      targetState: status,
      reason: "Sales order status update",
      comment,
    });
    const updated = await this.repository.transitionOrder(actor.tenantId, {
      id,
      status,
      workflowTransition: transition,
    });
    await this.publishWorkflowTransitionCompleted(actor.tenantId, {
      workflowId: "sales.order",
      document: { entity: "SalesOrder", id },
      previousState: order.status,
      currentState: status,
      transition: transition ?? null,
    });
    return updated;
  }

  async transitionInvoice(
    actor: {
      permissions: string[];
      roles: string[];
      sub: string;
      tenantId: string;
    },
    id: string,
    status: string,
    comment?: string,
  ) {
    const sales = await this.repository.sales(actor.tenantId);
    const invoice = sales.invoices.find((record) => record.id === id);
    if (!invoice) {
      throw new BadRequestException(`Invoice not found: ${id}`);
    }
    const transition = this.evaluateDocumentWorkflowTransition(actor, {
      workflowId: "sales.invoice",
      entity: "Invoice",
      id,
      currentState: invoice.status,
      targetState: status,
      reason: "Invoice status update",
      comment,
    });
    const updated = await this.repository.transitionInvoice(actor.tenantId, {
      id,
      status,
      workflowTransition: transition,
    });
    await this.publishWorkflowTransitionCompleted(actor.tenantId, {
      workflowId: "sales.invoice",
      document: { entity: "Invoice", id },
      previousState: invoice.status,
      currentState: status,
      transition: transition ?? null,
    });
    return updated;
  }

  async generateOrderFromQuote(tenantId: string, quoteId: string) {
    return this.repository.generateOrderFromQuote(tenantId, quoteId);
  }

  async generateInvoiceFromOrder(tenantId: string, orderId: string) {
    return this.repository.generateInvoiceFromOrder(tenantId, orderId);
  }

  async createCustomField(tenantId: string, input: unknown) {
    return this.repository.createCustomField(
      tenantId,
      parseBody(CreateCustomFieldSchema, input),
    );
  }

  async createAutomationRule(tenantId: string, input: unknown) {
    return this.repository.createAutomationRule(
      tenantId,
      parseBody(CreateAutomationRuleSchema, input),
    );
  }

  async createWorkflowAssignmentRule(tenantId: string, input: unknown) {
    return this.repository.createWorkflowAssignmentRule(
      tenantId,
      parseBody(CreateWorkflowAssignmentRuleSchema, input),
    );
  }

  async createWorkflowEscalationRule(tenantId: string, input: unknown) {
    return this.repository.createWorkflowEscalationRule(
      tenantId,
      parseBody(CreateWorkflowEscalationRuleSchema, input),
    );
  }

  async setModuleEnabled(tenantId: string, moduleId: string, enabled: boolean) {
    return this.repository.setModuleEnabled(tenantId, moduleId, enabled);
  }

  async recordPayment(tenantId: string, input: unknown) {
    return this.repository.recordPayment(
      tenantId,
      parseBody(RecordPaymentSchema, input),
    );
  }

  async createBankTransaction(tenantId: string, input: unknown) {
    return this.repository.createBankTransaction(
      tenantId,
      parseBody(CreateBankTransactionSchema, input),
    );
  }

  async reconcileBankAccount(tenantId: string, input: unknown) {
    return this.repository.reconcileBankAccount(
      tenantId,
      parseBody(ReconcileBankAccountSchema, input),
    );
  }

  async closeFiscalPeriod(tenantId: string, input: unknown) {
    return this.repository.closeFiscalPeriod(
      tenantId,
      parseBody(CloseFiscalPeriodSchema, input),
    );
  }

  async allocateLandedCost(tenantId: string, input: unknown) {
    return this.repository.allocateLandedCost(
      tenantId,
      parseBody(AllocateLandedCostSchema, input),
    );
  }

  async createFixedAsset(tenantId: string, input: unknown) {
    return this.repository.createFixedAsset(
      tenantId,
      parseBody(CreateFixedAssetSchema, input),
    );
  }

  async runDepreciation(tenantId: string, input: unknown) {
    return this.repository.runDepreciation(
      tenantId,
      parseBody(RunDepreciationSchema, input),
    );
  }

  async setExchangeRate(tenantId: string, input: unknown) {
    return this.repository.setExchangeRate(
      tenantId,
      parseBody(SetExchangeRateSchema, input),
    );
  }

  async createSupplier(tenantId: string, input: unknown) {
    return this.repository.createSupplier(
      tenantId,
      parseBody(CreateSupplierSchema, input),
    );
  }

  async createMaterialRequest(tenantId: string, input: unknown) {
    return this.repository.createMaterialRequest(
      tenantId,
      parseBody(CreateMaterialRequestSchema, input),
    );
  }

  async createPurchaseOrder(tenantId: string, input: unknown) {
    return this.repository.createPurchaseOrder(
      tenantId,
      parseBody(CreatePurchaseOrderSchema, input),
    );
  }

  async transitionPurchaseOrder(
    actor: {
      permissions: string[];
      roles: string[];
      sub: string;
      tenantId: string;
    },
    id: string,
    status: string,
    comment?: string,
  ) {
    const procurement = await this.repository.procurement(actor.tenantId);
    const order = procurement.purchaseOrders.find((record) => record.id === id);
    if (!order) {
      throw new BadRequestException(`Purchase order not found: ${id}`);
    }
    let result;
    try {
      result = this.workflowUseCases.transition(
        {
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id },
          currentState: order.status,
          targetState: status,
          reason: "Purchase order status update",
          comment,
        },
        {
          permissions: actor.permissions,
          roles: actor.roles,
          userId: actor.sub,
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    const updated = await this.repository.transitionPurchaseOrder(
      actor.tenantId,
      {
        id,
        status,
        workflowTransition: result.transition ?? undefined,
      },
    );
    await this.publishWorkflowTransitionCompleted(actor.tenantId, {
      workflowId: "procurement.purchase-order",
      document: { entity: "PurchaseOrder", id },
      previousState: order.status,
      currentState: status,
      transition: result.transition ?? null,
    });
    return updated;
  }

  async receivePurchaseOrder(tenantId: string, id: string) {
    return this.repository.receivePurchaseOrder(tenantId, id);
  }

  async createPurchaseInvoiceFromOrder(tenantId: string, id: string) {
    return this.repository.createPurchaseInvoiceFromOrder(tenantId, id);
  }

  async payPurchaseInvoice(tenantId: string, input: unknown) {
    return this.repository.payPurchaseInvoice(
      tenantId,
      parseBody(SupplierPaymentSchema, input),
    );
  }

  async reserveStock(tenantId: string, input: unknown) {
    return this.repository.reserveStock(
      tenantId,
      parseBody(CreateStockReservationSchema, input),
    );
  }

  async transferStock(tenantId: string, input: unknown) {
    return this.repository.transferStock(
      tenantId,
      parseBody(CreateStockTransferSchema, input),
    );
  }

  async postCycleCount(tenantId: string, input: unknown) {
    return this.repository.postCycleCount(
      tenantId,
      parseBody(CreateCycleCountSchema, input),
    );
  }

  async createPickList(tenantId: string, input: unknown) {
    return this.repository.createPickList(
      tenantId,
      parseBody(CreatePickListSchema, input),
    );
  }

  async confirmPickTask(tenantId: string, input: unknown) {
    return this.repository.confirmPickTask(
      tenantId,
      parseBody(ConfirmPickTaskSchema, input),
    );
  }

  async packPickList(tenantId: string, input: unknown) {
    return this.repository.packPickList(
      tenantId,
      parseBody(PackPickListSchema, input),
    );
  }

  async shipPackRecord(tenantId: string, input: unknown) {
    return this.repository.shipPackRecord(
      tenantId,
      parseBody(ShipPackSchema, input),
    );
  }

  async createPutAwayTasks(tenantId: string, input: unknown) {
    return this.repository.createPutAwayTasks(
      tenantId,
      parseBody(CreatePutAwayTasksSchema, input),
    );
  }

  async confirmPutAwayTask(tenantId: string, input: unknown) {
    return this.repository.confirmPutAwayTask(
      tenantId,
      parseBody(ConfirmPutAwayTaskSchema, input),
    );
  }

  async createProductionPlan(tenantId: string, input: unknown) {
    return this.repository.createProductionPlan(
      tenantId,
      parseBody(CreateProductionPlanSchema, input),
    );
  }

  async createWorkOrderFromSuggestion(tenantId: string, id: string) {
    return this.repository.createWorkOrderFromSuggestion(tenantId, id);
  }

  async releaseWorkOrder(tenantId: string, id: string) {
    return this.repository.releaseWorkOrder(tenantId, id);
  }

  async startJobCard(tenantId: string, input: unknown) {
    return this.repository.startJobCard(
      tenantId,
      parseBody(StartJobCardSchema, input),
    );
  }

  async completeJobCard(tenantId: string, input: unknown) {
    return this.repository.completeJobCard(
      tenantId,
      parseBody(CompleteJobCardSchema, input),
    );
  }

  async recordDowntime(tenantId: string, input: unknown) {
    return this.repository.recordDowntime(
      tenantId,
      parseBody(RecordDowntimeSchema, input),
    );
  }

  async completeWorkOrder(tenantId: string, id: string) {
    return this.repository.completeWorkOrder(tenantId, id);
  }

  async traceGenealogy(tenantId: string, id: string) {
    return this.repository.traceGenealogy(tenantId, id);
  }

  async createQualityInspection(tenantId: string, input: unknown) {
    return this.repository.createQualityInspection(
      tenantId,
      parseBody(CreateQualityInspectionSchema, input),
    );
  }

  async createRecall(tenantId: string, input: unknown) {
    return this.repository.createRecall(
      tenantId,
      parseBody(CreateRecallSchema, input),
    );
  }

  async openPosShift(tenantId: string, input: unknown) {
    return this.repository.openPosShift(
      tenantId,
      parseBody(OpenPosShiftSchema, input),
    );
  }

  async closePosShift(tenantId: string, input: unknown) {
    return this.repository.closePosShift(
      tenantId,
      parseBody(ClosePosShiftSchema, input),
    );
  }

  async checkoutPosSale(tenantId: string, input: unknown) {
    return this.repository.checkoutPosSale(
      tenantId,
      parseBody(CheckoutPosSaleSchema, input),
    );
  }

  async publishChannelCatalog(tenantId: string, input: unknown) {
    return this.repository.publishChannelCatalog(
      tenantId,
      parseBody(PublishChannelCatalogSchema, input),
    );
  }

  async ingestChannelOrder(tenantId: string, input: unknown) {
    return this.repository.ingestChannelOrder(
      tenantId,
      parseBody(IngestChannelOrderSchema, input),
    );
  }

  async recordAttendance(tenantId: string, input: unknown) {
    return this.repository.recordAttendance(
      tenantId,
      parseBody(RecordAttendanceSchema, input),
    );
  }

  async submitExpenseClaim(tenantId: string, input: unknown) {
    return this.repository.submitExpenseClaim(
      tenantId,
      parseBody(SubmitExpenseClaimSchema, input),
    );
  }

  async approveExpenseClaim(tenantId: string, input: unknown) {
    return this.repository.approveExpenseClaim(
      tenantId,
      parseBody(ExpenseClaimStatusSchema, input),
    );
  }

  async payExpenseClaim(tenantId: string, input: unknown) {
    return this.repository.payExpenseClaim(
      tenantId,
      parseBody(ExpenseClaimStatusSchema, input),
    );
  }

  async createEmployeeAdvance(tenantId: string, input: unknown) {
    return this.repository.createEmployeeAdvance(
      tenantId,
      parseBody(CreateEmployeeAdvanceSchema, input),
    );
  }

  async payEmployeeAdvance(tenantId: string, input: unknown) {
    return this.repository.payEmployeeAdvance(
      tenantId,
      parseBody(PayEmployeeAdvanceSchema, input),
    );
  }

  async runPayroll(tenantId: string, input: unknown) {
    return this.repository.runPayroll(
      tenantId,
      parseBody(RunPayrollSchema, input),
    );
  }

  async createSavedReport(tenantId: string, input: unknown) {
    return this.repository.createSavedReport(
      tenantId,
      parseBody(CreateSavedReportSchema, input),
    );
  }

  async runReport(tenantId: string, input: unknown) {
    return this.repository.runReport(
      tenantId,
      parseBody(RunReportSchema, input),
    );
  }

  async previewReport(tenantId: string, input: unknown) {
    return this.repository.previewReport(
      tenantId,
      parseBody(PreviewReportSchema, input),
    );
  }

  async createExportJob(tenantId: string, input: unknown) {
    return this.repository.createExportJob(
      tenantId,
      parseBody(CreateExportJobSchema, input),
    );
  }

  async createPrintFormat(tenantId: string, input: unknown) {
    return this.repository.createPrintFormat(
      tenantId,
      parseBody(CreatePrintFormatSchema, input),
    );
  }

  async previewPrintFormat(tenantId: string, input: unknown) {
    return this.repository.previewPrintFormat(
      tenantId,
      parseBody(PreviewPrintFormatSchema, input),
    );
  }

  async createApiKey(tenantId: string, input: unknown) {
    return this.integrationUseCases.createApiKey(
      tenantId,
      parseBody(CreateApiKeySchema, input),
    );
  }

  async dispatchWebhook(tenantId: string, input: unknown) {
    return this.integrationUseCases.dispatchWebhook(
      tenantId,
      parseBody(DispatchWebhookSchema, input),
    );
  }

  async retryWebhookDelivery(tenantId: string, id: string) {
    return this.integrationUseCases.retryWebhookDelivery(tenantId, id);
  }

  async dispatchOutboxEvent(tenantId: string, id: string) {
    return this.integrationUseCases.dispatchOutboxEvent(tenantId, id);
  }

  async reassignWorkflowTask(tenantId: string, id: string, input: unknown) {
    return this.integrationUseCases.reassignWorkflowTask(tenantId, {
      taskId: id,
      ...parseBody(WorkflowTaskReassignSchema, input),
    });
  }

  async snoozeWorkflowTask(tenantId: string, id: string, input: unknown) {
    return this.integrationUseCases.snoozeWorkflowTask(tenantId, {
      taskId: id,
      ...parseBody(WorkflowTaskSnoozeSchema, input),
    });
  }

  async retryWorkflowTaskNotification(
    tenantId: string,
    id: string,
    input: unknown,
  ) {
    return this.integrationUseCases.retryWorkflowTaskNotification(tenantId, {
      taskId: id,
      ...parseBody(WorkflowTaskRetryNotificationSchema, input),
    });
  }

  async createLead(tenantId: string, input: unknown) {
    return this.operationsUseCases.createLead(
      tenantId,
      parseBody(CreateLeadSchema, input),
    );
  }

  async createProject(tenantId: string, input: unknown) {
    return this.operationsUseCases.createProject(
      tenantId,
      parseBody(CreateProjectSchema, input),
    );
  }

  async createServiceCase(tenantId: string, input: unknown) {
    return this.operationsUseCases.createServiceCase(
      tenantId,
      parseBody(CreateServiceCaseSchema, input),
    );
  }

  async createLeaveRequest(tenantId: string, input: unknown) {
    return this.operationsUseCases.createLeaveRequest(
      tenantId,
      parseBody(CreateLeaveRequestSchema, input),
    );
  }

  async closeServiceCase(tenantId: string, id: string) {
    return this.operationsUseCases.closeServiceCase(tenantId, id);
  }

  webhookEvents() {
    return webhookEventContracts;
  }

  private enabledModules(enabledModules: string[]) {
    const enabled = new Set(["core", ...enabledModules]);
    return this.registry.list().filter((module) => enabled.has(module.id));
  }
}

@ApiTags("erp")
@Controller()
export class ErpController {
  constructor(
    @Inject(ErpReadService) private readonly reads: ErpReadService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  @ApiTags("system")
  @ApiOperation({ summary: "Health check" })
  @ApiOkResponse({ schema: ref("HealthResponse") })
  @Get("health")
  async health() {
    try {
      await this.reads.readiness();
      return { status: "ok", service: "erp-api" };
    } catch {
      throw new ServiceUnavailableException("Database is unavailable.");
    }
  }

  @ApiTags("dashboard")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get dashboard summary" })
  @ApiOkResponse({ schema: ref("DashboardSummary") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Get("dashboard")
  async dashboard(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.customer.read",
    );
    return this.reads.dashboard(session);
  }

  @ApiTags("modules")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List registered ERP modules" })
  @ApiOkResponse({ schema: arrayOf(ref("ModuleManifest")) })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Get("modules")
  modules(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.currentUser(authorization);
    return this.reads.modules(session.tenantId);
  }

  @ApiTags("workflows")
  @ApiOperation({ summary: "List registered workflow policies" })
  @ApiOkResponse({ schema: arrayOf(ref("WorkflowPolicy")) })
  @Get("workflows")
  workflowPolicies() {
    return this.reads.workflowPolicies();
  }

  @ApiTags("workflows")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List actionable workflow tasks for the current user",
  })
  @ApiOkResponse({ schema: ref("WorkflowInboxResponse") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Get("workflows/inbox")
  workflowInbox(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.currentUser(authorization);
    return this.reads.workflowInbox(session);
  }

  @ApiTags("workflows")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get a persisted workflow instance and transition history",
  })
  @ApiBody({ schema: ref("WorkflowInstanceLookupRequest") })
  @ApiOkResponse({
    schema: { oneOf: [ref("WorkflowInstance"), { type: "null" }] },
  })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Post("workflows/instances/lookup")
  workflowInstance(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.currentUser(authorization);
    return this.reads.workflowInstance(session, body);
  }

  @ApiTags("workflows")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get workflow actions allowed for the current user and document state",
  })
  @ApiBody({ schema: ref("WorkflowActionsRequest") })
  @ApiOkResponse({ schema: ref("WorkflowActionsResponse") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("workflows/actions")
  workflowActions(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.currentUser(authorization);
    return this.reads.workflowActions(session, body);
  }

  @ApiTags("workflows")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Generic workflow transitions are disabled",
    description:
      "Use the entity-specific quote, sales order, invoice, or purchase-order transition endpoint.",
    deprecated: true,
  })
  @ApiBody({ schema: ref("WorkflowTransitionRequest") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiResponse({
    status: 501,
    description:
      "Generic workflow transitions are disabled; use an entity-specific transition endpoint.",
    schema: ref("ErrorResponse"),
  })
  @Post("workflows/transitions")
  workflowTransition(
    @Headers("authorization") authorization: string | undefined,
  ) {
    this.auth.currentUser(authorization);
    throw new NotImplementedException(
      "Generic workflow transitions are disabled; use an entity-specific transition endpoint.",
    );
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get sales dashboard data" })
  @ApiOkResponse({ schema: ref("SalesSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Get("sales")
  async sales(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.customer.read",
    );
    return this.reads.sales(session.tenantId);
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List customers with bounded cursor pagination" })
  @ApiQuery({ name: "after", required: false, schema: { type: "string" } })
  @ApiQuery({
    name: "limit",
    required: false,
    schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
  })
  @ApiQuery({
    name: "search",
    required: false,
    schema: { type: "string", maxLength: 100 },
  })
  @ApiQuery({
    name: "status",
    required: false,
    schema: { type: "string", enum: ["active", "paused"] },
  })
  @ApiOkResponse({ schema: ref("SalesCustomerPage") })
  @ApiBadRequestResponse({ schema: ref("ErrorResponse") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("sales/customers")
  async salesCustomers(
    @Headers("authorization") authorization: string | undefined,
    @Query() query: ListSalesCustomersInput,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.customer.read",
    );
    try {
      return await this.reads.salesCustomers(session.tenantId, query);
    } catch (error) {
      if (error instanceof SalesCustomerReadError) {
        throw new BadRequestException({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get accounting snapshot and trial balance" })
  @ApiOkResponse({ schema: ref("AccountingSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("accounting")
  async accounting(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.read",
    );
    return this.reads.accounting(session.tenantId);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get procurement snapshot" })
  @ApiOkResponse({ schema: ref("ProcurementSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("procurement")
  async procurement(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.read",
    );
    return this.reads.procurement(session.tenantId);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get inventory warehouse, bin, ledger, reservation, and valuation data",
  })
  @ApiOkResponse({ schema: ref("InventorySnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("inventory")
  async inventory(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.read",
    );
    return this.reads.inventory(session.tenantId);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get manufacturing BOM, routing, plan, work order, and MRP data",
  })
  @ApiOkResponse({ schema: ref("ManufacturingSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("manufacturing")
  async manufacturing(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.read",
    );
    return this.reads.manufacturing(session.tenantId);
  }

  @ApiTags("quality")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get traceability, inspections, non-conformance, CAPA, scorecard, and recall data",
  })
  @ApiOkResponse({ schema: ref("QualitySnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("quality")
  async quality(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(authorization, "quality.read");
    return this.reads.quality(session.tenantId);
  }

  @ApiTags("commerce")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS registers, shifts, catalog, and channel order data",
  })
  @ApiOkResponse({ schema: ref("CommerceSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("commerce")
  async commerce(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(authorization, "commerce.read");
    return this.reads.commerce(session.tenantId);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get saved reports, runs, print formats, exports, dashboards, and scheduled deliveries",
  })
  @ApiOkResponse({ schema: ref("ReportingSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("reports")
  async reporting(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.read",
    );
    return this.reads.reporting(session.tenantId);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get API keys, webhook health, mappings, dead letters, and connector catalog",
  })
  @ApiOkResponse({ schema: ref("IntegrationSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("integrations")
  async integration(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.read",
    );
    return this.reads.integration(session.tenantId);
  }

  @ApiTags("operations")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get CRM, projects, HR leave, and service operations",
  })
  @ApiOkResponse({ schema: ref("OperationsSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("operations")
  async operations(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "operations.read",
    );
    return this.reads.operations(session.tenantId);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get attendance, expense, advance, salary, payroll, and payslip data",
  })
  @ApiOkResponse({ schema: ref("HrSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("hr")
  async hr(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(authorization, "hr.read");
    return this.reads.hr(session.tenantId);
  }

  @ApiTags("customization")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tenant customization metadata" })
  @ApiOkResponse({ schema: ref("CustomizationSnapshot") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Get("customization")
  async customization(
    @Headers("authorization") authorization: string | undefined,
  ) {
    const session = this.auth.currentUser(authorization);
    return this.reads.customization(session.tenantId);
  }

  @ApiTags("auth")
  @ApiOperation({ summary: "Create an authenticated session" })
  @ApiBody({ schema: ref("LoginRequest") })
  @ApiOkResponse({ schema: ref("AuthSession") })
  @Post("auth/login")
  async login(@Body() body: unknown) {
    return this.auth.login(parseBody(LoginSchema, body));
  }

  @ApiTags("auth")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current authenticated user" })
  @ApiOkResponse({ schema: ref("AuthTokenPayload") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @Get("auth/me")
  me(@Headers("authorization") authorization: string | undefined) {
    return this.auth.currentUser(authorization);
  }

  @ApiTags("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List tenant users" })
  @ApiOkResponse({ schema: arrayOf(ref("AdminUser")) })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("admin/users")
  async users(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.auth.users(session.tenantId);
  }

  @ApiTags("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List tenant roles" })
  @ApiOkResponse({ schema: arrayOf(ref("AdminRole")) })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("admin/roles")
  async roles(@Headers("authorization") authorization: string | undefined) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.auth.roles(session.tenantId);
  }

  @ApiTags("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a tenant user" })
  @ApiBody({ schema: ref("CreateUserRequest") })
  @ApiCreatedResponse({ schema: ref("AdminUser") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("admin/users")
  async createUser(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.auth.createUser(
      session.tenantId,
      parseBody(CreateUserSchema, body),
    );
  }

  @ApiTags("customization")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update a custom field definition" })
  @ApiBody({ schema: ref("CreateCustomFieldRequest") })
  @ApiCreatedResponse({ schema: ref("CustomFieldDefinition") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("customization/custom-fields")
  async createCustomField(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.reads.createCustomField(session.tenantId, body);
  }

  @ApiTags("customization")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create or update an event-triggered automation rule",
  })
  @ApiBody({ schema: ref("CreateAutomationRuleRequest") })
  @ApiCreatedResponse({ schema: ref("AutomationRule") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("customization/automation-rules")
  async createAutomationRule(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.reads.createAutomationRule(session.tenantId, body);
  }

  @ApiTags("customization")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update a workflow assignment rule" })
  @ApiBody({ schema: ref("CreateWorkflowAssignmentRuleRequest") })
  @ApiCreatedResponse({ schema: ref("WorkflowAssignmentRule") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("customization/workflow-assignment-rules")
  async createWorkflowAssignmentRule(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.reads.createWorkflowAssignmentRule(session.tenantId, body);
  }

  @ApiTags("customization")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update a workflow escalation rule" })
  @ApiBody({ schema: ref("CreateWorkflowEscalationRuleRequest") })
  @ApiCreatedResponse({ schema: ref("WorkflowEscalationRule") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("customization/workflow-escalation-rules")
  async createWorkflowEscalationRule(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    return this.reads.createWorkflowEscalationRule(session.tenantId, body);
  }

  @ApiTags("customization")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enable or disable a module for the tenant" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("ModuleToggleRequest") })
  @ApiOkResponse({ schema: ref("EnabledModulesResponse") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("customization/modules/:id")
  async setModuleEnabled(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "core.admin");
    const { id } = parseBody(IdParamSchema, params);
    const { enabled } = parseBody(ModuleToggleSchema, body);
    const enabledModules = await this.reads.setModuleEnabled(
      session.tenantId,
      id,
      enabled,
    );
    return { enabledModules };
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Record an invoice payment" })
  @ApiBody({ schema: ref("RecordPaymentRequest") })
  @ApiCreatedResponse({ schema: ref("Payment") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/payments")
  async recordPayment(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.recordPayment(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a bank transaction for reconciliation" })
  @ApiBody({ schema: ref("CreateBankTransactionRequest") })
  @ApiCreatedResponse({ schema: ref("BankTransaction") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/bank-transactions")
  async createBankTransaction(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.createBankTransaction(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reconcile bank transactions against a statement balance",
  })
  @ApiBody({ schema: ref("ReconcileBankAccountRequest") })
  @ApiCreatedResponse({ schema: ref("BankReconciliation") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/bank-reconciliations")
  async reconcileBankAccount(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.reconcileBankAccount(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Close a fiscal period" })
  @ApiBody({ schema: ref("CloseFiscalPeriodRequest") })
  @ApiCreatedResponse({ schema: ref("PeriodClose") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/period-closes")
  async closeFiscalPeriod(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.closeFiscalPeriod(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Allocate landed costs to a purchase receipt" })
  @ApiBody({ schema: ref("AllocateLandedCostRequest") })
  @ApiCreatedResponse({ schema: ref("LandedCostAllocation") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/landed-cost-allocations")
  async allocateLandedCost(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.allocateLandedCost(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a fixed asset and capitalize it" })
  @ApiBody({ schema: ref("CreateFixedAssetRequest") })
  @ApiCreatedResponse({ schema: ref("FixedAsset") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/fixed-assets")
  async createFixedAsset(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.createFixedAsset(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Post depreciation for a fixed asset" })
  @ApiBody({ schema: ref("RunDepreciationRequest") })
  @ApiCreatedResponse({ schema: ref("DepreciationRun") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/depreciation-runs")
  async runDepreciation(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.runDepreciation(session.tenantId, body);
  }

  @ApiTags("accounting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update an exchange rate" })
  @ApiBody({ schema: ref("SetExchangeRateRequest") })
  @ApiCreatedResponse({ schema: ref("ExchangeRate") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("accounting/exchange-rates")
  async setExchangeRate(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "accounting.manage",
    );
    return this.reads.setExchangeRate(session.tenantId, body);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a supplier" })
  @ApiBody({ schema: ref("CreateSupplierRequest") })
  @ApiCreatedResponse({ schema: ref("Supplier") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("procurement/suppliers")
  async createSupplier(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.manage",
    );
    return this.reads.createSupplier(session.tenantId, body);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a material request" })
  @ApiBody({ schema: ref("CreateMaterialRequestRequest") })
  @ApiCreatedResponse({ schema: ref("MaterialRequest") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("procurement/material-requests")
  async createMaterialRequest(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.manage",
    );
    return this.reads.createMaterialRequest(session.tenantId, body);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a purchase order" })
  @ApiBody({ schema: ref("CreatePurchaseOrderRequest") })
  @ApiCreatedResponse({ schema: ref("PurchaseOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("procurement/purchase-orders")
  async createPurchaseOrder(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.manage",
    );
    return this.reads.createPurchaseOrder(session.tenantId, body);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Transition a purchase order" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("RecordTransitionRequest") })
  @ApiOkResponse({ schema: ref("PurchaseOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("procurement/purchase-orders/:id/status")
  async transitionPurchaseOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    const { comment, status } = parseBody(RecordTransitionSchema, body);
    return this.reads.transitionPurchaseOrder(session, id, status, comment);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Receive an approved purchase order" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiCreatedResponse({ schema: ref("PurchaseReceipt") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("procurement/purchase-orders/:id/receipt")
  async receivePurchaseOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.receivePurchaseOrder(session.tenantId, id);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a supplier invoice from a purchase order" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiCreatedResponse({ schema: ref("PurchaseInvoice") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("procurement/purchase-orders/:id/invoice")
  async createPurchaseInvoiceFromOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.ap.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.createPurchaseInvoiceFromOrder(session.tenantId, id);
  }

  @ApiTags("procurement")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Pay a supplier invoice" })
  @ApiBody({ schema: ref("SupplierPaymentRequest") })
  @ApiCreatedResponse({ schema: ref("SupplierPayment") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("procurement/supplier-payments")
  async payPurchaseInvoice(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "procurement.ap.manage",
    );
    return this.reads.payPurchaseInvoice(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reserve available stock for a source document" })
  @ApiBody({ schema: ref("CreateStockReservationRequest") })
  @ApiCreatedResponse({ schema: ref("StockReservation") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/reservations")
  async reserveStock(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.reserveStock(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Transfer stock between bins" })
  @ApiBody({ schema: ref("CreateStockTransferRequest") })
  @ApiCreatedResponse({ schema: ref("StockTransfer") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/transfers")
  async transferStock(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.transferStock(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Post a cycle count and stock variance" })
  @ApiBody({ schema: ref("CreateCycleCountRequest") })
  @ApiCreatedResponse({ schema: ref("CycleCount") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/cycle-counts")
  async postCycleCount(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.postCycleCount(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a pick list from a sales order" })
  @ApiBody({ schema: ref("CreatePickListRequest") })
  @ApiCreatedResponse({ schema: ref("PickList") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/pick-lists")
  async createPickList(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.createPickList(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm a pick task with a barcode scan" })
  @ApiBody({ schema: ref("ConfirmPickTaskRequest") })
  @ApiOkResponse({ schema: ref("PickTask") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/pick-tasks/confirm")
  async confirmPickTask(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.confirmPickTask(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Pack a fully picked pick list" })
  @ApiBody({ schema: ref("PackPickListRequest") })
  @ApiCreatedResponse({ schema: ref("PackRecord") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/pack-records")
  async packPickList(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.packPickList(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Ship a packed package" })
  @ApiBody({ schema: ref("ShipPackRequest") })
  @ApiCreatedResponse({ schema: ref("Shipment") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/shipments")
  async shipPackRecord(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.shipPackRecord(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create put-away tasks from a purchase receipt" })
  @ApiBody({ schema: ref("CreatePutAwayTasksRequest") })
  @ApiCreatedResponse({ schema: arrayOf(ref("PutAwayTask")) })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/put-away-tasks")
  async createPutAwayTasks(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.createPutAwayTasks(session.tenantId, body);
  }

  @ApiTags("inventory")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm a put-away task with a barcode scan" })
  @ApiBody({ schema: ref("ConfirmPutAwayTaskRequest") })
  @ApiOkResponse({ schema: ref("PutAwayTask") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("inventory/put-away-tasks/confirm")
  async confirmPutAwayTask(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "inventory.manage",
    );
    return this.reads.confirmPutAwayTask(session.tenantId, body);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a production plan and MRP suggestions" })
  @ApiBody({ schema: ref("CreateProductionPlanRequest") })
  @ApiCreatedResponse({ schema: ref("ProductionPlan") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/production-plans")
  async createProductionPlan(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    return this.reads.createProductionPlan(session.tenantId, body);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a work order from an MRP suggestion" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiCreatedResponse({ schema: ref("WorkOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/mrp-suggestions/:id/work-order")
  async createWorkOrderFromSuggestion(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.createWorkOrderFromSuggestion(session.tenantId, id);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Release a work order" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiOkResponse({ schema: ref("WorkOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/work-orders/:id/release")
  async releaseWorkOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.releaseWorkOrder(session.tenantId, id);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start a routing operation job card" })
  @ApiBody({ schema: ref("StartJobCardRequest") })
  @ApiOkResponse({ schema: ref("JobCard") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/job-cards/start")
  async startJobCard(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    return this.reads.startJobCard(session.tenantId, body);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Complete a routing operation job card" })
  @ApiBody({ schema: ref("CompleteJobCardRequest") })
  @ApiOkResponse({ schema: ref("JobCard") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/job-cards/complete")
  async completeJobCard(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    return this.reads.completeJobCard(session.tenantId, body);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Record work-center downtime" })
  @ApiBody({ schema: ref("RecordDowntimeRequest") })
  @ApiCreatedResponse({ schema: ref("DowntimeEntry") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/downtime")
  async recordDowntime(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    return this.reads.recordDowntime(session.tenantId, body);
  }

  @ApiTags("manufacturing")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Complete a work order and post issue/receipt inventory ledger entries",
  })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiOkResponse({ schema: ref("WorkOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("manufacturing/work-orders/:id/complete")
  async completeWorkOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "manufacturing.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.completeWorkOrder(session.tenantId, id);
  }

  @ApiTags("quality")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get trace genealogy for one lot or serial record" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiOkResponse({ schema: ref("TraceGenealogy") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Get("quality/trace-records/:id/genealogy")
  async traceGenealogy(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "quality.read");
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.traceGenealogy(session.tenantId, id);
  }

  @ApiTags("quality")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Post a quality inspection" })
  @ApiBody({ schema: ref("CreateQualityInspectionRequest") })
  @ApiCreatedResponse({ schema: ref("QualityInspection") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("quality/inspections")
  async createQualityInspection(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "quality.manage",
    );
    return this.reads.createQualityInspection(session.tenantId, body);
  }

  @ApiTags("quality")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Open a recall for a lot" })
  @ApiBody({ schema: ref("CreateRecallRequest") })
  @ApiCreatedResponse({ schema: ref("Recall") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("quality/recalls")
  async createRecall(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "quality.manage",
    );
    return this.reads.createRecall(session.tenantId, body);
  }

  @ApiTags("commerce")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Open a POS register shift" })
  @ApiBody({ schema: ref("OpenPosShiftRequest") })
  @ApiCreatedResponse({ schema: ref("PosShift") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("commerce/pos-shifts/open")
  async openPosShift(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "commerce.manage",
    );
    return this.reads.openPosShift(session.tenantId, body);
  }

  @ApiTags("commerce")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Close a POS register shift" })
  @ApiBody({ schema: ref("ClosePosShiftRequest") })
  @ApiCreatedResponse({ schema: ref("PosShift") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("commerce/pos-shifts/close")
  async closePosShift(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "commerce.manage",
    );
    return this.reads.closePosShift(session.tenantId, body);
  }

  @ApiTags("commerce")
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Checkout a POS sale and post inventory, invoice, payment, and GL effects",
  })
  @ApiBody({ schema: ref("CheckoutPosSaleRequest") })
  @ApiCreatedResponse({ schema: ref("PosSale") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("commerce/pos-sales")
  async checkoutPosSale(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "commerce.manage",
    );
    return this.reads.checkoutPosSale(session.tenantId, body);
  }

  @ApiTags("commerce")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish products to a commerce channel catalog" })
  @ApiBody({ schema: ref("PublishChannelCatalogRequest") })
  @ApiCreatedResponse({ schema: arrayOf(ref("ChannelCatalogItem")) })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("commerce/catalog")
  async publishChannelCatalog(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "commerce.manage",
    );
    return this.reads.publishChannelCatalog(session.tenantId, body);
  }

  @ApiTags("commerce")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Ingest an idempotent external commerce channel order",
  })
  @ApiBody({ schema: ref("IngestChannelOrderRequest") })
  @ApiCreatedResponse({ schema: ref("ChannelOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("commerce/channel-orders")
  async ingestChannelOrder(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "commerce.manage",
    );
    return this.reads.ingestChannelOrder(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Record employee attendance for a work date" })
  @ApiBody({ schema: ref("RecordAttendanceRequest") })
  @ApiCreatedResponse({ schema: ref("AttendanceRecord") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/attendance")
  async recordAttendance(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.recordAttendance(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit an employee expense claim" })
  @ApiBody({ schema: ref("SubmitExpenseClaimRequest") })
  @ApiCreatedResponse({ schema: ref("ExpenseClaim") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/expense-claims")
  async submitExpenseClaim(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.submitExpenseClaim(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve an employee expense claim" })
  @ApiBody({ schema: ref("ExpenseClaimStatusRequest") })
  @ApiCreatedResponse({ schema: ref("ExpenseClaim") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/expense-claims/approve")
  async approveExpenseClaim(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.approveExpenseClaim(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Pay an approved employee expense claim and post accounting",
  })
  @ApiBody({ schema: ref("ExpenseClaimStatusRequest") })
  @ApiCreatedResponse({ schema: ref("ExpenseClaim") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/expense-claims/pay")
  async payExpenseClaim(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.payExpenseClaim(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request an employee advance" })
  @ApiBody({ schema: ref("CreateEmployeeAdvanceRequest") })
  @ApiCreatedResponse({ schema: ref("EmployeeAdvance") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/employee-advances")
  async createEmployeeAdvance(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.createEmployeeAdvance(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Pay an employee advance and post accounting" })
  @ApiBody({ schema: ref("PayEmployeeAdvanceRequest") })
  @ApiCreatedResponse({ schema: ref("EmployeeAdvance") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/employee-advances/pay")
  async payEmployeeAdvance(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.payEmployeeAdvance(session.tenantId, body);
  }

  @ApiTags("hr")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Run payroll, generate payslips, and post payroll accounting",
  })
  @ApiBody({ schema: ref("RunPayrollRequest") })
  @ApiCreatedResponse({ schema: ref("PayrollRun") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("hr/payroll-runs")
  async runPayroll(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(authorization, "hr.manage");
    return this.reads.runPayroll(session.tenantId, body);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update a saved report definition" })
  @ApiBody({ schema: ref("CreateSavedReportRequest") })
  @ApiCreatedResponse({ schema: ref("SavedReport") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("reports")
  async createSavedReport(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.manage",
    );
    return this.reads.createSavedReport(session.tenantId, body);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Run a saved report" })
  @ApiBody({ schema: ref("RunReportRequest") })
  @ApiCreatedResponse({ schema: ref("ReportRun") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("reports/runs")
  async runReport(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.manage",
    );
    return this.reads.runReport(session.tenantId, body);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Preview a saved report without storing a run" })
  @ApiBody({ schema: ref("PreviewReportRequest") })
  @ApiCreatedResponse({ schema: ref("ReportPreview") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("reports/previews")
  async previewReport(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.manage",
    );
    return this.reads.previewReport(session.tenantId, body);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a report export job" })
  @ApiBody({ schema: ref("CreateExportJobRequest") })
  @ApiCreatedResponse({ schema: ref("ExportJob") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("reports/exports")
  async createExportJob(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.manage",
    );
    return this.reads.createExportJob(session.tenantId, body);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create or update a print format layout" })
  @ApiBody({ schema: ref("CreatePrintFormatRequest") })
  @ApiCreatedResponse({ schema: ref("PrintFormat") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("reports/print-formats")
  async createPrintFormat(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.manage",
    );
    return this.reads.createPrintFormat(session.tenantId, body);
  }

  @ApiTags("reporting")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Render a print format preview" })
  @ApiBody({ schema: ref("PreviewPrintFormatRequest") })
  @ApiCreatedResponse({ schema: ref("PrintPreview") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("reports/print-previews")
  async previewPrintFormat(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "reporting.manage",
    );
    return this.reads.previewPrintFormat(session.tenantId, body);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a scoped API key record" })
  @ApiBody({ schema: ref("CreateApiKeyRequest") })
  @ApiCreatedResponse({ schema: ref("ApiKeyRecord") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/api-keys")
  async createApiKey(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    return this.reads.createApiKey(session.tenantId, body);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enqueue a webhook event for worker delivery" })
  @ApiBody({ schema: ref("DispatchWebhookRequest") })
  @ApiCreatedResponse({ schema: ref("WebhookDelivery") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/webhook-deliveries")
  async dispatchWebhook(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    return this.reads.dispatchWebhook(session.tenantId, body);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Requeue a failed or dead-lettered webhook delivery",
  })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiOkResponse({ schema: ref("WebhookDelivery") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/webhook-deliveries/:id/retry")
  async retryWebhookDelivery(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.retryWebhookDelivery(session.tenantId, id);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Requeue an outbox event for worker delivery",
  })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiOkResponse({ schema: ref("OutboxEvent") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/outbox-events/:id/dispatch")
  async dispatchOutboxEvent(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.dispatchOutboxEvent(session.tenantId, id);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reassign a materialized workflow task" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("WorkflowTaskReassignRequest") })
  @ApiOkResponse({ schema: ref("WorkflowTaskRecord") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/workflow-tasks/:id/reassign")
  async reassignWorkflowTask(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.reassignWorkflowTask(session.tenantId, id, body);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Snooze a materialized workflow task" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("WorkflowTaskSnoozeRequest") })
  @ApiOkResponse({ schema: ref("WorkflowTaskRecord") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/workflow-tasks/:id/snooze")
  async snoozeWorkflowTask(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.snoozeWorkflowTask(session.tenantId, id, body);
  }

  @ApiTags("integrations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retry a workflow task notification event" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("WorkflowTaskRetryNotificationRequest") })
  @ApiOkResponse({ schema: ref("WorkflowTaskRecord") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("integrations/workflow-tasks/:id/retry-notification")
  async retryWorkflowTaskNotification(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "integration.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.retryWorkflowTaskNotification(session.tenantId, id, body);
  }

  @ApiTags("operations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a CRM lead" })
  @ApiBody({ schema: ref("CreateLeadRequest") })
  @ApiCreatedResponse({ schema: ref("Lead") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("operations/leads")
  async createLead(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "operations.manage",
    );
    return this.reads.createLead(session.tenantId, body);
  }

  @ApiTags("operations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a project" })
  @ApiBody({ schema: ref("CreateProjectRequest") })
  @ApiCreatedResponse({ schema: ref("Project") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("operations/projects")
  async createProject(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "operations.manage",
    );
    return this.reads.createProject(session.tenantId, body);
  }

  @ApiTags("operations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a service case" })
  @ApiBody({ schema: ref("CreateServiceCaseRequest") })
  @ApiCreatedResponse({ schema: ref("ServiceCase") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("operations/service-cases")
  async createServiceCase(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "operations.manage",
    );
    return this.reads.createServiceCase(session.tenantId, body);
  }

  @ApiTags("operations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request employee leave" })
  @ApiBody({ schema: ref("CreateLeaveRequestRequest") })
  @ApiCreatedResponse({ schema: ref("LeaveRequest") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("operations/leave-requests")
  async createLeaveRequest(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "operations.manage",
    );
    return this.reads.createLeaveRequest(session.tenantId, body);
  }

  @ApiTags("operations")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Close a service case" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiOkResponse({ schema: ref("ServiceCase") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("operations/service-cases/:id/close")
  async closeServiceCase(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "operations.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.closeServiceCase(session.tenantId, id);
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a customer" })
  @ApiBody({ schema: ref("CreateCustomerRequest") })
  @ApiCreatedResponse({ schema: ref("Customer") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("sales/customers")
  async createCustomer(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.customer.write",
    );
    return this.reads.createCustomer(
      session.tenantId,
      parseBody(CreateCustomerSchema, body),
    );
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a product" })
  @ApiBody({ schema: ref("CreateProductRequest") })
  @ApiCreatedResponse({ schema: ref("Product") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("sales/products")
  async createProduct(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.product.manage",
    );
    return this.reads.createProduct(
      session.tenantId,
      parseBody(CreateProductSchema, body),
    );
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a customer" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("CreateCustomerRequest") })
  @ApiOkResponse({ schema: ref("Customer") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("sales/customers/:id")
  async updateCustomer(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.customer.write",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.updateCustomer(session.tenantId, {
      id,
      ...parseBody(CreateCustomerSchema, body),
    });
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a product" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("CreateProductRequest") })
  @ApiOkResponse({ schema: ref("Product") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("sales/products/:id")
  async updateProduct(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.product.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.updateProduct(session.tenantId, {
      id,
      ...parseBody(CreateProductSchema, body),
    });
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Transition a quote status" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("RecordTransitionRequest") })
  @ApiOkResponse({ schema: ref("Quote") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("sales/quotes/:id/status")
  async transitionQuote(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.quote.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    const { comment, status } = parseBody(RecordTransitionSchema, body);
    return this.reads.transitionQuote(session, id, status, comment);
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Transition a sales order status" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("RecordTransitionRequest") })
  @ApiOkResponse({ schema: ref("SalesOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("sales/orders/:id/status")
  async transitionOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.order.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    const { comment, status } = parseBody(RecordTransitionSchema, body);
    return this.reads.transitionOrder(session, id, status, comment);
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Transition an invoice status" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiBody({ schema: ref("InvoiceTransitionRequest") })
  @ApiOkResponse({ schema: ref("Invoice") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Patch("sales/invoices/:id/status")
  async transitionInvoice(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
    @Body() body: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.invoice.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    const { comment, status } = parseBody(InvoiceTransitionSchema, body);
    return this.reads.transitionInvoice(session, id, status, comment);
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate a sales order from an approved quote" })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiCreatedResponse({ schema: ref("SalesOrder") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("sales/quotes/:id/order")
  async generateOrderFromQuote(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.order.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.generateOrderFromQuote(session.tenantId, id);
  }

  @ApiTags("sales")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Generate an invoice from an approved or closed sales order",
  })
  @ApiParam({ name: "id", schema: { type: "string" } })
  @ApiCreatedResponse({ schema: ref("Invoice") })
  @ApiUnauthorizedResponse({ schema: ref("ErrorResponse") })
  @ApiForbiddenResponse({ schema: ref("ErrorResponse") })
  @Post("sales/orders/:id/invoice")
  async generateInvoiceFromOrder(
    @Headers("authorization") authorization: string | undefined,
    @Param() params: unknown,
  ) {
    const session = this.auth.requirePermission(
      authorization,
      "sales.invoice.manage",
    );
    const { id } = parseBody(IdParamSchema, params);
    return this.reads.generateInvoiceFromOrder(session.tenantId, id);
  }

  @ApiTags("webhooks")
  @ApiOperation({ summary: "List supported webhook event contracts" })
  @ApiOkResponse({ schema: arrayOf(ref("WebhookEventContract")) })
  @Get("webhooks/events")
  webhookEvents() {
    return this.reads.webhookEvents();
  }
}

@Module({
  controllers: [ErpController],
  providers: [AuthService, ErpReadService],
})
export class ApiModule {}

export async function bootstrap() {
  const app = await NestFactory.create(ApiModule, { cors: true });
  configureOpenApi(app);
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`ERP API listening on http://localhost:${port}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void bootstrap();
}

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function dueDateTime(value: string): string {
  return value.includes("T") ? value : `${value}T23:59:59.000Z`;
}

function sumOrders(orders: Array<{ total: { amount: number } }>): number {
  return orders.reduce((sum, order) => sum + order.total.amount, 0);
}
