import { Boxes, CircleDollarSign, FileCheck2, PackageSearch } from "lucide-react";
import { Badge, DataCard, MetricTile, PageHeader, RecordPanel, Timeline, TimelineRow, statusTone } from "../components/design-system";
import { getDashboard, getSalesSnapshot } from "./data";

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function DashboardPage() {
  const [dashboard, sales] = await Promise.all([getDashboard(), getSalesSnapshot()]);
  const quote = sales.quotes[0];

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <div className="hero-status" aria-label="System status">
            <span>Modules online</span>
            <strong>{dashboard.modules.length}</strong>
          </div>
        }
        eyebrow="Command center"
        title={dashboard.tenant.name}
      >
        Modular ERP operating layer with tenant isolation, workflow automation, live outbox signals, manufacturing
        execution, commerce, HR, finance, and traceability in one command surface.
      </PageHeader>

      <section className="metric-grid" aria-label="ERP metrics">
        {dashboard.metrics.map((metric, index) => {
          const MetricIcon = [CircleDollarSign, FileCheck2, PackageSearch, Boxes][index] ?? CircleDollarSign;
          return (
            <MetricTile
              key={metric.label}
              icon={<MetricIcon size={20} aria-hidden="true" />}
              label={metric.label}
              tone={index === 1 ? "success" : index === 2 ? "warning" : "info"}
              trend={metric.trend}
              value={metric.value}
            />
          );
        })}
      </section>

      <section className="split-grid">
        <RecordPanel
          badge={<Badge tone={statusTone(quote?.status)}>{quote?.status ?? "empty"}</Badge>}
          eyebrow="Active quote"
          title={quote?.number ?? "No quote"}
        >
          {quote ? (
            <div className="document-flow">
              <div>
                <span>Customer</span>
                <strong>{quote.customerName}</strong>
              </div>
              <div>
                <span>Valid until</span>
                <strong>{quote.validUntil}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{money(quote.total.amount, quote.total.currency)}</strong>
              </div>
            </div>
          ) : null}
        </RecordPanel>

        <RecordPanel eyebrow="Audit trail" title="Recent activity">
          <Timeline>
            {dashboard.recentAudit.map((event) => (
              <TimelineRow key={event.id} label={event.action}>
                {event.message}
              </TimelineRow>
            ))}
          </Timeline>
        </RecordPanel>
      </section>

      <RecordPanel eyebrow="Module registry" title="Enabled capabilities">
        <div className="module-grid">
          {dashboard.modules.map((module) => (
            <DataCard key={module.id} title={module.name}>
              <span>{module.description}</span>
              <small>{module.permissions.length} permissions</small>
            </DataCard>
          ))}
        </div>
      </RecordPanel>
    </div>
  );
}
