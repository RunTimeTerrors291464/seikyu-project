"use client";

import { Dictionary } from "@/lib/lang/i18n";
import { Power } from "lucide-react";

type Props = {
  product: any;
  onToggleActive: () => void;
  dict: Dictionary;
};

export default function ProductHeader({
  product,
  onToggleActive,
  dict
}: Props) {
  return (
    <div className="flex items-center justify-between">

      <div>
        <h1 className="text-xl font-semibold text-text">
          {product.productName}
        </h1>
      </div>

      <button
        onClick={onToggleActive}
        className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium cursor-pointer
        ${product.active
            ? "border-success text-success hover:bg-success/10"
            : "border-danger text-danger hover:bg-danger/10"
          }`}
      >
        <Power className="h-3.5 w-3.5" />
        {product.active ? dict.active : dict.inactive}
      </button>

    </div>
  );
}