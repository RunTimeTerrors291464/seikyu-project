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
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm bg-primary-soft
        transition-all duration-150 cursor-pointer
        active:translate-y-[1px]

        ${active
          ? "bg-primary-soft text-primary border-primary hover:bg-primary-hover"
          : "bg-card text-muted border-border hover:bg-hover hover:text-text active:bg-active"
        }
      `}
    >

      {/* Toggle */}
      <span
        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors
          ${active ? "bg-primary" : "bg-border"}`}
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