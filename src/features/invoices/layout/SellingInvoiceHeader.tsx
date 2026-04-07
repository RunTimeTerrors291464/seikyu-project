"use client";

import Button from "@/components/ui/Buttons";
import type { SellingInvoiceStatus } from "@/features/invoices/services/sellingInvoice.service";
import { useDict } from "@/lib/lang/DictProvider";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import SellingInvoiceStatusPill from "../components/SellingInvoiceStatusPill";

type SellingInvoiceHeaderProps = {
  title: string;
  status: SellingInvoiceStatus;
  listHref: string;
  canReturn?: boolean;
  onReturn?: () => void;
  returnDisabled?: boolean;
  onBack?: () => void;
  middle?: ReactNode;
};

export default function SellingInvoiceHeader({
  title,
  status,
  listHref,
  canReturn = false,
  onReturn,
  returnDisabled = false,
  onBack,
  middle,
}: SellingInvoiceHeaderProps) {
  const dict = useDict();

  function handleBackClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (!onBack) {
      return;
    }

    event.preventDefault();
    onBack();
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link
          href={listHref}
          className="flex items-center text-xl font-semibold text-text hover:text-muted"
          aria-label={dict.back}
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-xl font-semibold">{title}</h1>
        <SellingInvoiceStatusPill status={status} />
      </div>

      <div className="flex flex-1 items-center justify-center px-3">{middle}</div>

      <div className="flex items-center gap-2">
        {canReturn && onReturn && (
          <Button
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            accent="danger"
            onClick={onReturn}
            disabled={returnDisabled}
          >
            {dict.returnAction}
          </Button>
        )}
      </div>
    </div>
  );
}
