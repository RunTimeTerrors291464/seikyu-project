"use client";

import { Input } from "@/components/ui/Fields";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { Calendar } from "lucide-react";

const DATE_INPUT_CLASS =
  "!h-6 !w-[7rem] shrink-0 !min-w-0 !px-1.5 !py-0 !text-xs";

type InvoiceListDateRangeFilterProps = {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  className?: string;
};

export default function InvoiceListDateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  className,
}: InvoiceListDateRangeFilterProps) {
  const dict = useDict();

  return (
    <div
      className={clsx(
        "ml-auto flex flex-wrap items-center gap-x-1.5 gap-y-2",
        className,
      )}
    >
      <Calendar className="h-3 w-3 shrink-0 text-muted" aria-hidden />
      <span className="text-xs text-muted">{dict.dateFromLabel}</span>
      <Input
        type="date"
        value={fromDate}
        onChange={onFromDateChange}
        className={DATE_INPUT_CLASS}
      />
      <span className="text-xs text-muted">{dict.dateToLabel}</span>
      <Input
        type="date"
        value={toDate}
        onChange={onToDateChange}
        className={DATE_INPUT_CLASS}
      />
    </div>
  );
}
