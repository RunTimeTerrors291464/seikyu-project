"use client";

import { FIELD_KEYS } from "@/components/types/ui";
import { Dictionary } from "@/lib/lang/i18n";
import {
  ArrowLeftRight,
  DollarSign,
  Edit2,
  Minus,
  Plus,
  Tag,
  ToggleRight,
  Warehouse,
} from "lucide-react";
import {
  JsonValue,
  ProductHistoryEvent,
  ProductHistoryNameItem,
} from "../types/product";

/* ============================= */
/* TYPES */
/* ============================= */

export type HistoryIcon =
  | "create"
  | "stock"
  | "price"
  | "name"
  | "status"
  | "edit";

export type NameDiffResult = {
  type: "reorder" | "add" | "remove" | "replace" | "mixed";
  added: string[];
  removed: string[];
  prevDefault?: string;
  nextDefault?: string;
  defaultChanged: boolean;
  replaced?: {
    from: string;
    to: string;
  };
};

/* ============================= */
/* FORMAT VALUE */
/* ============================= */

export function formatValue(
  value: JsonValue | ProductHistoryNameItem | undefined
): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map((v) => formatValue(v)).join(", ");
  }

  if (typeof value === "object") {
    if ("name" in value && typeof value.name === "string") return value.name;
    if ("unitName" in value && typeof value.unitName === "string") return value.unitName;
    if ("label" in value && typeof value.label === "string") return value.label;

    return JSON.stringify(value);
  }

  return String(value);
}

/* ============================= */
/* NAME DIFF */
/* ============================= */

function isProductHistoryNameItem(
  value: unknown
): value is ProductHistoryNameItem {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNameItemArray(
  value: ProductHistoryEvent["previousValue"] | ProductHistoryEvent["newValue"]
): ProductHistoryNameItem[] {
  if (!Array.isArray(value)) return [];

  return (value as unknown[]).filter(isProductHistoryNameItem);
}

export function getNameDiff(historyEvent: ProductHistoryEvent): NameDiffResult {
  const prev = toNameItemArray(historyEvent.previousValue);
  const next = toNameItemArray(historyEvent.newValue);

  const prevNames: string[] = prev.map((item) => item.name ?? "");
  const nextNames: string[] = next.map((item) => item.name ?? "");

  const prevSet = new Set(prevNames);
  const nextSet = new Set(nextNames);

  const added = nextNames.filter((n) => !prevSet.has(n));
  const removed = prevNames.filter((n) => !nextSet.has(n));

  const prevDefault = prevNames[0];
  const nextDefault = nextNames[0];

  const defaultChanged = prevDefault !== nextDefault;

  // REORDER ONLY
  if (added.length === 0 && removed.length === 0 && defaultChanged) {
    return {
      type: "reorder",
      added: [],
      removed: [],
      prevDefault,
      nextDefault,
      defaultChanged,
    };
  }

  // PURE ADD
  if (added.length > 0 && removed.length === 0) {
    return {
      type: "add",
      added,
      removed: [],
      prevDefault,
      nextDefault,
      defaultChanged,
    };
  }

  // PURE REMOVE
  if (removed.length > 0 && added.length === 0) {
    return {
      type: "remove",
      added: [],
      removed,
      prevDefault,
      nextDefault,
      defaultChanged,
    };
  }

  // SIMPLE REPLACE (1 ↔ 1)
  if (added.length === 1 && removed.length === 1) {
    return {
      type: "replace",
      added,
      removed,
      prevDefault,
      nextDefault,
      defaultChanged,
      replaced: {
        from: removed[0],
        to: added[0],
      },
    };
  }

  // COMPLEX / FULL CHANGE
  return {
    type: "mixed",
    added,
    removed,
    prevDefault,
    nextDefault,
    defaultChanged,
  };
}

/* ============================= */
/* DIFF ICON */
/* ============================= */

export function getDiffIcon(
  oldValue: JsonValue | ProductHistoryNameItem | undefined,
  newValue: JsonValue | ProductHistoryNameItem | undefined
) {
  const base = "mt-0.5 h-3 w-3 shrink-0";

  const hasOld = oldValue !== undefined && oldValue !== null;
  const hasNew = newValue !== undefined && newValue !== null;

  if (hasOld && hasNew) {
    return <ArrowLeftRight className={`${base} text-warning`} />;
  }

  if (hasNew) {
    return <Plus className={`${base} text-success`} />;
  }

  return <Minus className={`${base} text-danger`} />;
}

/* ============================= */
/* META */
/* ============================= */

export function getChangeMeta(type: HistoryIcon) {
  switch (type) {
    case "create":
      return {
        icon: <Plus className="h-3 w-3 text-success" />,
        ring: "ring-success",
      };

    case "stock":
      return {
        icon: <Warehouse className="h-3 w-3 text-primary" />,
        ring: "ring-primary",
      };

    case "price":
      return {
        icon: <DollarSign className="h-3 w-3 text-warning" />,
        ring: "ring-warning",
      };

    case "name":
      return {
        icon: <Tag className="h-3 w-3 text-info" />,
        ring: "ring-primary",
      };

    case "status":
      return {
        icon: <ToggleRight className="h-3 w-3 text-accent" />,
        ring: "ring-gold",
      };

    default:
      return {
        icon: <Edit2 className="h-3 w-3 text-muted" />,
        ring: "ring-border",
      };
  }
}

/* ============================= */
/* FIELD LABEL */
/* ============================= */

export function getFieldLabel(
  field: string,
  dict: Dictionary
): string {
  const key = FIELD_KEYS[field];

  if (!key) {
    console.warn("[History] ⚠️ Missing FIELD_KEYS mapping for:", field);
    return field;
  }

  const label = dict[key];

  if (!label) {
    console.warn(
      "[History] ⚠️ Missing dictionary key:",
      key,
      "for field:",
      field
    );
    return field;
  }

  return label;
}