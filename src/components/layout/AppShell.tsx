"use client";
import Sidebar from "@/components/layout/Sidebar";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const sidebarOpenRaw = localStorage.getItem("app-shell:sidebar-open");
      if (sidebarOpenRaw !== null) {
        setIsSidebarOpen(sidebarOpenRaw === "1");
        return;
      }

      const sidebarCollapsedRaw = localStorage.getItem("app-shell:sidebar-collapsed");
      if (sidebarCollapsedRaw !== null) {
        setIsSidebarOpen(sidebarCollapsedRaw !== "1");
      }
    } catch { }
  }, []);

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
          setIsSidebarOpen(false);
        }}
      />
      <div className="flex h-screen w-full flex-col overflow-auto scrollbar-thin scrollbar-thumb-neutral-400 print:h-auto print:overflow-visible">
        <div className="flex grow min-h-0 min-w-0">
          {!isSidebarOpen ? (
            <button
              aria-label="Expand sidebar"
              className="sidebar-reopen-handle mt-6 h-8 w-3 shrink-0 self-start text-muted print:hidden"
              onClick={function onExpandSidebarClick() {
                setIsSidebarOpen(true);
              }}
              type="button"
            >
              <ChevronRight className="h-4 w-4 -translate-x-[2px]" />
            </button>
          ) : null}
          <main className={isSidebarOpen ? "flex grow min-h-0 min-w-0 px-6 py-6 print:block print:p-0" : "flex grow min-h-0 min-w-0 pl-3 pr-6 py-6 print:block print:p-0"}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
