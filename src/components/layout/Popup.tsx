"use client";

import Button from "@/components/ui/Buttons";
import { isEditableKeyboardTarget } from "@/lib/shortcuts/isEditableKeyboardTarget";
import clsx from "clsx";
import { ReactNode, useEffect, useRef } from "react";
import Popup from "./BlurPopupWrapper";

/**
 * When a confirm dialog is open: Enter confirms (unless loading), Escape closes via `Popup` / modal stack.
 *
 * @param open - Whether the confirm dialog is visible.
 * @param loading - When true, Enter does not submit.
 * @param onConfirm - Primary action handler.
 */
function useConfirmPopupKeyboard(
  open: boolean,
  loading: boolean | undefined,
  onConfirm: () => void | Promise<void>,
): void {
  const onConfirmRef = useRef(onConfirm);

  useEffect(
    function keepConfirmHandlerFresh(): void {
      onConfirmRef.current = onConfirm;
    },
    [onConfirm],
  );

  useEffect(
    function subscribeConfirmEnterKey(): void | (() => void) {
      if (!open) {
        return;
      }

      function handleKeyDown(event: KeyboardEvent): void {
        if (event.key !== "Enter") {
          return;
        }
        if (loading) {
          return;
        }
        if (isEditableKeyboardTarget(event.target)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        void onConfirmRef.current();
      }

      window.addEventListener("keydown", handleKeyDown, true);

      return function removeConfirmEnterListener(): void {
        window.removeEventListener("keydown", handleKeyDown, true);
      };
    },
    [open, loading],
  );
}

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
  async function handleConfirm(): Promise<void> {
    try {
      await onConfirm();
    } catch {
      onClose();
    }
  }

  useConfirmPopupKeyboard(open, loading, handleConfirm);

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
            onClick={handleConfirm}
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