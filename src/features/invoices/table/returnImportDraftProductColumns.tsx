"use client";

import type { Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import type { Dictionary } from "@/lib/lang/i18n";
import { DollarSign, Hash, MessageSquare, Package, Ruler, Sigma } from "lucide-react";
import { toNumberOrZero } from "../types/importInvoiceDetail";
import type { EditableReturnImportLine } from "../types/returnImportDraft";

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

function isNoteEnabledForLine(line: EditableReturnImportLine): boolean {
  return toNumberOrZero(line.returnQuantity) > 0;
}

export function returnImportDraftProductColumns({
  dict,
  onUpdateLine,
  onBlurReturnQuantity,
  shouldShowReturnQuantityError,
  showNoteErrorForLine,
}: ReturnImportDraftProductColumnsParams): Column<EditableReturnImportLine>[] {
  return [
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
      id: "importPrice",
      header: dict.importPrice,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderImportPrice(row) {
        return (
          <span className="tabular-nums text-text">
            {row.importPrice || "—"}
          </span>
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "returnQuantity",
      header: dict.returnQuantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderReturnQuantity(row) {
        return (
          <Input
            value={row.returnQuantity}
            onChange={function handleChange(value): void {
              onUpdateLine(row.localId, "returnQuantity", value);
            }}
            onBlur={function handleBlur(): void {
              onBlurReturnQuantity(row.localId);
            }}
            inputMode="numeric"
            error={shouldShowReturnQuantityError}
          />
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderNotes(row) {
        const noteEnabled = isNoteEnabledForLine(row);
        return (
          <Input
            value={row.notes}
            onChange={function handleChange(value): void {
              onUpdateLine(row.localId, "notes", value);
            }}
            disabled={!noteEnabled}
            error={showNoteErrorForLine(row)}
          />
        );
      },
      tdClassName: "max-w-[280px]",
    },
  ];
}
