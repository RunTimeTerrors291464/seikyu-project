"use client";

import { useEffect, useState } from "react";

import DataTable from "@/components/ui/DataTable";
import KpiTile from "@/components/ui/KpiTile";
import TablePagination from "@/components/ui/TablePagination";

import { productColumns } from "@/features/products/table/productColumns";

import { ProductStatusFilter, ProductStockFilter } from "@/components/types/ui";
import { PRODUCT_STATUS_OPTIONS, PRODUCT_STOCK_STATUS_OPTIONS } from "@/features/products/filters/productFilters";
import { useDict } from "@/lib/lang/DictProvider";

import { useProductTable } from "@/features/products/hooks/useProductTable";

import type { ProductQuery } from "@/features/products/services/product.service";

import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
} from "lucide-react";

import {
  getProductOverview,
  productService,
} from "@/features/products/services/product.service";

import ProductTableHeader from "@/features/products/components/ProductTableHeader";
import { useIsDirty } from "@/lib/hooks/useIsDirty";

/* ============================= */
/* PAGE */
/* ============================= */

export default function ProductInventoryPage() {
  const dict = useDict();

  /* ============================= */
  /* UI STATE (LOCAL ONLY) */
  /* ============================= */

  const [search, setSearch] = useState("");
  const [searchRule, setSearchRule] =
    useState<"sku" | "productName">("sku");

  const [showFilters, setShowFilters] = useState(false);

  const [statusFilter, setStatusFilter] =
    useState<ProductStockFilter>("all");

  const [activeFilter, setActiveFilter] =
    useState<ProductStatusFilter>("all");

  const defaultFilters = {
    search: "",
    searchRule: "sku",
    statusFilter: "all" as ProductStockFilter,
    activeFilter: "all" as ProductStatusFilter,
  };

  const currentFilters = {
    search,
    searchRule,
    statusFilter,
    activeFilter,
  };

  const isDirty = useIsDirty<typeof defaultFilters>()(
    defaultFilters,
    currentFilters
  );

  /* ============================= */
  /* SERVER TABLE (SOURCE OF TRUTH) */
  /* ============================= */

  const table = useProductTable({
    fetcher: productService.getProducts,

    initialQuery: {
      page: 1,
      limit: 30,
      search: undefined,
      searchBy: undefined,
      sortBy: "sku",
      sortOrder: "asc",
      stockStatus: "all",
      isActive: "all",
    } as ProductQuery,
  });

  /* ============================= */
  /* OVERVIEW */
  /* ============================= */

  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    getProductOverview()
      .then((res) => {
        if (mounted) setOverview(res);
      })
      .finally(() => setOverviewLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    table.setFilters({
      search: search || undefined,
      searchBy: search ? searchRule : undefined,
    });
  }, [search, searchRule]);

  /* ============================= */
  /* RESET HANDLER (FIXED) */
  /* ============================= */

  function handleReset() {
    setSearch("");
    setSearchRule("sku");
    setStatusFilter("all");
    setActiveFilter("all");

    table.resetQuery(); // must exist in hook
  }

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden max-h-[100vh]">

      {/* HEADER */}
      <ProductTableHeader
        dict={dict}
        search={search}
        searchRule={searchRule}
        setSearch={setSearch}
        setSearchRule={(v) => {
          setSearchRule(v);
          table.setPage(1);
        }}
        toggleFilters={() => setShowFilters((v) => !v)}
        resetSearch={handleReset}
        isDirty={isDirty}
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
                ? `${(Number(overview.inventoryValue) / 1_000_000).toFixed(2)}M`
                : "-"
            }
            icon={<DollarSign className="h-4 w-4 text-muted" />}
            accent="primary"
            helpText={dict.inventoryValueHelp}
            sub={dict.inventoryValueSub}
          />
        </div>
      )}

      {/* FILTERS */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">

          {/* STOCK */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {dict.stock}
            </span>

            <div className="flex gap-1">
              {PRODUCT_STOCK_STATUS_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    setStatusFilter(opt.value);

                    table.setFilters({
                      stockStatus: String(opt.value) as ProductQuery["stockStatus"],
                    });
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${statusFilter === opt.value
                    ? "border-text bg-text text-bg"
                    : "border-border bg-card text-muted"
                    }`}
                >
                  {dict[opt.dictKey]}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {dict.status}
            </span>

            <div className="flex gap-1">
              {PRODUCT_STATUS_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    setActiveFilter(opt.value as any);

                    table.setFilters({
                      isActive: opt.value as ProductQuery["isActive"],
                    });
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${activeFilter === opt.value
                    ? "border-text bg-text text-bg"
                    : "border-border bg-card text-muted"
                    }`}
                >
                  {dict[opt.dictKey]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="min-h-0 flex flex-col">
        <DataTable
          columns={productColumns(dict)}
          data={table.data}
          loading={table.loading}
          getRowId={(p) => p.id}
          showIndex
          sortField={table.query.sortBy}
          sortDirection={table.query.sortOrder}
          onSort={(field) =>
            table.setSort(field as ProductQuery["sortBy"])
          }
          maxHeight="fill"
        />
      </div>

      {/* PAGINATION */}
      <TablePagination
        page={table.query.page ?? 1}
        totalPages={table.totalPages}
        rowsPerPage={table.query.limit ?? 10}
        setRowsPerPage={table.setLimit}
        setPage={table.setPage}
        totalResults={table.total}
        dict={dict}
      />
    </div>
  );
}