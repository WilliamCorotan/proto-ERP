const baseUrl = (process.env.ERP_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const tenantSlug = process.env.ERP_SMOKE_TENANT_SLUG ?? "acme";
const email = process.env.ERP_SMOKE_EMAIL ?? "admin@acme.example";
const password = process.env.ERP_SMOKE_PASSWORD ?? "admin123";

let token = "";

async function request(method, path, body, expected = [200, 201]) {
  const headers = {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(body === undefined ? {} : { "content-type": "application/json" })
  };
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }
  return payload;
}

function first(records, label) {
  if (!records?.length) {
    throw new Error(`Smoke requires at least one ${label}.`);
  }
  return records[0];
}

function procurementLine(product, quantity = 1) {
  const amount = product.price?.amount ?? 100;
  const currency = product.price?.currency ?? "USD";
  return {
    productId: product.id,
    sku: product.sku,
    description: product.name,
    quantity,
    unitPrice: { amount, currency },
    total: { amount: amount * quantity, currency }
  };
}

async function login() {
  const session = await request("POST", "/auth/login", { tenantSlug, email, password });
  token = session.token;
  if (!token) {
    throw new Error("Login did not return a token.");
  }
  return session.user.email;
}

async function quoteToCash() {
  const sales = await request("GET", "/sales");
  const quote = first(sales.quotes, "sales quote");
  let approvedQuote = quote;
  if (approvedQuote.status === "draft") {
    approvedQuote = await request("PATCH", `/sales/quotes/${quote.id}/status`, { status: "submitted" });
  }
  if (approvedQuote.status !== "approved") {
    approvedQuote = await request("PATCH", `/sales/quotes/${quote.id}/status`, { status: "approved" });
  }
  const order = await request("POST", `/sales/quotes/${approvedQuote.id}/order`);
  const approvedOrder =
    order.status === "approved" ? order : await request("PATCH", `/sales/orders/${order.id}/status`, { status: "approved" });
  const invoice = await request("POST", `/sales/orders/${approvedOrder.id}/invoice`);
  const postedInvoice =
    invoice.status === "posted" ? invoice : await request("PATCH", `/sales/invoices/${invoice.id}/status`, { status: "posted" });
  return { quote: approvedQuote.number, order: approvedOrder.number, invoice: postedInvoice.number, status: postedInvoice.status };
}

async function procureToPay() {
  const [sales, procurement] = await Promise.all([request("GET", "/sales"), request("GET", "/procurement")]);
  const supplier = first(procurement.suppliers, "supplier");
  const product = first(sales.products, "product");
  const line = procurementLine(product, 1);
  const suffix = Date.now();
  const order = await request("POST", "/procurement/purchase-orders", {
    supplierId: supplier.id,
    expectedDate: "2026-09-30",
    lines: [line]
  });
  let approvedOrder = order;
  if (approvedOrder.status === "draft") {
    approvedOrder = await request("PATCH", `/procurement/purchase-orders/${order.id}/status`, { status: "submitted" });
  }
  if (approvedOrder.status !== "approved") {
    approvedOrder = await request("PATCH", `/procurement/purchase-orders/${order.id}/status`, { status: "approved" });
  }
  const receipt = await request("POST", `/procurement/purchase-orders/${approvedOrder.id}/receipt`);
  const invoice = await request("POST", `/procurement/purchase-orders/${approvedOrder.id}/invoice`);
  const payment = await request("POST", "/procurement/supplier-payments", {
    purchaseInvoiceId: invoice.id,
    amount: invoice.total,
    method: "smoke",
    paidAt: new Date().toISOString()
  });
  return { order: approvedOrder.number, receipt: receipt.number, invoice: invoice.number, payment: payment.id, source: `smoke-${suffix}` };
}

async function mrpWorkOrder() {
  const manufacturing = await request("GET", "/manufacturing");
  const bom = first(manufacturing.boms, "bill of material");
  const sourceId = `smoke-${Date.now()}`;
  const plan = await request("POST", "/manufacturing/production-plans", {
    productId: bom.productId,
    demandQuantity: 10000,
    demandDate: "2026-10-15",
    sourceEntity: "SmokeRun",
    sourceId
  });
  const refreshed = await request("GET", "/manufacturing");
  const suggestion =
    refreshed.mrpSuggestions.find((item) => item.productionPlanId === plan.id && item.suggestionType === "work_order") ??
    refreshed.mrpSuggestions.find((item) => item.suggestionType === "work_order" && item.status === "open");
  if (!suggestion) {
    throw new Error(`Production plan ${plan.number} did not create a work-order suggestion.`);
  }
  const workOrder = await request("POST", `/manufacturing/mrp-suggestions/${suggestion.id}/work-order`);
  const released =
    workOrder.status === "released" ? workOrder : await request("POST", `/manufacturing/work-orders/${workOrder.id}/release`);
  return { plan: plan.number, suggestion: suggestion.id, workOrder: released.number, status: released.status };
}

async function qualityRecall() {
  const quality = await request("GET", "/quality");
  const trace = first(quality.traceRecords, "trace record");
  const recall = await request("POST", "/quality/recalls", {
    lotNumber: trace.lotNumber,
    reason: "API smoke recall workflow"
  });
  return { lotNumber: recall.lotNumber, affected: recall.affectedTraceIds.length, status: recall.status };
}

async function integrationOutbox() {
  const suffix = Date.now();
  const lead = await request("POST", "/operations/leads", {
    companyName: `Smoke Lead ${suffix}`,
    contactName: "API Smoke",
    email: `smoke-${suffix}@example.com`,
    source: "automation",
    owner: "Mina Cruz"
  });
  const integration = await request("GET", "/integrations");
  const event = integration.outboxEvents.find((item) => item.eventType === "operations.lead.created" && item.payload?.leadId === lead.id);
  if (!event) {
    throw new Error(`Lead ${lead.id} did not produce an outbox event.`);
  }
  const dispatched = await request("POST", `/integrations/outbox-events/${event.id}/dispatch`, {});
  const after = await request("GET", "/integrations");
  const delivered = after.webhookDeliveries.some(
    (item) => item.eventType === "operations.lead.created" && item.subscriptionId === "whsub_ops" && item.status === "delivered"
  );
  if (!delivered) {
    throw new Error(`Outbox event ${event.id} did not create a delivered webhook record.`);
  }
  return { lead: lead.id, event: dispatched.id, status: dispatched.status };
}

async function serviceCaseWorkflow() {
  const serviceCase = await request("POST", "/operations/service-cases", {
    customerName: "Smoke Customer",
    subject: "API smoke service case",
    priority: "medium",
    owner: "Support Lead"
  });
  const closed = await request("POST", `/operations/service-cases/${serviceCase.id}/close`);
  return { caseNumber: closed.caseNumber, status: closed.status };
}

const checks = [
  ["login", login],
  ["quote-to-cash", quoteToCash],
  ["procure-to-pay", procureToPay],
  ["mrp-work-order", mrpWorkOrder],
  ["quality-recall", qualityRecall],
  ["integration-outbox", integrationOutbox],
  ["service-case", serviceCaseWorkflow]
];

const results = [];
for (const [name, check] of checks) {
  const detail = await check();
  results.push({ name, ok: true, detail });
}

console.log(JSON.stringify({ baseUrl, results }, null, 2));
