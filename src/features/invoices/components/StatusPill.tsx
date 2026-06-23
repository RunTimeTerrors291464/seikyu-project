"use client";

import { ACCENT_STYLES, type Accent } from "@/components/types/ui";

type StatusPillProps = {
  label: string;
  accent: Accent;
};

/**
 * Generic status pill used by all invoice and entity status columns.
 *
 * @param label - Human-readable status text (already resolved from the dictionary).
 * @param accent - Visual accent from the shared Accent palette.
 */
export default function StatusPill({ label, accent }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACCENT_STYLES[accent]}`}
    >
      {label}
    </span>
  );
}
