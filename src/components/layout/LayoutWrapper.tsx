"use client";

import AppShell from "@/components/layout/AppShell";
import { usePathname } from "next/navigation";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that should NOT use AppShell
  const noShellRoutes = [
    "/login",
    "/register",
    "/forgot-password",
  ];

  const useShell = !noShellRoutes.includes(pathname);

  if (!useShell) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}