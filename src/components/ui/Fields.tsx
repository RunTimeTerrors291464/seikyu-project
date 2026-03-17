"use client";

import clsx from "clsx";

/* ───────────────── Field ───────────────── */

export function Field({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted">
        {icon && <span className="text-muted">{icon}</span>}
        {label}
      </div>
      {children}
    </div>
  );
}

/* ───────────────── Input ───────────────── */

export function Input({
  value,
  onChange,
}: {
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-text",
        "transition-colors duration-150",
        "placeholder:text-muted",

        /* hover + focus */
        "hover:bg-hover",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      )}
    />
  );
}

/* ───────────────── Readonly ───────────────── */

export function Readonly({ value }: { value: string }) {
  return (
    <div
      className={clsx(
        "flex h-9 items-center rounded-md px-3 text-sm",
        "bg-hover text-muted border border-border"
      )}
    >
      {value}
    </div>
  );
}

/* ───────────────── Stock Display ───────────────── */

export function StockDisplay({
  value,
  status,
}: {
  value: number;
  status: string;
}) {
  return (
    <div
      className={clsx(
        "flex h-9 items-center justify-between rounded-md border border-border px-3 text-sm",
        "bg-card text-text",
        "transition-colors duration-150 hover:bg-hover"
      )}
    >
      <span className="font-medium">{value}</span>
      <span className="text-xs text-muted">{status}</span>
    </div>
  );
}