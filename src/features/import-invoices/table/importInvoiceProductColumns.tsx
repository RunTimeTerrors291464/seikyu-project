"use client";

import type { Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import type { Dictionary } from "@/lib/lang/i18n";
import { DollarSign, Hash, MessageSquare, Package, Ruler, Sigma } from "lucide-react";
import type { EditableImportInvoiceProduct } from "../types/importInvoiceDetail";

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

function isZeroValue(value: string): boolean {
  return Number(value) === 0;
}

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
  return [
    {
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
          disabled={!canEditDraft || !hasRows}
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
            disabled={!canEditDraft}
          />
        );
      },
      thClassName: "w-[46px]",
      tdClassName: "w-[46px]",
    },
    {
      id: "productSku",
      header: dict.sku,
      icon: <Hash className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
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
    {
      id: "quantity",
      header: dict.quantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderQuantity(row) {
        return (
          <Input
            value={row.quantity}
            onChange={function handleChange(value): void {
              onUpdateRow(row.localId, "quantity", value);
            }}
            disabled={!canEditDraft}
            warning={isZeroValue(row.quantity)}
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
        return (
          <Input
            value={row.importPrice}
            onChange={function handleChange(value): void {
              onUpdateRow(row.localId, "importPrice", value);
            }}
            disabled={!canEditDraft}
            warning={isZeroValue(row.importPrice)}
            inputMode="numeric"
          />
        );
      },
      thClassName: "w-[140px]",
    },
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
