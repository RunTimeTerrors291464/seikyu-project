"use client";

import {
  ArrowLeft,
  Save
} from "lucide-react";
import Link from "next/link";

import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { useDict } from "@/lib/lang/DictProvider";
import type { MouseEvent } from "react";
import { useState } from "react";

type Props = {
  name: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  onToggleActive: () => void;
  onSave?: () => Promise<boolean>;
  canSave?: boolean;
  /** When set, intercepts back navigation (e.g. unsaved-changes confirmation). */
  onBack?: () => void;
};

export default function ProductHeader({
  name,
  createdAt,
  updatedAt,
  active,
  onToggleActive,
  onSave,
  canSave,
  onBack,
}: Props) {
  const dict = useDict();

  function handleBackClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (!onBack) {
      return;
    }

    event.preventDefault();
    onBack();
  }

  const [saving, setSaving] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  /* ================= SAVE ================= */

  async function confirmSave() {
    if (!onSave) return;

    setSaving(true);

    try {
      await onSave();
    } catch (error) {
      console.error("[ProductHeader] SAVE → error", error);
    } finally {
      setSaving(false);
      setOpenConfirm(false);
    }
  }

  /* ================= UI ================= */

  return (
    <>
      <div className="flex items-center justify-between">
        {/* Left */}
        <Link
          href="/manager/product-inventory"
          className="flex items-center gap-2 text-xl font-semibold text-text hover:text-muted"
          aria-label={dict.back}
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
          {name}
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2">
          <HeaderMeta label={dict.createdAt} value={createdAt} />
          <HeaderMeta label={dict.updatedAt} value={updatedAt} />

          <StatusToggle
            active={active}
            onClick={onToggleActive}
            activeLabel={dict.active}
            inactiveLabel={dict.inactive}
          />

          <Button
            onClick={() => {
              console.log("clicked");
              setOpenConfirm(true);
            }}
            disabled={!canSave || saving}
            accent="primary"
            icon={<Save className="h-3.5 w-3.5" />}
          >
            {saving ? dict.saving : dict.save}
          </Button>
        </div>
      </div>

      {/* CONFIRM POPUP */}
      <ConfirmPopup
        open={openConfirm}
        title={dict.confirmSaveTitle}
        description={dict.confirmSaveDescription}
        confirmText={dict.save}
        cancelText={dict.cancel}
        loading={saving}
        onConfirm={confirmSave}
        onClose={() => !saving && setOpenConfirm(false)}
      />
    </>
  );
}