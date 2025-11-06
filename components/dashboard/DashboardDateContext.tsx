"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  endOfDay,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";

export type DashboardPreset =
  | "today"
  | "this_week"
  | "this_month"
  | "this_quarter"
  | "this_year"
  | "custom";

export type DashboardDateState = {
  startDate: Date;
  endDate: Date;
  preset: DashboardPreset;
};

export type DashboardDateContextType = DashboardDateState & {
  setPreset: (p: DashboardPreset) => void;
  setCustomRange: (start: Date, end: Date) => void;
};

const DashboardDateContext = createContext<DashboardDateContextType | undefined>(undefined);

function computeRange(preset: DashboardPreset, base = new Date()) {
  const opts = { weekStartsOn: 1 as const };
  switch (preset) {
    case "today":
      return { startDate: startOfDay(base), endDate: endOfDay(base) };
    case "this_week": {
      const s = startOfWeek(base, opts);
      const e = endOfDay(base); // clamp to today
      return { startDate: s, endDate: e };
    }
    case "this_month": {
      const s = startOfMonth(base);
      const e = endOfDay(base); // clamp to today
      return { startDate: s, endDate: e };
    }
    case "this_quarter": {
      const s = startOfQuarter(base);
      const e = endOfDay(base); // clamp to today
      return { startDate: s, endDate: e };
    }
    case "this_year": {
      const s = startOfYear(base);
      const e = endOfDay(base); // clamp to today
      return { startDate: s, endDate: e };
    }
    case "custom":
    default: {
      // default to current month on first load
      const s = startOfMonth(base);
      const e = endOfDay(base);
      return { startDate: s, endDate: e };
    }
  }
}

export function DashboardDateProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => ({ preset: "this_month" as DashboardPreset, ...computeRange("this_month") }), []);
  const [state, setState] = useState<DashboardDateState>(initial);

  function detectPreset(start: Date, end: Date, base = new Date()): DashboardPreset {
    const s = startOfDay(start);
    const e = endOfDay(end);
    const today = endOfDay(base);
    const isSame = (a: Date, b: Date) => a.getTime() === b.getTime();
    if (isSame(s, startOfDay(base)) && isSame(e, today)) return "today";
    if (isSame(s, startOfWeek(base, { weekStartsOn: 1 })) && isSame(e, today)) return "this_week";
    if (isSame(s, startOfMonth(base)) && isSame(e, today)) return "this_month";
    if (isSame(s, startOfQuarter(base)) && isSame(e, today)) return "this_quarter";
    if (isSame(s, startOfYear(base)) && isSame(e, today)) return "this_year";
    return "custom";
  }

  const setPreset = useCallback((p: DashboardPreset) => {
    if (p === "custom") {
      setState((s) => ({ ...s, preset: p }));
    } else {
      const r = computeRange(p);
      setState({ ...r, preset: p });
    }
  }, []);

  const setCustomRange = useCallback((start: Date, end: Date) => {
    const p = detectPreset(start, end);
    if (p === "custom") {
      setState({ startDate: startOfDay(start), endDate: endOfDay(end), preset: "custom" });
    } else {
      const r = computeRange(p);
      setState({ ...r, preset: p });
    }
  }, []);

  const value = useMemo<DashboardDateContextType>(() => ({ ...state, setPreset, setCustomRange }), [state, setPreset, setCustomRange]);

  return <DashboardDateContext.Provider value={value}>{children}</DashboardDateContext.Provider>;
}

export function useDashboardDate() {
  const ctx = useContext(DashboardDateContext);
  if (!ctx) throw new Error("useDashboardDate must be used within DashboardDateProvider");
  return ctx;
}
