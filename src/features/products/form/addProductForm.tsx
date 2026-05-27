"use client";

import {
  AlertTriangle,
  Barcode,
  DollarSign,
  Package,
  Ruler,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Field,
  Input,
  SelectButton,
  Textarea,
} from "@/components/ui/Fields";


import { getProductCreateSkuFieldError } from "@/features/products/lib/productSkuFieldValidation";
import { Dictionary } from "@/lib/lang/i18n";
import {
  finalizeMoneyStringTwoDecimalPlaces,
  normalizeMoneyStringInput,
  parseMoneyLikeString,
} from "@/lib/numeric/integerAndMoneyInputs";
import { getSkuCheckingHint, normalizeSkuInput } from "@/lib/sku/skuInputValidation";
import UnitPickerPopup from "@features/products/layout/UnitPickerPopup";

import useSkuCheck from "../hooks/useSkuCheck";

/* ============================= */

type FormValues = {
  sku: string;
  name: string;
  productUnitId: string;
  productUnitName: string;
  importPrice: string;
  sellingPrice: string;
  reorderThreshold: string;
  productDescription: string;
};

type SubmitFormValues = Omit<
  FormValues,
  "importPrice" | "sellingPrice" | "reorderThreshold"
> & {
  importPrice: number;
  sellingPrice: number;
  reorderThreshold: number;
};

type Props = {
  dict: Dictionary;
  onSubmit: (data: SubmitFormValues) => void;
  /**
   * Called whenever the form changes from its initial empty state.
   * Useful for guarding destructive actions like "discard changes".
   */
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function AddNewProductForm({
  dict,
  onSubmit,
  onDirtyChange,
}: Props) {
  const { setValue, watch, handleSubmit, getValues } =
    useForm<FormValues>({
      defaultValues: {
        sku: "",
        name: "",
        productUnitId: "",
        productUnitName: "",
        importPrice: "",
        sellingPrice: "",
        reorderThreshold: "",
        productDescription: "",
      },
    });

  const values = watch();

  /**
   * Computes whether the form differs from its initial empty state, and reports it upward.
   */
  useEffect(function reportDirtyState(): void {
    const isDirty =
      values.sku !== "" ||
      values.name.trim() !== "" ||
      values.productUnitId !== "" ||
      values.importPrice !== "" ||
      values.sellingPrice !== "" ||
      values.reorderThreshold !== "" ||
      values.productDescription.trim() !== "";

    onDirtyChange?.(isDirty);
  }, [onDirtyChange, values]);

  const [unitOpen, setUnitOpen] = useState(false);

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  const [touched, setTouched] = useState<
    Partial<Record<keyof FormValues, boolean>>
  >({});

  /* ============================= */
  /* CHECK SKU DUPLICATE */
  /* ============================= */

  const {
    checking: skuChecking,
    isDebouncing: skuDebouncing,
    isDuplicate: skuDuplicate,
  } =
    useSkuCheck({ sku: values.sku, intent: "checkDuplicate" });

  /* ============================= */
  /* FIELD VALIDATION */
  /* ============================= */

  const skuDuplicateCheckState = {
    skuDebouncing,
    skuChecking,
    skuDuplicate,
  };

  const validateField = (
    field: keyof FormValues,
    value: string,
    options?: { validateRequired?: boolean },
  ) => {
    const error = getFieldError(field, value, options);

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const getFieldError = (
    field: keyof FormValues,
    value: string,
    options?: { validateRequired?: boolean },
  ) => {
    switch (field) {
      case "sku":
        return getProductCreateSkuFieldError(
          value,
          skuDuplicateCheckState,
          dict,
          {
            showEmptyError:
              options?.validateRequired === true || touched.sku === true,
          },
        );

      case "name":
        if (!value.trim())
          return dict.productNameRequired;
        return "";

      case "productUnitId":
        if (!value)
          return dict.unitRequired;
        return "";

      case "importPrice":
      case "sellingPrice":
        if (!value.trim()) {
          return dict.invalidPrice;
        }
        if (parseMoneyLikeString(value) < 0) {
          return dict.invalidPrice;
        }
        return "";

      case "reorderThreshold":
        if (!value || !Number.isInteger(Number(value)))
          return dict.invalidThreshold;
        if (Number(value) < 0)
          return dict.invalidThreshold;
        return "";


      default:
        return "";
    }
  };

  useEffect(() => {
    const shouldValidateSku = touched.sku || values.sku.length > 0;
    if (!shouldValidateSku) return;

    const nextSkuError = getFieldError("sku", values.sku, {
      validateRequired: touched.sku === true,
    });
    setErrors((previousErrors) => ({
      ...previousErrors,
      sku: nextSkuError,
    }));
  }, [
    values.sku,
    touched.sku,
    skuDebouncing,
    skuChecking,
    skuDuplicate,
  ]);

  /* ============================= */
  /* WARNING */
  /* ============================= */

  const warnings = {
    importPrice:
      touched.importPrice && parseMoneyLikeString(values.importPrice) === 0,

    sellingPrice:
      touched.sellingPrice && parseMoneyLikeString(values.sellingPrice) === 0,

    reorderThreshold:
      touched.reorderThreshold &&
      values.reorderThreshold === "0",
  };

  /* ============================= */
  /* SUBMIT */
  /* ============================= */

  const onSubmitForm = () => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};

    (Object.keys(values) as (keyof FormValues)[]).forEach((field) => {
      const error = getFieldError(field, values[field], {
        validateRequired: true,
      });
      if (error) newErrors[field] = error;
    });

    setTouched({
      sku: true,
      name: true,
      productUnitId: true,
      importPrice: true,
      sellingPrice: true,
      reorderThreshold: true,
      productDescription: true,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;
    if (skuDebouncing || skuChecking) return;

    onSubmit({
      ...values,
      importPrice: parseMoneyLikeString(values.importPrice),
      sellingPrice: parseMoneyLikeString(values.sellingPrice),
      reorderThreshold: Number(values.reorderThreshold),
    });
  };

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      noValidate
      className="space-y-4"
    >
      {/* SKU */}
      <Field
        label={dict.sku}
        icon={<Barcode className="h-3 w-3" />}
        error={errors.sku}
        hint={getSkuCheckingHint(skuDebouncing, skuChecking, dict.checkingSku)}
        required
        messageBesideLabel={true}
      >
        <Input
          value={values.sku}
          onChange={(v) => {
            const digits = normalizeSkuInput(v);

            setValue("sku", digits);

            // clear error immediately
            setErrors((prev) => ({
              ...prev,
              sku: "",
            }));

            validateField("sku", digits);
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, sku: true }));
            validateField("sku", getValues("sku"), { validateRequired: true });
          }}
        />
      </Field>

      {/* NAME */}
      <Field
        label={dict.productName}
        icon={<Package className="h-3 w-3" />}
        error={errors.name}
        required
        messageBesideLabel={true}
      >
        <Input
          value={values.name}
          onChange={(v) => {
            setValue("name", v);
            validateField("name", v);
          }}
          onBlur={() =>
            setTouched((t) => ({ ...t, name: true }))
          }
        />
      </Field>

      {/* UNIT */}
      <Field
        label={dict.unit}
        icon={<Ruler className="h-3 w-3" />}
        error={errors.productUnitId}
        required
        messageBesideLabel={true}
      >
        <SelectButton
          value={values.productUnitName}
          placeholder={dict.selectUnit}
          onClick={() => setUnitOpen(true)}
        />
      </Field>

      <UnitPickerPopup
        open={unitOpen}
        onClose={() => setUnitOpen(false)}
        selectedUnitId={values.productUnitId}
        onSelect={(unit) => {
          setValue("productUnitId", unit.id);
          setValue("productUnitName", unit.unitName);
          validateField("productUnitId", unit.id);
        }}
        onClearSelection={() => {
          setValue("productUnitId", "");
          setValue("productUnitName", "");
          validateField("productUnitId", "");
        }}
      />

      {/* IMPORT PRICE */}
      <Field
        label={dict.importPrice}
        required
        messageBesideLabel={true}
        icon={<DollarSign className="h-3 w-3" />}
        error={errors.importPrice}
        warning={
          warnings.importPrice
            ? dict.invalidPrice
            : undefined
        }
      >
        <Input
          value={values.importPrice}
          onChange={(v) => {
            const normalized = normalizeMoneyStringInput(v, { allowEmpty: true });
            setValue("importPrice", normalized);
            validateField("importPrice", normalized);
          }}
          onBlur={() => {
            setTouched((t) => ({
              ...t,
              importPrice: true,
            }));
            const current = getValues("importPrice");
            const finalized = finalizeMoneyStringTwoDecimalPlaces(current, {
              allowEmpty: true,
            });
            if (finalized !== current) {
              setValue("importPrice", finalized);
            }
            validateField("importPrice", finalized);
          }}
          inputMode="decimal"
        />
      </Field>

      {/* SELLING PRICE */}
      <Field
        label={dict.sellingPrice}
        icon={<DollarSign className="h-3 w-3" />}
        required
        messageBesideLabel={true}
        error={errors.sellingPrice}
        warning={
          warnings.sellingPrice
            ? dict.invalidPrice
            : undefined
        }
      >
        <Input
          value={values.sellingPrice}
          onChange={(v) => {
            const normalized = normalizeMoneyStringInput(v, { allowEmpty: true });
            setValue("sellingPrice", normalized);
            validateField("sellingPrice", normalized);
          }}
          onBlur={() => {
            setTouched((t) => ({
              ...t,
              sellingPrice: true,
            }));
            const current = getValues("sellingPrice");
            const finalized = finalizeMoneyStringTwoDecimalPlaces(current, {
              allowEmpty: true,
            });
            if (finalized !== current) {
              setValue("sellingPrice", finalized);
            }
            validateField("sellingPrice", finalized);
          }}
          inputMode="decimal"
        />
      </Field>

      {/* REORDER */}
      <Field
        label={dict.reorderThreshold}
        icon={<AlertTriangle className="h-3 w-3" />}
        required
        messageBesideLabel={true}
        error={errors.reorderThreshold}
        warning={
          warnings.reorderThreshold
            ? dict.invalidThreshold
            : undefined
        }
      >
        <Input
          type="number"
          value={values.reorderThreshold}
          onChange={(v) => {
            setValue("reorderThreshold", v);
            validateField("reorderThreshold", v);
          }}
          onBlur={() =>
            setTouched((t) => ({
              ...t,
              reorderThreshold: true,
            }))
          }
        />
      </Field>

      {/* DESCRIPTION */}
      <Field label={dict.description} icon={<Ruler className="h-3 w-3" />}>
        <Textarea
          value={values.productDescription}
          onChange={(v) =>
            setValue("productDescription", v)
          }
        />
      </Field>
    </form>
  );
}