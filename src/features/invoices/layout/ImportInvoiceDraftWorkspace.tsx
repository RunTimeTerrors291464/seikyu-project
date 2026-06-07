"use client";

import { Accent } from "@/components/types/ui";
import { Field, Input } from "@/components/ui/Fields";
import ImportDraftSummaryCard, {
  type ImportDraftSummaryRow,
} from "@/features/invoices/components/ImportDraftSummaryCard";
import InvoiceProductLineEntryCard, {
  type InvoiceProductLineEntryCardHandle,
} from "@/features/invoices/components/InvoiceProductLineEntryCard";
import type { ImportInvoiceProductsTotals } from "@/features/invoices/hooks/useImportInvoiceProductsEditor";
import { buildDraftExcludedProductIds } from "@/features/invoices/lib/buildDraftExcludedProductIds";
import { createImportLineEntryConfig } from "@/features/invoices/lib/importLineEntryConfig";
import { useDict } from "@/lib/lang/DictProvider";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { useCallback, useMemo, useRef, useState } from "react";
import type { EditableImportInvoiceProduct } from "../types/importInvoiceDetail";
import ImportInvoiceProductsCard from "./ImportInvoiceProductsCard";

type ImportInvoiceDraftWorkspaceProps = {
  products: EditableImportInvoiceProduct[];
  onChangeProducts: (products: EditableImportInvoiceProduct[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  updateRow: (
    rowLocalId: string,
    key: keyof EditableImportInvoiceProduct,
    value: string,
  ) => void;
  totals: ImportInvoiceProductsTotals;
  lineFieldValidationActive: boolean;
  productsCardAccent?: Accent;
  notesDisabled?: boolean;
  disableDuplicateProductCheck?: boolean;
};

export default function ImportInvoiceDraftWorkspace({
  products,
  onChangeProducts,
  notes,
  onNotesChange,
  updateRow,
  totals,
  lineFieldValidationActive,
  productsCardAccent = "neutral",
  notesDisabled = false,
  disableDuplicateProductCheck = false,
}: ImportInvoiceDraftWorkspaceProps) {
  const dict = useDict();
  const entryCardRef = useRef<InvoiceProductLineEntryCardHandle>(null);
  const [editingLineLocalId, setEditingLineLocalId] = useState<string | null>(null);

  const editingLine = useMemo(
    function findEditingLine(): EditableImportInvoiceProduct | null {
      if (editingLineLocalId == null) {
        return null;
      }
      return (
        products.find(function matchEditingLine(product): boolean {
          return product.localId === editingLineLocalId;
        }) ?? null
      );
    },
    [editingLineLocalId, products],
  );

  const excludedProductIds = useMemo(
    function getExcludedProductIds(): Set<string> {
      if (disableDuplicateProductCheck) {
        // Duplicate check disabled for add import invoices.
        // return buildDraftExcludedProductIds(products, editingLineLocalId);
        return new Set<string>();
      }

      return buildDraftExcludedProductIds(products, editingLineLocalId);
    },
    [disableDuplicateProductCheck, products, editingLineLocalId],
  );

  const importSummaryRows = useMemo(
    function buildImportSummaryRows(): ImportDraftSummaryRow[] {
      return [
        {
          label: dict.totalImportPriceLabel,
          value: formatPriceNumber(totals.totalImportPrice),
          accent: totals.totalImportPrice > 0 ? "primary" : "neutral",
        },
        {
          label: dict.totalProducts,
          value: totals.totalProducts.toLocaleString(),
          accent: totals.totalProducts > 0 ? "neutral" : "warning",
        },
        {
          label: dict.totalQuantity,
          value: totals.totalQuantity.toLocaleString(),
          accent: totals.totalQuantity > 0 ? "neutral" : "warning",
        },
      ];
    },
    [dict, totals],
  );

  const lineEntryConfig = useMemo(
    function buildLineEntryConfig() {
      return createImportLineEntryConfig(dict, dict.unnamed);
    },
    [dict],
  );

  function handleAddLineFromEntry(line: EditableImportInvoiceProduct): void {
    setEditingLineLocalId(null);
    onChangeProducts([...products, line]);
  }

  function handleUpdateLineFromEntry(line: EditableImportInvoiceProduct): void {
    onChangeProducts(
      products.map(function mapLine(product): EditableImportInvoiceProduct {
        return product.localId === line.localId ? line : product;
      }),
    );
  }

  const handleProductRowClick = useCallback(
    function handleProductRowClick(row: EditableImportInvoiceProduct): void {
      setEditingLineLocalId(row.localId);
    },
    [],
  );

  function handleClearLineEdit(): void {
    setEditingLineLocalId(null);
  }

  function handleProductsChange(
    nextProducts: EditableImportInvoiceProduct[],
  ): void {
    onChangeProducts(nextProducts);
    if (
      editingLineLocalId != null &&
      !nextProducts.some(function stillHasEditingLine(product): boolean {
        return product.localId === editingLineLocalId;
      })
    ) {
      setEditingLineLocalId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <InvoiceProductLineEntryCard
        ref={entryCardRef}
        config={lineEntryConfig}
        excludedProductIds={excludedProductIds}
        lineFieldValidationActive={lineFieldValidationActive}
        editSourceLine={editingLine}
        onAddLine={handleAddLineFromEntry}
        onUpdateLine={handleUpdateLineFromEntry}
        onClearEdit={handleClearLineEdit}
      />

      <ImportInvoiceProductsCard
        products={products}
        canEditDraft={true}
        onChangeProducts={handleProductsChange}
        updateRow={updateRow}
        readOnlyTable={true}
        entryCardRef={entryCardRef}
        accent={productsCardAccent}
        lineFieldValidationActive={lineFieldValidationActive}
        activeEditRowId={editingLineLocalId}
        onRowClick={handleProductRowClick}
        excludedProductIds={excludedProductIds}
      />

      <div className="flex items-start gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          <div className="flex w-[30rem] flex-col gap-2">
            <Field label={dict.noteLabel}>
              <Input
                value={notes}
                onChange={onNotesChange}
                disabled={notesDisabled}
                placeholder={dict.invoiceDescriptionPlaceholder}
              />
            </Field>
          </div>
        </div>

        <ImportDraftSummaryCard rows={importSummaryRows} />
      </div>
    </div>
  );
}
