"use client";

import { formatDate } from "@/components/types/ui";
import { Field, Textarea } from "@/components/ui/Fields";
import KpiTile from "@/components/ui/KpiTile";
import SellingInvoiceDetailProductsCard from "@/features/invoices/layout/SellingInvoiceDetailProductsCard";
import SellingInvoiceHeader from "@/features/invoices/layout/SellingInvoiceHeader";
import {
  getSellingInvoiceById,
  type SellingInvoiceResponseDto,
} from "@/features/invoices/services/sellingInvoice.service";
import { useDict } from "@/lib/lang/DictProvider";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { Boxes, DollarSign, Package, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CashierSellingInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const dict = useDict();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState<SellingInvoiceResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice(): Promise<void> {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getSellingInvoiceById(invoiceId);

        if (!isMounted) {
          return;
        }

        setInvoice(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : dict.somethingWentWrong,
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [invoiceId, dict.somethingWentWrong]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        {dict.loading}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-danger">
        {errorMessage || dict.notFound}
      </div>
    );
  }

  const totalBeforeDiscount = invoice.products.reduce(
    function sumBeforeDiscount(total, product): number {
      return total + product.quantity * product.sellingPrice;
    },
    0,
  );
  const totalDiscount = Math.max(0, totalBeforeDiscount - invoice.totalSellingPrice);

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <SellingInvoiceHeader
        title={invoice.invoiceId ?? dict.sellingDraft}
        status={invoice.status}
        listHref="/cashier/selling"
      />

      {errorMessage && (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <KpiTile
          label={dict.totalSellingPriceLabel}
          value={formatPriceNumber(invoice.totalSellingPrice)}
          icon={<DollarSign className="h-4 w-4 text-muted" />}
          accent="success"
          helpText={dict.totalSellingPriceKpiHelp}
          sub={dict.totalSellingPriceKpiSub}
        />
        <KpiTile
          label={dict.totalDiscountLabel}
          value={formatPriceNumber(totalDiscount)}
          icon={<DollarSign className="h-4 w-4 text-muted" />}
          accent={totalDiscount > 0 ? "warning" : "neutral"}
          helpText={dict.totalDiscountKpiHelp}
          sub={dict.totalDiscountKpiSub}
        />
        <KpiTile
          label={dict.totalProducts}
          value={invoice.totalProducts.toLocaleString()}
          icon={<Package className="h-4 w-4 text-muted" />}
          helpText={dict.totalProductsKpiHelp}
          sub={dict.totalProductsKpiSub}
        />
        <KpiTile
          label={dict.totalQuantity}
          value={invoice.totalQuantity.toLocaleString()}
          icon={<Boxes className="h-4 w-4 text-muted" />}
          helpText={dict.totalQuantityKpiHelp}
          sub={dict.totalQuantityKpiSub}
        />
        <KpiTile
          label={dict.confirmedBy}
          value={invoice.confirmedByUsername ?? "—"}
          sub={invoice.confirmedAt ? formatDate(invoice.confirmedAt) : "—"}
          icon={<User className="h-4 w-4 text-muted" />}
          helpText={dict.confirmedByKpiHelp}
        />
      </div>

      <SellingInvoiceDetailProductsCard products={invoice.products} />

      <div className="flex items-start gap-5">
        <div className="w-full max-w-xs shrink-0">
          <Field label={dict.invoiceDiscountLabel} hint={dict.discountPercentHint}>
            <div className="flex items-center gap-1.5">
              <input
                className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-text cursor-not-allowed"
                value={String(invoice.invoiceDiscount ?? 0)}
                aria-label={dict.invoiceDiscountLabel}
                disabled={true}
                inputMode="decimal"
              />
              <span className="shrink-0 text-sm text-muted" aria-hidden>
                %
              </span>
            </div>
          </Field>
        </div>

        <div className="flex h-[20vh] min-w-0 flex-1">
          <Field fillHeight label={dict.noteLabel}>
            <Textarea
              value={invoice.notes ?? ""}
              onChange={() => {}}
              disabled={true}
              placeholder={dict.invoiceDescriptionPlaceholder}
              rows={1}
              className="min-h-0 flex-1 overflow-y-auto"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
