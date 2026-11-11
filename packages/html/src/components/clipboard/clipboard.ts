import { type CopyFailure, type CopyResult, clipboardText, copyToClipboard } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec, Runtime } from "../../runtime/types.js";
import type { ToasterInstance } from "../toaster/toaster.js";

const COPY = "data-ok-clipboard-copy";
const TEXT = "data-ok-clipboard-text";
const TRIGGER = "data-ok-clipboard-trigger";
const TOAST = "data-ok-clipboard-toast";
const ERROR_TOAST = "data-ok-clipboard-error-toast";

/** A clipboard trigger's instance. */
export interface ClipboardInstance extends ComponentInstance {
  /**
   * Copies the trigger's text, as a click (or a double click) on it does. Call it from a click
   * or a key press handler: outside a user gesture the browser refuses (`reason: "gesture"`).
   */
  copy(): Promise<CopyResult>;
}

/** Events of a clipboard trigger (`ok:clipboard:<name>`), fired on the trigger. */
export interface ClipboardEvents {
  /**
   * After each copy: the `text`, `ok`, and when it failed the `reason` (`gesture`,
   * `unsupported` or `denied`). Show your own message from here when you don't use the toasts.
   */
  copy: EventSpec<{ text: string; ok: boolean; reason?: CopyFailure }>;
}

/** The element whose text a trigger copies, or `null` when its value names no element. */
function sourceOf(trigger: HTMLElement): Element | null {
  const id = trigger.getAttribute(COPY);
  if (id) return (trigger.getRootNode() as Document | ShadowRoot).getElementById(id);
  // A button inside a text field (the end adornment) copies the field's input.
  const input = trigger.matches("button, [role='button']")
    ? trigger.closest("[data-ok-text-field]")?.querySelector("[data-ok-text-field-input]")
    : null;
  return input ?? trigger;
}

/** Shows the toast template `templateId` in the trigger's toaster (`data-ok-toast-toaster`). */
function showToast(trigger: HTMLElement, templateId: string | null, runtime: Runtime) {
  if (!templateId) return;
  const root = trigger.getRootNode() as Document | ShadowRoot;
  const template = root.getElementById(templateId);
  const named = trigger.getAttribute("data-ok-toast-toaster");
  const toaster = named
    ? root.querySelector(`[data-ok-toaster][id="${CSS.escape(named)}"]`)
    : root.querySelector("[data-ok-toaster]");
  const instance = runtime.getOrCreate<ToasterInstance>(toaster, "toaster");
  if (template instanceof HTMLTemplateElement && instance) instance.showTemplate(template);
  else console.warn("[owlky] No toast template or toaster for this copy trigger.", trigger);
}

/**
 * Copy to clipboard — spec: specs/components/text-field.md (roadmap 4.20)
 *
 * Markup:  <div data-ok-text-field …>
 *            …<input id="link" data-ok-text-field-input value="https://…">
 *            <span data-ok-text-field-adornment="end">
 *              <button type="button" data-ok-icon-button aria-label="Copy" data-ok-clipboard-copy
 *                      data-ok-clipboard-toast="copied" data-ok-clipboard-error-toast="copy-failed">…</button>
 *            </span>…
 *          </div>
 *          <p data-ok-clipboard-copy data-ok-clipboard-trigger="dblclick">Double click to copy.</p>
 * A press on `[data-ok-clipboard-copy]` (a double click with `data-ok-clipboard-trigger="dblclick"`)
 * copies `data-ok-clipboard-text`, else the text of the element its value names (empty: the input
 * of the text field around a button, or the element itself), then fires `ok:clipboard:copy` and
 * shows the `<template>` toast named by `data-ok-clipboard-toast` (copied) or
 * `data-ok-clipboard-error-toast` (refused) in the page's toaster, whose live region announces it.
 */
export const clipboard = defineComponent<ClipboardInstance, ClipboardEvents>({
  name: "clipboard",
  selector: `[${COPY}]`,

  setup(element, { emit, runtime }) {
    return {
      async copy() {
        const literal = element.getAttribute(TEXT);
        const source = literal === null ? sourceOf(element) : null;
        if (literal === null && !source)
          console.warn("[owlky] This copy trigger names no element.", element);
        const text = literal ?? (source ? clipboardText(source) : "");
        const result: CopyResult =
          literal === null && !source
            ? { ok: false, reason: "unsupported" }
            : await copyToClipboard(text, { document: element.ownerDocument });
        emit("copy", result.ok ? { text, ok: true } : { text, ok: false, reason: result.reason });
        showToast(element, element.getAttribute(result.ok ? TOAST : ERROR_TOAST), runtime);
        return result;
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: `[${COPY}]:not([${TRIGGER}="dblclick"])`,
      handle(trigger, _event, runtime) {
        void runtime.getOrCreate<ClipboardInstance>(trigger, "clipboard")?.copy();
      },
    },
    {
      event: "dblclick",
      selector: `[${COPY}][${TRIGGER}="dblclick"]`,
      handle(trigger, _event, runtime) {
        void runtime.getOrCreate<ClipboardInstance>(trigger, "clipboard")?.copy();
      },
    },
  ],
});
