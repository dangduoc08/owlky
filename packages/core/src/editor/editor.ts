import {
  type AnyExtension,
  Editor,
  type EnableRules,
  Extension,
  type FocusPosition,
  getSchema,
} from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { DOMSerializer, type ParseOptions, DOMParser as SchemaParser } from "@tiptap/pm/model";
import type { EditorProps } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import { createCodeBlock, type EditorHighlighter } from "./code-block.js";
import { createMention, type EditorMentionOptions } from "./mention.js";
import { type EditorTextTransform, readTextTransform, TextTransform } from "./text-transform.js";
import {
  type EditorAction,
  type EditorBlock,
  type EditorTableAction,
  editorActions,
  type HeadingLevel,
  headingLevels,
  safeEditorUrl,
} from "./toolbar.js";

/** Text direction of the content (Tiptap's `textDirection`). */
export type EditorTextDirection = "ltr" | "rtl" | "auto";

/** What the toolbar shows: the current block, pressed and disabled actions, the link under the caret. */
export interface EditorState {
  readonly block: EditorBlock;
  readonly active: Readonly<Record<EditorAction, boolean>>;
  readonly disabled: Readonly<Record<EditorAction, boolean>>;
  /** `href` of the link at the selection, or `null`. */
  readonly link: string | null;
  /** Text transform at the selection, or `null`. */
  readonly textTransform: EditorTextTransform | null;
  readonly empty: boolean;
  readonly editable: boolean;
}

/** Values for actions that take one. */
export interface EditorActionValue {
  /** `heading`: 1–6. */
  readonly level?: number | undefined;
  /** `link`: the URL (checked with `safeEditorUrl`). */
  readonly href?: string | undefined;
  /** `image`: the URL (checked with `safeEditorUrl(…, "image")`) and its text alternative. */
  readonly src?: string | undefined;
  readonly alt?: string | undefined;
  /** `textTransform`: `uppercase`, `lowercase` or `capitalize`; `null` removes it. */
  readonly textTransform?: EditorTextTransform | null | undefined;
}

export interface EditorControllerOptions {
  /**
   * Initial content: an HTML string (parsed by Tiptap with the browser's `DOMParser`), or
   * omitted to read the markup already inside the content element (HTML snippets: no string
   * parsing, so Trusted Types pages need no policy).
   */
  readonly content?: string | undefined;
  /** Default `true`. */
  readonly editable?: boolean | undefined;
  /** Shown in the first empty paragraph. */
  readonly placeholder?: string | undefined;
  /** Syntax highlighting and the language menu of code blocks (lowlight fits). */
  readonly highlighter?: EditorHighlighter | undefined;
  /** The content changed (typing, an action, `setContent(…, true)`): HTML, `""` when empty. */
  readonly onChange?: ((value: string) => void) | undefined;
  /** The toolbar state may have changed (every transaction). */
  readonly onStateChange?: ((state: EditorState) => void) | undefined;
  /**
   * More Tiptap extensions, after the built-in ones; one with the name of a built-in top-level
   * extension (`image`, `codeBlock`, `textAlign`, `placeholder`…) replaces it. Extensions are
   * trusted code: what they add to the schema is theirs to sanitize.
   */
  readonly extensions?: readonly AnyExtension[] | undefined;
  /** ProseMirror props (Tiptap's `editorProps`), merged; the editor's own attributes win. */
  readonly editorProps?: EditorProps | undefined;
  /** ProseMirror parse options for content (Tiptap's `parseOptions`). */
  readonly parseOptions?: ParseOptions | undefined;
  /** Puts the caret in the editor once it exists: `start`, `end`, `all`, a position, `true` (start). */
  readonly autofocus?: FocusPosition | undefined;
  /** Text direction of the content. Default: none (inherited). */
  readonly textDirection?: EditorTextDirection | undefined;
  /** Markdown-like shortcuts while typing (`# `, `**bold**`…). Default `true`. */
  readonly enableInputRules?: EnableRules | undefined;
  /** The same rules on pasted text. Default `true`. */
  readonly enablePasteRules?: EnableRules | undefined;
  /** Tables (ADR-0050): the table nodes and the `insertTable`… actions. Default `false`. */
  readonly tables?: boolean | undefined;
  /** Mentions (ADR-0050): the mention node and its suggestion list. */
  readonly mentions?: EditorMentionOptions | undefined;
}

export interface EditorController {
  /** The Tiptap editor (escape hatch: commands, events, extensions' storage). */
  readonly editor: Editor;
  /** Current HTML, `""` when empty. */
  getValue(): string;
  getState(): EditorState;
  /** Runs a toolbar action; `false` when it can't run (invalid URL, not editable, …). */
  run(action: EditorAction, value?: EditorActionValue): boolean;
  /** Replaces the content with an HTML string; reports `onChange` only when `emit`. */
  setContent(value: string, emit?: boolean): void;
  setEditable(editable: boolean): void;
  focus(): void;
  /** Destroys the editor. `restore`: put the current content back as plain markup (HTML `stop()`). */
  destroy(options?: { restore?: boolean }): void;
}

const ALIGN = {
  alignLeft: "left",
  alignCenter: "center",
  alignRight: "right",
  alignJustify: "justify",
} as const;

/** Mod-Shift-X clears marks and turns blocks back into paragraphs (the toolbar's Clear formatting). */
const ClearFormat = Extension.create({
  name: "okClearFormat",
  addKeyboardShortcuts() {
    return { "Mod-Shift-x": () => this.editor.chain().unsetAllMarks().clearNodes().run() };
  },
});

/** Tiptap settings given in the options (only those given: Tiptap keeps its defaults). */
function settings(options: EditorControllerOptions) {
  const { autofocus, textDirection, enableInputRules, enablePasteRules, parseOptions } = options;
  return {
    ...(autofocus !== undefined ? { autofocus } : {}),
    ...(textDirection !== undefined ? { textDirection } : {}),
    ...(enableInputRules !== undefined ? { enableInputRules } : {}),
    ...(enablePasteRules !== undefined ? { enablePasteRules } : {}),
    ...(parseOptions !== undefined ? { parseOptions } : {}),
  };
}

/** The built-in set, the opt-in tables and mentions, then the owner's extensions. */
function extensions(options: EditorControllerOptions, editor: () => Editor | null): AnyExtension[] {
  const own = options.extensions ?? [];
  const names = new Set(own.map((extension) => extension.name));
  const builtIn: AnyExtension[] = [
    ...base(options),
    ...(options.tables ? [TableKit.configure({ table: { resizable: false } })] : []),
    ...(options.mentions ? [createMention(options.mentions, editor)] : []),
  ];
  return [...builtIn.filter((extension) => !names.has(extension.name)), ...own];
}

const base = (options: EditorControllerOptions) => [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [...headingLevels] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      isAllowedUri: (url, context) => context.defaultValidate(url) && safeEditorUrl(url) !== null,
    },
  }),
  createCodeBlock(options.highlighter),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Image.configure({ allowBase64: false }),
  Placeholder.configure({ placeholder: options.placeholder ?? "" }),
  TextTransform,
  ClearFormat,
];

type Commands = ReturnType<Editor["chain"]>;
/** Each table action as a Tiptap command (the same for `run()` and `can()`). */
const TABLE_COMMANDS: Record<EditorTableAction, (chain: Commands) => boolean> = {
  insertTable: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  addColumnBefore: (c) => c.addColumnBefore().run(),
  addColumnAfter: (c) => c.addColumnAfter().run(),
  deleteColumn: (c) => c.deleteColumn().run(),
  addRowBefore: (c) => c.addRowBefore().run(),
  addRowAfter: (c) => c.addRowAfter().run(),
  deleteRow: (c) => c.deleteRow().run(),
  toggleHeaderRow: (c) => c.toggleHeaderRow().run(),
  toggleHeaderColumn: (c) => c.toggleHeaderColumn().run(),
  mergeCells: (c) => c.mergeCells().run(),
  splitCell: (c) => c.splitCell().run(),
  deleteTable: (c) => c.deleteTable().run(),
};
const TABLE_ACTIONS = new Set<EditorAction>(Object.keys(TABLE_COMMANDS) as EditorTableAction[]);

/** The document holds a table. */
function hasTable(editor: Editor): boolean {
  let found = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "table") found = true;
    return !found;
  });
  return found;
}

const flags = (pick: (action: EditorAction) => boolean) =>
  Object.fromEntries(editorActions.map((action) => [action, pick(action)])) as Record<
    EditorAction,
    boolean
  >;

function readState(editor: Editor): EditorState {
  const editable = editor.isEditable;
  const level = headingLevels.find((each) => editor.isActive("heading", { level: each }));
  const block: EditorBlock =
    level !== undefined
      ? `h${level}`
      : editor.isActive("paragraph") &&
          !editor.isActive("bulletList") &&
          !editor.isActive("orderedList") &&
          !editor.isActive("blockquote")
        ? "paragraph"
        : "other";
  const can = editor.can();
  const active = flags((action) => {
    switch (action) {
      case "paragraph":
        return block === "paragraph";
      case "heading":
        return level !== undefined;
      case "alignLeft":
      case "alignCenter":
      case "alignRight":
      case "alignJustify":
        return editor.isActive({ textAlign: ALIGN[action] });
      case "bold":
      case "italic":
      case "underline":
      case "strike":
      case "bulletList":
      case "orderedList":
      case "code":
      case "codeBlock":
      case "blockquote":
        return editor.isActive(action);
      case "link":
      case "textTransform":
        return editor.isActive(action);
      default:
        return false;
    }
  });
  const tables = editor.schema.nodes["table"] !== undefined;
  const disabled = flags((action) => {
    if (!editable) return true;
    if (action === "undo") return !can.undo();
    if (action === "redo") return !can.redo();
    if (action === "unlink") return !editor.isActive("link");
    if (TABLE_ACTIONS.has(action))
      return !tables || !TABLE_COMMANDS[action as EditorTableAction](editor.can().chain());
    return false;
  });
  const href = editor.getAttributes("link")["href"];
  return {
    block,
    active,
    disabled,
    link: typeof href === "string" ? href : null,
    textTransform: readTextTransform(editor.getAttributes("textTransform")["textTransform"]),
    empty: editor.isEmpty,
    editable,
  };
}

/**
 * Editor — spec: specs/components/editor.md (ADR-0023). Mounts Tiptap on the content element
 * (`[data-ok-editor-content]`, which becomes the `contenteditable` textbox) and reports changes;
 * the owner renders the toolbar from `onStateChange` and calls `run()` from its buttons.
 */
export function createEditorController(
  element: HTMLElement,
  options: EditorControllerOptions = {},
): EditorController {
  const list = extensions(options, () => mounted);
  let content: string | Record<string, unknown> | null;
  if (options.content !== undefined) content = options.content;
  else {
    // Snippet markup: parse the DOM itself (no HTML string, no Trusted Types sink).
    content = SchemaParser.fromSchema(getSchema(list))
      .parse(element, options.parseOptions)
      .toJSON() as Record<string, unknown>;
  }
  // Attributes ProseMirror writes (and removes on destroy): destroy() puts the element's own back.
  const OWNED = ["role", "class", "contenteditable", "translate", "aria-readonly"];
  const before = new Map(OWNED.map((name) => [name, element.getAttribute(name)]));
  element.replaceChildren();

  const ownProps = options.editorProps;
  let destroyed = false;
  let mounted: Editor | null = null;
  const editor: Editor = new Editor({
    element: { mount: element },
    extensions: list,
    content,
    editable: options.editable !== false,
    // Tiptap's own CSS is a <style> written with innerHTML (CSP / Trusted Types): editor.css has it.
    injectCSS: false,
    ...settings(options),
    editorProps: {
      ...ownProps,
      attributes: (state): Record<string, string> => ({
        ...(typeof ownProps?.attributes === "function"
          ? ownProps.attributes(state)
          : ownProps?.attributes),
        ...((mounted ? !mounted.isEditable : options.editable === false)
          ? { "aria-readonly": "true" }
          : {}),
      }),
    },
    onUpdate: () => options.onChange?.(controller.getValue()),
    onTransaction: () => {
      if (mounted) options.onStateChange?.(readState(mounted));
    },
  });
  mounted = editor;

  const controller: EditorController = {
    editor,
    // Tiptap counts a table of empty cells as empty: it is content.
    getValue: () => (editor.isEmpty && !hasTable(editor) ? "" : editor.getHTML()),
    getState: () => readState(editor),
    run(action, value = {}) {
      if (destroyed || !editor.isEditable) return false;
      // Built per action, only once it runs: chained commands execute at once, and `focus()`
      // schedules a frame that moves focus into the editor (a refused image or link would
      // otherwise pull focus out of the form the user is still typing in).
      const chain = () => editor.chain().focus();
      switch (action) {
        case "paragraph":
          return chain().setParagraph().run();
        case "heading": {
          const level = headingLevels.find((each) => each === value.level);
          return (
            level !== undefined &&
            chain()
              .setHeading({ level: level as HeadingLevel })
              .run()
          );
        }
        case "bold":
          return chain().toggleBold().run();
        case "italic":
          return chain().toggleItalic().run();
        case "underline":
          return chain().toggleUnderline().run();
        case "strike":
          return chain().toggleStrike().run();
        case "bulletList":
          return chain().toggleBulletList().run();
        case "orderedList":
          return chain().toggleOrderedList().run();
        case "alignLeft":
        case "alignCenter":
        case "alignRight":
        case "alignJustify":
          return editor.isActive({ textAlign: ALIGN[action] })
            ? chain().unsetTextAlign().run()
            : chain().setTextAlign(ALIGN[action]).run();
        case "code":
          return chain().toggleCode().run();
        case "codeBlock":
          return chain().toggleCodeBlock().run();
        case "blockquote":
          return chain().toggleBlockquote().run();
        case "horizontalRule":
          return chain().setHorizontalRule().run();
        case "link": {
          const href = safeEditorUrl(value.href ?? "");
          if (href === null) return false;
          if (editor.state.selection.empty && !editor.isActive("link"))
            return chain()
              .insertContent({
                type: "text",
                text: href,
                marks: [{ type: "link", attrs: { href } }],
              })
              .run();
          return chain().extendMarkRange("link").setLink({ href }).run();
        }
        case "unlink":
          return chain().extendMarkRange("link").unsetLink().run();
        case "image": {
          const src = safeEditorUrl(value.src ?? "", "image");
          if (src === null) return false;
          return chain()
            .setImage({ src, alt: (value.alt ?? "").trim() })
            .run();
        }
        case "hardBreak":
          return chain().setHardBreak().run();
        case "clearFormat":
          return chain().unsetAllMarks().clearNodes().run();
        case "undo":
          return chain().undo().run();
        case "redo":
          return chain().redo().run();
        case "insertTable":
        case "addColumnBefore":
        case "addColumnAfter":
        case "deleteColumn":
        case "addRowBefore":
        case "addRowAfter":
        case "deleteRow":
        case "toggleHeaderRow":
        case "toggleHeaderColumn":
        case "mergeCells":
        case "splitCell":
        case "deleteTable":
          // Checked first: a chain that won't run would still move the focus (see above).
          return (
            editor.schema.nodes["table"] !== undefined &&
            TABLE_COMMANDS[action](editor.can().chain()) &&
            TABLE_COMMANDS[action](chain())
          );
        case "textTransform": {
          if (value.textTransform === null) return chain().unsetMark("textTransform").run();
          const textTransform = readTextTransform(value.textTransform);
          return (
            textTransform !== null && chain().setMark("textTransform", { textTransform }).run()
          );
        }
        default:
          return false;
      }
    },
    setContent(value, emit = false) {
      if (destroyed) return;
      editor.commands.setContent(value, { emitUpdate: emit });
    },
    setEditable(editable) {
      if (destroyed || editor.isEditable === editable) return;
      editor.setEditable(editable, false);
      options.onStateChange?.(readState(editor));
    },
    focus() {
      if (!destroyed) editor.commands.focus();
    },
    destroy({ restore = false } = {}) {
      if (destroyed) return;
      destroyed = true;
      const fragment = restore
        ? DOMSerializer.fromSchema(editor.schema).serializeFragment(editor.state.doc.content)
        : null;
      editor.destroy();
      for (const [name, value] of before) {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      }
      element.replaceChildren(...(fragment ? [fragment] : []));
    },
  };
  return controller;
}
