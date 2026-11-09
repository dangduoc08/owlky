/*
 * @owlky/core/code-editor — the Code editor's engine (ADR-0034): Monaco, shared by React and HTML.
 * A separate entry so that `@owlky/core` and the main HTML bundle never load Monaco.
 */
export {
  type CodeEditorChangeEvent,
  type CodeEditorController,
  type CodeEditorControllerOptions,
  type CodeEditorInstance,
  type CodeEditorMarker,
  type CodeEditorOptions,
  type CodeEditorOverrideServices,
  type CodeEditorState,
  type CodeEditorStatus,
  createCodeEditorController,
  createDiffEditorController,
  type DiffEditorController,
  type DiffEditorControllerOptions,
  type DiffEditorInstance,
  type DiffEditorOptions,
  type DiffEditorState,
  getOrCreateModel,
} from "./controller.js";
export {
  type CancelablePromise,
  type CancelationError,
  type CodeEditorLocale,
  type CodeEditorWorker,
  codeEditorLocales,
  type LoaderConfig,
  loader,
  type Monaco,
  workerFile,
} from "./loader.js";
export {
  applyTheme,
  type CodeEditorScheme,
  type CodeEditorTheme,
  OWLKY_THEMES,
  owlkyTheme,
  schemeOf,
  toHex,
} from "./theme.js";
