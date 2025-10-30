import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen w-full flex-col">
        <main className="container max-w-[1440px] py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
