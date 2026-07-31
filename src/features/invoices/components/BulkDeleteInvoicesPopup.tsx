"use client";

import { DeletePopup } from "@/components/layout/Popup";
import { useDict } from "@/lib/lang/DictProvider";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const DELETE_CONFIRM_DELAY_SECONDS = 5;

type BulkDeleteInvoicesPopupProps = {
  open: boolean;
  selectedCount: number;
  loading: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function BulkDeleteInvoicesPopup(
  props: BulkDeleteInvoicesPopupProps,
) {
  if (!props.open) {
    return null;
  }

  return <OpenBulkDeleteInvoicesPopup {...props} />;
}

function OpenBulkDeleteInvoicesPopup({
  selectedCount,
  loading,
  onConfirm,
  onClose,
}: Omit<BulkDeleteInvoicesPopupProps, "open">) {
  const dict = useDict();
  const [secondsRemaining, setSecondsRemaining] = useState(
    DELETE_CONFIRM_DELAY_SECONDS,
  );

  useEffect(function startDeleteConfirmCountdown(): () => void {
    const timer = window.setInterval(function countDown(): void {
      setSecondsRemaining(function decrement(previous): number {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return function clearDeleteConfirmCountdown(): void {
      window.clearInterval(timer);
    };
  }, []);

  const confirmText =
    secondsRemaining > 0
      ? dict.deleteInvoiceCountdown.replace(
          "{seconds}",
          String(secondsRemaining),
        )
      : dict.delete;

  return (
    <DeletePopup
      open
      title={dict.confirmDeleteInvoicesTitle}
      description={dict.confirmDeleteInvoicesDescription.replace(
        "{count}",
        String(selectedCount),
      )}
      warning={dict.invoiceDeleteIrreversibleWarning}
      confirmText={confirmText}
      cancelText={dict.cancel}
      loading={loading}
      confirmDisabled={secondsRemaining > 0}
      onConfirm={onConfirm}
      onClose={onClose}
      icon={<Trash2 className="h-4 w-4 text-danger" />}
    />
  );
}
