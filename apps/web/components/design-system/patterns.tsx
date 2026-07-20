import type { HTMLAttributes, ReactNode } from "react";
import { Badge, type BadgeProps } from "./badge";
import { Card, CardHeader, CardTitle } from "./card";
import { cx } from "./utils";

export function PageHeader({
  actions,
  eyebrow,
  title,
  children
}: {
  actions?: ReactNode;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="ds-page-header">
      <div>
        <p className="ds-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children ? <p>{children}</p> : null}
      </div>
      {actions ? <div className="ds-page-header-actions">{actions}</div> : null}
    </section>
  );
}

export function MetricTile({
  icon,
  label,
  value,
  trend,
  tone = "info"
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  tone?: BadgeProps["tone"];
}) {
  return (
    <Card className="ds-metric-tile">
      <div className="ds-metric-kicker">
        {icon ? <span className="ds-metric-icon">{icon}</span> : null}
        <Badge tone={tone}>{label}</Badge>
      </div>
      <strong>{value}</strong>
      {trend ? <small>{trend}</small> : null}
    </Card>
  );
}

export function Timeline({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ds-timeline", className)} {...props} />;
}

export function TimelineRow({
  label,
  children,
  action
}: {
  label: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={cx("ds-timeline-row", action && "ds-timeline-row--action")}>
      <span>{label}</span>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function DataCard({
  eyebrow,
  title,
  children
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="ds-data-card">
      {eyebrow ? <em>{eyebrow}</em> : null}
      <strong>{title}</strong>
      {children}
    </Card>
  );
}

export function RecordPanel({
  eyebrow,
  title,
  badge,
  children
}: {
  eyebrow: string;
  title: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <p className="ds-eyebrow">{eyebrow}</p>
          <CardTitle>{title}</CardTitle>
        </div>
        {badge}
      </CardHeader>
      {children}
    </Card>
  );
}

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  align?: "end" | "start";
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  caption,
  columns,
  empty = "No records yet.",
  rows,
  rowKey
}: {
  caption: string;
  columns: Array<DataTableColumn<T>>;
  empty?: ReactNode;
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align === "end" ? "is-end" : undefined} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === "end" ? "is-end" : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="ds-table-empty" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
