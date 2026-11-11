/*
 * Copy to clipboard (roadmap 4.20) — spec: specs/components/text-field.md. One helper for both
 * implementations: React's `useCopyToClipboard()` and the HTML `clipboard` runtime call it from
 * a click or a key press. It never throws: the result says whether the text reached the
 * clipboard, and why not, so the owner can tell the person (a toast).
 */

/**
 * Why a copy failed:
 * - `gesture`: not called while the page handles a click or a key press (the browser would refuse);
 * - `unsupported`: no Clipboard API and the copy command did nothing (old or locked-down browsers);
 * - `denied`: the Clipboard API refused (a permission or policy) and the copy command did too.
 */
export type CopyFailure = "gesture" | "unsupported" | "denied";

/** The result of `copyToClipboard`. */
export type CopyResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: CopyFailure };

export interface CopyOptions {
  /** The document whose clipboard is written (default: the global `document`). */
  readonly document?: Document | undefined;
}

const COPIED: CopyResult = { ok: true };
const failed = (reason: CopyFailure): CopyResult => ({ ok: false, reason });

/**
 * The copy command, for browsers without the Clipboard API (insecure origins, old engines): a
 * one-off `copy` listener writes the text, so the selection and the focus stay where they are.
 */
function copyCommand(text: string, doc: Document): boolean {
  let written = false;
  const write = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData("text/plain", text);
    event.preventDefault();
    written = true;
  };
  doc.addEventListener("copy", write, true);
  try {
    return doc.execCommand("copy") && written;
  } catch {
    return false;
  } finally {
    doc.removeEventListener("copy", write, true);
  }
}

/**
 * Copies `text` as plain text. Call it from a click or a key press handler: outside a user
 * gesture it resolves `{ ok: false, reason: "gesture" }` without asking the browser. Uses the
 * Clipboard API, else (or when it refuses) the browser's copy command.
 */
export async function copyToClipboard(
  text: string,
  options: CopyOptions = {},
): Promise<CopyResult> {
  const doc = options.document ?? document;
  const navigator = doc.defaultView?.navigator;
  // Checked before any await: the gesture only lasts for the handler's task.
  const activation = (navigator as { userActivation?: { isActive: boolean } } | undefined)
    ?.userActivation;
  if (activation && !activation.isActive) return failed("gesture");
  const api = navigator?.clipboard;
  if (typeof api?.writeText !== "function")
    return copyCommand(text, doc) ? COPIED : failed("unsupported");
  try {
    await api.writeText(text);
    return COPIED;
  } catch {
    return copyCommand(text, doc) ? COPIED : failed("denied");
  }
}

/**
 * The text an element holds for copying: a form control's value, otherwise its text with
 * runs of white space collapsed (a paragraph written over several source lines).
 */
export function clipboardText(element: Element): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )
    return element.value;
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}
