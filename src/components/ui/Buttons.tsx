"use client";

import clsx from "clsx";
import { ReactNode } from "react";

type Variant = "default" | "primary" | "danger";
type Size = "sm" | "md";

type Props = {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
};

export default function Button({
  children,
  icon,
  onClick,
  variant = "default",
  size = "sm",
  className,
  disabled
}: Props) {

  /* ───────── Size styles ───────── */

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-2"
  };

  /* ───────── Variant styles ───────── */

  const variantStyles = {
    default:
      "border border-border bg-card text-muted hover:bg-border hover:text-text",

    primary:
      "bg-primary text-white hover:bg-primary-hover",

    danger:
      "bg-danger text-white hover:opacity-90"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center rounded-md transition-colors",
        sizeStyles[size],
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}