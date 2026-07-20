import {
  Badge,
  DataCard,
  DataTable,
  MetricTile,
  RecordPanel,
  Timeline,
  TimelineRow,
  statusTone
} from "../../components/design-system";
import {
  allocateLandedCostAction,
  closeFiscalPeriodAction,
  createBankTransactionAction,
  createFixedAssetAction,
  reconcileBankAccountAction,
  recordPaymentAction,
  runDepreciationAction,
  setExchangeRateAction
} from "../actions";
import { getAccountingSnapshot, getProcurementSnapshot, getSalesSnapshot } from "../data";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function AccountingPage() {
  const [accounting, sales, procurement] = await Promise.all([getAccountingSnapshot(), getSalesSnapshot(), getProcurementSnapshot()]);
  const payableInvoices = sales.invoices.filter((invoice) => invoice.status === "posted");
  const operatingBank = accounting.bankAccounts[0];
  const unreconciledTransactions = accounting.bankTransactions.filter((transaction) => !transaction.reconciledAt);
  const openPeriod = accounting.fiscalPeriods.find((period) => period.status === "open");
  const latestReceipt = procurement.purchaseReceipts[0];
  const activeAsset = accounting.fixedAssets.find((asset) => asset.status === "active");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-stack">
      <RecordPanel
        badge={
          <Badge tone={accounting.trialBalance.isBalanced ? "success" : "danger"}>
            {accounting.trialBalance.isBalanced ? "balanced" : "out of balance"}
          </Badge>
        }
        eyebrow="Accounting"
        title="Trial balance"
      >
        <div className="metric-grid">
          <MetricTile label="Debits" tone="info" value={money(accounting.trialBalance.debitTotal.amount, accounting.trialBalance.debitTotal.currency)} />
          <MetricTile label="Credits" tone="info" value={money(accounting.trialBalance.creditTotal.amount, accounting.trialBalance.creditTotal.currency)} />
          <MetricTile label="Journal entries" tone="processing" value={accounting.journalEntries.length} />
          <MetricTile label="Payments" tone="success" value={accounting.payments.length} />
          <MetricTile label="AR aging" tone="warning" value={money(accounting.aging.receivables.total.amount, accounting.aging.receivables.total.currency)} />
          <MetricTile label="AP aging" tone="warning" value={money(accounting.aging.payables.total.amount, accounting.aging.payables.total.currency)} />
        </div>
        <DataTable
          caption="Trial balance account lines"
          columns={[
            { key: "code", header: "Account", render: (line) => <strong>{line.accountCode}</strong> },
            { key: "name", header: "Name", render: (line) => line.accountName },
            { key: "debit", header: "Debit", align: "end", render: (line) => money(line.debit.amount, line.debit.currency) },
            { key: "credit", header: "Credit", align: "end", render: (line) => money(line.credit.amount, line.credit.currency) },
            { key: "balance", header: "Balance", align: "end", render: (line) => money(line.balance.amount, line.balance.currency) }
          ]}
          rows={accounting.trialBalance.lines}
          rowKey={(line) => line.accountId}
        />
      </RecordPanel>
      <section className="split-grid">
        <RecordPanel badge={<Badge tone="neutral">{accounting.journalEntries.length} entries</Badge>} eyebrow="Ledger" title="Journal entries">
          <Timeline>
            {accounting.journalEntries.map((entry) => (
              <TimelineRow key={entry.id} label={entry.status}>
                <>
                  <strong>{entry.number}</strong>
                  <br />
                  {entry.memo}
                </>
              </TimelineRow>
            ))}
            {accounting.journalEntries.length === 0 ? <p>No journal entries posted yet.</p> : null}
          </Timeline>
        </RecordPanel>
        <RecordPanel eyebrow="Payments" title="Record payment">
          <form action={recordPaymentAction} className="record-form">
            <label>
              Invoice
              <select name="invoiceId" required>
                {payableInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.number} · {invoice.customerName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input name="amount" type="number" min="0" step="100" defaultValue={payableInvoices[0]?.total.amount ?? 0} required />
            </label>
            <label>
              Method
              <input name="method" defaultValue="bank_transfer" required />
            </label>
            <button type="submit" disabled={payableInvoices.length === 0}>
              Record payment
            </button>
          </form>
        </RecordPanel>
      </section>
      <section className="split-grid">
        <RecordPanel eyebrow="Aging" title="AR and AP exposure">
          <div className="data-grid">
            {[accounting.aging.receivables, accounting.aging.payables].map((bucket) => (
              <DataCard key={bucket.label} eyebrow={bucket.label} title={money(bucket.total.amount, bucket.total.currency)}>
                <span>Current: {money(bucket.current.amount, bucket.current.currency)}</span>
                <span>1-30: {money(bucket.days1To30.amount, bucket.days1To30.currency)}</span>
                <span>31-60: {money(bucket.days31To60.amount, bucket.days31To60.currency)}</span>
                <span>61-90: {money(bucket.days61To90.amount, bucket.days61To90.currency)}</span>
                <span>90+: {money(bucket.over90.amount, bucket.over90.currency)}</span>
              </DataCard>
            ))}
          </div>
        </RecordPanel>
        <RecordPanel
          badge={<Badge tone={statusTone(accounting.bankReconciliations[0]?.status ?? "open")}>{accounting.bankReconciliations[0]?.status ?? "open"}</Badge>}
          eyebrow="Treasury"
          title="Bank reconciliation"
        >
          <form action={createBankTransactionAction} className="record-form">
            <input name="bankAccountId" type="hidden" value={operatingBank?.id ?? ""} />
            <label>
              Reference
              <input name="reference" defaultValue={`BANK-${Date.now()}`} required />
            </label>
            <label>
              Direction
              <select name="direction" defaultValue="inbound">
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </label>
            <label>
              Amount
              <input name="amount" type="number" min="0" step="100" defaultValue="1000" required />
            </label>
            <label>
              Date
              <input name="transactionDate" type="date" defaultValue={today} required />
            </label>
            <button type="submit" disabled={!operatingBank}>
              Add transaction
            </button>
          </form>
          <form action={reconcileBankAccountAction} className="record-form">
            <input name="bankAccountId" type="hidden" value={operatingBank?.id ?? ""} />
            {unreconciledTransactions.map((transaction) => (
              <label key={transaction.id}>
                <input name="transactionIds" type="checkbox" value={transaction.id} defaultChecked />
                {transaction.reference} · {money(transaction.amount.amount, transaction.amount.currency)}
              </label>
            ))}
            <label>
              Statement balance
              <input
                name="statementBalance"
                type="number"
                step="100"
                defaultValue={operatingBank?.balance.amount ?? 0}
                required
              />
            </label>
            <label>
              Statement date
              <input name="statementDate" type="date" defaultValue={today} required />
            </label>
            <button type="submit" disabled={!operatingBank || unreconciledTransactions.length === 0}>
              Reconcile
            </button>
          </form>
        </RecordPanel>
      </section>
      <section className="split-grid">
        <RecordPanel eyebrow="Setup" title="Fiscal periods">
          <Timeline>
            {accounting.fiscalPeriods.map((period) => (
              <TimelineRow key={period.id} label={<Badge tone={statusTone(period.status)}>{period.status}</Badge>}>
                <>
                  <strong>{period.name}</strong>
                  <br />
                  {period.startDate} to {period.endDate}
                </>
              </TimelineRow>
            ))}
          </Timeline>
          <form action={closeFiscalPeriodAction} className="record-form">
            <input name="fiscalPeriodId" type="hidden" value={openPeriod?.id ?? ""} />
            <button type="submit" disabled={!openPeriod}>
              Close period
            </button>
          </form>
        </RecordPanel>
        <RecordPanel badge={<Badge tone="neutral">{accounting.taxRates.length} rates</Badge>} eyebrow="Tax" title="Rates">
          <div className="data-grid">
            {accounting.taxRates.map((taxRate) => (
              <DataCard key={taxRate.id} eyebrow="Tax rate" title={taxRate.name}>
                <span>{taxRate.rate * 100}%</span>
              </DataCard>
            ))}
          </div>
        </RecordPanel>
      </section>
      <section className="split-grid">
        <RecordPanel badge={<Badge tone="processing">{accounting.landedCostAllocations.length} allocations</Badge>} eyebrow="Costing" title="Landed cost">
          <form action={allocateLandedCostAction} className="record-form">
            <label>
              Receipt
              <select name="purchaseReceiptId" required>
                {procurement.purchaseReceipts.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {receipt.number} · {receipt.supplierName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input name="amount" type="number" min="0" step="100" defaultValue="500" required />
            </label>
            <label>
              Method
              <select name="method" defaultValue="quantity">
                <option value="quantity">Quantity</option>
                <option value="value">Value</option>
              </select>
            </label>
            <button type="submit" disabled={!latestReceipt}>
              Allocate
            </button>
          </form>
          <Timeline>
            {accounting.landedCostAllocations.map((allocation) => (
              <TimelineRow key={allocation.id} label={allocation.method}>
                <>
                  <strong>{allocation.purchaseReceiptNumber}</strong>
                  <br />
                  {money(allocation.amount.amount, allocation.amount.currency)}
                </>
              </TimelineRow>
            ))}
          </Timeline>
        </RecordPanel>
        <RecordPanel badge={<Badge tone="info">{accounting.fixedAssets.length} assets</Badge>} eyebrow="Assets" title="Depreciation">
          <form action={createFixedAssetAction} className="record-form">
            <label>
              Asset tag
              <input name="assetTag" defaultValue={`FA-${today.replaceAll("-", "")}`} required />
            </label>
            <label>
              Name
              <input name="name" defaultValue="Production equipment" required />
            </label>
            <label>
              Purchase date
              <input name="purchaseDate" type="date" defaultValue={today} required />
            </label>
            <label>
              Cost
              <input name="cost" type="number" min="0" step="100" defaultValue="12000" required />
            </label>
            <label>
              Useful life months
              <input name="usefulLifeMonths" type="number" min="1" defaultValue="36" required />
            </label>
            <button type="submit">Capitalize asset</button>
          </form>
          <form action={runDepreciationAction} className="record-form">
            <label>
              Asset
              <select name="fixedAssetId" required>
                {accounting.fixedAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.assetTag} · {money(asset.netBookValue.amount, asset.netBookValue.currency)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Run date
              <input name="runDate" type="date" defaultValue={today} required />
            </label>
            <button type="submit" disabled={!activeAsset}>
              Post depreciation
            </button>
          </form>
        </RecordPanel>
      </section>
      <section className="split-grid">
        <RecordPanel eyebrow="Currency" title="Exchange rates">
          <form action={setExchangeRateAction} className="record-form">
            <label>
              Base
              <input name="baseCurrency" defaultValue="USD" minLength={3} maxLength={3} required />
            </label>
            <label>
              Quote
              <input name="quoteCurrency" defaultValue="PHP" minLength={3} maxLength={3} required />
            </label>
            <label>
              Rate
              <input name="rate" type="number" min="0" step="0.0001" defaultValue="58" required />
            </label>
            <label>
              Effective date
              <input name="effectiveDate" type="date" defaultValue={today} required />
            </label>
            <button type="submit">Save rate</button>
          </form>
        </RecordPanel>
        <RecordPanel eyebrow="Close" title="Finance activity">
          <Timeline>
            {accounting.exchangeRates.map((rate) => (
              <TimelineRow key={rate.id} label={rate.effectiveDate}>
                <>
                  <strong>
                    {rate.baseCurrency}/{rate.quoteCurrency}
                  </strong>
                  <br />
                  {rate.rate}
                </>
              </TimelineRow>
            ))}
            {accounting.periodCloses.map((close) => (
              <TimelineRow key={close.id} label={<Badge tone={statusTone(close.status)}>{close.status}</Badge>}>
                <>
                  <strong>{close.fiscalPeriodName}</strong>
                  <br />
                  {close.closedAt}
                </>
              </TimelineRow>
            ))}
          </Timeline>
        </RecordPanel>
      </section>
    </div>
  );
}
