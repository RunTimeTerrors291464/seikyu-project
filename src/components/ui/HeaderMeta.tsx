"use client";

import clsx from "clsx";
import { Clock } from "lucide-react";
import React from "react";
import { formatDate } from "../types/ui";

type HeaderMetaProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export function HeaderMeta({
  label,
  value,
  icon = <Clock className="h-3.5 w-3.5" />,
  onClick,
}: HeaderMetaProps) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
        "border border-border bg-card text-muted",
        "transition-colors duration-150",

        /* hover */
        "hover:bg-hover",

        /* active (if clickable) */
        isClickable && "cursor-pointer active:bg-active"
      )}
    >
      {/* ICON */}
      <span className="flex items-center text-muted flex-shrink-0">
        {icon}
      </span>

      {/* TEXT */}
      <span className="whitespace-nowrap">
        <span className="text-muted">{label}:</span>{" "}
        <span className="text-text font-medium">
          {formatDate(value)}
        </span>
      </span>
    </div>
  );
}