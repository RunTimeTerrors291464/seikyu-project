"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ACCENT_STYLES, ProductStatusFilter, ProductStockFilter } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import buildAddExistingProductsColumns, {
  type AddExistingProductsColumnPreset,
} from "@/features/invoices/table/addExistingProductsColumns";
import { PRODUCT_STATUS_OPTIONS, PRODUCT_STOCK_STATUS_OPTIONS } from "@/features/products/filters/productFilters";
import { useProductTable } from "@/features/products/hooks/useProductTable";
import { ProductQuery, productService } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import useFocusFirstFormControlOnOpen from "@/lib/hooks/useFocusFirstFormControlOnOpen";
import { useDict } from "@/lib/lang/DictProvider";
import { Barcode, Filter, Package, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type AddExistingProductsPopupProps = {
  open: boolean;
  onClose: () => void;
  excludedProductIds: Set<string>;
  onConfirmSelect: (selectedProducts: Product[]) => void;
  /** When set, replaces the default dialog title (e.g. selling invoice uses "Add Products"). */
  dialogTitle?: string;
  /** Pixel width for the product name column (selling flow uses 160). */
  productNameColumnWidthPx?: number;
  /** Selling invoices omit import price and stock status in the picker. */
  productPickerColumnPreset?: AddExistingProductsColumnPreset;
};

export default function AddExistingProductsPopup({
  open,
  onClose,
  excludedProductIds,
  onConfirmSelect,
  dialogTitle,
  productNameColumnWidthPx,
  productPickerColumnPreset,
}: AddExistingProductsPopupProps) {
  const dict = useDict();
  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<"sku" | "productName">("sku");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<ProductStockFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ProductStatusFilter>("all");
  const [selectedProductsById, setSelectedProductsById] = useState<
    Map<string, Product>
  >(new Map());

  const initialTableQuery: ProductQuery = {
    page: 1,
    limit: 30,
    search: undefined,
    searchBy: undefined,
    sortBy: "sku",
    sortOrder: "asc",
    isActive: "all",
  };

  const table = useProductTable({
    fetcher: productService.getProducts,
    initialQuery: initialTableQuery,
    enabled: open,
  });

  const formFieldsRef = useFocusFirstFormControlOnOpen({ when: open });

  /**
   * Returns whether a product can be selected in this popup.
   *
   * Inactive products and already-excluded products must never be selectable.
   */
  const isProductSelectable = useCallback(function isProductSelectable(product: Product): boolean {
    return !excludedProductIds.has(product.id) && product.isActive;
  }, [excludedProductIds]);

  const selectedProductIds = useMemo(
    function getSelectedProductIds(): Set<string> {
      return new Set(selectedProductsById.keys());
    },
    [selectedProductsById],
  );

  const selectedProducts = useMemo(
    function getSelectedProducts(): Product[] {
      return Array.from(selectedProductsById.values()).filter(isProductSelectable);
    },
    [isProductSelectable, selectedProductsById],
  );

  const toggleProductSelection = useCallback(
    function toggleProductSelection(product: Product, selected: boolean): void {
      setSelectedProductsById(function updateSelectedProducts(previous) {
        const next = new Map(previous);
        if (selected) {
          next.set(product.id, product);
        } else {
          next.delete(product.id);
        }
        return next;
      });
    },
    [],
  );

  const toggleVisibleProductSelection = useCallback(
    function toggleVisibleProductSelection(
      products: Product[],
      selected: boolean,
    ): void {
      setSelectedProductsById(function updateVisibleSelectedProducts(previous) {
        const next = new Map(previous);
        products.forEach(function updateProduct(product): void {
          if (selected) {
            next.set(product.id, product);
          } else {
            next.delete(product.id);
          }
        });
        return next;
      });
    },
    [],
  );

  const selectableRows = useMemo(
    function getSelectableRows(): Product[] {
      return table.data.filter(function filterSelectable(product): boolean {
        return isProductSelectable(product);
      });
    },
    [isProductSelectable, table.data],
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

  const columns = useMemo(
    function getColumns() {
      return buildAddExistingProductsColumns({
        dict,
        allSelectableChecked,
        selectableRows,
        excludedProductIds,
        selectedProductIds,
        onToggleProductSelection: toggleProductSelection,
        onToggleVisibleProductSelection: toggleVisibleProductSelection,
        isProductSelectable,
        productNameColumnWidthPx,
        columnPreset: productPickerColumnPreset,
      });
    },
    [
      dict,
      allSelectableChecked,
      selectableRows,
      excludedProductIds,
      selectedProductIds,
      isProductSelectable,
      toggleProductSelection,
      toggleVisibleProductSelection,
      productNameColumnWidthPx,
      productPickerColumnPreset,
    ],
  );

  function handleDeleteSelected(): void {
    setSelectedProductsById(new Map());
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
    setSelectedProductsById(new Map());
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={onClose}>
      <div
        ref={formFieldsRef}
        className="flex h-[86vh] w-[90vw] max-w-[1100px] flex-col overflow-hidden bg-bg"
      >
        <div className="border-b border-border px-4 py-3">
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="flex items-center justify-start">
              <h2 className="text-sm font-semibold text-text">
                {dialogTitle ?? dict.addExistingProduct}
              </h2>
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
                            stockStatus:
                              option.value === "all"
                                ? undefined
                                : option.value,
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
                            isActive:
                              option.value === "all"
                                ? "all"
                                : option.value === true
                                  ? "true"
                                  : "false",
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
