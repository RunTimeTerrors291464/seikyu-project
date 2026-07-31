"use client";
import Sidebar from "@/components/layout/Sidebar";
import { useDict } from "@/lib/lang/DictProvider";
import ShortcutProvider from "@/lib/shortcuts/ShortcutProvider";
import useShortcut from "@/lib/shortcuts/useShortcut";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const SIDEBAR_TOGGLE_CHORD = { code: "Backslash", mod: true } as const;

function subscribeToClientMount(): () => void {
  return () => { };
}

function getStoredSidebarOpen(): boolean {
  try {
    const sidebarOpenRaw = localStorage.getItem("app-shell:sidebar-open");
    if (sidebarOpenRaw !== null) {
      return sidebarOpenRaw === "1";
    }

    const sidebarCollapsedRaw = localStorage.getItem("app-shell:sidebar-collapsed");
    if (sidebarCollapsedRaw !== null) {
      return sidebarCollapsedRaw !== "1";
    }
  } catch {
    // Storage access can be unavailable in privacy-restricted browsers.
  }

  return true;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShortcutProvider>
      <AppShellWithShortcuts>{children}</AppShellWithShortcuts>
    </ShortcutProvider>
  );
}

function AppShellWithShortcuts({ children }: { children: React.ReactNode }) {
  const dict = useDict();
  const hasMounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  );
  const [sidebarOpenOverride, setSidebarOpenOverride] = useState<boolean | null>(null);
  const isSidebarOpen = sidebarOpenOverride ?? (hasMounted ? getStoredSidebarOpen() : true);

  const handleToggleSidebarShortcut = useCallback(function handleToggleSidebarShortcut(): void {
    setSidebarOpenOverride(!isSidebarOpen);
  }, [isSidebarOpen]);

  useShortcut({
    id: "app-shell.toggle-sidebar",
    chord: SIDEBAR_TOGGLE_CHORD,
    label: dict.shortcutLabelToggleSidebar,
    handler: handleToggleSidebarShortcut,
    allowInEditable: false,
  });

  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem("app-shell:sidebar-open", isSidebarOpen ? "1" : "0");
    } catch { }
  }, [hasMounted, isSidebarOpen]);

  return (
    <div className="flex min-h-screen print:block">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={function onCloseSidebar() {
          setSidebarOpenOverride(false);
        }}
      />
      <div className="flex h-screen w-full flex-col overflow-auto scrollbar-thin scrollbar-thumb-neutral-400 print:h-auto print:overflow-visible">
        <div className="flex grow min-h-0 min-w-0">
          {!isSidebarOpen ? (
            <button
              aria-label="Expand sidebar"
              className="sidebar-reopen-handle mt-6 h-8 w-3 shrink-0 self-start text-muted print:hidden"
              onClick={function onExpandSidebarClick() {
                setSidebarOpenOverride(true);
              }}
              type="button"
            >
              <ChevronRight className="h-4 w-4 -translate-x-[2px]" />
            </button>
          ) : null}
          <main className={isSidebarOpen ? "flex grow min-h-0 min-w-0 px-6 py-6 print:block print:p-0 " : "flex grow min-h-0 min-w-0 pl-3 pr-6 py-6 print:block print:p-0 "}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
