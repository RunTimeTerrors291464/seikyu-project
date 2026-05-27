"use client";

import {
  INVOICE_DRAFT_TABLE_ROW_DOWN_CHORD,
  INVOICE_DRAFT_TABLE_ROW_DOWN_FALLBACK_LABEL,
  INVOICE_DRAFT_TABLE_ROW_DOWN_SHORTCUT_ID,
  INVOICE_DRAFT_TABLE_ROW_UP_CHORD,
  INVOICE_DRAFT_TABLE_ROW_UP_FALLBACK_LABEL,
  INVOICE_DRAFT_TABLE_ROW_UP_SHORTCUT_ID,
  INVOICE_DRAFT_TABLE_SELECT_FIRST_CHORD,
  INVOICE_DRAFT_TABLE_SELECT_FIRST_FALLBACK_LABEL,
  INVOICE_DRAFT_TABLE_SELECT_FIRST_KEY_CHORD,
  INVOICE_DRAFT_TABLE_SELECT_FIRST_SHORTCUT_ID,
  INVOICE_DRAFT_TABLE_SHORTCUT_PRIORITY,
  resolveInvoiceDraftTableRowIndex,
  resolveInvoiceDraftTableRowIndexAfterMove,
  shouldHandleInvoiceDraftTableRowNavigation,
} from "@/features/invoices/lib/invoiceDraftTableShortcuts";
import useShortcut from "@/lib/shortcuts/useShortcut";
import { UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE } from "@/lib/shortcuts/universalShortcut";
import { useCallback } from "react";

type InvoiceDraftTableRow = {
  localId: string;
};

type UseInvoiceDraftTableRowNavigationOptions<TRow extends InvoiceDraftTableRow> = {
  enabled: boolean;
  visibleRows: TRow[];
  activeEditRowId: string | null;
  onSelectRow: (row: TRow) => void;
};

/**
 * Registers Ctrl+' (select first row) and arrow up/down shortcuts for invoice draft product tables.
 *
 * @param options - Visible rows, active row id, and select handler from the create popup.
 */
export function useInvoiceDraftTableRowNavigation<TRow extends InvoiceDraftTableRow>(
  options: UseInvoiceDraftTableRowNavigationOptions<TRow>,
): void {
  const { enabled, visibleRows, activeEditRowId, onSelectRow } = options;

  const selectRowAtIndex = useCallback(
    function selectRowAtIndex(index: number): void {
      const row = visibleRows[index];
      if (row) {
        onSelectRow(row);
      }
    },
    [onSelectRow, visibleRows],
  );

  const handleSelectFirstRow = useCallback(
    function handleSelectFirstRow(event: KeyboardEvent): void {
      if (!shouldHandleInvoiceDraftTableRowNavigation(event.target)) {
        return;
      }

      if (visibleRows.length > 0) {
        selectRowAtIndex(0);
      }
    },
    [selectRowAtIndex, visibleRows.length],
  );

  const handleMoveRow = useCallback(
    function handleMoveRow(event: KeyboardEvent, delta: -1 | 1): void {
      if (!shouldHandleInvoiceDraftTableRowNavigation(event.target)) {
        return;
      }

      if (visibleRows.length === 0) {
        return;
      }

      const currentIndex = resolveInvoiceDraftTableRowIndex(
        visibleRows,
        activeEditRowId,
      );
      const nextIndex = resolveInvoiceDraftTableRowIndexAfterMove(
        visibleRows.length,
        currentIndex,
        delta,
      );
      selectRowAtIndex(nextIndex);
    },
    [activeEditRowId, selectRowAtIndex, visibleRows],
  );

  const handleRowUp = useCallback(
    function handleRowUp(event: KeyboardEvent): void {
      handleMoveRow(event, -1);
    },
    [handleMoveRow],
  );

  const handleRowDown = useCallback(
    function handleRowDown(event: KeyboardEvent): void {
      handleMoveRow(event, 1);
    },
    [handleMoveRow],
  );

  const shortcutsEnabled = enabled && visibleRows.length > 0;

  useShortcut({
    id: INVOICE_DRAFT_TABLE_SELECT_FIRST_SHORTCUT_ID,
    chord: INVOICE_DRAFT_TABLE_SELECT_FIRST_CHORD,
    handler: handleSelectFirstRow,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: shortcutsEnabled,
    priority: INVOICE_DRAFT_TABLE_SHORTCUT_PRIORITY,
    label: INVOICE_DRAFT_TABLE_SELECT_FIRST_FALLBACK_LABEL,
  });

  useShortcut({
    id: `${INVOICE_DRAFT_TABLE_SELECT_FIRST_SHORTCUT_ID}.key`,
    chord: INVOICE_DRAFT_TABLE_SELECT_FIRST_KEY_CHORD,
    handler: handleSelectFirstRow,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: shortcutsEnabled,
    priority: INVOICE_DRAFT_TABLE_SHORTCUT_PRIORITY,
    label: INVOICE_DRAFT_TABLE_SELECT_FIRST_FALLBACK_LABEL,
  });

  useShortcut({
    id: INVOICE_DRAFT_TABLE_ROW_UP_SHORTCUT_ID,
    chord: INVOICE_DRAFT_TABLE_ROW_UP_CHORD,
    handler: handleRowUp,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: shortcutsEnabled,
    priority: INVOICE_DRAFT_TABLE_SHORTCUT_PRIORITY,
    label: INVOICE_DRAFT_TABLE_ROW_UP_FALLBACK_LABEL,
  });

  useShortcut({
    id: INVOICE_DRAFT_TABLE_ROW_DOWN_SHORTCUT_ID,
    chord: INVOICE_DRAFT_TABLE_ROW_DOWN_CHORD,
    handler: handleRowDown,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: shortcutsEnabled,
    priority: INVOICE_DRAFT_TABLE_SHORTCUT_PRIORITY,
    label: INVOICE_DRAFT_TABLE_ROW_DOWN_FALLBACK_LABEL,
  });
}
