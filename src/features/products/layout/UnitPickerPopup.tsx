"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import TablePagination from "@/components/ui/TablePagination";
import { useDict } from "@/lib/lang/DictProvider";
import { CircleOff, Plus, PowerCircle, Ruler } from "lucide-react";
import { useEffect, useState } from "react";

import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useProductUnit } from "../hooks/useProductUnit";
import { ProductUnit } from "../services/product.unit.service";
import { unitColumns } from "../table/unitColumns";

type Props = {
  open: boolean;
  selectedUnitId?: string;
  onClose: () => void;
  onSelect: (unit: ProductUnit) => void;
  /**
   * Called when the unit matching `selectedUnitId` is deactivated and persisted,
   * so the parent can clear an invalid selection.
   */
  onClearSelection?: () => void;
  /**
   * Called after unit changes are saved to the server from this popup (activate,
   * deactivate, or name/description update) so clients can refetch derived state.
   */
  onUnitServerStateChanged?: () => void;
};

export default function UnitPickerPopup({
  open,
  selectedUnitId,
  onClose,
  onSelect,
  onClearSelection,
  onUnitServerStateChanged,
}: Props) {
  const dict = useDict();

  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMap, setDraftMap] = useState<Record<string, ProductUnit>>({});

  const [updating, setUpdating] = useState(false);

  const [confirmingActiveUnit, setConfirmingActiveUnit] = useState<ProductUnit | null>(null);
  const [confirmingSaveUnit, setConfirmingSaveUnit] = useState<ProductUnit | null>(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const {
    units,
    loading,
    createUnit,
    updateUnit,
    activateUnit,
    deactivateUnit,
  } = useProductUnit(search);

  const isDirty = useIsDirty<ProductUnit>();

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
    (u) =>
      (u.unitName || "")
        .toLowerCase()
        .trim() === trimmed.toLowerCase()
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
      <div className="flex bg-bg flex-col max-w-[50vw] max-h-[70vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">

          {/* LEFT: Title */}
          <span className="flex items-center text-sm font-semibold text-text gap-2 whitespace-nowrap">
            <Ruler className="h-4 w-4" />
            {dict.unit}
          </span>

          {/* CENTER: SEARCH */}
          {!adding && (
            <div className="w-xl">
              <Input
                value={search}
                onChange={setSearch}
                placeholder={dict.searchPlaceholder}
              />
            </div>
          )}

          {/* RIGHT: Add / Adding */}
          {adding ? (
            <div className="flex flex-end items-center gap-2 animate-shoot">
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={setName}
                  placeholder={dict.name}
                />

                <Input
                  value={desc}
                  onChange={setDesc}
                  placeholder={dict.description}
                />
              </div>

              {canAdd && (
                <Button onClick={handleAdd} accent="primary">
                  {dict.add}
                </Button>
              )}

              <Button
                onClick={() => {
                  setAdding(false);
                  setName("");
                  setDesc("");
                }}
                accent="danger"
              >
                {dict.cancel}
              </Button>

            </div>
          ) : (
            <Button
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setAdding(true)}
              accent="primary"
            >
              {dict.add}
            </Button>
          )}

        </div>

        {/* TABLE */}
        <div className="grow min-h-0 flex flex-col p-4">
          <DataTable<ProductUnit>
            data={paginatedUnits}
            getRowId={(u, index) => u.id || `row-${index}`}
            maxHeight="fill"
            emptyMessage={loading ? dict.loading : dict.noUnit}
            columns={unitColumns(dict, {
              selectedUnitId,
              editingId: editingId ?? undefined,
              draftMap,
              isDirty,
              units,
              rowIndexPagination: { page, rowsPerPage },

              onSelect: (unit) => {
                if (editingId) return;
                onSelect(unit);
                onClose();
              },

              onEdit: (unit) => {
                setEditingId(unit.id);
                setDraftMap({
                  [unit.id]: { ...unit }, // reset all drafts
                });
              },

              onChange: (id, field, value) => {
                if (field === "isActive") {
                  const unit = draftMap[id] || units.find((u) => u.id === id);
                  if (!unit) return;

                  setConfirmingActiveUnit({
                    ...unit,
                    isActive: value as boolean,
                  });

                  return;
                }

                setDraftMap((prev) => ({
                  ...prev,
                  [id]: {
                    ...prev[id],
                    [field]: value,
                  },
                }));
              },

              onSave: (unit) => {
                const original = units.find((u) => u.id === unit.id);
                if (!original) return;

                const hasActiveChange = original.isActive !== unit.isActive;
                const hasFieldChanges = isDirty(original, unit);

                if (!hasActiveChange && !hasFieldChanges) {
                  setEditingId(null);
                  return;
                }

                setConfirmingSaveUnit(unit);
              },

              onCancel: () => {
                if (editingId) {
                  setDraftMap((prev) => {
                    const next = { ...prev };
                    delete next[editingId];
                    return next;
                  });
                }

                setEditingId(null);
              },
            })}
          />
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <TablePagination
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={() => { }}
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

        {/* CONFIRM ACTIVATION/DEACTIVATION POPUP */}
        {confirmingActiveUnit && (
          <ConfirmPopup
            open={!!confirmingActiveUnit}
            title={
              confirmingActiveUnit.isActive
                ? dict.confirmActivateUnitTitle
                : dict.confirmDeactivateUnitTitle
            }
            description={
              confirmingActiveUnit.isActive
                ? dict.confirmActivateUnitDescription
                : dict.confirmDeactivateUnitDescription
            }
            icon={
              confirmingActiveUnit.isActive ? (
                <PowerCircle className="h-7 w-7 text-primary" />
              ) : (
                <CircleOff className="h-3.5 w-3.5 text-danger" />

              )
            }
            accent={confirmingActiveUnit.isActive ? "neutral" : "danger"}
            confirmText={dict.confirm}
            cancelText={dict.cancel}
            loading={updating}
            onClose={() => setConfirmingActiveUnit(null)}
            onConfirm={async () => {
              const id = confirmingActiveUnit.id;

              // Apply change to draft ONLY
              setDraftMap((prev) => ({
                ...prev,
                [id]: {
                  ...(prev[id] || units.find((u) => u.id === id)!),
                  isActive: confirmingActiveUnit.isActive,
                },
              }));

              setConfirmingActiveUnit(null);
            }}
          />
        )}

        {/* CONFIRM SAVE POPUP */}
        {confirmingSaveUnit && (
          <ConfirmPopup
            open={!!confirmingSaveUnit}
            title={dict.confirmSaveUnitTitle}
            description={dict.confirmSaveUnitDescription}
            confirmText={dict.confirm}
            cancelText={dict.cancel}
            loading={updating}
            onClose={() => setConfirmingSaveUnit(null)}
            onConfirm={async () => {
              if (!confirmingSaveUnit) return;

              setUpdating(true);

              try {
                const original = units.find(u => u.id === confirmingSaveUnit.id);
                if (!original) return;

                const hasActiveChange =
                  original.isActive !== confirmingSaveUnit.isActive;

                const hasFieldChanges = isDirty(original, confirmingSaveUnit);

                // 1. ACTIVE CHANGE
                if (hasActiveChange) {
                  if (confirmingSaveUnit.isActive) {
                    await activateUnit(confirmingSaveUnit.id);
                  } else {
                    await deactivateUnit(confirmingSaveUnit.id);
                  }
                }

                // 2. FIELD CHANGE
                if (hasFieldChanges) {
                  await updateUnit(
                    confirmingSaveUnit.id,
                    confirmingSaveUnit.unitName,
                    confirmingSaveUnit.unitDescription
                  );
                }

                // cleanup
                setDraftMap((prev) => {
                  const next = { ...prev };
                  delete next[confirmingSaveUnit.id];
                  return next;
                });

                setEditingId(null);

                if (
                  hasActiveChange &&
                  !confirmingSaveUnit.isActive &&
                  confirmingSaveUnit.id === selectedUnitId
                ) {
                  onClearSelection?.();
                }

                onUnitServerStateChanged?.();

              } finally {
                setUpdating(false);
                setConfirmingSaveUnit(null);
              }
            }}
          />
        )}
      </div>
    </Popup>
  );
}