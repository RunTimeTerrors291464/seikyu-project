"use client";

import type { Column } from "@/components/ui/DataTable";
import type { Dictionary } from "@/lib/lang/i18n";

type InvoiceListSelectionColumnOptions<TRow> = {
  dict: Dictionary;
  rows: readonly TRow[];
  selectedIds: ReadonlySet<string>;
  getRowId: (row: TRow) => string;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleMany: (ids: readonly string[], checked: boolean) => void;
  isRowSelectable?: (row: TRow) => boolean;
  getDisabledReason?: (row: TRow) => string | undefined;
  showSelectAll?: boolean;
};

/** Builds the shared checkbox column used by manager invoice-list tables. */
export function invoiceListSelectionColumn<TRow>({
  dict,
  rows,
  selectedIds,
  getRowId,
  onToggleOne,
  onToggleMany,
  isRowSelectable = () => true,
  getDisabledReason,
  showSelectAll = true,
}: InvoiceListSelectionColumnOptions<TRow>): Column<TRow> {
  const selectableIds = rows
    .filter(isRowSelectable)
    .map(function mapSelectableId(row): string {
      return getRowId(row);
    });
  const allVisibleSelected =
    selectableIds.length > 0 &&
    selectableIds.every(function isSelected(id): boolean {
      return selectedIds.has(id);
    });

  return {
    id: "select",
    header: "",
    icon: showSelectAll ? (
      <input
        type="checkbox"
        checked={allVisibleSelected}
        disabled={selectableIds.length === 0}
        onChange={function handleToggleAll(event): void {
          onToggleMany(selectableIds, event.target.checked);
        }}
        className="h-4 w-4 rounded border-border"
        aria-label={dict.select}
      />
    ) : undefined,
    accessor: function renderSelection(row) {
      const id = getRowId(row);
      const selectable = isRowSelectable(row);
      return (
        <input
          type="checkbox"
          checked={selectable && selectedIds.has(id)}
          disabled={!selectable}
          title={!selectable ? getDisabledReason?.(row) : undefined}
          onChange={function handleToggleOne(event): void {
            onToggleOne(id, event.target.checked);
          }}
          className="h-4 w-4 rounded border-border disabled:cursor-not-allowed"
          aria-label={dict.select}
        />
      );
    },
    thClassName: "w-8",
    tdClassName: "w-8",
  };
}
