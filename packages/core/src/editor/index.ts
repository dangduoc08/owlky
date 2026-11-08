/*
 * @owlky/core/editor — the Editor's engine (ADR-0023): Tiptap, shared by React and HTML. A separate
 * entry so that `@owlky/core` and the main HTML bundle don't load ProseMirror.
 */
export type { EditorHighlighter, HighlightNode } from "./code-block.js";
export {
  createEditorController,
  type EditorActionValue,
  type EditorController,
  type EditorControllerOptions,
  type EditorState,
} from "./editor.js";
export { type EditorIconName, editorIcons } from "./icons.js";
export {
  createToolbarNavigation,
  type EditorAction,
  type EditorBlock,
  type EditorToolButton,
  editorActions,
  editorBlockLabels,
  editorToolbar,
  type HeadingLevel,
  headingLevels,
  safeEditorUrl,
} from "./toolbar.js";
