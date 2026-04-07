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
  warning?: string;
  children: React.ReactNode;
  /**
   * When true, the field is a flex column that grows with its parent (`flex-1 min-h-0`),
   * and the control slot expands so inputs like `Textarea` can fill remaining height.
   */
  fillHeight?: boolean;
};

export function Field({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  children,
  fillHeight = false,
}: FieldProps) {
  const hasError = !!error;
  const hasWarning = !error && !!warning;

  return (
    <div
      className={clsx(
        "space-y-1",
        fillHeight && "flex min-h-0 flex-1 flex-col",
      )}
    >
      {/* LABEL */}
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
        {icon && <span className="flex items-center text-muted">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
      </div>

      {/* INPUT */}
      <div className={clsx(fillHeight && "flex min-h-0 flex-1 flex-col")}>
        {React.isValidElement(children) &&
        typeof children.type !== "string" &&
        children.type !== React.Fragment
          ? React.cloneElement(
              children as React.ReactElement<{
                error?: boolean;
                warning?: boolean;
              }>,
              {
                // Avoid passing explicit false values down to DOM elements.
                // React warns when non-boolean attributes receive `false`, so
                // only provide these props when they are actually active.
                error: hasError || undefined,
                warning: hasWarning || undefined,
              }
            )
          : children}
      </div>

      {/* MESSAGE */}
      {hasError ? (
        <p className="shrink-0 text-xs text-danger">{error}</p>
      ) : hasWarning ? (
        <p className="shrink-0 text-xs text-warning">{warning}</p>
      ) : hint ? (
        <p className="shrink-0 text-xs text-muted">{hint}</p>
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
  warning?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  className?: string;
};

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  error = false,
  warning = false,
  disabled,
  onBlur,
  onPaste,
  inputMode,
  maxLength,
  className,
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      onBlur={onBlur}
      onPaste={onPaste}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "h-9 w-full min-w-0 rounded-md border bg-card px-3 text-sm text-text",
        "outline-none transition-colors duration-150",
        "placeholder:text-muted",

        error
          ? "border-danger"
          : warning
            ? "border-warning"
            : "border-border",

        "hover:bg-hover",

        error
          ? "focus:border-danger"
          : warning
            ? "focus:border-warning"
            : "focus:border-primary",

        /* disabled */
        disabled && "opacity-60 cursor-not-allowed bg-hover",
        className,
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

      <StatusPill status={Number(status) as ProductStockStatus} />
    </div>
  );
}

/* ───────────────── Text Area ───────────────── */

type TextareaProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onBlur?: () => void;
  warning?: boolean;
  rows?: number;
  className?: string;
};

export function Textarea({
  value,
  onChange,
  placeholder,
  onBlur,
  disabled = false,
  error = false,
  warning = false,
  rows = 3,
  className,
}: TextareaProps) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      rows={rows}
      className={clsx(
        "w-full rounded-md border bg-card px-3 py-2 text-sm text-text",
        "outline-none transition-colors duration-150",
        "placeholder:text-muted",
        "resize-none",

        error
          ? "border-danger"
          : warning
            ? "border-warning"
            : "border-border",

        "hover:bg-hover",

        error
          ? "focus:border-danger"
          : warning
            ? "focus:border-warning"
            : "focus:border-primary",

        /* disabled */
        disabled && "opacity-60 cursor-not-allowed bg-hover",

        className,
      )}
    />
  );
}

/* ───────────────── Select Button ───────────────── */

type SelectButtonProps = {
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  disabled?: boolean;
  error?: boolean;
};

export function SelectButton({
  value,
  placeholder,
  onClick,
  disabled,
  error,
}: SelectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "h-9 w-full rounded-md border px-3 text-sm text-left",
        "flex items-center gap-2",
        "transition-colors duration-150",

        /* base */
        "bg-card text-text",

        /* border */
        error ? "border-danger" : "border-border",

        /* hover */
        !disabled && "hover:bg-hover cursor-pointer",

        /* focus */
        error ? "focus:border-danger" : "focus:border-primary",

        "outline-none",

        /* disabled */
        disabled && "opacity-60 cursor-not-allowed bg-hover"
      )}
    >
      <span className={clsx("truncate", !value && "text-muted")}>
        {value || placeholder}
      </span>

      <span className="ml-auto text-muted text-xs">▼</span>
    </button>
  );
}