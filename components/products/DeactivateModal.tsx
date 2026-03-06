"use client";
import { CircleOff } from "lucide-react";
import { createPortal } from "react-dom";

type DeactivateModalProps = {
  isOpen: boolean;
  productName: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeactivateModal({ isOpen, productName, onClose, onConfirm }: DeactivateModalProps) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">

        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 dark:border-neutral-800">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <CircleOff className="h-3.5 w-3.5 text-red-500" />
          </span>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Deactivate product?</h2>
        </div>

        {/* Body */}
        <div className="px-4 py-4 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{productName}</span> will be
          marked as inactive and hidden from active listings. You can reactivate it at any time.
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border px-3 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-md bg-red-500 px-3 text-sm font-medium text-white hover:bg-red-600"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}