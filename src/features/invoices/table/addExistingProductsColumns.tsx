"use client";

import ActivePill from "@/features/products/components/ActivePill";
import StatusPill from "@/features/products/components/StockStatusPill";
import type { Product } from "@/features/products/types/product";
import type { Dictionary } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Edit2, Ruler, Warehouse } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Column } from "@/components/ui/DataTable";

type BuildAddExistingProductsColumnsParams = {
  dict: Dictionary;
  allSelectableChecked: boolean;
  selectableRows: Product[];
  excludedProductIds: Set<string>;
  selectedProductIds: Set<string>;
  setSelectedProductIds: Dispatch<SetStateAction<Set<string>>>;
  isProductSelectable: (product: Product) => boolean;
};

/**
 * Builds product-table columns for the add-existing-products popup.
 *
 * @param params - Dictionary, selection state, and selectability handlers.
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
    setSelectedProductIds,
    isProductSelectable,
  } = params;

  return [
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
              new Set(
                selectableRows.map(function mapIds(product): string {
                  return product.id;
                }),
              ),
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
}
