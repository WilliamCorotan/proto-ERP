"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ErpClient } from "@erp/sdk";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function numberValue(formData: FormData, key: string): number {
  const value = Number(required(formData, key));
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be numeric`);
  }
  return value;
}

function optionalValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function optionalNumberValue(formData: FormData, key: string): number | null {
  const value = optionalValue(formData, key);
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be numeric`);
  }
  return parsed;
}

function isoDateTimeValue(formData: FormData, key: string): string {
  const value = required(formData, key);
  return value.includes("Z") || /[+-]\d\d:\d\d$/.test(value)
    ? value
    : `${value}:00.000Z`;
}

function optionalIsoDateTimeValue(
  formData: FormData,
  key: string,
): string | null {
  const value = optionalValue(formData, key);
  if (!value) {
    return null;
  }
  return value.includes("Z") || /[+-]\d\d:\d\d$/.test(value)
    ? value
    : `${value}:00.000Z`;
}

export async function createCustomerAction(formData: FormData) {
  await (await authenticatedClient()).createCustomer(customerPayload(formData));
  revalidatePath("/");
  revalidatePath("/customers");
}

export async function updateCustomerAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).updateCustomer(required(formData, "id"), customerPayload(formData));
  revalidatePath("/");
  revalidatePath("/customers");
}

export async function createProductAction(formData: FormData) {
  await (await authenticatedClient()).createProduct(productPayload(formData));
  revalidatePath("/");
  revalidatePath("/products");
}

export async function updateProductAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).updateProduct(required(formData, "id"), productPayload(formData));
  revalidatePath("/");
  revalidatePath("/products");
}

export async function createUserAction(formData: FormData) {
  const roleKeys = formData
    .getAll("roleKeys")
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );

  await (
    await authenticatedClient()
  ).createUser({
    email: required(formData, "email"),
    name: required(formData, "name"),
    password: required(formData, "password"),
    roleKeys,
  });
  revalidatePath("/settings");
}

export async function createCustomFieldAction(formData: FormData) {
  const optionsValue = formData.get("options");
  const options = (typeof optionsValue === "string" ? optionsValue : "")
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
  await (
    await authenticatedClient()
  ).createCustomField({
    entityType: "Customer",
    key: required(formData, "key"),
    label: required(formData, "label"),
    fieldType: required(formData, "fieldType") as
      "boolean" | "date" | "number" | "select" | "text",
    required: formData.get("required") === "on",
    options,
    displayOrder: numberValue(formData, "displayOrder"),
  });
  revalidatePath("/settings");
  revalidatePath("/customers");
}

export async function createAutomationRuleAction(formData: FormData) {
  const actions: Array<{
    type: "audit" | "outbox";
    message?: string;
    eventType?: string;
  }> = [
    {
      type: "audit",
      message: required(formData, "message"),
    },
  ];
  const eventType = formData.get("outboxEventType")?.toString().trim();
  if (eventType) {
    actions.push({ type: "outbox", eventType });
  }

  await (
    await authenticatedClient()
  ).createAutomationRule({
    name: required(formData, "name"),
    triggerEvent: required(formData, "triggerEvent"),
    enabled: formData.get("enabled") === "on",
    actions,
  });
  revalidatePath("/settings");
  revalidatePath("/integrations");
}

export async function createWorkflowAssignmentRuleAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createWorkflowAssignmentRule({
    workflowId: required(formData, "workflowId") as
      | "procurement.purchase-order"
      | "sales.invoice"
      | "sales.order"
      | "sales.quote",
    fromState: required(formData, "fromState"),
    toState: required(formData, "toState"),
    role: required(formData, "role"),
    delegateRole: optionalValue(formData, "delegateRole") ?? null,
    delegateStartsAt: optionalIsoDateTimeValue(formData, "delegateStartsAt"),
    delegateEndsAt: optionalIsoDateTimeValue(formData, "delegateEndsAt"),
    minAmount: optionalNumberValue(formData, "minAmount"),
    maxAmount: optionalNumberValue(formData, "maxAmount"),
    active: formData.get("active") === "on",
  });
  revalidatePath("/settings");
  revalidatePath("/workflow-inbox");
}

export async function createWorkflowEscalationRuleAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createWorkflowEscalationRule({
    workflowId: required(formData, "workflowId") as
      | "procurement.purchase-order"
      | "sales.invoice"
      | "sales.order"
      | "sales.quote",
    fromState: required(formData, "fromState"),
    toState: required(formData, "toState"),
    targetRole: required(formData, "targetRole"),
    dueInHours: numberValue(formData, "dueInHours"),
    escalationRole: required(formData, "escalationRole"),
    notificationChannel: required(formData, "notificationChannel") as
      "email" | "in_app" | "slack" | "webhook",
    active: formData.get("active") === "on",
  });
  revalidatePath("/settings");
  revalidatePath("/workflow-inbox");
  revalidatePath("/integrations");
}

export async function setModuleEnabledAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).setModuleEnabled(required(formData, "moduleId"), {
    enabled: formData.get("enabled") === "on",
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function transitionQuoteAction(formData: FormData) {
  const comment = optionalValue(formData, "comment");
  await (
    await authenticatedClient()
  ).transitionQuote(required(formData, "id"), {
    status: required(formData, "status") as
      "approved" | "cancelled" | "closed" | "draft" | "submitted",
    ...(comment ? { comment } : {}),
  });
  revalidatePath("/");
  revalidatePath("/quotes");
  revalidatePath("/workflow-inbox");
}

export async function transitionOrderAction(formData: FormData) {
  const comment = optionalValue(formData, "comment");
  await (
    await authenticatedClient()
  ).transitionOrder(required(formData, "id"), {
    status: required(formData, "status") as
      "approved" | "cancelled" | "closed" | "draft" | "submitted",
    ...(comment ? { comment } : {}),
  });
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/workflow-inbox");
}

export async function transitionInvoiceAction(formData: FormData) {
  const comment = optionalValue(formData, "comment");
  await (
    await authenticatedClient()
  ).transitionInvoice(required(formData, "id"), {
    status: required(formData, "status") as
      "draft" | "paid" | "posted" | "void",
    ...(comment ? { comment } : {}),
  });
  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/workflow-inbox");
}

export async function transitionWorkflowTaskAction(formData: FormData) {
  const entity = required(formData, "entity");
  const id = required(formData, "id");
  const status = required(formData, "status");
  const comment = optionalValue(formData, "comment");
  const client = await authenticatedClient();

  if (entity === "Quote") {
    await client.transitionQuote(id, {
      status: status as
        "approved" | "cancelled" | "closed" | "draft" | "submitted",
      ...(comment ? { comment } : {}),
    });
    revalidatePath("/quotes");
  } else if (entity === "SalesOrder") {
    await client.transitionOrder(id, {
      status: status as
        "approved" | "cancelled" | "closed" | "draft" | "submitted",
      ...(comment ? { comment } : {}),
    });
    revalidatePath("/orders");
  } else if (entity === "Invoice") {
    await client.transitionInvoice(id, {
      status: status as "draft" | "paid" | "posted" | "void",
      ...(comment ? { comment } : {}),
    });
    revalidatePath("/invoices");
  } else if (entity === "PurchaseOrder") {
    await client.transitionPurchaseOrder(id, {
      status: status as
        "approved" | "cancelled" | "closed" | "draft" | "submitted",
      ...(comment ? { comment } : {}),
    });
    revalidatePath("/procurement");
  } else {
    throw new Error(`Unsupported workflow task entity: ${entity}`);
  }

  revalidatePath("/");
  revalidatePath("/workflow-inbox");
}

export async function generateOrderAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).generateOrderFromQuote(required(formData, "id"));
  revalidatePath("/");
  revalidatePath("/quotes");
  revalidatePath("/orders");
}

export async function generateInvoiceAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).generateInvoiceFromOrder(required(formData, "id"));
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/invoices");
}

export async function recordPaymentAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).recordPayment({
    invoiceId: required(formData, "invoiceId"),
    amount: {
      amount: numberValue(formData, "amount"),
      currency: "USD",
    },
    method: required(formData, "method"),
    receivedAt: new Date().toISOString(),
  });
  revalidatePath("/");
  revalidatePath("/accounting");
  revalidatePath("/invoices");
}

export async function createBankTransactionAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createBankTransaction({
    bankAccountId: required(formData, "bankAccountId"),
    reference: required(formData, "reference"),
    direction: required(formData, "direction") as "inbound" | "outbound",
    amount: {
      amount: numberValue(formData, "amount"),
      currency: "USD",
    },
    transactionDate: required(formData, "transactionDate"),
    matchedEntity: formData.get("matchedEntity")?.toString() || null,
    matchedEntityId: formData.get("matchedEntityId")?.toString() || null,
  });
  revalidatePath("/accounting");
}

export async function reconcileBankAccountAction(formData: FormData) {
  const transactionIds = formData
    .getAll("transactionIds")
    .map((value) => value.toString());
  await (
    await authenticatedClient()
  ).reconcileBankAccount({
    bankAccountId: required(formData, "bankAccountId"),
    statementDate: required(formData, "statementDate"),
    statementBalance: {
      amount: numberValue(formData, "statementBalance"),
      currency: "USD",
    },
    transactionIds,
  });
  revalidatePath("/accounting");
}

export async function closeFiscalPeriodAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).closeFiscalPeriod({
    fiscalPeriodId: required(formData, "fiscalPeriodId"),
    closedAt: new Date().toISOString(),
  });
  revalidatePath("/accounting");
}

export async function allocateLandedCostAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).allocateLandedCost({
    purchaseReceiptId: required(formData, "purchaseReceiptId"),
    amount: {
      amount: numberValue(formData, "amount"),
      currency: "USD",
    },
    method: required(formData, "method") as "quantity" | "value",
  });
  revalidatePath("/accounting");
  revalidatePath("/inventory");
  revalidatePath("/procurement");
}

export async function createFixedAssetAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createFixedAsset({
    assetTag: required(formData, "assetTag"),
    name: required(formData, "name"),
    purchaseDate: required(formData, "purchaseDate"),
    cost: {
      amount: numberValue(formData, "cost"),
      currency: "USD",
    },
    usefulLifeMonths: numberValue(formData, "usefulLifeMonths"),
  });
  revalidatePath("/accounting");
}

export async function runDepreciationAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).runDepreciation({
    fixedAssetId: required(formData, "fixedAssetId"),
    runDate: required(formData, "runDate"),
  });
  revalidatePath("/accounting");
}

export async function setExchangeRateAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).setExchangeRate({
    baseCurrency: required(formData, "baseCurrency"),
    quoteCurrency: required(formData, "quoteCurrency"),
    rate: numberValue(formData, "rate"),
    effectiveDate: required(formData, "effectiveDate"),
  });
  revalidatePath("/accounting");
}

export async function openPosShiftAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).openPosShift({
    registerId: required(formData, "registerId"),
    openedBy: required(formData, "openedBy"),
    openingCash: {
      amount: numberValue(formData, "openingCash"),
      currency: "USD",
    },
  });
  revalidatePath("/commerce");
}

export async function closePosShiftAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).closePosShift({
    shiftId: required(formData, "shiftId"),
    closingCash: {
      amount: numberValue(formData, "closingCash"),
      currency: "USD",
    },
  });
  revalidatePath("/commerce");
}

export async function checkoutPosSaleAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).checkoutPosSale({
    shiftId: required(formData, "shiftId"),
    customerId: required(formData, "customerId"),
    tenderType: required(formData, "tenderType") as
      "bank_card" | "cash" | "digital_wallet",
    lines: [procurementLinePayload(formData)],
  });
  revalidatePath("/");
  revalidatePath("/accounting");
  revalidatePath("/commerce");
  revalidatePath("/integrations");
  revalidatePath("/inventory");
  revalidatePath("/invoices");
  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/reports");
}

export async function publishChannelCatalogAction(formData: FormData) {
  const productIds = formData
    .getAll("productIds")
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
  if (productIds.length === 0) {
    throw new Error("productIds is required");
  }

  await (
    await authenticatedClient()
  ).publishChannelCatalog({
    channelId: required(formData, "channelId"),
    productIds,
  });
  revalidatePath("/commerce");
  revalidatePath("/integrations");
}

export async function ingestChannelOrderAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).ingestChannelOrder({
    channelId: required(formData, "channelId"),
    externalOrderId: required(formData, "externalOrderId"),
    customerId: required(formData, "customerId"),
    lines: [procurementLinePayload(formData)],
  });
  revalidatePath("/");
  revalidatePath("/commerce");
  revalidatePath("/integrations");
  revalidatePath("/inventory");
  revalidatePath("/orders");
  revalidatePath("/products");
}

export async function recordAttendanceAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).recordAttendance({
    employeeId: required(formData, "employeeId"),
    workDate: required(formData, "workDate"),
    checkIn: isoDateTimeValue(formData, "checkIn"),
    checkOut: isoDateTimeValue(formData, "checkOut"),
  });
  revalidatePath("/hr");
  revalidatePath("/integrations");
}

export async function submitExpenseClaimAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).submitExpenseClaim({
    employeeId: required(formData, "employeeId"),
    category: required(formData, "category"),
    description: required(formData, "description"),
    amount: {
      amount: numberValue(formData, "amount"),
      currency: "USD",
    },
    submittedAt: new Date().toISOString(),
  });
  revalidatePath("/hr");
}

export async function approveExpenseClaimAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).approveExpenseClaim({
    id: required(formData, "id"),
    approvedAt: new Date().toISOString(),
  });
  revalidatePath("/hr");
}

export async function payExpenseClaimAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).payExpenseClaim({
    id: required(formData, "id"),
    paidAt: new Date().toISOString(),
  });
  revalidatePath("/accounting");
  revalidatePath("/hr");
  revalidatePath("/integrations");
}

export async function createEmployeeAdvanceAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createEmployeeAdvance({
    employeeId: required(formData, "employeeId"),
    amount: {
      amount: numberValue(formData, "amount"),
      currency: "USD",
    },
    requestedAt: new Date().toISOString(),
  });
  revalidatePath("/hr");
}

export async function payEmployeeAdvanceAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).payEmployeeAdvance({
    id: required(formData, "id"),
    paidAt: new Date().toISOString(),
    paymentReference: required(formData, "paymentReference"),
  });
  revalidatePath("/accounting");
  revalidatePath("/hr");
}

export async function runPayrollAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).runPayroll({
    periodStart: required(formData, "periodStart"),
    periodEnd: required(formData, "periodEnd"),
    postedAt: new Date().toISOString(),
  });
  revalidatePath("/accounting");
  revalidatePath("/hr");
  revalidatePath("/integrations");
}

export async function createSupplierAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createSupplier({
    code: required(formData, "code"),
    name: required(formData, "name"),
    email: required(formData, "email"),
    phone: required(formData, "phone"),
    paymentTerms: required(formData, "paymentTerms"),
  });
  revalidatePath("/procurement");
}

export async function createMaterialRequestAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createMaterialRequest({
    requester: required(formData, "requester"),
    requiredBy: required(formData, "requiredBy"),
    lines: [procurementLinePayload(formData)],
  });
  revalidatePath("/procurement");
}

export async function createPurchaseOrderAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createPurchaseOrder({
    supplierId: required(formData, "supplierId"),
    expectedDate: required(formData, "expectedDate"),
    lines: [procurementLinePayload(formData)],
  });
  revalidatePath("/procurement");
}

export async function transitionPurchaseOrderAction(formData: FormData) {
  const comment = optionalValue(formData, "comment");
  await (
    await authenticatedClient()
  ).transitionPurchaseOrder(required(formData, "id"), {
    status: required(formData, "status") as
      "approved" | "cancelled" | "closed" | "draft" | "submitted",
    ...(comment ? { comment } : {}),
  });
  revalidatePath("/procurement");
  revalidatePath("/workflow-inbox");
}

export async function receivePurchaseOrderAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).receivePurchaseOrder(required(formData, "id"));
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/procurement");
}

export async function createPurchaseInvoiceAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createPurchaseInvoiceFromOrder(required(formData, "id"));
  revalidatePath("/accounting");
  revalidatePath("/procurement");
}

export async function payPurchaseInvoiceAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).payPurchaseInvoice({
    purchaseInvoiceId: required(formData, "id"),
    amount: {
      amount: numberValue(formData, "amount"),
      currency: "USD",
    },
    method: required(formData, "method"),
    paidAt: new Date().toISOString(),
  });
  revalidatePath("/accounting");
  revalidatePath("/procurement");
}

export async function reserveStockAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).reserveStock({
    productId: required(formData, "productId"),
    quantity: numberValue(formData, "quantity"),
    sourceEntity: required(formData, "sourceEntity"),
    sourceId: required(formData, "sourceId"),
  });
  revalidatePath("/inventory");
}

export async function transferStockAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).transferStock({
    productId: required(formData, "productId"),
    fromBinId: required(formData, "fromBinId"),
    toBinId: required(formData, "toBinId"),
    quantity: numberValue(formData, "quantity"),
  });
  revalidatePath("/inventory");
}

export async function postCycleCountAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).postCycleCount({
    productId: required(formData, "productId"),
    binId: required(formData, "binId"),
    countedQuantity: numberValue(formData, "countedQuantity"),
  });
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/products");
}

export async function createPickListAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createPickList({
    salesOrderId: required(formData, "salesOrderId"),
  });
  revalidatePath("/inventory");
}

export async function confirmPickTaskAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).confirmPickTask({
    pickTaskId: required(formData, "pickTaskId"),
    pickedQuantity: numberValue(formData, "pickedQuantity"),
    barcode: required(formData, "barcode"),
  });
  revalidatePath("/inventory");
}

export async function packPickListAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).packPickList({
    pickListId: required(formData, "pickListId"),
    packageCode: required(formData, "packageCode"),
  });
  revalidatePath("/inventory");
}

export async function shipPackRecordAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).shipPackRecord({
    packRecordId: required(formData, "packRecordId"),
    carrier: required(formData, "carrier"),
    trackingNumber: required(formData, "trackingNumber"),
  });
  revalidatePath("/inventory");
}

export async function createPutAwayTasksAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createPutAwayTasks({
    purchaseReceiptId: required(formData, "purchaseReceiptId"),
  });
  revalidatePath("/inventory");
}

export async function confirmPutAwayTaskAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).confirmPutAwayTask({
    putAwayTaskId: required(formData, "putAwayTaskId"),
    barcode: required(formData, "barcode"),
  });
  revalidatePath("/inventory");
}

export async function createProductionPlanAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createProductionPlan({
    productId: required(formData, "productId"),
    demandQuantity: numberValue(formData, "demandQuantity"),
    demandDate: required(formData, "demandDate"),
    sourceEntity: required(formData, "sourceEntity"),
    sourceId: required(formData, "sourceId"),
  });
  revalidatePath("/manufacturing");
}

export async function createWorkOrderFromSuggestionAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createWorkOrderFromSuggestion(required(formData, "id"));
  revalidatePath("/manufacturing");
}

export async function releaseWorkOrderAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).releaseWorkOrder(required(formData, "id"));
  revalidatePath("/manufacturing");
}

export async function startJobCardAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).startJobCard({
    jobCardId: required(formData, "jobCardId"),
    operator: required(formData, "operator"),
  });
  revalidatePath("/manufacturing");
}

export async function completeJobCardAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).completeJobCard({
    jobCardId: required(formData, "jobCardId"),
    actualMinutes: numberValue(formData, "actualMinutes"),
  });
  revalidatePath("/manufacturing");
}

export async function recordDowntimeAction(formData: FormData) {
  const jobCardId = formData.get("jobCardId");
  await (
    await authenticatedClient()
  ).recordDowntime({
    workCenterId: required(formData, "workCenterId"),
    jobCardId:
      typeof jobCardId === "string" && jobCardId.trim().length > 0
        ? jobCardId.trim()
        : null,
    reason: required(formData, "reason"),
    minutes: numberValue(formData, "minutes"),
  });
  revalidatePath("/manufacturing");
}

export async function completeWorkOrderAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).completeWorkOrder(required(formData, "id"));
  revalidatePath("/inventory");
  revalidatePath("/manufacturing");
  revalidatePath("/products");
}

export async function createQualityInspectionAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createQualityInspection({
    templateId: required(formData, "templateId"),
    traceRecordId: required(formData, "traceRecordId"),
    inspectedBy: required(formData, "inspectedBy"),
    results: [
      {
        checkpoint: required(formData, "checkpoint"),
        passed: formData.get("passed") === "on",
        note: String(formData.get("note") ?? ""),
      },
    ],
  });
  revalidatePath("/quality");
}

export async function createRecallAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createRecall({
    lotNumber: required(formData, "lotNumber"),
    reason: required(formData, "reason"),
  });
  revalidatePath("/quality");
}

export async function runReportAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).runReport({
    reportId: required(formData, "reportId"),
  });
  revalidatePath("/reports");
}

export async function createSavedReportAction(formData: FormData) {
  const columns = required(formData, "columns")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);
  await (
    await authenticatedClient()
  ).createSavedReport({
    name: required(formData, "name"),
    entityType: required(formData, "entityType"),
    columns,
    filters: {},
    parameters: [],
    sorts: [{ field: columns[0] ?? "id", direction: "asc" }],
    groupBy: [],
    chart: {
      type: required(formData, "chartType") as "bar" | "line" | "none",
      labelField: formData.get("labelField")?.toString() || null,
      valueField: formData.get("valueField")?.toString() || null,
    },
    owner: "Admin",
  });
  revalidatePath("/reports");
}

export async function previewReportAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).previewReport({
    reportId: required(formData, "reportId"),
  });
  revalidatePath("/reports");
}

export async function createExportJobAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createExportJob({
    reportId: required(formData, "reportId"),
    format: required(formData, "format") as "csv" | "json",
  });
  revalidatePath("/reports");
}

export async function createPrintFormatAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createPrintFormat({
    name: required(formData, "name"),
    entityType: required(formData, "entityType"),
    template: required(formData, "template"),
    blocks: [
      { type: "heading", text: required(formData, "heading") },
      {
        type: "field",
        field: required(formData, "primaryField"),
        label: required(formData, "primaryLabel"),
      },
      {
        type: "field",
        field: required(formData, "secondaryField"),
        label: required(formData, "secondaryLabel"),
      },
      { type: "signature", label: "Approved by" },
    ],
    active: true,
  });
  revalidatePath("/reports");
}

export async function previewPrintFormatAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).previewPrintFormat({
    printFormatId: required(formData, "printFormatId"),
    recordId: required(formData, "recordId"),
  });
  revalidatePath("/reports");
}

export async function createApiKeyAction(formData: FormData) {
  const scopes = formData
    .getAll("scopes")
    .filter(
      (
        value,
      ): value is
        | "accounting.read"
        | "inventory.read"
        | "integration.read"
        | "reporting.read"
        | "sales.customer.read" =>
        typeof value === "string" && value.trim().length > 0,
    );
  await (
    await authenticatedClient()
  ).createApiKey({
    name: required(formData, "name"),
    scopes,
  });
  revalidatePath("/integrations");
}

export async function dispatchWebhookAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).dispatchWebhook({
    subscriptionId: required(formData, "subscriptionId"),
    eventType: required(formData, "eventType"),
    payload: {
      entityId: required(formData, "entityId"),
      source: "web-console",
    },
  });
  revalidatePath("/integrations");
}

export async function retryWebhookDeliveryAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).retryWebhookDelivery(required(formData, "id"));
  revalidatePath("/integrations");
}

export async function dispatchOutboxEventAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).dispatchOutboxEvent(required(formData, "id"));
  revalidatePath("/integrations");
}

export async function reassignWorkflowTaskAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).reassignWorkflowTask(required(formData, "id"), {
    role: required(formData, "role"),
    actorId: optionalValue(formData, "actorId") ?? "usr_admin",
    reason: optionalValue(formData, "reason") ?? null,
  });
  revalidatePath("/integrations");
}

export async function snoozeWorkflowTaskAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).snoozeWorkflowTask(required(formData, "id"), {
    dueAt: isoDateTimeValue(formData, "dueAt"),
    actorId: optionalValue(formData, "actorId") ?? "usr_admin",
    reason: required(formData, "reason"),
  });
  revalidatePath("/integrations");
}

export async function retryWorkflowTaskNotificationAction(
  formData: FormData,
) {
  await (
    await authenticatedClient()
  ).retryWorkflowTaskNotification(required(formData, "id"), {
    notification: required(formData, "notification") as
      | "assigned"
      | "cancelled"
      | "completed"
      | "escalated",
    actorId: optionalValue(formData, "actorId") ?? "usr_admin",
    reason: optionalValue(formData, "reason") ?? null,
  });
  revalidatePath("/integrations");
}

export async function createLeadAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createLead({
    companyName: required(formData, "companyName"),
    contactName: required(formData, "contactName"),
    email: required(formData, "email"),
    source: required(formData, "source"),
    owner: required(formData, "owner"),
  });
  revalidatePath("/operations");
}

export async function createProjectAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createProject({
    code: required(formData, "code"),
    name: required(formData, "name"),
    customerName: required(formData, "customerName"),
    budget: {
      amount: numberValue(formData, "budget"),
      currency: "USD",
    },
    startDate: required(formData, "startDate"),
    endDate: required(formData, "endDate"),
  });
  revalidatePath("/operations");
}

export async function createServiceCaseAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createServiceCase({
    customerName: required(formData, "customerName"),
    subject: required(formData, "subject"),
    priority: required(formData, "priority") as
      "critical" | "high" | "low" | "medium",
    owner: required(formData, "owner"),
  });
  revalidatePath("/operations");
}

export async function createLeaveRequestAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).createLeaveRequest({
    employeeId: required(formData, "employeeId"),
    leaveType: required(formData, "leaveType") as
      "personal" | "sick" | "vacation",
    startDate: required(formData, "startDate"),
    endDate: required(formData, "endDate"),
  });
  revalidatePath("/operations");
}

export async function closeServiceCaseAction(formData: FormData) {
  await (
    await authenticatedClient()
  ).closeServiceCase(required(formData, "id"));
  revalidatePath("/operations");
}

export async function loginAction(formData: FormData) {
  const response = await new ErpClient(apiUrl).login({
    tenantSlug: required(formData, "tenantSlug"),
    email: required(formData, "email"),
    password: required(formData, "password"),
  });
  const cookieStore = await cookies();
  cookieStore.set("erp_token", response.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/");
  redirect("/");
}

async function authenticatedClient(): Promise<ErpClient> {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;
  if (!token) {
    throw new Error("Authentication is required to perform this action.");
  }
  return new ErpClient(apiUrl, token);
}

function customerPayload(formData: FormData) {
  return {
    code: required(formData, "code"),
    name: required(formData, "name"),
    owner: required(formData, "owner"),
    email: required(formData, "email"),
    creditLimit: {
      amount: numberValue(formData, "creditLimit"),
      currency: "USD",
    },
    customFields: customFieldsPayload(formData),
  };
}

function productPayload(formData: FormData) {
  return {
    sku: required(formData, "sku"),
    name: required(formData, "name"),
    category: required(formData, "category"),
    price: {
      amount: numberValue(formData, "price"),
      currency: "USD",
    },
    stockOnHand: numberValue(formData, "stockOnHand"),
  };
}

function procurementLinePayload(formData: FormData) {
  const quantity = numberValue(formData, "quantity");
  const unitPrice = numberValue(formData, "unitPrice");
  return {
    productId: required(formData, "productId"),
    sku: required(formData, "sku"),
    description: required(formData, "description"),
    quantity,
    unitPrice: {
      amount: unitPrice,
      currency: "USD",
    },
    total: {
      amount: quantity * unitPrice,
      currency: "USD",
    },
  };
}

function customFieldsPayload(
  formData: FormData,
): Record<string, string | null> {
  const customFields: Record<string, string | null> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("custom.") || typeof value !== "string") {
      continue;
    }
    customFields[key.slice("custom.".length)] = value.trim() || null;
  }
  return customFields;
}
