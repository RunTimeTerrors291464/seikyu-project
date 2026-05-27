import type { ShortcutChord } from "@/lib/shortcuts/types";

export const INVOICE_DRAFT_TABLE_SELECT_FIRST_SHORTCUT_ID =
  "invoice.draft-table.select-first";

export const INVOICE_DRAFT_TABLE_ROW_UP_SHORTCUT_ID =
  "invoice.draft-table.row-up";

export const INVOICE_DRAFT_TABLE_ROW_DOWN_SHORTCUT_ID =
  "invoice.draft-table.row-down";

export const INVOICE_DRAFT_TABLE_SHORTCUT_PRIORITY = 2000;

export const INVOICE_DRAFT_TABLE_SELECT_FIRST_FALLBACK_LABEL =
  "Select first product row";

export const INVOICE_DRAFT_TABLE_ROW_UP_FALLBACK_LABEL = "Previous product row";

export const INVOICE_DRAFT_TABLE_ROW_DOWN_FALLBACK_LABEL = "Next product row";

/** US QWERTY apostrophe (Ctrl+Shift+Quote). */
export const INVOICE_DRAFT_TABLE_SELECT_FIRST_CHORD: ShortcutChord = {
  ctrl: true,
  shift: true,
  code: "Quote",
};

/** Layout fallback when apostrophe is emitted as `event.key`. */
export const INVOICE_DRAFT_TABLE_SELECT_FIRST_KEY_CHORD: ShortcutChord = {
  ctrl: true,
  key: "'",
};

export const INVOICE_DRAFT_TABLE_ROW_UP_CHORD: ShortcutChord = {
  code: "ArrowUp",
};

export const INVOICE_DRAFT_TABLE_ROW_DOWN_CHORD: ShortcutChord = {
  code: "ArrowDown",
};

/** Marks the products-table search field so arrow shortcuts do not steal focus. */
export const INVOICE_DRAFT_TABLE_SEARCH_DATA_ATTR = "data-invoice-draft-table-search";

/**
 * Returns false when arrow / select-first shortcuts should not run (textarea, table search).
 *
 * @param target - `KeyboardEvent.target`.
 * @returns Whether table row navigation may handle the key.
 */
export function shouldHandleInvoiceDraftTableRowNavigation(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.tagName === "TEXTAREA") {
    return false;
  }

  if (target.closest(`[${INVOICE_DRAFT_TABLE_SEARCH_DATA_ATTR}]`)) {
    return false;
  }

  return true;
}

/**
 * Resolves the index of the active row in the visible (filtered) list.
 *
 * @param visibleRows - Rows currently shown in the table.
 * @param activeEditRowId - `localId` of the row being edited, if any.
 * @returns Zero-based index, or `-1` when none is active.
 */
export function resolveInvoiceDraftTableRowIndex(
  visibleRows: { localId: string }[],
  activeEditRowId: string | null,
): number {
  if (activeEditRowId == null) {
    return -1;
  }

  return visibleRows.findIndex(function matchActiveRow(row): boolean {
    return row.localId === activeEditRowId;
  });
}

/**
 * Computes the next row index after moving up or down.
 *
 * @param visibleRowCount - Number of rows in the filtered table.
 * @param currentIndex - Active row index, or `-1` when none selected.
 * @param delta - `-1` for up, `1` for down.
 * @returns Clamped index in `0..visibleRowCount - 1`.
 */
export function resolveInvoiceDraftTableRowIndexAfterMove(
  visibleRowCount: number,
  currentIndex: number,
  delta: -1 | 1,
): number {
  if (visibleRowCount <= 0) {
    return -1;
  }

  if (currentIndex < 0) {
    return delta > 0 ? 0 : visibleRowCount - 1;
  }

  const nextIndex = currentIndex + delta;
  return Math.min(Math.max(nextIndex, 0), visibleRowCount - 1);
}
