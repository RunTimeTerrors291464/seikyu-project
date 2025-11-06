"use client";
import { useMemo, useState } from "react";
import { endOfWeek, format, getISOWeek, startOfWeek } from "date-fns";
import { useMeasure } from "@/lib/hooks/useMeasure";

export type Point = { x: Date; y: number };

type Props = {
  data: Point[];
  height?: number; // px
  period?: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
};

export default function AreaLineChart({ data, height = 220, period = "Daily" }: Props) {
  const { ref, rect } = useMeasure<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(Math.max(0, data.length - 2));

  const padding = { top: 24, right: 16, bottom: 24, left: 16 };
  const width = Math.max(1, rect.width);
  const innerW = Math.max(1, width - padding.left - padding.right);
  const innerH = Math.max(1, height - padding.top - padding.bottom);

  const { points, minY, maxY } = useMemo(() => {
    const ys = data.map((d) => d.y);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const span = max - min || 1;
    const xStep = innerW / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + (1 - (d.y - min) / span) * innerH;
      return { x, y };
    });
    return { points: pts, minY: min, maxY: max };
  }, [data, innerW, innerH, padding.left, padding.top]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const top = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    const baseY = padding.top + innerH;
    return `${top} L${last.x},${baseY} L${first.x},${baseY} Z`;
  }, [points, innerH, padding.top]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }, [points]);

  const xStep = points.length > 1 ? points[1].x - points[0].x : innerW;

  function onMove(e: React.MouseEvent) {
    const bounds = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - bounds.left - padding.left;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(x / xStep)));
    setActive(idx);
  }

  function onLeave() {
    setActive(null);
  }

  const activePoint = active != null ? points[active] : null;
  const activeData = active != null ? data[active] : null;

  // Determine which indices to show as axis ticks to avoid overcrowding
  function maxTicksForPeriod(p: Props["period"]) {
    switch (p) {
      case "Daily":
        return 14; // 2 weeks
      case "Weekly":
        return 13; // ~3 months
      case "Monthly":
        return 12; // 1 year
      case "Yearly":
        return 5; // 5 years
      case "Quarterly":
      default:
        return 8; // reasonable default when quarterly
    }
  }

  // Minimal pixel gap between labels based on period (longer strings need more room)
  function minLabelGapPx(p: Props["period"]) {
    switch (p) {
      case "Weekly":
        return 120; // long label like "Oct 27 - Nov 2"
      case "Monthly":
        return 60; // "Sep", sometimes year below
      case "Quarterly":
        return 56; // "Q1"
      case "Yearly":
        return 48; // "2025"
      case "Daily":
      default:
        return 40; // "Mon 7"
    }
  }

  function computeTickIndices(len: number, maxTicks: number) {
    if (len <= 0) return [] as number[];
    if (len <= maxTicks) return Array.from({ length: len }, (_, i) => i);
    const step = Math.max(1, Math.ceil((len - 1) / Math.max(1, maxTicks - 1)));
    const idx: number[] = [];
    for (let i = 0; i < len - 1; i += step) idx.push(i);
    if (idx[idx.length - 1] !== len - 1) idx.push(len - 1); // ensure last tick
    return idx;
  }

  const desiredTicksByWidth = Math.max(2, Math.floor(innerW / minLabelGapPx(period)));
  const desiredTicks = Math.min(maxTicksForPeriod(period), desiredTicksByWidth);
  const tickIndices = computeTickIndices(data.length, desiredTicks);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Vertical grid and time labels (thinned according to period) */}
        {tickIndices.map((i) => {
          const d = data[i];
          const x = padding.left + i * xStep;
          let topLabel = "";
          let bottomLabel = "";
          const today = new Date();
          if (period === "Daily") {
            topLabel = format(d.x, "EEE");
            bottomLabel = format(d.x, "d");
          } else if (period === "Weekly") {
            const s = startOfWeek(d.x, { weekStartsOn: 1 });
            let e = endOfWeek(d.x, { weekStartsOn: 1 });
            if (e > today) e = today; // clamp last week to today
            topLabel = `${format(s, "MMM d")} - ${format(e, "MMM d")}`;
            const prev = i > 0 ? startOfWeek(data[i - 1].x, { weekStartsOn: 1 }) : null;
            const showYear = !prev || prev.getFullYear() !== s.getFullYear();
            bottomLabel = showYear ? format(s, "yyyy") : "";
          } else if (period === "Monthly") {
            topLabel = format(d.x, "MMM");
            const prev = i > 0 ? data[i - 1].x : null;
            const showYear = !prev || prev.getFullYear() !== d.x.getFullYear();
            bottomLabel = showYear ? format(d.x, "yyyy") : "";
          } else if (period === "Quarterly") {
            const q = Math.floor(d.x.getMonth() / 3) + 1;
            topLabel = `Q${q}`;
            const prev = i > 0 ? data[i - 1].x : null;
            const showYear = !prev || prev.getFullYear() !== d.x.getFullYear();
            bottomLabel = showYear ? format(d.x, "yyyy") : "";
          } else if (period === "Yearly") {
            topLabel = format(d.x, "yyyy");
            bottomLabel = "";
          }
          // Keep labels within chart bounds near edges
          const edgePad = 20;
          const anchor: "start" | "middle" | "end" =
            x < padding.left + edgePad
              ? "start"
              : x > width - padding.right - edgePad
              ? "end"
              : "middle";
          const dx = anchor === "start" ? 4 : anchor === "end" ? -4 : 0;
          return (
            <g key={i}>
              <line
                x1={x}
                x2={x}
                y1={padding.top}
                y2={padding.top + innerH}
                stroke="#e5e7eb"
                strokeDasharray="4 4"
              />
              {/* top labels */}
              {topLabel ? (
                <text x={x} y={16} dx={dx} textAnchor={anchor} className="fill-neutral-600 text-[10px]">
                  {topLabel}
                </text>
              ) : null}
              {bottomLabel ? (
                <text x={x} y={28} dx={dx} textAnchor={anchor} className="fill-neutral-400 text-[10px]">
                  {bottomLabel}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Right dashed continuation from last active */}
        {activePoint && (
          <line
            x1={activePoint.x}
            x2={padding.left + innerW}
            y1={activePoint.y}
            y2={activePoint.y}
            stroke="#3b82f6"
            strokeDasharray="6 6"
            opacity={0.7}
          />
        )}

        {/* Area */}
        <path d={areaPath} fill="url(#areaFill)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

        {/* Active guideline and dot */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top}
              y2={padding.top + innerH}
              stroke="#2563eb"
              strokeWidth={2}
              opacity={0.6}
            />
            <circle cx={activePoint.x} cy={activePoint.y} r={5} fill="#2563eb" />
          </g>
        )}
      </svg>

      {/* Value bubble */}
      {activePoint && activeData && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm"
          style={{ left: activePoint.x, top: Math.max(padding.top, activePoint.y - 34) }}
        >
          {formatCurrency(activeData.y)}
        </div>
      )}
    </div>
  );
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n).toLocaleString()}`;
  }
}
