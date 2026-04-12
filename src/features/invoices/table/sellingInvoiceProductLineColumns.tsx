"use client";

/**
 * Product-line columns for selling and return-selling invoice tables.
 */

import type { Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import type { Dictionary } from "@/lib/lang/i18n";
import {
  finalizeMoneyStringTwoDecimalPlaces,
  formatPriceMoneyLike,
  formatPriceNumber,
  lineTotalFromQuantityAndMoneyStrings,
  normalizeIntegerStringInput,
  normalizeMoneyStringInput,
} from "@/lib/numeric/integerAndMoneyInputs";
import {
  Barcode,
  DollarSign,
  MessageSquare,
  Package,
  Ruler,
  Sigma,
} from "lucide-react";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import type { SellingInvoiceProductDto } from "../services/sellingInvoice.service";
import { toNumberOrZero } from "../types/importInvoiceDetail";
import type { EditableReturnSellingDetailLine } from "../types/returnSellingDetail";
import type { EditableReturnSellingLine } from "../types/returnSellingDraft";
import type { EditableSellingInvoiceCreateLine } from "../types/sellingInvoiceCreate";

function isZeroValue(value: string): boolean {
  return Number(value) === 0;
}

function isEmptyValue(value: string): boolean {
  return value.trim().length === 0;
}

function buildProductIdentityColumnsReadOnly<
  T extends { productSku: string; productName: string; productUnit: string },
>(dict: Dictionary): Column<T>[] {
  return [
    {
      id: "productSku",
      header: dict.sku,
      icon: <Barcode className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderSku(row) {
        return <span className="text-text">{row.productSku || "—"}</span>;
      },
      thClassName: "w-[140px]",
    },
    {
      id: "productName",
      header: dict.productName,
      icon: <Package className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderName(row) {
        return <span className="text-text">{row.productName || "—"}</span>;
      },
      thClassName: "w-[140px]",
    },
    {
      id: "productUnit",
      header: dict.unit,
      icon: <Ruler className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderUnit(row) {
        return <span className="text-text">{row.productUnit || "—"}</span>;
      },
      thClassName: "w-[100px]",
    },
  ];
}

// --- Create selling invoice (cashier popup) ---

type SellingInvoiceCreateColumnsParams = {
  dict: Dictionary;
  readOnly: boolean;
  /**
   * When false, quantity omits error/warning styling until the parent enables it (e.g. after Create).
   */
  showLineFieldErrors?: boolean;
  enableSelection: boolean;
  selectedIds: Set<string>;
  allSelected: boolean;
  hasRows: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectOne: (localId: string, checked: boolean) => void;
  onUpdateRow: (
    rowLocalId: string,
    key: keyof EditableSellingInvoiceCreateLine,
    value: string,
  ) => void;
};
const MAX_PERCENT_DISCOUNT = 100;

function clampPercentDiscount(value: number): number {
  return Math.min(Math.max(value, 0), MAX_PERCENT_DISCOUNT);
}

export function sellingInvoiceCreateProductColumns({
  dict,
  readOnly,
  showLineFieldErrors = true,
  enableSelection,
  selectedIds,
  allSelected,
  hasRows,
  onToggleSelectAll,
  onToggleSelectOne,
  onUpdateRow,
}: SellingInvoiceCreateColumnsParams): Column<EditableSellingInvoiceCreateLine>[] {
  const showQuantityIssues = !readOnly && showLineFieldErrors;
  const selectColumn: Column<EditableSellingInvoiceCreateLine> = {
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

  const bodyColumns: Column<EditableSellingInvoiceCreateLine>[] = [
    ...buildProductIdentityColumnsReadOnly<EditableSellingInvoiceCreateLine>(
      dict,
    ),
    {
      id: "quantity",
      header: dict.quantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderQuantity(row) {
        if (readOnly) {
          return (
            <span className="tabular-nums text-text">
              {toNumberOrZero(row.quantity)}
            </span>
          );
        }
        const isEmpty = isEmptyValue(row.quantity);
        return (
          <div
            onMouseDown={function stopRowCapture(event): void {
              event.stopPropagation();
            }}
          >
            <Input
              value={row.quantity}
              onChange={function handleChange(value): void {
                const next = normalizeIntegerStringInput(value, {
                  allowEmpty: true,
                });
                onUpdateRow(row.localId, "quantity", next);
              }}
              error={showQuantityIssues ? isEmpty : false}
              warning={
                showQuantityIssues
                  ? !isEmpty && isZeroValue(row.quantity)
                  : false
              }
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
      id: "productDiscount",
      header: dict.productDiscountLabel,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderDiscount(row) {
        if (readOnly) {
          return (
            <span className="tabular-nums text-text">
              {formatPriceMoneyLike(row.productDiscount)}%
            </span>
          );
        }
        return (
          <div
            className="flex min-w-0 items-center gap-1"
            onMouseDown={function stopRowCapture(event): void {
              event.stopPropagation();
            }}
          >
            <Input
              value={row.productDiscount}
              onChange={function handleChange(value): void {
                const next = normalizeMoneyStringInput(value, { allowEmpty: true });
                if (next === "") {
                  onUpdateRow(row.localId, "productDiscount", next);
                  return;
                }
                onUpdateRow(
                  row.localId,
                  "productDiscount",
                  String(clampPercentDiscount(toNumberOrZero(next))),
                );
              }}
              onBlur={function handleBlur(): void {
                const next = finalizeMoneyStringTwoDecimalPlaces(row.productDiscount, {
                  allowEmpty: true,
                });
                const clamped =
                  next === ""
                    ? ""
                    : clampPercentDiscount(toNumberOrZero(next)).toFixed(2);
                if (clamped !== row.productDiscount) {
                  onUpdateRow(row.localId, "productDiscount", clamped);
                }
              }}
              inputMode="decimal"
              className="min-w-0 flex-1"
            />
            <span className="shrink-0 text-sm text-muted" aria-hidden>
              %
            </span>
          </div>
        );
      },
      thClassName: "w-[140px]",
      tdClassName:
        "!max-w-none !overflow-visible whitespace-normal [overflow-wrap:anywhere]",
    },
    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderPrice(row) {
        return (
          <span className="tabular-nums text-text">
            {formatPriceMoneyLike(row.sellingPrice)}
          </span>
        );
      },
      thClassName: "w-[130px]",
    },
    {
      id: "totalSellingPrice",
      header: dict.lineTotalSellingLabel,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderTotal(row) {
        const total = readOnly
          ? toNumberOrZero(row.totalSellingPrice)
          : lineTotalFromQuantityAndMoneyStrings(
              row.quantity,
              String(
                (toNumberOrZero(row.sellingPrice) *
                  (100 - toNumberOrZero(row.productDiscount))) /
                  100,
              ),
            );
        return (
          <span className="tabular-nums text-text">{formatPriceNumber(total)}</span>
        );
      },
      thClassName: "w-[150px]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderNotes(row) {
        if (readOnly) {
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
        "max-w-[280px] !overflow-visible whitespace-normal [overflow-wrap:anywhere]",
    },
  ];

  return [
    ...(enableSelection ? [selectColumn] : []),
    rowIndexColumn<EditableSellingInvoiceCreateLine>(),
    ...bodyColumns,
  ];
}

// --- Selling invoice detail (read-only) ---

export function sellingInvoiceDetailReadOnlyProductColumns(
  dict: Dictionary,
): Column<SellingInvoiceProductDto>[] {
  return [
    rowIndexColumn<SellingInvoiceProductDto>(),
    ...buildProductIdentityColumnsReadOnly<SellingInvoiceProductDto>(dict),
    {
      id: "quantity",
      header: dict.quantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderQty(row) {
        return (
          <span className="tabular-nums text-text">{row.quantity}</span>
        );
      },
      thClassName: "w-[100px]",
    },
    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderPrice(row) {
        return (
          <span className="tabular-nums text-text">
            {formatPriceNumber(row.sellingPrice)}
          </span>
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "productDiscount",
      header: dict.productDiscountLabel,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderDisc(row) {
        return (
          <span className="tabular-nums text-text">
            {formatPriceNumber(row.productDiscount)}%
          </span>
        );
      },
      thClassName: "w-[130px]",
    },
    {
      id: "totalSellingPrice",
      header: dict.lineTotalSellingLabel,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderTotal(row) {
        return (
          <span className="tabular-nums text-text">
            {formatPriceNumber(row.totalSellingPrice)}
          </span>
        );
      },
      thClassName: "w-[140px]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderNotes(row) {
        const text = row.notes?.trim();
        return (
          <span className="truncate text-text">
            {text && text !== "" ? text : "—"}
          </span>
        );
      },
      tdClassName: "max-w-[280px]",
    },
  ];
}

// --- Return selling: shared column helpers ---

type ReturnQuantityColumnParams<T extends { returnQuantity: string }> = {
  dict: Dictionary;
  disabled: boolean;
  shouldShowReturnQuantityError: boolean;
  setReturnQuantity: (row: T, next: string) => void;
  onBlurReturnQuantity: (row: T) => void;
};

function buildReturnQuantityInputColumn<T extends { returnQuantity: string }>(
  params: ReturnQuantityColumnParams<T>,
): Column<T> {
  const {
    dict,
    disabled,
    shouldShowReturnQuantityError,
    setReturnQuantity,
    onBlurReturnQuantity,
  } = params;

  return {
    id: "returnQuantity",
    header: dict.returnQuantityLabel,
    icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderReturnQuantity(row) {
      return (
        <Input
          value={row.returnQuantity}
          onChange={function handleChange(value): void {
            const next = normalizeIntegerStringInput(value, {
              allowEmpty: true,
            });
            setReturnQuantity(row, next);
          }}
          onBlur={function handleBlur(): void {
            onBlurReturnQuantity(row);
          }}
          disabled={disabled}
          inputMode="numeric"
          error={shouldShowReturnQuantityError}
        />
      );
    },
    thClassName: "w-[120px]",
  };
}

type ReturnLineNotesColumnParams<T extends { notes: string }> = {
  dict: Dictionary;
  isNoteEnabled: (row: T) => boolean;
  showNoteErrorForLine: (row: T) => boolean;
  setNotes: (row: T, value: string) => void;
};

function buildReturnLineNotesColumn<T extends { notes: string }>(
  params: ReturnLineNotesColumnParams<T>,
): Column<T> {
  const { dict, isNoteEnabled, showNoteErrorForLine, setNotes } = params;

  return {
    id: "notes",
    header: dict.noteLabel,
    icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderNotes(row) {
      const noteEnabled = isNoteEnabled(row);
      return (
        <Input
          value={row.notes}
          onChange={function handleChange(value): void {
            setNotes(row, value);
          }}
          disabled={!noteEnabled}
          error={showNoteErrorForLine(row)}
        />
      );
    },
    tdClassName: "max-w-[280px]",
  };
}

function buildReturnSellingReadOnlyIdentityAndPrice<
  T extends {
    productSku: string;
    productName: string;
    productUnit: string;
    sellingPrice: string;
  },
>(dict: Dictionary): Column<T>[] {
  return [
    ...buildProductIdentityColumnsReadOnly<T>(dict),
    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderPrice(row) {
        const raw = row.sellingPrice?.trim();
        return (
          <span className="tabular-nums text-text">
            {raw ? formatPriceMoneyLike(row.sellingPrice) : "—"}
          </span>
        );
      },
      thClassName: "w-[120px]",
    },
  ];
}

function buildReturnSellingLineTotalColumn<
  T extends { returnQuantity: string; sellingPrice: string },
>(dict: Dictionary): Column<T> {
  return {
    id: "totalReturnPrice",
    header: dict.totalReturnPriceLabel,
    icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderLineTotal(row) {
      const total = lineTotalFromQuantityAndMoneyStrings(
        row.returnQuantity,
        row.sellingPrice,
      );
      return (
        <span className="tabular-nums text-text">
          {formatPriceNumber(total)}
        </span>
      );
    },
    thClassName: "w-[130px]",
  };
}

type ReturnSellingDraftProductColumnsParams = {
  dict: Dictionary;
  onUpdateLine: (
    localId: string,
    key: keyof EditableReturnSellingLine,
    value: string,
  ) => void;
  onBlurReturnQuantity: (localId: string) => void;
  shouldShowReturnQuantityError: boolean;
  showNoteErrorForLine: (line: EditableReturnSellingLine) => boolean;
};

export function returnSellingDraftProductColumns({
  dict,
  onUpdateLine,
  onBlurReturnQuantity,
  shouldShowReturnQuantityError,
  showNoteErrorForLine,
}: ReturnSellingDraftProductColumnsParams): Column<EditableReturnSellingLine>[] {
  function isNoteEnabledForLine(line: EditableReturnSellingLine): boolean {
    return toNumberOrZero(line.returnQuantity) > 0;
  }

  return [
    rowIndexColumn<EditableReturnSellingLine>(),
    ...buildReturnSellingReadOnlyIdentityAndPrice<EditableReturnSellingLine>(
      dict,
    ),
    buildReturnQuantityInputColumn<EditableReturnSellingLine>({
      dict,
      disabled: false,
      shouldShowReturnQuantityError,
      setReturnQuantity: function setReturnQuantity(row, next): void {
        onUpdateLine(row.localId, "returnQuantity", next);
      },
      onBlurReturnQuantity: function handleBlur(row): void {
        onBlurReturnQuantity(row.localId);
      },
    }),
    buildReturnSellingLineTotalColumn<EditableReturnSellingLine>(dict),
    buildReturnLineNotesColumn<EditableReturnSellingLine>({
      dict,
      isNoteEnabled: isNoteEnabledForLine,
      showNoteErrorForLine,
      setNotes: function setNotes(row, value): void {
        onUpdateLine(row.localId, "notes", value);
      },
    }),
  ];
}

type ReturnSellingInvoiceDetailProductColumnsParams = {
  dict: Dictionary;
  canEditDraft: boolean;
  onUpdateLine: (
    lineId: string,
    key: keyof EditableReturnSellingDetailLine,
    value: string,
  ) => void;
  onBlurReturnQuantity: (lineId: string) => void;
  shouldShowReturnQuantityError: boolean;
  showNoteErrorForLine: (line: EditableReturnSellingDetailLine) => boolean;
};

export function returnSellingInvoiceDetailProductColumns({
  dict,
  canEditDraft,
  onUpdateLine,
  onBlurReturnQuantity,
  shouldShowReturnQuantityError,
  showNoteErrorForLine,
}: ReturnSellingInvoiceDetailProductColumnsParams): Column<EditableReturnSellingDetailLine>[] {
  function isNoteEnabledForLine(line: EditableReturnSellingDetailLine): boolean {
    return canEditDraft && toNumberOrZero(line.returnQuantity) > 0;
  }

  return [
    rowIndexColumn<EditableReturnSellingDetailLine>(),
    ...buildReturnSellingReadOnlyIdentityAndPrice<EditableReturnSellingDetailLine>(
      dict,
    ),
    buildReturnQuantityInputColumn<EditableReturnSellingDetailLine>({
      dict,
      disabled: !canEditDraft,
      shouldShowReturnQuantityError,
      setReturnQuantity: function setReturnQuantity(row, next): void {
        onUpdateLine(row.lineId, "returnQuantity", next);
      },
      onBlurReturnQuantity: function handleBlur(row): void {
        onBlurReturnQuantity(row.lineId);
      },
    }),
    buildReturnSellingLineTotalColumn<EditableReturnSellingDetailLine>(dict),
    buildReturnLineNotesColumn<EditableReturnSellingDetailLine>({
      dict,
      isNoteEnabled: isNoteEnabledForLine,
      showNoteErrorForLine,
      setNotes: function setNotes(row, value): void {
        onUpdateLine(row.lineId, "notes", value);
      },
    }),
  ];
}
