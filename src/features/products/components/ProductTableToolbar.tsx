"use client";

import Button from "@/components/ui/Buttons";
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
    <div className="flex items-center justify-between gap-4">

      {/* ───────── TITLE ───────── */}

      <h1 className="text-lg font-semibold text-text">
        {dict.productInventory}
      </h1>

      {/* ───────── SEARCH ───────── */}

      <div className="w-full max-w-md">
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
      </div>

      {/* ───────── ACTIONS ───────── */}

      <div className="flex items-center gap-2">

        {/* FILTER */}
        <Button
          icon={<Filter className="h-3.5 w-3.5" />}
          onClick={toggleFilters}
        >
          {dict.filter}
        </Button>

        {/* RESET */}
        <Button
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={resetSearch}
        >
          {dict.resetfilter}
        </Button>

        {/* EXPORT */}
        <Button
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={onExport}
        >
          {dict.export}
        </Button>

        {/* ADD PRODUCT */}
        <Button
          accent="primary"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={onAddProduct}
        >
          {dict.addProduct}
        </Button>

      </div>

    </div>
  );
}