/*
 * @owlky/core/editor — the Editor's engine (ADR-0023): Tiptap, shared by React and HTML. A separate
 * entry so that `@owlky/core` and the main HTML bundle don't load ProseMirror.
 */

/**
 * A Tiptap extension (`extensions` option), the Tiptap editor (`controller.editor`, React
 * `editorRef`) and its JSON content.
 */
export type {
  AnyExtension as EditorExtension,
  Editor as TiptapEditor,
  JSONContent as EditorJSONContent,
} from "@tiptap/core";
export {
  createEditorBubbleMenu,
  defaultBubbleMenuShow,
  type EditorBubbleMenu,
  type EditorBubbleMenuOptions,
  type EditorBubbleMenuShowProps,
  editorToolbarShortcut,
} from "./bubble-menu.js";
export type { EditorHighlighter, HighlightNode } from "./code-block.js";
export {
  createEditorController,
  type EditorActionValue,
  type EditorController,
  type EditorControllerOptions,
  type EditorEventName,
  type EditorEventProps,
  type EditorState,
  type EditorTextDirection,
  editorEventNames,
} from "./editor.js";
export { holdEditorFullscreen } from "./fullscreen.js";
export { type EditorIconName, editorIcons } from "./icons.js";
export type { EditorMentionItem, EditorMentionOptions } from "./mention.js";
export {
  type EditorTextTransform,
  editorTextTransforms,
  readTextTransform,
  TextTransform,
} from "./text-transform.js";
export {
  createToolbarNavigation,
  type EditorAction,
  type EditorBlock,
  type EditorTableAction,
  type EditorToolButton,
  editorActions,
  editorBlockLabels,
  editorBubbleMenuActions,
  editorTableActions,
  editorToolButton,
  editorToolbar,
  type HeadingLevel,
  headingLevels,
  safeEditorUrl,
} from "./toolbar.js";
