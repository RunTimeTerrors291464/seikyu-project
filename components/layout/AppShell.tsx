"use client"; // Cause usePathname
import Sidebar from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // Get the current URL pathname (e.g., "/invoices", "/dashboard")
  const pathname = usePathname();

  // Define pages where scrolling should be disabled
  const noScrollPages = ["/invoices"];

  const shouldScroll = !noScrollPages.includes(pathname);
  return (
    <div className="flex min-h-screen">
      <Sidebar/>
      <div
        className={`flex min-h-screen w-full flex-col scrollbar-gutter-both ${
          shouldScroll ? "h-screen overflow-auto scrollbar-thin scrollbar-thumb-neutral-400" : "h-screen overflow-hidden"
        }`}
      >
        <main className="flex grow px-5 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
