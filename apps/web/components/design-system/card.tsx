import type { HTMLAttributes } from "react";
import { cx } from "./utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cx("ds-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ds-card-header", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx("ds-card-title", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("ds-card-description", className)} {...props} />;
}
