"use client";

import { Field, Input } from "@/components/ui/Fields";
import type { Product } from "@/features/products/types/product";
import type { Dictionary } from "@/lib/lang/i18n";
import {
  finalizeMoneyStringTwoDecimalPlaces,
  formatPriceNumber,
  lineTotalFromQuantityAndMoneyStrings,
  normalizeMoneyStringInput,
} from "@/lib/numeric/integerAndMoneyInputs";
import { DollarSign, MessageSquare } from "lucide-react";

import {
  editableImportLineToProductStub,
  productToEditableImportLine,
  toNumberOrZero,
  type EditableImportInvoiceProduct,
} from "../types/importInvoiceDetail";
import type {
  InvoiceLineEntryContext,
  InvoiceLineEntryVariantConfig,
} from "../types/invoiceLineEntryTypes";

export type ImportLineEntryVariantFields = {
  importPrice: string;
};

/**
 * Ensures variant fields are always fully defined strings for controlled inputs.
 *
 * @param fields - Partial or complete variant fields from state.
 * @returns Normalized fields with empty-string fallbacks.
 */
function normalizeImportVariantFields(
  fields: Partial<ImportLineEntryVariantFields> | ImportLineEntryVariantFields,
): ImportLineEntryVariantFields {
  return {
    importPrice: fields.importPrice ?? "",
  };
}

function resolveImportUnitPrice(
  ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
): number {
  return Math.max(0, toNumberOrZero(ctx.variantFields.importPrice));
}

function computeImportLineTotal(
  ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
): number {
  if (!ctx.product) {
    return 0;
  }

  return lineTotalFromQuantityAndMoneyStrings(
    ctx.quantity,
    String(resolveImportUnitPrice(ctx)),
  );
}

/**
 * Builds the import-invoice variant config for {@link InvoiceProductLineEntryCard}.
 *
 * @param dict - UI strings.
 * @param nameFallback - Product name when the catalog row has no primary name.
 * @returns Variant config for import draft lines.
 */
export function createImportLineEntryConfig(
  dict: Dictionary,
  nameFallback: string,
): InvoiceLineEntryVariantConfig<
  EditableImportInvoiceProduct,
  ImportLineEntryVariantFields
> {
  return {
    variantId: "import",
    getDefaultVariantFields: function getDefaultVariantFields(): ImportLineEntryVariantFields {
      return normalizeImportVariantFields({});
    },
    hydrateVariantFieldsFromProduct: function hydrateVariantFieldsFromProduct(
      product: Product,
    ): ImportLineEntryVariantFields {
      return normalizeImportVariantFields({
        importPrice: String(product.importPrice),
      });
    },
    canAddLine: function canAddLine(
      ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
    ): boolean {
      return (
        ctx.skuValidated &&
        toNumberOrZero(ctx.quantity) > 0 &&
        toNumberOrZero(ctx.variantFields.importPrice) > 0
      );
    },
    parseLineForEdit: function parseLineForEdit(line: EditableImportInvoiceProduct) {
      return {
        sku: line.productSku,
        quantity: line.quantity,
        notes: line.notes,
        variantFields: normalizeImportVariantFields({
          importPrice: line.importPrice,
        }),
        product: editableImportLineToProductStub(line),
      };
    },
    buildLineForUpdate: function buildLineForUpdate(
      sourceLine: EditableImportInvoiceProduct,
      ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
    ): EditableImportInvoiceProduct | null {
      if (!ctx.product) {
        return null;
      }

      const quantity = String(Math.floor(toNumberOrZero(ctx.quantity)));
      const importPrice = finalizeMoneyStringTwoDecimalPlaces(
        String(resolveImportUnitPrice(ctx)),
        { allowEmpty: false },
      );

      return {
        ...sourceLine,
        quantity,
        notes: ctx.notes.trim(),
        importPrice,
      };
    },
    buildLine: function buildLine(
      product: Product,
      ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
    ): EditableImportInvoiceProduct {
      const line = productToEditableImportLine(product, nameFallback);
      const quantity = String(Math.floor(toNumberOrZero(ctx.quantity)));
      const importPrice = finalizeMoneyStringTwoDecimalPlaces(
        String(resolveImportUnitPrice(ctx)),
        { allowEmpty: false },
      );

      return {
        ...line,
        quantity,
        notes: ctx.notes.trim(),
        importPrice,
      };
    },
    computeLineTotal: computeImportLineTotal,
    renderColumn3: function renderColumn3(
      ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
    ) {
      const fieldsEnabled = ctx.skuValidated;

      return (
        <>
        <Field
          label={dict.importPrice}
          icon={<DollarSign className="h-3 w-3" />}
          required
        >
          <Input
            value={ctx.variantFields.importPrice ?? ""}
            onChange={function handleImportPriceChange(value): void {
              const next = normalizeMoneyStringInput(value, { allowEmpty: true });
              ctx.setVariantField("importPrice", next);
            }}
            onBlur={function handleImportPriceBlur(): void {
              const raw = ctx.variantFields.importPrice;
              const next = finalizeMoneyStringTwoDecimalPlaces(raw, {
                allowEmpty: true,
              });
              if (next !== raw) {
                ctx.setVariantField("importPrice", next);
              }
            }}
            disabled={!fieldsEnabled}
            inputMode="decimal"
          />
        </Field>
        <Field
          label={dict.noteLabel}
          icon={<MessageSquare className="h-3 w-3" />}
        >
          <Input
            value={ctx.notes}
            onChange={ctx.setNotes}
            disabled={!fieldsEnabled}
          />
        </Field>
      </>
      );
    },
    renderColumn4: function renderColumn4(
      ctx: InvoiceLineEntryContext<ImportLineEntryVariantFields>,
    ) {
      return (
        <>
          <Field
            label={dict.totalPriceLabel}
            icon={<DollarSign className="h-3 w-3" />}
          >
            <Input
              value={formatPriceNumber(computeImportLineTotal(ctx))}
              onChange={function noop(): void {
                /* read-only */
              }}
              disabled
            />
          </Field>
        </>
      );
    },
  };
}
