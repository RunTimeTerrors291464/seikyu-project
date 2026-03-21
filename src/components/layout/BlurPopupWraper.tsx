"use client";

import clsx from "clsx";
import { ReactNode, useEffect } from "react";

type PopupProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};
// WARPER
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center m-0"
    >
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-bg/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* CONTENT */}
      <div
        className={clsx(
          "relative z-10 w-full max-w-md rounded-lg",
          "bg-card border border-border shadow-xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}
