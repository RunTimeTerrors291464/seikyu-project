"use client";

import Button from "@/components/ui/Buttons";
import type { ImportInvoiceStatus } from "@/features/invoices/services/importInvoice.service";
import { useDict } from "@/lib/lang/DictProvider";
import { ArrowLeft, RotateCcw, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import ImportInvoiceStatusPill from "../components/ImportInvoiceStatusPill";

type ImportInvoiceHeaderProps = {
  title: string;
  status: ImportInvoiceStatus;
  canEditDraft: boolean;
  canReturn?: boolean;
  saving: boolean;
  confirming: boolean;
  deleting: boolean;
  saveDisabled?: boolean;
  confirmDisabled?: boolean;
  onSave: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onReturn?: () => void;
  onBack?: () => void;
  middle?: ReactNode;
};

export default function ImportInvoiceHeader({
  title,
  status,
  canEditDraft,
  canReturn = false,
  saving,
  confirming,
  deleting,
  saveDisabled = false,
  confirmDisabled = false,
  onSave,
  onConfirm,
  onDelete,
  onReturn,
  onBack,
  middle,
}: ImportInvoiceHeaderProps) {
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
          href="/manager/invoices/import"
          className="flex items-center text-xl font-semibold text-text hover:text-muted"
          aria-label={dict.back}
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-xl font-semibold">{title}</h1>
        <ImportInvoiceStatusPill status={status} />
      </div>

      <div className="flex flex-1 items-center justify-center px-3">
        {middle}
      </div>

      <div className="flex items-center gap-2">
        {canReturn && onReturn && (
          <Button
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            accent="danger"
            onClick={onReturn}
            disabled={saving || confirming || deleting || canEditDraft}
          >
            {dict.returnAction}
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
            disabled={saving || confirming || deleting || confirmDisabled}
          >
            {confirming ? dict.loading : dict.confirm}
          </Button>
        )}
      </div>
    </div>
  );
}
