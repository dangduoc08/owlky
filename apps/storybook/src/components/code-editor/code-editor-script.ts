import { type CodeEditorElementInstance, codeEditor, diffEditor, getRuntime } from "@owlky/html";
import type { CodeEditorMarker } from "@owlky/react";
import "./monaco-workers.js";

/** Registers the code and diff editors (the stories' page script) and mounts the row. */
function start(row: HTMLElement) {
  const runtime = getRuntime().register(codeEditor, diffEditor);
  runtime.init(row);
  return runtime;
}

/** Editor: the settings change the first editor's attributes; Apply copies the JSON options. */
export function editorScript(row: HTMLElement) {
  const runtime = start(row);
  const [main, optionsEditor] = row.querySelectorAll<HTMLElement>("[data-ok-code-editor]");
  const language = row.querySelector<HTMLSelectElement>("#code-editor-language");
  const theme = row.querySelector<HTMLSelectElement>("#code-editor-theme");
  const apply = row.querySelector<HTMLButtonElement>("#code-editor-apply");
  const onLanguage = () => main?.setAttribute("data-ok-language", language?.value ?? "");
  const onTheme = () => main?.setAttribute("data-ok-monaco-theme", theme?.value ?? "auto");
  const onApply = () => {
    const draft = runtime.get<CodeEditorElementInstance>(optionsEditor ?? null, "code-editor");
    let error = row.querySelector(".sb-code-editor-error");
    try {
      main?.setAttribute("data-ok-options", JSON.stringify(JSON.parse(draft?.value ?? "")));
      error?.remove();
    } catch {
      if (!error) {
        error = document.createElement("p");
        error.className = "sb-code-editor-error";
        error.setAttribute("role", "alert");
        error.textContent = "The options aren't valid JSON.";
        apply?.before(error);
      }
    }
  };
  language?.addEventListener("change", onLanguage);
  theme?.addEventListener("change", onTheme);
  apply?.addEventListener("click", onApply);
  return () => {
    language?.removeEventListener("change", onLanguage);
    theme?.removeEventListener("change", onTheme);
    apply?.removeEventListener("click", onApply);
  };
}

export const EDITOR_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";
import "@owlky/html/code-editor";

const [editor, optionsEditor] = document.querySelectorAll("[data-ok-code-editor]");
const language = document.querySelector("#code-editor-language");
const theme = document.querySelector("#code-editor-theme");
const apply = document.querySelector("#code-editor-apply");

// Attributes are the editor's options: changing one updates the editor.
language.addEventListener("change", () => {
  editor.setAttribute("data-ok-language", language.value);
});
theme.addEventListener("change", () => {
  editor.setAttribute("data-ok-monaco-theme", theme.value);
});
// Monaco options are JSON in data-ok-options.
apply.addEventListener("click", () => {
  const { value } = getRuntime().get(optionsEditor, "code-editor");
  editor.setAttribute("data-ok-options", JSON.stringify(JSON.parse(value)));
});`;

/** Multi-model editor: the File select switches the path (each template holds a file). */
export function multiModelScript(row: HTMLElement) {
  start(row);
  const select = row.querySelector<HTMLSelectElement>("#code-editor-file");
  const editor = row.querySelector<HTMLElement>("[data-ok-code-editor]");
  const onChange = () => {
    const path = `file:///${select?.value}`;
    const template = [
      ...(editor?.querySelectorAll("template[data-ok-code-editor-model]") ?? []),
    ].find((each) => each.getAttribute("data-ok-path") === path);
    editor?.setAttribute("data-ok-language", template?.getAttribute("data-ok-language") ?? "");
    editor?.setAttribute("data-ok-path", path);
  };
  select?.addEventListener("change", onChange);
  return () => select?.removeEventListener("change", onChange);
}

export const MULTI_MODEL_SCRIPT_SOURCE = `import "@owlky/html/code-editor";

const file = document.querySelector("#code-editor-file");
const editor = document.querySelector("[data-ok-code-editor]");

// A new data-ok-path switches the model; the matching <template> holds its first text.
file.addEventListener("change", () => {
  const path = \`file:///\${file.value}\`;
  const template = editor.querySelector(\`template[data-ok-path="\${path}"]\`);
  editor.setAttribute("data-ok-language", template.getAttribute("data-ok-language"));
  editor.setAttribute("data-ok-path", path);
});`;

/** Validation: lists the markers that `ok:code-editor:validate` reports. */
export function validationScript(row: HTMLElement) {
  start(row);
  const editor = row.querySelector<HTMLElement>("[data-ok-code-editor]");
  const list = row.querySelector<HTMLUListElement>(".sb-code-editor-problems");
  const onValidate = (event: Event) => {
    const { markers } = (event as CustomEvent<{ markers: CodeEditorMarker[] }>).detail;
    const items = markers.map((marker) => {
      const item = document.createElement("li");
      item.textContent = `Line ${marker.startLineNumber}, column ${marker.startColumn}: ${marker.message}`;
      return item;
    });
    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "No problems.";
      items.push(empty);
    }
    list?.replaceChildren(...items);
  };
  editor?.addEventListener("ok:code-editor:validate", onValidate);
  return () => editor?.removeEventListener("ok:code-editor:validate", onValidate);
}

export const VALIDATION_SCRIPT_SOURCE = `import "@owlky/html/code-editor";

const editor = document.querySelector("[data-ok-code-editor]");
const problems = document.querySelector(".sb-code-editor-problems");

// The model's markers (JSON errors here) after every check.
editor.addEventListener("ok:code-editor:validate", (event) => {
  const items = event.detail.markers.map((marker) => {
    const item = document.createElement("li");
    item.textContent = \`Line \${marker.startLineNumber}: \${marker.message}\`;
    return item;
  });
  problems.replaceChildren(...items);
});`;

/** The diff editor needs no page script: it only registers the editors. */
export function diffScript(row: HTMLElement) {
  start(row);
  return undefined;
}
