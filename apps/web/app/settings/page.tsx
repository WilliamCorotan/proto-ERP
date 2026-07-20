import {
  createAutomationRuleAction,
  createCustomFieldAction,
  createUserAction,
  createWorkflowAssignmentRuleAction,
  createWorkflowEscalationRuleAction,
  setModuleEnabledAction,
} from "../actions";
import {
  getAdminSnapshot,
  getCustomizationSnapshot,
  getDashboard,
} from "../data";

export default async function SettingsPage() {
  const [dashboard, admin, customization] = await Promise.all([
    getDashboard(),
    getAdminSnapshot(),
    getCustomizationSnapshot(),
  ]);
  const customerFields = customization.customFields.filter(
    (field) => field.entityType === "Customer",
  );
  const workflowOptions = [
    {
      id: "sales.quote",
      label: "Sales quote",
      fromState: "submitted",
      toState: "approved",
    },
    {
      id: "sales.order",
      label: "Sales order",
      fromState: "submitted",
      toState: "approved",
    },
    {
      id: "sales.invoice",
      label: "Sales invoice",
      fromState: "posted",
      toState: "paid",
    },
    {
      id: "procurement.purchase-order",
      label: "Purchase order",
      fromState: "submitted",
      toState: "approved",
    },
  ];

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Core platform</p>
            <h2>Settings and modules</h2>
          </div>
          <span className="status-pill">
            {dashboard.modules.length} enabled
          </span>
        </div>
        <div className="module-grid">
          {dashboard.modules.map((module) => (
            <article key={module.id} className="module-card">
              <strong>{module.name}</strong>
              <span>{module.description}</span>
              <small>
                {module.settings.length} settings keys ·{" "}
                {customization.enabledModules.includes(module.id)
                  ? "enabled"
                  : "disabled"}
              </small>
              <form action={setModuleEnabledAction} className="inline-form">
                <input type="hidden" name="moduleId" value={module.id} />
                <label>
                  Enabled
                  <input
                    name="enabled"
                    type="checkbox"
                    defaultChecked={customization.enabledModules.includes(
                      module.id,
                    )}
                    disabled={module.id === "core"}
                  />
                </label>
                {module.id === "core" ? null : (
                  <button type="submit">Save</button>
                )}
              </form>
            </article>
          ))}
        </div>
      </section>
      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Customization</p>
              <h2>Customer fields</h2>
            </div>
            <span className="status-pill">{customerFields.length} fields</span>
          </div>
          <div className="module-grid">
            {customerFields.map((field) => (
              <article key={field.id} className="module-card">
                <strong>{field.label}</strong>
                <span>
                  {field.key} · {field.fieldType}
                </span>
                <small>{field.required ? "required" : "optional"}</small>
              </article>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create</p>
              <h2>New customer field</h2>
            </div>
          </div>
          <form action={createCustomFieldAction} className="record-form">
            <label>
              Label
              <input name="label" placeholder="Region" required />
            </label>
            <label>
              Key
              <input
                name="key"
                pattern="^[a-z][a-z0-9_]*$"
                placeholder="region"
                required
              />
            </label>
            <label>
              Type
              <select name="fieldType" defaultValue="text">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="boolean">Boolean</option>
              </select>
            </label>
            <label>
              Options
              <input name="options" placeholder="APAC, EMEA, North America" />
            </label>
            <label>
              Order
              <input
                name="displayOrder"
                type="number"
                min="0"
                max="1000"
                defaultValue="100"
                required
              />
            </label>
            <label>
              Required
              <input name="required" type="checkbox" />
            </label>
            <button type="submit">Create field</button>
          </form>
        </article>
      </section>
      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Views</p>
              <h2>Configured lists</h2>
            </div>
            <span className="status-pill">
              {customization.views.length} views
            </span>
          </div>
          <div className="timeline">
            {customization.views.map((view) => (
              <div key={view.id} className="timeline-row">
                <span>{view.entityType}</span>
                <p>
                  <strong>{view.name}</strong>
                  <br />
                  {view.fields.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Automation</p>
              <h2>Rules</h2>
            </div>
            <span className="status-pill">
              {customization.automationRules.length} rules
            </span>
          </div>
          <div className="timeline">
            {customization.automationRules.map((rule) => (
              <div key={rule.id} className="timeline-row">
                <span>
                  {rule.enabled ? "enabled" : "disabled"} · {rule.runCount} runs
                </span>
                <p>
                  <strong>{rule.name}</strong>
                  <br />
                  {rule.triggerEvent ?? rule.schedule ?? rule.triggerType}
                  {rule.lastRunAt
                    ? ` · last ${new Date(rule.lastRunAt).toLocaleString("en-US")}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Automation</p>
            <h2>Create event rule</h2>
          </div>
        </div>
        <form action={createAutomationRuleAction} className="record-form">
          <label>
            Name
            <input name="name" defaultValue="HR payroll audit" required />
          </label>
          <label>
            Trigger event
            <select name="triggerEvent" defaultValue="hr.payroll.posted">
              <option value="hr.payroll.posted">HR payroll posted</option>
              <option value="hr.expense.paid">HR expense paid</option>
              <option value="commerce.channel-order.imported">
                Commerce channel order imported
              </option>
              <option value="commerce.pos-sale.posted">POS sale posted</option>
              <option value="operations.lead.created">Lead created</option>
            </select>
          </label>
          <label>
            Audit message
            <input
              name="message"
              defaultValue="Automation executed for configured event."
              required
            />
          </label>
          <label>
            Outbox event
            <input
              name="outboxEventType"
              defaultValue="automation.rule.executed"
            />
          </label>
          <label>
            Enabled
            <input name="enabled" type="checkbox" defaultChecked />
          </label>
          <button type="submit">Save rule</button>
        </form>
      </section>
      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2>Assignment rules</h2>
            </div>
            <span className="status-pill">
              {customization.workflowAssignmentRules.length} rules
            </span>
          </div>
          <div className="timeline">
            {customization.workflowAssignmentRules.map((rule) => {
              const threshold =
                rule.minAmount === null && rule.maxAmount === null
                  ? "any amount"
                  : `${rule.minAmount === null ? "0" : rule.minAmount.toLocaleString("en-US")} to ${
                      rule.maxAmount === null
                        ? "unlimited"
                        : rule.maxAmount.toLocaleString("en-US")
                    }`;
              return (
                <div key={rule.id} className="timeline-row">
                  <span>
                    {rule.active ? "active" : "inactive"} · {rule.role}
                  </span>
                  <p>
                    <strong>{rule.workflowId}</strong>
                    <br />
                    {rule.fromState} to {rule.toState} · {threshold}
                    {rule.delegateRole
                      ? ` · delegate ${rule.delegateRole}`
                      : ""}
                  </p>
                </div>
              );
            })}
            {customization.workflowAssignmentRules.length === 0 ? (
              <p>No workflow assignment rules configured.</p>
            ) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Approval policy</p>
              <h2>Create assignment rule</h2>
            </div>
          </div>
          <form
            action={createWorkflowAssignmentRuleAction}
            className="record-form"
          >
            <label>
              Workflow
              <select name="workflowId" defaultValue="sales.quote" required>
                {workflowOptions.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From state
              <input name="fromState" defaultValue="submitted" required />
            </label>
            <label>
              To state
              <input name="toState" defaultValue="approved" required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="admin" required>
                {admin.roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Delegate role
              <select name="delegateRole" defaultValue="">
                <option value="">None</option>
                {admin.roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Delegate starts
              <input name="delegateStartsAt" type="datetime-local" />
            </label>
            <label>
              Delegate ends
              <input name="delegateEndsAt" type="datetime-local" />
            </label>
            <label>
              Minimum amount
              <input
                name="minAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="50000"
              />
            </label>
            <label>
              Maximum amount
              <input
                name="maxAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="No cap"
              />
            </label>
            <label>
              Active
              <input name="active" type="checkbox" defaultChecked />
            </label>
            <button type="submit">Save assignment</button>
          </form>
        </article>
      </section>
      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2>Escalation rules</h2>
            </div>
            <span className="status-pill">
              {customization.workflowEscalationRules.length} rules
            </span>
          </div>
          <div className="timeline">
            {customization.workflowEscalationRules.map((rule) => (
              <div key={rule.id} className="timeline-row">
                <span>
                  {rule.active ? "active" : "inactive"} ·{" "}
                  {rule.notificationChannel}
                </span>
                <p>
                  <strong>{rule.workflowId}</strong>
                  <br />
                  {rule.fromState} to {rule.toState} · {rule.targetRole} after{" "}
                  {rule.dueInHours}h to {rule.escalationRole}
                </p>
              </div>
            ))}
            {customization.workflowEscalationRules.length === 0 ? (
              <p>No workflow escalation rules configured.</p>
            ) : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Escalation</p>
              <h2>Create escalation rule</h2>
            </div>
          </div>
          <form
            action={createWorkflowEscalationRuleAction}
            className="record-form"
          >
            <label>
              Workflow
              <select name="workflowId" defaultValue="sales.quote" required>
                {workflowOptions.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From state
              <input name="fromState" defaultValue="submitted" required />
            </label>
            <label>
              To state
              <input name="toState" defaultValue="approved" required />
            </label>
            <label>
              Target role
              <select name="targetRole" defaultValue="admin" required>
                {admin.roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due in hours
              <input
                name="dueInHours"
                type="number"
                min="1"
                max="720"
                defaultValue="24"
                required
              />
            </label>
            <label>
              Escalate to
              <select name="escalationRole" defaultValue="admin" required>
                {admin.roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notification
              <select name="notificationChannel" defaultValue="in_app" required>
                <option value="in_app">In app</option>
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </label>
            <label>
              Active
              <input name="active" type="checkbox" defaultChecked />
            </label>
            <button type="submit">Save escalation</button>
          </form>
        </article>
      </section>
      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RBAC</p>
              <h2>Users</h2>
            </div>
            <span className="status-pill">{admin.users.length} users</span>
          </div>
          <div className="timeline">
            {admin.users.map((user) => (
              <div key={user.id} className="timeline-row">
                <span>{user.roles.join(", ") || "none"}</span>
                <p>
                  <strong>{user.name}</strong>
                  <br />
                  {user.email}
                </p>
              </div>
            ))}
            {admin.users.length === 0 ? <p>Sign in to view users.</p> : null}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Permissions</p>
              <h2>Roles</h2>
            </div>
            <span className="status-pill">{admin.roles.length} roles</span>
          </div>
          <div className="module-grid">
            {admin.roles.map((role) => (
              <article key={role.id} className="module-card">
                <strong>{role.name}</strong>
                <span>{role.key}</span>
                <small>{role.permissions.length} permissions</small>
              </article>
            ))}
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Create</p>
            <h2>New user</h2>
          </div>
        </div>
        <form action={createUserAction} className="record-form user-form">
          <label>
            Name
            <input name="name" placeholder="User name" required />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="user@example.com"
              required
            />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          <label>
            Role
            <select name="roleKeys" defaultValue="admin" required>
              {admin.roles.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Create user</button>
        </form>
      </section>
    </div>
  );
}
