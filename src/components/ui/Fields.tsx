"use client";

import { ProductStockStatus } from "@/features/products/types/product";
import clsx from "clsx";
import React from "react";
import StatusPill from "../../features/products/components/StockStatusPill";
import { Accent, ACCENT_STYLES } from "../types/ui";

/* ───────────────── LABELED Field Wrapper ───────────────── */

type FieldProps = {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  icon,
  required,
  hint,
  error,
  children,
}: FieldProps) {
  return (
    <div className="space-y-1">
      {/* LABEL */}
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon && (
          <span className="flex items-center text-muted">
            {icon}
          </span>
        )}

        <span>{label}</span>

        {required && <span className="text-danger">*</span>}
      </div>

      {/* INPUT / CONTENT */}
      <div>{children}</div>

      {/* HINT / ERROR */}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ───────────────── Input ───────────────── */

type InputProps = {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
};

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  disabled,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "h-9 w-full rounded-md border bg-card px-3 text-sm text-text",
        "outline-none transition-colors duration-150",

        "placeholder:text-muted",

        /* base border */
        error ? "border-danger" : "border-border",

        /* hover */
        "hover:bg-hover",

        /* focus */
        error
          ? "focus:border-danger"
          : "focus:border-primary",

        /* disabled */
        disabled && "opacity-60 cursor-not-allowed bg-hover"
      )}
    />
  );
}

/* ───────────────── Readonly ───────────────── */

type ReadonlyProps = {
  value: string | number;
};

export function Readonly({ value }: ReadonlyProps) {
  return (
    <div
      className={clsx(
        "flex h-9 items-center rounded-md px-3 text-sm",
        "border border-border bg-hover text-muted",
        "transition-colors duration-150"
      )}
    >
      {value}
    </div>
  );
}

/* ───────────────── Stat Display ───────────────── */

type StatDisplayProps = {
  value: string | number;
  status: ProductStockStatus;
  label?: string;
  accent?: Accent;
};

export function StatDisplay({
  value,
  status,
  label,
  accent = "neutral" as Accent,
}: StatDisplayProps) {


  return (
    <div
      className={clsx(
        "flex h-9 items-center justify-between rounded-md px-3 text-sm",
        "bg-card border transition-colors duration-150",
        "hover:bg-hover",
        ACCENT_STYLES[accent]
      )}
    >
      <span className="font-medium">{value}</span>

      <StatusPill
        status={Number(status) as ProductStockStatus}
        label={label}
      />
    </div>
  );
}

/* ───────────────── Text Area ───────────────── */

export function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className={clsx(
        "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text",
        "outline-none transition-colors duration-150",

        "placeholder:text-muted",
        "resize-none",

        /* hover */
        "hover:bg-hover",

        /* focus */
        "focus:border-primary"
      )}
    />
  );
}