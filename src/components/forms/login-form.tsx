"use client";

import { defaultHomePathForRoles } from "@/lib/auth/authUser";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";

import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import type { Dictionary } from "@/lib/lang/i18n";

import { Field } from "@/components/ui/Fields";

import { z } from "zod";

/* ---------------- Schema ---------------- */

function createLoginSchema(dict: Dictionary) {
  return z.object({
    username: z.string().min(1, dict.usernameRequired),
    password: z.string().min(1, dict.passwordRequired),
  });
}

export default function LoginForm() {
  const dict = useDict();
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const loginSchema = createLoginSchema(dict);
  type LoginSchema = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  /* ---------------- Submit ---------------- */

  const onSubmit = async (values: LoginSchema) => {
    try {
      setAuthError("");

      const data = await login(values);

      localStorage.setItem("refresh_token", data.refreshToken);

      loginStore(data.accessToken, data.user);

      const signedInUser = useAuthStore.getState().user;
      if (!signedInUser) {
        setAuthError(dict.somethingWentWrong ?? "Something went wrong");
        return;
      }

      const home =
        signedInUser.roles.length > 0
          ? defaultHomePathForRoles(signedInUser.roles)
          : "/admin/users";

      router.push(home);

    } catch (error: unknown) {
      setAuthError(resolveApiErrorMessage(error, dict));
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5 px-6 py-6"
    >
      {/* Username */}
      <Field
        label={dict.username}
        icon={<User className="h-3.5 w-3.5" />}
        error={errors.username?.message}
      >
        <div
          className={`
            flex items-center rounded-md border px-3 bg-card
            transition-colors

            ${errors.username || authError
              ? "border-danger focus-within:border-danger"
              : "border-border focus-within:border-primary"
            }
          `}
        >
          <input
            {...register("username")}
            placeholder={dict.usernamePlaceholder}
            className="h-10 w-full bg-transparent text-sm text-text outline-none"
          />
        </div>
      </Field>

      {/* Password */}
      <Field
        label={dict.password}
        icon={<Lock className="h-3.5 w-3.5" />}
        error={errors.password?.message || authError}
      >
        <div
          className={`
            flex items-center rounded-md border px-3 bg-card
            transition-colors

            ${errors.password || authError
              ? "border-danger focus-within:border-danger"
              : "border-border focus-within:border-primary"
            }
          `}
        >
          {/* INPUT */}
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder={dict.passwordPlaceholder}
            className="h-10 flex-1 bg-transparent text-sm text-text outline-none"
          />

          {/* TOGGLE */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted hover:text-text transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="
          flex h-10 items-center justify-center gap-2 rounded-md
          bg-primary text-white
          transition-colors duration-150
          hover:bg-primary-hover
          active:bg-active
          disabled:opacity-60
        "
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? dict.signingIn : dict.signIn}
      </button>
    </form>
  );
}