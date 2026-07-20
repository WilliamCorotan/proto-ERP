import { Badge, DataCard, MetricTile, RecordPanel, Timeline, TimelineRow, statusTone } from "../../components/design-system";
import {
  completeJobCardAction,
  completeWorkOrderAction,
  createProductionPlanAction,
  createWorkOrderFromSuggestionAction,
  recordDowntimeAction,
  releaseWorkOrderAction,
  startJobCardAction
} from "../actions";
import { getInventorySnapshot, getManufacturingSnapshot, getSalesSnapshot } from "../data";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function ManufacturingPage() {
  const [manufacturing, inventory, sales] = await Promise.all([getManufacturingSnapshot(), getInventorySnapshot(), getSalesSnapshot()]);
  const product = sales.products.find((item) => manufacturing.boms.some((bom) => bom.productId === item.id)) ?? sales.products[0];
  const openSuggestions = manufacturing.mrpSuggestions.filter((suggestion) => suggestion.status === "open");
  const activeWorkOrders = manufacturing.workOrders.filter((order) => !["completed", "cancelled"].includes(order.status));

  return (
    <div className="page-stack">
      <RecordPanel badge={<Badge tone="warning">{openSuggestions.length} MRP suggestions</Badge>} eyebrow="Manufacturing" title="Planning and execution">
        <div className="metric-grid">
          <MetricTile label="BOMs" tone="info" value={manufacturing.boms.length} />
          <MetricTile label="Work centers" tone="processing" value={manufacturing.workCenters.length} />
          <MetricTile label="Work orders" tone="automation" value={manufacturing.workOrders.length} />
          <MetricTile label="Inventory check" tone={inventory.reconciled ? "success" : "warning"} value={inventory.reconciled ? "OK" : "Review"} />
        </div>
      </RecordPanel>

      <section className="split-grid">
        <RecordPanel
          badge={<Badge tone="neutral">{manufacturing.boms.length + manufacturing.routings.length} records</Badge>}
          eyebrow="Master data"
          title="BOMs and routings"
        >
          <div className="data-grid">
            {manufacturing.boms.map((bom) => (
              <DataCard key={bom.id} eyebrow="BOM" title={bom.number}>
                <span>
                  {bom.sku} - {bom.items.length} component
                </span>
                <span>{money(bom.estimatedCost.amount, bom.estimatedCost.currency)}</span>
              </DataCard>
            ))}
            {manufacturing.routings.map((routing) => (
              <DataCard key={routing.id} eyebrow="Routing" title={routing.number}>
                <span>
                  {routing.sku} - {routing.operations.length} operation
                </span>
                <Badge tone={statusTone(routing.status)}>{routing.status}</Badge>
              </DataCard>
            ))}
          </div>
        </RecordPanel>

        <RecordPanel eyebrow="MRP" title="New production plan">
          <form action={createProductionPlanAction} className="record-form">
            <label>
              Product
              <select name="productId" defaultValue={product?.id} required>
                {sales.products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Demand quantity
              <input name="demandQuantity" type="number" min="1" defaultValue="60" required />
            </label>
            <label>
              Demand date
              <input name="demandDate" type="date" defaultValue="2026-08-15" required />
            </label>
            <input type="hidden" name="sourceEntity" value="ManualPlan" />
            <input type="hidden" name="sourceId" value={`manual-plan-${Date.now()}`} />
            <button type="submit" disabled={!product}>
              Run MRP
            </button>
          </form>
        </RecordPanel>
      </section>

      <section className="split-grid">
        <RecordPanel badge={<Badge tone="neutral">{manufacturing.mrpSuggestions.length} records</Badge>} eyebrow="MRP" title="Suggestions">
          <Timeline>
            {manufacturing.mrpSuggestions.map((suggestion) => (
              <TimelineRow
                key={suggestion.id}
                action={
                  suggestion.suggestionType === "work_order" && suggestion.status === "open" ? (
                    <form action={createWorkOrderFromSuggestionAction} className="inline-form">
                      <input type="hidden" name="id" value={suggestion.id} />
                      <button type="submit">Create WO</button>
                    </form>
                  ) : null
                }
                label={suggestion.suggestionType}
              >
                <>
                  <strong>{suggestion.sku}</strong>
                  <br />
                  {suggestion.quantity} required by {suggestion.requiredBy}
                </>
              </TimelineRow>
            ))}
            {manufacturing.mrpSuggestions.length === 0 ? <p>No MRP suggestions yet.</p> : null}
          </Timeline>
        </RecordPanel>

        <RecordPanel badge={<Badge tone="processing">{activeWorkOrders.length} active</Badge>} eyebrow="Execution" title="Work orders">
          <Timeline>
            {manufacturing.workOrders.map((order) => (
              <TimelineRow
                key={order.id}
                action={
                  <>
                    {order.status === "draft" ? <WorkOrderButton action={releaseWorkOrderAction} id={order.id} label="Release" /> : null}
                    {order.status === "released" || order.status === "in_process" ? (
                      <WorkOrderButton action={completeWorkOrderAction} id={order.id} label="Complete" />
                    ) : null}
                  </>
                }
                label={<Badge tone={statusTone(order.status)}>{order.status}</Badge>}
              >
                <>
                  <strong>{order.number}</strong>
                  <br />
                  {order.sku} - {order.quantity} units
                </>
              </TimelineRow>
            ))}
            {manufacturing.workOrders.length === 0 ? <p>No work orders yet.</p> : null}
          </Timeline>
        </RecordPanel>
      </section>

      <section className="split-grid">
        <RecordPanel badge={<Badge tone="automation">{manufacturing.jobCards.length} operations</Badge>} eyebrow="MES" title="Job cards">
          <Timeline>
            {manufacturing.jobCards.map((card) => (
              <TimelineRow
                key={card.id}
                action={
                  <>
                    {card.status === "open" ? (
                      <form action={startJobCardAction} className="inline-form">
                        <input type="hidden" name="jobCardId" value={card.id} />
                        <input type="hidden" name="operator" value="Shop Lead" />
                        <button type="submit">Start</button>
                      </form>
                    ) : null}
                    {card.status === "in_process" ? (
                      <form action={completeJobCardAction} className="inline-form">
                        <input type="hidden" name="jobCardId" value={card.id} />
                        <input type="hidden" name="actualMinutes" value={card.plannedMinutes} />
                        <button type="submit">Complete op</button>
                      </form>
                    ) : null}
                  </>
                }
                label={<Badge tone={statusTone(card.status)}>{card.status}</Badge>}
              >
                <>
                  <strong>{card.workOrderNumber}</strong>
                  <br />
                  {card.operationSequence} - {card.operationName} - {card.workCenterCode}
                </>
              </TimelineRow>
            ))}
            {manufacturing.jobCards.length === 0 ? <p>No job cards yet.</p> : null}
          </Timeline>
        </RecordPanel>

        <RecordPanel badge={<Badge tone="warning">{manufacturing.downtimeEntries.length} stops</Badge>} eyebrow="Capacity" title="Schedule and downtime">
          <Timeline>
            {manufacturing.capacitySchedule.map((row) => (
              <TimelineRow key={row.workCenterId} label={`${row.loadPercent}%`}>
                <>
                  <strong>{row.workCenterCode}</strong>
                  <br />
                  {row.scheduledMinutes}/{row.capacityMinutes} min · {row.downtimeMinutes} min downtime
                </>
              </TimelineRow>
            ))}
          </Timeline>
          <form action={recordDowntimeAction} className="record-form">
            <label>
              Work center
              <select name="workCenterId" defaultValue={manufacturing.workCenters[0]?.id} required>
                {manufacturing.workCenters.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.code} · {center.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Job card
              <select name="jobCardId" defaultValue="">
                <option value="">Unassigned</option>
                {manufacturing.jobCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.workOrderNumber} · {card.operationName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" defaultValue="Material wait" required />
            </label>
            <label>
              Minutes
              <input name="minutes" type="number" min="1" defaultValue="15" required />
            </label>
            <button type="submit" disabled={manufacturing.workCenters.length === 0}>
              Record downtime
            </button>
          </form>
        </RecordPanel>
      </section>

      <RecordPanel badge={<Badge tone="neutral">{manufacturing.productionPlans.length} plans</Badge>} eyebrow="Plans" title="Production plans">
        <div className="data-grid">
          {manufacturing.productionPlans.map((plan) => (
            <DataCard key={plan.id} eyebrow={<Badge tone={statusTone(plan.status)}>{plan.status}</Badge>} title={plan.number}>
              <span>
                {plan.sourceEntity} - {plan.sourceId}
              </span>
              <span>Demand: {plan.demandDate}</span>
            </DataCard>
          ))}
        </div>
      </RecordPanel>
    </div>
  );
}

function WorkOrderButton({ action, id, label }: { action: (formData: FormData) => Promise<void>; id: string; label: string }) {
  return (
    <form action={action} className="inline-form">
      <input type="hidden" name="id" value={id} />
      <button type="submit">{label}</button>
    </form>
  );
}
