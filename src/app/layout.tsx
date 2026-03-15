import LayoutWrapper from "@/components/layout/LayoutWrapper";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Metadata for the application
export const metadata: Metadata = {
  title: "Inventory System",
  description: "Inventory management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Global theme provider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Decides whether AppShell should be used */}
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}