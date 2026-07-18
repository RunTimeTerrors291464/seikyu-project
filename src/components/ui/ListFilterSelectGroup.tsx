"use client";

import { ACCENT_STYLES, type Accent } from "@/components/types/ui";
import Select from "@/components/ui/Select";

type ListFilterSelectGroupProps<T extends string> = {
  label: string;
  options: readonly {
    value: T;
    label: string;
  }[];
  value: T;
  onChange: (value: T) => void;
  selectClassName?: string;
  allValue?: T;
  accentForValue?: (value: T) => Accent;
};

function getFilterSelectClassName<T>(
  optionValue: T,
  currentFilter: T,
  allValue: T,
  accentForOption: (value: T) => Accent,
): string {
  if (optionValue === allValue) {
    return currentFilter === optionValue
      ? "border border-text bg-text text-bg"
      : "border border-border bg-card text-muted";
  }

  const accent = accentForOption(optionValue);
  return `${ACCENT_STYLES[accent]} ${currentFilter === optionValue ? "opacity-100" : "opacity-70"}`;
}

export default function ListFilterSelectGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  selectClassName = "min-w-[7.5rem]",
  allValue = "all" as T,
  accentForValue,
}: ListFilterSelectGroupProps<T>) {
  const getOptionClassName =
    accentForValue === undefined
      ? undefined
      : function resolveOptionClassName(
          optionValue: T,
          currentValue: T,
        ): string {
          return getFilterSelectClassName(
            optionValue,
            currentValue,
            allValue,
            accentForValue,
          );
        };

  const triggerClassName =
    accentForValue === undefined
      ? undefined
      : getFilterSelectClassName(value, value, allValue, accentForValue);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>

      <Select
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={label}
        size="sm"
        triggerClassName={triggerClassName}
        getOptionClassName={
          getOptionClassName === undefined
            ? undefined
            : function resolveSelectOptionClassName(
                optionValue: T,
                _isSelected: boolean,
              ): string {
                void _isSelected;
                return getOptionClassName(optionValue, value);
              }
        }
        className={selectClassName}
      />
    </div>
  );
}
