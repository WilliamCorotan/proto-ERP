import type { ModuleManifest, Money, RecordStatus } from "@erp/core";
import type { SalesDocumentLine } from "@erp/sales";

export type Supplier = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  paymentTerms: string;
  status: "active" | "paused";
};

export type MaterialRequest = {
  id: string;
  number: string;
  requester: string;
  status: RecordStatus;
  requiredBy: string;
  lines: SalesDocumentLine[];
};

export type RequestForQuote = {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  status: RecordStatus;
  dueDate: string;
  lines: SalesDocumentLine[];
};

export type SupplierQuotation = {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  status: RecordStatus;
  validUntil: string;
  total: Money;
  lines: SalesDocumentLine[];
};

export type PurchaseOrder = {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  status: RecordStatus;
  expectedDate: string;
  total: Money;
  lines: SalesDocumentLine[];
};

export type PurchaseReceipt = {
  id: string;
  number: string;
  purchaseOrderId: string;
  supplierName: string;
  status: "posted" | "void";
  receivedAt: string;
  lines: SalesDocumentLine[];
};

export type PurchaseInvoice = {
  id: string;
  number: string;
  purchaseOrderId: string;
  supplierName: string;
  status: "draft" | "posted" | "paid" | "void";
  dueDate: string;
  total: Money;
};

export type SupplierPayment = {
  id: string;
  purchaseInvoiceId: string;
  purchaseInvoiceNumber: string;
  supplierName: string;
  amount: Money;
  method: string;
  paidAt: string;
};

export type ProcurementSnapshot = {
  suppliers: Supplier[];
  materialRequests: MaterialRequest[];
  rfqs: RequestForQuote[];
  supplierQuotations: SupplierQuotation[];
  purchaseOrders: PurchaseOrder[];
  purchaseReceipts: PurchaseReceipt[];
  purchaseInvoices: PurchaseInvoice[];
  supplierPayments: SupplierPayment[];
};

export const procurementManifest: ModuleManifest = {
  id: "procurement",
  name: "Procurement",
  version: "0.1.0",
  description: "Suppliers, material requests, RFQs, purchase orders, receipts, supplier invoices, and AP payments.",
  dependencies: ["core", "sales", "accounting"],
  permissions: [
    { key: "procurement.read", label: "Read procurement" },
    { key: "procurement.manage", label: "Manage procurement" },
    { key: "procurement.ap.manage", label: "Manage accounts payable" }
  ],
  navigation: [{ label: "Procurement", path: "/procurement", icon: "shopping-cart", permission: "procurement.read", order: 65 }],
  entities: [
    { name: "Supplier", label: "Supplier", permissions: ["procurement.read", "procurement.manage"] },
    { name: "MaterialRequest", label: "Material Request", permissions: ["procurement.read", "procurement.manage"] },
    { name: "RequestForQuote", label: "Request For Quote", permissions: ["procurement.read", "procurement.manage"] },
    { name: "SupplierQuotation", label: "Supplier Quotation", permissions: ["procurement.read", "procurement.manage"] },
    { name: "PurchaseOrder", label: "Purchase Order", permissions: ["procurement.read", "procurement.manage"] },
    { name: "PurchaseReceipt", label: "Purchase Receipt", permissions: ["procurement.read", "procurement.manage"] },
    { name: "PurchaseInvoice", label: "Purchase Invoice", permissions: ["procurement.read", "procurement.ap.manage"] },
    { name: "SupplierPayment", label: "Supplier Payment", permissions: ["procurement.ap.manage"] }
  ],
  workflows: [
    {
      id: "procurement.purchase-order",
      entity: "PurchaseOrder",
      states: ["draft", "submitted", "approved", "cancelled", "closed"],
      initialState: "draft",
      terminalStates: ["cancelled", "closed"]
    }
  ],
  events: [
    "procurement.material-request.created",
    "procurement.purchase-order.approved",
    "procurement.purchase-receipt.posted",
    "procurement.purchase-invoice.posted",
    "procurement.supplier-payment.recorded"
  ],
  jobs: ["procurement.reorder-check", "procurement.supplier-follow-up"],
  settings: ["procurement_default_supplier_terms", "procurement_purchase_approval_limit"]
};

export const demoProcurementData = {
  suppliers: [
    {
      id: "sup_001",
      code: "S-1001",
      name: "Vertex Components",
      email: "sales@vertex.example",
      phone: "+1-555-0101",
      paymentTerms: "Net 30",
      status: "active"
    }
  ] satisfies Supplier[],
  materialRequests: [
    {
      id: "mr_001",
      number: "MR-2026-0001",
      requester: "Warehouse",
      status: "approved",
      requiredBy: "2026-08-01",
      lines: [
        {
          productId: "prd_002",
          sku: "KIT-WHS-220",
          description: "Warehouse Scanner Kit",
          quantity: 10,
          unitPrice: { amount: 850, currency: "USD" },
          total: { amount: 8500, currency: "USD" }
        }
      ]
    }
  ] satisfies MaterialRequest[],
  rfqs: [] satisfies RequestForQuote[],
  supplierQuotations: [] satisfies SupplierQuotation[],
  purchaseOrders: [
    {
      id: "po_001",
      number: "PO-2026-0001",
      supplierId: "sup_001",
      supplierName: "Vertex Components",
      status: "approved",
      expectedDate: "2026-08-01",
      total: { amount: 8500, currency: "USD" },
      lines: [
        {
          productId: "prd_002",
          sku: "KIT-WHS-220",
          description: "Warehouse Scanner Kit",
          quantity: 10,
          unitPrice: { amount: 850, currency: "USD" },
          total: { amount: 8500, currency: "USD" }
        }
      ]
    }
  ] satisfies PurchaseOrder[],
  purchaseReceipts: [] satisfies PurchaseReceipt[],
  purchaseInvoices: [] satisfies PurchaseInvoice[],
  supplierPayments: [] satisfies SupplierPayment[]
};
