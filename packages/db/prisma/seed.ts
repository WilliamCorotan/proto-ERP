import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { demoCommerceData } from "@erp/commerce";
import { demoHrData } from "@erp/hr";
import { demoSalesData } from "@erp/sales";
import { demoProcurementData } from "@erp/procurement";
import { demoInventoryData } from "@erp/inventory";
import { demoManufacturingData } from "@erp/manufacturing";
import { demoQualityData } from "@erp/quality";
import { demoReportingData } from "@erp/reporting";
import { demoIntegrationData } from "@erp/integration";
import { demoOperationsData } from "@erp/operations";
import { hashPassword } from "@erp/core/security";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://erp:erp@localhost:5432/erp?schema=public";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});

async function main() {
  const passwordHash = await hashPassword("admin123", "open-erp-demo-admin");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: { name: "Acme Operations" },
    create: {
      id: "ten_demo",
      slug: "acme",
      name: "Acme Operations"
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "admin" } },
    update: {
      permissions: [
        "core.admin",
        "core.audit.read",
        "sales.customer.read",
        "sales.customer.write",
        "sales.product.manage",
        "sales.quote.manage",
        "sales.order.manage",
        "sales.invoice.manage",
        "accounting.read",
        "accounting.manage",
        "commerce.read",
        "commerce.manage",
        "hr.read",
        "hr.manage",
        "procurement.read",
        "procurement.manage",
        "procurement.ap.manage",
        "inventory.read",
        "inventory.manage",
        "manufacturing.read",
        "manufacturing.manage",
        "quality.read",
        "quality.manage",
        "reporting.read",
        "reporting.manage",
        "integration.read",
        "integration.manage",
        "operations.read",
        "operations.manage"
      ]
    },
    create: {
      id: "role_admin",
      tenantId: tenant.id,
      key: "admin",
      name: "Administrator",
      permissions: [
        "core.admin",
        "core.audit.read",
        "sales.customer.read",
        "sales.customer.write",
        "sales.product.manage",
        "sales.quote.manage",
        "sales.order.manage",
        "sales.invoice.manage",
        "accounting.read",
        "accounting.manage",
        "commerce.read",
        "commerce.manage",
        "hr.read",
        "hr.manage",
        "procurement.read",
        "procurement.manage",
        "procurement.ap.manage",
        "inventory.read",
        "inventory.manage",
        "manufacturing.read",
        "manufacturing.manage",
        "quality.read",
        "quality.manage",
        "reporting.read",
        "reporting.manage",
        "integration.read",
        "integration.manage",
        "operations.read",
        "operations.manage"
      ]
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@acme.example" } },
    update: { name: "Admin", passwordHash },
    create: {
      id: "usr_admin",
      tenantId: tenant.id,
      email: "admin@acme.example",
      name: "Admin",
      passwordHash
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });

  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "enabled_modules" } },
    update: {
      value: ["accounting", "commerce", "core", "hr", "integration", "inventory", "manufacturing", "operations", "procurement", "quality", "reporting", "sales"]
    },
    create: {
      tenantId: tenant.id,
      key: "enabled_modules",
      value: ["accounting", "commerce", "core", "hr", "integration", "inventory", "manufacturing", "operations", "procurement", "quality", "reporting", "sales"]
    }
  });

  const accounts = [
    { id: "acct_cash", code: "1000", name: "Cash", type: "asset", normalBalance: "debit" },
    { id: "acct_ar", code: "1100", name: "Accounts Receivable", type: "asset", normalBalance: "debit" },
    { id: "acct_employee_advances", code: "1150", name: "Employee Advances", type: "asset", normalBalance: "debit" },
    { id: "acct_inventory", code: "1200", name: "Inventory", type: "asset", normalBalance: "debit" },
    { id: "acct_fixed_assets", code: "1300", name: "Fixed Assets", type: "asset", normalBalance: "debit" },
    { id: "acct_accum_depr", code: "1310", name: "Accumulated Depreciation", type: "asset", normalBalance: "credit" },
    { id: "acct_ap", code: "2000", name: "Accounts Payable", type: "liability", normalBalance: "credit" },
    { id: "acct_payroll_payable", code: "2200", name: "Payroll Payable", type: "liability", normalBalance: "credit" },
    { id: "acct_revenue", code: "4000", name: "Sales Revenue", type: "revenue", normalBalance: "credit" },
    { id: "acct_landed_cost", code: "5000", name: "Landed Cost", type: "expense", normalBalance: "debit" },
    { id: "acct_depr_expense", code: "5100", name: "Depreciation Expense", type: "expense", normalBalance: "debit" },
    { id: "acct_payroll_expense", code: "5200", name: "Payroll Expense", type: "expense", normalBalance: "debit" },
    { id: "acct_employee_expense", code: "5300", name: "Employee Expense", type: "expense", normalBalance: "debit" },
    { id: "acct_tax", code: "2100", name: "Sales Tax Payable", type: "liability", normalBalance: "credit" }
  ] as const;

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: account.code } },
      update: {
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        active: true
      },
      create: {
        id: account.id,
        tenantId: tenant.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        active: true
      }
    });
  }

  await prisma.fiscalPeriod.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "FY2026" } },
    update: {
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
      status: "open"
    },
    create: {
      id: "fp_2026",
      tenantId: tenant.id,
      name: "FY2026",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
      status: "open"
    }
  });

  await prisma.taxRate.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Standard" } },
    update: { rate: 0 },
    create: {
      id: "tax_standard",
      tenantId: tenant.id,
      name: "Standard",
      rate: 0
    }
  });

  await prisma.customFieldDefinition.upsert({
    where: { tenantId_entityType_key: { tenantId: tenant.id, entityType: "Customer", key: "region" } },
    update: {
      label: "Region",
      fieldType: "text",
      required: false,
      displayOrder: 10
    },
    create: {
      id: "cf_customer_region",
      tenantId: tenant.id,
      entityType: "Customer",
      key: "region",
      label: "Region",
      fieldType: "text",
      required: false,
      displayOrder: 10
    }
  });

  await prisma.viewDefinition.upsert({
    where: { tenantId_entityType_name: { tenantId: tenant.id, entityType: "Customer", name: "default" } },
    update: {
      fields: ["code", "name", "email", "owner", "creditLimit", "custom.region"]
    },
    create: {
      id: "view_customer_default",
      tenantId: tenant.id,
      entityType: "Customer",
      name: "default",
      fields: ["code", "name", "email", "owner", "creditLimit", "custom.region"]
    }
  });

  await prisma.automationRule.upsert({
    where: { id: "auto_customer_created_notify_owner" },
    update: {
      enabled: false,
      actions: [{ type: "audit", message: "Notify owner when a customer is created." }],
      lastError: null
    },
    create: {
      id: "auto_customer_created_notify_owner",
      tenantId: tenant.id,
      name: "Customer created owner notification",
      triggerType: "event",
      triggerEvent: "sales.customer.created",
      enabled: false,
      actions: [{ type: "audit", message: "Notify owner when a customer is created." }]
    }
  });

  for (const customer of demoSalesData.customers) {
    await prisma.customer.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: customer.code } },
      update: {
        name: customer.name,
        status: customer.status,
        owner: customer.owner,
        email: customer.email,
        creditLimit: customer.creditLimit.amount,
        currency: customer.creditLimit.currency,
        customData: customer.customFields
      },
      create: {
        id: customer.id,
        tenantId: tenant.id,
        code: customer.code,
        name: customer.name,
        status: customer.status,
        owner: customer.owner,
        email: customer.email,
        creditLimit: customer.creditLimit.amount,
        currency: customer.creditLimit.currency,
        customData: customer.customFields
      }
    });
  }

  for (const product of demoSalesData.products) {
    await prisma.product.upsert({
      where: { tenantId_sku: { tenantId: tenant.id, sku: product.sku } },
      update: {
        name: product.name,
        category: product.category,
        price: product.price.amount,
        currency: product.price.currency,
        stockOnHand: product.stockOnHand
      },
      create: {
        id: product.id,
        tenantId: tenant.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price.amount,
        currency: product.price.currency,
        stockOnHand: product.stockOnHand
      }
    });
  }

  for (const warehouse of demoInventoryData.warehouses) {
    await prisma.warehouse.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: warehouse.code } },
      update: {
        name: warehouse.name,
        status: warehouse.status
      },
      create: {
        id: warehouse.id,
        tenantId: tenant.id,
        code: warehouse.code,
        name: warehouse.name,
        status: warehouse.status
      }
    });
  }

  for (const bin of demoInventoryData.bins) {
    await prisma.inventoryBin.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: bin.code } },
      update: {
        warehouseId: bin.warehouseId,
        name: bin.name,
        status: bin.status
      },
      create: {
        id: bin.id,
        tenantId: tenant.id,
        warehouseId: bin.warehouseId,
        code: bin.code,
        name: bin.name,
        status: bin.status
      }
    });
  }

  const seededProducts = await prisma.product.findMany({ where: { tenantId: tenant.id } });

  for (const channel of demoCommerceData.channels) {
    await prisma.commerceChannel.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: channel.code } },
      update: {
        name: channel.name,
        channelType: channel.channelType,
        status: channel.status
      },
      create: {
        id: channel.id,
        tenantId: tenant.id,
        code: channel.code,
        name: channel.name,
        channelType: channel.channelType,
        status: channel.status
      }
    });
  }

  for (const priceList of demoCommerceData.priceLists) {
    const channel = priceList.channelId
      ? await prisma.commerceChannel.findUnique({
          where: { id: priceList.channelId }
        })
      : null;
    const seededPriceList = await prisma.priceList.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: priceList.name } },
      update: {
        channelId: channel?.id ?? null,
        currency: priceList.currency,
        active: priceList.active
      },
      create: {
        id: priceList.id,
        tenantId: tenant.id,
        channelId: channel?.id ?? null,
        name: priceList.name,
        currency: priceList.currency,
        active: priceList.active
      }
    });

    for (const item of priceList.items) {
      const product = seededProducts.find((record) => record.id === item.productId);
      if (!product) {
        continue;
      }
      await prisma.priceListItem.upsert({
        where: {
          tenantId_priceListId_productId: {
            tenantId: tenant.id,
            priceListId: seededPriceList.id,
            productId: product.id
          }
        },
        update: {
          price: item.price.amount,
          currency: item.price.currency
        },
        create: {
          tenantId: tenant.id,
          priceListId: seededPriceList.id,
          productId: product.id,
          price: item.price.amount,
          currency: item.price.currency
        }
      });
    }
  }

  for (const profile of demoCommerceData.posProfiles) {
    const priceList = await prisma.priceList.findUnique({ where: { id: profile.priceListId } });
    if (!priceList) {
      continue;
    }
    await prisma.posProfile.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: profile.name } },
      update: {
        priceListId: priceList.id,
        warehouseCode: profile.warehouseCode,
        cashAccountCode: profile.cashAccountCode,
        active: profile.active
      },
      create: {
        id: profile.id,
        tenantId: tenant.id,
        priceListId: priceList.id,
        name: profile.name,
        warehouseCode: profile.warehouseCode,
        cashAccountCode: profile.cashAccountCode,
        active: profile.active
      }
    });
  }

  for (const register of demoCommerceData.registers) {
    const profile = await prisma.posProfile.findUnique({ where: { id: register.profileId } });
    if (!profile) {
      continue;
    }
    await prisma.posRegister.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: register.code } },
      update: {
        profileId: profile.id,
        name: register.name,
        status: register.status
      },
      create: {
        id: register.id,
        tenantId: tenant.id,
        profileId: profile.id,
        code: register.code,
        name: register.name,
        status: register.status
      }
    });
  }

  for (const product of seededProducts) {
    const sourceId = `opening_${product.id}`;
    await prisma.stockLedgerEntry.upsert({
      where: {
        tenantId_sourceEntity_sourceId_productId_binId: {
          tenantId: tenant.id,
          sourceEntity: "OpeningBalance",
          sourceId,
          productId: product.id,
          binId: "bin_main_stock"
        }
      },
      update: {
        quantity: product.stockOnHand,
        unitCost: product.price,
        value: product.stockOnHand * Number(product.price),
        currency: product.currency
      },
      create: {
        id: `sle_opening_${product.id}`,
        tenantId: tenant.id,
        productId: product.id,
        warehouseId: "wh_main",
        binId: "bin_main_stock",
        quantity: product.stockOnHand,
        unitCost: product.price,
        value: product.stockOnHand * Number(product.price),
        currency: product.currency,
        sourceEntity: "OpeningBalance",
        sourceId
      }
    });

    await prisma.valuationLayer.upsert({
      where: {
        tenantId_sourceEntity_sourceId_productId_binId: {
          tenantId: tenant.id,
          sourceEntity: "OpeningBalance",
          sourceId,
          productId: product.id,
          binId: "bin_main_stock"
        }
      },
      update: {
        remainingQuantity: product.stockOnHand,
        unitCost: product.price,
        currency: product.currency
      },
      create: {
        id: `val_opening_${product.id}`,
        tenantId: tenant.id,
        productId: product.id,
        warehouseId: "wh_main",
        binId: "bin_main_stock",
        remainingQuantity: product.stockOnHand,
        unitCost: product.price,
        currency: product.currency,
        sourceEntity: "OpeningBalance",
        sourceId
      }
    });
  }

  for (const reorderPoint of demoInventoryData.reorderPoints) {
    await prisma.reorderPoint.upsert({
      where: {
        tenantId_productId_warehouseId: {
          tenantId: tenant.id,
          productId: reorderPoint.productId,
          warehouseId: "wh_main"
        }
      },
      update: {
        minimumQuantity: reorderPoint.minimumQuantity,
        reorderQuantity: reorderPoint.reorderQuantity
      },
      create: {
        id: reorderPoint.id,
        tenantId: tenant.id,
        productId: reorderPoint.productId,
        warehouseId: "wh_main",
        minimumQuantity: reorderPoint.minimumQuantity,
        reorderQuantity: reorderPoint.reorderQuantity
      }
    });
  }

  for (const workCenter of demoManufacturingData.workCenters) {
    await prisma.workCenter.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: workCenter.code } },
      update: {
        name: workCenter.name,
        capacityPerDay: workCenter.capacityPerDay,
        hourlyRate: workCenter.hourlyRate.amount,
        currency: workCenter.hourlyRate.currency,
        status: workCenter.status
      },
      create: {
        id: workCenter.id,
        tenantId: tenant.id,
        code: workCenter.code,
        name: workCenter.name,
        capacityPerDay: workCenter.capacityPerDay,
        hourlyRate: workCenter.hourlyRate.amount,
        currency: workCenter.hourlyRate.currency,
        status: workCenter.status
      }
    });
  }

  for (const bom of demoManufacturingData.boms) {
    await prisma.billOfMaterial.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: bom.number } },
      update: {
        productId: bom.productId,
        status: bom.status,
        outputQuantity: bom.outputQuantity,
        items: bom.items,
        estimatedCost: bom.estimatedCost.amount,
        currency: bom.estimatedCost.currency
      },
      create: {
        id: bom.id,
        tenantId: tenant.id,
        productId: bom.productId,
        number: bom.number,
        status: bom.status,
        outputQuantity: bom.outputQuantity,
        items: bom.items,
        estimatedCost: bom.estimatedCost.amount,
        currency: bom.estimatedCost.currency
      }
    });
  }

  for (const routing of demoManufacturingData.routings) {
    await prisma.routing.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: routing.number } },
      update: {
        productId: routing.productId,
        status: routing.status,
        operations: routing.operations
      },
      create: {
        id: routing.id,
        tenantId: tenant.id,
        productId: routing.productId,
        number: routing.number,
        status: routing.status,
        operations: routing.operations
      }
    });
  }

  for (const template of demoQualityData.inspectionTemplates) {
    await prisma.inspectionTemplate.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: template.name } },
      update: {
        entityType: template.entityType,
        checkpoints: template.checkpoints,
        active: template.active
      },
      create: {
        id: template.id,
        tenantId: tenant.id,
        name: template.name,
        entityType: template.entityType,
        checkpoints: template.checkpoints,
        active: template.active
      }
    });
  }

  for (const trace of demoQualityData.traceRecords) {
    await prisma.traceRecord.upsert({
      where: { id: trace.id },
      update: {
        productId: trace.productId,
        sourceEntity: trace.sourceEntity,
        sourceId: trace.sourceId,
        status: trace.status,
        receivedAt: new Date(trace.receivedAt)
      },
      create: {
        id: trace.id,
        tenantId: tenant.id,
        productId: trace.productId,
        lotNumber: trace.lotNumber,
        serialNumber: trace.serialNumber,
        sourceEntity: trace.sourceEntity,
        sourceId: trace.sourceId,
        status: trace.status,
        receivedAt: new Date(trace.receivedAt)
      }
    });
  }

  for (const scorecard of demoQualityData.supplierScorecards) {
    await prisma.supplierScorecard.upsert({
      where: { tenantId_supplierId_period: { tenantId: tenant.id, supplierId: scorecard.supplierId, period: scorecard.period } },
      update: {
        supplierName: scorecard.supplierName,
        inspections: scorecard.inspections,
        defects: scorecard.defects,
        score: scorecard.score
      },
      create: {
        id: scorecard.id,
        tenantId: tenant.id,
        supplierId: scorecard.supplierId,
        supplierName: scorecard.supplierName,
        period: scorecard.period,
        inspections: scorecard.inspections,
        defects: scorecard.defects,
        score: scorecard.score
      }
    });
  }

  for (const report of demoReportingData.reports) {
    await prisma.savedReport.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: report.name } },
      update: {
        entityType: report.entityType,
        columns: report.columns,
        filters: report.filters,
        parameters: report.parameters,
        sorts: report.sorts,
        groupBy: report.groupBy,
        chart: report.chart,
        owner: report.owner
      },
      create: {
        id: report.id,
        tenantId: tenant.id,
        name: report.name,
        entityType: report.entityType,
        columns: report.columns,
        filters: report.filters,
        parameters: report.parameters,
        sorts: report.sorts,
        groupBy: report.groupBy,
        chart: report.chart,
        owner: report.owner
      }
    });
  }

  for (const format of demoReportingData.printFormats) {
    await prisma.printFormat.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: format.name } },
      update: {
        entityType: format.entityType,
        template: format.template,
        blocks: format.blocks,
        active: format.active
      },
      create: {
        id: format.id,
        tenantId: tenant.id,
        name: format.name,
        entityType: format.entityType,
        template: format.template,
        blocks: format.blocks,
        active: format.active
      }
    });
  }

  for (const dashboard of demoReportingData.dashboards) {
    await prisma.dashboardDefinition.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: dashboard.name } },
      update: { cards: dashboard.cards },
      create: {
        id: dashboard.id,
        tenantId: tenant.id,
        name: dashboard.name,
        cards: dashboard.cards
      }
    });
  }

  for (const subscription of demoIntegrationData.webhookSubscriptions) {
    await prisma.webhookSubscription.upsert({
      where: { id: subscription.id },
      update: {
        url: subscription.url,
        eventTypes: subscription.eventTypes,
        secretPrefix: subscription.secretPrefix,
        secretHash: `${subscription.secretPrefix}_hash`,
        active: subscription.active
      },
      create: {
        id: subscription.id,
        tenantId: tenant.id,
        url: subscription.url,
        eventTypes: subscription.eventTypes,
        secretPrefix: subscription.secretPrefix,
        secretHash: `${subscription.secretPrefix}_hash`,
        active: subscription.active
      }
    });
  }

  for (const mapping of demoIntegrationData.mappings) {
    await prisma.integrationMapping.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: mapping.name } },
      update: {
        sourceType: mapping.sourceType,
        targetType: mapping.targetType,
        fields: mapping.fields,
        active: mapping.active
      },
      create: {
        id: mapping.id,
        tenantId: tenant.id,
        name: mapping.name,
        sourceType: mapping.sourceType,
        targetType: mapping.targetType,
        fields: mapping.fields,
        active: mapping.active
      }
    });
  }

  for (const connector of demoIntegrationData.connectors) {
    await prisma.connector.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: connector.name } },
      update: {
        connectorType: connector.connectorType,
        status: connector.status
      },
      create: {
        id: connector.id,
        tenantId: tenant.id,
        name: connector.name,
        connectorType: connector.connectorType,
        status: connector.status
      }
    });
  }

  for (const lead of demoOperationsData.leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: {
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        source: lead.source,
        stage: lead.stage,
        owner: lead.owner
      },
      create: {
        id: lead.id,
        tenantId: tenant.id,
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        source: lead.source,
        stage: lead.stage,
        owner: lead.owner
      }
    });
  }

  for (const opportunity of demoOperationsData.opportunities) {
    await prisma.opportunity.upsert({
      where: { id: opportunity.id },
      update: {
        leadId: opportunity.leadId,
        stage: opportunity.stage,
        expectedValue: opportunity.expectedValue.amount,
        currency: opportunity.expectedValue.currency,
        expectedCloseDate: new Date(`${opportunity.expectedCloseDate}T00:00:00.000Z`)
      },
      create: {
        id: opportunity.id,
        tenantId: tenant.id,
        leadId: opportunity.leadId,
        stage: opportunity.stage,
        expectedValue: opportunity.expectedValue.amount,
        currency: opportunity.expectedValue.currency,
        expectedCloseDate: new Date(`${opportunity.expectedCloseDate}T00:00:00.000Z`)
      }
    });
  }

  for (const project of demoOperationsData.projects) {
    await prisma.projectRecord.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: project.code } },
      update: {
        name: project.name,
        customerName: project.customerName,
        status: project.status,
        budget: project.budget.amount,
        currency: project.budget.currency,
        startDate: new Date(`${project.startDate}T00:00:00.000Z`),
        endDate: new Date(`${project.endDate}T00:00:00.000Z`)
      },
      create: {
        id: project.id,
        tenantId: tenant.id,
        code: project.code,
        name: project.name,
        customerName: project.customerName,
        status: project.status,
        budget: project.budget.amount,
        currency: project.budget.currency,
        startDate: new Date(`${project.startDate}T00:00:00.000Z`),
        endDate: new Date(`${project.endDate}T00:00:00.000Z`)
      }
    });
  }

  for (const task of demoOperationsData.tasks) {
    await prisma.projectTask.upsert({
      where: { id: task.id },
      update: {
        projectId: task.projectId,
        title: task.title,
        owner: task.owner,
        status: task.status,
        dueDate: new Date(`${task.dueDate}T00:00:00.000Z`)
      },
      create: {
        id: task.id,
        tenantId: tenant.id,
        projectId: task.projectId,
        title: task.title,
        owner: task.owner,
        status: task.status,
        dueDate: new Date(`${task.dueDate}T00:00:00.000Z`)
      }
    });
  }

  for (const employee of demoOperationsData.employees) {
    await prisma.employeeRecord.upsert({
      where: { tenantId_employeeNumber: { tenantId: tenant.id, employeeNumber: employee.employeeNumber } },
      update: {
        name: employee.name,
        department: employee.department,
        role: employee.role,
        status: employee.status
      },
      create: {
        id: employee.id,
        tenantId: tenant.id,
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        department: employee.department,
        role: employee.role,
        status: employee.status
      }
    });
  }

  for (const department of demoHrData.departments) {
    await prisma.department.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: department.code } },
      update: {
        name: department.name,
        manager: department.manager,
        active: department.active
      },
      create: {
        id: department.id,
        tenantId: tenant.id,
        code: department.code,
        name: department.name,
        manager: department.manager,
        active: department.active
      }
    });
  }

  for (const shift of demoHrData.workShifts) {
    await prisma.workShift.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: shift.code } },
      update: {
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        expectedHours: shift.expectedHours
      },
      create: {
        id: shift.id,
        tenantId: tenant.id,
        code: shift.code,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        expectedHours: shift.expectedHours
      }
    });
  }

  for (const structure of demoHrData.salaryStructures) {
    const employee = await prisma.employeeRecord.findFirst({ where: { tenantId: tenant.id, id: structure.employeeId } });
    if (!employee) {
      continue;
    }
    await prisma.salaryStructure.upsert({
      where: { tenantId_employeeId_name: { tenantId: tenant.id, employeeId: employee.id, name: structure.name } },
      update: {
        basePay: structure.basePay.amount,
        currency: structure.basePay.currency,
        earnings: structure.earnings,
        deductions: structure.deductions,
        active: structure.active
      },
      create: {
        id: structure.id,
        tenantId: tenant.id,
        employeeId: employee.id,
        name: structure.name,
        basePay: structure.basePay.amount,
        currency: structure.basePay.currency,
        earnings: structure.earnings,
        deductions: structure.deductions,
        active: structure.active
      }
    });
  }

  for (const serviceCase of demoOperationsData.serviceCases) {
    await prisma.serviceCase.upsert({
      where: { tenantId_caseNumber: { tenantId: tenant.id, caseNumber: serviceCase.caseNumber } },
      update: {
        customerName: serviceCase.customerName,
        subject: serviceCase.subject,
        priority: serviceCase.priority,
        status: serviceCase.status,
        owner: serviceCase.owner
      },
      create: {
        id: serviceCase.id,
        tenantId: tenant.id,
        caseNumber: serviceCase.caseNumber,
        customerName: serviceCase.customerName,
        subject: serviceCase.subject,
        priority: serviceCase.priority,
        status: serviceCase.status,
        owner: serviceCase.owner
      }
    });
  }

  for (const supplier of demoProcurementData.suppliers) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: supplier.code } },
      update: {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status
      },
      create: {
        id: supplier.id,
        tenantId: tenant.id,
        code: supplier.code,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status
      }
    });
  }

  for (const request of demoProcurementData.materialRequests) {
    await prisma.materialRequest.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: request.number } },
      update: {
        requester: request.requester,
        status: request.status,
        requiredBy: new Date(`${request.requiredBy}T00:00:00.000Z`),
        lines: request.lines
      },
      create: {
        id: request.id,
        tenantId: tenant.id,
        number: request.number,
        requester: request.requester,
        status: request.status,
        requiredBy: new Date(`${request.requiredBy}T00:00:00.000Z`),
        lines: request.lines
      }
    });
  }

  for (const purchaseOrder of demoProcurementData.purchaseOrders) {
    await prisma.purchaseOrder.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: purchaseOrder.number } },
      update: {
        supplierId: purchaseOrder.supplierId,
        status: purchaseOrder.status,
        expectedDate: new Date(`${purchaseOrder.expectedDate}T00:00:00.000Z`),
        total: purchaseOrder.total.amount,
        currency: purchaseOrder.total.currency,
        lines: purchaseOrder.lines
      },
      create: {
        id: purchaseOrder.id,
        tenantId: tenant.id,
        supplierId: purchaseOrder.supplierId,
        number: purchaseOrder.number,
        status: purchaseOrder.status,
        expectedDate: new Date(`${purchaseOrder.expectedDate}T00:00:00.000Z`),
        total: purchaseOrder.total.amount,
        currency: purchaseOrder.total.currency,
        lines: purchaseOrder.lines
      }
    });
  }

  const quote = demoSalesData.quotes[0];
  if (quote) {
    await prisma.quote.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: quote.number } },
      update: {
        status: quote.status,
        validUntil: new Date(`${quote.validUntil}T00:00:00.000Z`),
        total: quote.total.amount,
        currency: quote.total.currency,
        lines: quote.lines
      },
      create: {
        id: quote.id,
        tenantId: tenant.id,
        customerId: quote.customerId,
        number: quote.number,
        status: quote.status,
        validUntil: new Date(`${quote.validUntil}T00:00:00.000Z`),
        total: quote.total.amount,
        currency: quote.total.currency,
        lines: quote.lines
      }
    });
  }

  const order = demoSalesData.orders[0];
  if (order) {
    await prisma.salesOrder.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: order.number } },
      update: {
        status: order.status,
        promisedDate: new Date(`${order.promisedDate}T00:00:00.000Z`),
        total: order.total.amount,
        currency: order.total.currency
      },
      create: {
        id: order.id,
        tenantId: tenant.id,
        quoteId: order.quoteId,
        number: order.number,
        status: order.status,
        promisedDate: new Date(`${order.promisedDate}T00:00:00.000Z`),
        total: order.total.amount,
        currency: order.total.currency
      }
    });
  }

  const invoice = demoSalesData.invoices[0];
  if (invoice) {
    await prisma.invoice.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: invoice.number } },
      update: {
        status: invoice.status,
        dueDate: new Date(`${invoice.dueDate}T00:00:00.000Z`),
        total: invoice.total.amount,
        currency: invoice.total.currency
      },
      create: {
        id: invoice.id,
        tenantId: tenant.id,
        orderId: invoice.orderId,
        number: invoice.number,
        status: invoice.status,
        dueDate: new Date(`${invoice.dueDate}T00:00:00.000Z`),
        total: invoice.total.amount,
        currency: invoice.total.currency
      }
    });
  }

  await prisma.auditEvent.createMany({
    data: [
      {
        id: "aud_001",
        tenantId: tenant.id,
        actorId: adminUser.id,
        entity: "Quote",
        entityId: "quo_001",
        action: "submitted",
        message: "Quote Q-2026-0001 submitted for approval.",
        createdAt: new Date("2026-07-01T03:15:00.000Z")
      },
      {
        id: "aud_002",
        tenantId: tenant.id,
        actorId: adminUser.id,
        entity: "SalesOrder",
        entityId: "ord_001",
        action: "approved",
        message: "Sales order SO-2026-0001 approved.",
        createdAt: new Date("2026-07-01T04:20:00.000Z")
      },
      {
        id: "aud_003",
        tenantId: tenant.id,
        actorId: adminUser.id,
        entity: "Invoice",
        entityId: "inv_001",
        action: "posted",
        message: "Invoice INV-2026-0001 posted.",
        createdAt: new Date("2026-07-01T05:05:00.000Z")
      }
    ],
    skipDuplicates: true
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
