"use client";

/**
 * Product-line table columns for stock-adjustment invoice details and draft editing.
 * Used by `StockAdjustmentProductsCard` for row selection, quantity/action edits, and notes.
 */

import type { Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import type { Dictionary } from "@/lib/lang/i18n";
import { translateUnitName } from "@/lib/lang/translateUnitName";
import { isEmptyValue, isZeroValue } from "@/lib/numeric/fieldValueChecks";
import { normalizeIntegerStringInput } from "@/lib/numeric/integerAndMoneyInputs";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import clsx from "clsx";
import {
  Barcode,
  MessageSquare,
  Package,
  Ruler,
  Sigma,
} from "lucide-react";
import type { StockAdjustmentAction } from "../services/stockAdjustmentInvoice.service";
import type { EditableStockAdjustmentLine } from "../types/stockAdjustmentDetail";
import { toNumberOrZero } from "../types/stockAdjustmentDetail";

type StockAdjustmentProductColumnsParams = {
  dict: Dictionary;
  canEditDraft: boolean;
  selectedIds: Set<string>;
  allSelected: boolean;
  hasRows: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectOne: (localId: string, checked: boolean) => void;
  onUpdateRow: (
    rowLocalId: string,
    key: keyof EditableStockAdjustmentLine,
    value: string,
  ) => void;
};

export function stockAdjustmentProductColumns({
  dict,
  canEditDraft,
  selectedIds,
  allSelected,
  hasRows,
  onToggleSelectAll,
  onToggleSelectOne,
  onUpdateRow,
}: StockAdjustmentProductColumnsParams): Column<EditableStockAdjustmentLine>[] {
  const selectColumn: Column<EditableStockAdjustmentLine> = {
    id: "select",
    header: "",
    icon: (
      <input
        type="checkbox"
        checked={allSelected}
        onChange={function handleSelectAll(event): void {
          onToggleSelectAll(event.target.checked);
        }}
        className="h-4 w-4 rounded border-border"
        disabled={!hasRows}
        aria-label={dict.selected}
      />
    ),
    accessor: function renderRowSelect(row) {
      return (
        <input
          type="checkbox"
          checked={selectedIds.has(row.localId)}
          onChange={function handleSelectOne(event): void {
            onToggleSelectOne(row.localId, event.target.checked);
          }}
          className="h-4 w-4 rounded border-border"
        />
      );
    },
    thClassName: "w-[46px]",
    tdClassName: "w-[46px]",
  };

  const bodyColumns: Column<EditableStockAdjustmentLine>[] = [
    {
      id: "productSku",
      header: dict.sku,
      icon: <Barcode className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderSku(row) {
        return <span className="text-text">{row.productSku || "—"}</span>;
      },
      thClassName: "w-[120px]",
    },
    {
      id: "productName",
      header: dict.productName,
      icon: <Package className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderName(row) {
        return <span className="text-text">{row.productName || "—"}</span>;
      },
      thClassName: "w-[200px]",
    },
    {
      id: "productUnit",
      header: dict.unit,
      icon: <Ruler className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderUnit(row) {
        return (
          <span className="text-text">
            {row.productUnit
              ? translateUnitName(row.productUnit, dict)
              : "—"}
          </span>
        );
      },
      thClassName: "w-[100px]",
    },
    {
      id: "action",
      header: dict.stockAdjustmentActionLabel,
      accessor: function renderAction(row) {
        if (!canEditDraft) {
          return (
            <span className="text-text">
              {row.action === "add"
                ? dict.stockAdjustmentActionAdd
                : dict.stockAdjustmentActionSubtract}
            </span>
          );
        }
        return (
          <select
            value={row.action}
            onChange={function handleActionChange(event): void {
              onUpdateRow(
                row.localId,
                "action",
                event.target.value as StockAdjustmentAction,
              );
            }}
            className={clsx(
              "h-9 w-full min-w-0 rounded-md border bg-card px-2 text-sm text-text",
              "outline-none transition-colors duration-150 border-border",
            )}
          >
            <option value="add">{dict.stockAdjustmentActionAdd}</option>
            <option value="subtract">{dict.stockAdjustmentActionSubtract}</option>
          </select>
        );
      },
      thClassName: "w-[130px]",
    },
    {
      id: "quantity",
      header: dict.quantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderQuantity(row) {
        const isEmpty = isEmptyValue(row.quantity);
        if (!canEditDraft) {
          return (
            <span className="tabular-nums text-text">
              {toNumberOrZero(row.quantity)}
            </span>
          );
        }
        return (
          <div
            onMouseDown={function stopRowCapture(event): void {
              event.stopPropagation();
            }}
          >
            <Input
              value={row.quantity}
              invoiceLineQuantityRowId={row.localId}
              onChange={function handleChange(value): void {
                const next = normalizeIntegerStringInput(value, {
                  allowEmpty: true,
                });
                onUpdateRow(row.localId, "quantity", next);
              }}
              error={canEditDraft ? isEmpty : false}
              warning={canEditDraft ? !isEmpty && isZeroValue(row.quantity) : false}
              inputMode="numeric"
            />
          </div>
        );
      },
      thClassName: "w-[120px]",
      tdClassName:
        "!max-w-none !overflow-visible whitespace-normal [overflow-wrap:anywhere]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderNotes(row) {
        if (!canEditDraft) {
          const text = row.notes.trim();
          return <span className="text-text">{text.length > 0 ? text : "—"}</span>;
        }
        return (
          <div
            onMouseDown={function stopRowCapture(event): void {
              event.stopPropagation();
            }}
          >
            <Input
              value={row.notes}
              onChange={function handleChange(value): void {
                onUpdateRow(row.localId, "notes", value);
              }}
            />
          </div>
        );
      },
      tdClassName:
        "max-w-[min(280px,100%)] !overflow-visible whitespace-normal [overflow-wrap:anywhere]",
    },
  ];

  const indexColumn = rowIndexColumn<EditableStockAdjustmentLine>();

  return canEditDraft
    ? [selectColumn, indexColumn, ...bodyColumns]
    : [indexColumn, ...bodyColumns];
}
