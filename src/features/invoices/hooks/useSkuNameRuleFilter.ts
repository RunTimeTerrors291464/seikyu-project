"use client";

import { useCallback, useMemo, useState } from "react";

export type SkuNameFilterRule = "sku" | "productName";

type SkuNameSearchableRow = {
  productSku: string;
  productName: string;
};

/**
 * Shared filter state for RuleInput search by SKU vs product name (import and return product cards).
 *
 * @param rows - Rows to filter in memory.
 * @returns Search rule, text, filtered rows, and `resetSearch` for e.g. modal open/close.
 */
export function useSkuNameRuleFilter<T extends SkuNameSearchableRow>(
  rows: T[],
): {
  searchRule: SkuNameFilterRule;
  setSearchRule: (rule: SkuNameFilterRule) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  filteredRows: T[];
  resetSearch: () => void;
} {
  const [searchRule, setSearchRule] = useState<SkuNameFilterRule>("sku");
  const [searchText, setSearchText] = useState<string>("");

  const filteredRows = useMemo(() => {
    if (!searchText) {
      return rows;
    }

    const keyword = searchText.toLowerCase();

    return rows.filter((row) => {
      const target =
        searchRule === "sku" ? row.productSku : row.productName;

      return target.toLowerCase().includes(keyword);
    });
  }, [rows, searchRule, searchText]);

  const resetSearch = useCallback(function resetSearch(): void {
    setSearchRule("sku");
    setSearchText("");
  }, []);

  return {
    searchRule,
    setSearchRule,
    searchText,
    setSearchText,
    filteredRows,
    resetSearch,
  };
}
