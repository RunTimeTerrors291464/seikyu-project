"use client";

import { useCallback, useState } from "react";

type UseInvoiceReturnChildrenExpansionOptions<TRow> = {
  rows: TRow[];
  getRowId: (row: TRow) => string;
  getReturnCount: (row: TRow) => number;
  getInvoiceNumber: (row: TRow) => string | null;
  fetchChildren: (invoiceNumber: string) => Promise<unknown[]>;
};

/**
 * Lazy-loads and caches return-invoice rows shown under expandable parent list rows.
 */
export function useInvoiceReturnChildrenExpansion<TRow>(
  options: UseInvoiceReturnChildrenExpansionOptions<TRow>,
) {
  const { rows, getRowId, getReturnCount, getInvoiceNumber, fetchChildren } =
    options;

  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [childrenByParentId, setChildrenByParentId] = useState<
    Record<string, unknown[]>
  >({});
  const [childrenLoading, setChildrenLoading] = useState<Record<string, boolean>>(
    {},
  );

  const handleToggleExpandRow = useCallback(
    function handleToggleExpandRow(rowId: string | number): void {
      const id = String(rowId);

      if (expandedRowIds.has(id)) {
        setExpandedRowIds(function collapseExpanded(previous) {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
        setChildrenByParentId(function dropCache(current) {
          const copy = { ...current };
          delete copy[id];
          return copy;
        });
        setChildrenLoading(function clearLoading(current) {
          const copy = { ...current };
          delete copy[id];
          return copy;
        });
        return;
      }

      if (childrenLoading[id]) {
        return;
      }

      const row = rows.find(function matchRow(candidate) {
        return getRowId(candidate) === id;
      });

      if (!row || getReturnCount(row) <= 0) {
        return;
      }

      setExpandedRowIds(function expandRow(previous) {
        if (previous.has(id)) {
          return previous;
        }

        const next = new Set(previous);
        next.add(id);
        return next;
      });

      setChildrenLoading(function setLoading(current) {
        return { ...current, [id]: true };
      });

      void (async function loadChildren(): Promise<void> {
        try {
          const invoiceNumber = getInvoiceNumber(row)?.trim() ?? "";

          if (!invoiceNumber) {
            setChildrenByParentId(function setEmpty(previous) {
              return { ...previous, [id]: [] };
            });
            return;
          }

          const children = await fetchChildren(invoiceNumber);
          setChildrenByParentId(function mergeChildren(previous) {
            return { ...previous, [id]: children };
          });
        } catch (error) {
          console.error("Failed to fetch return invoices", error);
          setChildrenByParentId(function setEmpty(previous) {
            return { ...previous, [id]: [] };
          });
        } finally {
          setChildrenLoading(function finishLoading(previous) {
            return { ...previous, [id]: false };
          });
        }
      })();
    },
    [
      childrenLoading,
      expandedRowIds,
      fetchChildren,
      getInvoiceNumber,
      getReturnCount,
      getRowId,
      rows,
    ],
  );

  const resetExpansion = useCallback(function resetExpansion(): void {
    setExpandedRowIds(new Set());
    setChildrenByParentId({});
    setChildrenLoading({});
  }, []);

  const hasExpandedRows = expandedRowIds.size > 0;

  return {
    expandedRowIds,
    childrenByParentId,
    childrenLoading,
    handleToggleExpandRow,
    resetExpansion,
    hasExpandedRows,
  };
}
