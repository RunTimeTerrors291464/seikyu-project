"use client";

import RuleInput from "@/components/ui/RuleInput";
import { Dictionary } from "@/lib/lang/i18n";
import {
  Barcode,
  Download,
  Filter,
  Package,
  Plus,
  RotateCcw
} from "lucide-react";

type Props = {
  dict: Dictionary;

  search: string;
  searchRule: "sku" | "productName";

  setSearch: (v: string) => void;
  setSearchRule: (v: "sku" | "productName") => void;

  toggleFilters: () => void;
  resetSearch: () => void;

  onExport?: () => void;
  onAddProduct?: () => void;
};

export default function ProductTableToolbar({
  dict,
  setSearch,
  setSearchRule,
  toggleFilters,
  resetSearch,
  onExport,
  onAddProduct
}: Props) {

  return (
    <div className="flex items-center justify-between">

      <h1 className="text-xl font-semibold text-text">
        {dict.productInventory}
      </h1>

      {/* SEARCH */}

      <RuleInput
        options={[
          {
            label: dict.sku,
            icon: <Barcode className="h-3 w-3" />
          },
          {
            label: dict.name,
            icon: <Package className="h-3 w-3" />
          }
        ]}
        placeholder={dict.searchPlaceholder}
        onChange={({ rule, value }) => {

          const ruleMap: Record<string, "sku" | "productName"> = {
            [dict.sku]: "sku",
            [dict.name]: "productName"
          };

          setSearchRule(ruleMap[rule]);
          setSearch(value);

        }}
      />

      {/* ACTIONS */}

      <div className="flex items-center gap-2">

        {/* FILTER */}

        <button
          onClick={toggleFilters}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted hover:bg-border"
        >
          <Filter className="h-3.5 w-3.5" />
          {dict.filter}
        </button>

        {/* RESET */}

        <button
          onClick={resetSearch}
          className="inline-flex items-center justify-center rounded-md border border-border bg-card px-2 py-1.5 text-muted hover:bg-border"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* EXPORT */}

        <button
          onClick={onExport}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted hover:bg-border"
        >
          <Download className="h-3.5 w-3.5" />
          {dict.export}
        </button>

        {/* ADD PRODUCT */}

        <button
          onClick={onAddProduct}
          className="inline-flex items-center gap-1 rounded-md bg-text px-3 py-1.5 text-xs font-medium text-bg"
        >
          <Plus className="h-3.5 w-3.5" />
          {dict.addProduct}
        </button>

      </div>
    </div>
  );
}