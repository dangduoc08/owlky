import { codeEditorOptions, readBehavior, readNumber } from "@owlky/core";
import {
  type CodeEditorController,
  type CodeEditorOptions,
  type CodeEditorOverrideServices,
  type CodeEditorStatus,
  createCodeEditorController,
  type Monaco,
  type CodeEditorInstance as MonacoEditor,
} from "@owlky/core/code-editor";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";
import {
  labelOf,
  ownPart,
  readName,
  readOptions,
  readPath,
  readTheme,
  sizeProperties,
} from "./code-editor-dom.js";

export interface CodeEditorElementInstance extends ComponentInstance {
  /** `loading`, `ready` or `error` (the `<textarea>` fallback). */
  readonly status: CodeEditorStatus;
  /** Current value (the `<textarea>`'s until Monaco is ready). */
  readonly value: string;
  /** Replaces the value (an undoable edit). Emits no `change` event. */
  setValue(value: string): void;
  /** Merges Monaco options (`editor.updateOptions`). */
  updateOptions(options: CodeEditorOptions): void;
  focus(): void;
  /** Monaco's editor and namespace once ready. */
  readonly editor: MonacoEditor | null;
  readonly monaco: Monaco | null;
  /** The core controller. */
  readonly controller: CodeEditorController;
}

export interface CreateCodeEditorOptions {
  /** Called with Monaco before every editor is created (also: the `ok:code-editor:beforemount` event). */
  beforeMount?: ((monaco: Monaco) => void) | undefined;
  /** Called once an editor is mounted (also: the `ok:code-editor:mount` event). */
  onMount?: ((editor: MonacoEditor, monaco: Monaco) => void) | undefined;
  /** Monaco service overrides for every editor. */
  overrideServices?: CodeEditorOverrideServices | undefined;
}

const ROOT = "[data-ok-code-editor]";
const { language, theme, line, width, height, saveViewState, keepCurrentModel, path } =
  codeEditorOptions.options;
const WATCHED = [
  language.attr,
  theme.attr,
  line.attr,
  width.attr,
  height.attr,
  path.attr,
  "data-ok-options",
];

/**
 * Code editor — spec: specs/components/code-editor.md (ADR-0034). Not in the default
 * `components` list (it loads Monaco): import `@owlky/html/code-editor` or load
 * `owlky-code-editor.js` after `owlky.js`. `createCodeEditor({ beforeMount, onMount })` adds
 * hooks for every editor.
 *
 * Markup:  <div data-ok-code-editor data-ok-language="javascript" data-ok-height="400">
 *            <textarea data-ok-code-editor-value aria-label="Code">…initial value…</textarea>
 *            <div data-ok-code-editor-loading role="status">Loading...</div>
 *            <div data-ok-code-editor-content></div>
 *          </div>
 * Without JavaScript the textarea is the editor. The runtime loads Monaco (`loading`), mounts it
 * on the content (`ready`), or shows the textarea again if it couldn't load (`error`). Attribute
 * changes (language, path, theme, line, width, height, `data-ok-options`) update the editor.
 * Events:  ok:code-editor:beforemount `{ monaco }`, ok:code-editor:mount `{ editor, monaco }`,
 *          ok:code-editor:change `{ value, event }`, ok:code-editor:validate `{ markers }`,
 *          ok:code-editor:error `{ error }`.
 */
export const createCodeEditor = (hooks: CreateCodeEditorOptions = {}) =>
  defineComponent<CodeEditorElementInstance>({
    name: "code-editor",
    selector: ROOT,

    setup(element, { emit, signal }) {
      const field = ownPart<HTMLTextAreaElement>(element, "[data-ok-code-editor-value]", ROOT);
      const content = ownPart<HTMLElement>(element, "[data-ok-code-editor-content]", ROOT);
      if (!content) throw new Error("Code editor markup needs a [data-ok-code-editor-content].");
      let status: CodeEditorStatus = "loading";
      let written: string[] = [];
      const options = (): CodeEditorOptions => {
        const label = labelOf(field);
        return { ...(label ? { ariaLabel: label } : {}), ...readOptions(element) };
      };
      const lineOf = () => readNumber(element, line) as number | undefined;
      const resize = () => {
        written = syncCustomProperties(element, sizeProperties(element, width, height), written);
      };
      resize();
      element.setAttribute("data-ok-status", status);

      const controller = createCodeEditorController(
        content,
        {
          defaultValue: field?.value ?? "",
          defaultLanguage: readName(element, language.attr),
          defaultPath: readPath(element, path.attr),
          theme: readTheme(element, theme),
          line: lineOf(),
          options: options(),
          saveViewState: readBehavior(element, saveViewState),
          keepCurrentModel: element.hasAttribute(keepCurrentModel.attr),
          overrideServices: hooks.overrideServices,
          beforeMount(monaco) {
            hooks.beforeMount?.(monaco);
            emit("beforemount", { monaco });
          },
          onMount(editor, monaco) {
            hooks.onMount?.(editor, monaco);
            emit("mount", { editor, monaco });
          },
          onChange(value, event) {
            // The textarea keeps the form value (property only: user input never becomes markup).
            if (field) field.value = value;
            emit("change", { value, event });
          },
          onValidate: (markers) => emit("validate", { markers }),
          onStatusChange(next, error) {
            status = next;
            element.setAttribute("data-ok-status", next);
            if (next === "error") emit("error", { error });
          },
        },
        element,
      );

      // Fallback: while Monaco can't load, the textarea is the editor.
      field?.addEventListener(
        "input",
        () => {
          if (status === "error") emit("change", { value: field.value, event: null });
        },
        { signal },
      );

      // Other models: `<template data-ok-code-editor-model data-ok-path data-ok-language>` holds
      // the initial text of a path (inert: never rendered, no script). A path without one
      // starts empty, in the editor's language.
      const modelOf = (next: string) => {
        const template = [
          ...element.querySelectorAll<HTMLTemplateElement>("template[data-ok-code-editor-model]"),
        ].find((each) => each.closest(ROOT) === element && readPath(each, path.attr) === next);
        return {
          path: next,
          // A fragment's textContent is always a string.
          defaultValue: template ? (template.content.textContent as string) : "",
          defaultLanguage: readName(template ?? element, language.attr),
        };
      };

      const observer = new MutationObserver((records) => {
        const changed = new Set(records.map((record) => record.attributeName));
        if (changed.has(width.attr) || changed.has(height.attr)) resize();
        controller.update({
          ...(changed.has(language.attr)
            ? { language: readName(element, language.attr) ?? "plaintext" }
            : {}),
          ...(changed.has(path.attr) ? modelOf(readPath(element, path.attr) ?? "") : {}),
          ...(changed.has(theme.attr) ? { theme: readTheme(element, theme) } : {}),
          ...(changed.has(line.attr) ? { line: lineOf() } : {}),
          ...(changed.has("data-ok-options") ? { options: options() } : {}),
        });
      });
      observer.observe(element, { attributes: true, attributeFilter: WATCHED });

      return {
        get status() {
          return status;
        },
        get value() {
          return controller.editor ? controller.getValue() : (field?.value ?? "");
        },
        setValue(value) {
          if (field) field.value = value;
          controller.update({ value });
        },
        updateOptions(next) {
          controller.update({ options: next });
        },
        focus() {
          if (controller.editor) controller.editor.focus();
          else field?.focus();
        },
        get editor() {
          return controller.editor;
        },
        get monaco() {
          return controller.monaco;
        },
        controller,
        destroy() {
          observer.disconnect();
          if (field && controller.editor) field.value = controller.getValue();
          controller.destroy();
          syncCustomProperties(element, {}, written);
          element.removeAttribute("data-ok-status");
        },
      };
    },
  });

/** The code editor without hooks. */
export const codeEditor = createCodeEditor();
