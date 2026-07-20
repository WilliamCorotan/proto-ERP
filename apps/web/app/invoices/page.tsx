import { getSalesSnapshot, getSalesWorkflowStates } from "../data";
import { transitionInvoiceAction } from "../actions";
import { CheckCircle2 } from "lucide-react";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function InvoicesPage() {
  const { invoices } = await getSalesSnapshot();
  const invoiceWorkflows = await getSalesWorkflowStates({ entity: "Invoice", records: invoices, workflowId: "sales.invoice" });

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Billing</p>
            <h2>Invoices</h2>
          </div>
          <span className="status-pill">{invoices.length} posted</span>
        </div>
        <div className="data-grid">
          {invoices.map((invoice) => {
            const workflow = invoiceWorkflows[invoice.id];
            const transitions = workflow?.instance?.transitions ?? [];
            return (
              <article key={invoice.id} className="data-card sales-workflow-card">
                <em>{invoice.number}</em>
                <strong>{invoice.customerName}</strong>
                <span>Due: {invoice.dueDate}</span>
                <span>{money(invoice.total.amount, invoice.total.currency)}</span>
                <span className="status-pill">{workflow?.instance?.state ?? invoice.status}</span>
                <div className="workflow-action-bar" aria-label={`${invoice.number} workflow actions`}>
                  {(workflow?.actions ?? []).map((action) => (
                    <form key={action.id} action={transitionInvoiceAction} className="inline-form workflow-action-form">
                      <input type="hidden" name="id" value={invoice.id} />
                      <input type="hidden" name="status" value={action.to} />
                      <input name="comment" aria-label={`${invoice.number} ${action.label} comment`} placeholder="Comment" />
                      <button type="submit">
                        <CheckCircle2 aria-hidden="true" size={16} />
                        {action.label}
                      </button>
                    </form>
                  ))}
                  {(workflow?.actions ?? []).length === 0 ? <small>No workflow action available</small> : null}
                </div>
                <div className="workflow-history" aria-label={`${invoice.number} workflow history`}>
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
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
