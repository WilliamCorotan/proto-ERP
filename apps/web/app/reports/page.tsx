import {
  createExportJobAction,
  createPrintFormatAction,
  createSavedReportAction,
  previewPrintFormatAction,
  previewReportAction,
  runReportAction
} from "../actions";
import { getProcurementSnapshot, getReportingSnapshot, getSalesSnapshot } from "../data";

export default async function ReportsPage() {
  const [reporting, sales, procurement] = await Promise.all([getReportingSnapshot(), getSalesSnapshot(), getProcurementSnapshot()]);
  const report = reporting.reports[0];
  const printFormat = reporting.printFormats[0];
  const previewRecord =
    printFormat?.entityType === "PurchaseReceipt" ? procurement.purchaseReceipts[0]?.id : sales.invoices[0]?.id;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Reporting</p>
            <h2>Reports and documents</h2>
          </div>
          <span className="status-pill">{reporting.reports.length} saved reports</span>
        </div>
        <div className="metric-grid">
          <article>
            <span>Runs</span>
            <strong>{reporting.runs.length}</strong>
          </article>
          <article>
            <span>Print formats</span>
            <strong>{reporting.printFormats.length}</strong>
          </article>
          <article>
            <span>Exports</span>
            <strong>{reporting.exportJobs.length}</strong>
          </article>
          <article>
            <span>Dashboards</span>
            <strong>{reporting.dashboards.length}</strong>
          </article>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Saved</p>
              <h2>Report catalog</h2>
            </div>
          </div>
          <div className="module-grid">
            {reporting.reports.map((item) => (
              <article key={item.id} className="module-card">
                <strong>{item.name}</strong>
                <span>
                  {item.entityType} · {item.columns.length} columns
                </span>
                <small>{item.owner}</small>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Builder</p>
              <h2>Report definition</h2>
            </div>
          </div>
          <form action={createSavedReportAction} className="record-form">
            <label>
              Name
              <input name="name" defaultValue="Finance Aging" required />
            </label>
            <label>
              Entity
              <select name="entityType" defaultValue="Aging">
                <option value="Inventory">Inventory</option>
                <option value="Aging">Aging</option>
              </select>
            </label>
            <label>
              Columns
              <input name="columns" defaultValue="bucket,total,current,over90" required />
            </label>
            <label>
              Chart
              <select name="chartType" defaultValue="bar">
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="none">None</option>
              </select>
            </label>
            <input name="labelField" type="hidden" value="bucket" />
            <input name="valueField" type="hidden" value="total" />
            <button type="submit">Save report</button>
          </form>
          <form action={runReportAction} className="record-form">
            <label>
              Report
              <select name="reportId" defaultValue={report?.id} required>
                {reporting.reports.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={!report}>
              Run report
            </button>
          </form>
          <form action={previewReportAction} className="record-form">
            <input type="hidden" name="reportId" value={report?.id ?? ""} />
            <button type="submit" disabled={!report}>
              Preview report
            </button>
          </form>
          <form action={createExportJobAction} className="record-form">
            <input type="hidden" name="reportId" value={report?.id ?? ""} />
            <label>
              Format
              <select name="format" defaultValue="csv">
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <button type="submit" disabled={!report}>
              Create export
            </button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <Timeline title="Report runs" rows={reporting.runs.map((item) => [item.id, item.status, `${item.reportName} · ${item.rowCount} rows`])} />
        <Timeline title="Exports" rows={reporting.exportJobs.map((item) => [item.id, item.status, `${item.reportName} · ${item.format}`])} />
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Builder</p>
              <h2>Print format</h2>
            </div>
          </div>
          <form action={createPrintFormatAction} className="record-form">
            <label>
              Name
              <input name="name" defaultValue="Purchase Receipt Label" required />
            </label>
            <label>
              Entity
              <select name="entityType" defaultValue="PurchaseReceipt">
                <option value="Invoice">Invoice</option>
                <option value="PurchaseReceipt">Purchase receipt</option>
                <option value="PickList">Pick list</option>
                <option value="Aging">Aging</option>
              </select>
            </label>
            <label>
              Template
              <input name="template" defaultValue="receipt-label" required />
            </label>
            <label>
              Heading
              <input name="heading" defaultValue="Purchase Receipt" required />
            </label>
            <input name="primaryField" type="hidden" value="number" />
            <input name="primaryLabel" type="hidden" value="Document" />
            <input name="secondaryField" type="hidden" value="supplierName" />
            <input name="secondaryLabel" type="hidden" value="Supplier" />
            <button type="submit">Save format</button>
          </form>
          <form action={previewPrintFormatAction} className="record-form">
            <input type="hidden" name="printFormatId" value={printFormat?.id ?? ""} />
            <input type="hidden" name="recordId" value={previewRecord ?? ""} />
            <button type="submit" disabled={!printFormat || !previewRecord}>
              Render preview
            </button>
          </form>
        </article>
        <Timeline title="Dashboards" rows={reporting.dashboards.map((item) => [item.id, "dashboard", `${item.name} · ${item.cards.length} cards`])} />
      </section>
      <section className="split-grid">
        <Timeline title="Print formats" rows={reporting.printFormats.map((item) => [item.id, item.active ? "active" : "inactive", `${item.entityType} · ${item.blocks.length} blocks`])} />
        <Timeline title="Report charts" rows={reporting.reports.map((item) => [item.id, item.chart.type, `${item.chart.labelField ?? "none"} -> ${item.chart.valueField ?? "none"}`])} />
      </section>
    </div>
  );
}

function Timeline({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Records</p>
          <h2>{title}</h2>
        </div>
        <span className="status-pill">{rows.length} records</span>
      </div>
      <div className="timeline">
        {rows.map(([id, label, detail]) => (
          <div key={id} className="timeline-row">
            <span>{label}</span>
            <p>{detail}</p>
          </div>
        ))}
        {rows.length === 0 ? <p>No records yet.</p> : null}
      </div>
    </article>
  );
}
