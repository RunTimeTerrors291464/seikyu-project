/*
useIsDirty

Utility hook that compares an original object with a draft (edited) version
and determines whether any fields have changed.

Features:
- Shallow comparison across all fields
- Trims and normalizes string values before comparison
- Handles undefined/null safely

Use cases:
- Disable Save button when no changes are made
- Avoid redundant update API calls
- Control confirmation dialogs (e.g., "Save changes?")

Note:
This performs a shallow comparison. For nested objects, extend logic if needed.
*/

export function useIsDirty<T extends Record<string, unknown>>() {
  return (original: T | undefined, draft: T | undefined) => {
    if (!original || !draft) return false;

    return Object.keys(draft).some((key) => {
      const o = original[key];
      const d = draft[key];

      // normalize string comparison
      if (typeof o === "string" || typeof d === "string") {
        return String(o ?? "").trim() !== String(d ?? "").trim();
      }

      return o !== d;
    });
  };
}