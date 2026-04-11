"use client";

import Button from "@/components/ui/Buttons";
import type { StockAdjustmentInvoiceStatus } from "@/features/invoices/services/stockAdjustmentInvoice.service";
import { useDict } from "@/lib/lang/DictProvider";
import { ArrowLeft, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import StockAdjustmentStatusPill from "../components/StockAdjustmentStatusPill";

type StockAdjustmentInvoiceHeaderProps = {
  title: string;
  status: StockAdjustmentInvoiceStatus;
  canEditDraft: boolean;
  saving: boolean;
  confirming: boolean;
  deleting: boolean;
  saveDisabled?: boolean;
  confirmDisabled?: boolean;
  onSave: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onBack?: () => void;
  middle?: ReactNode;
};

export default function StockAdjustmentInvoiceHeader({
  title,
  status,
  canEditDraft,
  saving,
  confirming,
  deleting,
  saveDisabled = false,
  confirmDisabled = false,
  onSave,
  onConfirm,
  onDelete,
  onBack,
  middle,
}: StockAdjustmentInvoiceHeaderProps) {
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
          href="/manager/invoices/stock-adjustment"
          className="flex items-center text-xl font-semibold text-text hover:text-muted"
          aria-label={dict.back}
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-xl font-semibold">{title}</h1>
        <StockAdjustmentStatusPill status={status} />
      </div>

      <div className="flex flex-1 items-center justify-center px-3">
        {middle}
      </div>

      <div className="flex items-center gap-2">
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
            disabled={saving || confirming || deleting || confirmDisabled}
          >
            {confirming ? dict.loading : dict.confirm}
          </Button>
        )}
      </div>
    </div>
  );
}
