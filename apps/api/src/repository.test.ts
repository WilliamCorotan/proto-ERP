import { describe, expect, it } from "vitest";
import { MemoryErpRepository } from "./repository.js";

describe("Sales repository workflows", () => {
  it("rejects aggregate reads for an unknown test tenant", async () => {
    const repository = new MemoryErpRepository();

    await expect(repository.sales("ten_other")).rejects.toThrow(
      "Unknown memory repository tenant: ten_other",
    );
  });

  it("rejects writes and workflows for an unknown test tenant without mutation", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.sales("ten_demo");
    const customerCount = before.customers.length;
    const quoteStatus = before.quotes.find(
      (quote) => quote.id === "quo_001",
    )?.status;

    await expect(
      repository.createCustomer("ten_other", {
        code: "C-FOREIGN",
        name: "Foreign Tenant Customer",
        owner: "Unknown",
        email: "foreign@example.test",
        creditLimit: { amount: 1, currency: "USD" },
      }),
    ).rejects.toThrow("Unknown memory repository tenant: ten_other");
    await expect(
      repository.transitionQuote("ten_other", {
        id: "quo_001",
        status: "approved",
      }),
    ).rejects.toThrow("Unknown memory repository tenant: ten_other");
    await expect(
      repository.ensureWorkflowInstance("ten_other", {
        workflowId: "sales.quote",
        document: { entity: "Quote", id: "quo_001" },
        state: "submitted",
      }),
    ).rejects.toThrow("Unknown memory repository tenant: ten_other");

    const after = await repository.sales("ten_demo");
    expect(after.customers).toHaveLength(customerCount);
    expect(after.quotes.find((quote) => quote.id === "quo_001")?.status).toBe(
      quoteStatus,
    );
    await expect(
      repository.workflowInstance("ten_demo", {
        workflowId: "sales.quote",
        document: { entity: "Quote", id: "quo_001" },
      }),
    ).resolves.toBeNull();
  });

  it("leaves expense claims unchanged when a foreign tenant attempts approval", async () => {
    const repository = new MemoryErpRepository();
    const employee = (await repository.operations("ten_demo")).employees[0];
    expect(employee).toBeDefined();
    const claim = await repository.submitExpenseClaim("ten_demo", {
      employeeId: employee?.id ?? "missing",
      category: "Travel",
      description: "Tenant isolation regression",
      amount: { amount: 100, currency: "USD" },
      submittedAt: "2026-07-09T00:00:00.000Z",
    });
    const original = structuredClone(claim);

    await expect(
      repository.approveExpenseClaim("ten_other", {
        id: claim.id,
        approvedAt: "2026-07-10T00:00:00.000Z",
      }),
    ).rejects.toThrow("Unknown memory repository tenant: ten_other");

    const after = await repository.hr("ten_demo");
    expect(
      after.expenseClaims.find((record) => record.id === claim.id),
    ).toEqual(original);
  });

  it("rejects invalid document transitions", async () => {
    const repository = new MemoryErpRepository();
    await expect(
      repository.transitionQuote("ten_demo", {
        id: "quo_001",
        status: "closed",
      }),
    ).rejects.toThrow("Invalid Quote transition");
  });

  it("records stock movements and decrements stock when an order is approved", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.sales("ten_demo");
    const startingStock = before.products.find(
      (product) => product.id === "prd_001",
    )?.stockOnHand;

    await repository.transitionOrder("ten_demo", {
      id: "ord_001",
      status: "approved",
    });

    const after = await repository.sales("ten_demo");
    expect(
      after.products.find((product) => product.id === "prd_001")?.stockOnHand,
    ).toBe((startingStock ?? 0) - 12);
    expect(
      after.stockMovements.some(
        (movement) =>
          movement.productId === "prd_001" && movement.quantity === -12,
      ),
    ).toBe(true);
  });

  it("persists workflow history for quotes and generated sales orders", async () => {
    const repository = new MemoryErpRepository();

    await repository.transitionQuote("ten_demo", {
      id: "quo_001",
      status: "approved",
      workflowTransition: {
        id: "wft_test_quote_approved",
        workflowId: "sales.quote",
        document: { entity: "Quote", id: "quo_001" },
        actorId: "usr_admin",
        from: "submitted",
        to: "approved",
        reason: "Approved for order generation.",
        comment: "Approved for order generation.",
        occurredAt: "2026-07-02T10:00:00.000Z",
      },
    });
    const quoteHistory = await repository.workflowInstance("ten_demo", {
      workflowId: "sales.quote",
      document: { entity: "Quote", id: "quo_001" },
    });

    expect(quoteHistory?.state).toBe("approved");
    expect(quoteHistory?.transitions).toEqual([
      expect.objectContaining({
        id: "wft_test_quote_approved",
        comment: "Approved for order generation.",
        from: "submitted",
        to: "approved",
      }),
    ]);

    const order = await repository.generateOrderFromQuote(
      "ten_demo",
      "quo_001",
    );
    const orderInitial = await repository.workflowInstance("ten_demo", {
      workflowId: "sales.order",
      document: { entity: "SalesOrder", id: order.id },
    });

    expect(orderInitial?.state).toBe(order.status);
    const previousOrderState = order.status;

    await repository.transitionOrder("ten_demo", {
      id: order.id,
      status: "closed",
      workflowTransition: {
        id: "wft_test_order_closed",
        workflowId: "sales.order",
        document: { entity: "SalesOrder", id: order.id },
        actorId: "usr_admin",
        from: previousOrderState,
        to: "closed",
        reason: "Closed after fulfillment.",
        occurredAt: "2026-07-02T10:05:00.000Z",
      },
    });
    const orderHistory = await repository.workflowInstance("ten_demo", {
      workflowId: "sales.order",
      document: { entity: "SalesOrder", id: order.id },
    });

    expect(orderHistory?.state).toBe("closed");
    expect(orderHistory?.transitions).toEqual([
      expect.objectContaining({
        id: "wft_test_order_closed",
        from: previousOrderState,
        to: "closed",
      }),
    ]);
  });

  it("adds customer custom fields without changing the customer DTO shape", async () => {
    const repository = new MemoryErpRepository();

    await repository.createCustomField("ten_demo", {
      entityType: "Customer",
      key: "industry",
      label: "Industry",
      fieldType: "text",
      required: false,
      options: [],
      displayOrder: 20,
    });
    const customization = await repository.customization("ten_demo");
    const customer = await repository.createCustomer("ten_demo", {
      code: "C-2001",
      name: "Atlas Health",
      owner: "Mina Cruz",
      email: "ops@atlas.example",
      creditLimit: { amount: 25000, currency: "USD" },
      customFields: { industry: "Healthcare" },
    });

    expect(
      customization.customFields.some((field) => field.key === "industry"),
    ).toBe(true);
    expect(
      customization.views.some((view) =>
        view.fields.includes("custom.industry"),
      ),
    ).toBe(true);
    expect(customer.customFields.industry).toBe("Healthcare");
  });

  it("posts balanced accounting entries for invoices and payments", async () => {
    const repository = new MemoryErpRepository();

    await repository.transitionInvoice("ten_demo", {
      id: "inv_001",
      status: "posted",
    });
    const afterInvoice = await repository.accounting("ten_demo");
    expect(
      afterInvoice.journalEntries.some(
        (entry) =>
          entry.sourceEntity === "Invoice" && entry.sourceId === "inv_001",
      ),
    ).toBe(true);
    expect(afterInvoice.trialBalance.isBalanced).toBe(true);
    expect(afterInvoice.trialBalance.debitTotal.amount).toBe(28600);
    expect(afterInvoice.trialBalance.creditTotal.amount).toBe(28600);

    await repository.recordPayment("ten_demo", {
      invoiceId: "inv_001",
      amount: { amount: 28600, currency: "USD" },
      method: "bank_transfer",
      receivedAt: "2026-07-01T10:00:00.000Z",
    });
    const afterPayment = await repository.accounting("ten_demo");
    const paymentWorkflow = await repository.workflowInstance("ten_demo", {
      workflowId: "sales.invoice",
      document: { entity: "Invoice", id: "inv_001" },
    });
    expect(afterPayment.payments).toHaveLength(1);
    expect(paymentWorkflow?.state).toBe("paid");
    expect(paymentWorkflow?.transitions).toEqual([
      expect.objectContaining({
        from: "posted",
        to: "paid",
      }),
    ]);
    expect(afterPayment.trialBalance.isBalanced).toBe(true);
    expect(afterPayment.trialBalance.debitTotal.amount).toBe(
      afterPayment.trialBalance.creditTotal.amount,
    );
  });

  it("persists invoice workflow history without duplicating invoice posting", async () => {
    const repository = new MemoryErpRepository();

    await repository.transitionInvoice("ten_demo", {
      id: "inv_001",
      status: "posted",
    });
    await repository.transitionInvoice("ten_demo", {
      id: "inv_001",
      status: "posted",
    });
    const afterRepeatedPosting = await repository.accounting("ten_demo");
    expect(
      afterRepeatedPosting.journalEntries.filter(
        (entry) =>
          entry.sourceEntity === "Invoice" && entry.sourceId === "inv_001",
      ),
    ).toHaveLength(1);

    await repository.transitionInvoice("ten_demo", {
      id: "inv_001",
      status: "paid",
      workflowTransition: {
        id: "wft_test_invoice_paid",
        workflowId: "sales.invoice",
        document: { entity: "Invoice", id: "inv_001" },
        actorId: "usr_admin",
        from: "posted",
        to: "paid",
        reason: "Paid after remittance.",
        occurredAt: "2026-07-02T10:10:00.000Z",
      },
    });

    const invoiceHistory = await repository.workflowInstance("ten_demo", {
      workflowId: "sales.invoice",
      document: { entity: "Invoice", id: "inv_001" },
    });
    const afterPaymentStatus = await repository.accounting("ten_demo");

    expect(invoiceHistory?.state).toBe("paid");
    expect(invoiceHistory?.transitions).toEqual([
      expect.objectContaining({
        id: "wft_test_invoice_paid",
        from: "posted",
        to: "paid",
      }),
    ]);
    expect(
      afterPaymentStatus.journalEntries.filter(
        (entry) =>
          entry.sourceEntity === "Invoice" && entry.sourceId === "inv_001",
      ),
    ).toHaveLength(1);
  });

  it("runs procure-to-pay with receipt stock and balanced AP entries", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.sales("ten_demo");
    const startingStock =
      before.products.find((product) => product.id === "prd_002")
        ?.stockOnHand ?? 0;

    const receipt = await repository.receivePurchaseOrder("ten_demo", "po_001");
    const supplierInvoice = await repository.createPurchaseInvoiceFromOrder(
      "ten_demo",
      "po_001",
    );
    await repository.payPurchaseInvoice("ten_demo", {
      purchaseInvoiceId: supplierInvoice.id,
      amount: supplierInvoice.total,
      method: "bank_transfer",
      paidAt: "2026-07-01T12:00:00.000Z",
    });

    const afterSales = await repository.sales("ten_demo");
    const afterAccounting = await repository.accounting("ten_demo");
    const afterProcurement = await repository.procurement("ten_demo");

    expect(receipt.lines[0]?.quantity).toBe(10);
    expect(
      afterSales.products.find((product) => product.id === "prd_002")
        ?.stockOnHand,
    ).toBe(startingStock + 10);
    expect(afterProcurement.purchaseInvoices[0]?.status).toBe("paid");
    expect(
      afterAccounting.journalEntries.some(
        (entry) => entry.sourceEntity === "PurchaseInvoice",
      ),
    ).toBe(true);
    expect(
      afterAccounting.journalEntries.some(
        (entry) => entry.sourceEntity === "SupplierPayment",
      ),
    ).toBe(true);
    expect(afterAccounting.trialBalance.isBalanced).toBe(true);
  });

  it("persists workflow instances and transitions for purchase orders", async () => {
    const repository = new MemoryErpRepository();
    const procurement = await repository.procurement("ten_demo");
    const supplier = procurement.suppliers[0];
    const sourceOrder = procurement.purchaseOrders[0];

    expect(supplier).toBeDefined();
    expect(sourceOrder).toBeDefined();

    const order = await repository.createPurchaseOrder("ten_demo", {
      supplierId: supplier?.id ?? "",
      expectedDate: "2026-08-15",
      lines: sourceOrder?.lines ?? [],
    });
    const document = { entity: "PurchaseOrder", id: order.id };
    const initial = await repository.workflowInstance("ten_demo", {
      workflowId: "procurement.purchase-order",
      document,
    });

    expect(initial?.state).toBe("draft");
    expect(initial?.transitions).toHaveLength(0);

    await repository.transitionPurchaseOrder("ten_demo", {
      id: order.id,
      status: "submitted",
      workflowTransition: {
        id: "wft_test_po_submitted",
        workflowId: "procurement.purchase-order",
        document,
        actorId: "usr_admin",
        from: "draft",
        to: "submitted",
        reason: "Submitted for approval.",
        occurredAt: "2026-07-02T09:30:00.000Z",
      },
    });

    const history = await repository.workflowInstance("ten_demo", {
      workflowId: "procurement.purchase-order",
      document,
    });

    expect(history?.state).toBe("submitted");
    expect(history?.transitions).toEqual([
      expect.objectContaining({
        id: "wft_test_po_submitted",
        from: "draft",
        to: "submitted",
        reason: "Submitted for approval.",
      }),
    ]);
  });

  it("runs finance close, treasury, costing, assets, depreciation, and FX workflows", async () => {
    const repository = new MemoryErpRepository();

    const receipt = await repository.receivePurchaseOrder("ten_demo", "po_001");
    const before = await repository.accounting("ten_demo");
    const bankAccount = before.bankAccounts[0];
    const fiscalPeriod = before.fiscalPeriods.find(
      (period) => period.status === "open",
    );

    expect(bankAccount).toBeDefined();
    expect(fiscalPeriod).toBeDefined();
    expect(before.aging.receivables.total.amount).toBeGreaterThanOrEqual(0);

    const bankTransaction = await repository.createBankTransaction("ten_demo", {
      bankAccountId: bankAccount?.id ?? "",
      reference: "BANK-TEST-001",
      direction: "inbound",
      amount: { amount: 1250, currency: "USD" },
      transactionDate: "2026-07-01",
    });
    const reconciliation = await repository.reconcileBankAccount("ten_demo", {
      bankAccountId: bankAccount?.id ?? "",
      statementDate: "2026-07-01",
      statementBalance: { amount: 1250, currency: "USD" },
      transactionIds: [bankTransaction.id],
    });
    const allocation = await repository.allocateLandedCost("ten_demo", {
      purchaseReceiptId: receipt.id,
      amount: { amount: 500, currency: "USD" },
      method: "quantity",
    });
    const asset = await repository.createFixedAsset("ten_demo", {
      assetTag: "FA-TEST-001",
      name: "Test press",
      purchaseDate: "2026-07-01",
      cost: { amount: 12000, currency: "USD" },
      usefulLifeMonths: 24,
    });
    const depreciation = await repository.runDepreciation("ten_demo", {
      fixedAssetId: asset.id,
      runDate: "2026-07-31",
    });
    const rate = await repository.setExchangeRate("ten_demo", {
      baseCurrency: "USD",
      quoteCurrency: "PHP",
      rate: 58.25,
      effectiveDate: "2026-07-01",
    });
    const close = await repository.closeFiscalPeriod("ten_demo", {
      fiscalPeriodId: fiscalPeriod?.id ?? "",
      closedAt: "2026-07-31T23:59:59.000Z",
    });
    const after = await repository.accounting("ten_demo");

    expect(reconciliation.status).toBe("balanced");
    expect(allocation.amount.amount).toBe(500);
    expect(depreciation.amount.amount).toBe(500);
    expect(rate.rate).toBe(58.25);
    expect(close.status).toBe("closed");
    expect(after.bankTransactions[0]?.reconciledAt).toBeTruthy();
    expect(after.fixedAssets[0]?.accumulatedDepreciation.amount).toBe(500);
    expect(after.periodCloses).toHaveLength(1);
    expect(after.trialBalance.isBalanced).toBe(true);
  });

  it("reserves, transfers, cycle counts, and reconciles inventory ledger", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.inventory("ten_demo");
    const mainBin = before.bins.find((bin) => bin.code === "MAIN-01");
    const holdBin = before.bins.find((bin) => bin.code === "QC-HOLD");

    expect(before.reconciled).toBe(true);
    expect(mainBin).toBeDefined();
    expect(holdBin).toBeDefined();

    const reservation = await repository.reserveStock("ten_demo", {
      productId: "prd_002",
      quantity: 3,
      sourceEntity: "SalesOrder",
      sourceId: "so-test",
    });
    const transfer = await repository.transferStock("ten_demo", {
      productId: "prd_002",
      fromBinId: mainBin?.id ?? "",
      toBinId: holdBin?.id ?? "",
      quantity: 2,
    });
    const count = await repository.postCycleCount("ten_demo", {
      productId: "prd_002",
      binId: holdBin?.id ?? "",
      countedQuantity: 2,
    });

    const after = await repository.inventory("ten_demo");
    expect(reservation.status).toBe("active");
    expect(transfer.fromBinCode).toBe("MAIN-01");
    expect(transfer.toBinCode).toBe("QC-HOLD");
    expect(count.variance).toBe(0);
    expect(
      after.ledger.some(
        (entry) =>
          entry.sourceEntity === "StockTransfer" && entry.quantity === -2,
      ),
    ).toBe(true);
    expect(after.reconciled).toBe(true);
  });

  it("plans demand, creates a work order, and posts manufacturing inventory ledger", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.sales("ten_demo");
    const startingFinished =
      before.products.find((product) => product.id === "prd_002")
        ?.stockOnHand ?? 0;
    const startingComponent =
      before.products.find((product) => product.id === "prd_001")
        ?.stockOnHand ?? 0;

    const plan = await repository.createProductionPlan("ten_demo", {
      productId: "prd_002",
      demandQuantity: startingFinished + 8,
      demandDate: "2026-08-15",
      sourceEntity: "Forecast",
      sourceId: "forecast-test",
    });
    const manufacturing = await repository.manufacturing("ten_demo");
    const suggestion = manufacturing.mrpSuggestions.find(
      (record) => record.suggestionType === "work_order",
    );
    expect(plan.lines[0]?.plannedQuantity).toBe(8);
    expect(suggestion?.quantity).toBe(8);

    const workOrder = await repository.createWorkOrderFromSuggestion(
      "ten_demo",
      suggestion?.id ?? "",
    );
    await repository.releaseWorkOrder("ten_demo", workOrder.id);
    let manufacturingAfterRelease = await repository.manufacturing("ten_demo");
    const jobCard = manufacturingAfterRelease.jobCards.find(
      (card) => card.workOrderId === workOrder.id,
    );
    const startedJob = await repository.startJobCard("ten_demo", {
      jobCardId: jobCard?.id ?? "",
      operator: "Shop Lead",
    });
    const startedStatus = startedJob.status;
    const downtime = await repository.recordDowntime("ten_demo", {
      workCenterId: startedJob.workCenterId,
      jobCardId: startedJob.id,
      reason: "Material staging",
      minutes: 10,
    });
    const completedJob = await repository.completeJobCard("ten_demo", {
      jobCardId: startedJob.id,
      actualMinutes: startedJob.plannedMinutes,
    });
    const completed = await repository.completeWorkOrder(
      "ten_demo",
      workOrder.id,
    );
    const afterSales = await repository.sales("ten_demo");
    const afterInventory = await repository.inventory("ten_demo");
    manufacturingAfterRelease = await repository.manufacturing("ten_demo");

    expect(startedStatus).toBe("in_process");
    expect(completedJob.status).toBe("completed");
    expect(downtime.minutes).toBe(10);
    expect(
      manufacturingAfterRelease.capacitySchedule[0]?.downtimeMinutes,
    ).toBeGreaterThanOrEqual(10);
    expect(completed.status).toBe("completed");
    expect(
      afterSales.products.find((product) => product.id === "prd_002")
        ?.stockOnHand,
    ).toBe(startingFinished + 8);
    expect(
      afterSales.products.find((product) => product.id === "prd_001")
        ?.stockOnHand,
    ).toBe(startingComponent - 8);
    expect(
      afterInventory.ledger.some(
        (entry) =>
          entry.sourceEntity === "WorkOrderIssue" && entry.quantity === -8,
      ),
    ).toBe(true);
    expect(
      afterInventory.ledger.some(
        (entry) =>
          entry.sourceEntity === "WorkOrderReceipt" && entry.quantity === 8,
      ),
    ).toBe(true);
    expect(afterInventory.reconciled).toBe(true);
  });

  it("fails an inspection, creates CAPA, quarantines, and recalls a lot", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.quality("ten_demo");
    const template = before.inspectionTemplates[0];
    const trace = before.traceRecords[0];

    const inspection = await repository.createQualityInspection("ten_demo", {
      templateId: template?.id ?? "",
      traceRecordId: trace?.id ?? "",
      inspectedBy: "Quality Lead",
      results: [
        { checkpoint: "Package intact", passed: true, note: "" },
        {
          checkpoint: "Device powers on",
          passed: false,
          note: "Scanner failed boot test.",
        },
      ],
    });
    const recall = await repository.createRecall("ten_demo", {
      lotNumber: trace?.lotNumber ?? "",
      reason: "Boot test failure found during inspection.",
    });
    const after = await repository.quality("ten_demo");

    expect(inspection.status).toBe("failed");
    expect(after.nonConformances).toHaveLength(1);
    expect(after.correctiveActions).toHaveLength(1);
    expect(recall.affectedTraceIds).toContain(trace?.id);
    expect(
      after.traceRecords.find((record) => record.id === trace?.id)?.status,
    ).toBe("recalled");
  });

  it("runs an inventory report and creates an export job", async () => {
    const repository = new MemoryErpRepository();
    const snapshot = await repository.reporting("ten_demo");
    const report = snapshot.reports[0];

    const run = await repository.runReport("ten_demo", {
      reportId: report?.id ?? "",
    });
    const exportJob = await repository.createExportJob("ten_demo", {
      reportId: report?.id ?? "",
      format: "csv",
    });

    expect(run.status).toBe("completed");
    expect(run.rowCount).toBeGreaterThan(0);
    expect(run.rows[0]).toHaveProperty("ledgerQuantity");
    expect(exportJob.status).toBe("completed");
    expect(exportJob.downloadUrl).toContain(".csv");
  });

  it("builds report definitions and print previews", async () => {
    const repository = new MemoryErpRepository();
    const report = await repository.createSavedReport("ten_demo", {
      name: "Aging Preview",
      entityType: "Aging",
      columns: ["bucket", "total", "current", "over90"],
      filters: {},
      parameters: [],
      sorts: [{ field: "bucket", direction: "asc" }],
      groupBy: [],
      chart: { type: "bar", labelField: "bucket", valueField: "total" },
      owner: "Admin",
    });
    const preview = await repository.previewReport("ten_demo", {
      reportId: report.id,
    });
    const run = await repository.runReport("ten_demo", { reportId: report.id });
    const format = await repository.createPrintFormat("ten_demo", {
      name: "Invoice Preview",
      entityType: "Invoice",
      template: "invoice-preview",
      blocks: [
        { type: "heading", text: "Invoice" },
        { type: "field", field: "number", label: "Invoice" },
        { type: "field", field: "customerName", label: "Customer" },
      ],
      active: true,
    });
    const printPreview = await repository.previewPrintFormat("ten_demo", {
      printFormatId: format.id,
      recordId: "inv_001",
    });

    expect(preview.columns.map((column) => column.key)).toEqual([
      "bucket",
      "total",
      "current",
      "over90",
    ]);
    expect(preview.chart.type).toBe("bar");
    expect(run.rows[0]).toHaveProperty("bucket");
    expect(format.blocks).toHaveLength(3);
    expect(printPreview.html).toContain("<h1>Invoice</h1>");
  });

  it("creates API keys and dead-letters failed webhook deliveries", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.integration("ten_demo");
    const subscription = before.webhookSubscriptions[0];

    const apiKey = await repository.createApiKey("ten_demo", {
      name: "Warehouse scanner sync",
      scopes: ["inventory.read", "integration.read"],
    });
    const delivery = await repository.dispatchWebhook("ten_demo", {
      subscriptionId: subscription?.id ?? "",
      eventType: subscription?.eventTypes[0] ?? "",
      payload: { entityId: "wo-test" },
      fail: true,
    });
    const statusBeforeRetry = delivery.status;
    const retried = await repository.retryWebhookDelivery(
      "ten_demo",
      delivery.id,
    );
    const after = await repository.integration("ten_demo");

    expect(apiKey.keyPrefix).toMatch(/^erp_/);
    expect(statusBeforeRetry).toBe("failed");
    expect(retried.status).toBe("dead_letter");
    expect(
      after.deadLetters.some((record) => record.deliveryId === delivery.id),
    ).toBe(true);
  });

  it("buffers business events in the outbox and dispatches them to webhooks", async () => {
    const repository = new MemoryErpRepository();

    const lead = await repository.createLead("ten_demo", {
      companyName: "Durable Events Co",
      contactName: "Iris Chen",
      email: "iris@events.example",
      source: "Partner",
      owner: "Mina Cruz",
    });
    const integration = await repository.integration("ten_demo");
    const event = integration.outboxEvents.find(
      (record) => record.eventType === "operations.lead.created",
    );
    const statusBeforeDispatch = event?.status;
    const dispatched = await repository.dispatchOutboxEvent(
      "ten_demo",
      event?.id ?? "",
    );
    const after = await repository.integration("ten_demo");

    expect(lead.stage).toBe("new");
    expect(statusBeforeDispatch).toBe("pending");
    expect(dispatched.status).toBe("dispatched");
    expect(
      after.webhookDeliveries.some(
        (delivery) => delivery.eventType === "operations.lead.created",
      ),
    ).toBe(true);
  });

  it("dead-letters outbox events after max attempts", async () => {
    const repository = new MemoryErpRepository();
    const event = await repository.publishOutboxEvent("ten_demo", {
      eventType: "integration.unsubscribed-event",
      payload: { entityId: "evt-test" },
    });

    await repository.dispatchOutboxEvent("ten_demo", event.id);
    await repository.dispatchOutboxEvent("ten_demo", event.id);
    const deadLettered = await repository.dispatchOutboxEvent(
      "ten_demo",
      event.id,
    );
    const integration = await repository.integration("ten_demo");

    expect(deadLettered.status).toBe("dead_letter");
    expect(deadLettered.attempts).toBe(3);
    expect(integration.deadLetters).toEqual([
      expect.objectContaining({
        deliveryId: null,
        outboxEventId: event.id,
      }),
    ]);
  });

  it("executes WMS pick, pack, ship, and put-away workflows", async () => {
    const repository = new MemoryErpRepository();
    const sales = await repository.sales("ten_demo");
    const procurement = await repository.procurement("ten_demo");
    const order = sales.orders[0];
    const purchaseOrder = procurement.purchaseOrders[0];

    const pickList = await repository.createPickList("ten_demo", {
      salesOrderId: order?.id ?? "",
    });
    let inventory = await repository.inventory("ten_demo");
    const pickTask = inventory.pickTasks.find(
      (task) => task.pickListId === pickList.id,
    );
    const picked = await repository.confirmPickTask("ten_demo", {
      pickTaskId: pickTask?.id ?? "",
      pickedQuantity: pickTask?.quantity ?? 0,
      barcode: pickTask?.sku ?? "PICK",
    });
    const pack = await repository.packPickList("ten_demo", {
      pickListId: pickList.id,
      packageCode: "PKG-TEST",
    });
    const shipment = await repository.shipPackRecord("ten_demo", {
      packRecordId: pack.id,
      carrier: "Internal Fleet",
      trackingNumber: "TRK-TEST",
    });

    const receipt = await repository.receivePurchaseOrder(
      "ten_demo",
      purchaseOrder?.id ?? "",
    );
    const putAwayTasks = await repository.createPutAwayTasks("ten_demo", {
      purchaseReceiptId: receipt.id,
    });
    const putAway = await repository.confirmPutAwayTask("ten_demo", {
      putAwayTaskId: putAwayTasks[0]?.id ?? "",
      barcode: putAwayTasks[0]?.sku ?? "PUT",
    });
    inventory = await repository.inventory("ten_demo");
    const quality = await repository.quality("ten_demo");
    const receiptTrace = quality.traceRecords.find(
      (record) =>
        record.sourceEntity === "PurchaseReceipt" &&
        record.sourceId === receipt.id,
    );
    const genealogy = await repository.traceGenealogy(
      "ten_demo",
      receiptTrace?.id ?? "",
    );

    expect(pickList.status).toBe("shipped");
    expect(picked.status).toBe("picked");
    expect(pack.status).toBe("shipped");
    expect(shipment.status).toBe("shipped");
    expect(putAway.status).toBe("completed");
    expect(
      inventory.barcodeScans.some(
        (scan) => scan.entity === "Shipment" && scan.barcode === "TRK-TEST",
      ),
    ).toBe(true);
    expect(
      quality.traceMovements.some(
        (movement) =>
          movement.movementType === "shipment" &&
          movement.sourceId === shipment.id,
      ),
    ).toBe(true);
    expect(
      genealogy.movements.some(
        (movement) =>
          movement.movementType === "receipt" &&
          movement.sourceId === receipt.id,
      ),
    ).toBe(true);
    expect(
      genealogy.movements.some(
        (movement) =>
          movement.movementType === "putaway" &&
          movement.sourceId === putAway.id,
      ),
    ).toBe(true);
  });

  it("manages CRM, project, HR leave, and service workflows", async () => {
    const repository = new MemoryErpRepository();
    const before = await repository.operations("ten_demo");
    const employee = before.employees[0];

    const lead = await repository.createLead("ten_demo", {
      companyName: "Aster Labs",
      contactName: "Noah Park",
      email: "noah@aster.example",
      source: "Website",
      owner: "Mina Cruz",
    });
    const project = await repository.createProject("ten_demo", {
      code: "PRJ-2001",
      name: "Lab implementation",
      customerName: "Aster Labs",
      budget: { amount: 18000, currency: "USD" },
      startDate: "2026-08-01",
      endDate: "2026-09-15",
    });
    const leave = await repository.createLeaveRequest("ten_demo", {
      employeeId: employee?.id ?? "",
      leaveType: "vacation",
      startDate: "2026-08-10",
      endDate: "2026-08-12",
    });
    const serviceCase = await repository.createServiceCase("ten_demo", {
      customerName: "Aster Labs",
      subject: "Implementation kickoff question",
      priority: "medium",
      owner: "Support Lead",
    });
    const closed = await repository.closeServiceCase(
      "ten_demo",
      serviceCase.id,
    );
    const after = await repository.operations("ten_demo");

    expect(lead.stage).toBe("new");
    expect(project.status).toBe("planned");
    expect(leave.status).toBe("requested");
    expect(closed.status).toBe("closed");
    expect(after.leads.some((record) => record.id === lead.id)).toBe(true);
    expect(
      after.serviceCases.find((record) => record.id === serviceCase.id)?.status,
    ).toBe("closed");
  });

  it("runs POS checkout and ecommerce order ingestion across sales, inventory, accounting, and outbox", async () => {
    const repository = new MemoryErpRepository();
    const beforeSales = await repository.sales("ten_demo");
    const beforeCommerce = await repository.commerce("ten_demo");
    const register = beforeCommerce.registers[0];
    const customer = beforeSales.customers[0];
    const product = beforeSales.products[0];
    const ecommerceChannel =
      beforeCommerce.channels.find(
        (channel) => channel.channelType === "ecommerce",
      ) ?? beforeCommerce.channels[0];
    const startingStock = product?.stockOnHand ?? 0;
    const line = {
      productId: product?.id ?? "",
      sku: product?.sku ?? "",
      description: product?.name ?? "",
      quantity: 1,
      unitPrice: product?.price ?? { amount: 0, currency: "USD" },
      total: product?.price ?? { amount: 0, currency: "USD" },
    };

    const shift = await repository.openPosShift("ten_demo", {
      registerId: register?.id ?? "",
      openedBy: "Store Lead",
      openingCash: { amount: 250, currency: "USD" },
    });
    const sale = await repository.checkoutPosSale("ten_demo", {
      shiftId: shift.id,
      customerId: customer?.id ?? "",
      tenderType: "cash",
      lines: [line],
    });
    const afterSaleCommerce = await repository.commerce("ten_demo");
    const updatedShift = afterSaleCommerce.shifts.find(
      (record) => record.id === shift.id,
    );
    const statusBeforeClose = updatedShift?.status;
    const closedShift = await repository.closePosShift("ten_demo", {
      shiftId: shift.id,
      closingCash: updatedShift?.expectedCash ?? { amount: 0, currency: "USD" },
    });
    const catalog = await repository.publishChannelCatalog("ten_demo", {
      channelId: ecommerceChannel?.id ?? "",
      productIds: [product?.id ?? ""],
    });
    const channelOrder = await repository.ingestChannelOrder("ten_demo", {
      channelId: ecommerceChannel?.id ?? "",
      externalOrderId: "WEB-TEST-001",
      customerId: customer?.id ?? "",
      lines: [line],
    });
    const idempotentOrder = await repository.ingestChannelOrder("ten_demo", {
      channelId: ecommerceChannel?.id ?? "",
      externalOrderId: "WEB-TEST-001",
      customerId: customer?.id ?? "",
      lines: [line],
    });
    const afterSales = await repository.sales("ten_demo");
    const afterAccounting = await repository.accounting("ten_demo");
    const afterIntegration = await repository.integration("ten_demo");

    expect(statusBeforeClose).toBe("open");
    expect(sale.status).toBe("posted");
    expect(closedShift.status).toBe("closed");
    expect(
      catalog.some((item) => item.productId === product?.id && item.published),
    ).toBe(true);
    expect(channelOrder.status).toBe("imported");
    expect(idempotentOrder.id).toBe(channelOrder.id);
    expect(
      afterSales.products.find((record) => record.id === product?.id)
        ?.stockOnHand,
    ).toBe(startingStock - 2);
    expect(
      afterAccounting.payments.some((payment) => payment.id === sale.paymentId),
    ).toBe(true);
    expect(afterAccounting.trialBalance.isBalanced).toBe(true);
    expect(
      afterIntegration.outboxEvents.some(
        (event) => event.eventType === "commerce.pos-sale.posted",
      ),
    ).toBe(true);
    expect(
      afterIntegration.outboxEvents.some(
        (event) => event.eventType === "commerce.catalog.published",
      ),
    ).toBe(true);
    expect(
      afterIntegration.outboxEvents.some(
        (event) => event.eventType === "commerce.channel-order.imported",
      ),
    ).toBe(true);
  });

  it("records attendance, reimburses expenses, pays advances, and posts payroll accounting", async () => {
    const repository = new MemoryErpRepository();
    const operations = await repository.operations("ten_demo");
    const employee = operations.employees[0];

    const attendance = await repository.recordAttendance("ten_demo", {
      employeeId: employee?.id ?? "",
      workDate: "2026-07-01",
      checkIn: "2026-07-01T09:00:00.000Z",
      checkOut: "2026-07-01T17:00:00.000Z",
    });
    const claim = await repository.submitExpenseClaim("ten_demo", {
      employeeId: employee?.id ?? "",
      category: "Travel",
      description: "Client transport",
      amount: { amount: 85, currency: "USD" },
      submittedAt: "2026-07-01T10:00:00.000Z",
    });
    const approved = await repository.approveExpenseClaim("ten_demo", {
      id: claim.id,
      approvedAt: "2026-07-01T11:00:00.000Z",
    });
    const approvedStatus = approved.status;
    const paid = await repository.payExpenseClaim("ten_demo", {
      id: claim.id,
      paidAt: "2026-07-01T12:00:00.000Z",
    });
    const advance = await repository.createEmployeeAdvance("ten_demo", {
      employeeId: employee?.id ?? "",
      amount: { amount: 250, currency: "USD" },
      requestedAt: "2026-07-01T13:00:00.000Z",
    });
    const paidAdvance = await repository.payEmployeeAdvance("ten_demo", {
      id: advance.id,
      paidAt: "2026-07-01T14:00:00.000Z",
      paymentReference: "ADV-TEST",
    });
    const payroll = await repository.runPayroll("ten_demo", {
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      postedAt: "2026-07-31T23:00:00.000Z",
    });
    const hr = await repository.hr("ten_demo");
    const accounting = await repository.accounting("ten_demo");
    const integration = await repository.integration("ten_demo");

    expect(attendance.hours).toBe(8);
    expect(approvedStatus).toBe("approved");
    expect(paid.status).toBe("paid");
    expect(paid.journalEntryId).toBeTruthy();
    expect(paidAdvance.status).toBe("paid");
    expect(payroll.status).toBe("posted");
    expect(hr.payslips).toHaveLength(1);
    expect(
      accounting.journalEntries.some(
        (entry) => entry.sourceEntity === "ExpenseClaim",
      ),
    ).toBe(true);
    expect(
      accounting.journalEntries.some(
        (entry) => entry.sourceEntity === "EmployeeAdvance",
      ),
    ).toBe(true);
    expect(
      accounting.journalEntries.some(
        (entry) => entry.sourceEntity === "PayrollRun",
      ),
    ).toBe(true);
    expect(accounting.trialBalance.isBalanced).toBe(true);
    expect(
      integration.outboxEvents.some(
        (event) => event.eventType === "hr.attendance.recorded",
      ),
    ).toBe(true);
    expect(
      integration.outboxEvents.some(
        (event) => event.eventType === "hr.expense.paid",
      ),
    ).toBe(true);
    expect(
      integration.outboxEvents.some(
        (event) => event.eventType === "hr.payroll.posted",
      ),
    ).toBe(true);
  });

  it("executes configured automation rules from domain events", async () => {
    const repository = new MemoryErpRepository();
    const rule = await repository.createAutomationRule("ten_demo", {
      name: "Payroll posted automation",
      triggerEvent: "hr.payroll.posted",
      enabled: true,
      actions: [
        { type: "audit", message: "Payroll automation audit action." },
        { type: "outbox", eventType: "automation.rule.executed" },
      ],
    });

    await repository.runPayroll("ten_demo", {
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      postedAt: "2026-09-30T23:00:00.000Z",
    });
    const customization = await repository.customization("ten_demo");
    const integration = await repository.integration("ten_demo");
    const audit = await repository.auditTrail("ten_demo");
    const updatedRule = customization.automationRules.find(
      (record) => record.id === rule.id,
    );

    expect(updatedRule?.runCount).toBe(1);
    expect(updatedRule?.lastRunAt).toBeTruthy();
    expect(updatedRule?.lastError).toBeNull();
    expect(
      integration.outboxEvents.some(
        (event) => event.eventType === "automation.rule.executed",
      ),
    ).toBe(true);
    expect(
      audit.some(
        (event) =>
          event.entity === "AutomationRule" && event.action === "executed",
      ),
    ).toBe(true);
  });

  it("stores workflow assignment rules in customization metadata", async () => {
    const repository = new MemoryErpRepository();

    const rule = await repository.createWorkflowAssignmentRule("ten_demo", {
      workflowId: "sales.invoice",
      fromState: "posted",
      toState: "paid",
      role: "admin",
      minAmount: 10000,
      maxAmount: null,
      active: true,
    });
    const customization = await repository.customization("ten_demo");

    expect(customization.workflowAssignmentRules).toContainEqual(rule);
  });

  it("stores workflow escalation rules in customization metadata", async () => {
    const repository = new MemoryErpRepository();

    const rule = await repository.createWorkflowEscalationRule("ten_demo", {
      workflowId: "sales.invoice",
      fromState: "posted",
      toState: "paid",
      targetRole: "admin",
      dueInHours: 12,
      escalationRole: "manager",
      notificationChannel: "email",
      active: true,
    });
    const customization = await repository.customization("ten_demo");

    expect(customization.workflowEscalationRules).toContainEqual(rule);
  });

  it("materializes workflow tasks without duplicate notification outbox events", async () => {
    const repository = new MemoryErpRepository();
    const task = {
      id: "wftask_procurement.purchase-order_PurchaseOrder_po_001_approved",
      workflowId: "procurement.purchase-order",
      document: { entity: "PurchaseOrder", id: "po_001" },
      title: "PO-2026-0001",
      summary: "Supplier purchase order.",
      currentState: "submitted",
      action: {
        id: "procurement.purchase-order.submitted.approved",
        label: "Approved",
        to: "approved",
        requiredPermissions: ["procurement.manage"],
        requiredRoles: [],
      },
      assigneeRole: "admin",
      assigneeRoles: ["admin"],
      assigneePermissions: ["procurement.manage"],
      dueAt: "2026-07-02T00:00:00.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
      ageHours: 30,
      dueStatus: "overdue" as const,
      escalated: true,
      escalatedRoles: ["manager"],
      notificationChannels: ["webhook"],
    };

    await repository.materializeWorkflowTasks("ten_demo", { tasks: [task] });
    await repository.materializeWorkflowTasks("ten_demo", { tasks: [task] });
    const integration = await repository.integration("ten_demo");

    expect(integration.workflowTasks).toHaveLength(1);
    expect(
      integration.outboxEvents.filter(
        (event) => event.eventType === "workflow.task.assigned",
      ),
    ).toHaveLength(1);
    expect(
      integration.outboxEvents.filter(
        (event) => event.eventType === "workflow.task.escalated",
      ),
    ).toHaveLength(1);
    expect(integration.workflowTasks[0]?.assignedNotifiedAt).toBeTruthy();
    expect(integration.workflowTasks[0]?.escalatedNotifiedAt).toBeTruthy();
  });

  it("closes materialized workflow tasks on completed transitions", async () => {
    const repository = new MemoryErpRepository();
    const baseTask = {
      workflowId: "procurement.purchase-order",
      document: { entity: "PurchaseOrder", id: "po_001" },
      title: "PO-2026-0001",
      summary: "Supplier purchase order.",
      currentState: "submitted",
      assigneeRole: "admin",
      assigneeRoles: ["admin"],
      assigneePermissions: ["procurement.manage"],
      dueAt: "2026-07-02T00:00:00.000Z",
      createdAt: "2026-07-01T00:00:00.000Z",
      ageHours: 30,
      dueStatus: "overdue" as const,
      escalated: false,
      escalatedRoles: [],
      notificationChannels: [],
    };
    await repository.materializeWorkflowTasks("ten_demo", {
      tasks: [
        {
          ...baseTask,
          id: "wftask_procurement.purchase-order_PurchaseOrder_po_001_approved",
          action: {
            id: "procurement.purchase-order.submitted.approved",
            label: "Approved",
            to: "approved",
            requiredPermissions: ["procurement.manage"],
            requiredRoles: [],
          },
        },
        {
          ...baseTask,
          id: "wftask_procurement.purchase-order_PurchaseOrder_po_001_cancelled",
          action: {
            id: "procurement.purchase-order.submitted.cancelled",
            label: "Cancelled",
            to: "cancelled",
            requiredPermissions: ["procurement.manage"],
            requiredRoles: [],
          },
        },
      ],
    });

    await repository.completeWorkflowTask("ten_demo", {
      workflowId: "procurement.purchase-order",
      entity: "PurchaseOrder",
      documentId: "po_001",
      completedAction: "approved",
      previousState: "submitted",
      currentState: "approved",
    });
    await repository.completeWorkflowTask("ten_demo", {
      workflowId: "procurement.purchase-order",
      entity: "PurchaseOrder",
      documentId: "po_001",
      completedAction: "approved",
      previousState: "submitted",
      currentState: "approved",
    });
    const integration = await repository.integration("ten_demo");

    expect(integration.workflowTasks.map((task) => task.status).sort()).toEqual(
      ["cancelled", "completed"],
    );
    expect(
      integration.outboxEvents.filter(
        (event) => event.eventType === "workflow.task.completed",
      ),
    ).toHaveLength(1);
    expect(
      integration.outboxEvents.filter(
        (event) => event.eventType === "workflow.task.cancelled",
      ),
    ).toHaveLength(1);
  });

  it("records workflow task reassignment, snooze, retry, and audit history", async () => {
    const repository = new MemoryErpRepository();
    await repository.materializeWorkflowTasks("ten_demo", {
      tasks: [
        {
          id: "wftask_procurement.purchase-order_PurchaseOrder_po_001_approved",
          workflowId: "procurement.purchase-order",
          document: { entity: "PurchaseOrder", id: "po_001" },
          action: {
            id: "procurement.purchase-order.submitted.approved",
            label: "Approved",
            to: "approved",
            requiredPermissions: ["procurement.manage"],
            requiredRoles: [],
          },
          title: "PO-2026-0001",
          summary: "Supplier purchase order.",
          currentState: "submitted",
          assigneeRole: "admin",
          assigneeRoles: ["admin"],
          assigneePermissions: ["procurement.manage"],
          dueAt: "2026-07-02T00:00:00.000Z",
          createdAt: "2026-07-01T00:00:00.000Z",
          ageHours: 30,
          dueStatus: "overdue" as const,
          escalated: false,
          escalatedRoles: [],
          notificationChannels: ["webhook"],
        },
      ],
    });
    const task = (await repository.integration("ten_demo")).workflowTasks[0];
    expect(task).toBeDefined();

    const reassigned = await repository.reassignWorkflowTask("ten_demo", {
      taskId: task!.id,
      role: "manager",
      actorId: "usr_admin",
      reason: "Load balancing",
    });
    const snoozed = await repository.snoozeWorkflowTask("ten_demo", {
      taskId: task!.id,
      dueAt: "2026-07-04T00:00:00.000Z",
      actorId: "usr_admin",
      reason: "Waiting for supplier documents",
    });
    const retried = await repository.retryWorkflowTaskNotification("ten_demo", {
      taskId: task!.id,
      notification: "assigned",
      actorId: "usr_admin",
      reason: "Manual retry",
    });
    const integration = await repository.integration("ten_demo");
    const audit = await repository.auditTrail("ten_demo");

    expect(reassigned.assigneeRoles).toEqual(["manager"]);
    expect(snoozed.dueAt).toBe("2026-07-04T00:00:00.000Z");
    expect(snoozed.dueStatus).toBe("open");
    expect(retried.operations.map((operation) => operation.operation)).toEqual([
      "retried",
      "snoozed",
      "reassigned",
    ]);
    expect(
      integration.outboxEvents.filter(
        (event) => event.eventType === "workflow.task.assigned",
      ),
    ).toHaveLength(2);
    expect(
      integration.outboxEvents.some((event) =>
        String(event.payload.idempotencyKey).includes(":retry:"),
      ),
    ).toBe(true);
    expect(
      audit
        .filter((event) => event.entity === "WorkflowTaskRecord")
        .map((event) => event.action),
    ).toEqual(
      expect.arrayContaining(["notification_retried", "snoozed", "reassigned"]),
    );
  });
});
