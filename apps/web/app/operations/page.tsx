import {
  closeServiceCaseAction,
  createLeadAction,
  createLeaveRequestAction,
  createProjectAction,
  createServiceCaseAction
} from "../actions";
import { getOperationsSnapshot } from "../data";

export default async function OperationsPage() {
  const operations = await getOperationsSnapshot();
  const employee = operations.employees[0];
  const openCases = operations.serviceCases.filter((item) => item.status !== "closed");

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>CRM, projects, HR, and service</h2>
          </div>
          <span className="status-pill">{openCases.length} open cases</span>
        </div>
        <div className="metric-grid">
          <article>
            <span>Leads</span>
            <strong>{operations.leads.length}</strong>
          </article>
          <article>
            <span>Projects</span>
            <strong>{operations.projects.length}</strong>
          </article>
          <article>
            <span>Employees</span>
            <strong>{operations.employees.length}</strong>
          </article>
          <article>
            <span>Leave</span>
            <strong>{operations.leaveRequests.length}</strong>
          </article>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CRM</p>
              <h2>Lead intake</h2>
            </div>
          </div>
          <form action={createLeadAction} className="record-form">
            <label>
              Company
              <input name="companyName" defaultValue="Aster Labs" required />
            </label>
            <label>
              Contact
              <input name="contactName" defaultValue="Noah Park" required />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue="noah@aster.example" required />
            </label>
            <label>
              Source
              <input name="source" defaultValue="Website" required />
            </label>
            <label>
              Owner
              <input name="owner" defaultValue="Mina Cruz" required />
            </label>
            <button type="submit">Create lead</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Projects</p>
              <h2>Project setup</h2>
            </div>
          </div>
          <form action={createProjectAction} className="record-form">
            <label>
              Code
              <input name="code" defaultValue="PRJ-2001" required />
            </label>
            <label>
              Name
              <input name="name" defaultValue="Lab implementation" required />
            </label>
            <label>
              Customer
              <input name="customerName" defaultValue="Aster Labs" required />
            </label>
            <label>
              Budget
              <input name="budget" type="number" defaultValue="18000" min="0" required />
            </label>
            <label>
              Start
              <input name="startDate" type="date" defaultValue="2026-08-01" required />
            </label>
            <label>
              End
              <input name="endDate" type="date" defaultValue="2026-09-15" required />
            </label>
            <button type="submit">Create project</button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Service</p>
              <h2>Case intake</h2>
            </div>
          </div>
          <form action={createServiceCaseAction} className="record-form">
            <label>
              Customer
              <input name="customerName" defaultValue="Northstar Clinics" required />
            </label>
            <label>
              Subject
              <input name="subject" defaultValue="Scanner onboarding issue" required />
            </label>
            <label>
              Priority
              <select name="priority" defaultValue="high">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label>
              Owner
              <input name="owner" defaultValue="Support Lead" required />
            </label>
            <button type="submit">Create case</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">HR</p>
              <h2>Leave request</h2>
            </div>
          </div>
          <form action={createLeaveRequestAction} className="record-form">
            <label>
              Employee
              <select name="employeeId" defaultValue={employee?.id} required>
                {operations.employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select name="leaveType" defaultValue="vacation">
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
              </select>
            </label>
            <label>
              Start
              <input name="startDate" type="date" defaultValue="2026-08-10" required />
            </label>
            <label>
              End
              <input name="endDate" type="date" defaultValue="2026-08-12" required />
            </label>
            <button type="submit" disabled={!employee}>
              Request leave
            </button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <Timeline title="Leads" rows={operations.leads.map((item) => [item.id, item.stage, `${item.companyName} - ${item.owner}`])} />
        <Timeline
          title="Opportunities"
          rows={operations.opportunities.map((item) => [item.id, item.stage, `${item.companyName} - ${currency(item.expectedValue.amount)}`])}
        />
      </section>

      <section className="split-grid">
        <Timeline title="Projects" rows={operations.projects.map((item) => [item.id, item.status, `${item.code} - ${item.name}`])} />
        <Timeline title="Tasks" rows={operations.tasks.map((item) => [item.id, item.status, `${item.title} - ${item.owner}`])} />
      </section>

      <section className="split-grid">
        <Timeline
          title="Leave requests"
          rows={operations.leaveRequests.map((item) => [item.id, item.status, `${item.employeeName} - ${item.startDate}`])}
        />
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Service</p>
              <h2>Cases</h2>
            </div>
            <span className="status-pill">{operations.serviceCases.length} records</span>
          </div>
          <div className="timeline">
            {operations.serviceCases.map((item) =>
              item.status === "closed" ? (
                <div key={item.id} className="timeline-row">
                  <span>{item.status}</span>
                  <p>
                    {item.caseNumber} - {item.subject}
                  </p>
                </div>
              ) : (
                <form key={item.id} action={closeServiceCaseAction} className="timeline-row inline-action">
                  <input type="hidden" name="id" value={item.id} />
                  <span>{item.priority}</span>
                  <p>
                    {item.caseNumber} - {item.subject}
                  </p>
                  <button type="submit">Close</button>
                </form>
              )
            )}
          </div>
        </article>
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

function currency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}
