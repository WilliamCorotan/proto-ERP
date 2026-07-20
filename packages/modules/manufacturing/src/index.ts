import type { ModuleManifest, Money, RecordStatus } from "@erp/core";

export type BomItem = {
  productId: string;
  sku: string;
  description: string;
  quantity: number;
};

export type BillOfMaterial = {
  id: string;
  number: string;
  productId: string;
  sku: string;
  productName: string;
  status: RecordStatus;
  outputQuantity: number;
  items: BomItem[];
  estimatedCost: Money;
};

export type WorkCenter = {
  id: string;
  code: string;
  name: string;
  capacityPerDay: number;
  hourlyRate: Money;
  status: "active" | "inactive";
};

export type RoutingOperation = {
  sequence: number;
  workCenterId: string;
  workCenterCode: string;
  name: string;
  runMinutes: number;
};

export type Routing = {
  id: string;
  number: string;
  productId: string;
  sku: string;
  productName: string;
  status: RecordStatus;
  operations: RoutingOperation[];
};

export type WorkOrder = {
  id: string;
  number: string;
  productId: string;
  sku: string;
  productName: string;
  bomId: string;
  routingId: string | null;
  status: "draft" | "released" | "in_process" | "completed" | "cancelled";
  quantity: number;
  plannedStart: string;
  plannedEnd: string;
  materialCost: Money;
};

export type JobCard = {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  operationSequence: number;
  operationName: string;
  workCenterId: string;
  workCenterCode: string;
  status: "open" | "in_process" | "completed";
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  operator: string | null;
};

export type DowntimeEntry = {
  id: string;
  workCenterId: string;
  workCenterCode: string;
  jobCardId: string | null;
  reason: string;
  minutes: number;
  startedAt: string;
  endedAt: string;
};

export type CapacitySchedule = {
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  scheduledMinutes: number;
  capacityMinutes: number;
  downtimeMinutes: number;
  loadPercent: number;
};

export type ProductionPlan = {
  id: string;
  number: string;
  sourceEntity: string;
  sourceId: string;
  status: RecordStatus;
  demandDate: string;
  lines: Array<{
    productId: string;
    sku: string;
    productName: string;
    demandQuantity: number;
    availableQuantity: number;
    plannedQuantity: number;
  }>;
};

export type MrpSuggestion = {
  id: string;
  productionPlanId: string;
  productId: string;
  sku: string;
  productName: string;
  suggestionType: "purchase" | "work_order";
  quantity: number;
  requiredBy: string;
  status: "open" | "accepted" | "cancelled";
};

export type ManufacturingSnapshot = {
  boms: BillOfMaterial[];
  workCenters: WorkCenter[];
  routings: Routing[];
  workOrders: WorkOrder[];
  jobCards: JobCard[];
  downtimeEntries: DowntimeEntry[];
  capacitySchedule: CapacitySchedule[];
  productionPlans: ProductionPlan[];
  mrpSuggestions: MrpSuggestion[];
};

export const manufacturingManifest: ModuleManifest = {
  id: "manufacturing",
  name: "Manufacturing",
  version: "0.1.0",
  description: "BOMs, work centers, routings, job cards, downtime, capacity schedules, production plans, MRP suggestions, and inventory postings.",
  dependencies: ["core", "sales", "inventory", "procurement"],
  permissions: [
    { key: "manufacturing.read", label: "Read manufacturing" },
    { key: "manufacturing.manage", label: "Manage manufacturing" }
  ],
  navigation: [{ label: "Manufacturing", path: "/manufacturing", icon: "factory", permission: "manufacturing.read", order: 45 }],
  entities: [
    { name: "BillOfMaterial", label: "Bill of Material", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "WorkCenter", label: "Work Center", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "Routing", label: "Routing", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "WorkOrder", label: "Work Order", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "JobCard", label: "Job Card", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "DowntimeEntry", label: "Downtime Entry", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "CapacitySchedule", label: "Capacity Schedule", permissions: ["manufacturing.read"] },
    { name: "ProductionPlan", label: "Production Plan", permissions: ["manufacturing.read", "manufacturing.manage"] },
    { name: "MrpSuggestion", label: "MRP Suggestion", permissions: ["manufacturing.read", "manufacturing.manage"] }
  ],
  workflows: [
    {
      id: "manufacturing.work-order",
      entity: "WorkOrder",
      states: ["draft", "released", "in_process", "completed", "cancelled"],
      initialState: "draft",
      terminalStates: ["completed", "cancelled"]
    }
  ],
  events: [
    "manufacturing.plan.created",
    "manufacturing.work-order.released",
    "manufacturing.job-card.started",
    "manufacturing.job-card.completed",
    "manufacturing.downtime.recorded",
    "manufacturing.work-order.completed"
  ],
  jobs: ["manufacturing.mrp-run", "manufacturing.capacity-check", "manufacturing.finite-schedule-refresh"],
  settings: ["manufacturing_default_work_center", "manufacturing_planning_horizon_days"]
};

export const demoManufacturingData = {
  boms: [
    {
      id: "bom_001",
      number: "BOM-2026-0001",
      productId: "prd_002",
      sku: "KIT-WHS-220",
      productName: "Warehouse Scanner Kit",
      status: "approved",
      outputQuantity: 1,
      items: [
        {
          productId: "prd_001",
          sku: "ERP-OPS-100",
          description: "Operations Console License",
          quantity: 1
        }
      ],
      estimatedCost: { amount: 1200, currency: "USD" }
    }
  ] satisfies BillOfMaterial[],
  workCenters: [
    {
      id: "wc_assembly",
      code: "ASM",
      name: "Assembly Cell",
      capacityPerDay: 24,
      hourlyRate: { amount: 55, currency: "USD" },
      status: "active"
    }
  ] satisfies WorkCenter[],
  routings: [
    {
      id: "rt_001",
      number: "RT-2026-0001",
      productId: "prd_002",
      sku: "KIT-WHS-220",
      productName: "Warehouse Scanner Kit",
      status: "approved",
      operations: [
        {
          sequence: 10,
          workCenterId: "wc_assembly",
          workCenterCode: "ASM",
          name: "Assemble scanner kit",
          runMinutes: 45
        }
      ]
    }
  ] satisfies Routing[],
  productionPlans: [] satisfies ProductionPlan[],
  workOrders: [] satisfies WorkOrder[],
  jobCards: [] satisfies JobCard[],
  downtimeEntries: [] satisfies DowntimeEntry[],
  capacitySchedule: [] satisfies CapacitySchedule[],
  mrpSuggestions: [] satisfies MrpSuggestion[]
};
