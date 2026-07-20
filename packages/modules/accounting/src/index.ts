import type { ModuleManifest, Money } from "@erp/core";

export type AccountType = "asset" | "equity" | "expense" | "liability" | "revenue";
export type NormalBalance = "credit" | "debit";

export type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  active: boolean;
};

export type FiscalPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "closed" | "open";
};

export type TaxRate = {
  id: string;
  name: string;
  rate: number;
};

export type JournalLine = {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: Money;
  credit: Money;
};

export type JournalEntry = {
  id: string;
  number: string;
  sourceEntity: string | null;
  sourceId: string | null;
  memo: string;
  status: "draft" | "posted" | "void";
  postedAt: string | null;
  lines: JournalLine[];
};

export type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: Money;
  method: string;
  receivedAt: string;
};

export type AgingBucket = {
  label: string;
  current: Money;
  days1To30: Money;
  days31To60: Money;
  days61To90: Money;
  over90: Money;
  total: Money;
};

export type BankAccount = {
  id: string;
  code: string;
  name: string;
  currency: string;
  balance: Money;
  lastReconciledAt: string | null;
};

export type BankTransaction = {
  id: string;
  bankAccountId: string;
  reference: string;
  direction: "inbound" | "outbound";
  amount: Money;
  transactionDate: string;
  matchedEntity: string | null;
  matchedEntityId: string | null;
  reconciledAt: string | null;
};

export type BankReconciliation = {
  id: string;
  bankAccountId: string;
  statementDate: string;
  statementBalance: Money;
  clearedBalance: Money;
  variance: Money;
  status: "balanced" | "variance";
  reconciledAt: string;
};

export type PeriodClose = {
  id: string;
  fiscalPeriodId: string;
  fiscalPeriodName: string;
  status: "closed";
  closedAt: string;
  journalEntryId: string | null;
};

export type LandedCostAllocation = {
  id: string;
  purchaseReceiptId: string;
  purchaseReceiptNumber: string;
  amount: Money;
  method: "quantity" | "value";
  allocatedAt: string;
};

export type FixedAsset = {
  id: string;
  assetTag: string;
  name: string;
  purchaseDate: string;
  cost: Money;
  usefulLifeMonths: number;
  accumulatedDepreciation: Money;
  netBookValue: Money;
  status: "active" | "disposed";
};

export type DepreciationRun = {
  id: string;
  fixedAssetId: string;
  assetTag: string;
  amount: Money;
  runDate: string;
  journalEntryId: string | null;
};

export type ExchangeRate = {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  effectiveDate: string;
};

export type TrialBalanceLine = {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: Money;
  credit: Money;
  balance: Money;
};

export type TrialBalance = {
  debitTotal: Money;
  creditTotal: Money;
  isBalanced: boolean;
  lines: TrialBalanceLine[];
};

export type AccountingSnapshot = {
  accounts: Account[];
  fiscalPeriods: FiscalPeriod[];
  taxRates: TaxRate[];
  journalEntries: JournalEntry[];
  payments: Payment[];
  aging: {
    receivables: AgingBucket;
    payables: AgingBucket;
  };
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  bankReconciliations: BankReconciliation[];
  periodCloses: PeriodClose[];
  landedCostAllocations: LandedCostAllocation[];
  fixedAssets: FixedAsset[];
  depreciationRuns: DepreciationRun[];
  exchangeRates: ExchangeRate[];
  trialBalance: TrialBalance;
};

export const accountingManifest: ModuleManifest = {
  id: "accounting",
  name: "Accounting",
  version: "0.1.0",
  description: "Chart of accounts, fiscal periods, double-entry journals, payments, close workflows, treasury, costing, assets, and financial reports.",
  dependencies: ["core", "sales"],
  permissions: [
    { key: "accounting.read", label: "Read accounting" },
    { key: "accounting.manage", label: "Manage accounting" }
  ],
  navigation: [{ label: "Accounting", path: "/accounting", icon: "scale", permission: "accounting.read", order: 70 }],
  entities: [
    { name: "Account", label: "Account", permissions: ["accounting.read", "accounting.manage"] },
    { name: "JournalEntry", label: "Journal Entry", permissions: ["accounting.read", "accounting.manage"] },
    { name: "Payment", label: "Payment", permissions: ["accounting.read", "accounting.manage"] },
    { name: "FiscalPeriod", label: "Fiscal Period", permissions: ["accounting.manage"] },
    { name: "TaxRate", label: "Tax Rate", permissions: ["accounting.manage"] },
    { name: "BankReconciliation", label: "Bank Reconciliation", permissions: ["accounting.read", "accounting.manage"] },
    { name: "LandedCostAllocation", label: "Landed Cost Allocation", permissions: ["accounting.manage"] },
    { name: "FixedAsset", label: "Fixed Asset", permissions: ["accounting.read", "accounting.manage"] }
  ],
  workflows: [
    {
      id: "accounting.journal",
      entity: "JournalEntry",
      states: ["draft", "posted", "void"],
      initialState: "draft",
      terminalStates: ["posted", "void"]
    }
  ],
  events: [
    "accounting.journal.posted",
    "accounting.payment.recorded",
    "accounting.bank.reconciled",
    "accounting.period.closed",
    "accounting.asset.depreciated",
    "accounting.landed-cost.allocated"
  ],
  jobs: ["accounting.period-close-check", "accounting.depreciation-run", "accounting.fx-revaluation"],
  settings: [
    "accounting_base_currency",
    "accounting_invoice_revenue_account",
    "accounting_receivables_account",
    "accounting_landed_cost_account",
    "accounting_depreciation_expense_account"
  ]
};
