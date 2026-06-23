"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { Field, Input } from "@/components/ui/Fields";
import { useDict } from "@/lib/lang/DictProvider";
import type { Dictionary } from "@/lib/lang/i18n";
import { getDictionary } from "@/lib/lang/i18n";
import { translateUnitName } from "@/lib/lang/translateUnitName";
import { AlertTriangle, FileText, Info, Pencil, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductUnit } from "../services/product.unit.service";

/* ─────────────────────────────────────────────────────────
   Token analysis helper
   ───────────────────────────────────────────────────────── */

const UNIT_TOKEN_PATTERN = /(\d+)([\p{L}]+)|([\p{L}]+)/gu;

function getUnknownTokens(name: string, dict: Dictionary): string[] {
  if (!name.trim()) return [];
  const unitWords = dict.unitWords as Record<string, string> | undefined;
  if (!unitWords) return [];

  const unknown: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(UNIT_TOKEN_PATTERN.source, UNIT_TOKEN_PATTERN.flags);

  while ((match = pattern.exec(name)) !== null) {
    const letters = match[2] ?? match[3];
    if (letters && !unitWords[letters.toLowerCase()]) {
      unknown.push(letters);
    }
  }
  return unknown;
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

type Props = {
  open: boolean;
  units: ProductUnit[];
  onClose: () => void;
  onAdd: (name: string, desc: string) => Promise<void>;
};

export default function AddUnitPopup({ open, units, onClose, onAdd }: Props) {
  const dict = useDict();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDesc("");
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const first = formRef.current?.querySelector<HTMLElement>("input");
      first?.focus();
    }
  }, [open]);

  const trimmed = name.trim();

  const isDuplicate = units.some(
    (u) => (u.unitName || "").toLowerCase().trim() === trimmed.toLowerCase(),
  );

  const canAdd = trimmed.length > 0 && !isDuplicate;

  const viDict = getDictionary("vi");
  const huDict = getDictionary("hu");

  const viPreview = trimmed ? translateUnitName(trimmed, viDict) : "";
  const huPreview = trimmed ? translateUnitName(trimmed, huDict) : "";

  const unknownTokens = getUnknownTokens(trimmed, dict);
  const hasUnknownTokens = unknownTokens.length > 0;

  async function handleSubmit() {
    if (!canAdd || saving) return;
    setSaving(true);
    try {
      await onAdd(trimmed, desc.trim());
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canAdd && !saving) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Popup open={open} onClose={onClose}>
      <div
        ref={formRef}
        className="flex flex-col w-[440px] max-w-[90vw]"
        onKeyDown={handleKeyDown}
      >
        {/* HEADER */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Plus className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-text">{dict.addUnit}</span>
        </div>

        <div className="flex flex-col gap-4 p-5">

          {/* UNIT NAME FIELD */}
          <Field
            label={dict.name}
            required
            error={isDuplicate ? dict.isDuplicate : undefined}
            icon={<Pencil className="h-3 w-3" />}
          >
            <Input
              value={name}
              onChange={setName}
              placeholder="pack/6 pieces"
            />
          </Field>

          {/* TRANSLATION PREVIEWS (VI + HU) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">{dict.unitNamePreviewLabel}</span>

            <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/10 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 text-[11px] font-semibold text-muted uppercase">VI</span>
                {trimmed ? (
                  <span className={viPreview !== trimmed ? "text-text font-medium" : "text-muted italic"}>
                    {viPreview}
                  </span>
                ) : (
                  <span className="text-muted italic">—</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 text-[11px] font-semibold text-muted uppercase">HU</span>
                {trimmed ? (
                  <span className={huPreview !== trimmed ? "text-text font-medium" : "text-muted italic"}>
                    {huPreview}
                  </span>
                ) : (
                  <span className="text-muted italic">—</span>
                )}
              </div>
            </div>

            {/* WARNING: unrecognized tokens */}
            {hasUnknownTokens && (
              <div className="flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {dict.unitNameTranslationWarning}{" "}
                  <span className="font-mono font-semibold">
                    {unknownTokens.join(", ")}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* NAMING RULE HINT */}
          <div className="flex items-start gap-1.5 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
            <span>{dict.unitNamingRuleHint}</span>
          </div>

          {/* DESCRIPTION FIELD */}
          <Field
            label={dict.description}
            icon={<FileText className="h-3 w-3" />}
          >
            <Input
              value={desc}
              onChange={setDesc}
              placeholder={dict.unitDescriptionPlaceholder}
            />
          </Field>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button accent="neutral" onClick={onClose} disabled={saving}>
            {dict.cancel}
          </Button>
          <Button
            accent="primary"
            onClick={handleSubmit}
            disabled={!canAdd || saving}
          >
            {saving ? dict.saving : dict.add}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
