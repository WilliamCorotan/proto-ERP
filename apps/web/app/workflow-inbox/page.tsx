import { ArrowRight, CheckCircle2, Inbox, TimerReset } from "lucide-react";
import { transitionWorkflowTaskAction } from "../actions";
import { getWorkflowInbox } from "../data";

function formatDateTime(value: string | null) {
  if (!value) {
    return "No due date";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function WorkflowInboxPage() {
  const inbox = await getWorkflowInbox();
  const overdue = inbox.tasks.filter(
    (task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now(),
  ).length;

  return (
    <div className="page-stack">
      <section className="panel workflow-inbox-hero">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2>Workflow Inbox</h2>
          </div>
          <span className="status-pill">{inbox.tasks.length} tasks</span>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <span>Assigned work</span>
            <strong>{inbox.tasks.length}</strong>
            <small>Role-aware actions ready for the current operator.</small>
          </div>
          <div className="metric-card">
            <span>Due attention</span>
            <strong>{overdue}</strong>
            <small>Tasks past their document due date.</small>
          </div>
          <div className="metric-card">
            <span>Generated</span>
            <strong>{formatDateTime(inbox.generatedAt)}</strong>
            <small>Current workflow policy evaluation.</small>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Assignments</p>
            <h2>Action queue</h2>
          </div>
          <Inbox aria-hidden="true" size={20} />
        </div>
        <div className="workflow-inbox-list">
          {inbox.tasks.map((task) => (
            <article key={task.id} className="workflow-task-card">
              <div className="workflow-task-main">
                <em>{task.workflowId}</em>
                <strong>{task.title}</strong>
                <span>{task.summary}</span>
                <div className="workflow-task-meta">
                  <span className="status-pill">{task.currentState}</span>
                  <span>
                    <TimerReset aria-hidden="true" size={14} />
                    {formatDateTime(task.dueAt)}
                  </span>
                  <span>Role: {task.assigneeRole}</span>
                  <span>{task.ageHours}h open</span>
                  <span>{task.dueStatus.replace("_", " ")}</span>
                  {task.escalated ? (
                    <span>
                      Escalated: {task.escalatedRoles.join(", ")}
                      {task.notificationChannels.length > 0
                        ? ` via ${task.notificationChannels.join(", ")}`
                        : ""}
                    </span>
                  ) : null}
                </div>
              </div>
              <form
                action={transitionWorkflowTaskAction}
                className="workflow-task-action"
              >
                <input
                  type="hidden"
                  name="entity"
                  value={task.document.entity}
                />
                <input type="hidden" name="id" value={task.document.id} />
                <input type="hidden" name="status" value={task.action.to} />
                <label>
                  <span>
                    {task.currentState}{" "}
                    <ArrowRight aria-hidden="true" size={14} /> {task.action.to}
                  </span>
                  <input
                    name="comment"
                    placeholder="Comment"
                    aria-label={`${task.title} ${task.action.label} comment`}
                  />
                </label>
                <button type="submit">
                  <CheckCircle2 aria-hidden="true" size={16} />
                  {task.action.label}
                </button>
              </form>
            </article>
          ))}
          {inbox.tasks.length === 0 ? (
            <p>No workflow tasks are assigned to your roles.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
