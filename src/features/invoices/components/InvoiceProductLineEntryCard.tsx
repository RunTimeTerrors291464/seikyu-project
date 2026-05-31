"use client";

import { Field, Input } from "@/components/ui/Fields";
import { useInvoiceProductLineEntry } from "@/features/invoices/hooks/useInvoiceProductLineEntry";
import {
  INVOICE_LINE_ENTRY_ADD_SHORTCUT_CHORD,
  INVOICE_LINE_ENTRY_RESET_SHORTCUT_CHORD,
  INVOICE_LINE_ENTRY_RESET_SHORTCUT_FALLBACK_LABEL,
  INVOICE_LINE_ENTRY_RESET_SHORTCUT_ID,
  INVOICE_LINE_ENTRY_RESET_SHORTCUT_KEY_CHORD,
  INVOICE_LINE_ENTRY_RESET_SHORTCUT_PRIORITY,
} from "@/features/invoices/lib/invoiceProductLineEntryShortcuts";
import type { InvoiceLineEntryVariantConfig } from "@/features/invoices/types/invoiceLineEntryTypes";
import { useDict } from "@/lib/lang/DictProvider";
import { isEmptyValue, isZeroValue } from "@/lib/numeric/fieldValueChecks";
import { normalizeIntegerStringInput } from "@/lib/numeric/integerAndMoneyInputs";
import { formatShortcutChordForDisplay } from "@/lib/shortcuts/formatShortcutChordForDisplay";
import { isEditableKeyboardTarget } from "@/lib/shortcuts/isEditableKeyboardTarget";
import { matchesShortcutChord } from "@/lib/shortcuts/matchesShortcutChord";
import { UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE } from "@/lib/shortcuts/universalShortcut";
import useShortcut from "@/lib/shortcuts/useShortcut";
import {
  Barcode,
  Package,
  Ruler,
  Sigma,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export type InvoiceProductLineEntryCardHandle = {
  focusSku: () => void;
  focusQuantity: () => void;
};

type InvoiceProductLineEntryCardProps<TLine, TVariantFields> = {
  config: InvoiceLineEntryVariantConfig<TLine, TVariantFields>;
  excludedProductIds: Set<string>;
  lineFieldValidationActive?: boolean;
  onAddLine: (line: TLine) => void;
  /** When set, loads the row into the card for editing (SKU read-only). */
  editSourceLine?: TLine | null;
  onUpdateLine?: (line: TLine) => void;
  onClearEdit?: () => void;
};

function InvoiceProductLineEntryCardInner<TLine, TVariantFields>(
  {
    config,
    excludedProductIds,
    lineFieldValidationActive = true,
    onAddLine,
    editSourceLine = null,
    onUpdateLine,
    onClearEdit,
  }: InvoiceProductLineEntryCardProps<TLine, TVariantFields>,
  ref: React.Ref<InvoiceProductLineEntryCardHandle>,
) {
  const dict = useDict();
  const cardRef = useRef<HTMLDivElement>(null);
  const [lineCommitAttempted, setLineCommitAttempted] = useState(false);
  const hadEditSourceLineRef = useRef<boolean>(false);

  const clearLineCommitAttempt = useCallback(function clearLineCommitAttempt(): void {
    setLineCommitAttempted(false);
  }, []);

  const {
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
  } = useInvoiceProductLineEntry(config, {
    excludedProductIds,
    lineFieldValidationActive,
    lineCommitAttempted,
    clearLineCommitAttempt,
    editSourceLine,
  });

  useImperativeHandle(ref, function exposeHandle() {
    return { focusSku, focusQuantity };
  });

  const editSourceLineKey =
    editSourceLine != null &&
    typeof editSourceLine === "object" &&
    "localId" in editSourceLine &&
    typeof (editSourceLine as { localId: string }).localId === "string"
      ? (editSourceLine as { localId: string }).localId
      : null;

  useEffect(
    function focusSkuOnMountWhenAdding(): void {
      if (editSourceLineKey == null) {
        focusSku();
      }
    },
    [editSourceLineKey, focusSku],
  );

  useEffect(
    function focusQuantityWhenRowSelectedForEdit(): void {
      if (editSourceLineKey == null) {
        if (hadEditSourceLineRef.current) {
          hadEditSourceLineRef.current = false;
          reset();
          setLineCommitAttempted(false);
          window.requestAnimationFrame(function focusSkuAfterClearEdit(): void {
            focusSku();
          });
        }
        return;
      }

      hadEditSourceLineRef.current = true;
      setLineCommitAttempted(false);
      window.requestAnimationFrame(function focusQuantityForEdit(): void {
        focusQuantity();
      });
    },
    [editSourceLineKey, focusQuantity, focusSku, reset],
  );

  const handleAddClick = useCallback(
    function handleAddClick(): void {
      const line = handleCommitLine();
      if (line) {
        onAddLine(line);
        window.requestAnimationFrame(function focusSkuAfterAdd(): void {
          focusSku();
        });
      }
    },
    [focusSku, handleCommitLine, onAddLine],
  );

  const handleUpdateClick = useCallback(
    function handleUpdateClick(): void {
      if (!onUpdateLine) {
        return;
      }

      const line = handleCommitLine();
      if (line) {
        onUpdateLine(line);
        setLineCommitAttempted(false);
      }
    },
    [handleCommitLine, onUpdateLine],
  );

  const handleResetAndFocusSku = useCallback(
    function handleResetAndFocusSku(): void {
      onClearEdit?.();
      reset();
      setLineCommitAttempted(false);
      window.requestAnimationFrame(function focusSkuAfterReset(): void {
        focusSku();
      });
    },
    [focusSku, onClearEdit, reset],
  );

  const handleResetShortcut = useCallback(
    function handleResetShortcut(_event: KeyboardEvent): void {
      handleResetAndFocusSku();
    },
    [handleResetAndFocusSku],
  );

  useShortcut({
    id: INVOICE_LINE_ENTRY_RESET_SHORTCUT_ID,
    chord: INVOICE_LINE_ENTRY_RESET_SHORTCUT_CHORD,
    handler: handleResetShortcut,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    priority: INVOICE_LINE_ENTRY_RESET_SHORTCUT_PRIORITY,
    label: INVOICE_LINE_ENTRY_RESET_SHORTCUT_FALLBACK_LABEL,
  });

  useShortcut({
    id: `${INVOICE_LINE_ENTRY_RESET_SHORTCUT_ID}.key`,
    chord: INVOICE_LINE_ENTRY_RESET_SHORTCUT_KEY_CHORD,
    handler: handleResetShortcut,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    priority: INVOICE_LINE_ENTRY_RESET_SHORTCUT_PRIORITY,
    label: INVOICE_LINE_ENTRY_RESET_SHORTCUT_FALLBACK_LABEL,
  });

  const handleEnterCommitAttempt = useCallback(
    function handleEnterCommitAttempt(): void {
      if (!isEditMode && !context.skuValidated) {
        handleSkuBlur();
        focusSku();
        return;
      }

      const quantityMissing =
        isEmptyValue(context.quantity) || isZeroValue(context.quantity);

      if (quantityMissing) {
        setLineCommitAttempted(true);
        focusQuantity();
        return;
      }

      if (config.isVariantFieldsInvalidForCommit?.(context)) {
        setLineCommitAttempted(true);
        return;
      }

      if (!canCommitLine) {
        return;
      }

      setLineCommitAttempted(false);

      if (isEditMode) {
        handleUpdateClick();
        return;
      }

      handleAddClick();
    },
    [
      canCommitLine,
      context.quantity,
      context.skuValidated,
      focusQuantity,
      focusSku,
      handleAddClick,
      handleSkuBlur,
      handleUpdateClick,
      isEditMode,
      config.isVariantFieldsInvalidForCommit,
      context,
    ],
  );

  const shortcutsHint = useMemo(
    function buildShortcutsHint(): string {
      return dict.invoiceLineEntryShortcutsHint
        .replace(
          "{resetKeys}",
          formatShortcutChordForDisplay(INVOICE_LINE_ENTRY_RESET_SHORTCUT_CHORD),
        )
        .replace(
          "{addKeys}",
          formatShortcutChordForDisplay(INVOICE_LINE_ENTRY_ADD_SHORTCUT_CHORD),
        );
    },
    [dict.invoiceLineEntryShortcutsHint],
  );

  function handleCardKeyDownCapture(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ): void {
    const target = event.target;
    if (!(target instanceof Node) || !cardRef.current?.contains(target)) {
      return;
    }

    if (
      matchesShortcutChord(event.nativeEvent, INVOICE_LINE_ENTRY_ADD_SHORTCUT_CHORD) &&
      isEditableKeyboardTarget(target)
    ) {
      event.preventDefault();
      event.stopPropagation();
      handleEnterCommitAttempt();
    }
  }

  const fieldsEnabled = context.skuValidated;
  const skuFieldDisabled = isEditMode;
  const showQuantityIssues = lineFieldValidationActive || lineCommitAttempted;
  const quantityEmpty = isEmptyValue(context.quantity);
  const quantityInvalid =
    fieldsEnabled && (quantityEmpty || isZeroValue(context.quantity));
  const quantityErrorMessage =
    showQuantityIssues && quantityInvalid
      ? dict.sellingDraftMissingQuantityError
      : undefined;

  const hasSkuError = context.skuError.length > 0;

  return (
    <div
      ref={cardRef}
      className="shrink-0 space-y-3 rounded-md border border-border bg-card p-3"
      onKeyDownCapture={handleCardKeyDownCapture}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Field
            label={dict.sku}
            icon={<Barcode className="h-3 w-3" />}
            error={hasSkuError ? context.skuError : undefined}
            hint={!hasSkuError ? context.skuHint : undefined}
            messageBesideLabel={true}
            required
          >
            <Input
              inputRef={skuInputRef}
              value={context.sku}
              onChange={handleSkuChange}
              onBlur={handleSkuBlur}
              disabled={skuFieldDisabled}
              inputMode="numeric"
            />
          </Field>
          <Field
            label={dict.productName}
            icon={<Package className="h-3 w-3" />}
          >
            <Input
              value={context.productName}
              onChange={function noop(): void {
                /* read-only */
              }}
              disabled
            />
          </Field>
        </div>

        <div className="space-y-4">
          <Field
            label={dict.quantityLabel}
            icon={<Sigma className="h-3 w-3" />}
            error={quantityErrorMessage}
            messageBesideLabel={true}
            required
          >
            <Input
              inputRef={quantityInputRef}
              value={context.quantity}
              onChange={function handleQuantityChange(value): void {
                clearLineCommitAttempt();
                context.setQuantity(
                  normalizeIntegerStringInput(value, { allowEmpty: true }),
                );
              }}
              disabled={!fieldsEnabled}
              inputMode="numeric"
            />
          </Field>
          <Field label={dict.unit} icon={<Ruler className="h-3 w-3" />}>
            <Input
              value={context.productUnit}
              onChange={function noop(): void {
                /* read-only */
              }}
              disabled
            />
          </Field>
        </div>

        <div className="space-y-4">{config.renderColumn3(context)}</div>

        <div className="space-y-4">{config.renderColumn4(context)}</div>
      </div>

      <p className="text-center text-xs text-muted">{shortcutsHint}</p>
    </div>
  );
}

const InvoiceProductLineEntryCard = forwardRef(InvoiceProductLineEntryCardInner) as <
  TLine,
  TVariantFields,
>(
  props: InvoiceProductLineEntryCardProps<TLine, TVariantFields> & {
    ref?: React.Ref<InvoiceProductLineEntryCardHandle>;
  },
) => React.ReactElement | null;

export default InvoiceProductLineEntryCard;
