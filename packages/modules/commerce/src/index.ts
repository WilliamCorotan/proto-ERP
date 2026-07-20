import type { ModuleManifest, Money } from "@erp/core";
import type { SalesDocumentLine } from "@erp/sales";

export type CommerceChannel = {
  id: string;
  code: string;
  name: string;
  channelType: "b2b" | "ecommerce" | "marketplace" | "pos";
  status: "active" | "paused";
};

export type PriceList = {
  id: string;
  name: string;
  currency: string;
  channelId: string | null;
  items: Array<{ productId: string; sku: string; price: Money }>;
};

export type PosProfile = {
  id: string;
  name: string;
  warehouseCode: string;
  priceListId: string;
  cashAccountCode: string;
};

export type PosRegister = {
  id: string;
  profileId: string;
  code: string;
  name: string;
  status: "closed" | "open";
};

export type PosShift = {
  id: string;
  registerId: string;
  registerCode: string;
  openedBy: string;
  status: "closed" | "open";
  openingCash: Money;
  closingCash: Money | null;
  expectedCash: Money;
  openedAt: string;
  closedAt: string | null;
};

export type PosSale = {
  id: string;
  shiftId: string;
  receiptNumber: string;
  customerName: string;
  tenderType: "bank_card" | "cash" | "digital_wallet";
  status: "posted" | "void";
  total: Money;
  invoiceId: string;
  paymentId: string;
  lines: SalesDocumentLine[];
  postedAt: string;
};

export type ChannelCatalogItem = {
  id: string;
  channelId: string;
  productId: string;
  sku: string;
  title: string;
  price: Money;
  published: boolean;
};

export type ChannelOrder = {
  id: string;
  channelId: string;
  channelName: string;
  externalOrderId: string;
  customerName: string;
  status: "imported" | "fulfilled";
  total: Money;
  salesOrderId: string;
  lines: SalesDocumentLine[];
  importedAt: string;
};

export type CommerceSnapshot = {
  channels: CommerceChannel[];
  priceLists: PriceList[];
  posProfiles: PosProfile[];
  registers: PosRegister[];
  shifts: PosShift[];
  sales: PosSale[];
  catalogItems: ChannelCatalogItem[];
  channelOrders: ChannelOrder[];
};

export const commerceManifest: ModuleManifest = {
  id: "commerce",
  name: "Commerce",
  version: "0.1.0",
  description: "POS registers, shifts, tenders, channel catalogs, and e-commerce order ingestion.",
  dependencies: ["core", "sales", "inventory", "accounting", "integration", "reporting"],
  permissions: [
    { key: "commerce.read", label: "Read commerce" },
    { key: "commerce.manage", label: "Manage commerce" }
  ],
  navigation: [{ label: "Commerce", path: "/commerce", icon: "shopping-cart", permission: "commerce.read", order: 85 }],
  entities: [
    { name: "CommerceChannel", label: "Commerce Channel", permissions: ["commerce.read", "commerce.manage"] },
    { name: "PosRegister", label: "POS Register", permissions: ["commerce.read", "commerce.manage"] },
    { name: "PosShift", label: "POS Shift", permissions: ["commerce.read", "commerce.manage"] },
    { name: "PosSale", label: "POS Sale", permissions: ["commerce.read", "commerce.manage"] },
    { name: "ChannelOrder", label: "Channel Order", permissions: ["commerce.read", "commerce.manage"] }
  ],
  workflows: [
    {
      id: "commerce.pos-shift",
      entity: "PosShift",
      states: ["open", "closed"],
      initialState: "open",
      terminalStates: ["closed"]
    }
  ],
  events: ["commerce.pos-sale.posted", "commerce.channel-order.imported", "commerce.catalog.published"],
  jobs: ["commerce.channel-sync", "commerce.register-close-check"],
  settings: ["commerce_default_price_list", "commerce_default_pos_profile"]
};

export const demoCommerceData = {
  channels: [
    { id: "chn_pos", code: "POS", name: "Main Store POS", channelType: "pos", status: "active" },
    { id: "chn_web", code: "WEB", name: "B2B Web Store", channelType: "ecommerce", status: "active" }
  ] satisfies CommerceChannel[],
  priceLists: [
    {
      id: "pl_retail",
      name: "Retail USD",
      currency: "USD",
      channelId: "chn_pos",
      items: [
        { productId: "prd_001", sku: "ERP-OPS-100", price: { amount: 1200, currency: "USD" } },
        { productId: "prd_002", sku: "KIT-WHS-220", price: { amount: 850, currency: "USD" } }
      ]
    }
  ] satisfies PriceList[],
  posProfiles: [
    {
      id: "pos_profile_main",
      name: "Main Counter",
      warehouseCode: "MAIN",
      priceListId: "pl_retail",
      cashAccountCode: "1000"
    }
  ] satisfies PosProfile[],
  registers: [
    {
      id: "reg_main",
      profileId: "pos_profile_main",
      code: "REG-1",
      name: "Main Register",
      status: "closed"
    }
  ] satisfies PosRegister[],
  shifts: [] satisfies PosShift[],
  sales: [] satisfies PosSale[],
  catalogItems: [] satisfies ChannelCatalogItem[],
  channelOrders: [] satisfies ChannelOrder[]
};
