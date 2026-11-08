/*
 * Editor toolbar: the actions, their labels and shortcuts (React and HTML render the same
 * buttons from this table), URL checks for links and images, and roving focus (WAI-ARIA toolbar).
 */

/** Formatting actions a toolbar button (or menu item) runs. */
export const editorActions = [
  "paragraph",
  "heading",
  "bold",
  "italic",
  "underline",
  "strike",
  "bulletList",
  "orderedList",
  "alignLeft",
  "alignCenter",
  "alignRight",
  "alignJustify",
  "code",
  "codeBlock",
  "blockquote",
  "horizontalRule",
  "link",
  "unlink",
  "image",
  "hardBreak",
  "clearFormat",
  "undo",
  "redo",
] as const;
export type EditorAction = (typeof editorActions)[number];

export const headingLevels = [1, 2, 3, 4, 5, 6] as const;
export type HeadingLevel = (typeof headingLevels)[number];

/** The block type the heading menu shows: `paragraph`, `h1` … `h6`, or `other` (list, quote…). */
export type EditorBlock = "paragraph" | `h${HeadingLevel}` | "other";

export interface EditorToolButton {
  /** `data-ok-editor-action` value. */
  readonly action: Exclude<EditorAction, "paragraph" | "heading"> | "fullscreen";
  /** Accessible name (`aria-label`). */
  readonly label: string;
  /** `aria-keyshortcuts` (Tiptap's default keys), when the action has one. */
  readonly keys?: string;
  /** Toggles a mark or block on and off: rendered with `aria-pressed`. */
  readonly toggle?: boolean;
  /** Opens a popover (link, image) instead of running at once. */
  readonly popover?: boolean;
}

/** Toolbar groups after the heading menu, in order; `full` groups only show with `fullItem`. */
export const editorToolbar: readonly {
  readonly full?: boolean;
  readonly buttons: readonly EditorToolButton[];
}[] = [
  {
    buttons: [
      { action: "bold", label: "Bold", keys: "Control+B Meta+B", toggle: true },
      { action: "italic", label: "Italic", keys: "Control+I Meta+I", toggle: true },
      { action: "underline", label: "Underline", keys: "Control+U Meta+U", toggle: true },
      {
        action: "strike",
        label: "Strikethrough",
        keys: "Control+Shift+S Meta+Shift+S",
        toggle: true,
      },
    ],
  },
  {
    buttons: [
      {
        action: "bulletList",
        label: "Bullet list",
        keys: "Control+Shift+8 Meta+Shift+8",
        toggle: true,
      },
      {
        action: "orderedList",
        label: "Ordered list",
        keys: "Control+Shift+7 Meta+Shift+7",
        toggle: true,
      },
    ],
  },
  {
    buttons: [
      {
        action: "alignLeft",
        label: "Align left",
        keys: "Control+Shift+L Meta+Shift+L",
        toggle: true,
      },
      {
        action: "alignCenter",
        label: "Align center",
        keys: "Control+Shift+E Meta+Shift+E",
        toggle: true,
      },
      {
        action: "alignRight",
        label: "Align right",
        keys: "Control+Shift+R Meta+Shift+R",
        toggle: true,
      },
      {
        action: "alignJustify",
        label: "Justify",
        keys: "Control+Shift+J Meta+Shift+J",
        toggle: true,
      },
    ],
  },
  {
    full: true,
    buttons: [
      { action: "code", label: "Code", keys: "Control+E Meta+E", toggle: true },
      { action: "codeBlock", label: "Code block", keys: "Control+Alt+C Meta+Alt+C", toggle: true },
    ],
  },
  {
    full: true,
    buttons: [
      {
        action: "blockquote",
        label: "Blockquote",
        keys: "Control+Shift+B Meta+Shift+B",
        toggle: true,
      },
      { action: "horizontalRule", label: "Horizontal rule" },
    ],
  },
  {
    buttons: [
      { action: "link", label: "Insert link", popover: true },
      { action: "unlink", label: "Remove link" },
      { action: "image", label: "Insert image", popover: true },
    ],
  },
  {
    buttons: [
      { action: "hardBreak", label: "Line break", keys: "Shift+Enter" },
      { action: "clearFormat", label: "Clear formatting", keys: "Control+Shift+X Meta+Shift+X" },
    ],
  },
  {
    full: true,
    buttons: [
      { action: "undo", label: "Undo", keys: "Control+Z Meta+Z" },
      { action: "redo", label: "Redo", keys: "Control+Shift+Z Meta+Shift+Z" },
    ],
  },
  { buttons: [{ action: "fullscreen", label: "Fullscreen", toggle: true }] },
];

/** Labels of the heading menu, by block. */
export const editorBlockLabels: Readonly<Record<Exclude<EditorBlock, "other">, string>> = {
  paragraph: "Paragraph",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
};

const SAFE_PROTOCOL = /^(?:https?:|mailto:|tel:)/i;
// A scheme without dots: `host.example:8080` is a host and port.
const ANY_SCHEME = /^[a-z][a-z\d+-]*:/i;

/**
 * A URL the editor may write into `href` / `src`, trimmed, or `null`: `http(s)`, `mailto` and
 * `tel` links, and relative URLs (`/a`, `./a`, `#a`, `?a`). `javascript:`, `data:` and other
 * schemes are refused; a bare host (`example.com`) gets `https://`. Images allow `http(s)` and
 * relative URLs only.
 */
export function safeEditorUrl(input: string, kind: "link" | "image" = "link"): string | null {
  // Browsers drop tabs and newlines inside URLs (`java\nscript:`): remove them before checking.
  const url = input.replace(/[\t\n\r]/g, "").trim();
  if (url === "" || url.length > 2048 || /[\s<>"`]/.test(url)) return null;
  if (/^(?:\/|\.\.?\/|#|\?)/.test(url)) return url.startsWith("//") ? null : url;
  if (ANY_SCHEME.test(url)) {
    if (!SAFE_PROTOCOL.test(url)) return null;
    return kind === "image" && !/^https?:/i.test(url) ? null : url;
  }
  // `example.com/path`: a host without a scheme.
  return /^[\w-]+(?:\.[\w-]+)+(?:[/:?#]|$)/.test(url) ? `https://${url}` : null;
}

/**
 * Roving focus for `[role=toolbar]` (WAI-ARIA toolbar pattern): one tab stop; ArrowLeft /
 * ArrowRight move between enabled controls (wrapping), Home / End go to the ends. The control
 * that had focus keeps `tabindex=0`. Controls are found on every key press, so groups shown or
 * hidden later (`fullItem`) need no setup; call `sync()` after the owner re-renders.
 */
export function createToolbarNavigation(toolbar: HTMLElement): {
  sync(): void;
  destroy(): void;
} {
  const items = () =>
    [...toolbar.querySelectorAll<HTMLElement>("button, [data-ok-editor-tool]")].filter(
      (item) =>
        !(item as HTMLButtonElement).disabled &&
        item.getClientRects().length > 0 &&
        item.closest("[popover], [data-ok-popover]") === null,
    );
  const all = () =>
    [...toolbar.querySelectorAll<HTMLElement>("button, [data-ok-editor-tool]")].filter(
      (item) => item.closest("[popover], [data-ok-popover]") === null,
    );
  let current: HTMLElement | null = null;

  const setCurrent = (item: HTMLElement | null) => {
    current = item;
    for (const other of all()) other.tabIndex = other === item ? 0 : -1;
  };

  const sync = () => {
    const enabled = items();
    setCurrent(current && enabled.includes(current) ? current : (enabled[0] ?? null));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const enabled = items();
    const index = enabled.indexOf(event.target as HTMLElement);
    if (index < 0) return;
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % enabled.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    else return;
    event.preventDefault();
    const target = enabled[next] as HTMLElement;
    setCurrent(target);
    target.focus();
  };
  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (items().includes(target)) setCurrent(target);
  };

  toolbar.addEventListener("keydown", onKeyDown);
  toolbar.addEventListener("focusin", onFocusIn);
  sync();
  return {
    sync,
    destroy() {
      toolbar.removeEventListener("keydown", onKeyDown);
      toolbar.removeEventListener("focusin", onFocusIn);
    },
  };
}
