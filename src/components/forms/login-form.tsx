"use client";

import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Eye, EyeOff, LogIn, User } from "lucide-react";

// Validation schema using Zod
// MOVE TO SEPARATE FILE WHEN MORE FORMS ADDED
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginSchema) => {
    try {
      setAuthError("");

      const data = await login(values);

      loginStore(data.accessToken, data.user);

      router.push("/dashboard");
    } catch (err) {
      console.error("LOGIN FAILED", err);

      setAuthError("Invalid username or password");
      // reset({ password: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 px-6 py-6"
    >
      {/* Username */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text">Username</label>

        <div
          className={`flex items-center gap-3 rounded-md border bg-card px-3
          ${errors.username || authError
              ? "border-danger focus-within:ring-2 focus-within:ring-red-500"
              : "border-border focus-within:ring-2 focus-within:ring-blue-500"
            }`}
        >
          <User className="h-4 w-4 text-muted" />

          <input
            {...register("username")}
            placeholder="your.username"
            className="h-10 flex-1 bg-transparent text-base text-text outline-none"
          />
        </div>

        {errors.username && (
          <span className="text-sm text-danger">
            {errors.username.message}
          </span>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text">Password</label>

        <div
          className={`flex items-center gap-3 rounded-md border bg-card px-3
          ${errors.password || authError
              ? "border-danger focus-within:ring-2 focus-within:ring-red-500"
              : "border-border focus-within:ring-2 focus-within:ring-blue-500"
            }`}
        >
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="h-10 flex-1 bg-transparent text-base text-text outline-none"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted hover:text-text"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {errors.password && (
          <span className="text-sm text-danger">
            {errors.password.message}
          </span>
        )}

        {authError && (
          <span className="text-sm text-danger">{authError}</span>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-10 items-center justify-center gap-2 rounded-md
        bg-primary text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />

        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}