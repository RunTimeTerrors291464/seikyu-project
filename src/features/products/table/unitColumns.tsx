"use client";

import Button from "@/components/ui/Buttons";
import type { Column } from "@/components/ui/DataTable";
import { Dictionary } from "@/lib/lang/i18n";
import clsx from "clsx";
import { FileText, Pencil, Settings, Trash2 } from "lucide-react";
import { ProductUnit } from "../services/product.unit.service";

type Actions = {
  selectedUnitId?: string;
  onSelect: (unit: ProductUnit) => void;
  onEdit: (unit: ProductUnit) => void;
  onDelete?: (unit: ProductUnit) => void;
};

export function unitColumns(
  dict: Dictionary,
  { selectedUnitId, onSelect, onEdit, onDelete }: Actions
): Column<ProductUnit>[] {
  return [
    {
      id: "name",
      header: dict.name,
      icon: <Pencil className="h-3.5 w-3.5" />,
      accessor: (u) => (
        <div
          onClick={() => onSelect(u)}
          className={clsx(
            "cursor-pointer flex items-center gap-2",
            u.id === selectedUnitId && "font-semibold text-primary"
          )}
        >
          <span className="font-mono">{u.unitName}</span>
        </div>
      ),
    },

    {
      id: "description",
      header: dict.description,
      icon: <FileText className="h-3 w-3" />,
      accessor: (u) => (
        <span className="text-muted">
          {u.unitDescription || "—"}
        </span>
      ),
    },

    {
      id: "action",
      header: dict.action,
      align: "right",
      icon: <Settings className="h-3 w-3" />,
      accessor: (u) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button onClick={() => onEdit(u)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {onDelete && (
            <button
              onClick={() => onDelete(u)}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-danger text-white hover:opacity-90 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
      thClassName: "text-right pr-3",
      tdClassName: "text-right pr-3",
    },
  ];
}