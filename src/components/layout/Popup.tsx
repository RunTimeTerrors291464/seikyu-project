"use client";

import Button from "@/components/ui/Buttons";
import clsx from "clsx";
import { ReactNode } from "react";
import Popup from "./BlurPopupWraper";

type Props = {
  open: boolean;
  title: string;
  description: string;

  confirmText: string;
  cancelText: string;

  loading?: boolean;

  onConfirm: () => void | Promise<void>;
  onClose: () => void;

  icon?: ReactNode;
  accent?: "neutral" | "danger";
};

export function ConfirmPopup({
  open,
  title,
  description,
  confirmText,
  cancelText,
  loading,
  onConfirm,
  onClose,
  icon,
  accent = "neutral",
}: Props) {
  return (
    <Popup open={open} onClose={onClose}>
      <div className="overflow-hidden rounded-lg">

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {icon && (
            <span
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full",
                accent === "danger"
                  ? "bg-danger-soft"
                  : "bg-muted"
              )}
            >
              {icon}
            </span>
          )}

          <h2 className="text-sm font-semibold text-text">
            {title}
          </h2>
        </div>

        {/* BODY */}
        <div className="px-4 py-4 text-sm text-muted">
          {description}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button onClick={onClose} accent="neutral">
            {cancelText}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={loading}
            accent={accent === "danger" ? "danger" : "primary"}
          >
            {loading ? "..." : confirmText}
          </Button>
        </div>
      </div>
    </Popup>
  );
}