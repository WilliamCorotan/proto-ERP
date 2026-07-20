import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cx } from "./utils";

const badgeVariants = cva("ds-badge", {
  variants: {
    tone: {
      neutral: "ds-badge--neutral",
      success: "ds-badge--success",
      warning: "ds-badge--warning",
      danger: "ds-badge--danger",
      info: "ds-badge--info",
      processing: "ds-badge--processing",
      automation: "ds-badge--automation"
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cx(badgeVariants({ tone }), className)} {...props} />;
}

export function statusTone(status: string | null | undefined): NonNullable<BadgeProps["tone"]> {
  const value = (status ?? "").toLowerCase();
  if (["approved", "active", "balanced", "closed", "completed", "delivered", "dispatched", "enabled", "paid", "posted", "present", "released", "success"].includes(value)) {
    return "success";
  }
  if (["draft", "open", "pending", "requested", "submitted", "processing", "in_process"].includes(value)) {
    return "processing";
  }
  if (["late", "warning", "needs review"].includes(value)) {
    return "warning";
  }
  if (["cancelled", "danger", "dead_letter", "failed", "inactive", "out of balance", "rejected", "void"].includes(value)) {
    return "danger";
  }
  if (value.includes("automation")) {
    return "automation";
  }
  return "neutral";
}
