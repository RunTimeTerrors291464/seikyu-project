"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import { Field, Input } from "@/components/ui/Fields";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useDict } from "@/lib/lang/DictProvider";
import useFocusFirstFormControlOnOpen from "@/lib/hooks/useFocusFirstFormControlOnOpen";
import clsx from "clsx";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import ResetPasswordPopup from "./ResetPasswordPopup";
import {
  activateUser,
  deactivateUser,
  editUser,
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
  type UserResponseDto,
  type UserRoleCode,
} from "../services/adminUsers.service";

const MAX_NAME_LEN = 64;
const MAX_USERNAME_LEN = 64;

type EditUserPopupProps = {
  open: boolean;
  user: UserResponseDto | null;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * True when the user turned the account on locally but the last saved row is still inactive
 * (mirrors product `pendingActivationSave`): block field edits until activation is persisted.
 */
function isPendingActivationSave(
  draft: UserResponseDto | null,
  saved: UserResponseDto | null,
): boolean {
  return Boolean(draft && saved && !saved.isActive && draft.isActive);
}

/**
 * Compares role checkbox state to the API list (order-insensitive).
 */
function rolesMatchSnapshot(
  selected: Set<UserRoleCode>,
  snapshotRoles: UserRoleCode[],
): boolean {
  const a = Array.from(selected).sort((x, y) => x - y).join(",");
  const b = [...snapshotRoles].sort((x, y) => x - y).join(",");
  return a === b;
}

/**
 * Modal to edit a user: active toggle stages like product detail (Save persists), fields disabled when inactive.
 *
 * @param open - Whether the dialog is visible.
 * @param user - User to edit; form resets when this reference changes.
 * @param onClose - Called when the dialog is dismissed.
 * @param onSaved - Optional callback after a successful save, or after password reset (edit closes).
 */
export default function EditUserPopup({
  open,
  user,
  onClose,
  onSaved,
}: EditUserPopupProps) {
  const dict = useDict();
  const [savedSnapshot, setSavedSnapshot] = useState<UserResponseDto | null>(
    null,
  );
  const [liveUser, setLiveUser] = useState<UserResponseDto | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [middleName, setMiddleName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [roles, setRoles] = useState<Set<UserRoleCode>>(new Set());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attempted, setAttempted] = useState<boolean>(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState<boolean>(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState<boolean>(false);
  const formFieldsRef = useFocusFirstFormControlOnOpen({
    when: open && user != null,
    bumpKey: user?.id,
  });

  function applyFormFromUser(u: UserResponseDto): void {
    setFirstName(u.firstName ?? "");
    setMiddleName(u.middleName ?? "");
    setLastName(u.lastName ?? "");
    setUsername(u.username ?? "");
    setRoles(new Set(u.roles));
  }

  useEffect(
    function syncFromPropUser(): void {
      if (!user || !open) {
        return;
      }
      setSavedSnapshot(user);
      setLiveUser(user);
      applyFormFromUser(user);
      setAttempted(false);
      setSubmitting(false);
      setToggleConfirmOpen(false);
      setResetPasswordOpen(false);
    },
    [user, open],
  );

  function handleClose(): void {
    setAttempted(false);
    setSubmitting(false);
    setToggleConfirmOpen(false);
    setResetPasswordOpen(false);
    onClose();
  }

  function toggleRole(role: UserRoleCode): void {
    if (fieldsDisabled) {
      return;
    }
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

  function formFieldsMatchSnapshot(snap: UserResponseDto): boolean {
    return (
      firstName.trim() === (snap.firstName ?? "").trim() &&
      middleName.trim() === (snap.middleName ?? "").trim() &&
      lastName.trim() === (snap.lastName ?? "").trim() &&
      username.trim() === snap.username.trim() &&
      rolesMatchSnapshot(roles, snap.roles)
    );
  }

  /**
   * Applies active toggle locally after confirm (no API). Deactivating reverts form to last saved snapshot.
   */
  function confirmToggleActiveLocal(): void {
    if (!savedSnapshot || !liveUser) {
      return;
    }

    if (liveUser.isActive) {
      const reverted: UserResponseDto = { ...savedSnapshot, isActive: false };
      setLiveUser(reverted);
      applyFormFromUser(savedSnapshot);
    } else {
      setLiveUser({ ...liveUser, isActive: true });
    }

    setToggleConfirmOpen(false);
  }

  async function handleSubmit(): Promise<void> {
    if (!liveUser || !savedSnapshot) {
      return;
    }

    setAttempted(true);

    const trimmedUser = username.trim();
    const trimmedFirst = firstName.trim();

    if (!trimmedFirst || !trimmedUser || roles.size === 0) {
      return;
    }

    const snap0 = savedSnapshot;
    const needActive = liveUser.isActive !== snap0.isActive;
    const needFields = !formFieldsMatchSnapshot(snap0);

    if (!needActive && !needFields) {
      return;
    }

    setSubmitting(true);
    try {
      let snapAfter = snap0;

      if (needActive) {
        const statusRow = liveUser.isActive
          ? await activateUser(liveUser.id)
          : await deactivateUser(liveUser.id);
        snapAfter = statusRow;
        setSavedSnapshot(statusRow);
        setLiveUser(statusRow);
        applyFormFromUser(statusRow);
      }

      if (!formFieldsMatchSnapshot(snapAfter)) {
        const updated = await editUser({
          id: snapAfter.id,
          firstName: trimmedFirst,
          username: trimmedUser,
          middleName: middleName.trim() || null,
          lastName: lastName.trim() || null,
          roles: Array.from(roles),
        });
        setSavedSnapshot(updated);
        setLiveUser(updated);
        applyFormFromUser(updated);
      }

      toast.success(dict.userSaveSuccess);
      onSaved?.();
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
  const rolesError = attempted && roles.size === 0 ? dict.rolesRequired : "";

  if (!open || !user) {
    return null;
  }

  const sheetUser = liveUser ?? user;
  const pendingActivationSave = isPendingActivationSave(liveUser, savedSnapshot);
  const fieldsDisabled =
    Boolean(liveUser && !liveUser.isActive) || pendingActivationSave;

  const needsSave = Boolean(
    savedSnapshot &&
      liveUser &&
      (liveUser.isActive !== savedSnapshot.isActive ||
        !formFieldsMatchSnapshot(savedSnapshot)),
  );

  return (
    <>
      <Popup open={open} onClose={handleClose}>
        <div className="flex w-[min(100vw-2rem,440px)] flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">
              {dict.editUserTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <StatusToggle
                active={sheetUser.isActive}
                onClick={() => {
                  setToggleConfirmOpen(true);
                }}
                activeLabel={dict.active}
                inactiveLabel={dict.inactive}
              />
              <Button
                size="sm"
                accent="neutral"
                icon={<KeyRound className="h-3.5 w-3.5" />}
                onClick={() => {
                  setResetPasswordOpen(true);
                }}
                disabled={submitting}
              >
                {dict.resetPassword}
              </Button>
            </div>
          </div>

          <div
            ref={formFieldsRef}
            className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4"
          >
            <Field
              label={dict.firstNameLabel}
              required
              error={firstNameError || undefined}
            >
              <Input
                value={firstName}
                onChange={setFirstName}
                maxLength={MAX_NAME_LEN}
                disabled={fieldsDisabled}
              />
            </Field>

            <Field label={dict.middleNameLabel}>
              <Input
                value={middleName}
                onChange={setMiddleName}
                maxLength={MAX_NAME_LEN}
                disabled={fieldsDisabled}
              />
            </Field>

            <Field label={dict.lastNameLabel}>
              <Input
                value={lastName}
                onChange={setLastName}
                maxLength={MAX_NAME_LEN}
                disabled={fieldsDisabled}
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
                disabled={fieldsDisabled}
              />
            </Field>

            <div className="space-y-2">
              <div className="text-xs text-muted">
                {dict.rolesLabel}
                <span className="text-danger"> *</span>
              </div>
              <div
                className={clsx(
                  "flex flex-wrap gap-3",
                  fieldsDisabled && "pointer-events-none opacity-60",
                )}
              >
                {(
                  [
                    [USER_ROLE_ADMIN, dict.admin],
                    [USER_ROLE_MANAGER, dict.manager],
                    [USER_ROLE_CASHIER, dict.cashier],
                  ] as const
                ).map(([code, label]) => (
                  <label
                    key={code}
                    className={clsx(
                      "inline-flex items-center gap-2 text-sm",
                      fieldsDisabled
                        ? "cursor-not-allowed"
                        : "cursor-pointer",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={roles.has(code)}
                      onChange={() => {
                        toggleRole(code);
                      }}
                      disabled={fieldsDisabled}
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
            <Button accent="neutral" onClick={handleClose} disabled={submitting}>
              {dict.cancel}
            </Button>
            <Button
              accent="primary"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={submitting || !needsSave}
              className={clsx(submitting && "opacity-70")}
            >
              {submitting ? "…" : dict.save}
            </Button>
          </div>
        </div>
      </Popup>

      <ConfirmPopup
        open={toggleConfirmOpen}
        onClose={() => {
          setToggleConfirmOpen(false);
        }}
        title={
          sheetUser.isActive
            ? dict.confirmDeactivateUserTitle
            : dict.confirmActivateUserTitle
        }
        description={
          sheetUser.isActive
            ? dict.confirmDeactivateUserDescription
            : dict.confirmActivateUserDescription
        }
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        accent={sheetUser.isActive ? "danger" : "neutral"}
        onConfirm={() => {
          confirmToggleActiveLocal();
        }}
      />

      <ResetPasswordPopup
        open={resetPasswordOpen}
        user={sheetUser}
        onClose={() => {
          setResetPasswordOpen(false);
        }}
        onSaved={() => {
          onSaved?.();
          handleClose();
        }}
      />
    </>
  );
}
