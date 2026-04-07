"use client";

/**
 * Product-line columns for import and return-import invoice tables (SKU through notes).
 * Invoice **list** columns (one row per invoice) live in `importInvoiceColumns.tsx`.
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
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import {
  Barcode,
  DollarSign,
  MessageSquare,
  Package,
  Ruler,
  Sigma,
} from "lucide-react";
import type { EditableImportInvoiceProduct } from "../types/importInvoiceDetail";
import { toNumberOrZero } from "../types/importInvoiceDetail";
import type { EditableReturnInvoiceDetailLine } from "../types/returnImportDetail";
import type { EditableReturnImportLine } from "../types/returnImportDraft";

// --- Shared row shapes for internal builders ---

type ProductIdentityRow = {
  productSku: string;
  productName: string;
  productUnit: string;
};

type WithImportPriceReadOnly = ProductIdentityRow & { importPrice: string };

// --- Internal: identity + read-only price (return flows) ---

/**
 * Read-only SKU, product name, and unit. Uses `Barcode` for SKU (aligned with import product lines).
 *
 * @param dict - UI strings.
 * @returns Three column definitions.
 */
function buildProductIdentityColumns<T extends ProductIdentityRow>(
  dict: Dictionary,
): Column<T>[] {
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
      thClassName: "w-[220px]",
    },
    {
      id: "productUnit",
      header: dict.unit,
      icon: <Ruler className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderUnit(row) {
        return <span className="text-text">{row.productUnit || "—"}</span>;
      },
      thClassName: "w-[120px]",
    },
  ];
}

/**
 * Read-only import price cell for return-import product tables.
 *
 * @param dict - UI strings.
 * @returns One column definition.
 */
function buildImportPriceReadOnlyColumn<T extends WithImportPriceReadOnly>(
  dict: Dictionary,
): Column<T> {
  return {
    id: "importPrice",
    header: dict.importPrice,
    icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderImportPrice(row) {
      const raw = row.importPrice?.trim();
      return (
        <span className="tabular-nums text-text">
          {raw ? formatPriceMoneyLike(row.importPrice) : "—"}
        </span>
      );
    },
    thClassName: "w-[120px]",
  };
}

/**
 * First four columns for return draft/detail: identity + read-only import price.
 *
 * @param dict - UI strings.
 * @returns Four column definitions.
 */
function buildReturnImportReadOnlyStaticColumns<T extends WithImportPriceReadOnly>(
  dict: Dictionary,
): Column<T>[] {
  return [
    ...buildProductIdentityColumns<T>(dict),
    buildImportPriceReadOnlyColumn<T>(dict),
  ];
}

function isZeroValue(value: string): boolean {
  return Number(value) === 0;
}

function isEmptyValue(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Read-only line total (quantity × import price) for import invoice product rows.
 *
 * @param dict - UI strings; uses `totalPriceLabel` for the header.
 * @returns One column definition.
 */
function buildImportLineTotalColumn(
  dict: Dictionary,
): Column<EditableImportInvoiceProduct> {
  return {
    id: "lineTotal",
    header: dict.totalPriceLabel,
    icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderLineTotal(row) {
      const total = lineTotalFromQuantityAndMoneyStrings(
        row.quantity,
        row.importPrice,
      );
      return (
        <span className="tabular-nums text-text">
          {formatPriceNumber(total)}
        </span>
      );
    },
    thClassName: "w-[160px]",
  };
}

/**
 * Editable quantity, import price, computed line total, and notes for import invoice lines.
 *
 * @param dict - UI strings.
 * @param canEditDraft - When false, inputs are disabled and validation styling is off.
 * @param onUpdateRow - Persists a field on a row by `localId`.
 * @returns Four column definitions.
 */
function buildImportInvoiceEditableTailColumns(
  dict: Dictionary,
  canEditDraft: boolean,
  onUpdateRow: (
    rowLocalId: string,
    key: keyof EditableImportInvoiceProduct,
    value: string,
  ) => void,
): Column<EditableImportInvoiceProduct>[] {
  return [
    {
      id: "quantity",
      header: dict.quantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderQuantity(row) {
        const isEmpty = isEmptyValue(row.quantity);
        return (
          <Input
            value={row.quantity}
            onChange={function handleChange(value): void {
              const next = normalizeIntegerStringInput(value, {
                allowEmpty: true,
              });
              onUpdateRow(row.localId, "quantity", next);
            }}
            disabled={!canEditDraft}
            error={canEditDraft ? isEmpty : false}
            warning={canEditDraft ? !isEmpty && isZeroValue(row.quantity) : false}
            inputMode="numeric"
          />
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "importPrice",
      header: dict.importPrice,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderImportPrice(row) {
        const isEmpty = isEmptyValue(row.importPrice);
        return (
          <Input
            value={row.importPrice}
            onChange={function handleChange(value): void {
              const next = normalizeMoneyStringInput(value, {
                allowEmpty: true,
              });
              onUpdateRow(row.localId, "importPrice", next);
            }}
            onBlur={function handleBlur(): void {
              if (!canEditDraft) {
                return;
              }
              const next = finalizeMoneyStringTwoDecimalPlaces(row.importPrice, {
                allowEmpty: true,
              });
              if (next !== row.importPrice) {
                onUpdateRow(row.localId, "importPrice", next);
              }
            }}
            disabled={!canEditDraft}
            error={canEditDraft ? isEmpty : false}
            warning={canEditDraft ? !isEmpty && isZeroValue(row.importPrice) : false}
            inputMode="numeric"
          />
        );
      },
      thClassName: "w-[160px]",
    },
    buildImportLineTotalColumn(dict),
    {
      id: "notes",
      header: dict.noteLabel,
      icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderNotes(row) {
        return (
          <Input
            value={row.notes}
            onChange={function handleChange(value): void {
              onUpdateRow(row.localId, "notes", value);
            }}
            disabled={!canEditDraft}
          />
        );
      },
      tdClassName: "max-w-[280px]",
    },
  ];
}

type ReturnQuantityColumnParams<T extends { returnQuantity: string }> = {
  dict: Dictionary;
  disabled: boolean;
  shouldShowReturnQuantityError: boolean;
  setReturnQuantity: (row: T, next: string) => void;
  onBlurReturnQuantity: (row: T) => void;
};

/**
 * Return quantity input shared by return draft and return detail product tables.
 *
 * @param params - Dict, disabled state, error flag, and row callbacks.
 * @returns One column definition.
 */
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

/**
 * Per-line notes input for return draft/detail when return quantity is positive.
 *
 * @param params - Dict, enable/error predicates, and change handler.
 * @returns One column definition.
 */
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

/**
 * Computed line total for return-import rows (return quantity × import price strings).
 *
 * @param dict - UI strings.
 * @returns One column definition.
 */
function buildReturnLineTotalColumn<
  T extends { returnQuantity: string; importPrice: string },
>(dict: Dictionary): Column<T> {
  return {
    id: "totalReturnPrice",
    header: dict.totalReturnPriceLabel,
    icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderLineTotal(row) {
      const total = lineTotalFromQuantityAndMoneyStrings(
        row.returnQuantity,
        row.importPrice,
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

// --- Public: import invoice product lines (draft / confirmed) ---

type ImportInvoiceProductColumnsParams = {
  dict: Dictionary;
  canEditDraft: boolean;
  selectedIds: Set<string>;
  allSelected: boolean;
  hasRows: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectOne: (localId: string, checked: boolean) => void;
  onUpdateRow: (
    rowLocalId: string,
    key: keyof EditableImportInvoiceProduct,
    value: string,
  ) => void;
};

export function importInvoiceProductColumns({
  dict,
  canEditDraft,
  selectedIds,
  allSelected,
  hasRows,
  onToggleSelectAll,
  onToggleSelectOne,
  onUpdateRow,
}: ImportInvoiceProductColumnsParams): Column<EditableImportInvoiceProduct>[] {
  const selectColumn: Column<EditableImportInvoiceProduct> = {
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

  const bodyColumns: Column<EditableImportInvoiceProduct>[] = [
    ...buildProductIdentityColumns<EditableImportInvoiceProduct>(dict),
    ...buildImportInvoiceEditableTailColumns(dict, canEditDraft, onUpdateRow),
  ];

  const indexColumn = rowIndexColumn<EditableImportInvoiceProduct>();

  return canEditDraft
    ? [selectColumn, indexColumn, ...bodyColumns]
    : [indexColumn, ...bodyColumns];
}

// --- Public: return import draft (create popup) ---

type ReturnImportDraftProductColumnsParams = {
  dict: Dictionary;
  onUpdateLine: (
    localId: string,
    key: keyof EditableReturnImportLine,
    value: string,
  ) => void;
  onBlurReturnQuantity: (localId: string) => void;
  shouldShowReturnQuantityError: boolean;
  showNoteErrorForLine: (line: EditableReturnImportLine) => boolean;
};

export function returnImportDraftProductColumns({
  dict,
  onUpdateLine,
  onBlurReturnQuantity,
  shouldShowReturnQuantityError,
  showNoteErrorForLine,
}: ReturnImportDraftProductColumnsParams): Column<EditableReturnImportLine>[] {
  function isNoteEnabledForLine(line: EditableReturnImportLine): boolean {
    return toNumberOrZero(line.returnQuantity) > 0;
  }

  return [
    rowIndexColumn<EditableReturnImportLine>(),
    ...buildReturnImportReadOnlyStaticColumns<EditableReturnImportLine>(dict),
    buildReturnQuantityInputColumn<EditableReturnImportLine>({
      dict,
      disabled: false,
      shouldShowReturnQuantityError,
      setReturnQuantity: function setReturnQuantity(
        row,
        next,
      ): void {
        onUpdateLine(row.localId, "returnQuantity", next);
      },
      onBlurReturnQuantity: function handleBlur(row): void {
        onBlurReturnQuantity(row.localId);
      },
    }),
    buildReturnLineTotalColumn<EditableReturnImportLine>(dict),
    buildReturnLineNotesColumn<EditableReturnImportLine>({
      dict,
      isNoteEnabled: isNoteEnabledForLine,
      showNoteErrorForLine,
      setNotes: function setNotes(row, value): void {
        onUpdateLine(row.localId, "notes", value);
      },
    }),
  ];
}

// --- Public: return import invoice detail page ---

type ReturnImportInvoiceDetailProductColumnsParams = {
  dict: Dictionary;
  canEditDraft: boolean;
  onUpdateLine: (
    lineId: string,
    key: keyof EditableReturnInvoiceDetailLine,
    value: string,
  ) => void;
  onBlurReturnQuantity: (lineId: string) => void;
  shouldShowReturnQuantityError: boolean;
  showNoteErrorForLine: (line: EditableReturnInvoiceDetailLine) => boolean;
};

export function returnImportInvoiceDetailProductColumns({
  dict,
  canEditDraft,
  onUpdateLine,
  onBlurReturnQuantity,
  shouldShowReturnQuantityError,
  showNoteErrorForLine,
}: ReturnImportInvoiceDetailProductColumnsParams): Column<EditableReturnInvoiceDetailLine>[] {
  function isNoteEnabledForLine(line: EditableReturnInvoiceDetailLine): boolean {
    return canEditDraft && toNumberOrZero(line.returnQuantity) > 0;
  }

  return [
    rowIndexColumn<EditableReturnInvoiceDetailLine>(),
    ...buildReturnImportReadOnlyStaticColumns<EditableReturnInvoiceDetailLine>(
      dict,
    ),
    buildReturnQuantityInputColumn<EditableReturnInvoiceDetailLine>({
      dict,
      disabled: !canEditDraft,
      shouldShowReturnQuantityError,
      setReturnQuantity: function setReturnQuantity(
        row,
        next,
      ): void {
        onUpdateLine(row.lineId, "returnQuantity", next);
      },
      onBlurReturnQuantity: function handleBlur(row): void {
        onBlurReturnQuantity(row.lineId);
      },
    }),
    buildReturnLineTotalColumn<EditableReturnInvoiceDetailLine>(dict),
    buildReturnLineNotesColumn<EditableReturnInvoiceDetailLine>({
      dict,
      isNoteEnabled: isNoteEnabledForLine,
      showNoteErrorForLine,
      setNotes: function setNotes(row, value): void {
        onUpdateLine(row.lineId, "notes", value);
      },
    }),
  ];
}
