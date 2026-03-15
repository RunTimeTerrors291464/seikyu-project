"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

type RuleOption = {
  label: string;
  icon?: ReactNode;
};

type RuleInputProps = {
  options: RuleOption[];
  value?: string;
  rule?: string;
  onChange?: (data: { rule: string; value: string }) => void;
  placeholder?: string;
};

export default function RuleInput({
  options,
  value = "",
  rule,
  onChange,
  placeholder = "Enter value…",
}: RuleInputProps) {
  const [open, setOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string>(
    rule || options[0]?.label || ""
  );
  const [inputValue, setInputValue] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);

  /* ───────────────── Close on outside click ───────────────── */

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ───────────────── Handlers ───────────────── */

  const handleSelect = (option: RuleOption) => {
    setSelectedRule(option.label);
    setOpen(false);

    onChange?.({
      rule: option.label,
      value: inputValue,
    });
  };

  const handleInput = (val: string) => {
    setInputValue(val);

    onChange?.({
      rule: selectedRule,
      value: val,
    });
  };

  const currentIcon = options.find(
    (o) => o.label === selectedRule
  )?.icon;

  /* ───────────────── UI ───────────────── */

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-stretch"
    >
      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-card text-xs shadow-sm">

        {/* Rule Dropdown Button */}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-left text-muted hover:bg-border"
        >
          {currentIcon}

          <span>{selectedRule}</span>

          <ChevronDown className="h-3 w-3 text-muted" />
        </button>

        {/* Divider */}

        <span className="w-px self-stretch bg-border" />

        {/* Dropdown */}

        {open && (
          <ul className="absolute left-0 top-full z-20 mt-1 w-44 rounded-md border border-border bg-card shadow-md">
            {options.map((option) => (
              <li
                key={option.label}
                onClick={() => handleSelect(option)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-text hover:bg-border"
              >
                {option.icon && (
                  <span className="h-4 w-4">
                    {option.icon}
                  </span>
                )}

                {option.label}
              </li>
            ))}
          </ul>
        )}

        {/* Input */}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-card px-3 py-2 text-xs text-text outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );
}