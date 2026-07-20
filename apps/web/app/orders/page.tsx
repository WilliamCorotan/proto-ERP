import { getSalesSnapshot, getSalesWorkflowStates } from "../data";
import { generateInvoiceAction, transitionOrderAction } from "../actions";
import { CheckCircle2, ReceiptText } from "lucide-react";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function OrdersPage() {
  const { orders } = await getSalesSnapshot();
  const orderWorkflows = await getSalesWorkflowStates({ entity: "SalesOrder", records: orders, workflowId: "sales.order" });

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Fulfillment</p>
            <h2>Sales Orders</h2>
          </div>
          <span className="status-pill">{orders.length} orders</span>
        </div>
        <div className="data-grid">
          {orders.map((order) => {
            const workflow = orderWorkflows[order.id];
            const transitions = workflow?.instance?.transitions ?? [];
            return (
              <article key={order.id} className="data-card sales-workflow-card">
                <em>{order.number}</em>
                <strong>{order.customerName}</strong>
                <span>Promised: {order.promisedDate}</span>
                <span>{money(order.total.amount, order.total.currency)}</span>
                <span className="status-pill">{workflow?.instance?.state ?? order.status}</span>
                <div className="workflow-action-bar" aria-label={`${order.number} workflow actions`}>
                  {(workflow?.actions ?? []).map((action) => (
                    <form key={action.id} action={transitionOrderAction} className="inline-form workflow-action-form">
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
                  <form action={generateInvoiceAction} className="inline-form workflow-action-form">
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit">
                      <ReceiptText aria-hidden="true" size={16} />
                      Create invoice
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
