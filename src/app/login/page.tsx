"use client";

import LoginForm from "@/components/forms/login-form";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useDict } from "@/lib/lang/DictProvider";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const dict = useDict();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">

      {/* top right controls */}
      <div className="absolute right-4 top-4 flex max-w-[min(100%-2rem,24rem)] flex-col items-stretch gap-2 sm:max-w-none sm:flex-row sm:items-start sm:justify-end">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <LogIn className="h-6 w-6 text-text" strokeWidth={2} />
          </div>

          <h1 className="text-xl font-semibold text-text">
            {dict.signIn}
          </h1>

          <p className="mt-1 text-sm text-muted">
            {dict.enterCredentials}
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-border bg-card shadow-sm">

          <LoginForm />

          <div className="border-t border-border px-6 py-4">
            <p className="text-center text-sm text-muted">
              {dict.forgotPassword}{" "}
              <a className="underline underline-offset-2 hover:text-text">
                {dict.contactAdministrator}
              </a>
            </p>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} {dict.companyName}
        </p>

      </div>
    </div>
  );
}