import type { ModuleManifest } from "@erp/core";

export type TraceRecord = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  lotNumber: string;
  serialNumber: string | null;
  sourceEntity: string;
  sourceId: string;
  status: "available" | "quarantined" | "consumed" | "recalled";
  receivedAt: string;
};

export type TraceMovement = {
  id: string;
  traceRecordId: string;
  lotNumber: string;
  serialNumber: string | null;
  productId: string;
  sku: string;
  productName: string;
  movementType:
    | "inspection"
    | "putaway"
    | "recall"
    | "receipt"
    | "shipment"
    | "transfer_in"
    | "transfer_out"
    | "work_order_issue"
    | "work_order_receipt";
  sourceEntity: string;
  sourceId: string;
  quantity: number;
  direction: "in" | "out" | "reference" | "transform";
  occurredAt: string;
};

export type TraceGenealogy = {
  traceRecord: TraceRecord;
  movements: TraceMovement[];
  inspections: QualityInspection[];
  nonConformances: NonConformance[];
  recalls: Recall[];
};

export type InspectionTemplate = {
  id: string;
  name: string;
  entityType: "PurchaseReceipt" | "WorkOrder" | "StockTransfer";
  checkpoints: string[];
  active: boolean;
};

export type QualityInspection = {
  id: string;
  templateId: string;
  templateName: string;
  traceRecordId: string;
  lotNumber: string;
  status: "draft" | "passed" | "failed";
  inspectedBy: string;
  inspectedAt: string;
  results: Array<{ checkpoint: string; passed: boolean; note: string }>;
};

export type NonConformance = {
  id: string;
  inspectionId: string;
  traceRecordId: string;
  lotNumber: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "contained" | "closed";
  description: string;
};

export type CorrectiveAction = {
  id: string;
  nonConformanceId: string;
  owner: string;
  dueDate: string;
  status: "open" | "done";
  action: string;
};

export type SupplierScorecard = {
  id: string;
  supplierId: string;
  supplierName: string;
  period: string;
  inspections: number;
  defects: number;
  score: number;
};

export type Recall = {
  id: string;
  lotNumber: string;
  status: "draft" | "active" | "closed";
  reason: string;
  affectedTraceIds: string[];
  openedAt: string;
};

export type QualitySnapshot = {
  traceRecords: TraceRecord[];
  traceMovements: TraceMovement[];
  inspectionTemplates: InspectionTemplate[];
  inspections: QualityInspection[];
  nonConformances: NonConformance[];
  correctiveActions: CorrectiveAction[];
  supplierScorecards: SupplierScorecard[];
  recalls: Recall[];
};

export const qualityManifest: ModuleManifest = {
  id: "quality",
  name: "Quality",
  version: "0.1.0",
  description: "Lot/serial traceability, inspections, non-conformance, CAPA, supplier scorecards, and recall workflow.",
  dependencies: ["core", "inventory", "procurement", "manufacturing"],
  permissions: [
    { key: "quality.read", label: "Read quality" },
    { key: "quality.manage", label: "Manage quality" }
  ],
  navigation: [{ label: "Quality", path: "/quality", icon: "shield-check", permission: "quality.read", order: 46 }],
  entities: [
    { name: "TraceRecord", label: "Trace Record", permissions: ["quality.read"] },
    { name: "TraceMovement", label: "Trace Movement", permissions: ["quality.read"] },
    { name: "InspectionTemplate", label: "Inspection Template", permissions: ["quality.read", "quality.manage"] },
    { name: "QualityInspection", label: "Quality Inspection", permissions: ["quality.read", "quality.manage"] },
    { name: "NonConformance", label: "Non-Conformance", permissions: ["quality.read", "quality.manage"] },
    { name: "CorrectiveAction", label: "Corrective Action", permissions: ["quality.read", "quality.manage"] },
    { name: "Recall", label: "Recall", permissions: ["quality.read", "quality.manage"] }
  ],
  workflows: [],
  events: ["quality.trace.moved", "quality.inspection.failed", "quality.ncr.created", "quality.recall.opened"],
  jobs: ["quality.supplier-scorecard-refresh", "quality.mock-recall-drill"],
  settings: ["quality_default_inspector", "quality_auto_quarantine_failed_lots"]
};

export const demoQualityData = {
  inspectionTemplates: [
    {
      id: "qtpl_receipt",
      name: "Receipt inspection",
      entityType: "PurchaseReceipt",
      checkpoints: ["Package intact", "Quantity verified", "Device powers on"],
      active: true
    }
  ] satisfies InspectionTemplate[],
  traceRecords: [
    {
      id: "trace_kit_001",
      productId: "prd_002",
      sku: "KIT-WHS-220",
      productName: "Warehouse Scanner Kit",
      lotNumber: "LOT-KIT-2026-001",
      serialNumber: null,
      sourceEntity: "OpeningBalance",
      sourceId: "opening_prd_002",
      status: "available",
      receivedAt: "2026-07-01T00:00:00.000Z"
    }
  ] satisfies TraceRecord[],
  traceMovements: [
    {
      id: "tmv_opening_kit_001",
      traceRecordId: "trace_kit_001",
      lotNumber: "LOT-KIT-2026-001",
      serialNumber: null,
      productId: "prd_002",
      sku: "KIT-WHS-220",
      productName: "Warehouse Scanner Kit",
      movementType: "receipt",
      sourceEntity: "OpeningBalance",
      sourceId: "opening_prd_002",
      quantity: 120,
      direction: "in",
      occurredAt: "2026-07-01T00:00:00.000Z"
    }
  ] satisfies TraceMovement[],
  inspections: [] satisfies QualityInspection[],
  nonConformances: [] satisfies NonConformance[],
  correctiveActions: [] satisfies CorrectiveAction[],
  supplierScorecards: [
    {
      id: "score_sup_001",
      supplierId: "sup_001",
      supplierName: "Vertex Components",
      period: "2026-07",
      inspections: 0,
      defects: 0,
      score: 100
    }
  ] satisfies SupplierScorecard[],
  recalls: [] satisfies Recall[]
};
