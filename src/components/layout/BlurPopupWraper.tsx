"use client";

import clsx from "clsx";
import { ReactNode, useEffect } from "react";

type PopupProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Popup({ open, onClose, children }: PopupProps) {
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
        className="absolute inset-0 bg-bg/50 backdrop-blur-sm"
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