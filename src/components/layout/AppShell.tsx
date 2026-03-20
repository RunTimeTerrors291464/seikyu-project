"use client";
import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen print:block">
      <Sidebar />
      <div className="flex h-screen w-full flex-col overflow-auto scrollbar-gutter-both scrollbar-thin scrollbar-thumb-neutral-400 print:h-auto print:overflow-visible">
        <main className="flex grow px-5 py-6 print:block print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
