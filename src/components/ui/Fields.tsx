"use client";

import { ProductStockStatus } from "@/features/products/types/product";
import clsx from "clsx";
import React from "react";
import StatusPill from "../../features/products/components/StockStatusPill";
import { Accent, ACCENT_STYLES } from "../types/ui";

/* ───────────────── LABELED Field Wrapper ───────────────── */

export type FieldLabelProps = {
  label: string;
  icon?: React.ReactNode;
  /** When true, shows a red asterisk beside the label. */
  required?: boolean;
  hint?: string;
  error?: string;
  warning?: string;
  /**
   * When true, the field is a flex column that grows with its parent (`flex-1 min-h-0`),
   * and the control slot expands so inputs like `Textarea` can fill remaining height.
   */
  fillHeight?: boolean;
  /**
   * When true, error, warning, or hint render to the right of the label instead of below the input.
   */
  messageBesideLabel?: boolean;
};

type FieldProps = FieldLabelProps & {
  children: React.ReactNode;
};

type FieldValidationState = {
  hasError: boolean;
  hasWarning: boolean;
};

function resolveFieldValidationState(
  error: string | undefined,
  warning: string | undefined,
): FieldValidationState {
  const hasError = !!error;
  return {
    hasError,
    hasWarning: !hasError && !!warning,
  };
}

function renderFieldMessage(
  hasError: boolean,
  error: string | undefined,
  hasWarning: boolean,
  warning: string | undefined,
  hint: string | undefined,
): React.ReactNode {
  if (hasError) {
    return <p className="shrink-0 text-xs text-danger">{error}</p>;
  }

  if (hasWarning) {
    return <p className="shrink-0 text-xs text-warning">{warning}</p>;
  }

  if (hint) {
    return <p className="shrink-0 text-xs text-muted">{hint}</p>;
  }

  return null;
}

type FieldChromeProps = FieldLabelProps & {
  control: React.ReactNode;
};

function renderFieldLabelRow(
  label: string,
  icon: React.ReactNode | undefined,
  required: boolean | undefined,
): React.ReactNode {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
      {icon && <span className="flex items-center text-muted">{icon}</span>}
      <span>{label}</span>
      {required ? (
        <span className="font-semibold text-danger" aria-hidden="true">
          *
        </span>
      ) : null}
    </div>
  );
}

function FieldChrome({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  fillHeight = false,
  messageBesideLabel = false,
  control,
}: FieldChromeProps) {
  const { hasError, hasWarning } = resolveFieldValidationState(error, warning);
  const message = renderFieldMessage(hasError, error, hasWarning, warning, hint);

  const labelContent = renderFieldLabelRow(label, icon, required);

  return (
    <div
      className={clsx(
        "space-y-1",
        fillHeight && "flex min-h-0 flex-1 flex-col",
      )}
    >
      {messageBesideLabel ? (
        <div className="flex shrink-0 items-center justify-between gap-2">
          {labelContent}
          {message}
        </div>
      ) : (
        labelContent
      )}

      <div className={clsx(fillHeight && "flex min-h-0 flex-1 flex-col")}>
        {control}
      </div>

      {!messageBesideLabel ? message : null}
    </div>
  );
}

function cloneControlWithValidation(
  control: React.ReactNode,
  validation: FieldValidationState,
  isRequired: boolean,
): React.ReactNode {
  if (
    !React.isValidElement(control) ||
    typeof control.type === "string" ||
    control.type === React.Fragment
  ) {
    return control;
  }

  return React.cloneElement(
    control as React.ReactElement<{
      error?: boolean;
      warning?: boolean;
      "aria-required"?: boolean;
    }>,
    {
      error: validation.hasError || undefined,
      warning: validation.hasWarning || undefined,
      "aria-required": isRequired || undefined,
    },
  );
}

function wrapControlWithFieldChrome(
  fieldProps: FieldLabelProps,
  control: React.ReactElement,
): React.ReactElement {
  const validation = resolveFieldValidationState(
    fieldProps.error,
    fieldProps.warning,
  );
  const isRequired = fieldProps.required === true;

  return (
    <FieldChrome
      {...fieldProps}
      control={cloneControlWithValidation(control, validation, isRequired)}
    />
  );
}

export function Field({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  children,
  fillHeight = false,
  messageBesideLabel = false,
}: FieldProps) {
  const validation = resolveFieldValidationState(error, warning);
  const isRequired = required === true;

  return (
    <FieldChrome
      label={label}
      icon={icon}
      required={required}
      hint={hint}
      error={error}
      warning={warning}
      fillHeight={fillHeight}
      messageBesideLabel={messageBesideLabel}
      control={cloneControlWithValidation(children, validation, isRequired)}
    />
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
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  className?: string;
  /** When set, tags the input for `focusInvoiceLineQuantityInput` after adding a line. */
  invoiceLineQuantityRowId?: string;
  inputRef?: React.Ref<HTMLInputElement>;
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
  onKeyDown,
  onPaste,
  inputMode,
  maxLength,
  className,
  invoiceLineQuantityRowId,
  inputRef,
}: InputProps) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      {...(invoiceLineQuantityRowId
        ? { "data-invoice-line-quantity": invoiceLineQuantityRowId }
        : {})}
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

export type InputFieldProps = FieldLabelProps &
  Omit<InputProps, "error" | "warning">;

export function InputField({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  fillHeight,
  messageBesideLabel,
  ...inputProps
}: InputFieldProps) {
  return wrapControlWithFieldChrome(
    {
      label,
      icon,
      required,
      hint,
      error,
      warning,
      fillHeight,
      messageBesideLabel,
    },
    <Input {...inputProps} />,
  );
}

/* ───────────────── Readonly ───────────────── */

type ReadonlyProps = {
  value: string | number;
  error?: boolean;
  warning?: boolean;
};

export function Readonly({
  value,
  error = false,
  warning = false,
}: ReadonlyProps) {
  return (
    <div
      className={clsx(
        "flex h-9 items-center rounded-md px-3 text-sm",
        "border bg-hover text-muted transition-colors duration-150",
        error
          ? "border-danger"
          : warning
            ? "border-warning"
            : "border-border",
      )}
    >
      {value}
    </div>
  );
}

export type ReadonlyFieldProps = FieldLabelProps & ReadonlyProps;

export function ReadonlyField({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  fillHeight,
  messageBesideLabel,
  value,
}: ReadonlyFieldProps) {
  return wrapControlWithFieldChrome(
    {
      label,
      icon,
      required,
      hint,
      error,
      warning,
      fillHeight,
      messageBesideLabel,
    },
    <Readonly value={value} />,
  );
}

/* ───────────────── Stat Display ───────────────── */

type StatDisplayControlProps = {
  value: string | number;
  status: ProductStockStatus;
  accent?: Accent;
  error?: boolean;
  warning?: boolean;
};

export function StatDisplay({
  value,
  status,
  accent = "neutral" as Accent,
  error = false,
  warning = false,
}: StatDisplayControlProps) {
  return (
    <div
      className={clsx(
        "flex h-9 items-center justify-between rounded-md px-3 text-sm",
        "bg-card border transition-colors duration-150",
        "hover:bg-hover",
        error
          ? "border-danger text-danger"
          : warning
            ? "border-warning text-warning"
            : ACCENT_STYLES[accent],
      )}
    >
      <span className="font-medium">{value}</span>

      <StatusPill status={Number(status) as ProductStockStatus} />
    </div>
  );
}

export type StatDisplayFieldProps = FieldLabelProps & StatDisplayControlProps;

export function StatDisplayField({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  fillHeight,
  messageBesideLabel,
  value,
  status,
  accent,
}: StatDisplayFieldProps) {
  return wrapControlWithFieldChrome(
    {
      label,
      icon,
      required,
      hint,
      error,
      warning,
      fillHeight,
      messageBesideLabel,
    },
    <StatDisplay value={value} status={status} accent={accent} />,
  );
}

/* ───────────────── Text Area ───────────────── */

const MIN_TEXTAREA_ROWS = 3;

type TextareaProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onBlur?: () => void;
  warning?: boolean;
  /** Visual height in rows; values below 3 are clamped to 3. */
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
  rows = MIN_TEXTAREA_ROWS,
  className,
}: TextareaProps) {
  const resolvedRows = Math.max(MIN_TEXTAREA_ROWS, rows);

  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      rows={resolvedRows}
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

export type TextareaFieldProps = FieldLabelProps &
  Omit<TextareaProps, "error" | "warning">;

export function TextareaField({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  fillHeight,
  messageBesideLabel,
  ...textareaProps
}: TextareaFieldProps) {
  return wrapControlWithFieldChrome(
    {
      label,
      icon,
      required,
      hint,
      error,
      warning,
      fillHeight,
      messageBesideLabel,
    },
    <Textarea {...textareaProps} />,
  );
}

/* ───────────────── Select Button ───────────────── */

type SelectButtonProps = {
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  disabled?: boolean;
  error?: boolean;
  warning?: boolean;
};

export function SelectButton({
  value,
  placeholder,
  onClick,
  disabled,
  error = false,
  warning = false,
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
        error
          ? "border-danger"
          : warning
            ? "border-warning"
            : "border-border",

        /* hover */
        !disabled && "hover:bg-hover cursor-pointer",

        /* focus */
        error
          ? "focus:border-danger"
          : warning
            ? "focus:border-warning"
            : "focus:border-primary",

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

export type SelectButtonFieldProps = FieldLabelProps &
  Omit<SelectButtonProps, "error" | "warning">;

export function SelectButtonField({
  label,
  icon,
  required,
  hint,
  error,
  warning,
  fillHeight,
  messageBesideLabel,
  ...selectButtonProps
}: SelectButtonFieldProps) {
  return wrapControlWithFieldChrome(
    {
      label,
      icon,
      required,
      hint,
      error,
      warning,
      fillHeight,
      messageBesideLabel,
    },
    <SelectButton {...selectButtonProps} />,
  );
}