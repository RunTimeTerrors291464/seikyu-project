"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { Field, Input } from "@/components/ui/Fields";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { UserResponseDto } from "../services/adminUsers.service";
import { resetUserPassword } from "../services/adminUsers.service";

const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 64;

type ResetPasswordPopupProps = {
  open: boolean;
  user: UserResponseDto | null;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * Modal to set a new password for a user (admin reset).
 *
 * @param open - Whether the dialog is visible.
 * @param user - Target user.
 * @param onClose - Called when the dialog is dismissed.
 * @param onSaved - Optional callback after a successful reset.
 */
export default function ResetPasswordPopup({
  open,
  user,
  onClose,
  onSaved,
}: ResetPasswordPopupProps) {
  const dict = useDict();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attempted, setAttempted] = useState<boolean>(false);

  useEffect(
    function resetWhenOpened(): void {
      if (open) {
        setPassword("");
        setConfirmPassword("");
        setAttempted(false);
        setSubmitting(false);
      }
    },
    [open, user?.id],
  );

  function handleClose(): void {
    setPassword("");
    setConfirmPassword("");
    setAttempted(false);
    setSubmitting(false);
    onClose();
  }

  async function handleSubmit(): Promise<void> {
    if (!user) {
      return;
    }

    setAttempted(true);

    const lengthOk =
      password.length >= MIN_PASSWORD_LEN &&
      password.length <= MAX_PASSWORD_LEN;
    const matchOk = password === confirmPassword && password.length > 0;

    if (!lengthOk || !matchOk) {
      return;
    }

    setSubmitting(true);
    try {
      await resetUserPassword({ id: user.id, password });
      toast.success(dict.passwordResetSuccess);
      onSaved?.();
      handleClose();
    } catch {
      toast.error(dict.somethingWentWrong);
    } finally {
      setSubmitting(false);
    }
  }

  const passwordError =
    attempted &&
    (password.length < MIN_PASSWORD_LEN || password.length > MAX_PASSWORD_LEN)
      ? dict.passwordMinLengthHint
      : "";

  const confirmError =
    attempted && password !== confirmPassword
      ? dict.passwordsDoNotMatch
      : "";

  if (!open || !user) {
    return null;
  }

  return (
    <Popup open={open} onClose={handleClose}>
      <div className="flex w-[min(100vw-2rem,400px)] flex-col">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">
            {dict.resetPasswordTitle}
          </h2>
          <p className="mt-1 text-xs text-muted">{user.username}</p>
        </div>

        <div className="space-y-3 px-4 py-4">
          <Field
            label={dict.password}
            required
            hint={dict.passwordMinLengthHint}
            error={passwordError || undefined}
          >
            <Input
              type="password"
              value={password}
              onChange={setPassword}
              maxLength={MAX_PASSWORD_LEN}
            />
          </Field>

          <Field
            label={dict.confirmPasswordLabel}
            required
            error={confirmError || undefined}
          >
            <Input
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              maxLength={MAX_PASSWORD_LEN}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button accent="neutral" onClick={handleClose}>
            {dict.cancel}
          </Button>
          <Button
            accent="primary"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitting}
            className={clsx(submitting && "opacity-70")}
          >
            {submitting ? "…" : dict.resetPassword}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
