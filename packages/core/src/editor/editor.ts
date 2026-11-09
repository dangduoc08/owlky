import { Editor, Extension, getSchema } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { DOMSerializer, DOMParser as SchemaParser } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { createCodeBlock, type EditorHighlighter } from "./code-block.js";
import { type EditorTextTransform, readTextTransform, TextTransform } from "./text-transform.js";
import {
  type EditorAction,
  type EditorBlock,
  editorActions,
  type HeadingLevel,
  headingLevels,
  safeEditorUrl,
} from "./toolbar.js";

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

const extensions = (options: EditorControllerOptions) => [
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
  const disabled = flags((action) => {
    if (!editable) return true;
    if (action === "undo") return !can.undo();
    if (action === "redo") return !can.redo();
    if (action === "unlink") return !editor.isActive("link");
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
  const list = extensions(options);
  let content: string | Record<string, unknown> | null;
  if (options.content !== undefined) content = options.content;
  else {
    // Snippet markup: parse the DOM itself (no HTML string, no Trusted Types sink).
    content = SchemaParser.fromSchema(getSchema(list)).parse(element).toJSON() as Record<
      string,
      unknown
    >;
  }
  // Attributes ProseMirror writes (and removes on destroy): destroy() puts the element's own back.
  const OWNED = ["role", "class", "contenteditable", "translate", "aria-readonly"];
  const before = new Map(OWNED.map((name) => [name, element.getAttribute(name)]));
  element.replaceChildren();

  let destroyed = false;
  let mounted: Editor | null = null;
  const editor: Editor = new Editor({
    element: { mount: element },
    extensions: list,
    content,
    editable: options.editable !== false,
    // Tiptap's own CSS is a <style> written with innerHTML (CSP / Trusted Types): editor.css has it.
    injectCSS: false,
    editorProps: {
      attributes: (): Record<string, string> =>
        (mounted ? !mounted.isEditable : options.editable === false)
          ? { "aria-readonly": "true" }
          : {},
    },
    onUpdate: () => options.onChange?.(controller.getValue()),
    onTransaction: () => {
      if (mounted) options.onStateChange?.(readState(mounted));
    },
  });
  mounted = editor;

  const controller: EditorController = {
    editor,
    getValue: () => (editor.isEmpty ? "" : editor.getHTML()),
    getState: () => readState(editor),
    run(action, value = {}) {
      if (destroyed || !editor.isEditable) return false;
      const chain = editor.chain().focus();
      switch (action) {
        case "paragraph":
          return chain.setParagraph().run();
        case "heading": {
          const level = headingLevels.find((each) => each === value.level);
          return level !== undefined && chain.setHeading({ level: level as HeadingLevel }).run();
        }
        case "bold":
          return chain.toggleBold().run();
        case "italic":
          return chain.toggleItalic().run();
        case "underline":
          return chain.toggleUnderline().run();
        case "strike":
          return chain.toggleStrike().run();
        case "bulletList":
          return chain.toggleBulletList().run();
        case "orderedList":
          return chain.toggleOrderedList().run();
        case "alignLeft":
        case "alignCenter":
        case "alignRight":
        case "alignJustify":
          return editor.isActive({ textAlign: ALIGN[action] })
            ? chain.unsetTextAlign().run()
            : chain.setTextAlign(ALIGN[action]).run();
        case "code":
          return chain.toggleCode().run();
        case "codeBlock":
          return chain.toggleCodeBlock().run();
        case "blockquote":
          return chain.toggleBlockquote().run();
        case "horizontalRule":
          return chain.setHorizontalRule().run();
        case "link": {
          const href = safeEditorUrl(value.href ?? "");
          if (href === null) return false;
          if (editor.state.selection.empty && !editor.isActive("link"))
            return chain
              .insertContent({
                type: "text",
                text: href,
                marks: [{ type: "link", attrs: { href } }],
              })
              .run();
          return chain.extendMarkRange("link").setLink({ href }).run();
        }
        case "unlink":
          return chain.extendMarkRange("link").unsetLink().run();
        case "image": {
          const src = safeEditorUrl(value.src ?? "", "image");
          if (src === null) return false;
          return chain.setImage({ src, alt: (value.alt ?? "").trim() }).run();
        }
        case "hardBreak":
          return chain.setHardBreak().run();
        case "clearFormat":
          return chain.unsetAllMarks().clearNodes().run();
        case "undo":
          return chain.undo().run();
        case "redo":
          return chain.redo().run();
        case "textTransform": {
          if (value.textTransform === null) return chain.unsetMark("textTransform").run();
          const textTransform = readTextTransform(value.textTransform);
          return textTransform !== null && chain.setMark("textTransform", { textTransform }).run();
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
