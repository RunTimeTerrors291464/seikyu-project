"use client";

import AddSellingInvoicePopup from "@/features/invoices/layout/AddSellingInvoicePopup";
import { useDict } from "@/lib/lang/DictProvider";
import { toast } from "sonner";

export default function CashierNewSellingPage() {
  const dict = useDict();

  return (
    <AddSellingInvoicePopup
      open
      presentation="page"
      onClose={function keepCreatePageOpen(): void {}}
      onCreated={function handleSellingInvoiceCreated(): void {
        toast.success(dict.sellingInvoiceCreateSuccess);
      }}
    />
  );
}
