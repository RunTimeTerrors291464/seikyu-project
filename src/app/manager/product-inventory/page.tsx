"use client";

import { useMemo, useState } from "react";

import DataTable from "@/components/ui/DataTable";
import KpiTile from "@/components/ui/KpiTile";
import TablePagination from "@/components/ui/TablePagination";

import ProductTableToolbar from "@/features/products/components/ProductTableToolbar";
import { productColumns } from "@/features/products/table/productColumns";

import { ProductStockFilter } from "@/components/types/ui";
import { PRODUCT_STOCK_STATUS_OPTIONS } from "@/features/products/filters/productFilters";
import { useDict } from "@/lib/lang/DictProvider";

import { useTable } from "@/lib/table/useTable";

import type { ProductQuery } from "@/features/products/services/product.service";

import { AlertTriangle, Boxes, DollarSign, Package } from "lucide-react";

import { useProductOverview, useProducts } from "@/features/products/hooks/useProducts";
import { Product } from "@/features/products/types/product";
import useDebounce from "@/lib/hooks/useDebounce";

/* ============================= */
/* Helper */
/* ============================= */

function mapStockFilterToApi(
  filter: ProductStockFilter
): "0" | "1" | "2" | undefined {
  if (filter === "all") return undefined;

  return String(filter) as "0" | "1" | "2";
}
/* ============================= */
/* Page */
/* ============================= */

export default function ProductInventoryPage() {
  const dict = useDict();

  /* ---------------- SEARCH ---------------- */

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [searchRule, setSearchRule] =
    useState<"sku" | "productName">("sku");

  /* ---------------- FILTERS ---------------- */

  const [showFilters, setShowFilters] =
    useState(false);

  const [statusFilter, setStatusFilter] =
    useState<ProductStockFilter>("all");

  const [activeFilter, setActiveFilter] =
    useState<"all" | "active" | "inactive">("all");

  /* ---------------- PAGINATION ---------------- */

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] =
    useState(30);

  /* ---------------- QUERY ---------------- */

  const query: ProductQuery = useMemo(() => {
    return {
      page,
      limit: rowsPerPage,

      search: debouncedSearch || undefined,

      searchBy: debouncedSearch
        ? searchRule
        : undefined,

      stockStatus: mapStockFilterToApi(statusFilter),

      isActive:
        activeFilter === "all"
          ? undefined
          : activeFilter === "active"
            ? "true"
            : "false",
    };
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    searchRule,
    statusFilter,
    activeFilter,
  ]);

  /* ---------------- API ---------------- */

  const { products, total, loading } =
    useProducts(query);

  /* ---------------- OVERVIEW ---------------- */

  const {
    data: overview,
    loading: overviewLoading,
  } = useProductOverview();

  /* ---------------- TABLE ---------------- */

  const columns = productColumns(dict);

  const table = useTable<Product>(
    products,
    columns
  );

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <div className="flex grow flex-col space-y-6">

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
          setShowFilters((v) => !v)
        }

        resetSearch={() => {
          setSearch("");
          setSearchRule("sku");
          setStatusFilter("all");
          setActiveFilter("all");
          setPage(1);
        }}
      />

      {/* KPI */}

      {overviewLoading ? (
        <div className="flex items-center justify-center py-6 text-sm text-muted">
          {dict.loadingProducts}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">

          <KpiTile
            label={dict.totalProducts}
            value={overview?.totalProducts ?? "-"}
            icon={<Package className="h-4 w-4 text-muted" />}
            helpText={dict.totalProductsHelp}
            sub={dict.totalProductsSub}
          />

          <KpiTile
            label={dict.inStock}
            value={overview?.inStock ?? "-"}
            icon={<Boxes className="h-4 w-4 text-muted" />}
            accent="success"
            helpText={dict.inStockHelp}
            sub={dict.inStockSub}
          />

          <KpiTile
            label={dict.lowStock}
            value={overview?.lowStock ?? "-"}
            icon={<AlertTriangle className="h-4 w-4 text-muted" />}
            accent="warning"
            helpText={dict.lowStockHelp}
            sub={dict.lowStockSub}
          />

          <KpiTile
            label={dict.outOfStock}
            value={overview?.outOfStock ?? "-"}
            icon={<AlertTriangle className="h-4 w-4 text-muted" />}
            accent="danger"
            helpText={dict.outOfStockHelp}
            sub={dict.outOfStockSub}
          />

          <KpiTile
            label={dict.inventoryValue}
            value={
              overview
                ? `${(
                  Number(overview.inventoryValue) /
                  1_000_000
                ).toFixed(2)}M`
                : "-"
            }
            icon={<DollarSign className="h-4 w-4 text-muted" />}
            accent="primary"
            helpText={dict.inventoryValueHelp}
            sub={dict.inventoryValueSub}
          />
        </div>
      )}

      {/* FILTER PANEL */}

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">

          {/* STOCK STATUS */}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {dict.status}
            </span>

            <div className="flex gap-1">

              {PRODUCT_STOCK_STATUS_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setPage(1);
                  }}

                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors
                    ${statusFilter === opt.value
                      ? "border-text bg-text text-bg"
                      : "border-border bg-card text-muted hover:border-text hover:bg-hover"
                    }`}
                >
                  {dict[opt.dictKey]}
                </button>

              ))}
            </div>

          </div>

          {/* DIVIDER */}
          <span className="divider mx-2" />

          {/* ACTIVE STATUS */}

          <div className="flex items-center gap-2">

            <span className="text-xs text-muted">
              {dict.status}
            </span>

            <div className="flex gap-1">

              {[
                { key: "all", label: dict.all },
                { key: "active", label: dict.active },
                { key: "inactive", label: dict.inactive },
              ].map((opt) => (

                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(opt.key as any);
                    setPage(1);
                  }}

                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors
                    ${activeFilter === opt.key
                      ? "border-text bg-text text-bg"
                      : "border-border bg-card text-muted hover:border-text hover:bg-hover"
                    }`}
                >
                  {opt.label}
                </button>

              ))}

            </div>

          </div>

        </div>
      )}

      {/* TABLE */}

      <div className="grow rounded-lg border border-border bg-card shadow-sm">

        {loading ? (

          <div className="flex h-full items-center justify-center text-muted">
            {dict.loadingProducts}
          </div>

        ) : (

          <DataTable
            columns={columns}
            data={table.data}
            getRowId={(p) => p.id}
            showIndex
            sortField={table.sortField}
            sortDirection={table.sortDirection}
            onSort={table.handleSort}
            maxHeight="fill"
          />

        )}

      </div>

      {/* PAGINATION */}

      <TablePagination
        page={page}
        totalPages={Math.ceil(total / rowsPerPage)}
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