"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Fields";
import { useDict } from "@/lib/lang/DictProvider";
import { getDictionary } from "@/lib/lang/i18n";
import { Check, Pencil, Plus, Settings, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

type UnitWordRow = {
  key: string;
  hu: string;
  vi: string;
};

function buildInitialRows(): UnitWordRow[] {
  const enWords = getDictionary("en").unitWords as Record<string, string>;
  const viWords = getDictionary("vi").unitWords as Record<string, string>;
  const huWords = getDictionary("hu").unitWords as Record<string, string>;

  return Object.keys(enWords).map((key) => ({
    key,
    hu: huWords[key] ?? "",
    vi: viWords[key] ?? "",
  }));
}

const EMPTY_ROW: UnitWordRow = { key: "", hu: "", vi: "" };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UnitWordsManagerPopup({ open, onClose }: Props) {
  if (!open) {
    return null;
  }

  return <UnitWordsManagerPopupContent onClose={onClose} />;
}

function UnitWordsManagerPopupContent({ onClose }: Pick<Props, "onClose">) {
  const dict = useDict();

  const [rows, setRows] = useState<UnitWordRow[]>(buildInitialRows);
  const [search, setSearch] = useState("");

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UnitWordRow>(EMPTY_ROW);

  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<UnitWordRow>(EMPTY_ROW);

  /* ───────── Filtering ───────── */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.key.toLowerCase().includes(q) ||
        r.hu.toLowerCase().includes(q) ||
        r.vi.toLowerCase().includes(q),
    );
  }, [rows, search]);

  /* ───────── Edit ───────── */

  function startEdit(row: UnitWordRow) {
    setAddingNew(false);
    setNewDraft(EMPTY_ROW);
    setEditingKey(row.key);
    setEditDraft({ ...row });
  }

  function cancelEdit() {
    setEditingKey(null);
  }

  function saveEdit() {
    const trimmedKey = editDraft.key.trim();
    if (!trimmedKey) return;
    setRows((prev) =>
      prev.map((r) => (r.key === editingKey ? { ...editDraft, key: trimmedKey } : r)),
    );
    setEditingKey(null);
  }

  /* ───────── Delete ───────── */

  function deleteRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
    if (editingKey === key) setEditingKey(null);
  }

  /* ───────── Add new ───────── */

  const newKeyDuplicate = rows.some(
    (r) => r.key.trim() === newDraft.key.trim() && newDraft.key.trim() !== "",
  );
  const canSaveNew = newDraft.key.trim().length > 0 && !newKeyDuplicate;

  function openAddNew() {
    setEditingKey(null);
    setNewDraft(EMPTY_ROW);
    setAddingNew(true);
  }

  function cancelAddNew() {
    setAddingNew(false);
    setNewDraft(EMPTY_ROW);
  }

  function saveNew() {
    if (!canSaveNew) return;
    setRows((prev) => [{ ...newDraft, key: newDraft.key.trim() }, ...prev]);
    setAddingNew(false);
    setNewDraft(EMPTY_ROW);
  }

  /* ───────── Key handlers ───────── */

  function handleNewRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canSaveNew) {
      e.preventDefault();
      saveNew();
    }
    if (e.key === "Escape") cancelAddNew();
  }

  function handleEditRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && editDraft.key.trim()) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  }

  return (
    <Popup open onClose={onClose}>
      <div className="flex flex-col w-[680px] max-w-[90vw] max-h-[75vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
          <span className="flex items-center text-sm font-semibold text-text gap-2 whitespace-nowrap">
            <Settings className="h-4 w-4" />
            {dict.unitWordsTitle}
          </span>

          <div className="flex items-center gap-2">
            <div className="w-48" data-universal-search-root="">
              <Input
                value={search}
                onChange={setSearch}
                placeholder={dict.searchPlaceholder}
              />
            </div>

            <Button
              icon={<Plus className="h-3.5 w-3.5" />}
              accent="primary"
              onClick={openAddNew}
            >
              {dict.newUnitWord}
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="grow min-h-0 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-card border-b border-border">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted w-1/3">
                  EN (key)
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted w-1/3">
                  HU
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted w-1/3">
                  VI
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold text-muted w-[88px]" />
              </tr>
            </thead>

            <tbody>
              {/* NEW ROW */}
              {addingNew && (
                <tr
                  className="border-b border-border bg-primary/5"
                  onKeyDown={handleNewRowKeyDown}
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <Input
                        value={newDraft.key}
                        onChange={(v) => setNewDraft((p) => ({ ...p, key: v }))}
                        placeholder="key"
                      />
                      {newKeyDuplicate && (
                        <p className="text-xs text-danger">{dict.isDuplicate}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newDraft.hu}
                      onChange={(v) => setNewDraft((p) => ({ ...p, hu: v }))}
                      placeholder="HU"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newDraft.vi}
                      onChange={(v) => setNewDraft((p) => ({ ...p, vi: v }))}
                      placeholder="VI"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button
                        accent="primary"
                        disabled={!canSaveNew}
                        onClick={saveNew}
                        icon={<Check className="h-3 w-3" />}
                      >
                        {""}
                      </Button>
                      <Button
                        accent="neutral"
                        onClick={cancelAddNew}
                        icon={<X className="h-3 w-3" />}
                      >
                        {""}
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* DATA ROWS */}
              {filtered.map((row) =>
                editingKey === row.key ? (
                  /* EDITING ROW */
                  <tr
                    key={row.key}
                    className="border-b border-border bg-primary/5"
                    onKeyDown={handleEditRowKeyDown}
                  >
                    <td className="px-3 py-2">
                      <Input
                        value={editDraft.key}
                        onChange={(v) => setEditDraft((p) => ({ ...p, key: v }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={editDraft.hu}
                        onChange={(v) => setEditDraft((p) => ({ ...p, hu: v }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={editDraft.vi}
                        onChange={(v) => setEditDraft((p) => ({ ...p, vi: v }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <Button
                          accent="primary"
                          disabled={!editDraft.key.trim()}
                          onClick={saveEdit}
                          icon={<Check className="h-3 w-3" />}
                        >
                          {""}
                        </Button>
                        <Button
                          accent="neutral"
                          onClick={cancelEdit}
                          icon={<X className="h-3 w-3" />}
                        >
                          {""}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* READ-ONLY ROW */
                  <tr
                    key={row.key}
                    className="border-b border-border hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-sm text-text">
                      {row.key}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-text">
                      {row.hu || <span className="text-muted italic">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-text">
                      {row.vi || <span className="text-muted italic">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <Button
                          accent="neutral"
                          onClick={() => startEdit(row)}
                          icon={<Pencil className="h-3 w-3" />}
                        >
                          {""}
                        </Button>
                        <Button
                          accent="danger"
                          onClick={() => deleteRow(row.key)}
                          icon={<Trash2 className="h-3 w-3" />}
                        >
                          {""}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ),
              )}

              {/* EMPTY STATE */}
              {filtered.length === 0 && !addingNew && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted italic">
                    {search.trim() ? dict.noUnit : dict.noUnit}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button accent="neutral" onClick={onClose}>
            {dict.close}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
