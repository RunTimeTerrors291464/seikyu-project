"use client";

import LoginForm from "@/components/forms/login-form";
import ThemeToggle from "@/components/theme-toggle";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";



export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      router.push("/dashboard");
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <LogIn className="h-6 w-6 text-text" strokeWidth={2} />
          </div>

          <h1 className="text-xl font-semibold text-text">
            Sign in
          </h1>

          <p className="mt-1 text-sm text-muted">
            Enter your credentials to continue
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <LoginForm />

          <div className="border-t border-border px-6 py-4">
            <p className="text-center text-sm text-muted">
              Forgot your password?{" "}
              <a className="underline underline-offset-2 hover:text-text">
                Contact your administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} Your Company
        </p>

        <ThemeToggle />
      </div>
    </div>
  );
}
