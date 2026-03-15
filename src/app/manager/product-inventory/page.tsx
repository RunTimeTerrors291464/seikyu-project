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
  Hash,
  Package,
  PowerOff,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Warehouse
} from "lucide-react";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getProducts } from "@/services/product.service";
import { Product as ApiProduct } from "@/types/product";

import { getLang } from "@/lib/getLang";
import { getDictionary } from "@/lib/i18n";

const dict = getDictionary(getLang() as "en" | "vi");

/* ───────────────── UI PRODUCT TYPE ───────────────── */

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

/* ───────────────── PRODUCT MAPPER ───────────────── */

function mapProduct(p: ApiProduct): Product {
  const name =
    p.names?.find((n) => n.language === "en")?.name ||
    p.names?.[0]?.name ||
    dict.unnamed;

  const status =
    p.current_stock === 0
      ? "Out of Stock"
      : p.current_stock <= p.min_stock
        ? "Low Stock"
        : "In Stock";

  return {
    id: p.id,
    sku: p.sku,
    name,
    unit: dict.unitPcs,
    importPrice: p.import_price,
    sellingPrice: p.selling_price,
    currentStock: p.current_stock,
    minStock: p.min_stock,
    status,
    active: p.is_active
  };
}

/* ───────────────── STATUS PILL ───────────────── */

function StatusPill({ status }: { status: StockStatus }) {

  const tone =
    status === "In Stock"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Low Stock"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  const Icon =
    status === "In Stock"
      ? TrendingUp
      : status === "Low Stock"
        ? AlertTriangle
        : TrendingDown;

  const label =
    status === "In Stock"
      ? dict.inStock
      : status === "Low Stock"
        ? dict.lowStock
        : dict.outOfStock;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label}
    </span>
  );
}

/* ───────────────── ACTIVE PILL ───────────────── */

function ActivePill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
      <CircleCheck className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {dict.active}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-border px-2 py-0.5 text-xs font-medium text-muted">
      <CircleOff className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {dict.inactive}
    </span>
  );
}

/* ───────────────── KPI TILE ───────────────── */

function KpiTile({
  label,
  value,
  accent
}: {
  label: string;
  value: string | number;
  accent?: "emerald" | "amber" | "red";
}) {

  const color =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
        ? "text-amber-600"
        : accent === "red"
          ? "text-red-600"
          : "text-text";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted">{label}</p>

      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

/* ───────────────── PAGE ───────────────── */

export default function ProductInventoryPage() {

  const [search, setSearch] = useState("");
  const [searchRule, setSearchRule] = useState("SKU");
  const searchRuleRef = useRef("SKU");

  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadProducts() {

    try {

      setLoading(true);

      const res = await getProducts({
        page,
        limit: rowsPerPage,
        search
      });

      setProducts(res.data);
      setTotalProducts(res.total);

    } catch (err) {

      console.error("Failed to load products", err);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  const mappedProducts = useMemo(() => products.map(mapProduct), [products]);

  const inStock = mappedProducts.filter((p) => p.status === "In Stock").length;
  const lowStock = mappedProducts.filter((p) => p.status === "Low Stock").length;
  const outStock = mappedProducts.filter((p) => p.status === "Out of Stock").length;

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        id: "sku",
        header: dict.sku,
        icon: <Barcode className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => (
          <Link
            href={`/manager/product-inventory/${p.id}`}
            className="font-semibold text-blue-600 hover:underline"
          >
            {p.sku}
          </Link>
        )
      },
      {
        id: "name",
        header: dict.productName,
        icon: <Package className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => p.name
      },
      {
        id: "unit",
        header: dict.unit,
        icon: <Hash className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => p.unit
      },
      {
        id: "importPrice",
        header: dict.importPrice,
        icon: <DollarSign className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => p.importPrice.toLocaleString()
      },
      {
        id: "sellingPrice",
        header: dict.sellingPrice,
        icon: <DollarSign className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => p.sellingPrice.toLocaleString()
      },
      {
        id: "stock",
        header: dict.stock,
        icon: <Warehouse className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => p.currentStock
      },
      {
        id: "status",
        header: dict.stockStatus,
        accessor: (p) => <StatusPill status={p.status} />
      },
      {
        id: "active",
        header: dict.active,
        icon: <PowerOff className="h-3.5 w-3.5 text-muted" />,
        accessor: (p) => <ActivePill active={p.active} />
      }
    ],
    []
  );

  const totalPages = Math.ceil(totalProducts / rowsPerPage);

  return (
    <div className="flex min-h-0 grow flex-col space-y-6">

      <div className="flex items-center justify-between">

        <h1 className="text-xl font-semibold text-text">
          {dict.productInventory}
        </h1>

        <RuleInput
          options={[
            { label: dict.sku, icon: <Barcode className="h-3 w-3" /> },
            { label: dict.name, icon: <Package className="h-3 w-3" /> }
          ]}
          placeholder={dict.searchPlaceholder}
          onChange={({ rule, value }) => {
            searchRuleRef.current = rule;
            setSearchRule(rule);
            setSearch(value);
            setPage(1);
          }}
        />

        <div className="flex items-center gap-2">

          <button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-2 py-1.5 text-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button className="rounded-md bg-text px-3 py-1.5 text-xs font-medium text-bg">
            {dict.addProduct}
          </button>

        </div>

      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        <KpiTile label={dict.totalProducts} value={totalProducts} />
        <KpiTile label={dict.inStock} value={inStock} accent="emerald" />
        <KpiTile label={dict.lowStock} value={lowStock} accent="amber" />
        <KpiTile label={dict.outOfStock} value={outStock} accent="red" />

      </div>

      <div className="min-h-0 grow rounded-lg border border-border bg-card shadow-sm">

        {loading ? (
          <div className="flex h-full items-center justify-center text-muted">
            {dict.loadingProducts}
          </div>
        ) : (
          <DataTable<Product>
            columns={columns}
            data={mappedProducts}
            getRowId={(p) => p.id}
            showIndex
            maxHeight="fill"
          />
        )}

      </div>

      <div className="flex items-center gap-3">

        <div className="inline-flex overflow-hidden rounded-md border border-border bg-card text-xs shadow-sm">

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1.5 text-muted"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <span className="px-2 py-1.5 text-muted">
            {dict.page} {page} {dict.of} {Math.max(1, totalPages)}
          </span>

          <button
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            className="px-2 py-1.5 text-muted"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

        </div>

        <span className="text-xs text-muted">
          {totalProducts} {dict.results}
        </span>

      </div>
    </div>
  );
}