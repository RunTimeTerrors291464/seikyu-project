"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { Accent, ACCENT_STYLES, Size } from "../types/ui";

type Props = {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  accent?: Accent;
  size?: Size;
  className?: string;
  disabled?: boolean;
};

export default function Button({
  children,
  icon,
  onClick,
  accent = "neutral" as Accent,
  size = "sm",
  className,
  disabled,
}: Props) {

  /* ───────── Size styles ───────── */

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-2",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex min-w-0 max-w-full items-center justify-center overflow-hidden rounded-md",
        "transition-all duration-150",
        "focus:bg-active focus:border-active",

        /* pointer behavior */
        !disabled && "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",

        /* subtle press */
        "active:translate-y-[1px]",

        sizeStyles[size],
        ACCENT_STYLES[accent],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}