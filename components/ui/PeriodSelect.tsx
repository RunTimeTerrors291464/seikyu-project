import { ChevronDown } from "lucide-react";

type PeriodSelectProps = {
  value: string; // e.g., "Monthly"
  ariaLabel?: string;
};

export function PeriodSelect({ value, ariaLabel }: PeriodSelectProps) {
  return (
    <button
      className="inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1.5 text-xs shadow-sm dark:bg-neutral-900"
      aria-label={ariaLabel ?? "Change view granularity"}
      type="button"
    >
      <span className="text-neutral-600 dark:text-neutral-300">{value}</span>
      <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
    </button>
  );
}
