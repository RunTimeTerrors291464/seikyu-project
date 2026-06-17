"use client";

import {
  buildListDateRangeIso,
  getDefaultListCalendarDateRange,
  type ListDateRangeIso,
} from "@/lib/datetime/listDateRange";
import { useCallback, useMemo, useState } from "react";

export type InvoiceListDateRangeFilterState = {
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  listDateRange: Partial<ListDateRangeIso>;
  isDefaultRange: boolean;
  resetDateRange: () => void;
};

/**
 * Shared calendar-date state for invoice list pages (`fromDate` / `toDate` query params).
 */
export function useInvoiceListDateRangeFilter(): InvoiceListDateRangeFilterState {
  const defaultRange = useMemo(
    function getDefaultRange() {
      return getDefaultListCalendarDateRange();
    },
    [],
  );

  const [fromDate, setFromDate] = useState<string>(defaultRange.fromDate);
  const [toDate, setToDate] = useState<string>(defaultRange.toDate);

  const listDateRange = useMemo(
    function buildListDateRange(): Partial<ListDateRangeIso> {
      return buildListDateRangeIso(fromDate, toDate) ?? {};
    },
    [fromDate, toDate],
  );

  const isDefaultRange =
    fromDate === defaultRange.fromDate && toDate === defaultRange.toDate;

  const resetDateRange = useCallback(function resetDateRange(): void {
    const nextDefault = getDefaultListCalendarDateRange();
    setFromDate(nextDefault.fromDate);
    setToDate(nextDefault.toDate);
  }, []);

  return {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    listDateRange,
    isDefaultRange,
    resetDateRange,
  };
}
