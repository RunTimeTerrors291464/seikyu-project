"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import TablePagination from "@/components/ui/TablePagination";
import useFocusFirstFormControlOnOpen from "@/lib/hooks/useFocusFirstFormControlOnOpen";
import { useDict } from "@/lib/lang/DictProvider";
import { CircleOff, Plus, PowerCircle, Ruler } from "lucide-react";
import { useEffect, useState } from "react";

import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useProductUnit } from "../hooks/useProductUnit";
import { ProductUnit } from "../services/product.unit.service";
import { unitColumns } from "../table/unitColumns";
import AddUnitPopup from "./AddUnitPopup";

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

/* ─────────────────────────────────────────────────────────
   Main UnitPickerPopup
   ───────────────────────────────────────────────────────── */

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
  const [addOpen, setAddOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMap, setDraftMap] = useState<Record<string, ProductUnit>>({});

  const [updating, setUpdating] = useState(false);

  const [confirmingActiveUnit, setConfirmingActiveUnit] = useState<ProductUnit | null>(null);
  const [confirmingSaveUnit, setConfirmingSaveUnit] = useState<ProductUnit | null>(null);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  const {
    units,
    loading,
    createUnit,
    updateUnit,
    activateUnit,
    deactivateUnit,
  } = useProductUnit(search, open);

  const isDirty = useIsDirty<ProductUnit>();
  const formFieldsRef = useFocusFirstFormControlOnOpen({
    when: open,
    bumpKey: 0,
  });

  useEffect(
    function resetPickerStateWhenClosed(): void {
      if (open) {
        return;
      }

      setSearch("");
      setAddOpen(false);
      setEditingId(null);
      setDraftMap({});
      setPage(1);
      setRowsPerPage(30);
    },
    [open],
  );

  /* ───────── Pagination ───────── */

  const totalResults = units.length;
  const totalPages = totalResults === 0 ? 1 : Math.ceil(totalResults / rowsPerPage);

  const paginatedUnits = units.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  /* ───────── Add handler ───────── */

  async function handleAdd(name: string, desc: string) {
    const unit = await createUnit(name, desc);
    setAddOpen(false);
    onSelect(unit);
    onClose();
  }

  if (!open) return null;

  return (
    <Popup open={open} onClose={onClose}>
      <div ref={formFieldsRef} className="flex bg-bg flex-col max-w-[50vw] max-h-[70vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border">

          {/* LEFT: Title */}
          <span className="flex items-center text-sm font-semibold text-text gap-2 whitespace-nowrap">
            <Ruler className="h-4 w-4" />
            {dict.unit}
          </span>

          {/* CENTER: SEARCH */}
          <div className="w-xl" data-universal-search-root="">
            <Input
              value={search}
              onChange={setSearch}
              placeholder={dict.searchPlaceholder}
            />
          </div>

          {/* RIGHT: Add button */}
          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setAddOpen(true)}
            accent="primary"
          >
            {dict.add}
          </Button>

        </div>

        {/* TABLE */}
        <div className="grow min-h-0 flex flex-col p-4">
          <DataTable<ProductUnit>
            data={paginatedUnits}
            loading={loading}
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
                  [unit.id]: { ...unit },
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
            setRowsPerPage={setRowsPerPage}
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

                if (hasActiveChange) {
                  if (confirmingSaveUnit.isActive) {
                    await activateUnit(confirmingSaveUnit.id);
                  } else {
                    await deactivateUnit(confirmingSaveUnit.id);
                  }
                }

                if (hasFieldChanges) {
                  await updateUnit(
                    confirmingSaveUnit.id,
                    confirmingSaveUnit.unitName,
                    confirmingSaveUnit.unitDescription
                  );
                }

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

      <AddUnitPopup
        open={addOpen}
        units={units}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
    </Popup>
  );
}
