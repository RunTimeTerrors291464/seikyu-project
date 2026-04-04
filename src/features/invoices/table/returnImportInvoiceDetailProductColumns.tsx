"use client";

import type { Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import type { Dictionary } from "@/lib/lang/i18n";
import { DollarSign, Hash, MessageSquare, Package, Ruler, Sigma } from "lucide-react";
import type { EditableReturnInvoiceDetailLine } from "../types/returnImportDetail";
import { toNumberOrZero } from "../types/importInvoiceDetail";

type ReturnImportInvoiceDetailProductColumnsParams = {
  dict: Dictionary;
  canEditDraft: boolean;
  onUpdateLine: (
    lineId: string,
    key: keyof EditableReturnInvoiceDetailLine,
    value: string,
  ) => void;
  onBlurReturnQuantity: (lineId: string) => void;
};

function isNoteEnabledForLine(line: EditableReturnInvoiceDetailLine): boolean {
  return toNumberOrZero(line.returnQuantity) > 0;
}

export function returnImportInvoiceDetailProductColumns({
  dict,
  canEditDraft,
  onUpdateLine,
  onBlurReturnQuantity,
}: ReturnImportInvoiceDetailProductColumnsParams): Column<EditableReturnInvoiceDetailLine>[] {
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
              onUpdateLine(row.lineId, "returnQuantity", value);
            }}
            onBlur={function handleBlur(): void {
              onBlurReturnQuantity(row.lineId);
            }}
            disabled={!canEditDraft}
            inputMode="numeric"
          />
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "totalReturnPrice",
      header: dict.totalReturnPriceLabel,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderLineTotal(row) {
        const qty = toNumberOrZero(row.returnQuantity);
        const unit = Number(String(row.importPrice).replace(/,/g, ""));
        const total = Number.isFinite(unit) ? qty * unit : 0;
        return (
          <span className="tabular-nums text-text">
            {total.toLocaleString()}
          </span>
        );
      },
      thClassName: "w-[130px]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderNotes(row) {
        const noteEnabled = canEditDraft && isNoteEnabledForLine(row);
        return (
          <Input
            value={row.notes}
            onChange={function handleChange(value): void {
              onUpdateLine(row.lineId, "notes", value);
            }}
            disabled={!noteEnabled}
          />
        );
      },
      tdClassName: "max-w-[280px]",
    },
  ];
}
