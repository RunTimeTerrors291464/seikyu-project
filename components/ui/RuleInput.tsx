"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// Type for each dropdown option
type RuleOption = {
  label: string;      // Option text
  icon?: ReactNode;   // Optional icon component
};

// Props for RuleInput component
type RuleInputProps = {
  options: RuleOption[];           // Dropdown options
  value?: string;                  // Initial input value
  rule?: string;                   // Initial selected rule
  onChange?: (data: { rule: string; value: string }) => void; // Callback when rule or value changes
  placeholder?: string;            // Input placeholder
};

export default function RuleInput({
  options,
  value = "",
  rule,
  onChange,
  placeholder = "Enter value…",
}: RuleInputProps) {
  // State - use empty string initially to avoid hydration mismatch
  const [open, setOpen] = useState(false);         // Dropdown open/close
  const [selectedRule, setSelectedRule] = useState(""); // Currently selected rule
  const [inputValue, setInputValue] = useState(value);    // Input text value
  const [mounted, setMounted] = useState(false);  // Track if component has mounted

  // Initialize selectedRule after mount to avoid hydration mismatch
  useEffect(() => {
    setSelectedRule(rule || options[0]?.label || "");
    setMounted(true);
  }, [rule, options]);

  const containerRef = useRef<HTMLDivElement>(null);      // Ref to detect clicks outside

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ----- Handle selecting a rule from dropdown -----
  const handleSelect = (option: RuleOption) => {
    setSelectedRule(option.label);      // Update selected rule
    setOpen(false);                     // Close dropdown
    onChange?.({ rule: option.label, value: inputValue }); // Notify parent
  };

  // ----- Handle input value changes -----
  const handleInput = (val: string) => {
    setInputValue(val);                 // Update input value
    onChange?.({ rule: selectedRule, value: val }); // Notify parent
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-stretch"
    >
        <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900">
            {/* ----- Left: Dropdown button ----- */}
            <button
                type="button"
                onClick={() => setOpen(!open)} // Toggle dropdown
                className="inline-flex items-center gap-2 px-2.5 py-1.5 text-left text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
                {/* Show icon of selected rule if available */}
                {mounted && options.find(o => o.label === selectedRule)?.icon}
                <span>{mounted ? selectedRule : "\u00A0"}</span>
                <ChevronDown className="h-3 w-3 text-neutral-500" />
            </button>
            
            <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />

            {/* ----- Dropdown list ----- */}
            {open && (
                <ul className="absolute mt-10 z-20 w-44 rounded-md border bg-white shadow-md dark:bg-neutral-900 dark:border-neutral-700">
                {options.map((option) => (
                    <li
                    key={option.label}
                    onClick={() => handleSelect(option)} // Select rule on click
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                    {/* Icon on the left if exists */}
                    {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                    {option.label}
                    </li>
                ))}
                </ul>
            )}

            {/* ----- Right: Input field ----- */}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInput(e.target.value)} // Update input value
                placeholder={placeholder}
                className="flex-1 px-3 py-2 text-xs outline-none text-neutral-700 dark:text-neutral-200 dark:bg-neutral-900"
            />
        </div>
    </div>
  );
}
