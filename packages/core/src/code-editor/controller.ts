import type * as MonacoApi from "monaco-editor";
import { type CancelablePromise, loader, type Monaco } from "./loader.js";
import { type CodeEditorTheme, themeClient } from "./theme.js";

export type CodeEditorInstance = MonacoApi.editor.IStandaloneCodeEditor;
export type DiffEditorInstance = MonacoApi.editor.IStandaloneDiffEditor;
export type CodeEditorOptions = MonacoApi.editor.IStandaloneEditorConstructionOptions;
export type DiffEditorOptions = MonacoApi.editor.IStandaloneDiffEditorConstructionOptions;
export type CodeEditorMarker = MonacoApi.editor.IMarker;
export type CodeEditorChangeEvent = MonacoApi.editor.IModelContentChangedEvent;
export type CodeEditorOverrideServices = MonacoApi.editor.IEditorOverrideServices;

/** Loading state: `loading` until Monaco is mounted, `error` when it couldn't load. */
export type CodeEditorStatus = "loading" | "ready" | "error";

interface Lifecycle<E> {
  /** Called with Monaco before the editor is created (register languages, themes, …). */
  readonly beforeMount?: ((monaco: Monaco) => void) | undefined;
  /** Called with the editor and Monaco once it is mounted. */
  readonly onMount?: ((editor: E, monaco: Monaco) => void) | undefined;
  /** Status changes: `ready` after `onMount`, `error` (with the reason) when loading failed. */
  readonly onStatusChange?: ((status: CodeEditorStatus, error?: unknown) => void) | undefined;
}

export interface CodeEditorState {
  readonly value?: string | undefined;
  readonly language?: string | undefined;
  readonly path?: string | undefined;
  /** Default `"auto"`: Owlky's light or dark theme, after the scope's `data-ok-theme`. */
  readonly theme?: CodeEditorTheme | undefined;
  readonly line?: number | undefined;
  readonly options?: CodeEditorOptions | undefined;
}

export interface CodeEditorControllerOptions
  extends CodeEditorState,
    Lifecycle<CodeEditorInstance> {
  readonly defaultValue?: string | undefined;
  readonly defaultLanguage?: string | undefined;
  readonly defaultPath?: string | undefined;
  readonly overrideServices?: CodeEditorOverrideServices | undefined;
  /** Default `true`: keeps each path's scroll, selection and folding across model switches. */
  readonly saveViewState?: boolean | undefined;
  /** Default `false`: the current model is disposed with the editor. */
  readonly keepCurrentModel?: boolean | undefined;
  /** The content changed (not when `update({ value })` set it). */
  readonly onChange?: ((value: string, event: CodeEditorChangeEvent) => void) | undefined;
  /** The markers of the current model changed (validation). */
  readonly onValidate?: ((markers: CodeEditorMarker[]) => void) | undefined;
}

export interface DiffEditorState {
  readonly original?: string | undefined;
  readonly modified?: string | undefined;
  readonly language?: string | undefined;
  readonly originalLanguage?: string | undefined;
  readonly modifiedLanguage?: string | undefined;
  readonly originalModelPath?: string | undefined;
  readonly modifiedModelPath?: string | undefined;
  readonly theme?: CodeEditorTheme | undefined;
  /** Reveals this line (1-based) of the modified text; both sides scroll together. */
  readonly line?: number | undefined;
  readonly options?: DiffEditorOptions | undefined;
}

export interface DiffEditorControllerOptions
  extends DiffEditorState,
    Lifecycle<DiffEditorInstance> {
  readonly keepCurrentOriginalModel?: boolean | undefined;
  readonly keepCurrentModifiedModel?: boolean | undefined;
}

export interface CodeEditorController {
  readonly status: CodeEditorStatus;
  /** The Monaco editor once mounted. */
  readonly editor: CodeEditorInstance | null;
  readonly monaco: Monaco | null;
  /** Current value (the initial one until mounted). */
  getValue(): string;
  /** Applies changed props: value, language, path, theme, line, options. */
  update(next: CodeEditorState): void;
  /** Disposes the editor (and its model, unless `keepCurrentModel`). */
  destroy(): void;
}

export interface DiffEditorController {
  readonly status: CodeEditorStatus;
  readonly editor: DiffEditorInstance | null;
  readonly monaco: Monaco | null;
  /** Applies changed props: original, modified, languages, model paths, theme, line, options. */
  update(next: DiffEditorState): void;
  destroy(): void;
}

/** View states per model path, kept across remounts (module scope, like models). */
const viewStates = new Map<string, MonacoApi.editor.ICodeEditorViewState | null>();

/** The model of `path`, or a new one (`path` → `Uri.parse(path)`; none → an in-memory model). */
export function getOrCreateModel(
  monaco: Monaco,
  value: string,
  language: string | undefined,
  path: string | undefined,
): MonacoApi.editor.ITextModel {
  const uri = path ? monaco.Uri.parse(path) : undefined;
  return (uri && monaco.editor.getModel(uri)) || monaco.editor.createModel(value, language, uri);
}

/** Owlky's monospace font (`--ok-font-family-mono`) unless `options.fontFamily` is given. */
const fontOf = (element: Element): { fontFamily?: string } => {
  const font = getComputedStyle(element).getPropertyValue("--ok-font-family-mono").trim();
  return font ? { fontFamily: font } : {};
};

/** Replaces the value as one undoable edit (as typing would), keeping the cursor's markers. */
function replaceValue(editor: CodeEditorInstance, monaco: Monaco, value: string) {
  const model = editor.getModel() as MonacoApi.editor.ITextModel;
  if (value === model.getValue()) return;
  if (editor.getOption(monaco.editor.EditorOption.readOnly)) {
    editor.setValue(value);
    return;
  }
  // Its own undo step: undo goes back to the value before it, not further.
  editor.pushUndoStop();
  editor.executeEdits("", [
    { range: model.getFullModelRange(), text: value, forceMoveMarkers: true },
  ]);
  editor.pushUndoStop();
}

/** The diff editor's side labels, which every `updateOptions` must repeat. */
const labelsOf = (options: DiffEditorOptions | undefined): DiffEditorOptions => ({
  ...(options?.originalAriaLabel ? { originalAriaLabel: options.originalAriaLabel } : {}),
  ...(options?.modifiedAriaLabel ? { modifiedAriaLabel: options.modifiedAriaLabel } : {}),
});

/** Shared mount: loads Monaco, runs `beforeMount`, then `create`; reports status. */
function mount<E>(
  element: HTMLElement,
  lifecycle: Lifecycle<E>,
  create: (monaco: Monaco) => E,
  setStatus: (status: CodeEditorStatus, error?: unknown) => void,
): { cancel(): void } {
  let init: CancelablePromise<Monaco> | null = loader.init();
  let canceled = false;
  init.then(
    (monaco) => {
      init = null;
      if (canceled || !element.isConnected) return;
      try {
        lifecycle.beforeMount?.(monaco);
        const editor = create(monaco);
        lifecycle.onMount?.(editor, monaco);
        setStatus("ready");
      } catch (error) {
        setStatus("error", error);
      }
    },
    (error: unknown) => {
      init = null;
      if (canceled) return;
      setStatus("error", error);
    },
  );
  return {
    cancel() {
      canceled = true;
      init?.cancel();
    },
  };
}

/** Owlky's theme follows the editor focused or mounted last (Monaco has one theme per page). */
function bindTheme(
  monaco: Monaco,
  element: HTMLElement,
  theme: () => CodeEditorTheme,
  focusable: { onDidFocusEditorWidget(listener: () => void): MonacoApi.IDisposable }[],
) {
  const client = themeClient({ element, monaco, theme });
  client.use();
  const subscriptions = focusable.map((each) => each.onDidFocusEditorWidget(() => client.use()));
  return {
    use: () => client.use(),
    dispose() {
      for (const each of subscriptions) each.dispose();
      client.release();
    },
  };
}

/**
 * Code editor — spec: specs/components/code-editor.md (ADR-0034). Mounts Monaco on `element` (the
 * `[data-ok-code-editor-content]` part) once `loader` has it, with `@monaco-editor/react`'s
 * model rules: `path` names a model (created on first use, switched with its view state),
 * `value` replaces the content as an undoable edit, `onValidate` reports the model's markers.
 * `root` is where theme tokens are read (default: the closest editor root).
 */
export function createCodeEditorController(
  element: HTMLElement,
  options: CodeEditorControllerOptions = {},
  root: Element = element.closest("[data-ok-code-editor]") ?? element,
): CodeEditorController {
  let props: CodeEditorControllerOptions = { ...options };
  let status: CodeEditorStatus = "loading";
  let editor: CodeEditorInstance | null = null;
  let monacoRef: Monaco | null = null;
  let quiet = false;
  let destroyed = false;
  const disposables: MonacoApi.IDisposable[] = [];
  let theme: ReturnType<typeof bindTheme> | null = null;
  const currentPath = () => props.path ?? props.defaultPath ?? "";

  const setStatus = (next: CodeEditorStatus, error?: unknown) => {
    status = next;
    props.onStatusChange?.(next, error);
  };

  const pending = mount<CodeEditorInstance>(
    element,
    { beforeMount: (m) => props.beforeMount?.(m), onMount: (e, m) => props.onMount?.(e, m) },
    (monaco) => {
      monacoRef = monaco;
      const path = currentPath();
      const model = getOrCreateModel(
        monaco,
        props.value ?? props.defaultValue ?? "",
        props.defaultLanguage ?? props.language,
        path,
      );
      const created = monaco.editor.create(
        element,
        { model, automaticLayout: true, ...fontOf(root), ...props.options },
        props.overrideServices,
      );
      editor = created;
      if (props.saveViewState !== false) {
        const saved = viewStates.get(path);
        if (saved) created.restoreViewState(saved);
      }
      if (props.line !== undefined) created.revealLine(props.line);
      theme = bindTheme(monaco, element, () => props.theme ?? "auto", [created]);
      disposables.push(
        created.onDidChangeModelContent((event) => {
          if (!quiet) props.onChange?.(created.getValue(), event);
        }),
        monaco.editor.onDidChangeMarkers((uris) => {
          const uri = created.getModel()?.uri;
          if (uri && uris.some((each) => each.toString() === uri.toString()))
            props.onValidate?.(monaco.editor.getModelMarkers({ resource: uri }));
        }),
      );
      return created;
    },
    setStatus,
  );

  return {
    get status() {
      return status;
    },
    get editor() {
      return editor;
    },
    get monaco() {
      return monacoRef;
    },
    getValue() {
      return editor ? editor.getValue() : (props.value ?? props.defaultValue ?? "");
    },
    update(next) {
      const previous = props;
      props = { ...props, ...next };
      const monaco = monacoRef;
      if (!editor || !monaco || destroyed) return;
      const path = currentPath();
      if ("path" in next && next.path !== previous.path) {
        const model = getOrCreateModel(
          monaco,
          props.value ?? props.defaultValue ?? "",
          props.language ?? props.defaultLanguage,
          path,
        );
        if (model !== editor.getModel()) {
          if (props.saveViewState !== false)
            viewStates.set(previous.path ?? previous.defaultPath ?? "", editor.saveViewState());
          editor.setModel(model);
          if (props.saveViewState !== false) {
            const saved = viewStates.get(path);
            if (saved) editor.restoreViewState(saved);
          }
        }
      }
      if ("value" in next && next.value !== undefined) {
        quiet = true;
        try {
          replaceValue(editor, monaco, next.value);
        } finally {
          quiet = false;
        }
      }
      // The controller only ever sets models: the editor always has one.
      if ("language" in next && next.language !== undefined)
        monaco.editor.setModelLanguage(
          editor.getModel() as MonacoApi.editor.ITextModel,
          next.language,
        );
      if ("line" in next && next.line !== undefined && next.line !== previous.line)
        editor.revealLine(next.line);
      if ("options" in next && next.options && next.options !== previous.options)
        editor.updateOptions(next.options);
      if ("theme" in next && next.theme !== previous.theme) theme?.use();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pending.cancel();
      for (const each of disposables) each.dispose();
      theme?.dispose();
      if (editor) {
        const model = editor.getModel();
        if (props.keepCurrentModel) {
          if (props.saveViewState !== false) viewStates.set(currentPath(), editor.saveViewState());
          editor.dispose();
        } else {
          editor.dispose();
          model?.dispose();
        }
      }
      editor = null;
    },
  };
}

/**
 * Diff editor — spec: specs/components/code-editor.md (ADR-0034). Mounts Monaco's diff editor on
 * `element` with an original and a modified model (named by their model paths, kept on unmount
 * with `keepCurrentOriginalModel` / `keepCurrentModifiedModel`).
 */
export function createDiffEditorController(
  element: HTMLElement,
  options: DiffEditorControllerOptions = {},
  root: Element = element.closest("[data-ok-diff-editor]") ?? element,
): DiffEditorController {
  let props: DiffEditorControllerOptions = { ...options };
  let status: CodeEditorStatus = "loading";
  let editor: DiffEditorInstance | null = null;
  let monacoRef: Monaco | null = null;
  let destroyed = false;
  let theme: ReturnType<typeof bindTheme> | null = null;
  let labels = labelsOf(props.options);

  const languageOf = (side: "original" | "modified") =>
    (side === "original" ? props.originalLanguage : props.modifiedLanguage) ??
    props.language ??
    "text";

  const setModels = (monaco: Monaco, target: DiffEditorInstance) => {
    const original = getOrCreateModel(
      monaco,
      props.original ?? "",
      languageOf("original"),
      props.originalModelPath,
    );
    const modified = getOrCreateModel(
      monaco,
      props.modified ?? "",
      languageOf("modified"),
      props.modifiedModelPath,
    );
    target.setModel({ original, modified });
  };

  const setStatus = (next: CodeEditorStatus, error?: unknown) => {
    status = next;
    props.onStatusChange?.(next, error);
  };

  const pending = mount<DiffEditorInstance>(
    element,
    { beforeMount: (m) => props.beforeMount?.(m), onMount: (e, m) => props.onMount?.(e, m) },
    (monaco) => {
      monacoRef = monaco;
      const created = monaco.editor.createDiffEditor(element, {
        automaticLayout: true,
        ...fontOf(root),
        ...props.options,
      });
      editor = created;
      setModels(monaco, created);
      // Monaco applies the side labels only through updateOptions (and drops them on the next one).
      created.updateOptions(labels);
      if (props.line !== undefined) created.revealLine(props.line);
      theme = bindTheme(monaco, element, () => props.theme ?? "auto", [
        created.getOriginalEditor(),
        created.getModifiedEditor(),
      ]);
      return created;
    },
    setStatus,
  );

  return {
    get status() {
      return status;
    },
    get editor() {
      return editor;
    },
    get monaco() {
      return monacoRef;
    },
    update(next) {
      const previous = props;
      props = { ...props, ...next };
      const monaco = monacoRef;
      if (!editor || !monaco || destroyed) return;
      if (
        ("originalModelPath" in next && next.originalModelPath !== previous.originalModelPath) ||
        ("modifiedModelPath" in next && next.modifiedModelPath !== previous.modifiedModelPath)
      )
        setModels(monaco, editor);
      if ("modified" in next && next.modified !== undefined)
        replaceValue(editor.getModifiedEditor(), monaco, next.modified);
      if ("original" in next && next.original !== undefined) {
        const model = editor.getOriginalEditor().getModel() as MonacoApi.editor.ITextModel;
        if (model.getValue() !== next.original) model.setValue(next.original);
      }
      if ("language" in next || "originalLanguage" in next || "modifiedLanguage" in next) {
        const { original, modified } = editor.getModel() as MonacoApi.editor.IDiffEditorModel;
        monaco.editor.setModelLanguage(original, languageOf("original"));
        monaco.editor.setModelLanguage(modified, languageOf("modified"));
      }
      if ("options" in next && next.options && next.options !== previous.options) {
        labels = { ...labels, ...labelsOf(next.options) };
        editor.updateOptions({ ...labels, ...next.options });
      }
      if ("line" in next && next.line !== undefined && next.line !== previous.line)
        editor.revealLine(next.line);
      if ("theme" in next && next.theme !== previous.theme) theme?.use();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pending.cancel();
      theme?.dispose();
      if (editor) {
        const models = editor.getModel();
        editor.setModel(null);
        editor.dispose();
        if (!props.keepCurrentOriginalModel) models?.original.dispose();
        if (!props.keepCurrentModifiedModel) models?.modified.dispose();
      }
      editor = null;
    },
  };
}
