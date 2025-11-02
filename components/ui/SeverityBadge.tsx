"use client";
import clsx from "clsx";

export type Severity = "INFO" | "WARNING" | "ERROR" | "DEBUG";

export default function SeverityBadge({ level }: { level: Severity }) {
  const tone =
    level === "ERROR"
      ? { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" }
      : level === "WARNING"
      ? { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" }
      : level === "DEBUG"
      ? { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-700 dark:text-neutral-300" }
      : { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400" }; // INFO

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone.bg,
        tone.text
      )}
    >
      {level}
    </span>
  );
}
