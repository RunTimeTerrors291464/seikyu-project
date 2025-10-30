"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";

export type Period = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";

type Value = { startDate: Date; endDate: Date; period: Period };

type Props = {
  value?: Value;
  onChange?: (v: Value) => void;
};

function toInputValue(d: Date) {
  // yyyy-MM-dd
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);
}

function fromInputValue(v: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function DatePeriodControls({ value, onChange }: Props) {
  const today = new Date();
  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d;
  }, [today]);

  const [startDate, setStartDate] = useState<Date>(value?.startDate ?? defaultStart);
  const [endDate, setEndDate] = useState<Date>(value?.endDate ?? today);
  const [period, setPeriod] = useState<Period>(value?.period ?? "Monthly");

  // If controlled, mirror external value
  useEffect(() => {
    if (!value) return;
    setStartDate(value.startDate);
    setEndDate(value.endDate);
    setPeriod(value.period);
  }, [value?.startDate, value?.endDate, value?.period]);

  const [openRange, setOpenRange] = useState(false);
  const [openPeriod, setOpenPeriod] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(containerRef, () => {
    setOpenRange(false);
    setOpenPeriod(false);
  });

  const label = useMemo(() => {
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const startFmt = sameYear ? "MMM d" : "MMM d, yyyy";
    const endFmt = "MMM d" + (sameYear ? "" : ", yyyy");
    return `${format(startDate, startFmt)} - ${format(endDate, endFmt)}`;
  }, [startDate, endDate]);

  // Temporary local state for the range editor so cancel works as expected
  const [tmpStart, setTmpStart] = useState<string>(toInputValue(startDate));
  const [tmpEnd, setTmpEnd] = useState<string>(toInputValue(endDate));

  function openRangeEditor() {
    setTmpStart(toInputValue(startDate));
    setTmpEnd(toInputValue(endDate));
    setOpenRange(true);
    setOpenPeriod(false);
  }

  function applyRange() {
    const s = fromInputValue(tmpStart);
    const e = fromInputValue(tmpEnd);
    if (!s || !e) return;
    // Ensure start <= end
    if (s > e) {
      if (onChange) onChange({ startDate: e, endDate: s, period });
      else {
        setStartDate(e);
        setEndDate(s);
      }
    } else {
      if (onChange) onChange({ startDate: s, endDate: e, period });
      else {
        setStartDate(s);
        setEndDate(e);
      }
    }
    setOpenRange(false);
  }

  function onSelectPeriod(p: Period) {
    if (onChange) onChange({ startDate, endDate, period: p });
    else setPeriod(p);
    setOpenPeriod(false);
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-stretch">
      {/* Segmented wrapper to visually join buttons */}
      <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900">
        {/* Left segment: Date range trigger */}
        <button
          type="button"
          onClick={openRangeEditor}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-left text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-haspopup="dialog"
          aria-expanded={openRange}
        >
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>{label}</span>
        </button>
        {/* Divider */}
        <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />
        {/* Right segment: Period select trigger */}
        <button
          type="button"
          onClick={() => {
            setOpenPeriod((v) => !v);
            setOpenRange(false);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-haspopup="menu"
          aria-expanded={openPeriod}
        >
          <span>{period}</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
        </button>
      </div>

      {/* Date range popover */}
      {openRange && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[280px] max-w-[90vw] rounded-md border bg-white p-3 shadow-lg dark:bg-neutral-900">
          <div className="mb-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">Select date range</div>
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-[50px] text-neutral-500">From</span>
              <input
                type="date"
                className="w-full rounded border px-2 py-1 text-xs dark:bg-neutral-900"
                value={tmpStart}
                onChange={(e) => setTmpStart(e.target.value)}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-[50px] text-neutral-500">To</span>
              <input
                type="date"
                className="w-full rounded border px-2 py-1 text-xs dark:bg-neutral-900"
                value={tmpEnd}
                onChange={(e) => setTmpEnd(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => setOpenRange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              onClick={applyRange}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Period menu popover */}
      {openPeriod && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-md border bg-white py-1 shadow-lg dark:bg-neutral-900">
          {["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSelectPeriod(p as Period)}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                period === p ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
