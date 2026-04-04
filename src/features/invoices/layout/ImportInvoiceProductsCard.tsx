"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import type { Product } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { Hash, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSkuNameRuleFilter } from "../hooks/useSkuNameRuleFilter";
import { importInvoiceProductColumns } from "../table/invoiceProductLineColumns";
import {
  EditableImportInvoiceProduct,
  productToEditableImportLine,
} from "../types/importInvoiceDetail";
import AddExistingProductsPopup from "./AddExistingProductsPopup";
import CreateAndAddProductPopup from "./CreateAndAddProductPopup";

type ImportInvoiceProductsCardProps = {
  products: EditableImportInvoiceProduct[];
  canEditDraft: boolean;
  onChangeProducts: (products: EditableImportInvoiceProduct[]) => void;
  /**
   * When provided (e.g. from `useImportInvoiceProductsEditor`), used for table cell updates instead of an internal mapper.
   */
  updateRow?: (
    rowLocalId: string,
    key: keyof EditableImportInvoiceProduct,
    value: string,
  ) => void;
  accent?: Accent;
};

export default function ImportInvoiceProductsCard({
  products,
  canEditDraft,
  onChangeProducts,
  updateRow: updateRowProp,
  accent = "neutral",
}: ImportInvoiceProductsCardProps) {
  const dict = useDict();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    searchRule,
    setSearchRule,
    searchText,
    setSearchText,
    filteredRows: filteredProducts,
  } = useSkuNameRuleFilter(products);
  const [openAddExistingPopup, setOpenAddExistingPopup] = useState<boolean>(false);
  const [openCreateAndAddPopup, setOpenCreateAndAddPopup] = useState<boolean>(false);

  useEffect(
    function clearSelectionWhenNotDraft(): void {
      if (!canEditDraft) {
        setSelectedIds(new Set());
      }
    },
    [canEditDraft],
  );

  const selectedCount = selectedIds.size;

  function updateRowInternal(
    rowLocalId: string,
    key: keyof EditableImportInvoiceProduct,
    value: string,
  ): void {
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
    if (selectedIds.size === 0) {
      return;
    }

    onChangeProducts(
      products.filter((product) => !selectedIds.has(product.localId)),
    );
    setSelectedIds(new Set());
  }

  function handleAddExistingProducts(selectedProducts: Product[]): void {
    if (selectedProducts.length === 0) {
      return;
    }
    const nextProducts = selectedProducts.map(function mapEditableProduct(product) {
      return productToEditableImportLine(product, dict.unnamed);
    });
    onChangeProducts([...products, ...nextProducts]);
  }

  function handleCreateAndAddProduct(product: EditableImportInvoiceProduct): void {
    onChangeProducts([...products, product]);
  }

  const allSelected = filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.has(product.localId));

  const columns = importInvoiceProductColumns({
    dict,
    canEditDraft,
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
          {canEditDraft && (
            <div className="whitespace-nowrap text-xs text-muted ">
              <span>
                {selectedCount} {dict.selected}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ">
          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={function openAddExistingProductPopup(): void {
              setOpenAddExistingPopup(true);
            }}
            disabled={!canEditDraft}
          >
            {dict.addExistingProduct}
          </Button>

          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            accent="primary"
            onClick={function openCreateAndAddPopup(): void {
              setOpenCreateAndAddPopup(true);
            }}
            disabled={!canEditDraft}
          >
            {dict.createAndAddProduct}
          </Button>

          {canEditDraft && (
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

      <DataTable<EditableImportInvoiceProduct>
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
      />

      <CreateAndAddProductPopup
        open={openCreateAndAddPopup}
        onClose={function closeCreateAndAddPopup(): void {
          setOpenCreateAndAddPopup(false);
        }}
        onCreatedAndAdd={handleCreateAndAddProduct}
      />
    </div>
  );
}
