import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  native,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Editor (ADR-0023) --------------------------------------------------------------------------

/** Where `autofocus` puts the caret (HTML `data-ok-autofocus`). */
export const editorFocusPositions = ["start", "end", "all"] as const;
export type EditorFocusPosition = (typeof editorFocusPositions)[number];
/** Text directions of the content (`textDirection`). */
export const editorTextDirections = ["ltr", "rtl", "auto"] as const;

export const editorOptions = defineOptions("editor", "data-ok-editor", {
  fullItem: flag(
    "data-ok-full-item",
    "Every toolbar group: adds code, code block, blockquote, horizontal rule, undo and redo.",
  ),
  error: flag(
    "data-ok-error",
    "Error state: red border and helper text, `aria-invalid` on the textbox.",
  ),
  editable: behavior(
    "data-ok-editable",
    true,
    "The content can be changed (`false`: read only, toolbar disabled).",
  ),
  tables: flag(
    "data-ok-tables",
    "Tables: the table nodes and the toolbar's table menu (insert, rows, columns, headers, merge, split, delete).",
  ),
  autofocus: style(
    "data-ok-autofocus",
    editorFocusPositions,
    "start",
    "Puts the caret in the editor once it is ready: at the `start`, the `end`, or selects `all`. React also takes `true` or a position.",
    { optional: true },
  ),
  textDirection: style(
    "data-ok-text-direction",
    editorTextDirections,
    "ltr",
    "Text direction of the content: `ltr`, `rtl` or `auto`. Default: inherited.",
    { optional: true },
  ),
  enableInputRules: behavior(
    "data-ok-enable-input-rules",
    true,
    "Markdown-like shortcuts while typing, such as `# ` for a heading (`false`: off).",
  ),
  enablePasteRules: behavior(
    "data-ok-enable-paste-rules",
    true,
    "The same shortcuts on pasted text (`false`: off).",
  ),
  enableContentCheck: flag(
    "data-ok-enable-content-check",
    "Checks content against what the editor supports: invalid content fires a content error event (initial content loads without the invalid parts; a new value is refused).",
  ),
  emitContentError: flag(
    "data-ok-emit-content-error",
    "Fires the content error event for invalid inserted content even without the check (the content is kept).",
  ),
  name: native(
    "name",
    "Form field name: a hidden input holds the HTML value, so the editor submits with its form.",
    { children: ":scope > input[data-ok-editor-input]" },
  ),
  fullscreen: state(
    "data-ok-fullscreen",
    "Fills the viewport (the toolbar's Fullscreen button, Escape leaves).",
    "fullscreen",
  ),
  value: state(
    "data-ok-editor-content",
    "The content: markup inside the content element.",
    "change",
  ),
});

export type EditorAnatomyOptions = {
  fullItem?: boolean | undefined;
  error?: boolean | undefined;
  tables?: boolean | undefined;
  autofocus?: EditorFocusPosition | undefined;
  textDirection?: (typeof editorTextDirections)[number] | undefined;
  enableContentCheck?: boolean | undefined;
  emitContentError?: boolean | undefined;
};

/** `data-ok-*` attributes of an editor root. */
export const editorAttributes = (options: EditorAnatomyOptions = {}): DataAttributes =>
  optionAttributes(editorOptions, { ...options });
