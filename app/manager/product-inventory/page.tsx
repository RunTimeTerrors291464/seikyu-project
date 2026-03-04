"use client";

import DataTable, { Column } from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import {
  AlertTriangle,
  Barcode,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleOff,
  DollarSign,
  Download,
  Filter,
  Hash,
  Package,
  PowerOff,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Warehouse
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  importPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  status: StockStatus;
  active: boolean;
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: Product[] = [
  { id: "1", sku: "9876543210128", name: "RapidCharge Power Bank", unit: "db", importPrice: 3200, sellingPrice: 5490, currentStock: 142, minStock: 20, status: "In Stock", active: true },
  { id: "2", sku: "2957486032198", name: "FreshBrew Coffee Maker", unit: "db", importPrice: 8500, sellingPrice: 14990, currentStock: 38, minStock: 10, status: "In Stock", active: true },
  { id: "3", sku: "6401829573345", name: "CozyLite Desk Lamp", unit: "db", importPrice: 1800, sellingPrice: 3290, currentStock: 8, minStock: 15, status: "Low Stock", active: true },
  { id: "4", sku: "0000000000013", name: "PureGlow Face Serum", unit: "db", importPrice: 2100, sellingPrice: 4200, currentStock: 0, minStock: 10, status: "Out of Stock", active: false },
  { id: "5", sku: "0000000000142", name: "EcoSmart Water Bottle", unit: "db", importPrice: 900, sellingPrice: 1990, currentStock: 310, minStock: 30, status: "In Stock", active: true },
  { id: "6", sku: "7601600413998", name: "Fa dísztárgy (small)", unit: "db", importPrice: 400, sellingPrice: 700, currentStock: 523, minStock: 50, status: "In Stock", active: true },
  { id: "7", sku: "7501100307554", name: "Fa dísztárgy (medium)", unit: "db", importPrice: 300, sellingPrice: 530, currentStock: 12, minStock: 20, status: "Low Stock", active: true },
  { id: "8", sku: "0000000253767", name: "Uzsonnattasak 17×25", unit: "cs", importPrice: 80, sellingPrice: 130, currentStock: 840, minStock: 100, status: "In Stock", active: true },
  { id: "9", sku: "0000000000666", name: "Szatyor cs/100db", unit: "cs/100db", importPrice: 250, sellingPrice: 450, currentStock: 7, minStock: 10, status: "Low Stock", active: false },
  { id: "10", sku: "0000000000024", name: "Bizsu nyaklánc", unit: "db", importPrice: 80, sellingPrice: 150, currentStock: 0, minStock: 20, status: "Out of Stock", active: false },
  { id: "11", sku: "0000000000016", name: "Ásvány karkötő", unit: "db", importPrice: 180, sellingPrice: 350, currentStock: 205, minStock: 30, status: "In Stock", active: true },
  { id: "12", sku: "0000000000019", name: "Ásvány nyaklánc", unit: "db", importPrice: 200, sellingPrice: 390, currentStock: 74, minStock: 20, status: "In Stock", active: true },
  { id: "13", sku: "0000000000026", name: "Bizsualkatrész", unit: "db", importPrice: 150, sellingPrice: 300, currentStock: 3, minStock: 10, status: "Low Stock", active: true },
  { id: "14", sku: "0000000000007", name: "Ragasztó", unit: "db", importPrice: 280, sellingPrice: 500, currentStock: 56, minStock: 10, status: "In Stock", active: true },
  { id: "15", sku: "7601600614302", name: "WC kefe tartó", unit: "db", importPrice: 200, sellingPrice: 370, currentStock: 29, minStock: 10, status: "In Stock", active: true },
  { id: "16", sku: "7601600413981", name: "Fa dísztárgy (large)", unit: "db", importPrice: 450, sellingPrice: 700, currentStock: 0, minStock: 10, status: "Out of Stock", active: false },
  { id: "17", sku: "8410100621997", name: "ErgoGrip Mouse Pad XL", unit: "db", importPrice: 1200, sellingPrice: 2490, currentStock: 61, minStock: 15, status: "In Stock", active: true },
  { id: "18", sku: "5901234123457", name: "ClearView Screen Protector", unit: "db", importPrice: 600, sellingPrice: 1290, currentStock: 4, minStock: 20, status: "Low Stock", active: false },
  { id: "19", sku: "3045140105502", name: "NatureBrew Green Tea", unit: "cs", importPrice: 350, sellingPrice: 690, currentStock: 188, minStock: 25, status: "In Stock", active: true },
  { id: "20", sku: "0737628064502", name: "SlimFit Yoga Mat", unit: "db", importPrice: 2800, sellingPrice: 5990, currentStock: 22, minStock: 10, status: "In Stock", active: true },
];

const STATUSES: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"];

// ── Pills ──────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: StockStatus }) {
  const tone =
    status === "In Stock"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : status === "Low Stock"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  const Icon = status === "In Stock" ? TrendingUp : status === "Low Stock" ? AlertTriangle : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {status}
    </span>
  );
}

function ActivePill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
      <CircleCheck className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      <CircleOff className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      Inactive
    </span>
  );
}

// ── KPI tile ───────────────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "emerald" | "amber" | "red" | "blue";
}) {
  const color =
    accent === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
      accent === "amber" ? "text-amber-600 dark:text-amber-400" :
        accent === "red" ? "text-red-600 dark:text-red-400" :
          "text-neutral-900 dark:text-white";
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProductInventoryPage() {
  const [search, setSearch] = useState("");
  const [searchRule, setSearchRule] = useState("SKU");
  const searchRuleRef = useRef("SKU");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "All">("All");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rule = searchRuleRef.current;
    return ALL_PRODUCTS.filter((p) => {
      const matchSearch = !q || (
        rule === "SKU" ? p.sku.toLowerCase().includes(q) :
          rule === "Name" ? p.name.toLowerCase().includes(q) :
            p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      );
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      const matchActive = activeFilter === "All" || (activeFilter === "Active" && p.active) || (activeFilter === "Inactive" && !p.active);
      return matchSearch && matchStatus && matchActive;
    });
  }, [search, searchRule, statusFilter, activeFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const inStockCount = ALL_PRODUCTS.filter((p) => p.status === "In Stock").length;
  const lowStockCount = ALL_PRODUCTS.filter((p) => p.status === "Low Stock").length;
  const outOfStockCount = ALL_PRODUCTS.filter((p) => p.status === "Out of Stock").length;
  const totalInventoryValue = ALL_PRODUCTS.reduce((s, p) => s + p.importPrice * p.currentStock, 0);

  const rowOptions = [10, 20, 50];

  const columns: Column<Product>[] = useMemo(() => [
    {
      id: "sku",
      header: "SKU",
      icon: <Barcode className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => (
        <Link
          href={`/manager/product-inventory/${p.id}`}
          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {p.sku}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Product Name",
      icon: <Package className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => (
        <span className="truncate font-medium text-neutral-900 dark:text-white">{p.name}</span>
      ),
      tdClassName: "max-w-[220px]",
    },
    {
      id: "unit",
      header: "Unit",
      icon: <Hash className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-200">{p.unit}</span>
      ),
      thClassName: "w-[100px]",
    },
    {
      id: "importPrice",
      header: "Import (HUF)",
      icon: <DollarSign className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => (
        <span className="tabular-nums text-xs text-neutral-600 dark:text-neutral-300">
          {p.importPrice.toLocaleString()}
        </span>
      ),
      thClassName: "w-[110px]",
    },
    {
      id: "sellingPrice",
      header: "Sell (HUF)",
      icon: <DollarSign className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => (
        <span className="tabular-nums text-xs font-medium text-neutral-800 dark:text-neutral-200">
          {p.sellingPrice.toLocaleString()}
        </span>
      ),
      thClassName: "w-[110px]",
    },
    {
      id: "stock",
      header: "Stock",
      icon: <Warehouse className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => {
        const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
        return (
          <span className="inline-flex items-center gap-1">
            <span className={
              p.currentStock === 0
                ? "tabular-nums text-xs font-semibold text-red-600 dark:text-red-400"
                : isLow
                  ? "tabular-nums text-xs font-semibold text-amber-600 dark:text-amber-400"
                  : "tabular-nums text-xs text-neutral-700 dark:text-neutral-200"
            }>
              {p.currentStock.toLocaleString()}
            </span>
          </span>
        );
      },
      thClassName: "w-[100px]",
    },
    {
      id: "status",
      header: "Stock Status",
      accessor: (p) => <StatusPill status={p.status} />,
      thClassName: "w-[140px] text-center",
      tdClassName: "text-center",
    },
    {
      id: "active",
      header: "Active",
      icon: <PowerOff className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (p) => <ActivePill active={p.active} />,
      thClassName: "w-[110px] text-center",
      tdClassName: "text-center",
    },
  ], []);

  return (
    <div className="flex min-h-0 grow flex-col space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Product Inventory</h1>

        <RuleInput
          options={[
            { label: "SKU", icon: <Barcode className="h-3 w-3" /> },
            { label: "Name", icon: <Package className="h-3 w-3" /> },
          ]}
          placeholder="Type to search…"
          onChange={({ rule, value }) => {
            searchRuleRef.current = rule;
            setSearchRule(rule);
            setSearch(value);
            setPage(1);
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs shadow-sm transition-colors ${showFilters ? "border-neutral-400 bg-neutral-100 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900"
              }`}
          >
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filter</span>
          </button>
          <button type="button" className="inline-flex px-2 py-1.5 items-center justify-center rounded-md border bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1.5 text-xs shadow-sm hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800">
            <Download className="h-3.5 w-3.5 text-neutral-500" />
            <span>Export</span>
          </button>
          <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
            + Add Product
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiTile label="Total Products" value={ALL_PRODUCTS.length} sub={`${filtered.length} matching filter`} />
        <KpiTile label="In Stock" value={inStockCount} accent="emerald" sub="products available" />
        <KpiTile label="Low / Out of Stock" value={`${lowStockCount} / ${outOfStockCount}`} accent={outOfStockCount > 0 ? "red" : "amber"} sub="need attention" />
        <KpiTile label="Inventory Value" value={`${(totalInventoryValue / 1_000_000).toFixed(2)}M HUF`} accent="blue" sub="at import price" />
      </div>

      {/* ── Filter Bar ── */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-white p-3 shadow-sm dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Stock Status</span>
            <div className="flex gap-1">
              {(["All", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatusFilter(s as StockStatus | "All"); setPage(1); }}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${statusFilter === s
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <span className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Active</span>
            <div className="flex gap-1">
              {(["All", "Active", "Inactive"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setActiveFilter(a); setPage(1); }}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${activeFilter === a
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="min-h-0 grow rounded-lg border bg-white shadow-sm dark:bg-neutral-900">
        <DataTable<Product>
          columns={columns}
          data={pageRows}
          getRowId={(p) => p.id}
          showIndex
          maxHeight="fill"
        />
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex items-center px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />
          <span className="inline-flex items-center px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <span className="w-px self-stretch bg-neutral-200 dark:bg-neutral-800" />
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex items-center px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="inline-flex items-stretch overflow-hidden rounded-md border bg-white text-xs shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
          {rowOptions.map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() => { setRowsPerPage(n); setPage(1); }}
              className={`inline-flex items-center px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 ${rowsPerPage === n
                ? "bg-neutral-200 font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                : "text-neutral-600 dark:text-neutral-300"
                } ${i !== rowOptions.length - 1 ? "border-r border-neutral-200 dark:border-neutral-800" : ""}`}
            >
              {n}
            </button>
          ))}
        </div>

        <span className="text-xs text-neutral-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}