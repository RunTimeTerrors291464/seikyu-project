"use client";

import clsx from "clsx";
import { ReactNode, useEffect } from "react";

type PopupProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** When false, backdrop is dimmed only (no `backdrop-blur`). Defaults to true. */
  backdropBlur?: boolean;
};

export default function Popup({
  open,
  onClose,
  children,
  backdropBlur,
}: PopupProps) {
  const useBackdropBlur = backdropBlur !== false;
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className={clsx(
          "absolute inset-0 bg-bg/50",
          useBackdropBlur && "backdrop-blur-sm",
        )}
        onClick={onClose}
      />

      {/* CONTENT */}
      <div
        className={clsx(
          "relative z-10",
          "rounded-lg border border-border bg-card shadow-xl",
          "w-auto h-auto",           // size to content
          "max-w-[90vw] max-h-[90vh]", // prevent overflow
          "overflow-hidden"          // prevent bleed
        )}
      >
        {children}
      </div>
    </div>
  );
}