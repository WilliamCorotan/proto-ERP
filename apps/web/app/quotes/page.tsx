import { getSalesSnapshot, getSalesWorkflowStates } from "../data";
import { generateOrderAction, transitionQuoteAction } from "../actions";
import { CheckCircle2, ClipboardList } from "lucide-react";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function QuotesPage() {
  const { quotes } = await getSalesSnapshot();
  const quoteWorkflows = await getSalesWorkflowStates({ entity: "Quote", records: quotes, workflowId: "sales.quote" });

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Pipeline</p>
            <h2>Quotes</h2>
          </div>
          <span className="status-pill">{quotes.length} active</span>
        </div>
        <div className="data-grid">
          {quotes.map((quote) => {
            const workflow = quoteWorkflows[quote.id];
            const transitions = workflow?.instance?.transitions ?? [];
            return (
              <article key={quote.id} className="data-card sales-workflow-card">
                <em>{quote.number}</em>
                <strong>{quote.customerName}</strong>
                <span>Valid until: {quote.validUntil}</span>
                <span>{money(quote.total.amount, quote.total.currency)}</span>
                <span className="status-pill">{workflow?.instance?.state ?? quote.status}</span>
                <div className="workflow-action-bar" aria-label={`${quote.number} workflow actions`}>
                  {(workflow?.actions ?? []).map((action) => (
                    <form key={action.id} action={transitionQuoteAction} className="inline-form workflow-action-form">
                      <input type="hidden" name="id" value={quote.id} />
                      <input type="hidden" name="status" value={action.to} />
                      <input name="comment" aria-label={`${quote.number} ${action.label} comment`} placeholder="Comment" />
                      <button type="submit">
                        <CheckCircle2 aria-hidden="true" size={16} />
                        {action.label}
                      </button>
                    </form>
                  ))}
                  {(workflow?.actions ?? []).length === 0 ? <small>No workflow action available</small> : null}
                </div>
                <div className="workflow-history" aria-label={`${quote.number} workflow history`}>
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
                  <form action={generateOrderAction} className="inline-form workflow-action-form">
                    <input type="hidden" name="id" value={quote.id} />
                    <button type="submit">
                      <ClipboardList aria-hidden="true" size={16} />
                      Create order
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
