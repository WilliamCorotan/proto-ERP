import type { ModuleManifest } from "@erp/core";

export type SavedReport = {
  id: string;
  name: string;
  entityType: string;
  columns: string[];
  filters: Record<string, string | number | boolean>;
  parameters: Array<{ key: string; label: string; type: "date" | "number" | "select" | "text"; required: boolean }>;
  sorts: Array<{ field: string; direction: "asc" | "desc" }>;
  groupBy: string[];
  chart: { type: "bar" | "line" | "none"; labelField: string | null; valueField: string | null };
  owner: string;
};

export type ReportRun = {
  id: string;
  reportId: string;
  reportName: string;
  status: "queued" | "completed" | "failed";
  rowCount: number;
  ranAt: string;
  rows: Array<Record<string, string | number | boolean | null>>;
};

export type PrintFormat = {
  id: string;
  name: string;
  entityType: string;
  template: string;
  blocks: Array<
    | { type: "barcode"; field: string; label: string }
    | { type: "field"; field: string; label: string }
    | { type: "heading"; text: string }
    | { type: "signature"; label: string }
    | { type: "table"; field: string; columns: string[] }
    | { type: "text"; text: string }
  >;
  active: boolean;
};

export type ExportJob = {
  id: string;
  reportId: string;
  reportName: string;
  format: "csv" | "json";
  status: "queued" | "completed" | "failed";
  downloadUrl: string | null;
  createdAt: string;
};

export type DashboardDefinition = {
  id: string;
  name: string;
  cards: Array<{ label: string; source: string; metric: string }>;
};

export type ScheduledDelivery = {
  id: string;
  reportId: string;
  reportName: string;
  cron: string;
  recipient: string;
  active: boolean;
};

export type ReportPreview = {
  reportId: string;
  reportName: string;
  generatedAt: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number | boolean | null>>;
  chart: SavedReport["chart"];
};

export type PrintPreview = {
  printFormatId: string;
  formatName: string;
  entityType: string;
  recordId: string;
  generatedAt: string;
  html: string;
};

export type ReportingSnapshot = {
  reports: SavedReport[];
  runs: ReportRun[];
  printFormats: PrintFormat[];
  exportJobs: ExportJob[];
  dashboards: DashboardDefinition[];
  scheduledDeliveries: ScheduledDelivery[];
};

export const reportingManifest: ModuleManifest = {
  id: "reporting",
  name: "Reporting",
  version: "0.1.0",
  description: "Saved reports, report runs, report previews, print format builder, exports, dashboards, and scheduled deliveries.",
  dependencies: ["core", "sales", "accounting", "inventory", "procurement", "manufacturing", "quality"],
  permissions: [
    { key: "reporting.read", label: "Read reports" },
    { key: "reporting.manage", label: "Manage reports" }
  ],
  navigation: [{ label: "Reports", path: "/reports", icon: "bar-chart-3", permission: "reporting.read", order: 90 }],
  entities: [
    { name: "SavedReport", label: "Saved Report", permissions: ["reporting.read", "reporting.manage"] },
    { name: "PrintFormat", label: "Print Format", permissions: ["reporting.read", "reporting.manage"] },
    { name: "ExportJob", label: "Export Job", permissions: ["reporting.read", "reporting.manage"] },
    { name: "DashboardDefinition", label: "Dashboard", permissions: ["reporting.read", "reporting.manage"] }
  ],
  workflows: [],
  events: ["reporting.report-ran", "reporting.export.completed", "reporting.delivery.sent", "reporting.print-preview.rendered"],
  jobs: ["reporting.scheduled-delivery", "reporting.export-cleanup"],
  settings: ["reporting_default_export_format", "reporting_retention_days"]
};

export const demoReportingData = {
  reports: [
    {
      id: "rpt_inventory_reconciliation",
      name: "Inventory Reconciliation",
      entityType: "Inventory",
      columns: ["sku", "productName", "stockOnHand", "ledgerQuantity"],
      filters: {},
      parameters: [],
      sorts: [{ field: "sku", direction: "asc" }],
      groupBy: [],
      chart: { type: "bar", labelField: "sku", valueField: "stockOnHand" },
      owner: "Admin"
    }
  ] satisfies SavedReport[],
  runs: [] satisfies ReportRun[],
  printFormats: [
    {
      id: "pf_invoice_standard",
      name: "Standard Invoice",
      entityType: "Invoice",
      template: "invoice-standard",
      blocks: [
        { type: "heading", text: "Invoice" },
        { type: "field", field: "number", label: "Invoice" },
        { type: "field", field: "customerName", label: "Customer" },
        { type: "field", field: "total", label: "Total" },
        { type: "signature", label: "Authorized by" }
      ],
      active: true
    }
  ] satisfies PrintFormat[],
  exportJobs: [] satisfies ExportJob[],
  dashboards: [
    {
      id: "dash_operations",
      name: "Operations Control",
      cards: [
        { label: "Inventory reconciled", source: "inventory", metric: "reconciled" },
        { label: "Open MRP suggestions", source: "manufacturing", metric: "openSuggestions" },
        { label: "Open NCRs", source: "quality", metric: "openNonConformances" }
      ]
    }
  ] satisfies DashboardDefinition[],
  scheduledDeliveries: [] satisfies ScheduledDelivery[]
};
