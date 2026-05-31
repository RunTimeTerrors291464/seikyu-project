"use client";

import Button from "@/components/ui/Buttons";
import { useDict } from "@/lib/lang/DictProvider";
import { ArrowLeft, Printer, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import ReturnImportInvoiceStatusPill from "../components/ReturnImportInvoiceStatusPill";
import type { ReturnSellingInvoiceStatus } from "../services/returnSellingInvoice.service";

type ReturnSellingInvoiceHeaderProps = {
  title: string;
  status: ReturnSellingInvoiceStatus;
  sourceSellingInvoiceId: string;
  canEditDraft: boolean;
  saving: boolean;
  confirming: boolean;
  deleting: boolean;
  saveDisabled?: boolean;
  onSave: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  canPrint?: boolean;
  onPrint?: () => void;
  onBack?: () => void;
  middle?: ReactNode;
};

export default function ReturnSellingInvoiceHeader({
  title,
  status,
  sourceSellingInvoiceId,
  canEditDraft,
  saving,
  confirming,
  deleting,
  saveDisabled = false,
  onSave,
  onConfirm,
  onDelete,
  canPrint = false,
  onPrint,
  onBack,
  middle,
}: ReturnSellingInvoiceHeaderProps) {
  const dict = useDict();

  function handleBackClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (!onBack) {
      return;
    }

    event.preventDefault();
    onBack();
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
        <Link
          href={`/manager/invoices/selling/${sourceSellingInvoiceId}`}
          className="flex items-center text-xl font-semibold text-text hover:text-muted"
          aria-label={dict.back}
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-xl font-semibold">{title}</h1>
        <ReturnImportInvoiceStatusPill status={status} />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-2">
        {middle}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {canPrint && onPrint && (
          <Button
            icon={<Printer className="h-3.5 w-3.5" />}
            accent="neutral"
            onClick={onPrint}
          >
            {dict.print}
          </Button>
        )}
        {canEditDraft && (
          <Button
            icon={<Trash2 className="h-3.5 w-3.5" />}
            accent="danger"
            onClick={onDelete}
            disabled={saving || confirming || deleting}
          >
            {dict.delete}
          </Button>
        )}

        {canEditDraft && (
          <Button
            icon={<Save className="h-3.5 w-3.5" />}
            accent="neutral"
            onClick={onSave}
            disabled={saving || confirming || deleting || saveDisabled}
          >
            {saving ? dict.saving : dict.save}
          </Button>
        )}

        {canEditDraft && (
          <Button
            icon={<Send className="h-3.5 w-3.5" />}
            accent="primary"
            onClick={onConfirm}
            disabled={saving || confirming || deleting}
          >
            {confirming ? dict.loading : dict.confirm}
          </Button>
        )}
      </div>
    </div>
  );
}
