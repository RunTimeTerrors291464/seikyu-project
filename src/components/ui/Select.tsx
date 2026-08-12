"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption<V extends string = string> = {
  value: V;
  label: string;
};

type SelectProps<V extends string = string> = {
  value: V;
  onChange: (value: V) => void;
  options: readonly SelectOption<V>[];
  id?: string;
  name?: string;
  /** Passed to the trigger `aria-label` when no visible label is tied via `id`. */
  ariaLabel?: string;
  /** Optional leading decoration (e.g. language icon); border wraps icon + trigger. */
  icon?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  warning?: boolean;
  size?: "default" | "sm";
  /** Replaces the default shell colors (e.g. filter accent styling). */
  triggerClassName?: string;
  getOptionClassName?: (optionValue: V, isSelected: boolean) => string;
  className?: string;
};

const SELECT_SURFACE = clsx(
  "rounded-md border bg-card text-text",
  "outline-none transition-colors duration-150",
);

/**
 * Border and hover shell for the closed control (focus is on the inner trigger).
 *
 * @param error - Use danger border when true.
 * @param warning - Use warning border when true.
 * @returns Tailwind border and `focus-within:` classes.
 */
function controlShellClasses(error: boolean, warning: boolean): string {
  if (error) {
    return "border-danger focus-within:border-danger";
  }
  if (warning) {
    return "border-warning focus-within:border-warning";
  }
  return "border-border focus-within:border-primary";
}

/**
 * Custom listbox select: options use app styles (native `<option>` cannot be styled in most browsers).
 *
 * @param props.value - Selected option value.
 * @param props.onChange - Called when the user picks an option.
 * @param props.options - Rows shown in the dropdown panel.
 * @param props.id - Optional id on the trigger for `<label htmlFor>`.
 * @param props.name - When set, a hidden input is rendered for form posts.
 * @param props.ariaLabel - Accessible name for the trigger when there is no label.
 * @param props.icon - Optional leading decoration inside the control.
 * @param props.disabled - Disables open + selection.
 * @param props.error - Danger border styling.
 * @param props.warning - Warning border styling.
 * @param props.className - Classes on the outer control shell.
 * @returns The control and absolutely positioned option list when open.
 */
export default function Select<V extends string = string>({
  value,
  onChange,
  options,
  id,
  name,
  ariaLabel,
  icon,
  disabled = false,
  error = false,
  warning = false,
  size = "default",
  triggerClassName,
  getOptionClassName,
  className,
}: SelectProps<V>) {
  const isCompact = size === "sm";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedLabel =
    options.find(function findSelected(option) {
      return option.value === value;
    })?.label ?? String(value);

  useEffect(
    function subscribePointerDownOutside(): () => void {
      function handlePointerDown(event: MouseEvent): void {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }

      document.addEventListener("mousedown", handlePointerDown);
      return function cleanupPointerDown(): void {
        document.removeEventListener("mousedown", handlePointerDown);
      };
    },
    [],
  );

  useEffect(
    function subscribeEscapeWhenOpen(): (() => void) | void {
      if (!open) {
        return;
      }

      function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === "Escape") {
          setOpen(false);
        }
      }

      document.addEventListener("keydown", handleKeyDown);
      return function cleanupKeyDown(): void {
        document.removeEventListener("keydown", handleKeyDown);
      };
    },
    [open],
  );

  function handleToggle(): void {
    if (disabled) {
      return;
    }
    setOpen(function toggle(isOpen) {
      return !isOpen;
    });
  }

  function handleSelectOption(nextValue: V): void {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={clsx(
        "relative flex min-w-0 items-center gap-1 outline-none transition-colors duration-150",
        isCompact ? "rounded-full" : "rounded-md",
        triggerClassName ??
          clsx(SELECT_SURFACE, controlShellClasses(error, warning)),
        !triggerClassName && !disabled && "hover:bg-hover",
        disabled && "cursor-not-allowed opacity-60",
        disabled && !triggerClassName && "bg-hover",
        className,
      )}
    >
      {icon ? (
        <span
          className="flex shrink-0 items-center pl-2 text-muted [&_svg]:pointer-events-none"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}

      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={handleToggle}
        className={clsx(
          "flex min-w-0 flex-1 items-center justify-between gap-1 text-left text-xs outline-none",
          icon
            ? isCompact
              ? "py-0.5 pl-1 pr-1.5"
              : "py-1.5 pl-1 pr-2"
            : isCompact
              ? "px-2 py-0.5"
              : "px-2.5 py-1.5",
          disabled && "cursor-not-allowed",
        )}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown
          aria-hidden
          strokeWidth={2.25}
          className={clsx(
            "shrink-0 opacity-70 transition-transform duration-150",
            isCompact ? "h-3 w-3" : "h-3.5 w-3.5",
            open && "rotate-180",
          )}
        />
      </button>

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      {open && !disabled ? (
        <ul
          id={listboxId}
          role="listbox"
          className={clsx(
            "absolute left-0 right-0 top-full z-50 mt-1 max-h-60 min-w-full overflow-auto border border-border bg-card p-1 shadow-md",
            isCompact ? "rounded-lg" : "rounded-md py-1",
          )}
        >
          {options.map(function renderOptionRow(option) {
            const isSelected = option.value === value;
            const optionClassName = getOptionClassName?.(option.value, isSelected);
            return (
              <li key={option.value} role="presentation" className="list-none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={function handleOptionClick(): void {
                    handleSelectOption(option.value);
                  }}
                  className={clsx(
                    "w-full text-left text-xs outline-none transition-opacity",
                    optionClassName ??
                      clsx(
                        "px-3 py-2 text-text transition-colors",
                        "hover:bg-hover active:bg-active",
                        isSelected && "bg-primary/10 font-medium text-text",
                      ),
                    optionClassName &&
                      clsx(
                        "rounded-full border px-2.5 py-0.5",
                        isCompact ? "my-0.5" : "my-1",
                        "hover:opacity-100",
                      ),
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
