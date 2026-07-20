import { createQualityInspectionAction, createRecallAction } from "../actions";
import { getQualitySnapshot } from "../data";

export default async function QualityPage() {
  const quality = await getQualitySnapshot();
  const template = quality.inspectionTemplates[0];
  const trace = quality.traceRecords[0];

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Quality</p>
            <h2>Traceability and compliance</h2>
          </div>
          <span className="status-pill">{quality.nonConformances.length} NCRs</span>
        </div>
        <div className="metric-grid">
          <article>
            <span>Trace records</span>
            <strong>{quality.traceRecords.length}</strong>
          </article>
          <article>
            <span>Movements</span>
            <strong>{quality.traceMovements.length}</strong>
          </article>
          <article>
            <span>CAPA</span>
            <strong>{quality.correctiveActions.length}</strong>
          </article>
          <article>
            <span>Recalls</span>
            <strong>{quality.recalls.length}</strong>
          </article>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Genealogy</p>
              <h2>Trace records</h2>
            </div>
          </div>
          <div className="module-grid">
            {quality.traceRecords.map((record) => (
              <article key={record.id} className="module-card">
                <strong>{record.lotNumber}</strong>
                <span>
                  {record.sku} · {record.status}
                </span>
                <small>
                  {record.sourceEntity} · {record.sourceId}
                </small>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inspection</p>
              <h2>Post result</h2>
            </div>
          </div>
          <form action={createQualityInspectionAction} className="record-form">
            <label>
              Template
              <select name="templateId" defaultValue={template?.id} required>
                {quality.inspectionTemplates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lot
              <select name="traceRecordId" defaultValue={trace?.id} required>
                {quality.traceRecords.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.lotNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Inspector
              <input name="inspectedBy" defaultValue="Quality Lead" required />
            </label>
            <label>
              Checkpoint
              <input name="checkpoint" defaultValue={template?.checkpoints[0] ?? "Visual check"} required />
            </label>
            <label>
              Pass
              <input name="passed" type="checkbox" defaultChecked />
            </label>
            <label>
              Note
              <input name="note" placeholder="Inspection note" />
            </label>
            <button type="submit" disabled={!template || !trace}>
              Post inspection
            </button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <Timeline title="Inspections" rows={quality.inspections.map((item) => [item.id, item.status, `${item.lotNumber} · ${item.inspectedBy}`])} />
        <Timeline title="Non-conformance" rows={quality.nonConformances.map((item) => [item.id, item.severity, `${item.lotNumber} · ${item.status}`])} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Genealogy</p>
            <h2>Movement timeline</h2>
          </div>
          <span className="status-pill">{quality.traceMovements.length} moves</span>
        </div>
        <div className="timeline">
          {quality.traceMovements.map((movement) => (
            <div key={movement.id} className="timeline-row">
              <span>{movement.movementType}</span>
              <p>
                {movement.lotNumber} · {movement.sku} · {movement.direction} {movement.quantity} · {movement.sourceEntity}
              </p>
            </div>
          ))}
          {quality.traceMovements.length === 0 ? <p>No trace movements yet.</p> : null}
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recall</p>
              <h2>Open recall</h2>
            </div>
          </div>
          <form action={createRecallAction} className="record-form">
            <label>
              Lot
              <select name="lotNumber" defaultValue={trace?.lotNumber} required>
                {quality.traceRecords.map((item) => (
                  <option key={item.id} value={item.lotNumber}>
                    {item.lotNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" defaultValue="Quality hold investigation" required />
            </label>
            <button type="submit" disabled={!trace}>
              Open recall
            </button>
          </form>
        </article>
        <Timeline title="Recalls" rows={quality.recalls.map((item) => [item.id, item.status, `${item.lotNumber} · ${item.affectedTraceIds.length} trace`])} />
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
