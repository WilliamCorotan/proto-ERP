import {
  createMaterialRequestAction,
  createPurchaseInvoiceAction,
  createPurchaseOrderAction,
  createSupplierAction,
  payPurchaseInvoiceAction,
  receivePurchaseOrderAction,
  transitionPurchaseOrderAction
} from "../actions";
import { getProcurementSnapshot, getPurchaseOrderWorkflowStates, getSalesSnapshot } from "../data";
import { CheckCircle2, PackageCheck, ReceiptText } from "lucide-react";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ProcurementPage() {
  const [procurement, sales] = await Promise.all([getProcurementSnapshot(), getSalesSnapshot()]);
  const purchaseOrderWorkflows = await getPurchaseOrderWorkflowStates(procurement.purchaseOrders);
  const defaultProduct = sales.products[0];

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Procurement</p>
            <h2>Procure to pay</h2>
          </div>
          <span className="status-pill">{procurement.purchaseOrders.length} purchase orders</span>
        </div>
        <div className="metric-grid">
          <article>
            <span>Suppliers</span>
            <strong>{procurement.suppliers.length}</strong>
          </article>
          <article>
            <span>Requests</span>
            <strong>{procurement.materialRequests.length}</strong>
          </article>
          <article>
            <span>Receipts</span>
            <strong>{procurement.purchaseReceipts.length}</strong>
          </article>
          <article>
            <span>AP invoices</span>
            <strong>{procurement.purchaseInvoices.length}</strong>
          </article>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Suppliers</p>
              <h2>Supplier master</h2>
            </div>
            <span className="status-pill">{procurement.suppliers.length} records</span>
          </div>
          <div className="module-grid">
            {procurement.suppliers.map((supplier) => (
              <article key={supplier.id} className="module-card">
                <strong>{supplier.name}</strong>
                <span>
                  {supplier.code} · {supplier.paymentTerms}
                </span>
                <small>{supplier.email}</small>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>New supplier</h2>
            </div>
          </div>
          <form action={createSupplierAction} className="record-form">
            <label>
              Code
              <input name="code" placeholder="S-1002" required />
            </label>
            <label>
              Name
              <input name="name" placeholder="Supplier name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="sales@example.com" required />
            </label>
            <label>
              Phone
              <input name="phone" placeholder="+1-555-0102" required />
            </label>
            <label>
              Terms
              <input name="paymentTerms" defaultValue="Net 30" required />
            </label>
            <button type="submit">Create supplier</button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Requests</p>
              <h2>Material requests</h2>
            </div>
            <span className="status-pill">{procurement.materialRequests.length} requests</span>
          </div>
          <div className="timeline">
            {procurement.materialRequests.map((request) => (
              <div key={request.id} className="timeline-row">
                <span>{request.status}</span>
                <p>
                  <strong>{request.number}</strong>
                  <br />
                  {request.requester} · required {request.requiredBy}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>Material request</h2>
            </div>
          </div>
          <ProcurementLineForm action={createMaterialRequestAction} products={sales.products} submitLabel="Create request">
            <label>
              Requester
              <input name="requester" defaultValue="Warehouse" required />
            </label>
            <label>
              Required by
              <input name="requiredBy" type="date" defaultValue="2026-08-01" required />
            </label>
          </ProcurementLineForm>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Purchase orders</h2>
          </div>
          <span className="status-pill">{procurement.purchaseOrders.length} orders</span>
        </div>
        <div className="data-grid">
          {procurement.purchaseOrders.map((order) => {
            const workflow = purchaseOrderWorkflows[order.id];
            const transitions = workflow?.instance?.transitions ?? [];
            return (
              <article key={order.id} className="data-card purchase-order-card">
                <em>{order.number}</em>
                <strong>{order.supplierName}</strong>
                <span>Expected: {order.expectedDate}</span>
                <span>Total: {money(order.total.amount, order.total.currency)}</span>
                <span className="status-pill">{workflow?.instance?.state ?? order.status}</span>
                <div className="workflow-action-bar" aria-label={`${order.number} workflow actions`}>
                  {(workflow?.actions ?? []).map((action) => (
                    <form key={action.id} action={transitionPurchaseOrderAction} className="inline-form workflow-action-form">
                      <input type="hidden" name="id" value={order.id} />
                      <input type="hidden" name="status" value={action.to} />
                      <input name="comment" aria-label={`${order.number} ${action.label} comment`} placeholder="Comment" />
                      <button type="submit">
                        <CheckCircle2 aria-hidden="true" size={16} />
                        {action.label}
                      </button>
                    </form>
                  ))}
                  {(workflow?.actions ?? []).length === 0 ? <small>No workflow action available</small> : null}
                </div>
                <div className="workflow-history" aria-label={`${order.number} workflow history`}>
                  {transitions.map((transition) => (
                    <div key={transition.id} className="workflow-history-row">
                      <span>
                        {transition.from} to {transition.to}
                      </span>
                      <small>{formatDateTime(transition.occurredAt)}</small>
                      {transition.comment ?? transition.reason ? <small className="workflow-history-comment">{transition.comment ?? transition.reason}</small> : null}
                    </div>
                  ))}
                  {transitions.length === 0 ? <small>Workflow history starts after the next transition.</small> : null}
                </div>
                <div className="workflow-action-bar">
                  <form action={receivePurchaseOrderAction} className="inline-form workflow-action-form">
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit">
                      <PackageCheck aria-hidden="true" size={16} />
                      Receive
                    </button>
                  </form>
                  <form action={createPurchaseInvoiceAction} className="inline-form workflow-action-form">
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit">
                      <ReceiptText aria-hidden="true" size={16} />
                      Invoice
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>Purchase order</h2>
            </div>
          </div>
          <ProcurementLineForm action={createPurchaseOrderAction} products={sales.products} submitLabel="Create order">
            <label>
              Supplier
              <select name="supplierId" required>
                {procurement.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Expected
              <input name="expectedDate" type="date" defaultValue="2026-08-01" required />
            </label>
          </ProcurementLineForm>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Accounts payable</p>
              <h2>Supplier invoices</h2>
            </div>
            <span className="status-pill">{procurement.purchaseInvoices.length} invoices</span>
          </div>
          <div className="timeline">
            {procurement.purchaseInvoices.map((invoice) => (
              <div key={invoice.id} className="timeline-row">
                <span>{invoice.status}</span>
                <p>
                  <strong>{invoice.number}</strong>
                  <br />
                  {invoice.supplierName} · {money(invoice.total.amount, invoice.total.currency)}
                </p>
                <form action={payPurchaseInvoiceAction} className="inline-form">
                  <input type="hidden" name="id" value={invoice.id} />
                  <input type="hidden" name="amount" value={invoice.total.amount} />
                  <input type="hidden" name="method" value="bank_transfer" />
                  <button type="submit">Pay</button>
                </form>
              </div>
            ))}
            {procurement.purchaseInvoices.length === 0 ? <p>No supplier invoices posted yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Receipts</p>
              <h2>Stock received</h2>
            </div>
            <span className="status-pill">{procurement.purchaseReceipts.length} receipts</span>
          </div>
          <div className="timeline">
            {procurement.purchaseReceipts.map((receipt) => (
              <div key={receipt.id} className="timeline-row">
                <span>{receipt.status}</span>
                <p>
                  <strong>{receipt.number}</strong>
                  <br />
                  {receipt.supplierName} · {receipt.lines.length} line
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Payments</p>
              <h2>Supplier payments</h2>
            </div>
            <span className="status-pill">{procurement.supplierPayments.length} payments</span>
          </div>
          <div className="timeline">
            {procurement.supplierPayments.map((payment) => (
              <div key={payment.id} className="timeline-row">
                <span>{payment.method}</span>
                <p>
                  <strong>{payment.purchaseInvoiceNumber}</strong>
                  <br />
                  {payment.supplierName} · {money(payment.amount.amount, payment.amount.currency)}
                </p>
              </div>
            ))}
            {procurement.supplierPayments.length === 0 ? <p>No supplier payments recorded yet.</p> : null}
          </div>
        </article>
      </section>
      {defaultProduct ? null : <p>No products are available for procurement lines.</p>}
    </div>
  );
}

function ProcurementLineForm({
  action,
  children,
  products,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  products: Array<{
    id: string;
    sku: string;
    name: string;
    price: { amount: number; currency: string };
  }>;
  submitLabel: string;
}) {
  const product = products[0];
  return (
    <form action={action} className="record-form">
      {children}
      <label>
        Product
        <select name="productId" required>
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sku} · {item.name}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="sku" value={product?.sku ?? ""} />
      <input type="hidden" name="description" value={product?.name ?? ""} />
      <label>
        Quantity
        <input name="quantity" type="number" min="1" defaultValue="10" required />
      </label>
      <label>
        Unit price
        <input name="unitPrice" type="number" min="0" step="1" defaultValue={product?.price.amount ?? 0} required />
      </label>
      <button type="submit" disabled={!product}>
        {submitLabel}
      </button>
    </form>
  );
}
