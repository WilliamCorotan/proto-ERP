import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

const buttonVariants = cva("ds-button", {
  variants: {
    variant: {
      primary: "ds-button--primary",
      secondary: "ds-button--secondary",
      ghost: "ds-button--ghost",
      danger: "ds-button--danger",
      success: "ds-button--success",
      icon: "ds-button--icon"
    },
    size: {
      sm: "ds-button--sm",
      md: "ds-button--md",
      lg: "ds-button--lg"
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "md"
  }
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cx(buttonVariants({ size, variant }), className)} {...props} />;
}
