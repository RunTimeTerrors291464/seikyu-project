"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  Field,
  Input,
  SelectButton,
  Textarea,
} from "@/components/ui/Fields";


import { Dictionary } from "@/lib/lang/i18n";
import UnitPickerPopup from "@features/products/layout/UnitPickerPopup";

import useSkuValidation from "../hooks/useSkuValidation";

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

type Props = {
  dict: Dictionary;
  onSubmit: (data: any) => void;
};

export default function AddNewProductForm({
  dict,
  onSubmit,
}: Props) {
  const { setValue, watch, handleSubmit } =
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

  const { checking: skuChecking, isDuplicate: skuDuplicate } =
    useSkuValidation({ sku: values.sku });

  /* ============================= */
  /* FIELD VALIDATION */
  /* ============================= */

  const validateField = (field: keyof FormValues, value: string) => {
    const error = getFieldError(field, value);

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const getFieldError = (
    field: keyof FormValues,
    value: string
  ) => {
    switch (field) {
      case "sku":
        if (!value || !/^\d{13}$/.test(value))
          return dict.skuMustBe13;

        if (skuDuplicate)
          return dict.skuAlreadyExists;
        return "";

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
        if (!value || isNaN(Number(value)))
          return dict.invalidPrice;
        if (Number(value) < 0)
          return dict.invalidPrice;
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

  /* ============================= */
  /* WARNING */
  /* ============================= */

  const warnings = {
    importPrice:
      touched.importPrice &&
      values.importPrice === "0",

    sellingPrice:
      touched.sellingPrice &&
      values.sellingPrice === "0",

    reorderThreshold:
      touched.reorderThreshold &&
      values.reorderThreshold === "0",

    description:
      touched.productDescription &&
      !values.productDescription.trim(),
  };

  /* ============================= */
  /* SUBMIT */
  /* ============================= */

  const onSubmitForm = () => {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};

    (Object.keys(values) as (keyof FormValues)[]).forEach((field) => {
      const error = getFieldError(field, values[field]);
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

    onSubmit({
      ...values,
      importPrice: Number(values.importPrice),
      sellingPrice: Number(values.sellingPrice),
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
        error={errors.sku}
        hint={skuChecking ? dict.checkingSku : undefined}>
        <Input
          value={values.sku}
          onChange={(v) => {
            const digits = v.replace(/\D/g, "").slice(0, 13);

            setValue("sku", digits);

            // clear error immediately
            setErrors((prev) => ({
              ...prev,
              sku: "",
            }));

            validateField("sku", digits);
          }}
          onBlur={() =>
            setTouched((t) => ({ ...t, sku: true }))
          }
        />
      </Field>

      {/* NAME */}
      <Field label={dict.productName} error={errors.name}>
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
      <Field label={dict.unit} error={errors.productUnitId}>
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
      />

      {/* IMPORT PRICE */}
      <Field
        label={dict.importPrice}
        error={errors.importPrice}
        warning={
          warnings.importPrice
            ? dict.invalidPrice
            : undefined
        }
      >
        <Input
          type="number"
          value={values.importPrice}
          onChange={(v) => {
            setValue("importPrice", v);
            validateField("importPrice", v);
          }}
          onBlur={() =>
            setTouched((t) => ({
              ...t,
              importPrice: true,
            }))
          }
        />
      </Field>

      {/* SELLING PRICE */}
      <Field
        label={dict.sellingPrice}
        error={errors.sellingPrice}
        warning={
          warnings.sellingPrice
            ? dict.invalidPrice
            : undefined
        }
      >
        <Input
          type="number"
          value={values.sellingPrice}
          onChange={(v) => {
            setValue("sellingPrice", v);
            validateField("sellingPrice", v);
          }}
          onBlur={() =>
            setTouched((t) => ({
              ...t,
              sellingPrice: true,
            }))
          }
        />
      </Field>

      {/* REORDER */}
      <Field
        label={dict.reorderThreshold}
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
      <Field
        label={dict.description}
        warning={
          warnings.description
            ? dict.emptyDescription
            : undefined
        }
      >
        <Textarea
          value={values.productDescription}
          onChange={(v) =>
            setValue("productDescription", v)
          }
          onBlur={() =>
            setTouched((t) => ({
              ...t,
              productDescription: true,
            }))
          }
        />
      </Field>

      <button type="submit" className="hidden" />
    </form>
  );
}