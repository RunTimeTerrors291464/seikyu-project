"use client";

import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { Edit2, Plus } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import { nameColumns } from "@/features/products/table/nameColumns";

/* ============================= */
/* TYPES */
/* ============================= */

type Props = {
  names: string[];
  max?: number;
  disabled?: boolean;
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
  onMakeDefault: (index: number) => void;
};

/* ============================= */
/* COMPONENT */
/* ============================= */

export default function ProductNamesCard({
  names,
  max = 8,
  disabled,
  onAdd,
  onRemove,
  onMakeDefault,
}: Props) {
  const dict = useDict();

  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const safeNames = names ?? [];

  const isDuplicate = safeNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase()
  );

  const canAdd = trimmed.length > 0 && !isDuplicate;

  function handleAdd() {
    if (!canAdd) return;

    onAdd(trimmed);
    setValue("");
    setAdding(false);
  }

  return (
    <div className="flex grow overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-4 p-4 w-full">
        {/* HEADER */}
        <div className="flex items-center justify-between border-border">
          <span className="flex items-center text-sm font-semibold text-text gap-2">
            <Edit2 className="w-3 h-3" />
            {dict.productName}
          </span>

          {adding ? (
            <div className="flex flex-end items-center gap-2 animate-shoot">
              <input
                autoFocus
                disabled={disabled}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setValue("");
                  }
                }}
                placeholder={dict.addNamePlaceholder}
                className={clsx(
                  "h-8 w-44 rounded-md border px-2 text-xs",
                  "bg-card text-text outline-none transition-colors",
                  isDuplicate ? "border-danger bg-danger" : "border-border",
                  "focus:border-primary"
                )}
              />

              {canAdd && (
                <Button
                  onClick={handleAdd}
                  disabled={disabled || safeNames.length >= max}
                  accent="primary"
                >
                  {dict.add}
                </Button>
              )}

              {isDuplicate && (
                <span className="text-xs text-danger">{dict.isDuplicate}</span>
              )}

              <Button
                onClick={() => {
                  setAdding(false);
                  setValue("");
                }}
                accent="danger"
              >
                {dict.cancel}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-border justify-between">
              <Button
                onClick={() => safeNames.length < max && setAdding(true)}
                disabled={disabled || safeNames.length >= max}
                accent="neutral"
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                {dict.add}
              </Button>
              <span className="text-sm text-text">
                {safeNames.length}/{max}
              </span>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className={clsx(
          "grow bg-card shadow-sm overflow-hidden",
          disabled && "opacity-60 pointer-events-none"
        )}>
          <DataTable<string>
            data={safeNames}
            getRowId={(idx) => idx.toString()}
            maxHeight="fill"
            columns={nameColumns(dict, { onRemove, onMakeDefault })}
          />
        </div>
      </div>
    </div>
  );
}