"use client";

import { Accent } from "@/components/types/ui";
import type { SellingInvoiceProductDto } from "../services/sellingInvoice.service";
import { sellingLineDtoToEditableDisplay } from "../types/sellingInvoiceCreate";
import SellingInvoiceProductsCard from "./SellingInvoiceProductsCard";

type SellingInvoiceDetailProductsCardProps = {
  products: SellingInvoiceProductDto[];
  accent?: Accent;
};

export default function SellingInvoiceDetailProductsCard({
  products,
  accent = "neutral",
}: SellingInvoiceDetailProductsCardProps) {
  const readonlyRows = products.map(sellingLineDtoToEditableDisplay);

  return (
    <SellingInvoiceProductsCard
      products={readonlyRows}
      canEditDraft={false}
      showSelection={false}
      showAddProductsButton={false}
      showDeleteSelectedButton={false}
      accent={accent}
    />
  );
}
