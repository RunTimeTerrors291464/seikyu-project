"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import { Field, Input } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import ImportDraftSummaryCard, {
  type ImportDraftSummaryRow,
} from "@/features/invoices/components/ImportDraftSummaryCard";
// import { buildDraftExcludedProductIds } from "@/features/invoices/lib/buildDraftExcludedProductIds";
import {
  clampPercentDiscount,
  finalizePercentDiscountInput,
  normalizePercentDiscountInput,
} from "@/features/invoices/lib/percentDiscountInput";
import {
  rethrowApiErrorWithMessage,
} from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InvoiceProductLineEntryCard, {
  type InvoiceProductLineEntryCardHandle,
} from "../components/InvoiceProductLineEntryCard";
import { useSellingInvoiceCreateEditor } from "../hooks/useSellingInvoiceCreateEditor";
import { createSellingLineEntryConfig } from "../lib/sellingLineEntryConfig";
import { createSellingInvoice } from "../services/sellingInvoice.service";
import { toNumberOrZero } from "../types/importInvoiceDetail";
import {
  EditableSellingInvoiceCreateLine,
  sellingCreateLinesToRequest,
} from "../types/sellingInvoiceCreate";
import SellingInvoiceProductsCard from "./SellingInvoiceProductsCard";

type AddSellingInvoicePopupProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (invoiceId: string) => void;
};

type ConfirmAction = "cancel" | "create" | null;

function createInitialProducts(): EditableSellingInvoiceCreateLine[] {
  return [];
}

export default function AddSellingInvoicePopup({
  open,
  onClose,
  onCreated,
}: AddSellingInvoicePopupProps) {
  const dict = useDict();
  const [products, setProducts] = useState<EditableSellingInvoiceCreateLine[]>(
    createInitialProducts(),
  );
  const [invoiceDiscount, setInvoiceDiscount] = useState<string>("");
  const [taxFocusChoice, setTaxFocusChoice] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [createAttempted, setCreateAttempted] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const nowText = useMemo(() => new Date().toISOString(), []);
  const previousProductCountRef = useRef<number>(0);
  const entryCardRef = useRef<InvoiceProductLineEntryCardHandle>(null);
  const [editingLineLocalId, setEditingLineLocalId] = useState<string | null>(null);

  const isDraftDirty = useMemo(
    function computeDraftDirty(): boolean {
      return (
        products.length > 0 ||
        notes.trim().length > 0 ||
        toNumberOrZero(invoiceDiscount) !== 0 ||
        taxFocusChoice !== null
      );
    },
    [products, notes, invoiceDiscount, taxFocusChoice],
  );

  const {
    updateRow,
    hasInvalidLines,
    draftError,
  } = useSellingInvoiceCreateEditor(products, setProducts, createAttempted, taxFocusChoice);

  const noProductsMessage = dict.sellingCreateNoProductsError;

  useEffect(
    function onProductLineCountChange(): void {
      const previousCount = previousProductCountRef.current;
      previousProductCountRef.current = products.length;

      if (previousCount === 0 && products.length > 0) {
        setCreateAttempted(false);
        setErrorMessage(function clearNoProductsValidation(previous): string {
          return previous === noProductsMessage ? "" : previous;
        });
      }
    },
    [products.length, noProductsMessage],
  );

  function resetDraftState(): void {
    previousProductCountRef.current = 0;
    setProducts(createInitialProducts());
    setInvoiceDiscount("");
    setTaxFocusChoice(null);
    setNotes("");
    setCreateAttempted(false);
    setConfirmAction(null);
    setCreating(false);
    setErrorMessage("");
    setEditingLineLocalId(null);
  }

  function handleClose(): void {
    resetDraftState();
    onClose();
  }

  function handleCancelConfirmed(): void {
    handleClose();
  }

  function requestCancel(): void {
    if (isDraftDirty) {
      setConfirmAction("cancel");
      return;
    }

    setConfirmAction(null);
    handleClose();
  }

  async function handleCreateConfirmed(): Promise<void> {
    if (products.length === 0) {
      return;
    }

    if (hasInvalidLines) {
      return;
    }

    if (taxFocusChoice === null) {
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const created = await createSellingInvoice({
        products: sellingCreateLinesToRequest(products),
        invoiceDiscount:
          toNumberOrZero(invoiceDiscount) > 0
            ? toNumberOrZero(invoiceDiscount)
            : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        taxFocus: taxFocusChoice,
      });

      handleClose();
      onCreated?.(created.id);
    } catch (error) {
      rethrowApiErrorWithMessage(error, dict, setErrorMessage);
    } finally {
      setCreating(false);
    }
  }

  function handleOpenCreateConfirm(): void {
    setCreateAttempted(true);

    if (products.length === 0) {
      setErrorMessage(noProductsMessage);
      setConfirmAction(null);
      return;
    }

    if (hasInvalidLines) {
      setConfirmAction(null);
      return;
    }

    if (taxFocusChoice === null) {
      setConfirmAction(null);
      return;
    }

    setErrorMessage("");
    setConfirmAction("create");
  }

  const taxFocusError = createAttempted && taxFocusChoice === null;
  const invoiceDiscountValue = clampPercentDiscount(toNumberOrZero(invoiceDiscount));

  const productsCardDangerAccent =
    createAttempted && products.length === 0;

  const editingLine = useMemo(
    function findEditingLine(): EditableSellingInvoiceCreateLine | null {
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

  const entryExcludedProductIds = useMemo(
    function getEntryExcludedProductIds(): Set<string> {
      // Duplicate check disabled for selling invoices.
      // return buildDraftExcludedProductIds(products, editingLineLocalId);
      return new Set<string>();
    },
    [],
  );

  const pickerExcludedProductIds = useMemo(
    function getPickerExcludedProductIds(): Set<string> {
      // Duplicate check disabled for selling invoices.
      // return buildDraftExcludedProductIds(products, null);
      return new Set<string>();
    },
    [],
  );

  const lineEntryConfig = useMemo(
    function buildLineEntryConfig() {
      return createSellingLineEntryConfig(dict, dict.unnamed);
    },
    [dict],
  );

  function handleAddLineFromEntry(line: EditableSellingInvoiceCreateLine): void {
    setEditingLineLocalId(null);
    setProducts(function prependLine(previous): EditableSellingInvoiceCreateLine[] {
      return [line, ...previous];
    });
  }

  function handleUpdateLineFromEntry(line: EditableSellingInvoiceCreateLine): void {
    setProducts(function replaceLine(previous): EditableSellingInvoiceCreateLine[] {
      return previous.map(function mapLine(product): EditableSellingInvoiceCreateLine {
        return product.localId === line.localId ? line : product;
      });
    });
  }

  const handleProductRowClick = useCallback(
    function handleProductRowClick(row: EditableSellingInvoiceCreateLine): void {
      setEditingLineLocalId(row.localId);
    },
    [],
  );

  function handleClearLineEdit(): void {
    setEditingLineLocalId(null);
  }

  const sellingPreview = useMemo(
    function computeSellingPreview(): {
      totalBeforeDiscount: number;
      totalAfterDiscount: number;
      totalDiscount: number;
    } {
      let totalBeforeDiscount = 0;
      let totalAfterDiscount = 0;

      products.forEach((product) => {
        const quantity = Math.max(0, Math.floor(toNumberOrZero(product.quantity)));
        const unitPrice = Math.max(0, toNumberOrZero(product.sellingPrice));
        const perLineDiscount = clampPercentDiscount(
          toNumberOrZero(product.productDiscount),
        );
        const effectiveDiscount =
          perLineDiscount > 0 ? perLineDiscount : invoiceDiscountValue;
        const lineBeforeDiscount = quantity * unitPrice;
        const lineAfterDiscount =
          lineBeforeDiscount * ((100 - effectiveDiscount) / 100);
        totalBeforeDiscount += lineBeforeDiscount;
        totalAfterDiscount += lineAfterDiscount;
      });

      return {
        totalBeforeDiscount,
        totalAfterDiscount,
        totalDiscount: totalBeforeDiscount - totalAfterDiscount,
      };
    },
    [products, invoiceDiscountValue],
  );

  const sellingSummaryRows = useMemo(
    function buildSellingSummaryRows(): ImportDraftSummaryRow[] {
      return [
        {
          label: dict.totalSellingPriceLabel,
          value: formatPriceNumber(sellingPreview.totalBeforeDiscount),
          accent: "neutral",
        },
        {
          label: dict.totalDiscountLabel,
          value: formatPriceNumber(sellingPreview.totalDiscount),
          accent: sellingPreview.totalDiscount > 0 ? "warning" : "neutral",
        },
        {
          label: dict.totalAfterDiscountLabel,
          value: formatPriceNumber(sellingPreview.totalAfterDiscount),
          accent: sellingPreview.totalAfterDiscount > 0 ? "primary" : "neutral",
        },
      ];
    },
    [dict, sellingPreview],
  );

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={requestCancel}>
      <div className="flex h-[90vh] w-[90vw] max-w-[1500px] bg-bg flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="text-xl shrink-0 font-semibold text-text">
            {dict.sellingDraft}
          </p>
          <div className="flex min-w-0 flex-1 justify-center px-2">
            {draftError != null ? (
              <HeaderMeta
                icon={<AlertTriangle className="h-4 w-4" />}
                label={dict.error}
                value={dict[draftError.key]}
                accent={draftError.accent}
                format="text"
              />
            ) : errorMessage ? (
              <HeaderMeta
                icon={<AlertTriangle className="h-4 w-4" />}
                label={dict.error}
                value={errorMessage}
                accent="danger"
                format="text"
              />
            ) : null}
          </div>
          <div className="shrink-0">
            <HeaderMeta label={dict.createdDate} value={nowText} />
          </div>
        </div>

        <div className="flex flex-1 gap-4 flex-col overflow-auto px-4 py-3">
          <InvoiceProductLineEntryCard
            ref={entryCardRef}
            config={lineEntryConfig}
            excludedProductIds={entryExcludedProductIds}
            lineFieldValidationActive={createAttempted}
            editSourceLine={editingLine}
            onAddLine={handleAddLineFromEntry}
            onUpdateLine={handleUpdateLineFromEntry}
            onClearEdit={handleClearLineEdit}
          />

          <SellingInvoiceProductsCard
            products={products}
            canEditDraft={true}
            onChangeProducts={function handleProductsChange(
              nextProducts: EditableSellingInvoiceCreateLine[],
            ): void {
              setProducts(nextProducts);
              if (
                editingLineLocalId != null &&
                !nextProducts.some(function stillHasEditingLine(product): boolean {
                  return product.localId === editingLineLocalId;
                })
              ) {
                setEditingLineLocalId(null);
              }
            }}
            updateRow={updateRow}
            entryCardRef={entryCardRef}
            accent={productsCardDangerAccent ? "danger" : "neutral"}
            lineFieldValidationActive={createAttempted}
            activeEditRowId={editingLineLocalId}
            onRowClick={handleProductRowClick}
            excludedProductIds={pickerExcludedProductIds}
          />

          <div className="flex items-start gap-5">
            <div className="flex min-w-0 flex-1 items-start gap-5">
              <div className="flex w-[30rem] flex-col gap-2">
                <Field label={dict.invoiceDiscountLabel}>
                  <div className="flex w-full items-center gap-1.5">
                    <Input
                      value={invoiceDiscount}
                      placeholder={dict.discountPercentHint}
                      onChange={function handleInvoiceDiscount(value): void {
                        setInvoiceDiscount(normalizePercentDiscountInput(value));
                      }}
                      onBlur={function handleInvoiceDiscountBlur(): void {
                        if (invoiceDiscount.trim() === "") {
                          setInvoiceDiscount("");
                          return;
                        }
                        setInvoiceDiscount(finalizePercentDiscountInput(invoiceDiscount));
                      }}
                      inputMode="decimal"
                      className="min-w-0 flex-1"
                    />
                    <span className="shrink-0 text-sm text-muted" aria-hidden>
                      %
                    </span>
                  </div>
                </Field>

                <Field label={dict.noteLabel}>
                  <Input
                    value={notes}
                    onChange={setNotes}
                    placeholder={dict.invoiceDescriptionPlaceholder}
                  />
                </Field>
              </div>

              <Field
                label={dict.isTaxFocusLabel}
                required
                error={taxFocusError ? dict.taxFocusChoiceRequired : undefined}
              >
                <div className="flex item-center gap-4 pt-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={taxFocusChoice === true}
                      aria-label={`${dict.isTaxFocusLabel} — ${dict.yesLabel}`}
                      onChange={function handleTaxFocusYes(): void {
                        setTaxFocusChoice(true);
                      }}
                      className="rounded border-border"
                    />
                    <span>{dict.yesLabel}</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={taxFocusChoice === false}
                      aria-label={`${dict.isTaxFocusLabel} — ${dict.noLabel}`}
                      onChange={function handleTaxFocusNo(): void {
                        setTaxFocusChoice(false);
                      }}
                      className="rounded border-border"
                    />
                    <span>{dict.noLabel}</span>
                  </label>
                </div>
              </Field>
            </div>

            <ImportDraftSummaryCard rows={sellingSummaryRows} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button accent="neutral" onClick={requestCancel}>
            {dict.cancel}
          </Button>
          <Button accent="primary" onClick={handleOpenCreateConfirm}>
            {dict.create}
          </Button>
        </div>
      </div>

      <ConfirmPopup
        open={confirmAction === "cancel"}
        title={dict.confirmDiscardSellingDraftTitle}
        description={dict.confirmDiscardSellingDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleCancelConfirmed}
        onClose={() => setConfirmAction(null)}
        accent="danger"
      />

      <ConfirmPopup
        open={confirmAction === "create"}
        title={dict.confirmCreateSellingInvoiceTitle}
        description={dict.confirmCreateSellingInvoiceDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={creating}
        onConfirm={handleCreateConfirmed}
        onClose={() => setConfirmAction(null)}
      />
    </Popup>
  );
}
