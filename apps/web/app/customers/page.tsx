import type { CustomFieldDefinition } from "@erp/sdk";
import { getCustomizationSnapshot, getSalesSnapshot } from "../data";
import { createCustomerAction, updateCustomerAction } from "../actions";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function CustomersPage() {
  const [{ customers }, customization] = await Promise.all([getSalesSnapshot(), getCustomizationSnapshot()]);
  const customerFields = customization.customFields
    .filter((field) => field.entityType === "Customer")
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Sales</p>
            <h2>Customers</h2>
          </div>
          <span className="status-pill">{customers.length} records</span>
        </div>
        <div className="data-grid">
          {customers.map((customer) => (
            <article key={customer.id} className="data-card">
              <em>{customer.code}</em>
              <strong>{customer.name}</strong>
              <span>{customer.email}</span>
              <span>Owner: {customer.owner}</span>
              <span>Credit: {money(customer.creditLimit.amount, customer.creditLimit.currency)}</span>
              {customerFields.map((field) => (
                <span key={field.id}>
                  {field.label}: {formatCustomValue(customer.customFields[field.key])}
                </span>
              ))}
              <span className="status-pill">{customer.status}</span>
              <form action={updateCustomerAction} className="mini-form">
                <input type="hidden" name="id" value={customer.id} />
                <input name="code" defaultValue={customer.code} aria-label="Customer code" required />
                <input name="name" defaultValue={customer.name} aria-label="Customer name" required />
                <input name="owner" defaultValue={customer.owner} aria-label="Customer owner" required />
                <input name="email" defaultValue={customer.email} type="email" aria-label="Customer email" required />
                <input
                  name="creditLimit"
                  defaultValue={customer.creditLimit.amount}
                  type="number"
                  min="0"
                  step="100"
                  aria-label="Credit limit"
                  required
                />
                {customerFields.map((field) => (
                  <CustomFieldInput key={field.id} field={field} value={customer.customFields[field.key] ?? null} compact />
                ))}
                <button type="submit">Update</button>
              </form>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Create</p>
            <h2>New customer</h2>
          </div>
        </div>
        <form action={createCustomerAction} className="record-form">
          <label>
            Code
            <input name="code" placeholder="C-1004" required />
          </label>
          <label>
            Name
            <input name="name" placeholder="Customer name" required />
          </label>
          <label>
            Owner
            <input name="owner" placeholder="Account owner" required />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="team@example.com" required />
          </label>
          <label>
            Credit limit
            <input name="creditLimit" type="number" min="0" step="100" defaultValue="25000" required />
          </label>
          {customerFields.map((field) => (
            <label key={field.id}>
              {field.label}
              <CustomFieldInput field={field} />
            </label>
          ))}
          <button type="submit">Create customer</button>
        </form>
      </section>
    </div>
  );
}

function CustomFieldInput({
  compact = false,
  field,
  value
}: {
  compact?: boolean;
  field: CustomFieldDefinition;
  value?: string | number | boolean | null;
}) {
  const name = `custom.${field.key}`;
  const ariaLabel = compact ? `${field.label} custom field` : undefined;
  const defaultValue = value == null ? "" : String(value);

  if (field.fieldType === "select") {
    return (
      <select name={name} defaultValue={defaultValue} aria-label={ariaLabel} required={field.required}>
        <option value="">Unassigned</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      name={name}
      defaultValue={defaultValue}
      type={inputType(field.fieldType)}
      aria-label={ariaLabel}
      required={field.required}
    />
  );
}

function inputType(fieldType: CustomFieldDefinition["fieldType"]) {
  if (fieldType === "date" || fieldType === "number") {
    return fieldType;
  }
  return "text";
}

function formatCustomValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "not set";
  }
  return String(value);
}
