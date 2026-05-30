"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import type { InvoiceProductLineEntryCardHandle } from "@/features/invoices/components/InvoiceProductLineEntryCard";
import { scheduleFocusLastInvoiceLineQuantity } from "@/features/invoices/lib/focusInvoiceLineQuantityInput";
import { INVOICE_DRAFT_TABLE_SEARCH_DATA_ATTR } from "@/features/invoices/lib/invoiceDraftTableShortcuts";
import type { Product } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";
import { formatShortcutChordForDisplay } from "@/lib/shortcuts/formatShortcutChordForDisplay";
import clsx from "clsx";
import { Hash, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useInvoiceDraftTableRowNavigation } from "../hooks/useInvoiceDraftTableRowNavigation";
import { useSkuNameRuleFilter } from "../hooks/useSkuNameRuleFilter";
import { INVOICE_DRAFT_TABLE_ROW_DOWN_CHORD, INVOICE_DRAFT_TABLE_ROW_UP_CHORD, INVOICE_DRAFT_TABLE_SELECT_FIRST_KEY_CHORD } from "../lib/invoiceDraftTableShortcuts";
import {
  importInvoiceCreateProductColumns,
  importInvoiceProductColumns,
} from "../table/invoiceProductLineColumns";
import {
  EditableImportInvoiceProduct,
  productToEditableImportLine,
} from "../types/importInvoiceDetail";
import AddProductPopup from "./AddProductPopup";
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
  /**
   * Gates quantity/import-price error styling. Use `false` until the user submits (e.g. create draft popup).
   * Defaults to true for manager draft detail editing.
   */
  lineFieldValidationActive?: boolean;
  /** When true, line edits go through the entry card; table cells are read-only. */
  readOnlyTable?: boolean;
  /** Ref to the line entry card rendered outside this component (e.g. in create popup). */
  entryCardRef?: RefObject<InvoiceProductLineEntryCardHandle | null>;
  /** Row loaded in the entry card for editing. */
  activeEditRowId?: string | null;
  onRowClick?: (row: EditableImportInvoiceProduct) => void;
  /** When set (e.g. create popup), reused for add-product exclusion instead of recomputing. */
  excludedProductIds?: Set<string>;
};

export default function ImportInvoiceProductsCard({
  products,
  canEditDraft,
  onChangeProducts,
  updateRow: updateRowProp,
  accent = "neutral",
  lineFieldValidationActive = true,
  readOnlyTable = false,
  entryCardRef,
  activeEditRowId = null,
  onRowClick,
  excludedProductIds: excludedProductIdsProp,
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
  const [openAddProductPopup, setOpenAddProductPopup] = useState<boolean>(false);
  const [openCreateAndAddPopup, setOpenCreateAndAddPopup] = useState<boolean>(false);
  const tableScopeRef = useRef<HTMLDivElement>(null);

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

  function handleAddProductsFromCatalog(selectedProducts: Product[]): void {
    if (selectedProducts.length === 0) {
      return;
    }
    const nextProducts = selectedProducts.map(function mapEditableProduct(product) {
      return productToEditableImportLine(product, dict.unnamed);
    });
    onChangeProducts([...products, ...nextProducts]);
    if (readOnlyTable) {
      entryCardRef?.current?.focusSku();
      return;
    }
    scheduleFocusLastInvoiceLineQuantity(
      nextProducts.map(function mapLocalId(line) {
        return line.localId;
      }),
      tableScopeRef.current,
    );
  }

  function handleAddSingleProduct(product: Product): void {
    const line = productToEditableImportLine(product, dict.unnamed);
    onChangeProducts([...products, line]);
    if (readOnlyTable) {
      entryCardRef?.current?.focusSku();
      return;
    }
    scheduleFocusLastInvoiceLineQuantity([line.localId], tableScopeRef.current);
  }

  function handleCreateAndAddProduct(product: EditableImportInvoiceProduct): void {
    onChangeProducts([...products, product]);
    if (readOnlyTable) {
      entryCardRef?.current?.focusSku();
      return;
    }
    scheduleFocusLastInvoiceLineQuantity([product.localId], tableScopeRef.current);
  }

  const allSelected = filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.has(product.localId));

  const columns = readOnlyTable
    ? importInvoiceCreateProductColumns({
        dict,
        readOnly: true,
        showLineFieldErrors: lineFieldValidationActive,
        enableSelection: canEditDraft,
        selectedIds,
        allSelected,
        hasRows: filteredProducts.length > 0,
        onToggleSelectAll: toggleSelectAll,
        onToggleSelectOne: toggleSelectOne,
        onUpdateRow: updateRow,
      })
    : importInvoiceProductColumns({
        dict,
        canEditDraft,
        showLineFieldErrors: lineFieldValidationActive,
        selectedIds,
        allSelected,
        hasRows: filteredProducts.length > 0,
        onToggleSelectAll: toggleSelectAll,
        onToggleSelectOne: toggleSelectOne,
        onUpdateRow: updateRow,
      });

  useInvoiceDraftTableRowNavigation({
    enabled: Boolean(onRowClick) && !openAddProductPopup && !openCreateAndAddPopup,
    visibleRows: filteredProducts,
    activeEditRowId: activeEditRowId ?? null,
    onSelectRow: onRowClick ?? function noopSelectRow(): void {
      /* row click navigation disabled */
    },
  });

  const excludedProductIdsInternal = useMemo(
    function getExcludedProductIds(): Set<string> {
      return new Set(
        products
          .filter(function excludeEditingLine(product): boolean {
            return product.localId !== activeEditRowId;
          })
          .map(function mapProductIds(product): string {
            return product.productId;
          })
          .filter(function filterEmptyProductIds(productId): boolean {
            return productId.length > 0;
          }),
      );
    },
    [products, activeEditRowId],
  );

  const excludedProductIds = excludedProductIdsProp ?? excludedProductIdsInternal;

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
      ref={tableScopeRef}
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
            {...(readOnlyTable ? { [INVOICE_DRAFT_TABLE_SEARCH_DATA_ATTR]: "" } : {})}
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
            onClick={function openAddProductPopup(): void {
              setOpenAddProductPopup(true);
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
        newShortcutEnabled={canEditDraft}
        excludedProductIds={excludedProductIds}
        onConfirmAdd={handleAddSingleProduct}
        onConfirmAddMultiple={handleAddProductsFromCatalog}
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
