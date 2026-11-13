import { diffEditorOptions, readNumber } from "@owlky/core";
import {
  type CodeEditorStatus,
  createDiffEditorController,
  type DiffEditorController,
  type DiffEditorOptions,
  type Monaco,
  type DiffEditorInstance as MonacoDiffEditor,
} from "@owlky/core/code-editor";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import {
  labelOf,
  ownPart,
  readName,
  readOptions,
  readPath,
  readTheme,
  sizeProperties,
} from "../code-editor/code-editor-dom.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface DiffEditorEvents {
  /** Before the diff editor is created: configure `monaco` here. */
  beforemount: EventSpec<{ monaco: unknown }>;
  /** After the diff editor was created. */
  mount: EventSpec<{ editor: unknown; monaco: unknown }>;
  /** After Monaco failed to load. */
  error: EventSpec<{ error: unknown }>;
}

export interface DiffEditorElementInstance extends ComponentInstance {
  /** `loading`, `ready` or `error`. */
  readonly status: CodeEditorStatus;
  /** The original and modified texts (the `<textarea>`s' until Monaco is ready). */
  readonly original: string;
  /** The text on the modified side. */
  readonly modified: string;
  /** Replaces the text on the original side. */
  setOriginal(value: string): void;
  /** Replaces the modified text (an undoable edit). */
  setModified(value: string): void;
  /** Changes Monaco's diff editor options. */
  updateOptions(options: DiffEditorOptions): void;
  /** Monaco's diff editor once loaded, or `null`. */
  readonly editor: MonacoDiffEditor | null;
  /** The Monaco namespace once loaded, or `null`. */
  readonly monaco: Monaco | null;
  /** The core controller. */
  readonly controller: DiffEditorController;
}

export interface CreateDiffEditorOptions {
  /** Called with Monaco before every diff editor is created (also `ok:diff-editor:beforemount`). */
  beforeMount?: ((monaco: Monaco) => void) | undefined;
  /** Called once a diff editor is mounted (also `ok:diff-editor:mount`). */
  onMount?: ((editor: MonacoDiffEditor, monaco: Monaco) => void) | undefined;
}

const ROOT = "[data-ok-diff-editor]";
const o = diffEditorOptions.options;
const WATCHED = [
  o.language.attr,
  o.originalLanguage.attr,
  o.modifiedLanguage.attr,
  o.theme.attr,
  o.width.attr,
  o.height.attr,
  o.line.attr,
  o.originalModelPath.attr,
  o.modifiedModelPath.attr,
  "data-ok-options",
];

/**
 * Diff editor — spec: specs/components/code-editor.md (ADR-0034). Registered with the code editor
 * (`@owlky/html/code-editor`, or the CDN's lazy `modules/code-editor.js`).
 *
 * Markup:  <div data-ok-diff-editor data-ok-language="markdown" data-ok-height="400">
 *            <textarea data-ok-diff-editor-original aria-label="Original">…</textarea>
 *            <textarea data-ok-diff-editor-modified aria-label="Modified">…</textarea>
 *            <div data-ok-diff-editor-loading role="status">Loading...</div>
 *            <div data-ok-diff-editor-content></div>
 *          </div>
 * Events:  ok:diff-editor:beforemount `{ monaco }`, ok:diff-editor:mount `{ editor, monaco }`,
 *          ok:diff-editor:error `{ error }`.
 */
export const createDiffEditor = (hooks: CreateDiffEditorOptions = {}) =>
  defineComponent<DiffEditorElementInstance, DiffEditorEvents>({
    name: "diff-editor",
    selector: ROOT,

    setup(element, { emit }) {
      const original = ownPart<HTMLTextAreaElement>(
        element,
        "[data-ok-diff-editor-original]",
        ROOT,
      );
      const modified = ownPart<HTMLTextAreaElement>(
        element,
        "[data-ok-diff-editor-modified]",
        ROOT,
      );
      const content = ownPart<HTMLElement>(element, "[data-ok-diff-editor-content]", ROOT);
      if (!content) throw new Error("Diff editor markup needs a [data-ok-diff-editor-content].");
      let status: CodeEditorStatus = "loading";
      let written: string[] = [];
      const resize = () => {
        written = syncCustomProperties(
          element,
          sizeProperties(element, o.width, o.height),
          written,
        );
      };
      const languages = () => ({
        language: readName(element, o.language.attr),
        originalLanguage: readName(element, o.originalLanguage.attr),
        modifiedLanguage: readName(element, o.modifiedLanguage.attr),
      });
      const paths = () => ({
        originalModelPath: readPath(element, o.originalModelPath.attr),
        modifiedModelPath: readPath(element, o.modifiedModelPath.attr),
      });
      const options = (): DiffEditorOptions => {
        const originalLabel = labelOf(original);
        const modifiedLabel = labelOf(modified);
        return {
          ...(originalLabel ? { originalAriaLabel: originalLabel } : {}),
          ...(modifiedLabel ? { modifiedAriaLabel: modifiedLabel } : {}),
          ...readOptions(element),
        };
      };
      const lineOf = () => readNumber(element, o.line) as number | undefined;
      resize();
      element.setAttribute("data-ok-status", status);

      const controller = createDiffEditorController(
        content,
        {
          original: original?.value ?? "",
          modified: modified?.value ?? "",
          ...languages(),
          ...paths(),
          theme: readTheme(element, o.theme),
          line: lineOf(),
          options: options(),
          keepCurrentOriginalModel: element.hasAttribute(o.keepCurrentOriginalModel.attr),
          keepCurrentModifiedModel: element.hasAttribute(o.keepCurrentModifiedModel.attr),
          beforeMount(monaco) {
            hooks.beforeMount?.(monaco);
            emit("beforemount", { monaco });
          },
          onMount(editor, monaco) {
            hooks.onMount?.(editor, monaco);
            emit("mount", { editor, monaco });
          },
          onStatusChange(next, error) {
            status = next;
            element.setAttribute("data-ok-status", next);
            if (next === "error") emit("error", { error });
          },
        },
        element,
      );

      const observer = new MutationObserver((records) => {
        const changed = new Set(records.map((record) => record.attributeName));
        if (changed.has(o.width.attr) || changed.has(o.height.attr)) resize();
        controller.update({
          ...(changed.has(o.language.attr) ||
          changed.has(o.originalLanguage.attr) ||
          changed.has(o.modifiedLanguage.attr)
            ? languages()
            : {}),
          ...(changed.has(o.originalModelPath.attr) || changed.has(o.modifiedModelPath.attr)
            ? paths()
            : {}),
          ...(changed.has(o.theme.attr) ? { theme: readTheme(element, o.theme) } : {}),
          ...(changed.has(o.line.attr) ? { line: lineOf() } : {}),
          ...(changed.has("data-ok-options") ? { options: options() } : {}),
        });
      });
      observer.observe(element, { attributes: true, attributeFilter: WATCHED });

      const sides = () => controller.editor?.getModel() ?? null;
      return {
        get status() {
          return status;
        },
        get original() {
          return sides()?.original.getValue() ?? original?.value ?? "";
        },
        get modified() {
          return sides()?.modified.getValue() ?? modified?.value ?? "";
        },
        setOriginal(value) {
          if (original) original.value = value;
          controller.update({ original: value });
        },
        setModified(value) {
          if (modified) modified.value = value;
          controller.update({ modified: value });
        },
        updateOptions(next) {
          controller.update({ options: next });
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
          const models = sides();
          if (models && original) original.value = models.original.getValue();
          if (models && modified) modified.value = models.modified.getValue();
          controller.destroy();
          syncCustomProperties(element, {}, written);
          element.removeAttribute("data-ok-status");
        },
      };
    },
  });

/** The diff editor without hooks. */
export const diffEditor = createDiffEditor();
