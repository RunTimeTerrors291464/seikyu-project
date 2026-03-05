"use client";

import AreaLineChart, { Point } from "@/components/charts/AreaLineChart";
import { Period } from "@/components/dashboard/DatePeriodControls";
import { PeriodSelect } from "@/components/ui/PeriodSelect";
import Tooltip from "@/components/ui/Tooltip";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { addDays, addMonths, addWeeks, differenceInDays, format, isBefore, startOfDay, subDays } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Barcode,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleOff,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Hash,
  History,
  Info,
  LineChart,
  Plus,
  Ruler,
  Save,
  Settings,
  Tag,
  ToggleRight,
  Trash2,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

type ProductName = { id: string; name: string };

type HistoryChange = {
  field: string;
  oldValue: string;
  newValue: string;
  icon: "edit" | "stock" | "price" | "name" | "status" | "create";
};

type HistoryGroup = {
  id: string;
  timestamp: string;
  user: string;
  summary: string;
  changes: HistoryChange[];
};

type Product = {
  id: string;
  sku: string;
  barcodeFormat: string;
  currentStock: number;
  minStock: number;
  unit: string;
  saleUnitPrice: number;
  inboundUnitPrice: number;
  note: string;
  status: StockStatus;
  active: boolean;
  names: ProductName[];
  createdAt: string;
  updatedAt: string;
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const UNITS = ["db", "cs", "cs/100db", "kg", "l", "100 cs/db"];

const MOCK_PRODUCT: Product = {
  id: "6",
  sku: "7600000000124",
  barcodeFormat: "EAN-13",
  currentStock: 99,
  minStock: 20,
  unit: "100 cs/db",
  saleUnitPrice: 20,
  inboundUnitPrice: 10,
  note: "Supplier: Hajgumi Kft. Lead time ~3 days.",
  status: "In Stock",
  active: true,
  names: [
    { id: "1", name: "Hajgumi" },
    { id: "2", name: "Hajgumi 2" },
    { id: "3", name: "Elastic Band (EN)" },
  ],
  createdAt: "22-10-2025 10:10:00.000",
  updatedAt: "05-11-2025 09:55:20.000",
};

// Each group = one save action that may touch multiple fields
const MOCK_HISTORY: HistoryGroup[] = [
  {
    id: "g1",
    timestamp: "22-10-2025 10:10:00",
    user: "Admin",
    summary: "Product created",
    changes: [
      { field: "SKU", oldValue: "", newValue: "760000000012", icon: "create" },
      { field: "Barcode Format", oldValue: "", newValue: "EAN-13", icon: "create" },
      { field: "Unit", oldValue: "", newValue: "db", icon: "create" },
      { field: "Sale Price", oldValue: "", newValue: "15 HUF", icon: "create" },
      { field: "Inbound Price", oldValue: "", newValue: "8 HUF", icon: "create" },
    ],
  },
  {
    id: "g2",
    timestamp: "22-10-2025 10:11:30",
    user: "Admin",
    summary: "Added 2 product names",
    changes: [
      { field: "Name added", oldValue: "", newValue: "Hajgumi", icon: "name" },
      { field: "Name added", oldValue: "", newValue: "Hajgumi 2", icon: "name" },
    ],
  },
  {
    id: "g3",
    timestamp: "22-10-2025 10:14:00",
    user: "Admin",
    summary: "Updated pricing",
    changes: [
      { field: "Sale Unit Price", oldValue: "15", newValue: "20", icon: "price" },
      { field: "Inbound Unit Price", oldValue: "8", newValue: "10", icon: "price" },
    ],
  },
  {
    id: "g4",
    timestamp: "23-10-2025 09:05:12",
    user: "Warehouse",
    summary: "Initial stock received",
    changes: [
      { field: "Current Stock", oldValue: "0", newValue: "99", icon: "stock" },
    ],
  },
  {
    id: "g5",
    timestamp: "24-10-2025 11:30:45",
    user: "Admin",
    summary: "Updated unit & SKU correction",
    changes: [
      { field: "Unit", oldValue: "db", newValue: "100 cs/db", icon: "edit" },
      { field: "SKU", oldValue: "760000000012", newValue: "7600000000124", icon: "edit" },
    ],
  },
  {
    id: "g6",
    timestamp: "25-10-2025 08:00:00",
    user: "Warehouse",
    summary: "Stock adjustment",
    changes: [
      { field: "Current Stock", oldValue: "99", newValue: "85", icon: "stock" },
    ],
  },
  {
    id: "g7",
    timestamp: "26-10-2025 14:22:10",
    user: "Manager",
    summary: "Price increase",
    changes: [
      { field: "Sale Unit Price", oldValue: "20", newValue: "22", icon: "price" },
    ],
  },
  {
    id: "g8",
    timestamp: "27-10-2025 09:15:00",
    user: "Manager",
    summary: "Price reverted",
    changes: [
      { field: "Sale Unit Price", oldValue: "22", newValue: "20", icon: "price" },
    ],
  },
  {
    id: "g9",
    timestamp: "28-10-2025 10:00:00",
    user: "Warehouse",
    summary: "Restock received",
    changes: [
      { field: "Current Stock", oldValue: "85", newValue: "120", icon: "stock" },
    ],
  },
  {
    id: "g10",
    timestamp: "29-10-2025 16:45:33",
    user: "Admin",
    summary: "Product deactivated",
    changes: [
      { field: "Active", oldValue: "Active", newValue: "Inactive", icon: "status" },
    ],
  },
  {
    id: "g11",
    timestamp: "30-10-2025 08:30:00",
    user: "Admin",
    summary: "Product reactivated",
    changes: [
      { field: "Active", oldValue: "Inactive", newValue: "Active", icon: "status" },
    ],
  },
  {
    id: "g12",
    timestamp: "01-11-2025 11:00:00",
    user: "Warehouse",
    summary: "Stock sold / adjusted",
    changes: [
      { field: "Current Stock", oldValue: "120", newValue: "99", icon: "stock" },
    ],
  },
  {
    id: "g13",
    timestamp: "03-11-2025 14:10:05",
    user: "Admin",
    summary: "Added EN name & note",
    changes: [
      { field: "Name added", oldValue: "", newValue: "Elastic Band (EN)", icon: "name" },
      { field: "Note", oldValue: "", newValue: "Supplier: Hajgumi Kft. Lead time ~3 days.", icon: "edit" },
    ],
  },
  {
    id: "g14",
    timestamp: "05-11-2025 09:55:20",
    user: "Manager",
    summary: "Inbound price & threshold updated",
    changes: [
      { field: "Inbound Unit Price", oldValue: "10", newValue: "9", icon: "price" },
      { field: "Reorder Threshold", oldValue: "15", newValue: "20", icon: "edit" },
    ],
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
      {icon}{label}
    </span>
  );
}

function ReadonlyField({ value }: { value: string | number }) {
  return (
    <div className="flex h-9 w-full items-center rounded-md border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
      {value}
    </div>
  );
}

function EditableField({ value, onChange, type = "text", placeholder }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="flex h-9 w-full items-center rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
    />
  );
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
        <span>{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 w-full overflow-hidden rounded-md border bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            {UNITS.map((u) => (
              <button key={u} type="button" onClick={() => { onChange(u); setOpen(false); }}
                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 ${value === u ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"}`}>
                {u}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: StockStatus }) {
  const tone =
    status === "In Stock" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : status === "Low Stock" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  const Icon = status === "In Stock" ? TrendingUp : status === "Low Stock" ? AlertTriangle : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />{status}
    </span>
  );
}

function ChangeIcon({ type }: { type: HistoryChange["icon"] }) {
  const s = "h-3 w-3 shrink-0";
  switch (type) {
    case "create": return <Plus className={`${s} text-emerald-500`} />;
    case "stock": return <Warehouse className={`${s} text-blue-500`} />;
    case "price": return <DollarSign className={`${s} text-amber-500`} />;
    case "name": return <Tag className={`${s} text-purple-500`} />;
    case "status": return <ToggleRight className={`${s} text-sky-500`} />;
    case "edit": return <Edit2 className={`${s} text-neutral-400`} />;
  }
}

// ── Collapsible history group ──────────────────────────────────────────────────

function HistoryGroupRow({ group }: { group: HistoryGroup }) {
  const [open, setOpen] = useState(false);
  const isMulti = group.changes.length > 1;

  return (
    <div className="relative flex gap-3 pb-3">
      {/* Timeline dot */}
      <div className="relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-neutral-100 dark:bg-neutral-900 dark:ring-neutral-800">
        <ChangeIcon type={group.changes[0].icon} />
      </div>

      <div className="min-w-0 flex-1">
        {/* Header row — clickable if multiple changes */}
        <button
          type="button"
          onClick={() => isMulti && setOpen((v) => !v)}
          className={`flex w-full items-start justify-between gap-1 text-left ${isMulti ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
              {group.summary}
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">{group.user} · {group.timestamp}</p>
          </div>
          {isMulti && (
            <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-xs text-neutral-400">
              <span>{group.changes.length}</span>
              <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
            </span>
          )}
        </button>

        {/* Single change — always visible inline */}
        {!isMulti && (
          <p className="mt-0.5 text-xs text-neutral-400">
            {group.changes[0].oldValue ? (
              <>
                <span className="line-through">{group.changes[0].oldValue}</span>
                <span className="mx-1 text-neutral-300 dark:text-neutral-600">→</span>
                <span className="font-medium text-neutral-600 dark:text-neutral-300">{group.changes[0].newValue}</span>
              </>
            ) : (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{group.changes[0].newValue}</span>
            )}
          </p>
        )}

        {/* Expanded multi-change list */}
        {isMulti && open && (
          <ul className="mt-2 space-y-1.5 rounded-md border border-neutral-100 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/40">
            {group.changes.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <ChangeIcon type={c.icon} />
                <span className="w-32 shrink-0 font-medium text-neutral-600 dark:text-neutral-300">{c.field}</span>
                {c.oldValue ? (
                  <span className="text-neutral-400">
                    <span className="line-through">{c.oldValue}</span>
                    <span className="mx-1 text-neutral-300 dark:text-neutral-600">→</span>
                    <span className="font-medium text-neutral-600 dark:text-neutral-300">{c.newValue}</span>
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{c.newValue}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Chart Card ─────────────────────────────────────────────────────────────────

const PRODUCT_METRICS = ["Stock", "Product Sold", "Inbound"] as const;
type ProductMetric = typeof PRODUCT_METRICS[number];

function productMetricBase(metric: ProductMetric): number {
  switch (metric) {
    case "Stock": return 100;
    case "Product Sold": return 30;
    case "Inbound": return 20;
  }
}

function generateProductSeries({
  startDate, endDate, period, metric,
}: { startDate: Date; endDate: Date; period: Period; metric: ProductMetric }): Point[] {
  const pts: Point[] = [];
  let cursor = new Date(startDate);
  const normalizedEnd = period === "Daily" ? startOfDay(endDate) : endDate;
  const step = (d: Date) => {
    if (period === "Daily") return addDays(d, 1);
    if (period === "Weekly") return addWeeks(d, 1);
    if (period === "Monthly") return addMonths(d, 1);
    if (period === "Quarterly") return addMonths(d, 3);
    return addMonths(d, 12);
  };
  let i = 0;
  while (isBefore(cursor, addDays(normalizedEnd, 1))) {
    const base = productMetricBase(metric);
    const wave = Math.sin(i / 3) * base * 0.1;
    const noise = (Math.random() - 0.5) * base * 0.05;
    const trend = i * base * 0.003 * (metric === "Stock" ? -0.2 : 0.4);
    pts.push({ x: new Date(cursor), y: Math.max(0, base + wave + noise + trend) });
    cursor = step(cursor);
    i++;
  }
  return pts;
}

// Preset date ranges for the local picker
const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 180 days", days: 180 },
  { label: "Last 365 days", days: 365 },
] as const;

function ChartCard() {
  const [openMenu, setOpenMenu] = useState(false);
  const [metric, setMetric] = useState<ProductMetric>("Stock");
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setOpenMenu(false));

  const [presetDays, setPresetDays] = useState(30);
  const [presetOpen, setPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(presetRef, () => setPresetOpen(false));

  const endDate = new Date();
  const startDate = subDays(endDate, presetDays);

  const [period, setPeriod] = useState<Period>("Weekly");

  const allowedOptions = (() => {
    const spanDays = Math.max(1, differenceInDays(endDate, startDate));
    if (spanDays <= 45) return ["Daily", "Weekly", "Monthly"] as Period[];
    if (spanDays <= 120) return ["Weekly", "Monthly", "Quarterly"] as Period[];
    if (spanDays <= 540) return ["Monthly", "Quarterly", "Yearly"] as Period[];
    return ["Quarterly", "Yearly"] as Period[];
  })();

  if (!allowedOptions.includes(period)) {
    const next = allowedOptions[0];
    if (period !== next) setPeriod(next);
  }

  const series = generateProductSeries({ startDate, endDate, period, metric });
  const presetLabel = DATE_PRESETS.find((p) => p.days === presetDays)?.label ?? "Custom";

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <LineChart className="h-4 w-4 text-neutral-500" />
            <span>Charts</span>
          </div>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openMenu}
              className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900"
            >
              {metric} <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>
            {openMenu && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border bg-white py-1 shadow-lg dark:bg-neutral-900">
                {PRODUCT_METRICS.map((m) => (
                  <button key={m} type="button"
                    onClick={() => { setMetric(m); setOpenMenu(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${metric === m ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Local date range preset picker */}
          <div ref={presetRef} className="relative">
            <button type="button" onClick={() => setPresetOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900 text-neutral-500">
              <span>{format(startDate, "MMM d")} – {format(endDate, "MMM d")}</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>
            {presetOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                {DATE_PRESETS.map((p) => (
                  <button key={p.days} type="button"
                    onClick={() => { setPresetDays(p.days); setPresetOpen(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${presetDays === p.days ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <PeriodSelect
            value={period}
            options={allowedOptions}
            onChange={(v) => setPeriod(v as Period)}
            ariaLabel="Change chart granularity"
          />
          <Tooltip content={`${metric} over the selected date range. Hover on the chart to inspect values.`}>
            <button type="button" aria-label="About chart"
              className="text-neutral-300 transition-colors hover:text-neutral-500 focus:outline-none">
              <Info className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>
      <AreaLineChart data={series} height={220} period={period} />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product>(MOCK_PRODUCT);
  const [newName, setNewName] = useState("");
  const [addingName, setAddingName] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const leftColRef = useRef<HTMLDivElement>(null);
  const middleColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  // Sync middle + right max-height to left col's rendered height
  useEffect(() => {
    const sync = () => {
      const h = leftColRef.current?.offsetHeight;
      if (!h) return;
      if (middleColRef.current) {
        middleColRef.current.style.height = `${h}px`;
        middleColRef.current.style.maxHeight = `${h}px`;
      }
      if (rightColRef.current) {
        rightColRef.current.style.height = `${h}px`;
        rightColRef.current.style.maxHeight = `${h}px`;
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (leftColRef.current) ro.observe(leftColRef.current);
    return () => ro.disconnect();
  }, []);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setProduct((p) => ({ ...p, [key]: value }));
  }

  function handleToggleActive() {
    if (product.active) {
      // Going active → inactive: show confirm dialog first
      setConfirmDeactivate(true);
    } else {
      // Going inactive → active: no confirm needed
      update("active", true);
    }
  }

  function confirmDeactivateProduct() {
    update("active", false);
    setConfirmDeactivate(false);
  }

  function addName() {
    if (!newName.trim()) return;
    setProduct((p) => ({ ...p, names: [...p.names, { id: Date.now().toString(), name: newName.trim() }] }));
    setNewName("");
    setAddingName(false);
  }

  function removeName(id: string) {
    setProduct((p) => ({ ...p, names: p.names.filter((n) => n.id !== id) }));
  }

  const primaryName = product.names[0]?.name ?? "—";
  const derivedStatus: StockStatus =
    product.currentStock === 0 ? "Out of Stock"
      : product.currentStock <= product.minStock ? "Low Stock"
        : "In Stock";
  const totalChanges = MOCK_HISTORY.reduce((s, g) => s + g.changes.length, 0);

  return (
    <div className="flex min-h-0 grow flex-col space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <Link href="/manager/product-inventory"
          className="flex items-center gap-2 text-xl font-semibold text-neutral-900 transition-colors hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300">
          <ArrowLeft className="h-5 w-5" />
          <span>{primaryName}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Timestamps */}
          <div className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs text-neutral-500 shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
            <Clock className="h-3.5 w-3.5" />
            <span>Created: {product.createdAt}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-xs text-neutral-500 shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated: {product.updatedAt}</span>
          </div>

          {/* Active / Inactive toggle */}
          <button
            type="button"
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors ${product.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
          >
            {/* Toggle track */}
            <span className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${product.active ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${product.active ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
            {product.active ? (
              <span className="flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5" /> Active</span>
            ) : (
              <span className="flex items-center gap-1"><CircleOff className="h-3.5 w-3.5" /> Inactive</span>
            )}
          </button>

          {/* Save */}
          <button type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* ── Deactivate confirm modal ── */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDeactivate(false)} />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-sm rounded-xl border bg-white p-6 shadow-xl dark:bg-neutral-900 dark:border-neutral-700">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <CircleOff className="h-4 w-4 text-red-500" />
              </span>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Deactivate product?</h3>
            </div>
            <p className="mb-5 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-200">{primaryName}</span> will be
              marked as inactive and hidden from active listings. You can reactivate it at any time.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setConfirmDeactivate(false)}
                className="rounded-md border px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                Cancel
              </button>
              <button type="button" onClick={confirmDeactivateProduct}
                className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-column layout ── */}
      <div className={`grid min-h-0 items-start grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr_1fr] transition-opacity duration-300 ${!product.active ? "opacity-50 pointer-events-none select-none" : ""}`}>

        {/* ── Left: Product Details ── */}
        <div ref={leftColRef} className="space-y-4 rounded-lg border bg-white p-5 shadow-sm dark:bg-neutral-900">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Product Details</h2>

          <div>
            <FieldLabel icon={<Barcode className="h-3.5 w-3.5" />} label="SKU" />
            <EditableField value={product.sku} onChange={(v) => update("sku", v)} />
          </div>
          <div>
            <FieldLabel icon={<Hash className="h-3.5 w-3.5" />} label="Barcode Format" />
            <ReadonlyField value={product.barcodeFormat} />
          </div>
          <div>
            <FieldLabel icon={<Warehouse className="h-3.5 w-3.5" />} label="Current Stock" />
            <div className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm
              ${product.currentStock === 0
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                : product.currentStock <= product.minStock
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400"
                  : "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              }`}>
              <span className="font-medium tabular-nums">{product.currentStock}</span>
              <StatusPill status={derivedStatus} />
            </div>
          </div>
          <div>
            <FieldLabel icon={<Ruler className="h-3.5 w-3.5" />} label="Unit" />
            <UnitSelect value={product.unit} onChange={(v) => update("unit", v)} />
          </div>
          <div>
            <FieldLabel icon={<TrendingUp className="h-3.5 w-3.5" />} label="Sale Unit Price" />
            <EditableField type="number" value={product.saleUnitPrice} onChange={(v) => update("saleUnitPrice", Number(v))} />
          </div>
          <div>
            <FieldLabel icon={<TrendingDown className="h-3.5 w-3.5" />} label="Inbound Unit Price" />
            <EditableField type="number" value={product.inboundUnitPrice} onChange={(v) => update("inboundUnitPrice", Number(v))} />
          </div>
          <div>
            <FieldLabel icon={<AlertCircle className="h-3.5 w-3.5" />} label="Reorder Threshold" />
            <EditableField type="number" value={product.minStock} onChange={(v) => update("minStock", Number(v))} />
          </div>
          <div>
            <FieldLabel icon={<FileText className="h-3.5 w-3.5" />} label="Note" />
            <textarea value={product.note} onChange={(e) => update("note", e.target.value)}
              placeholder="Leave note here..." rows={4}
              className="w-full resize-none rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* ── Middle: Product Names + Chart ── */}
        <div ref={middleColRef} className="flex h-full flex-col gap-4 overflow-hidden">

          {/* Product Names — flex-1 so it fills space left after chart */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white p-5 shadow-sm dark:bg-neutral-900">

            {/* Header — fixed height, never reflows */}
            <div className="mb-3 flex h-6 shrink-0 items-center gap-2">
              <h2 className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-white">Product Names</h2>

              {addingName ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addName();
                      if (e.key === "Escape") { setAddingName(false); setNewName(""); }
                    }}
                    placeholder="Enter name…"
                    className="h-6 flex-1 rounded border border-neutral-200 bg-white px-2 text-xs outline-none focus:ring-1 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  />
                  {newName.trim() && (
                    <button type="button" onClick={addName}
                      className="flex h-6 shrink-0 items-center rounded bg-neutral-900 px-2 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
                      Add
                    </button>
                  )}
                  <button type="button" onClick={() => { setAddingName(false); setNewName(""); }}
                    className="flex h-6 shrink-0 items-center rounded border px-2 text-xs text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingName(true)}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />Add New Name
                </button>
              )}
            </div>

            {/* Scrollable table — flex-1 fills remaining card height */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-neutral-800">
                    <th className="w-10 pb-2 text-left text-xs font-medium text-neutral-500">No.</th>
                    <th className="pb-2 text-left text-xs font-medium text-neutral-500">
                      <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Name</span>
                    </th>
                    <th className="w-16 pb-2 text-right text-xs font-medium text-neutral-500">
                      <span className="inline-flex items-center justify-end gap-1"><Settings className="h-3.5 w-3.5" /> Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {product.names.map((n, idx) => (
                    <tr key={n.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 text-xs text-neutral-400">{idx + 1}</td>
                      <td className="py-2.5 text-sm text-neutral-800 dark:text-neutral-200">{n.name}</td>
                      <td className="py-2.5 text-right">
                        <button type="button" onClick={() => removeName(n.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {product.names.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-xs text-neutral-400">No names added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart — fixed height, does not grow */}
          <div className="shrink-0"><ChartCard /></div>
        </div>

        {/* ── Right: Product History ── */}
        <div ref={rightColRef} className="flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-neutral-900">
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4 dark:border-neutral-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <History className="h-4 w-4 text-neutral-500" />
              Product History
            </h2>
            <span className="text-xs text-neutral-400">{MOCK_HISTORY.length} saves · {totalChanges} changes</span>
          </div>

          <div className="overflow-y-auto px-5 py-4">
            <div className="relative">
              <div className="absolute bottom-0 left-[7px] top-0 w-px bg-neutral-100 dark:bg-neutral-800" />
              <div className="space-y-0">
                {MOCK_HISTORY.map((group) => (
                  <HistoryGroupRow key={group.id} group={group} />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}