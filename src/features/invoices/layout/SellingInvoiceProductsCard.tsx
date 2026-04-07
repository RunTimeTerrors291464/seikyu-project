"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import type { Product } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { Hash, Package, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useSkuNameRuleFilter } from "../hooks/useSkuNameRuleFilter";
import { sellingInvoiceCreateProductColumns } from "../table/sellingInvoiceProductLineColumns";
import {
  EditableSellingInvoiceCreateLine,
  productToEditableSellingCreateLine,
} from "../types/sellingInvoiceCreate";
import AddExistingProductsPopup from "./AddExistingProductsPopup";

type SellingInvoiceProductsCardProps = {
  products: EditableSellingInvoiceCreateLine[];
  canEditDraft: boolean;
  onChangeProducts?: (products: EditableSellingInvoiceCreateLine[]) => void;
  updateRow?: (
    rowLocalId: string,
    key: keyof EditableSellingInvoiceCreateLine,
    value: string,
  ) => void;
  showSelection?: boolean;
  showAddProductsButton?: boolean;
  showDeleteSelectedButton?: boolean;
  accent?: Accent;
};

export default function SellingInvoiceProductsCard({
  products,
  canEditDraft,
  onChangeProducts,
  updateRow: updateRowProp,
  showSelection,
  showAddProductsButton,
  showDeleteSelectedButton,
  accent = "neutral",
}: SellingInvoiceProductsCardProps) {
  const dict = useDict();
  const allowSelection = showSelection ?? canEditDraft;
  const allowAddProducts = showAddProductsButton ?? canEditDraft;
  const allowDeleteSelected = showDeleteSelectedButton ?? canEditDraft;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    searchRule,
    setSearchRule,
    searchText,
    setSearchText,
    filteredRows: filteredProducts,
  } = useSkuNameRuleFilter(products);
  const [openAddExistingPopup, setOpenAddExistingPopup] = useState<boolean>(false);

  const selectedCount = selectedIds.size;

  function updateRowInternal(
    rowLocalId: string,
    key: keyof EditableSellingInvoiceCreateLine,
    value: string,
  ): void {
    if (!onChangeProducts) {
      return;
    }
    onChangeProducts(
      products.map((product) =>
        product.localId === rowLocalId
          ? {
              ...product,
              [key]: value,
            }
          : product,
      ),
    );
  }

  const updateRow = updateRowProp ?? updateRowInternal;

  function toggleSelectAll(checked: boolean): void {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(filteredProducts.map((product) => product.localId)));
  }

  function toggleSelectOne(localId: string, checked: boolean): void {
    const next = new Set(selectedIds);

    if (checked) {
      next.add(localId);
    } else {
      next.delete(localId);
    }

    setSelectedIds(next);
  }

  function handleDeleteSelected(): void {
    if (!onChangeProducts) {
      return;
    }
    if (selectedIds.size === 0) {
      return;
    }

    onChangeProducts(
      products.filter((product) => !selectedIds.has(product.localId)),
    );
    setSelectedIds(new Set());
  }

  function handleAddExistingProducts(selectedProducts: Product[]): void {
    if (!onChangeProducts) {
      return;
    }
    if (selectedProducts.length === 0) {
      return;
    }
    const nextProducts = selectedProducts.map(function mapEditableProduct(product) {
      return productToEditableSellingCreateLine(product, dict.unnamed);
    });
    onChangeProducts([...products, ...nextProducts]);
  }

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.has(product.localId));

  const columns = sellingInvoiceCreateProductColumns({
    dict,
    readOnly: !canEditDraft,
    enableSelection: allowSelection,
    selectedIds,
    allSelected,
    hasRows: filteredProducts.length > 0,
    onToggleSelectAll: toggleSelectAll,
    onToggleSelectOne: toggleSelectOne,
    onUpdateRow: updateRow,
  });

  const excludedProductIds = useMemo(
    function getExcludedProductIds(): Set<string> {
      return new Set(
        products
          .map(function mapProductIds(product): string {
            return product.productId;
          })
          .filter(function filterEmptyProductIds(productId): boolean {
            return productId.length > 0;
          }),
      );
    },
    [products],
  );

  return (
    <div
      className={clsx(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg p-3",
        accent !== "neutral"
          ? `${ACCENT_STYLES[accent]} text-text`
          : "border border-border bg-card",
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 w-full max-w-xl items-center gap-3 pr-3">
          <div className="w-full max-w-xl">
            <RuleInput
              options={[
                { label: dict.sku, icon: <Hash className="h-3 w-3" /> },
                { label: dict.name, icon: <Package className="h-3 w-3" /> },
              ]}
              rule={searchRule === "sku" ? dict.sku : dict.name}
              value={searchText}
              placeholder={dict.searchPlaceholder}
              onChange={({ rule, value }) => {
                setSearchRule(rule === dict.name ? "productName" : "sku");
                setSearchText(value);
              }}
            />
          </div>
          {allowSelection && (
            <div className="whitespace-nowrap text-xs text-muted ">
              <span>
                {selectedCount} {dict.selected}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ">
          {allowAddProducts && (
            <Button
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={function openAddExistingProductPopup(): void {
                setOpenAddExistingPopup(true);
              }}
              disabled={!canEditDraft}
            >
              {dict.addProducts}
            </Button>
          )}
          {allowDeleteSelected && (
            <Button
              icon={<Trash2 className="h-3.5 w-3.5" />}
              accent="danger"
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0}
            >
              {dict.deleteSelected}
            </Button>
          )}
        </div>
      </div>

      <DataTable<EditableSellingInvoiceCreateLine>
        columns={columns}
        data={filteredProducts}
        getRowId={(row) => row.localId}
        emptyMessage={dict.noProductData}
        maxHeight="fill"
      />

      <AddExistingProductsPopup
        open={openAddExistingPopup}
        onClose={function closeAddExistingPopup(): void {
          setOpenAddExistingPopup(false);
        }}
        excludedProductIds={excludedProductIds}
        onConfirmSelect={handleAddExistingProducts}
        dialogTitle={dict.addProducts}
      />
    </div>
  );
}
