"use client";

import { ACCENT_STYLES, type Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { DictionaryLabelKey } from "@/lib/lang/i18n";
import clsx from "clsx";
import { LucideIcon } from "lucide-react";

/* ============================= */
/* TYPES */
/* ============================= */

type Props = {
  icon: LucideIcon;
  accent: Accent;

  label?: string;
  dictKey?: DictionaryLabelKey;

  className?: string;
};

/* ============================= */
/* COMPONENT */
/* ============================= */

export default function IconPill({
  icon: Icon,
  accent,
  label,
  dictKey,
  className,
}: Props) {
  const dict = useDict();

  const style = ACCENT_STYLES[accent];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />

      {label ?? (dictKey ? dict[dictKey] : "")}
    </span>
  );
}
