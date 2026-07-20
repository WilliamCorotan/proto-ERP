import {
  approveExpenseClaimAction,
  createEmployeeAdvanceAction,
  payEmployeeAdvanceAction,
  payExpenseClaimAction,
  recordAttendanceAction,
  runPayrollAction,
  submitExpenseClaimAction
} from "../actions";
import { getHrSnapshot, getOperationsSnapshot } from "../data";

export default async function HrPage() {
  const [hr, operations] = await Promise.all([getHrSnapshot(), getOperationsSnapshot()]);
  const employee = operations.employees[0];
  const submittedClaim = hr.expenseClaims.find((claim) => claim.status === "submitted");
  const approvedClaim = hr.expenseClaims.find((claim) => claim.status === "approved") ?? submittedClaim;
  const requestedAdvance = hr.employeeAdvances.find((advance) => advance.status === "requested");
  const payroll = hr.payrollRuns[0];

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">HR</p>
            <h2>Attendance, expenses, and payroll</h2>
          </div>
          <span className="status-pill">{hr.payrollRuns.length} payroll runs</span>
        </div>
        <div className="metric-grid">
          <article>
            <span>Employees</span>
            <strong>{operations.employees.length}</strong>
          </article>
          <article>
            <span>Attendance</span>
            <strong>{hr.attendance.length}</strong>
          </article>
          <article>
            <span>Open expenses</span>
            <strong>{hr.expenseClaims.filter((claim) => claim.status !== "paid").length}</strong>
          </article>
          <article>
            <span>Net payroll</span>
            <strong>{formatMoney(payroll?.netPay ?? { amount: 0, currency: "USD" })}</strong>
          </article>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2>Record time</h2>
            </div>
          </div>
          <form action={recordAttendanceAction} className="record-form">
            <label>
              Employee
              <select name="employeeId" defaultValue={employee?.id} required>
                {operations.employees.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.employeeNumber} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Work date
              <input name="workDate" type="date" defaultValue="2026-07-01" required />
            </label>
            <label>
              Check in
              <input name="checkIn" type="datetime-local" defaultValue="2026-07-01T09:00" required />
            </label>
            <label>
              Check out
              <input name="checkOut" type="datetime-local" defaultValue="2026-07-01T17:00" required />
            </label>
            <button type="submit" disabled={!employee}>
              Record attendance
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Expenses</p>
              <h2>Claim workflow</h2>
            </div>
          </div>
          <form action={submitExpenseClaimAction} className="record-form">
            <input name="employeeId" type="hidden" value={employee?.id ?? ""} />
            <label>
              Category
              <input name="category" defaultValue="Travel" required />
            </label>
            <label>
              Description
              <input name="description" defaultValue="Client visit transport" required />
            </label>
            <label>
              Amount
              <input name="amount" type="number" min="1" step="1" defaultValue="85" required />
            </label>
            <button type="submit" disabled={!employee}>
              Submit claim
            </button>
          </form>
          <form action={approveExpenseClaimAction} className="record-form">
            <input name="id" type="hidden" value={submittedClaim?.id ?? ""} />
            <button type="submit" disabled={!submittedClaim}>
              Approve claim
            </button>
          </form>
          <form action={payExpenseClaimAction} className="record-form">
            <input name="id" type="hidden" value={approvedClaim?.id ?? ""} />
            <button type="submit" disabled={!approvedClaim || approvedClaim.status === "paid"}>
              Pay claim
            </button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Advances</p>
              <h2>Employee advance</h2>
            </div>
          </div>
          <form action={createEmployeeAdvanceAction} className="record-form">
            <input name="employeeId" type="hidden" value={employee?.id ?? ""} />
            <label>
              Amount
              <input name="amount" type="number" min="1" step="1" defaultValue="250" required />
            </label>
            <button type="submit" disabled={!employee}>
              Request advance
            </button>
          </form>
          <form action={payEmployeeAdvanceAction} className="record-form">
            <input name="id" type="hidden" value={requestedAdvance?.id ?? ""} />
            <label>
              Reference
              <input name="paymentReference" defaultValue="ADV-CASH-001" required />
            </label>
            <button type="submit" disabled={!requestedAdvance}>
              Pay advance
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Payroll</p>
              <h2>Run payroll</h2>
            </div>
          </div>
          <form action={runPayrollAction} className="record-form">
            <label>
              Period start
              <input name="periodStart" type="date" defaultValue="2026-07-01" required />
            </label>
            <label>
              Period end
              <input name="periodEnd" type="date" defaultValue="2026-07-31" required />
            </label>
            <button type="submit" disabled={hr.salaryStructures.length === 0}>
              Run payroll
            </button>
          </form>
        </article>
      </section>

      <section className="split-grid">
        <Timeline title="Attendance" rows={hr.attendance.map((item) => [item.id, item.status, `${item.employeeName} · ${item.workDate} · ${item.hours}h`])} />
        <Timeline title="Expenses" rows={hr.expenseClaims.map((item) => [item.id, item.status, `${item.number} · ${item.employeeName} · ${formatMoney(item.amount)}`])} />
      </section>
      <section className="split-grid">
        <Timeline title="Advances" rows={hr.employeeAdvances.map((item) => [item.id, item.status, `${item.number} · ${formatMoney(item.amount)}`])} />
        <Timeline title="Payslips" rows={hr.payslips.map((item) => [item.id, item.status, `${item.employeeName} · ${formatMoney(item.netPay)}`])} />
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

function formatMoney(value: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: value.currency,
    maximumFractionDigits: 0
  }).format(value.amount);
}
