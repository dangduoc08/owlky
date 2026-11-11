"use client";

import { type CopyResult, copyToClipboard } from "@owlky/core";
import { useCallback, useState } from "react";

export interface UseCopyToClipboard {
  /**
   * Copies `text` as plain text. Call it from a click or a key press handler. Resolves
   * `{ ok: true }`, or `{ ok: false, reason }` (`"gesture"`, `"unsupported"`, `"denied"`): tell the
   * person either way, such as with a toast.
   */
  copy(text: string): Promise<CopyResult>;
  /** The text of the last successful copy (`null` before one, or after a failed one). */
  copiedText: string | null;
}

/**
 * useCopyToClipboard — spec: specs/components/text-field.md (copy to clipboard). Copies text on
 * a user gesture through the shared core helper, with the refused paths reported.
 */
export function useCopyToClipboard(): UseCopyToClipboard {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copy = useCallback(async (text: string) => {
    const result = await copyToClipboard(text);
    setCopiedText(result.ok ? text : null);
    return result;
  }, []);
  return { copy, copiedText };
}
