import type { ModuleManifest, Money, RecordStatus } from "@erp/core";

export type Customer = {
  id: string;
  code: string;
  name: string;
  status: "active" | "paused";
  owner: string;
  email: string;
  creditLimit: Money;
  customFields: Record<string, string | number | boolean | null>;
};

export type SalesCustomerStatus = Customer["status"];

export type ListSalesCustomersInput = {
  after?: string | undefined;
  limit?: number | string | undefined;
  search?: string | undefined;
  status?: string | undefined;
};

export type SalesCustomerPageQuery = {
  after?: string | undefined;
  limit: number;
  search?: string | undefined;
  status?: SalesCustomerStatus | undefined;
};

export type SalesCustomerPage = {
  items: Customer[];
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
    limit: number;
  };
};

export type SalesCustomerReadPort = {
  listCustomers(
    tenantId: string,
    query: SalesCustomerPageQuery,
  ): Promise<SalesCustomerPage>;
};

export type SalesCustomerReadErrorCode =
  "INVALID_CURSOR" | "INVALID_FILTER" | "INVALID_LIMIT";

export class SalesCustomerReadError extends Error {
  constructor(
    readonly code: SalesCustomerReadErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SalesCustomerReadError";
  }
}

export class ListSalesCustomersUseCase {
  static readonly defaultLimit = 25;
  static readonly maximumLimit = 100;

  constructor(private readonly port: SalesCustomerReadPort) {}

  execute(
    tenantId: string,
    input: ListSalesCustomersInput = {},
  ): Promise<SalesCustomerPage> {
    const limit = normalizeLimit(input.limit);
    const after = normalizeOptionalText(input.after, "cursor", 200);
    const search = normalizeOptionalText(input.search, "search", 100);
    const status = normalizeStatus(input.status);
    return this.port.listCustomers(tenantId, {
      limit,
      ...(after ? { after } : {}),
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
  }
}

function normalizeLimit(value: number | string | undefined): number {
  if (value === undefined || value === "") {
    return ListSalesCustomersUseCase.defaultLimit;
  }
  const limit = typeof value === "number" ? value : Number(value);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > ListSalesCustomersUseCase.maximumLimit
  ) {
    throw new SalesCustomerReadError(
      "INVALID_LIMIT",
      `limit must be an integer from 1 to ${ListSalesCustomersUseCase.maximumLimit}.`,
    );
  }
  return limit;
}

function normalizeOptionalText(
  value: string | undefined,
  field: string,
  maximumLength: number,
): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (normalized.length > maximumLength) {
    throw new SalesCustomerReadError(
      field === "cursor" ? "INVALID_CURSOR" : "INVALID_FILTER",
      `${field} must not exceed ${maximumLength} characters.`,
    );
  }
  return normalized;
}

function normalizeStatus(
  value: string | undefined,
): SalesCustomerStatus | undefined {
  if (value === undefined || value === "") return undefined;
  if (value !== "active" && value !== "paused") {
    throw new SalesCustomerReadError(
      "INVALID_FILTER",
      "status must be active or paused.",
    );
  }
  return value;
}

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: Money;
  stockOnHand: number;
};

export type SalesDocumentLine = {
  productId: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
};

export type Quote = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: RecordStatus;
  validUntil: string;
  total: Money;
  lines: SalesDocumentLine[];
};

export type SalesOrder = {
  id: string;
  number: string;
  quoteId: string;
  customerName: string;
  status: RecordStatus;
  promisedDate: string;
  total: Money;
};

export type Invoice = {
  id: string;
  number: string;
  orderId: string;
  customerName: string;
  status: "draft" | "posted" | "paid" | "void";
  dueDate: string;
  total: Money;
};

export type StockMovement = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  sourceEntity: string;
  sourceId: string;
  quantity: number;
  reason: string;
  createdAt: string;
};

export const salesManifest: ModuleManifest = {
  id: "sales",
  name: "Sales",
  version: "0.1.0",
  description: "Customers, products, quotes, sales orders, invoices, and basic stock movements.",
  dependencies: ["core"],
  permissions: [
    { key: "sales.customer.read", label: "Read customers" },
    { key: "sales.customer.write", label: "Write customers" },
    { key: "sales.product.manage", label: "Manage products" },
    { key: "sales.quote.manage", label: "Manage quotes" },
    { key: "sales.order.manage", label: "Manage sales orders" },
    { key: "sales.invoice.manage", label: "Manage invoices" }
  ],
  navigation: [
    { label: "Customers", path: "/customers", icon: "building-2", permission: "sales.customer.read", order: 20 },
    { label: "Products", path: "/products", icon: "boxes", permission: "sales.product.manage", order: 30 },
    { label: "Quotes", path: "/quotes", icon: "file-text", permission: "sales.quote.manage", order: 40 },
    { label: "Orders", path: "/orders", icon: "clipboard-list", permission: "sales.order.manage", order: 50 },
    { label: "Invoices", path: "/invoices", icon: "receipt", permission: "sales.invoice.manage", order: 60 }
  ],
  entities: [
    { name: "Customer", label: "Customer", permissions: ["sales.customer.read", "sales.customer.write"] },
    { name: "Product", label: "Product", permissions: ["sales.product.manage"] },
    { name: "Quote", label: "Quote", permissions: ["sales.quote.manage"] },
    { name: "SalesOrder", label: "Sales Order", permissions: ["sales.order.manage"] },
    { name: "Invoice", label: "Invoice", permissions: ["sales.invoice.manage"] },
    { name: "StockMovement", label: "Stock Movement", permissions: ["sales.order.manage"] }
  ],
  workflows: [
    {
      id: "sales.quote",
      entity: "Quote",
      states: ["draft", "submitted", "approved", "cancelled", "closed"],
      initialState: "draft",
      terminalStates: ["cancelled", "closed"]
    },
    {
      id: "sales.order",
      entity: "SalesOrder",
      states: ["draft", "submitted", "approved", "cancelled", "closed"],
      initialState: "draft",
      terminalStates: ["cancelled", "closed"]
    },
    {
      id: "sales.invoice",
      entity: "Invoice",
      states: ["draft", "posted", "paid", "void"],
      initialState: "draft",
      terminalStates: ["paid", "void"]
    }
  ],
  events: [
    "sales.customer.created",
    "sales.quote.submitted",
    "sales.quote.approved",
    "sales.order.created",
    "sales.invoice.posted"
  ],
  jobs: ["sales.quote.expiry-check", "sales.invoice.due-reminder"],
  settings: ["sales_default_price_list", "sales_quote_validity_days"]
};

export const demoSalesData = {
  customers: [
    {
      id: "cus_001",
      code: "C-1001",
      name: "Northstar Manufacturing",
      status: "active",
      owner: "Ari Santos",
      email: "procurement@northstar.example",
      creditLimit: { amount: 150000, currency: "USD" },
      customFields: { region: "North America" }
    },
    {
      id: "cus_002",
      code: "C-1002",
      name: "Harbor Retail Group",
      status: "active",
      owner: "Maya Lee",
      email: "ops@harbor.example",
      creditLimit: { amount: 90000, currency: "USD" },
      customFields: { region: "APAC" }
    },
    {
      id: "cus_003",
      code: "C-1003",
      name: "Cobalt Field Services",
      status: "paused",
      owner: "Noah Tan",
      email: "finance@cobalt.example",
      creditLimit: { amount: 60000, currency: "USD" },
      customFields: { region: "EMEA" }
    }
  ] satisfies Customer[],
  products: [
    {
      id: "prd_001",
      sku: "ERP-OPS-100",
      name: "Operations Console License",
      category: "Software",
      price: { amount: 1200, currency: "USD" },
      stockOnHand: 500
    },
    {
      id: "prd_002",
      sku: "KIT-WHS-220",
      name: "Warehouse Scanner Kit",
      category: "Hardware",
      price: { amount: 850, currency: "USD" },
      stockOnHand: 42
    },
    {
      id: "prd_003",
      sku: "SVC-IMPL-10",
      name: "Implementation Sprint",
      category: "Services",
      price: { amount: 5000, currency: "USD" },
      stockOnHand: 12
    }
  ] satisfies Product[],
  quotes: [
    {
      id: "quo_001",
      number: "Q-2026-0001",
      customerId: "cus_001",
      customerName: "Northstar Manufacturing",
      status: "submitted",
      validUntil: "2026-07-31",
      total: { amount: 28600, currency: "USD" },
      lines: [
        {
          productId: "prd_001",
          sku: "ERP-OPS-100",
          description: "Operations Console License",
          quantity: 12,
          unitPrice: { amount: 1200, currency: "USD" },
          total: { amount: 14400, currency: "USD" }
        },
        {
          productId: "prd_002",
          sku: "KIT-WHS-220",
          description: "Warehouse Scanner Kit",
          quantity: 4,
          unitPrice: { amount: 850, currency: "USD" },
          total: { amount: 3400, currency: "USD" }
        },
        {
          productId: "prd_003",
          sku: "SVC-IMPL-10",
          description: "Implementation Sprint",
          quantity: 2,
          unitPrice: { amount: 5400, currency: "USD" },
          total: { amount: 10800, currency: "USD" }
        }
      ]
    }
  ] satisfies Quote[],
  orders: [
    {
      id: "ord_001",
      number: "SO-2026-0001",
      quoteId: "quo_001",
      customerName: "Northstar Manufacturing",
      status: "approved",
      promisedDate: "2026-08-14",
      total: { amount: 28600, currency: "USD" }
    }
  ] satisfies SalesOrder[],
  invoices: [
    {
      id: "inv_001",
      number: "INV-2026-0001",
      orderId: "ord_001",
      customerName: "Northstar Manufacturing",
      status: "posted",
      dueDate: "2026-08-31",
      total: { amount: 28600, currency: "USD" }
    }
  ] satisfies Invoice[],
  stockMovements: [] satisfies StockMovement[]
};
