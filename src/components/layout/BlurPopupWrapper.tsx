"use client";

import { registerModalEscapeHandler } from "@/components/types/modalEscapeStack";
import clsx from "clsx";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Above in-app overlays (e.g. `z-50` dropdowns) and out of sidebar `overflow` clipping. */
const POPUP_LAYER_Z = "z-[100]";

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
  const onCloseRef = useRef(onClose);

  useEffect(
    function keepModalEscapeCloseFresh(): void {
      onCloseRef.current = onClose;
    },
    [onClose],
  );

  useEffect(
    function subscribeModalEscapeStack(): void | (() => void) {
      if (!open) {
        return;
      }

      return registerModalEscapeHandler(function invokeModalEscapeClose(): void {
        onCloseRef.current();
      });
    },
    [open],
  );

  if (!open) return null;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={clsx("fixed inset-0 flex items-center justify-center", POPUP_LAYER_Z)}>

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
    </div>,
    document.body,
  );
}