import AppShell from "@/components/layout/AppShell";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Metadata for the application
export const metadata: Metadata = {
  title: "Inventory System",
  description: "Inventory management system",
};

// Root layout component that wraps all pages
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // HTML root with language and hydration warning suppression
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Theme provider for dark/light mode support */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}