"use client";

import { useDict } from "@/lib/lang/DictProvider";
import { useParams } from "next/navigation";

import { useProductDetail } from "@/features/products/hooks/useProductDetail";

import ProductDetailsCard from "@/features/products/components/ProductDetailsCard";
import ProductHeader from "@/features/products/components/ProductHeader";
//import ProductNamesCard from "@/features/products/components/ProductNamesCard";
import ProductHistoryCard from "@/features/products/components/ProductHistoryCard";
//import ProductChartCard from "@/features/products/components/ProductChartCard";

export default function ProductDetailPage() {

  /* ============================= */
  /* PARAMS */
  /* ============================= */

  const params = useParams();
  const id = params?.id as string;

  const dict = useDict();

  /* ============================= */
  /* DATA */
  /* ============================= */

  const {
    product,
    loading,

    update,
    toggleActive,

    names,
    addName,
    removeName,
    makeDefault
  } = useProductDetail(id);

  /* ============================= */
  /* LOADING */
  /* ============================= */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        {dict.loading || "Loading product..."}
      </div>
    );
  }

  /* ============================= */
  /* NOT FOUND */
  /* ============================= */

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-danger">
        {dict.notFound || "Product not found"}
      </div>
    );
  }

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <div className="flex min-h-0 flex-col gap-6">

      {/* ───────────────── HEADER ───────────────── */}
      <ProductHeader
        product={product}
        onToggleActive={toggleActive}
        dict={dict}
      />

      {/* ───────────────── GRID ───────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">

        {/* LEFT COLUMN */}
        <ProductDetailsCard
          product={product}
          update={update}
          dict={dict}
        />

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col gap-4">

          {/* <ProductNamesCard
            names={names}
            onAdd={addName}
            onRemove={removeName}
            onDefault={makeDefault}
            dict={dict}
          />

          <ProductChartCard dict={dict} /> */}

        </div>

        {/* RIGHT COLUMN */}
        <ProductHistoryCard dict={dict} />

      </div>

    </div>
  );
}