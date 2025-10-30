import { Calendar } from "lucide-react";

type DateRangeButtonProps = {
  label: string; // e.g., "Nov 15 - Dec 15"
  ariaLabel?: string;
};

export function DateRangeButton({ label, ariaLabel }: DateRangeButtonProps) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5 text-xs shadow-sm dark:bg-neutral-900"
      aria-label={ariaLabel ?? "Select date range"}
      type="button"
    >
      <Calendar className="h-3.5 w-3.5 text-neutral-500" />
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
    </button>
  );
}
