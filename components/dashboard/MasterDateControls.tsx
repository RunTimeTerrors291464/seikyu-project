"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { DashboardPreset, useDashboardDate } from "./DashboardDateContext";

const PRESET_LABELS: Record<DashboardPreset, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  custom: "Custom",
};

function toInputValue(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}
function fromInputValue(v: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function MasterDateControls() {
  const { startDate, endDate, preset, setPreset, setCustomRange } = useDashboardDate();

  const [openRange, setOpenRange] = useState(false);
  const [openPreset, setOpenPreset] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => {
    setOpenRange(false);
    setOpenPreset(false);
  });

  const label = useMemo(() => {
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const startFmt = sameYear ? "MMM d" : "MMM d, yyyy";
    const endFmt = "MMM d" + (sameYear ? "" : ", yyyy");
    return `${format(startDate, startFmt)} - ${format(endDate, endFmt)}`;
  }, [startDate, endDate]);

  // temp for editing
  const [tmpStart, setTmpStart] = useState<string>(toInputValue(startDate));
  const [tmpEnd, setTmpEnd] = useState<string>(toInputValue(endDate));

  useEffect(() => {
    setTmpStart(toInputValue(startDate));
    setTmpEnd(toInputValue(endDate));
  }, [startDate, endDate]);

  function openRangeEditor() {
    setOpenRange(true);
    setOpenPreset(false);
  }
  function applyRange() {
    const s = fromInputValue(tmpStart);
    const e = fromInputValue(tmpEnd);
    if (!s || !e) return;
    if (s > e) setCustomRange(e, s);
    else setCustomRange(s, e);
    setOpenRange(false);
  }

  return (
    <div ref={ref} className="relative inline-flex items-stretch">
      <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900">
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
        <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />
        <button
          type="button"
          onClick={() => {
            setOpenPreset((v) => !v);
            setOpenRange(false);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-haspopup="menu"
          aria-expanded={openPreset}
        >
          <span>{PRESET_LABELS[preset]}</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
        </button>
      </div>

      {openRange && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[280px] max-w-[90vw] rounded-md border bg-white p-3 shadow-lg dark:bg-neutral-900">
          <div className="mb-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">Select date range</div>
          <div className="grid grid-cols-1 gap-2">
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-[50px] text-neutral-500">From</span>
              <input type="date" className="w-full rounded border px-2 py-1 text-xs dark:bg-neutral-900" value={tmpStart} onChange={(e) => setTmpStart(e.target.value)} />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-[50px] text-neutral-500">To</span>
              <input type="date" className="w-full rounded border px-2 py-1 text-xs dark:bg-neutral-900" value={tmpEnd} onChange={(e) => setTmpEnd(e.target.value)} />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" className="rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800" onClick={() => setOpenRange(false)}>
              Cancel
            </button>
            <button type="button" className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900" onClick={applyRange}>
              Apply
            </button>
          </div>
        </div>
      )}

      {openPreset && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-md border bg-white py-1 shadow-lg dark:bg-neutral-900">
          {(Object.keys(PRESET_LABELS) as DashboardPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPreset(p);
                setOpenPreset(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                preset === p ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
