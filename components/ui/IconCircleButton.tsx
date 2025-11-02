"use client";
import clsx from "clsx";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip?: string;
};

export default function IconCircleButton({ className, tooltip, children, ...rest }: Props) {
  const btn = (
    <button
      type="button"
      className={clsx(
        "rounded-full border bg-white p-1.5 text-neutral-400 shadow-sm transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );

  if (tooltip) {
    // Avoid importing Tooltip here to keep this tiny and generic; callers can wrap if needed.
    return btn;
  }
  return btn;
}
