"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { Field, Input } from "@/components/ui/Fields";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";

import {
  createUser,
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type CreateNewUserRequestDto,
  type UserRoleCode,
} from "../services/adminUsers.service";

const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 64;
const MAX_NAME_LEN = 64;
const MAX_USERNAME_LEN = 64;

type CreateUserPopupProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

/**
 * Modal form to create a user via admin API.
 *
 * @param open - Whether the dialog is visible.
 * @param onClose - Called when the user dismisses the dialog.
 * @param onCreated - Optional callback after successful create (e.g. refetch list).
 */
export default function CreateUserPopup({
  open,
  onClose,
  onCreated,
}: CreateUserPopupProps) {
  const dict = useDict();
  const [firstName, setFirstName] = useState<string>("");
  const [middleName, setMiddleName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [roles, setRoles] = useState<Set<UserRoleCode>>(new Set());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attempted, setAttempted] = useState<boolean>(false);

  function resetForm(): void {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setUsername("");
    setPassword("");
    setRoles(new Set());
    setSubmitting(false);
    setAttempted(false);
  }

  function handleClose(): void {
    resetForm();
    onClose();
  }

  function toggleRole(role: UserRoleCode): void {
    setRoles((previous) => {
      const next = new Set(previous);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }

  async function handleSubmit(): Promise<void> {
    setAttempted(true);

    const trimmedUser = username.trim();
    const trimmedFirst = firstName.trim();

    if (!trimmedFirst || !trimmedUser || roles.size === 0) {
      return;
    }

    if (
      password.length < MIN_PASSWORD_LEN ||
      password.length > MAX_PASSWORD_LEN
    ) {
      return;
    }

    const body: CreateNewUserRequestDto = {
      firstName: trimmedFirst,
      username: trimmedUser,
      password,
      roles: Array.from(roles),
    };

    const trimmedMiddle = middleName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedMiddle) {
      body.middleName = trimmedMiddle;
    }
    if (trimmedLast) {
      body.lastName = trimmedLast;
    }

    setSubmitting(true);
    try {
      await createUser(body);
      toast.success(dict.userCreateSuccess);
      onCreated?.();
      handleClose();
    } catch {
      toast.error(dict.somethingWentWrong);
    } finally {
      setSubmitting(false);
    }
  }

  const firstNameError =
    attempted && !firstName.trim() ? dict.firstNameRequired : "";
  const usernameError =
    attempted && !username.trim() ? dict.usernameRequired : "";
  const passwordError =
    attempted &&
    (password.length < MIN_PASSWORD_LEN || password.length > MAX_PASSWORD_LEN)
      ? dict.passwordMinLengthHint
      : "";
  const rolesError = attempted && roles.size === 0 ? dict.rolesRequired : "";

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={handleClose}>
      <div className="flex w-[min(100vw-2rem,440px)] flex-col">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">
            {dict.createUserTitle}
          </h2>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4">
          <Field
            label={dict.firstNameLabel}
            required
            error={firstNameError || undefined}
          >
            <Input
              value={firstName}
              onChange={setFirstName}
              maxLength={MAX_NAME_LEN}
            />
          </Field>

          <Field label={dict.middleNameLabel}>
            <Input
              value={middleName}
              onChange={setMiddleName}
              maxLength={MAX_NAME_LEN}
            />
          </Field>

          <Field label={dict.lastNameLabel}>
            <Input
              value={lastName}
              onChange={setLastName}
              maxLength={MAX_NAME_LEN}
            />
          </Field>

          <Field
            label={dict.username}
            required
            error={usernameError || undefined}
          >
            <Input
              value={username}
              onChange={setUsername}
              maxLength={MAX_USERNAME_LEN}
            />
          </Field>

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

          <div className="space-y-2">
            <div className="text-xs text-muted">
              {dict.rolesLabel}
              <span className="text-danger"> *</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  [USER_ROLE_ADMIN, dict.admin],
                  [USER_ROLE_MANAGER, dict.manager],
                  [USER_ROLE_CASHIER, dict.cashier],
                ] as const
              ).map(([code, label]) => (
                <label
                  key={code}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={roles.has(code)}
                    onChange={() => {
                      toggleRole(code);
                    }}
                    className="rounded border-border"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {rolesError ? (
              <p className="text-xs text-danger">{rolesError}</p>
            ) : null}
          </div>
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
            {submitting ? "…" : dict.createUserTitle}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
