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
  // ✅ Initialize directly — no useEffect, no hydration trick needed
  const [open, setOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string>(
    rule || options[0]?.label || ""
  );
  const [inputValue, setInputValue] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: RuleOption) => {
    // ✅ Update state AND pass the fresh rule directly to onChange
    //    — never read selectedRule from state here, it's the old value
    setSelectedRule(option.label);
    setOpen(false);
    onChange?.({ rule: option.label, value: inputValue });
  };

  const handleInput = (val: string) => {
    setInputValue(val);
    // ✅ selectedRule is already correct here because handleSelect
    //    updated it synchronously before any re-render
    onChange?.({ rule: selectedRule, value: val });
  };

  const currentIcon = options.find((o) => o.label === selectedRule)?.icon;

  return (
    <div ref={containerRef} className="relative inline-flex items-stretch">
      <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900">
        {/* Dropdown trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-left text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {currentIcon}
          <span>{selectedRule}</span>
          <ChevronDown className="h-3 w-3 text-neutral-500" />
        </button>

        <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />

        {/* Dropdown list */}
        {open && (
          <ul className="absolute left-0 top-full z-20 mt-1 w-44 rounded-md border bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-900">
            {options.map((option) => (
              <li
                key={option.label}
                onClick={() => handleSelect(option)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {option.icon && <span className="h-4 w-4">{option.icon}</span>}
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
          className="flex-1 px-3 py-2 text-xs outline-none text-neutral-700 dark:text-neutral-200 dark:bg-neutral-900"
        />
      </div>
    </div>
  );
}