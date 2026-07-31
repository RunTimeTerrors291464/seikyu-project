"use client";

/**
 * Column builder for the shared "Add existing products" picker table.
 * Used by `AddExistingProductsPopup` in invoice flows (import, stock-adjustment, and cashier selling),
 * with `full` or `selling` presets depending on context.
 */

import type { Column } from "@/components/ui/DataTable";
import ActivePill from "@/features/products/components/ActivePill";
import StatusPill from "@/features/products/components/StockStatusPill";
import type { Product } from "@/features/products/types/product";
import type { Dictionary } from "@/lib/lang/i18n";
import { translateUnitName } from "@/lib/lang/translateUnitName";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Edit2, Ruler } from "lucide-react";

export type AddExistingProductsColumnPreset = "full" | "selling";

type BuildAddExistingProductsColumnsParams = {
  dict: Dictionary;
  allSelectableChecked: boolean;
  selectableRows: Product[];
  excludedProductIds: Set<string>;
  selectedProductIds: Set<string>;
  onToggleProductSelection: (product: Product, selected: boolean) => void;
  onToggleVisibleProductSelection: (
    products: Product[],
    selected: boolean,
  ) => void;
  isProductSelectable: (product: Product) => boolean;
  /** When set, fixes product name column width (e.g. 160 for cashier selling add-products popup). */
  productNameColumnWidthPx?: number;
  /**
   * `selling` drops import price and stock status so the picker matches selling-line editing.
   * Import and stock-adjustment flows keep the default `full` preset.
   */
  columnPreset?: AddExistingProductsColumnPreset;
};

/**
 * Builds product-table columns for the add-existing-products popup.
 *
 * @param params - Dictionary, selection state, selectability handlers, and optional column preset.
 * @returns DataTable columns for product selection and product details.
 */
export default function buildAddExistingProductsColumns(
  params: BuildAddExistingProductsColumnsParams,
): Column<Product>[] {
  const {
    dict,
    allSelectableChecked,
    selectableRows,
    excludedProductIds,
    selectedProductIds,
    onToggleProductSelection,
    onToggleVisibleProductSelection,
    isProductSelectable,
    productNameColumnWidthPx,
    columnPreset = "full",
  } = params;

  const columns: Column<Product>[] = [
    {
      id: "select",
      header: "",
      icon: (
        <input
          type="checkbox"
          checked={allSelectableChecked}
          onChange={function handleToggleAll(event): void {
            onToggleVisibleProductSelection(
              selectableRows,
              event.target.checked,
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
              if (event.target.checked && !isProductSelectable(product)) {
                return;
              }

              onToggleProductSelection(product, event.target.checked);
            }}
            className="h-4 w-4 rounded border-border disabled:cursor-not-allowed"
            aria-label={dict.select}
          />
        );
      },
      thClassName: "w-8",
      tdClassName: "w-8",
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
            className={
              alreadyAdded ? "font-semibold text-muted" : "font-semibold text-blue-600"
            }
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
      ...(productNameColumnWidthPx != null
        ? { width: `${productNameColumnWidthPx}px` }
        : {}),
    },
    {
      id: "productUnitName",
      header: dict.unit,
      field: "productUnitName",
      sortable: true,
      icon: <Ruler className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderProductUnit(product): string {
        return translateUnitName(product.productUnitName, dict);
      },
      sortAccessor: function sortProductUnit(product): string {
        return translateUnitName(product.productUnitName, dict);
      },
    },
    {
      id: "importPrice",
      header: dict.importPrice,
      field: "importPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderImportPrice(product): string {
        return formatPriceNumber(product.importPrice);
      },
    },
    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      field: "sellingPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5 text-muted" />,
      accessor: function renderSellingPrice(product): string {
        return formatPriceNumber(product.sellingPrice);
      },
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

  if (columnPreset === "selling") {
    return columns.filter(function omitSellingUnused(column): boolean {
      return column.id !== "importPrice" && column.id !== "stockStatus";
    });
  }

  return columns;
}
