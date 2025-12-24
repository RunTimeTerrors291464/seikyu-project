"use client";
import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex h-screen w-full flex-col overflow-auto scrollbar-gutter-both scrollbar-thin scrollbar-thumb-neutral-400">
        {/* <main className="flex min-h-0 grow px-5 py-6"> */}
        <main className="flex min-h-0 grow px-5 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
