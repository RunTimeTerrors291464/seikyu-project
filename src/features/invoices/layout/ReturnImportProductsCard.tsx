"use client";

import { ACCENT_STYLES, type Accent } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable, { type Column } from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { Hash, Package, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useSkuNameRuleFilter } from "../hooks/useSkuNameRuleFilter";
import { toNumberOrZero } from "../types/importInvoiceDetail";

type ReturnImportProductsCardLine = {
  productSku: string;
  productName: string;
  returnQuantity: string;
  notes: string;
};

type ReturnImportProductsCardProps<T extends ReturnImportProductsCardLine> = {
  lines: T[];
  columns: Column<T>[];
  canEditDraft: boolean;
  getRowId: (row: T) => string | number;
  onClearAll?: () => void;
  onReturnAll?: () => void;
  className?: string;
  /**
   * When this value changes, the card resets its internal search input.
   * Useful when the parent modal opens/closes.
   */
  resetKey?: string | number;
  /** When `danger`, the card uses the danger border/background treatment (e.g. line validation). */
  accent?: Accent;
};

/**
 * Reusable return-products card (search + table + draft actions).
 *
 * @param lines - Current return product lines.
 * @param columns - DataTable column definitions for the line type.
 * @param canEditDraft - When true, shows Clear All and Return All actions.
 * @param getRowId - Returns a stable row id for the DataTable.
 * @param onClearAll - Clears return quantities (draft only).
 * @param onReturnAll - Sets return quantities to maximum (draft only).
 * @param resetKey - Resets internal search state when it changes.
 * @param accent - Optional visual accent; `danger` highlights validation issues on the card frame.
 * @returns JSX element with search + table.
 */
export default function ReturnImportProductsCard<
  T extends ReturnImportProductsCardLine,
>({
  lines,
  columns,
  canEditDraft,
  getRowId,
  onClearAll,
  onReturnAll,
  className,
  resetKey,
  accent = "neutral",
}: ReturnImportProductsCardProps<T>) {
  const dict = useDict();

  const {
    searchRule,
    setSearchRule,
    searchText,
    setSearchText,
    filteredRows: filteredLines,
    resetSearch,
  } = useSkuNameRuleFilter(lines);

  useEffect(() => {
    resetSearch();
  }, [resetKey, resetSearch]);

  const hasAnyPositiveReturnLine = useMemo(
    () => lines.some((line) => toNumberOrZero(line.returnQuantity) > 0),
    [lines],
  );

  const canClearAll = canEditDraft && Boolean(onClearAll) && hasAnyPositiveReturnLine;
  const canReturnAll = canEditDraft && Boolean(onReturnAll) && lines.length > 0;

  return (
    <div
      className={clsx(
        "flex min-h-0 flex-col gap-3 rounded-lg p-3",
        accent !== "neutral"
          ? `${ACCENT_STYLES[accent]} text-text`
          : "border border-border bg-card",
        className,
      )}
    >
      <div className="mb-3 flex w-full items-center justify-between gap-3">
        <div className="w-full max-w-xl pr-3">
          <RuleInput
            options={[
              { label: dict.sku, icon: <Hash className="h-3 w-3" /> },
              { label: dict.name, icon: <Package className="h-3 w-3" /> },
            ]}
            rule={searchRule === "sku" ? dict.sku : dict.name}
            value={searchText}
            placeholder={dict.searchPlaceholder}
            onChange={({ rule, value }) => {
              setSearchRule(rule === dict.name ? "productName" : "sku");
              setSearchText(value);
            }}
          />
        </div>

        {canEditDraft && (
          <div className="flex items-center gap-2">
            <Button
              accent="danger"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={onClearAll}
              disabled={!canClearAll}
            >
              {dict.clearAll}
            </Button>

            <Button
              accent="danger"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={onReturnAll}
              disabled={!canReturnAll}
            >
              {dict.returnAction} {dict.all}
            </Button>
          </div>
        )}
      </div>

      <DataTable<T>
        columns={columns}
        data={filteredLines}
        getRowId={(row) => getRowId(row)}
        emptyMessage={dict.noProductData}
        maxHeight="fill"
      />
    </div>
  );
}
