"use client";

import { CircleCheck, CircleOff } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  active: boolean;
  onClick: () => void;

  activeLabel?: ReactNode;
  inactiveLabel?: ReactNode;
};

export function StatusToggle({
  active,
  onClick,
  activeLabel,
  inactiveLabel,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium
        cursor-pointer select-none transition-all duration-150
        active:translate-y-px

        ${active
          ? "border-success bg-success-soft text-success opacity-100 hover:opacity-90"
          : "border-border bg-card text-muted opacity-70 hover:opacity-100 hover:bg-hover hover:text-text"
        }
      `}
    >

      {/* Toggle */}
      <span
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors
          ${active ? "bg-success" : "bg-border"}`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform
            ${active ? "translate-x-3.5" : "translate-x-0.5"}`}
        />
      </span>

      {/* Label */}
      {active ? (
        <span className="flex items-center gap-1">
          <CircleCheck className="h-3.5 w-3.5" />
          {activeLabel}
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <CircleOff className="h-3.5 w-3.5" />
          {inactiveLabel}
        </span>
      )}
    </button>
  );
}