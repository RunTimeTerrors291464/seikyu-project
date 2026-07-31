"use client";

import { useCallback, useState } from "react";

/** Shared selection state for invoice-list checkbox columns. */
export function useInvoiceListSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const toggleOne = useCallback(function toggleOne(
    id: string,
    checked: boolean,
  ): void {
    setSelectedIds(function updateSelection(previous) {
      const next = new Set(previous);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleMany = useCallback(function toggleMany(
    ids: readonly string[],
    checked: boolean,
  ): void {
    setSelectedIds(function updateSelection(previous) {
      const next = new Set(previous);
      ids.forEach(function updateId(id): void {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  }, []);

  const clearSelection = useCallback(function clearSelection(): void {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    toggleOne,
    toggleMany,
    clearSelection,
  };
}
