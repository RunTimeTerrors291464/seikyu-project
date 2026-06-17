"use client";

type InvoiceListFilterPillGroupProps<T extends string> = {
  label: string;
  options: readonly {
    value: T;
    label: string;
  }[];
  value: T;
  onChange: (value: T) => void;
  getOptionClassName: (optionValue: T, currentValue: T) => string;
};

export default function InvoiceListFilterPillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  getOptionClassName,
}: InvoiceListFilterPillGroupProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>

      <div className="flex gap-1">
        {options.map(function renderOption(option) {
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={function selectOption(): void {
                onChange(option.value);
              }}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${getOptionClassName(option.value, value)}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
