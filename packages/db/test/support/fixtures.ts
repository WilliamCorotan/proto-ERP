import type { PrismaClient } from "@prisma/client";

export const integrationFixtureIds = {
  tenants: { alpha: "ten_it_alpha", beta: "ten_it_beta" },
  users: { alpha: "usr_it_alpha", beta: "usr_it_beta" },
  roles: { alpha: "role_it_alpha", beta: "role_it_beta" },
  customers: { alpha: "cus_it_alpha", beta: "cus_it_beta" },
  quotes: { alpha: "quo_it_alpha", beta: "quo_it_beta" },
  orders: { alpha: "ord_it_alpha", beta: "ord_it_beta" },
  invoices: { alpha: "inv_it_alpha", beta: "inv_it_beta" },
  products: { alpha: "prd_it_alpha", beta: "prd_it_beta" },
  accounts: { alpha: "acct_it_alpha", beta: "acct_it_beta" },
  warehouses: { alpha: "wh_it_alpha", beta: "wh_it_beta" },
  bins: { alpha: "bin_it_alpha", beta: "bin_it_beta" },
  employees: { alpha: "emp_it_alpha", beta: "emp_it_beta" },
  expenseClaims: { alpha: "exp_it_alpha", beta: "exp_it_beta" },
} as const;

export async function seedTwoTenantFixture(prisma: PrismaClient) {
  const ids = integrationFixtureIds;

  await prisma.$transaction(async (tx) => {
    await tx.tenant.createMany({
      data: [
        { id: ids.tenants.alpha, slug: "it-alpha", name: "Integration Alpha" },
        { id: ids.tenants.beta, slug: "it-beta", name: "Integration Beta" },
      ],
    });
    await tx.role.createMany({
      data: [
        {
          id: ids.roles.alpha,
          tenantId: ids.tenants.alpha,
          key: "operator",
          name: "Alpha Operator",
          permissions: ["sales.customer.read"],
        },
        {
          id: ids.roles.beta,
          tenantId: ids.tenants.beta,
          key: "accountant",
          name: "Beta Accountant",
          permissions: ["accounting.read"],
        },
      ],
    });
    await tx.user.createMany({
      data: [
        {
          id: ids.users.alpha,
          tenantId: ids.tenants.alpha,
          email: "operator@alpha.test",
          name: "Alpha Operator",
          passwordHash: "integration-test-only",
        },
        {
          id: ids.users.beta,
          tenantId: ids.tenants.beta,
          email: "accountant@beta.test",
          name: "Beta Accountant",
          passwordHash: "integration-test-only",
        },
      ],
    });
    await tx.userRole.createMany({
      data: [
        { userId: ids.users.alpha, roleId: ids.roles.alpha },
        { userId: ids.users.beta, roleId: ids.roles.beta },
      ],
    });
    await tx.customer.createMany({
      data: [
        {
          id: ids.customers.alpha,
          tenantId: ids.tenants.alpha,
          code: "CUST-001",
          name: "Alpha Customer",
          owner: "Alpha Owner",
          email: "customer@alpha.test",
          creditLimit: 10_000,
        },
        {
          id: ids.customers.beta,
          tenantId: ids.tenants.beta,
          code: "CUST-001",
          name: "Beta Customer",
          owner: "Beta Owner",
          email: "customer@beta.test",
          creditLimit: 20_000,
        },
      ],
    });
    await tx.product.createMany({
      data: [
        {
          id: ids.products.alpha,
          tenantId: ids.tenants.alpha,
          sku: "ITEM-001",
          name: "Alpha Item",
          category: "Test",
          price: 25,
          stockOnHand: 10,
        },
        {
          id: ids.products.beta,
          tenantId: ids.tenants.beta,
          sku: "ITEM-001",
          name: "Beta Item",
          category: "Test",
          price: 50,
          stockOnHand: 20,
        },
      ],
    });
    await tx.account.createMany({
      data: [
        {
          id: ids.accounts.alpha,
          tenantId: ids.tenants.alpha,
          code: "1000",
          name: "Alpha Cash",
          type: "asset",
          normalBalance: "debit",
        },
        {
          id: ids.accounts.beta,
          tenantId: ids.tenants.beta,
          code: "1000",
          name: "Beta Cash",
          type: "asset",
          normalBalance: "debit",
        },
      ],
    });
    await tx.warehouse.createMany({
      data: [
        {
          id: ids.warehouses.alpha,
          tenantId: ids.tenants.alpha,
          code: "MAIN",
          name: "Alpha Main Warehouse",
        },
        {
          id: ids.warehouses.beta,
          tenantId: ids.tenants.beta,
          code: "MAIN",
          name: "Beta Main Warehouse",
        },
      ],
    });
    await tx.inventoryBin.createMany({
      data: [
        {
          id: ids.bins.alpha,
          tenantId: ids.tenants.alpha,
          warehouseId: ids.warehouses.alpha,
          code: "MAIN-01",
          name: "Alpha Main Bin",
        },
        {
          id: ids.bins.beta,
          tenantId: ids.tenants.beta,
          warehouseId: ids.warehouses.beta,
          code: "MAIN-01",
          name: "Beta Main Bin",
        },
      ],
    });
    await tx.quote.createMany({
      data: [
        {
          id: ids.quotes.alpha,
          tenantId: ids.tenants.alpha,
          customerId: ids.customers.alpha,
          number: "Q-IT-001",
          validUntil: new Date("2026-12-31T00:00:00.000Z"),
          total: 100,
          lines: [],
        },
        {
          id: ids.quotes.beta,
          tenantId: ids.tenants.beta,
          customerId: ids.customers.beta,
          number: "Q-IT-001",
          validUntil: new Date("2026-12-31T00:00:00.000Z"),
          total: 200,
          lines: [],
        },
      ],
    });
    await tx.salesOrder.createMany({
      data: [
        {
          id: ids.orders.alpha,
          tenantId: ids.tenants.alpha,
          quoteId: ids.quotes.alpha,
          number: "SO-IT-001",
          promisedDate: new Date("2026-12-31T00:00:00.000Z"),
          total: 100,
        },
        {
          id: ids.orders.beta,
          tenantId: ids.tenants.beta,
          quoteId: ids.quotes.beta,
          number: "SO-IT-001",
          promisedDate: new Date("2026-12-31T00:00:00.000Z"),
          total: 200,
        },
      ],
    });
    await tx.invoice.createMany({
      data: [
        {
          id: ids.invoices.alpha,
          tenantId: ids.tenants.alpha,
          orderId: ids.orders.alpha,
          number: "INV-IT-001",
          dueDate: new Date("2027-01-31T00:00:00.000Z"),
          total: 100,
        },
        {
          id: ids.invoices.beta,
          tenantId: ids.tenants.beta,
          orderId: ids.orders.beta,
          number: "INV-IT-001",
          dueDate: new Date("2027-01-31T00:00:00.000Z"),
          total: 200,
        },
      ],
    });
    await tx.employeeRecord.createMany({
      data: [
        {
          id: ids.employees.alpha,
          tenantId: ids.tenants.alpha,
          employeeNumber: "EMP-001",
          name: "Alpha Employee",
          department: "Operations",
          role: "Operator",
        },
        {
          id: ids.employees.beta,
          tenantId: ids.tenants.beta,
          employeeNumber: "EMP-001",
          name: "Beta Employee",
          department: "Finance",
          role: "Accountant",
        },
      ],
    });
    await tx.expenseClaim.createMany({
      data: [
        {
          id: ids.expenseClaims.alpha,
          tenantId: ids.tenants.alpha,
          employeeId: ids.employees.alpha,
          number: "EXP-IT-001",
          category: "Travel",
          description: "Alpha integration expense",
          amount: 25,
          submittedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
        {
          id: ids.expenseClaims.beta,
          tenantId: ids.tenants.beta,
          employeeId: ids.employees.beta,
          number: "EXP-IT-001",
          category: "Travel",
          description: "Beta integration expense",
          amount: 50,
          submittedAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      ],
    });
  });

  return ids;
}
