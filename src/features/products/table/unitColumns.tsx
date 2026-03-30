"use client";

import Button from "@/components/ui/Buttons";
import type { Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { Dictionary } from "@/lib/lang/i18n";
import clsx from "clsx";
import {
  CirclePower,
  FileText,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react";
import ActivePill from "../components/ActivePill";
import { ProductUnit } from "../services/product.unit.service";

type Actions = {
  selectedUnitId?: string;

  editingId?: string;
  draftMap: Record<string, ProductUnit>;

  updating?: boolean;

  onSelect: (unit: ProductUnit) => void;
  onEdit: (unit: ProductUnit) => void;
  onDelete?: (unit: ProductUnit) => void;

  onChange: <K extends keyof ProductUnit>(
    id: string,
    field: K,
    value: ProductUnit[K]
  ) => void;

  onSave: (unit: ProductUnit) => void;
  onCancel: () => void;
  isDirty: (original?: ProductUnit, draft?: ProductUnit) => boolean;
  units: ProductUnit[];
};

export function unitColumns(
  dict: Dictionary,
  {
    selectedUnitId,
    editingId,
    draftMap,
    updating,
    onSelect,
    onEdit,
    onDelete,
    onChange,
    onSave,
    onCancel,
    isDirty,
    units
  }: Actions
): Column<ProductUnit>[] {
  return [
    /* ───────── NAME ───────── */
    {
      id: "name",
      header: dict.name,
      icon: <Pencil className="h-3.5 w-3.5" />,
      accessor: (u) => {
        const isEditing = u.id === editingId;
        const isInactive = !(draftMap[u.id]?.isActive ?? u.isActive);
        const draft = draftMap[u.id] || u;

        return isEditing ? (
          <Input
            value={draft.unitName}
            disabled={isInactive || updating}
            onChange={(v) =>
              onChange(u.id, "unitName", v)
            }
          />
        ) : (
          <div
            onClick={() => {
              if (editingId || isInactive) return; // prevent select while editing
              onSelect(u);
            }}
            className={clsx(
              "flex items-center gap-2",
              u.id === selectedUnitId && "font-semibold text-primary",
              isInactive && "cursor-not-allowed" || "cursor-pointer"
            )}
          >
            <span className="font-mono">
              {u.unitName}
            </span>
          </div>
        );
      },
    },

    /* ───────── DESCRIPTION ───────── */
    {
      id: "description",
      header: dict.description,
      icon: <FileText className="h-3 w-3" />,
      accessor: (u) => {
        const isEditing = u.id === editingId;
        const isInactive = !(draftMap[u.id]?.isActive ?? u.isActive);
        const draft = {
          ...u,
          ...(draftMap[u.id] || {}),
        };

        return isEditing ? (
          <Input
            value={draft.unitDescription || ""}
            disabled={isInactive || updating}
            onChange={(v) =>
              onChange(u.id, "unitDescription", v)
            }
          />
        ) : (
          <span className="text-muted">
            {u.unitDescription || "—"}
          </span>
        );
      },
    },

    /* ───────── STATUS ───────── */
    {
      id: "status",
      header: dict.status,
      icon: <CirclePower className="h-3.5 w-3.5" />,
      align: "center",
      accessor: (u) => {
        const isEditing = u.id === editingId;
        const draft = {
          ...u,
          ...(draftMap[u.id] || {}),
        };

        return isEditing ? (
          <StatusToggle
            active={draft.isActive}
            onClick={() => {
              if (!isEditing || updating) return;

              onChange(
                u.id,
                "isActive",
                !draft.isActive
              );
            }}
            activeLabel={dict.active}
            inactiveLabel={dict.inactive}
          />
        ) : (
          <ActivePill active={u.isActive} />
        );
      },
    },

    /* ───────── ACTION ───────── */
    {
      id: "action",
      header: dict.action,
      align: "right",
      icon: <Settings className="h-3 w-3" />,
      accessor: (u) => {
        const isEditing = u.id === editingId;
        const draft = draftMap[u.id] || u;
        const original = units.find((x) => x.id === u.id);
        const changed = isDirty(original, draft);

        return (
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {isEditing ? (
              <>
                <Button
                  accent="primary"
                  onClick={() => onSave(draft)}
                  disabled={!changed || updating}
                >
                  {dict.save}
                </Button>

                <Button
                  accent="neutral"
                  onClick={onCancel}
                  disabled={updating}
                >
                  {dict.cancel}
                </Button>
              </>
            ) : (
              <>
                <Button
                  accent="primary"
                  onClick={() => onEdit(u)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>

                {onDelete && (
                  <Button
                    onClick={() => onDelete(u)}
                    accent="danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
      thClassName: "text-right pr-3",
      tdClassName: "text-right pr-3",
    },
  ];
}