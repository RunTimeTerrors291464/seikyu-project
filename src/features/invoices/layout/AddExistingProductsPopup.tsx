"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ACCENT_STYLES, ProductStatusFilter, ProductStockFilter } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import type { Column } from "@/components/ui/DataTable";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import ActivePill from "@/features/products/components/ActivePill";
import StatusPill from "@/features/products/components/StockStatusPill";
import { PRODUCT_STATUS_OPTIONS, PRODUCT_STOCK_STATUS_OPTIONS } from "@/features/products/filters/productFilters";
import { useProductTable } from "@/features/products/hooks/useProductTable";
import { ProductQuery, productService } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Edit2, Filter, Package, RotateCcw, Ruler, Trash2, Warehouse } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AddExistingProductsPopupProps = {
  open: boolean;
  onClose: () => void;
  excludedProductIds: Set<string>;
  onConfirmSelect: (selectedProducts: Product[]) => void;
};

export default function AddExistingProductsPopup({
  open,
  onClose,
  excludedProductIds,
  onConfirmSelect,
}: AddExistingProductsPopupProps) {
  const dict = useDict();
  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<"sku" | "productName">("sku");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<ProductStockFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ProductStatusFilter>("all");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const initialTableQuery: ProductQuery = {
    page: 1,
    limit: 10,
    search: undefined,
    searchBy: undefined,
    sortBy: "sku",
    sortOrder: "asc",
    stockStatus: "all",
    isActive: "all",
  };

  const table = useProductTable({
    fetcher: productService.getProducts,
    initialQuery: initialTableQuery,
  });

  useEffect(function clearSelectionOnClose(): void {
    if (!open) {
      setSelectedProductIds(new Set());
    }
  }, [open]);

  /**
   * Returns whether a product can be selected in this popup.
   *
   * Inactive products and already-excluded products must never be selectable.
   */
  function isProductSelectable(product: Product): boolean {
    return !excludedProductIds.has(product.id) && product.isActive;
  }

  const selectableRows = useMemo(
    function getSelectableRows(): Product[] {
      return table.data.filter(function filterSelectable(product): boolean {
        return isProductSelectable(product);
      });
    },
    [excludedProductIds, table.data],
  );

  const allSelectableChecked = useMemo(
    function getAllSelectableChecked(): boolean {
      if (selectableRows.length === 0) {
        return false;
      }
      return selectableRows.every(function hasSelection(product): boolean {
        return selectedProductIds.has(product.id);
      });
    },
    [selectableRows, selectedProductIds],
  );

  const selectedProducts = useMemo(
    function getSelectedProducts(): Product[] {
      return table.data.filter(function filterSelected(product): boolean {
        return selectedProductIds.has(product.id) && isProductSelectable(product);
      });
    },
    [excludedProductIds, selectedProductIds, table.data],
  );

  const columns: Column<Product>[] = [
    {
      id: "select",
      header: "",
      icon: (
        <input
          type="checkbox"
          checked={allSelectableChecked}
          onChange={function handleToggleAll(event): void {
            if (!event.target.checked) {
              setSelectedProductIds(new Set());
              return;
            }
            setSelectedProductIds(
              new Set(selectableRows.map(function mapIds(product): string {
                return product.id;
              })),
            );
          }}
          className="h-4 w-4 rounded border-border"
          disabled={selectableRows.length === 0}
          aria-label={dict.select}
        />
      ),
      accessor: function renderSelectColumn(product) {
        const alreadyAdded = excludedProductIds.has(product.id);
        const inactive = !product.isActive;
        const isDisabled = alreadyAdded || inactive;
        return (
          <input
            type="checkbox"
            checked={selectedProductIds.has(product.id) && !isDisabled}
            disabled={isDisabled}
            onChange={function handleToggleOne(event): void {
              setSelectedProductIds(function applyNextSelection(previous) {
                if (event.target.checked && !isProductSelectable(product)) {
                  return previous;
                }

                const next = new Set(previous);
                if (event.target.checked) {
                  next.add(product.id);
                  return next;
                }

                next.delete(product.id);
                return next;
              });
            }}
            className="h-4 w-4 rounded border-border disabled:cursor-not-allowed"
            aria-label={dict.select}
          />
        );
      },
      thClassName: "w-[46px]",
      tdClassName: "w-[46px]",
    },
    {
      id: "sku",
      header: dict.sku,
      field: "sku",
      sortable: true,
      icon: <Barcode className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderSku(product) {
        const alreadyAdded = excludedProductIds.has(product.id);
        return (
          <span
            title={alreadyAdded ? dict.alreadyAdded : ""}
            className={alreadyAdded ? "font-semibold text-muted" : "font-semibold text-blue-600"}
          >
            {product.sku}
          </span>
        );
      },
    },
    {
      id: "productName",
      header: dict.productName,
      sortable: true,
      icon: <Edit2 className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderProductName(product): string {
        return product.productNames?.[0] ?? dict.unnamed;
      },
    },
    {
      id: "productUnitName",
      header: dict.unit,
      field: "productUnitName",
      sortable: true,
      icon: <Ruler className="h-3.5 w-3.5 text-muted" />,
    },
    {
      id: "importPrice",
      header: dict.importPrice,
      field: "importPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderImportPrice(product): string {
        return product.importPrice.toLocaleString();
      },
    },
    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      field: "sellingPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderSellingPrice(product): string {
        return product.sellingPrice.toLocaleString();
      },
    },
    {
      id: "stock",
      header: dict.stock,
      field: "inventoryStock",
      icon: <Warehouse className="h-3.5 w-3.5 text-muted" />,
    },
    {
      id: "stockStatus",
      header: dict.stockStatus,
      field: "stockStatus",
      sortable: true,
      icon: <CircleEllipsis className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderStockStatus(product) {
        return <StatusPill status={product.stockStatus} />;
      },
    },
    {
      id: "active",
      header: dict.status,
      field: "isActive",
      icon: <CirclePower className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderActive(product) {
        return <ActivePill active={product.isActive} />;
      },
    },
  ];

  function handleDeleteSelected(): void {
    setSelectedProductIds(new Set());
  }

  /**
   * Finalizes the current selection and closes the popup.
   *
   * Products must be selected before this action can run.
   */
  function handleSelectProducts(): void {
    if (selectedProducts.length === 0) {
      return;
    }

    onConfirmSelect(selectedProducts);
    setSelectedProductIds(new Set());
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={onClose}>
      <div className="flex h-[86vh] w-[90vw] max-w-[1100px] flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="flex items-center justify-start">
              <h2 className="text-sm font-semibold text-text">{dict.addExistingProduct}</h2>
            </div>
            <div className="flex items-center justify-center">
              <RuleInput
                options={[
                  { label: dict.sku, icon: <Barcode className="h-3 w-3" /> },
                  { label: dict.name, icon: <Package className="h-3 w-3" /> },
                ]}
                rule={searchRule === "sku" ? dict.sku : dict.name}
                value={search}
                placeholder={dict.searchPlaceholder}
                onChange={function handleSearchChange(payload): void {
                  const nextSearchRule = payload.rule === dict.name ? "productName" : "sku";
                  setSearchRule(nextSearchRule);
                  setSearch(payload.value);
                  table.setFilters({
                    search: payload.value || undefined,
                    searchBy: payload.value ? nextSearchRule : undefined,
                  });
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                icon={<Filter className="h-3.5 w-3.5" />}
                accent={showFilters ? "primary" : "neutral"}
                onClick={function toggleFilters(): void {
                  setShowFilters(function applyToggle(value): boolean {
                    return !value;
                  });
                }}
              >
                {dict.filter}
              </Button>
              <Button icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={table.refetch}>
                {dict.refresh}
              </Button>
              <Button
                icon={<Trash2 className="h-3.5 w-3.5" />}
                accent="danger"
                onClick={handleDeleteSelected}
                disabled={selectedProductIds.size === 0}
              >
                {dict.deleteSelected}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col space-y-3 p-4">
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{dict.stock}</span>
                <div className="flex gap-1">
                  {PRODUCT_STOCK_STATUS_OPTIONS.map(function renderStockOption(option) {
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={function setStockFilter(): void {
                          setStatusFilter(option.value);
                          table.setFilters({
                            stockStatus: String(option.value) as ProductQuery["stockStatus"],
                          });
                        }}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${
                          option.value === "all"
                            ? statusFilter === option.value
                              ? "border-text bg-text text-bg"
                              : "border-border bg-card text-muted"
                            : `${ACCENT_STYLES[
                                option.value === 0
                                  ? "success"
                                  : option.value === 1
                                  ? "warning"
                                  : "danger"
                              ]} ${statusFilter === option.value ? "opacity-100" : "opacity-70"}`
                        }`}
                      >
                        {dict[option.dictKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-muted">{dict.status}</span>
                <div className="flex gap-1">
                  {PRODUCT_STATUS_OPTIONS.map(function renderStatusOption(option) {
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={function setActiveStatus(): void {
                          setActiveFilter(option.value);
                          table.setFilters({
                            isActive: String(option.value) as ProductQuery["isActive"],
                          });
                        }}
                        className={`rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${
                          option.value === "all"
                            ? activeFilter === option.value
                              ? "border-text bg-text text-bg"
                              : "border-border bg-card text-muted"
                            : `${ACCENT_STYLES[option.value ? "success" : "danger"]} ${
                                activeFilter === option.value ? "opacity-100" : "opacity-70"
                              }`
                        }`}
                      >
                        {dict[option.dictKey]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DataTable<Product>
            columns={columns}
            data={table.data}
            loading={table.loading}
            getRowId={function getRowId(product): string {
              return product.id;
            }}
            sortField={table.query.sortBy}
            sortDirection={table.query.sortOrder}
            onSort={function handleSort(field): void {
              table.setSort(field as ProductQuery["sortBy"]);
            }}
            maxHeight="fill"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <TablePagination
            page={table.query.page ?? 1}
            totalPages={table.totalPages}
            rowsPerPage={table.query.limit ?? 10}
            setRowsPerPage={table.setLimit}
            setPage={table.setPage}
            totalResults={table.total}
            dict={dict}
          />

          <div className="flex items-center gap-2">
            <Button accent="neutral" onClick={onClose}>
              {dict.cancel}
            </Button>
            <Button
              accent="primary"
              onClick={handleSelectProducts}
              disabled={selectedProducts.length === 0}
            >
              {dict.select}
            </Button>
          </div>
        </div>
      </div>
    </Popup>
  );
}
