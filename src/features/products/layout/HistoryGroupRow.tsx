"use client";

import { formatDate } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import {
  formatValue,
  getChangeMeta,
  getDiffIcon,
  getFieldLabel,
  getNameDiff,
} from "@features/products/components/HistoryRow";
import {
  ChevronRight,
  Crown,
  Edit2,
  Minus,
  Plus,
} from "lucide-react";
import { useState } from "react";
import {
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

  const meta = getChangeMeta("edit");
  const dict = useDict();

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

  return (
    <div className="relative flex gap-3 pb-5">
      <div className="relative flex gap-3 pb-5">
        {/* DOT */}
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full bg-card ring-2 ${meta.ring}`}
        >
          {meta.icon}
          {/* vertical line */}
          {!isLast && (
            <div className="absolute left-2 top-4 h-full w-px bg-border" />
          )}
        </div>

      </div>

      <div className="flex-1 min-w-0">
        {/* HEADER */}
        <button
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
            <p className="text-xs text-muted mt-0.5">
              {group.createdByUsername} · {formatDate(group.createdAt)}
            </p>
          </div>

          <ChevronRight
            className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""
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
                        formatValue(e.previousValue),
                        formatValue(e.newValue)
                      )}

                      <span className="w-28 shrink-0 font-medium text-muted">
                        {getFieldLabel(e.fieldName, dict)}
                      </span>

                      {e.previousValue ? (
                        <span className="text-muted">
                          <span className="line-through">
                            {formatValue(e.previousValue)}
                          </span>
                          <span className="mx-1">→</span>
                          <span className="text-text font-medium">
                            {formatValue(e.newValue)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-success font-medium">
                          {formatValue(e.newValue)}
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