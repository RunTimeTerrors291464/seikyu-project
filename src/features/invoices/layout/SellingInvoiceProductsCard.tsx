"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import type { Product } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";
import { formatShortcutChordForDisplay } from "@/lib/shortcuts/formatShortcutChordForDisplay";
import clsx from "clsx";
import { Hash, Package, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type RefObject } from "react";
import type { InvoiceProductLineEntryCardHandle } from "../components/InvoiceProductLineEntryCard";
import { useInvoiceDraftTableRowNavigation } from "../hooks/useInvoiceDraftTableRowNavigation";
import { useSkuNameRuleFilter } from "../hooks/useSkuNameRuleFilter";
import { INVOICE_DRAFT_TABLE_ROW_DOWN_CHORD, INVOICE_DRAFT_TABLE_ROW_UP_CHORD, INVOICE_DRAFT_TABLE_SEARCH_DATA_ATTR, INVOICE_DRAFT_TABLE_SELECT_FIRST_KEY_CHORD } from "../lib/invoiceDraftTableShortcuts";
import { sellingInvoiceCreateProductColumns } from "../table/sellingInvoiceProductLineColumns";
import {
  EditableSellingInvoiceCreateLine,
  catalogProductToEditableSellingCreateLine,
} from "../types/sellingInvoiceCreate";
import AddProductPopup from "./AddProductPopup";

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
  /**
   * When false, quantity field omits validation styling until enabled (create selling popup before Create).
   */
  lineFieldValidationActive?: boolean;
  /** Ref to the line entry card rendered outside this component (e.g. in create popup). */
  entryCardRef?: RefObject<InvoiceProductLineEntryCardHandle | null>;
  /** Row loaded in the entry card for editing. */
  activeEditRowId?: string | null;
  onRowClick?: (row: EditableSellingInvoiceCreateLine) => void;
  /** When set (e.g. create popup), reused for add-product exclusion instead of recomputing. */
  excludedProductIds?: Set<string>;
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
  lineFieldValidationActive = true,
  entryCardRef,
  activeEditRowId = null,
  onRowClick,
  excludedProductIds: excludedProductIdsProp,
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
  const [openAddProductPopup, setOpenAddProductPopup] = useState<boolean>(false);

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

    const removedIds = selectedIds;
    onChangeProducts(
      products.filter((product) => !removedIds.has(product.localId)),
    );
    setSelectedIds(new Set());
  }

  function handleAddProductsFromCatalog(selectedProducts: Product[]): void {
    if (!onChangeProducts) {
      return;
    }
    if (selectedProducts.length === 0) {
      return;
    }
    const nextProducts = selectedProducts.map(function mapCatalogProduct(
      product,
    ): EditableSellingInvoiceCreateLine {
      return catalogProductToEditableSellingCreateLine(product, dict.unnamed);
    });
    onChangeProducts([...nextProducts, ...products]);
    entryCardRef?.current?.focusSku();
  }

  function handleAddSingleProduct(product: Product): void {
    if (!onChangeProducts) {
      return;
    }
    const line = catalogProductToEditableSellingCreateLine(product, dict.unnamed);
    onChangeProducts([line, ...products]);
    entryCardRef?.current?.focusSku();
  }

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.has(product.localId));

  const columns = sellingInvoiceCreateProductColumns({
    dict,
    readOnly: true,
    showLineFieldErrors: lineFieldValidationActive,
    enableSelection: allowSelection,
    selectedIds,
    allSelected,
    hasRows: filteredProducts.length > 0,
    onToggleSelectAll: toggleSelectAll,
    onToggleSelectOne: toggleSelectOne,
    onUpdateRow: updateRow,
  });

  useInvoiceDraftTableRowNavigation({
    enabled: Boolean(onRowClick) && !openAddProductPopup,
    visibleRows: filteredProducts,
    activeEditRowId: activeEditRowId ?? null,
    onSelectRow: onRowClick ?? function noopSelectRow(): void {
      /* row click navigation disabled */
    },
  });

  const excludedProductIds = useMemo(
    function getExcludedProductIds(): Set<string> {
      if (excludedProductIdsProp) {
        return excludedProductIdsProp;
      }
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
    [excludedProductIdsProp, products],
  );

  const tableEntryShortcutsHint = useMemo(
    function buildTableEntryShortcutsHint(): string {
      return dict.tableEntryShortcutsHint
        .replace(
          "{selectKeys}",
          formatShortcutChordForDisplay(INVOICE_DRAFT_TABLE_SELECT_FIRST_KEY_CHORD),
        )
        .replace(
          "{arrowUpKeys}",
          formatShortcutChordForDisplay(INVOICE_DRAFT_TABLE_ROW_UP_CHORD),
        )
        .replace(
          "{arrowDownKeys}",
          formatShortcutChordForDisplay(INVOICE_DRAFT_TABLE_ROW_DOWN_CHORD),
        );
    },
    [dict.tableEntryShortcutsHint],
  );

  return (
    <div
      className={clsx(
        "flex min-h-[5rem] flex-1 flex-col overflow-hidden rounded-lg p-3",
        accent !== "neutral"
          ? `${ACCENT_STYLES[accent]} text-text`
          : "border border-border bg-card",
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 w-full max-w-xl items-center gap-3 pr-3">
          <div
            className="w-full max-w-xl"
            {...{ [INVOICE_DRAFT_TABLE_SEARCH_DATA_ATTR]: "" }}
          >
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
              onClick={function openAddProductPopup(): void {
                setOpenAddProductPopup(true);
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
        emptyMessage={dict.noProductsYet}
        maxHeight="fill"
        selectedRowId={activeEditRowId}
        onRowClick={onRowClick}
      />
      <p className="mt-3 text-center text-xs text-muted">{tableEntryShortcutsHint}</p>

      <AddProductPopup
        open={openAddProductPopup}
        onClose={function closeAddProductPopup(): void {
          setOpenAddProductPopup(false);
        }}
        onOpenRequest={function openAddProductPopupFromShortcut(): void {
          setOpenAddProductPopup(true);
        }}
        newShortcutEnabled={canEditDraft && allowAddProducts}
        excludedProductIds={excludedProductIds}
        onConfirmAdd={handleAddSingleProduct}
        onConfirmAddMultiple={handleAddProductsFromCatalog}
        addExistingDialogTitle={dict.addProducts}
        productNameColumnWidthPx={160}
        productPickerColumnPreset="selling"
      />
    </div>
  );
}
