import { createEditor, getRuntime, type MarkdownInstance } from "@owlky/html";
import { common, createLowlight } from "lowlight";
import { markdownDefinition } from "../markdown/markdown-script.js";

// Syntax highlighting: lowlight with highlight.js's common languages.
const editor = createEditor({ highlighter: createLowlight(common) });

/** HTML: registers the editor and Markdown, syncs the preview and the "Full item" switch. */
export function editorScript(row: HTMLElement) {
  const runtime = getRuntime().register(editor, markdownDefinition);
  runtime.init(row);
  const main = row.querySelector<HTMLElement>("[data-ok-editor]");
  const preview = row.querySelector<HTMLElement>("[data-ok-markdown]");
  const toggle = row.querySelector<HTMLInputElement>("[data-ok-switch] input");
  const sync = (event: Event) => {
    const { value } = (event as CustomEvent<{ value: string }>).detail;
    runtime.get<MarkdownInstance>(preview, "markdown")?.setValue(value);
  };
  const full = () => main?.toggleAttribute("data-ok-full-item", toggle?.checked === true);
  main?.addEventListener("ok:editor:change", sync);
  toggle?.addEventListener("change", full);
  return () => {
    main?.removeEventListener("ok:editor:change", sync);
    toggle?.removeEventListener("change", full);
  };
}

const plainEditor = createEditor();

/** HTML: registers the editor (Bubble menu, Table and Mentions stories). */
export function plainEditorScript(row: HTMLElement): undefined {
  getRuntime().register(plainEditor).init(row);
  return undefined;
}

export const PLAIN_EDITOR_SCRIPT_SOURCE = `import { editor, getRuntime } from "@owlky/html";

// The editor isn't in the default components (it loads Tiptap): register it
// (or import "@owlky/html/editor"; on a CDN page, owlky.js loads the editor by itself).
getRuntime().register(editor).start();`;

export const EDITOR_SCRIPT_SOURCE = `import { createEditor, createMarkdown, getRuntime } from "@owlky/html";
import { common, createLowlight } from "lowlight";

// The editor and Markdown with syntax highlighting (or import "@owlky/html/editor" and
// "@owlky/html/markdown" without it).
const highlighter = createLowlight(common);
getRuntime()
  .register(createEditor({ highlighter }), createMarkdown({ highlighter }))
  .start();

const editor = document.querySelector("[data-ok-editor]");
const preview = document.querySelector("[data-ok-markdown]");
const fullItem = document.querySelector("#editor-full-item");

// Render the editor's HTML in the preview.
editor.addEventListener("ok:editor:change", (event) => {
  getRuntime().get(preview, "markdown").setValue(event.detail.value);
});
// The "Full item" switch shows every toolbar group.
fullItem.addEventListener("change", () => {
  editor.toggleAttribute("data-ok-full-item", fullItem.checked);
});`;
