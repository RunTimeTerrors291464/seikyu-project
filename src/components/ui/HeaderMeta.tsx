"use client";

import clsx from "clsx";
import { Clock } from "lucide-react";
import React from "react";
import { useUiLang } from "@/lib/lang/DictProvider";
import type { Lang } from "@/lib/lang/i18n";
import { ACCENT_STYLES, formatDate, type Accent } from "../types/ui";

const DATE_LOCALE_BY_LANG: Record<Lang, string> = {
  en: "en-US",
  vi: "vi-VN",
  hu: "hu-HU",
};

type HeaderMetaProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  accent?: Accent;
  format?: "date" | "text";
};

export function HeaderMeta({
  label,
  value,
  icon = <Clock className="h-3.5 w-3.5" />,
  onClick,
  accent = "neutral",
  format = "date",
}: HeaderMetaProps) {
  const lang = useUiLang();
  const isClickable = !!onClick;
  const displayValue =
    format === "date"
      ? formatDate(value, DATE_LOCALE_BY_LANG[lang])
      : value;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
        ACCENT_STYLES[accent],
        "transition-colors duration-150",

        /* hover */
        "hover:bg-hover",

        /* active (if clickable) */
        isClickable && "cursor-pointer active:bg-active"
      )}
    >
      {/* ICON */}
      <span className="flex items-center flex-shrink-0">
        {icon}
      </span>

      {/* TEXT */}
      <span className="whitespace-nowrap">
        <span className="font-medium">{label}:</span>{" "}
        <span className="font-medium">{displayValue}</span>
      </span>
    </div>
  );
}
