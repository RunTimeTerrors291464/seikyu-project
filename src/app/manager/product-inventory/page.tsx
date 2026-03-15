"use client";

import { useMemo, useState } from "react";

import DataTable from "@/components/ui/DataTable";
import KpiTile from "@/components/ui/KpiTile";
import TablePagination from "@/components/ui/TablePagination";

import ProductTableToolbar from "@/features/products/components/ProductTableToolbar";
import { productColumns } from "@/features/products/table/productColumns";

import {
  PRODUCT_STOCK_STATUS_OPTIONS,
  ProductStockStatus
} from "@/features/products/filters/productFilters";
import { useDict } from "@/lib/lang/DictProvider";
import { useProducts } from "@features/products/hooks/useProducts";

import type { ProductQuery } from "@/features/products/services/product.service";

export default function ProductInventoryPage() {

  const dict = useDict();

  /* ---------------- SEARCH ---------------- */

  const [search, setSearch] = useState("");
  const [searchRule, setSearchRule] =
    useState<"sku" | "productName">("sku");

  /* ---------------- FILTERS ---------------- */

  const [showFilters, setShowFilters] = useState(false);

  const [statusFilter, setStatusFilter] =
    useState<ProductStockStatus>("all");

  const [activeFilter, setActiveFilter] =
    useState<"all" | "active" | "inactive">("all");

  /* ---------------- PAGINATION ---------------- */

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ---------------- QUERY ---------------- */

  const query: ProductQuery = useMemo(() => {

    const activeMap = {
      all: "all",
      active: "true",
      inactive: "false"
    } as const;

    return {

      page,
      limit: rowsPerPage,

      search: search || undefined,

      searchBy: search
        ? searchRule
        : undefined,

      stockStatus: statusFilter,

      active: activeMap[activeFilter]

    };

  }, [
    page,
    rowsPerPage,
    search,
    searchRule,
    statusFilter,
    activeFilter
  ]);

  /* ---------------- API ---------------- */

  const { products, total, loading } =
    useProducts(query);

  /* ---------------- TABLE ---------------- */

  const columns = productColumns(dict);

  const totalPages =
    Math.ceil(total / rowsPerPage);

  /* ---------------- KPI ---------------- */

  const totalProducts = total;

  const inventoryValue = useMemo(() => {

    return products.reduce(
      (sum, p) =>
        sum + p.importPrice * p.inventoryStock,
      0
    );

  }, [products]);

  const inStock = useMemo(() => {

    return products.filter(
      (p) => p.stockStatus === 0
    ).length;

  }, [products]);

  const lowStock = useMemo(() => {

    return products.filter(
      (p) => p.stockStatus === 1
    ).length;

  }, [products]);

  const outStock = useMemo(() => {

    return products.filter(
      (p) => p.stockStatus === 2
    ).length;

  }, [products]);

  /* ---------------- UI ---------------- */

  return (

    <div className="flex min-h-0 grow flex-col space-y-6">

      {/* HEADER */}

      <ProductTableToolbar
        dict={dict}
        search={search}
        searchRule={searchRule}

        setSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}

        setSearchRule={(v) => {
          setSearchRule(v);
          setPage(1);
        }}

        toggleFilters={() =>
          setShowFilters(v => !v)
        }

        resetSearch={() => {
          setSearch("");
          setPage(1);
        }}
      />

      {/* KPI */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">

        <KpiTile
          label={dict.totalProducts}
          value={totalProducts}
        />

        <KpiTile
          label={dict.inStock}
          value={inStock}
          accent="emerald"
        />

        <KpiTile
          label={dict.lowStock}
          value={lowStock}
          accent="amber"
        />

        <KpiTile
          label={dict.outOfStock}
          value={outStock}
          accent="amber"
        />

        <KpiTile
          label={dict.inventoryValue}
          value={`${(inventoryValue / 1_000_000).toFixed(2)}M`}
          accent="blue"
        />

      </div>

      {/* FILTER PANEL */}

      {showFilters && (

        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3">

          <span className="text-xs text-muted">
            {dict.stockStatus}
          </span>

          {PRODUCT_STOCK_STATUS_OPTIONS.map((opt) => (

            <button
              key={opt.value}

              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}

              className={`rounded-full px-2.5 py-0.5 text-xs ${statusFilter === opt.value
                ? "bg-text text-bg"
                : "border border-border bg-card text-muted"
                }`}
            >

              {dict[opt.dictKey]}

            </button>

          ))}

        </div>

      )}

      {/* TABLE */}

      <div className="min-h-0 grow rounded-lg border border-border bg-card shadow-sm">

        {loading ? (

          <div className="flex h-full items-center justify-center text-muted">
            {dict.loadingProducts}
          </div>

        ) : (

          <DataTable
            columns={columns}
            data={products}
            getRowId={(p) => p.id}
            showIndex
            maxHeight="fill"
          />

        )}

      </div>

      {/* PAGINATION */}

      <TablePagination
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}

        setRowsPerPage={(n) => {
          setRowsPerPage(n);
          setPage(1);
        }}

        setPage={setPage}

        totalResults={total}

        dict={dict}
      />

    </div>
  );
}