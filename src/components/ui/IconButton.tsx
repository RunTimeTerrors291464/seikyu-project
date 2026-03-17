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
  disabled,
}: Props) {

  /* ───────── Size ───────── */

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-2",
  };

  /* ───────── Variant (LIGHT HOVER STYLE) ───────── */

  const variantStyles = {
    default:
      "border border-border bg-card text-muted hover:bg-hover hover:text-text active:bg-active",

    primary:
      "bg-primary text-white hover:bg-primary/90 active:bg-primary/80",

    danger:
      "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-md",
        "transition-all duration-150",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",

        /* pointer */
        !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",

        /* press feel */
        "active:translate-y-[1px]",

        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}