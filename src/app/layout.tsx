import LayoutWrapper from "@/components/layout/LayoutWrapper";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

import { DictProvider } from "@/lib/lang/DictProvider";
import { getDictionary, type Lang } from "@/lib/lang/i18n";

import AuthProvider from "@/components/layout/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory System",
  description: "Inventory management system",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as Lang;

  const dict = getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DictProvider dict={dict} lang={lang}>
            <AuthProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </AuthProvider>
            <Toaster richColors position="top-right" />
          </DictProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}