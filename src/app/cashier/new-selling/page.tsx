"use client";

import AddSellingInvoicePopup from "@/features/invoices/layout/AddSellingInvoicePopup";
import { useDict } from "@/lib/lang/DictProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CashierNewSellingPage() {
  const dict = useDict();
  const router = useRouter();

  return (
    <AddSellingInvoicePopup
      open
      presentation="page"
      onClose={function keepCreatePageOpen(): void {}}
      onCreated={function handleSellingInvoiceCreated(invoiceId): void {
        const toastId = `cashier-selling-created-${invoiceId}`;

        toast.success(
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            onClick={() => toast.dismiss(toastId)}
          >
            {dict.sellingInvoiceCreateSuccess}
          </button>,
          {
            id: toastId,
            className: "cursor-pointer",
            closeButton: true,
          },
        );
        router.push(`/cashier/selling/${invoiceId}`);
      }}
    />
  );
}
