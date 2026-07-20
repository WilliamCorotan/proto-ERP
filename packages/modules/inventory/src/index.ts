import type { ModuleManifest, Money } from "@erp/core";

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  status: "active" | "inactive";
};

export type InventoryBin = {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  code: string;
  name: string;
  status: "active" | "inactive";
};

export type StockLedgerEntry = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseCode: string;
  binCode: string;
  quantity: number;
  unitCost: Money;
  value: Money;
  sourceEntity: string;
  sourceId: string;
  createdAt: string;
};

export type StockReservation = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseCode: string;
  binCode: string;
  quantity: number;
  sourceEntity: string;
  sourceId: string;
  status: "active" | "released";
};

export type StockTransfer = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  fromBinCode: string;
  toBinCode: string;
  quantity: number;
  status: "posted" | "void";
  postedAt: string;
};

export type CycleCount = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  binCode: string;
  countedQuantity: number;
  systemQuantity: number;
  variance: number;
  status: "posted" | "void";
  countedAt: string;
};

export type ReorderPoint = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseCode: string;
  minimumQuantity: number;
  reorderQuantity: number;
};

export type ValuationLayer = {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  remainingQuantity: number;
  unitCost: Money;
  sourceEntity: string;
  sourceId: string;
};

export type PickList = {
  id: string;
  salesOrderId: string;
  salesOrderNumber: string;
  status: "open" | "picking" | "picked" | "packed" | "shipped";
  createdAt: string;
};

export type PickTask = {
  id: string;
  pickListId: string;
  productId: string;
  sku: string;
  productName: string;
  binCode: string;
  quantity: number;
  pickedQuantity: number;
  status: "open" | "picked" | "short";
};

export type PackRecord = {
  id: string;
  pickListId: string;
  packageCode: string;
  status: "packed" | "shipped";
  packedAt: string;
};

export type Shipment = {
  id: string;
  packRecordId: string;
  carrier: string;
  trackingNumber: string;
  status: "shipped";
  shippedAt: string;
};

export type PutAwayTask = {
  id: string;
  purchaseReceiptId: string;
  receiptNumber: string;
  productId: string;
  sku: string;
  productName: string;
  fromBinCode: string;
  toBinCode: string;
  quantity: number;
  status: "open" | "completed";
};

export type BarcodeScan = {
  id: string;
  scanType: "count" | "move" | "pack" | "pick" | "putaway" | "receive" | "ship";
  barcode: string;
  entity: string;
  entityId: string;
  scannedAt: string;
};

export type InventorySnapshot = {
  warehouses: Warehouse[];
  bins: InventoryBin[];
  ledger: StockLedgerEntry[];
  reservations: StockReservation[];
  transfers: StockTransfer[];
  cycleCounts: CycleCount[];
  reorderPoints: ReorderPoint[];
  valuationLayers: ValuationLayer[];
  pickLists: PickList[];
  pickTasks: PickTask[];
  packRecords: PackRecord[];
  shipments: Shipment[];
  putAwayTasks: PutAwayTask[];
  barcodeScans: BarcodeScan[];
  reconciled: boolean;
};

export const inventoryManifest: ModuleManifest = {
  id: "inventory",
  name: "Inventory",
  version: "0.1.0",
  description: "Warehouses, bins, stock ledger, reservations, WMS execution, transfers, cycle counts, reorder points, and valuation layers.",
  dependencies: ["core", "sales", "procurement"],
  permissions: [
    { key: "inventory.read", label: "Read inventory" },
    { key: "inventory.manage", label: "Manage inventory" }
  ],
  navigation: [{ label: "Inventory", path: "/inventory", icon: "warehouse", permission: "inventory.read", order: 35 }],
  entities: [
    { name: "Warehouse", label: "Warehouse", permissions: ["inventory.read", "inventory.manage"] },
    { name: "InventoryBin", label: "Bin", permissions: ["inventory.read", "inventory.manage"] },
    { name: "StockLedgerEntry", label: "Stock Ledger Entry", permissions: ["inventory.read"] },
    { name: "StockReservation", label: "Stock Reservation", permissions: ["inventory.read", "inventory.manage"] },
    { name: "StockTransfer", label: "Stock Transfer", permissions: ["inventory.manage"] },
    { name: "CycleCount", label: "Cycle Count", permissions: ["inventory.manage"] },
    { name: "ReorderPoint", label: "Reorder Point", permissions: ["inventory.manage"] },
    { name: "ValuationLayer", label: "Valuation Layer", permissions: ["inventory.read"] },
    { name: "PickList", label: "Pick List", permissions: ["inventory.read", "inventory.manage"] },
    { name: "PickTask", label: "Pick Task", permissions: ["inventory.read", "inventory.manage"] },
    { name: "PackRecord", label: "Pack Record", permissions: ["inventory.read", "inventory.manage"] },
    { name: "Shipment", label: "Shipment", permissions: ["inventory.read", "inventory.manage"] },
    { name: "PutAwayTask", label: "Put-Away Task", permissions: ["inventory.read", "inventory.manage"] },
    { name: "BarcodeScan", label: "Barcode Scan", permissions: ["inventory.read"] }
  ],
  workflows: [],
  events: [
    "inventory.stock-adjusted",
    "inventory.stock-reserved",
    "inventory.stock-transferred",
    "inventory.cycle-count.posted",
    "inventory.pick-list.created",
    "inventory.pick-task.picked",
    "inventory.pack-record.packed",
    "inventory.shipment.shipped",
    "inventory.put-away.completed"
  ],
  jobs: ["inventory.reorder-point-check", "inventory.ledger-reconciliation", "inventory.pick-wave-release"],
  settings: ["inventory_default_warehouse", "inventory_valuation_method"]
};

export const demoInventoryData = {
  warehouses: [
    {
      id: "wh_main",
      code: "MAIN",
      name: "Main Warehouse",
      status: "active"
    }
  ] satisfies Warehouse[],
  bins: [
    {
      id: "bin_main_stock",
      warehouseId: "wh_main",
      warehouseCode: "MAIN",
      code: "MAIN-01",
      name: "Primary Stock",
      status: "active"
    },
    {
      id: "bin_qc_hold",
      warehouseId: "wh_main",
      warehouseCode: "MAIN",
      code: "QC-HOLD",
      name: "Quality Hold",
      status: "active"
    }
  ] satisfies InventoryBin[],
  reorderPoints: [
    {
      id: "rop_prd_001",
      productId: "prd_001",
      sku: "ERP-OPS-100",
      productName: "Operations Console License",
      warehouseCode: "MAIN",
      minimumQuantity: 100,
      reorderQuantity: 250
    },
    {
      id: "rop_prd_002",
      productId: "prd_002",
      sku: "KIT-WHS-220",
      productName: "Warehouse Scanner Kit",
      warehouseCode: "MAIN",
      minimumQuantity: 50,
      reorderQuantity: 100
    },
    {
      id: "rop_prd_003",
      productId: "prd_003",
      sku: "SVC-IMPL-10",
      productName: "Implementation Sprint",
      warehouseCode: "MAIN",
      minimumQuantity: 10,
      reorderQuantity: 20
    }
  ] satisfies ReorderPoint[],
  pickLists: [] satisfies PickList[],
  pickTasks: [] satisfies PickTask[],
  packRecords: [] satisfies PackRecord[],
  shipments: [] satisfies Shipment[],
  putAwayTasks: [] satisfies PutAwayTask[],
  barcodeScans: [] satisfies BarcodeScan[]
};
