"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { toNumberOrZero } from "../types/importInvoiceDetail";

type LineWithReturnNotes = {
  returnQuantity: string;
  notes: string;
};

/**
 * Shared line updates and blur handling for return-import UIs (create popup + detail page).
 *
 * @param setLines - React state setter for the line array.
 * @param getLineId - Returns the stable id used to match rows (`localId` or `lineId`).
 * @returns `updateLine` and `handleBlurReturnQuantity` to pass into column definitions.
 */
export function useReturnImportLinesEditor<T extends LineWithReturnNotes>(
  setLines: Dispatch<SetStateAction<T[]>>,
  getLineId: (line: T) => string,
): {
  updateLine: (lineId: string, key: keyof T, value: string) => void;
  handleBlurReturnQuantity: (lineId: string) => void;
} {
  const updateLine = useCallback(
    function updateLine(
      lineId: string,
      key: keyof T,
      value: string,
    ): void {
      setLines((current) =>
        current.map((line) =>
          getLineId(line) === lineId ? { ...line, [key]: value } : line,
        ),
      );
    },
    [setLines, getLineId],
  );

  const handleBlurReturnQuantity = useCallback(
    function handleBlurReturnQuantity(lineId: string): void {
      setLines((current) =>
        current.map((line) => {
          if (getLineId(line) !== lineId) {
            return line;
          }

          if (toNumberOrZero(line.returnQuantity) <= 0) {
            return { ...line, returnQuantity: "0", notes: "" };
          }

          return line;
        }),
      );
    },
    [setLines, getLineId],
  );

  return { updateLine, handleBlurReturnQuantity };
}
