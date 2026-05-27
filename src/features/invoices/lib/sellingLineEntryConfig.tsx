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

import { toNumberOrZero } from "../types/importInvoiceDetail";
import type {
  InvoiceLineEntryContext,
  InvoiceLineEntryVariantConfig,
} from "../types/invoiceLineEntryTypes";
import type { EditableSellingInvoiceCreateLine } from "../types/sellingInvoiceCreate";
import {
  editableSellingLineToProductStub,
  productToEditableSellingCreateLine,
} from "../types/sellingInvoiceCreate";
import {
  clampPercentDiscount,
  finalizePercentDiscountInput,
  normalizePercentDiscountInput,
} from "./percentDiscountInput";

export type SellingLineEntryVariantFields = {
  productDiscount: string;
  sellingPrice: string;
};

/**
 * Ensures variant fields are always fully defined strings for controlled inputs.
 *
 * @param fields - Partial or complete variant fields from state.
 * @returns Normalized fields with empty-string fallbacks.
 */
function normalizeSellingVariantFields(
  fields: Partial<SellingLineEntryVariantFields> | SellingLineEntryVariantFields,
): SellingLineEntryVariantFields {
  return {
    productDiscount: fields.productDiscount ?? "",
    sellingPrice: fields.sellingPrice ?? "",
  };
}

function resolveSellingUnitPrice(
  ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
): number {
  return Math.max(0, toNumberOrZero(ctx.variantFields.sellingPrice));
}

function computeSellingEffectiveUnitPrice(
  sellingPrice: number,
  productDiscount: string,
): string {
  const discount = toNumberOrZero(productDiscount);
  return String((sellingPrice * (100 - discount)) / 100);
}

function computeSellingLineTotal(
  ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
): number {
  if (!ctx.product) {
    return 0;
  }

  return lineTotalFromQuantityAndMoneyStrings(
    ctx.quantity,
    computeSellingEffectiveUnitPrice(
      resolveSellingUnitPrice(ctx),
      ctx.variantFields.productDiscount,
    ),
  );
}

/**
 * Builds the selling-invoice variant config for {@link InvoiceProductLineEntryCard}.
 *
 * @param dict - UI strings.
 * @param nameFallback - Product name when the catalog row has no primary name.
 * @returns Variant config for selling draft lines.
 */
export function createSellingLineEntryConfig(
  dict: Dictionary,
  nameFallback: string,
): InvoiceLineEntryVariantConfig<
  EditableSellingInvoiceCreateLine,
  SellingLineEntryVariantFields
> {
  return {
    variantId: "selling",
    getDefaultVariantFields: function getDefaultVariantFields(): SellingLineEntryVariantFields {
      return normalizeSellingVariantFields({});
    },
    hydrateVariantFieldsFromProduct: function hydrateVariantFieldsFromProduct(
      product: Product,
    ): SellingLineEntryVariantFields {
      return normalizeSellingVariantFields({
        productDiscount: "",
        sellingPrice: String(product.sellingPrice),
      });
    },
    canAddLine: function canAddLine(
      ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
    ): boolean {
      return (
        ctx.skuValidated &&
        toNumberOrZero(ctx.quantity) > 0 &&
        toNumberOrZero(ctx.variantFields.sellingPrice) > 0
      );
    },
    parseLineForEdit: function parseLineForEdit(
      line: EditableSellingInvoiceCreateLine,
    ) {
      const discountRaw = line.productDiscount.trim();
      const productDiscount =
        discountRaw === "" ||
        discountRaw === "0" ||
        discountRaw === "0.00"
          ? ""
          : discountRaw;

      return {
        sku: line.productSku,
        quantity: line.quantity,
        notes: line.notes,
        variantFields: normalizeSellingVariantFields({
          productDiscount,
          sellingPrice: line.sellingPrice,
        }),
        product: editableSellingLineToProductStub(line),
      };
    },
    buildLineForUpdate: function buildLineForUpdate(
      sourceLine: EditableSellingInvoiceCreateLine,
      ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
    ): EditableSellingInvoiceCreateLine | null {
      if (!ctx.product) {
        return null;
      }

      const discount =
        ctx.variantFields.productDiscount.trim() === ""
          ? "0"
          : finalizePercentDiscountInput(ctx.variantFields.productDiscount);
      const quantity = String(Math.floor(toNumberOrZero(ctx.quantity)));
      const unitPrice = resolveSellingUnitPrice(ctx);
      const sellingPrice = finalizeMoneyStringTwoDecimalPlaces(
        String(unitPrice),
        { allowEmpty: false },
      );

      return {
        ...sourceLine,
        quantity,
        productDiscount: discount,
        notes: ctx.notes.trim(),
        sellingPrice,
        totalSellingPrice: String(
          lineTotalFromQuantityAndMoneyStrings(
            quantity,
            computeSellingEffectiveUnitPrice(unitPrice, discount),
          ),
        ),
      };
    },
    buildLine: function buildLine(
      product,
      ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
    ): EditableSellingInvoiceCreateLine {
      const line = productToEditableSellingCreateLine(product, nameFallback);
      const discount =
        ctx.variantFields.productDiscount.trim() === ""
          ? "0"
          : finalizePercentDiscountInput(ctx.variantFields.productDiscount);
      const quantity = String(Math.floor(toNumberOrZero(ctx.quantity)));
      const unitPrice = resolveSellingUnitPrice(ctx);
      const sellingPrice = finalizeMoneyStringTwoDecimalPlaces(
        String(unitPrice),
        { allowEmpty: false },
      );

      return {
        ...line,
        quantity,
        productDiscount: discount,
        notes: ctx.notes.trim(),
        sellingPrice,
        totalSellingPrice: String(
          lineTotalFromQuantityAndMoneyStrings(
            quantity,
            computeSellingEffectiveUnitPrice(unitPrice, discount),
          ),
        ),
      };
    },
    computeLineTotal: computeSellingLineTotal,
    renderColumn3: function renderColumn3(
      ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
    ) {
      const fieldsEnabled = ctx.skuValidated;

      return (
        <>
          <Field
            label={dict.sellingPrice}
            icon={<DollarSign className="h-3 w-3" />}
            required
          >
            <Input
              value={ctx.variantFields.sellingPrice ?? ""}
              onChange={function handleSellingPriceChange(value): void {
                const next = normalizeMoneyStringInput(value, { allowEmpty: true });
                ctx.setVariantField("sellingPrice", next);
              }}
              onBlur={function handleSellingPriceBlur(): void {
                const raw = ctx.variantFields.sellingPrice;
                const next = finalizeMoneyStringTwoDecimalPlaces(raw, {
                  allowEmpty: true,
                });
                if (next !== raw) {
                  ctx.setVariantField("sellingPrice", next);
                }
              }}
              disabled={!fieldsEnabled}
              inputMode="decimal"
            />
          </Field>
          <Field
            label={dict.productDiscountLabel}
            icon={<DollarSign className="h-3 w-3" />}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <Input
                value={ctx.variantFields.productDiscount ?? ""}
                onChange={function handleDiscountChange(value): void {
                  const next = normalizePercentDiscountInput(value);
                  if (next === "") {
                    ctx.setVariantField("productDiscount", next);
                    return;
                  }
                  ctx.setVariantField(
                    "productDiscount",
                    String(clampPercentDiscount(toNumberOrZero(next))),
                  );
                }}
                onBlur={function handleDiscountBlur(): void {
                  const raw = ctx.variantFields.productDiscount;
                  const next = finalizePercentDiscountInput(raw);
                  if (next !== raw) {
                    ctx.setVariantField("productDiscount", next);
                  }
                }}
                disabled={!fieldsEnabled}
                inputMode="decimal"
                className="min-w-0 flex-1"
              />
              <span className="shrink-0 text-sm text-muted" aria-hidden>
                %
              </span>
            </div>
          </Field>
        </>
      );
    },
    renderColumn4: function renderColumn4(
      ctx: InvoiceLineEntryContext<SellingLineEntryVariantFields>,
    ) {
      const fieldsEnabled = ctx.skuValidated;

      return (
        <>
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
          <Field
            label={dict.lineTotalSellingLabel}
            icon={<DollarSign className="h-3 w-3" />}
          >
            <Input
              value={formatPriceNumber(computeSellingLineTotal(ctx))}
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
