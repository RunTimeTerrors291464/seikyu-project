"use client";

import Popup from "@/components/layout/BlurPopupWraper";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import TablePagination from "@/components/ui/TablePagination";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { Plus, Ruler } from "lucide-react";
import { useEffect, useState } from "react";

import { useProductUnit } from "../hooks/useProductUnit";
import { ProductUnit } from "../services/product.unit.service";
import { unitColumns } from "../table/unitColumns";

type Props = {
  open: boolean;
  selectedUnitId?: string;
  onClose: () => void;
  onSelect: (unit: ProductUnit) => void;
};

export default function UnitPickerPopup({
  open,
  selectedUnitId,
  onClose,
  onSelect,
}: Props) {
  const dict = useDict();

  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const {
    units,
    loading,
    createUnit,
    updateUnit,
  } = useProductUnit(search);

  /* ───────── Pagination ───────── */

  const totalResults = units.length;
  const totalPages = Math.ceil(totalResults / rowsPerPage);

  const paginatedUnits = units.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ───────── Add logic ───────── */

  const trimmed = name.trim();

  const isDuplicate = units.some(
    (u) => u.unitName.toLowerCase() === trimmed.toLowerCase()
  );

  const canAdd = trimmed.length > 0 && !isDuplicate;

  async function handleAdd() {
    if (!canAdd) return;

    const unit = await createUnit(name, desc);

    setName("");
    setDesc("");
    setAdding(false);

    onSelect(unit);
    onClose();
  }

  if (!open) return null;

  return (
    <Popup open={open} onClose={onClose}>
      <div className="flex flex-col max-w-[50vw] max-h-[70vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">

          <span className="flex items-center text-sm font-semibold text-text gap-2">
            <Ruler className="w-4 h4" />
            {dict.unit}
          </span>

          {adding ? (
            <div className="flex items-center gap-2 animate-shoot">

              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict.name}
                className={clsx(
                  "h-8 w-28 rounded-md border px-2 text-xs",
                  "bg-card text-text outline-none",
                  isDuplicate ? "border-danger" : "border-border",
                  "focus:border-primary"
                )}
              />

              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={dict.description}
                className="h-8 w-40 rounded-md border px-2 text-xs border-border bg-card text-text outline-none focus:border-primary"
              />

              {canAdd && (
                <button
                  onClick={handleAdd}
                  className="h-8 px-2 text-xs border border-border rounded-md hover:bg-hover"
                >
                  {dict.add}
                </button>
              )}

              <button
                onClick={() => {
                  setAdding(false);
                  setName("");
                  setDesc("");
                }}
                className="h-8 px-2 text-xs border border-border rounded-md text-muted hover:bg-hover"
              >
                {dict.cancel}
              </button>

            </div>
          ) : (
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              {dict.add}
            </Button>
          )}

        </div>

        {/* TABLE */}
        <div className="grow min-h-0 flex flex-col p-4">
          <DataTable<ProductUnit>
            data={paginatedUnits}
            getRowId={(u) => u.id}
            maxHeight="fill"
            emptyMessage={loading ? dict.loading : dict.noUnit}
            columns={unitColumns(dict, {
              selectedUnitId,
              onSelect: (unit) => {
                onSelect(unit);
                onClose();
              },
              onEdit: async (unit) => {
                const newName = prompt(dict.editName, unit.unitName);
                if (!newName) return;

                await updateUnit(
                  unit.id,
                  newName,
                  unit.unitDescription
                );
              },
            })}
          />
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">

          {/* PAGINATION */}

          <TablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={() => { }} // fixed
            setPage={setPage}
            totalResults={totalResults}
            dict={{
              page: dict.page,
              of: dict.of,
              result: dict.result,
              results: dict.results,
            }}
          />

          <Button onClick={onClose} accent="neutral">
            {dict.close}
          </Button>

        </div>
      </div>
    </Popup>
  );
}