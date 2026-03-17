"use client";

import { Dictionary } from "@/lib/lang/i18n";
import { Barcode, Warehouse } from "lucide-react";

type Props = {
  product: any;
  update: (k: any, v: any) => void;
  dict: Dictionary;
};

export default function ProductDetailsCard({
  product,
  update,
  dict
}: Props) {

  return (
    <div className="card p-5 space-y-4">

      <h2 className="text-sm font-semibold text-text">
        {dict.productDetails}
      </h2>

      {/* SKU */}
      <div>
        <label className="text-xs text-muted flex items-center gap-1">
          <Barcode className="h-3 w-3" />
          {dict.sku}
        </label>

        <input
          value={product.sku}
          onChange={(e) => update("sku", e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text"
        />
      </div>

      {/* STOCK */}
      <div>
        <label className="text-xs text-muted flex items-center gap-1">
          <Warehouse className="h-3 w-3" />
          {dict.currentStock}
        </label>

        <div className="mt-1 flex items-center justify-between rounded-md border border-border bg-bg px-3 py-2 text-sm">
          <span className="text-text">{product.currentStock}</span>
        </div>
      </div>

    </div>
  );
}