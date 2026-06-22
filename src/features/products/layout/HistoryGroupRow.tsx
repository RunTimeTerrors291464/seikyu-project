"use client";

import { formatDate } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import {
  formatHistoryFieldValue,
  getChangeMeta,
  getDiffIcon,
  getFieldLabel,
  getNameDiff,
} from "@features/products/components/HistoryRow";
import {
  ChevronRight,
  CircleOff,
  Crown,
  Edit2,
  Loader2,
  Minus,
  Plus,
  PowerCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  JsonValue,
  ProductHistoryDetail,
  ProductHistoryEvent,
  ProductHistoryItem,
} from "../types/product";

type Props = {
  group: ProductHistoryItem;
  isLast?: boolean;

  detailMap: Record<number, ProductHistoryDetail>;
  loadingMap: Record<number, boolean>;
  fetchDetail: (version: number) => void;
};

/**
 * Returns whether the history row only records an `isActive` change.
 *
 * @param eventSummary - Field names included in the history entry.
 */
function isActiveOnlySummary(eventSummary: string[]): boolean {
  return eventSummary.length === 1 && eventSummary[0] === "isActive";
}

/**
 * Reads the new active flag from history detail, if present.
 *
 * @param detail - Loaded history detail for this version.
 * @returns `true` if activated, `false` if deactivated, or `null` if unknown.
 */
function getBecameActiveFromDetail(
  detail: ProductHistoryDetail | undefined
): boolean | null {
  const event = detail?.events.find((e) => e.fieldName === "isActive");
  if (!event) {
    return null;
  }

  const value: JsonValue | undefined = event.newValue as JsonValue | undefined;
  if (value === true) {
    return true;
  }
  if (value === false) {
    return false;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }

  return null;
}

/**
 * Timeline dot styles for activation vs deactivation-only rows.
 *
 * @param activated - Whether the product became active.
 */
function getActiveToggleMeta(activated: boolean): {
  icon: ReactNode;
  ring: string;
} {
  if (activated) {
    return {
      icon: <PowerCircle className="h-3 w-3 text-success" />,
      ring: "ring-success",
    };
  }

  return {
    icon: <CircleOff className="h-3 w-3 text-danger" />,
    ring: "ring-danger",
  };
}

export default function HistoryGroupRow({
  group,
  isLast,
  detailMap,
  loadingMap,
  fetchDetail
}: Props) {
  const [open, setOpen] = useState(false);

  const detail = detailMap[group.version];
  const loading = loadingMap[group.version];

  const dict = useDict();

  const isActiveOnly = isActiveOnlySummary(group.eventSummary);
  const becameActive = getBecameActiveFromDetail(detail);

  useEffect(
    function prefetchActiveDetail(): void {
      if (!isActiveOnly) {
        return;
      }
      if (detailMap[group.version] || loadingMap[group.version]) {
        return;
      }
      fetchDetail(group.version);
    },
    [
      isActiveOnly,
      group.version,
      detailMap,
      loadingMap,
      fetchDetail,
    ]
  );

  function resolveTimelineMeta(): { icon: ReactNode; ring: string } {
    if (!isActiveOnly) {
      return getChangeMeta("edit");
    }
    if (becameActive !== null) {
      return getActiveToggleMeta(becameActive);
    }
    if (loading) {
      return {
        icon: (
          <Loader2 className="h-3 w-3 animate-spin text-muted" />
        ),
        ring: "ring-border",
      };
    }
    return {
      icon: <CircleOff className="h-3 w-3 text-muted" />,
      ring: "ring-border",
    };
  }

  const meta = resolveTimelineMeta();

  function handleToggle() {
    const next = !open;
    setOpen(next);

    if (next) {
      fetchDetail(group.version);
    }
  }

  function renderNameDiff(
    historyEvent: ProductHistoryEvent,
    index: number
  ) {
    const diff = getNameDiff(historyEvent);

    return (
      <div key={index} className="space-y-1">
        {/* DEFAULT CHANGE (GLOBAL) */}
        {diff.defaultChanged && diff.nextDefault && (
          <div className="flex items-center gap-2 text-xs">
            <Crown className="h-3 w-3 text-warning" />
            <span className="w-28 shrink-0 text-muted">{dict.newDefault}</span>
            <span className="font-medium text-text">
              {diff.nextDefault}
            </span>
          </div>
        )}

        {/* REPLACE (1-1) */}
        {diff.type === "replace" && diff.replaced && (
          <div className="flex items-center gap-2 text-xs">
            <Edit2 className="h-3 w-3 text-warning" />
            <span className="w-28 shrink-0 font-medium text-muted">
              {dict.edit}
            </span>

            <span className="line-through text-muted">
              {diff.replaced.from}
            </span>

            <span>→</span>

            <span className="text-text font-medium">
              {diff.replaced.to}
            </span>
          </div>
        )}

        {/* ADDED */}
        {diff.added.map((name: string, i: number) => (
          <div
            key={`add-${i}`}
            className="flex items-center gap-2 text-xs"
          >
            <Plus className="h-3 w-3 text-success" />
            <span className="w-28 shrink-0 font-medium text-muted">
              {dict.addNewName}
            </span>
            <span className="text-success font-medium">
              {name}
            </span>
          </div>
        ))}

        {/* REMOVED */}
        {diff.removed.map((name: string, i: number) => (
          <div
            key={`remove-${i}`}
            className="flex items-center gap-2 text-xs"
          >
            <Minus className="h-3 w-3 text-danger" />
            <span className="w-28 shrink-0 font-medium text-muted">
              {dict.removeName}
            </span>
            <span className="line-through text-muted">
              {name}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (isActiveOnly) {
    const titleLine =
      loading && becameActive === null
        ? dict.loading
        : becameActive === null && !loading
          ? dict.noDetailAvailable
          : becameActive
            ? dict.productActivated
            : dict.productDeactivated;

    return (
      <div className="relative flex gap-3 pb-5">
        <div className="relative flex shrink-0 flex-col items-center">
          <div
            className={`relative flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ${meta.ring}`}
          >
            {meta.icon}
          </div>
          {!isLast && (
            <div className="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 bg-border" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text">{titleLine}</p>
          <p className="mt-0.5 text-xs text-muted">
            {group.createdByUsername} · {formatDate(group.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex gap-3 pb-5">
      <div className="relative flex shrink-0 flex-col items-center">
        <div
          className={`relative flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ${meta.ring}`}
        >
          {meta.icon}
        </div>
        {!isLast && (
          <div className="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 bg-border" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* HEADER */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full items-start justify-between text-left"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-text">
              {dict.changes}:{" "}
              {group.eventSummary
                .map((f) => getFieldLabel(f, dict))
                .join(", ")}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {group.createdByUsername} · {formatDate(group.createdAt)}
            </p>
          </div>

          <ChevronRight
            className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""
              }`}
          />
        </button>

        {/* EXPANDED */}
        {open && (
          <div className="mt-2 rounded-md border border-border bg-hover px-3 py-2 text-xs">
            {loading ? (
              <div className="text-muted">{dict.loading}</div>
            ) : !detail ? (
              <div className="text-muted">
                {dict.noDetailAvailable}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {detail.events.map((e, i) => {
                  if (e.fieldName === "productNames") {
                    return renderNameDiff(e, i);
                  }

                  return (
                    <li key={i} className="flex items-start gap-2">
                      {getDiffIcon(
                        formatHistoryFieldValue(e.fieldName, e.previousValue, dict),
                        formatHistoryFieldValue(e.fieldName, e.newValue, dict)
                      )}

                      <span className="w-28 shrink-0 font-medium text-muted">
                        {getFieldLabel(e.fieldName, dict)}
                      </span>

                      {e.previousValue ? (
                        <span className="text-muted">
                          <span className="line-through">
                            {formatHistoryFieldValue(e.fieldName, e.previousValue, dict)}
                          </span>
                          <span className="mx-1">→</span>
                          <span className="font-medium text-text">
                            {formatHistoryFieldValue(e.fieldName, e.newValue, dict)}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium text-success">
                          {formatHistoryFieldValue(e.fieldName, e.newValue, dict)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
