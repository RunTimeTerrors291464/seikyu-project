"use client";

import useSkuCheck from "@/features/products/hooks/useSkuCheck";
import { useDict } from "@/lib/lang/DictProvider";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Product } from "@/features/products/types/product";

import {
  getInvoiceSkuCheckingHint,
  getInvoiceSkuDisplayError,
  getInvoiceSkuFieldError,
  isInvoiceSkuValidated,
  normalizeInvoiceSkuInput,
} from "../lib/invoiceSkuFieldValidation";
import type {
  InvoiceLineEntryContext,
  InvoiceLineEntryVariantConfig,
} from "../types/invoiceLineEntryTypes";

type UseInvoiceProductLineEntryOptions<TLine, TVariantFields> = {
  excludedProductIds: Set<string>;
  lineFieldValidationActive: boolean;
  lineCommitAttempted: boolean;
  clearLineCommitAttempt: () => void;
  enabled?: boolean;
  /** When set, the card edits this row (SKU locked, Enter commits an update). */
  editSourceLine?: TLine | null;
};

/**
 * Manages shared SKU lookup and draft fields for {@link InvoiceProductLineEntryCard}.
 *
 * @typeParam TLine - Invoice line row type produced by the variant config.
 * @typeParam TVariantFields - Variant-specific form state.
 * @param config - Variant configuration (build line, column renderers, validation).
 * @param options - Exclusions, validation gate, and optional disable flag.
 * @returns Form context, handlers, and refs for the entry card UI.
 */
export function useInvoiceProductLineEntry<TLine, TVariantFields>(
  config: InvoiceLineEntryVariantConfig<TLine, TVariantFields>,
  options: UseInvoiceProductLineEntryOptions<TLine, TVariantFields>,
): {
  context: InvoiceLineEntryContext<TVariantFields>;
  isEditMode: boolean;
  canCommitLine: boolean;
  handleSkuChange: (value: string) => void;
  handleSkuBlur: () => void;
  handleCommitLine: () => TLine | null;
  reset: () => void;
  focusSku: () => void;
  focusQuantity: () => void;
  skuInputRef: RefObject<HTMLInputElement | null>;
  quantityInputRef: RefObject<HTMLInputElement | null>;
} {
  const dict = useDict();
  const {
    excludedProductIds,
    lineFieldValidationActive,
    lineCommitAttempted,
    clearLineCommitAttempt,
    enabled = true,
    editSourceLine = null,
  } = options;

  const skuInputRef = useRef<HTMLInputElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);
  const [variantFields, setVariantFields] = useState<TVariantFields>(() =>
    config.getDefaultVariantFields(),
  );
  const editSourceLineRef = useRef<TLine | null>(null);
  const lastHydratedProductIdRef = useRef<string | null>(null);

  const parsedEditState = useMemo(
    function parseEditSourceLine(): {
      sku: string;
      quantity: string;
      notes: string;
      variantFields: TVariantFields;
      product: Product;
    } | null {
      if (editSourceLine == null || !config.parseLineForEdit) {
        return null;
      }

      return config.parseLineForEdit(editSourceLine);
    },
    [config, editSourceLine],
  );

  const isEditMode = parsedEditState != null;

  const {
    isDebouncing: skuDebouncing,
    checking: skuChecking,
    product: skuLookupProduct,
    notFound: skuNotFound,
  } = useSkuCheck({
    sku,
    skip: !enabled || isEditMode,
    intent: "lookupExisting",
  });

  const resolvedProduct = isEditMode
    ? parsedEditState.product
    : skuLookupProduct;

  useEffect(
    function syncEditSourceLine(): void {
      if (parsedEditState == null) {
        editSourceLineRef.current = null;
        return;
      }

      editSourceLineRef.current = editSourceLine;
      setSku(parsedEditState.sku);
      setQuantity(parsedEditState.quantity);
      setNotes(parsedEditState.notes);
      setVariantFields({
        ...config.getDefaultVariantFields(),
        ...parsedEditState.variantFields,
      });
      setTouched(true);
    },
    [editSourceLine, parsedEditState],
  );

  useEffect(
    function hydrateVariantFieldsWhenProductResolves(): void {
      if (isEditMode) {
        lastHydratedProductIdRef.current = null;
        return;
      }

      if (!skuLookupProduct || !config.hydrateVariantFieldsFromProduct) {
        lastHydratedProductIdRef.current = null;
        return;
      }

      if (lastHydratedProductIdRef.current === skuLookupProduct.id) {
        return;
      }

      lastHydratedProductIdRef.current = skuLookupProduct.id;
      setVariantFields({
        ...config.getDefaultVariantFields(),
        ...config.hydrateVariantFieldsFromProduct(skuLookupProduct),
      });
    },
    [config, isEditMode, skuLookupProduct],
  );

  const skuLookupState = useMemo(
    function buildSkuLookupState() {
      return {
        sku,
        skuDebouncing,
        skuChecking,
        skuNotFound,
        resolvedProduct,
        excludedProductIds,
      };
    },
    [
      sku,
      skuDebouncing,
      skuChecking,
      skuNotFound,
      resolvedProduct,
      excludedProductIds,
    ],
  );

  const getSkuFieldError = useCallback(
    function resolveSkuFieldError(value: string): string {
      if (isEditMode) {
        return "";
      }

      return getInvoiceSkuFieldError(
        value,
        skuLookupState,
        dict,
        config.getSkuError,
      );
    },
    [config.getSkuError, dict, isEditMode, skuLookupState],
  );

  const skuValidated =
    isEditMode ||
    isInvoiceSkuValidated(sku, skuLookupState, dict, config.getSkuError);

  const productName = resolvedProduct
    ? (resolvedProduct.productNames?.[0] ?? dict.unnamed)
    : "";

  const productUnit = resolvedProduct?.productUnitName ?? "";

  const skuError = useMemo(
    function computeSkuError(): string {
      if (isEditMode) {
        return "";
      }

      return getInvoiceSkuDisplayError(sku, touched, getSkuFieldError);
    },
    [getSkuFieldError, isEditMode, sku, touched],
  );

  const skuHint = isEditMode
    ? undefined
    : getInvoiceSkuCheckingHint(skuDebouncing, skuChecking, dict);

  const setVariantField = useCallback(function setVariantField<
    K extends keyof TVariantFields,
  >(key: K, value: TVariantFields[K]): void {
    setVariantFields(function updatePrevious(previous) {
      return {
        ...previous,
        [key]: value,
      };
    });
  }, []);

  const context = useMemo(
    function buildContext(): InvoiceLineEntryContext<TVariantFields> {
      return {
        sku,
        quantity,
        notes,
        product: resolvedProduct,
        productName,
        productUnit,
        skuValidated,
        skuError,
        skuHint,
        touched,
        variantFields,
        lineFieldValidationActive,
        lineCommitAttempted,
        clearLineCommitAttempt,
        setQuantity,
        setNotes,
        setVariantField,
      };
    },
    [
      sku,
      quantity,
      notes,
      resolvedProduct,
      productName,
      productUnit,
      skuValidated,
      skuError,
      skuHint,
      touched,
      variantFields,
      lineFieldValidationActive,
      lineCommitAttempted,
      clearLineCommitAttempt,
      setVariantField,
    ],
  );

  const canAddLine = config.canAddLine(context);
  const canCommitLine = canAddLine;

  const reset = useCallback(
    function resetEntryForm(): void {
      setSku("");
      setQuantity("");
      setNotes("");
      setTouched(false);
      editSourceLineRef.current = null;
      lastHydratedProductIdRef.current = null;
      setVariantFields(config.getDefaultVariantFields());
    },
    [config],
  );

  const focusSku = useCallback(function focusSkuInput(): void {
    skuInputRef.current?.focus();
  }, []);

  const focusQuantity = useCallback(function focusQuantityInput(): void {
    quantityInputRef.current?.focus();
  }, []);

  const handleSkuChange = useCallback(function handleSkuChange(
    value: string,
  ): void {
    setSku(normalizeInvoiceSkuInput(value));
  }, []);

  const handleSkuBlur = useCallback(function handleSkuBlur(): void {
    setTouched(true);
  }, []);

  const handleCommitLine = useCallback(
    function handleCommitLine(): TLine | null {
      if (!canCommitLine || !resolvedProduct) {
        return null;
      }

      if (isEditMode && config.buildLineForUpdate && editSourceLineRef.current) {
        return config.buildLineForUpdate(editSourceLineRef.current, context);
      }

      const line = config.buildLine(resolvedProduct, context);
      reset();
      return line;
    },
    [canCommitLine, config, context, isEditMode, reset, resolvedProduct],
  );

  return {
    context,
    isEditMode,
    canCommitLine,
    handleSkuChange,
    handleSkuBlur,
    handleCommitLine,
    reset,
    focusSku,
    focusQuantity,
    skuInputRef,
    quantityInputRef,
  };
}
