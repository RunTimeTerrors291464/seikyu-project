"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  openDelay?: number; // ms
  offset?: number; // px
};

export default function Tooltip({
  content,
  children,
  side = "top",
  align = "end",
  openDelay = 150,
  offset = 8,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function updatePosition() {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;
    const tRect = trigger.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let top = 0;
    let left = 0;

    if (side === "top") {
      top = tRect.top - tipRect.height - offset;
    } else {
      top = tRect.bottom + offset;
    }

    if (align === "start") left = tRect.left;
    else if (align === "center") left = tRect.left + tRect.width / 2 - tipRect.width / 2;
    else left = tRect.right - tipRect.width;

    const margin = 8;
    const maxLeft = window.innerWidth - tipRect.width - margin;
    const minLeft = margin;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    const maxTop = window.innerHeight - tipRect.height - margin;
    const minTop = margin;
    top = Math.min(Math.max(top, minTop), maxTop);

    setCoords({ top, left });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, side, align, offset, content]);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setOpen(true), openDelay) as unknown as number;
      }}
      onMouseLeave={() => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && typeof window !== "undefined"
        ? createPortal(
            <div
              ref={tooltipRef}
              role="tooltip"
              className="pointer-events-none fixed z-[9999] transition-opacity"
              style={{ top: coords ? coords.top : -9999, left: coords ? coords.left : -9999, opacity: coords ? 1 : 0 }}
            >
              <div className="max-w-xs break-words rounded-md border border-neutral-200 bg-neutral-900 px-2 py-1 text-[11px] leading-4 text-white shadow-md dark:border-neutral-700">
                {content}
              </div>
            </div>,
            document.body
          )
        : null}
    </span>
  );
}
