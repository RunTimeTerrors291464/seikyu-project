"use client";

import { ChevronDown, X } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

type RuleOption = {
  label: string;
  icon?: ReactNode;
};

type RuleInputProps = {
  options: RuleOption[];

  value?: string;
  rule?: string;
  debounce?: number;
  onChange?: (data: { rule: string; value: string }) => void;

  placeholder?: string;
  clearable?: boolean;
};

export default function RuleInput({
  options,
  value,
  rule,
  debounce = 500,
  onChange,
  placeholder,
  clearable = true,
}: RuleInputProps) {

  const [open, setOpen] = useState(false);

  const [selectedRule, setSelectedRule] = useState(
    rule || options[0]?.label || ""
  );

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [inputValue, setInputValue] = useState(
    value || ""
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ───────── Sync ───────── */

  useEffect(() => {
    if (rule === undefined) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setSelectedRule(rule);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [rule]);

  useEffect(() => {
    if (value === undefined) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setInputValue(value);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  /* ───────── Outside click ───────── */

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ───────── DEBOUNCED EMIT ───────── */

  function emitChange(val: string, ruleLabel: string) {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange?.({
        rule: ruleLabel,
        value: val,
      });
    }, debounce);
  }

  /* ───────── Handlers ───────── */
  function handleSelect(option: RuleOption) {
    setSelectedRule(option.label);
    setOpen(false);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    onChange?.({
      rule: option.label,
      value: inputValue,
    });


    inputRef.current?.focus();
  }

  function handleInput(val: string) {
    setInputValue(val);

    emitChange(val, selectedRule);
  }

  function handleClear() {
    setInputValue("");

    emitChange("", selectedRule);

    inputRef.current?.focus();
  }

  /* ───────── Derived ───────── */

  const currentIcon =
    options.find(o => o.label === selectedRule)?.icon;

  /* ───────── UI ───────── */

  return (
    <div
      ref={containerRef}
      className="relative flex w-full items-stretch"
      data-universal-search-root=""
    >

      <div className="flex w-full items-stretch overflow-hidden rounded-md border border-border bg-card text-xs shadow-sm">

        {/* Rule selector */}

        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-muted
          transition-colors
          hover:bg-hover hover:text-text
          active:bg-active
          cursor-pointer"
        >
          {currentIcon}
          <span>{selectedRule}</span>
          <ChevronDown className="h-3 w-3 text-muted" />
        </button>

        {/* Divider */}

        <span className="w-px self-stretch bg-border" />

        {/* Input */}

        <div className="relative flex min-w-0 flex-1 items-center">

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={placeholder}
            className="w-full flex-1 bg-card px-3 py-2 text-xs text-text outline-none placeholder:text-muted"
          />

          {/* Clear */}

          {clearable && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-1.5 p-1
              text-muted
              transition-colors
              hover:text-text
              active:opacity-70
              cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}

        </div>

      </div>

      {/* Dropdown */}

      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1 w-44 rounded-md border border-border bg-card shadow-md">

          {options.map(option => (

            <li
              key={option.label}
              onClick={() => handleSelect(option)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted
              transition-colors
              hover:bg-hover
              active:bg-active
              cursor-pointer"
            >
              {option.icon && (
                <span className="h-3 w-3 text-muted">
                  {option.icon}
                </span>
              )}
              {option.label}
            </li>

          ))}

        </ul>
      )}

    </div>
  );
}
