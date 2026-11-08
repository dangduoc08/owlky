import { createEditor, type EditorInstance, getRuntime } from "@owlky/html";
import { common, createLowlight } from "lowlight";

// Syntax highlighting: lowlight with highlight.js's common languages.
const editor = createEditor({ highlighter: createLowlight(common) });

/** HTML: registers the editor, syncs the preview and the "Full item" switch. */
export function editorScript(row: HTMLElement) {
  const runtime = getRuntime().register(editor);
  runtime.init(row);
  const [main, preview] = row.querySelectorAll<HTMLElement>("[data-ok-editor]");
  const toggle = row.querySelector<HTMLInputElement>("[data-ok-switch] input");
  const sync = (event: Event) => {
    const { value } = (event as CustomEvent<{ value: string }>).detail;
    runtime.get<EditorInstance>(preview ?? null, "editor")?.setValue(value);
  };
  const full = () => main?.toggleAttribute("data-ok-full-item", toggle?.checked === true);
  main?.addEventListener("ok:editor:change", sync);
  toggle?.addEventListener("change", full);
  return () => {
    main?.removeEventListener("ok:editor:change", sync);
    toggle?.removeEventListener("change", full);
  };
}

export const EDITOR_SCRIPT_SOURCE = `import { createEditor, getRuntime } from "@owlky/html";
import { common, createLowlight } from "lowlight";

// The editor with syntax highlighting (or import "@owlky/html/editor" without it).
getRuntime().register(createEditor({ highlighter: createLowlight(common) })).start();

const [editor, preview] = document.querySelectorAll("[data-ok-editor]");
const fullItem = document.querySelector("#editor-full-item");

// Show the content in the read-only preview.
editor.addEventListener("ok:editor:change", (event) => {
  getRuntime().get(preview, "editor").setValue(event.detail.value);
});
// The "Full item" switch shows every toolbar group.
fullItem.addEventListener("change", () => {
  editor.toggleAttribute("data-ok-full-item", fullItem.checked);
});`;
