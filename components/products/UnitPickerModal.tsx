"use client";
import { Check, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

// ── Types ──────────────────────────────────────────────────────────────────────

export type Unit = {
  id: string;
  name: string;
  description: string;
};

type UnitPickerModalProps = {
  isOpen: boolean;
  selectedUnit: string;
  onClose: () => void;
  onSelect: (unitName: string) => void;
};

// ── Default unit list ──────────────────────────────────────────────────────────

const DEFAULT_UNITS: Unit[] = [
  { id: "1", name: "db", description: "Darab — individual piece" },
  { id: "2", name: "cs", description: "Csomag — package" },
  { id: "3", name: "cs/100db", description: "Csomag per 100 darab" },
  { id: "4", name: "kg", description: "Kilogram" },
  { id: "5", name: "l", description: "Liter" },
  { id: "6", name: "100 cs/db", description: "100 csomag per darab" },
];

// ── Inline row editor ──────────────────────────────────────────────────────────

type RowEditorProps = {
  initialName?: string;
  initialDesc?: string;
  onSave: (name: string, desc: string) => void;
  onCancel: () => void;
  existingNames: string[];
  editingName?: string;
};

function RowEditor({ initialName = "", initialDesc = "", onSave, onCancel, existingNames, editingName }: RowEditorProps) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDesc);

  const trimmedName = name.trim();
  const isDuplicate = trimmedName !== editingName &&
    existingNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase());
  const canSave = trimmedName.length > 0 && !isDuplicate;

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canSave) onSave(trimmedName, desc.trim());
    if (e.key === "Escape") onCancel();
  }

  return (
    <tr className="bg-neutral-50 dark:bg-neutral-800/50">
      <td className="px-3 py-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Unit name..."
          className={`h-8 w-full rounded-md border px-2.5 text-xs outline-none focus:ring-2 dark:bg-neutral-900 dark:text-white ${isDuplicate
              ? "border-red-300 bg-red-50 focus:ring-red-200 dark:border-red-700 dark:bg-red-900/20"
              : "border-neutral-200 bg-white focus:ring-neutral-200 dark:border-neutral-700"
            }`}
        />
        {isDuplicate && <p className="mt-0.5 text-xs text-red-500">Already exists</p>}
      </td>
      <td className="px-3 py-2">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Description..."
          className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-xs outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 rounded-md border px-2.5 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(trimmedName, desc.trim())}
            className="h-8 rounded-md bg-neutral-900 px-2.5 text-xs text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export default function UnitPickerModal({ isOpen, selectedUnit, onClose, onSelect }: UnitPickerModalProps) {
  const [units, setUnits] = useState<Unit[]>(DEFAULT_UNITS);
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const existingNames = units.map((u) => u.name);

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.description.toLowerCase().includes(q);
  });

  function handleAdd(name: string, description: string) {
    setUnits((prev) => [...prev, { id: Date.now().toString(), name, description }]);
    setAddingNew(false);
  }

  function handleEdit(id: string, name: string, description: string) {
    const original = units.find((u) => u.id === id);
    setUnits((prev) => prev.map((u) => u.id === id ? { ...u, name, description } : u));
    if (original && original.name === selectedUnit) onSelect(name);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    const unit = units.find((u) => u.id === id);
    setUnits((prev) => prev.filter((u) => u.id !== id));
    if (unit && unit.name === selectedUnit) onSelect("");
    setPendingDeleteId(null);
  }

  function handleSelect(name: string) {
    onSelect(name);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative z-10 flex w-full max-w-lg flex-col rounded-lg border bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3 dark:border-neutral-800">

          {/* Search bar — left side */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units..."
              className="h-8 w-full rounded-md border border-neutral-200 bg-white pl-7 pr-7 text-xs outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Reset */}
            <button
              type="button"
              title="Reset"
              onClick={() => { setSearch(""); setAddingNew(false); setEditingId(null); setPendingDeleteId(null); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Add Unit */}
            {!addingNew && (
              <button
                type="button"
                onClick={() => { setAddingNew(true); setEditingId(null); setSearch(""); }}
                className="rounded-md bg-neutral-900 px-3 py-2 text-xs text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                + Add Unit
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="w-32 px-3 py-2 text-left text-xs font-medium text-neutral-500"></th>
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">Description</th>
                <th className="w-32 px-3 py-2 text-right text-xs font-medium text-neutral-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">

              {addingNew && (
                <RowEditor
                  existingNames={existingNames}
                  onSave={handleAdd}
                  onCancel={() => setAddingNew(false)}
                />
              )}

              {filtered.map((unit) =>
                editingId === unit.id ? (
                  <RowEditor
                    key={unit.id}
                    initialName={unit.name}
                    initialDesc={unit.description}
                    editingName={unit.name}
                    existingNames={existingNames}
                    onSave={(name, desc) => handleEdit(unit.id, name, desc)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr
                    key={unit.id}
                    onClick={() => handleSelect(unit.name)}
                    className={`cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${unit.name === selectedUnit ? "bg-neutral-100 dark:bg-neutral-800" : ""
                      }`}
                  >
                    {/* Unit name */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {unit.name === selectedUnit
                          ? <Check className="h-3 w-3 shrink-0 text-emerald-500" strokeWidth={2.5} />
                          : <span className="h-3 w-3 shrink-0" />
                        }
                        <span className={`font-mono text-xs font-semibold ${unit.name === selectedUnit
                            ? "text-neutral-900 dark:text-white"
                            : "text-neutral-700 dark:text-neutral-200"
                          }`}>
                          {unit.name}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {unit.description || "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {pendingDeleteId === unit.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-xs text-red-500">Delete?</span>
                          <button type="button" onClick={() => handleDelete(unit.id)}
                            className="h-7 rounded-md bg-red-500 px-2.5 text-xs font-medium text-white hover:bg-red-600">
                            Yes
                          </button>
                          <button type="button" onClick={() => setPendingDeleteId(null)}
                            className="h-7 rounded-md border px-2.5 text-xs text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditingId(unit.id); setAddingNew(false); }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(unit.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-white transition-colors hover:bg-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              )}

              {filtered.length === 0 && !addingNew && (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-xs text-neutral-400">
                    {search ? `No units match "${search}"` : "No units defined. Add one above."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t px-4 py-3 dark:border-neutral-800">
          <span className="text-xs text-neutral-400">
            {filtered.length} of {units.length} unit{units.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border px-3 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}