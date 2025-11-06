"use client";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";

export type PeriodSelectProps = {
  value: string; // e.g., "Monthly"
  options?: string[];
  onChange?: (v: string) => void;
  ariaLabel?: string;
};

export function PeriodSelect({ value, options = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"], onChange, ariaLabel }: PeriodSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        className="inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1.5 text-xs shadow-sm dark:bg-neutral-900"
        aria-label={ariaLabel ?? "Change view granularity"}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="text-neutral-600 dark:text-neutral-300">{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border bg-white py-1 shadow-lg dark:bg-neutral-900">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange?.(opt);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                value === opt ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
