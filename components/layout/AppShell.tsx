import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen w-full flex-col">
        <Topbar />
        <main className="container max-w-[1440px] py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
