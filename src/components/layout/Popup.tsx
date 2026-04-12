"use client";

import Button from "@/components/ui/Buttons";
import clsx from "clsx";
import { ReactNode } from "react";
import Popup from "./BlurPopupWrapper";

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
  /** Passed to the underlying modal wrapper; set false for a non-blurred dimmed backdrop. */
  backdropBlur?: boolean;
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
  backdropBlur,
}: Props) {
  return (
    <Popup open={open} onClose={onClose} backdropBlur={backdropBlur}>
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

type DeletePopupProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  icon?: ReactNode;
  backdropBlur?: boolean;
};

export function DeletePopup({
  open,
  title,
  description,
  confirmText,
  cancelText,
  loading,
  onConfirm,
  onClose,
  icon,
  backdropBlur,
}: DeletePopupProps) {
  return (
    <ConfirmPopup
      open={open}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
      icon={icon}
      accent="danger"
      backdropBlur={backdropBlur}
    />
  );
}