"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Blocks in-app navigation, back/forward, and tab close when a draft has unsaved edits.
 *
 * @param canEditDraft - When false, navigation is never intercepted.
 * @param isDirty - When false, navigation proceeds without confirmation.
 * @returns `requestNavigate` for links/back, dialog state, and confirm/close handlers for the discard popup.
 */
export function useDraftNavigationGuard(
  canEditDraft: boolean,
  isDirty: boolean,
): {
  requestNavigate: (href: string) => void;
  discardNavigateOpen: boolean;
  pendingHref: string | null;
  confirmDiscardNavigate: () => void;
  closeDiscardNavigate: () => void;
} {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [discardNavigateOpen, setDiscardNavigateOpen] = useState<boolean>(false);
  const allowNavigationRef = useRef<boolean>(false);
  const currentHrefRef = useRef<string>("");
  const historyTrapInsertedRef = useRef<boolean>(false);

  const requestNavigate = useCallback(
    function requestNavigate(href: string): void {
      if (!canEditDraft || !isDirty) {
        router.push(href);
        return;
      }

      setPendingHref(href);
      setDiscardNavigateOpen(true);
    },
    [canEditDraft, isDirty, router],
  );

  useEffect(
    function installNavigationGuards(): (() => void) | void {
      if (!canEditDraft || !isDirty) {
        return;
      }

      currentHrefRef.current = window.location.href;
      allowNavigationRef.current = false;

      if (!historyTrapInsertedRef.current) {
        window.history.pushState(
          { __discardNavigateGuard: true },
          "",
          window.location.href,
        );
        historyTrapInsertedRef.current = true;
      }

      function handleBeforeUnload(event: BeforeUnloadEvent): void {
        if (!canEditDraft || !isDirty) {
          return;
        }

        event.preventDefault();
        event.returnValue = "";
      }

      function handlePopState(): void {
        if (allowNavigationRef.current) {
          return;
        }
        if (!canEditDraft || !isDirty) {
          return;
        }

        const nextHref = window.location.href;
        setPendingHref(nextHref);
        setDiscardNavigateOpen(true);

        window.history.pushState(
          { __discardNavigateGuard: true },
          "",
          currentHrefRef.current,
        );
      }

      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
        historyTrapInsertedRef.current = false;
      };
    },
    [canEditDraft, isDirty],
  );

  function confirmDiscardNavigate(): void {
    if (!pendingHref) {
      setDiscardNavigateOpen(false);
      return;
    }

    const nextHref = pendingHref;
    setDiscardNavigateOpen(false);
    setPendingHref(null);
    allowNavigationRef.current = true;
    historyTrapInsertedRef.current = false;
    router.push(nextHref);
  }

  function closeDiscardNavigate(): void {
    setDiscardNavigateOpen(false);
    setPendingHref(null);
  }

  return {
    requestNavigate,
    discardNavigateOpen,
    pendingHref,
    confirmDiscardNavigate,
    closeDiscardNavigate,
  };
}
