"use client";

import { editorAttributes } from "@owlky/core";
import {
  createEditorBubbleMenu,
  createEditorController,
  createToolbarNavigation,
  type EditorAction,
  type EditorBlock,
  type EditorBubbleMenu,
  type EditorBubbleMenuOptions,
  type EditorController,
  type EditorControllerOptions,
  type EditorEventName,
  type EditorEventProps,
  type EditorHighlighter,
  type EditorIconName,
  type EditorMentionOptions,
  type EditorState,
  type EditorTextDirection,
  type EditorToolButton,
  editorBlockLabels,
  editorBubbleMenuActions,
  editorIcons,
  editorTableActions,
  editorToolButton,
  editorToolbar,
  editorToolbarShortcut,
  holdEditorFullscreen,
  safeEditorUrl,
  type TiptapEditor,
} from "@owlky/core/editor";
import {
  type FormEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Backdrop } from "../backdrop/backdrop.js";
import { Button } from "../button/button.js";
import { Menu, MenuItem } from "../menu/menu.js";
import { Popover } from "../popover/popover.js";
import { TextField } from "../text-field/text-field.js";
import { setRef, useMergedRefs } from "../utils/refs.js";

export type {
  EditorEventName,
  EditorEventProps,
  EditorHighlighter,
  EditorMentionItem,
  TiptapEditor,
} from "@owlky/core/editor";

export interface EditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "placeholder"> {
  /** Controlled content (HTML). `""` is empty. */
  value?: string | undefined;
  /** Initial content (HTML) when uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the new HTML (`""` when empty) after every change. */
  onChange?: ((value: string) => void) | undefined;
  /** Default `true`. `false`: read only, the toolbar is disabled. */
  editable?: boolean | undefined;
  /** Every toolbar group (code, code block, blockquote, horizontal rule, undo, redo). */
  fullItem?: boolean | undefined;
  /** Error state: red border and helper text, `aria-invalid` on the textbox. */
  error?: boolean | undefined;
  /** Text under the editor; describes the textbox. */
  helperText?: ReactNode;
  /** Shown while the editor is empty. Default "Write something awesome...". */
  placeholder?: string | undefined;
  /** Syntax highlighting and the language menu of code blocks (for example lowlight). */
  highlighter?: EditorHighlighter | undefined;
  /** Called when the Fullscreen button or Escape changes fullscreen mode. */
  onFullscreenChange?: ((fullscreen: boolean) => void) | undefined;
  /** Accessible name of the textbox. Default "Editor" when no `aria-labelledby` is given. */
  "aria-label"?: string | undefined;
  /** Labels the textbox with another element. */
  "aria-labelledby"?: string | undefined;
  /**
   * Form field name: a hidden input holds the HTML value (`""` when empty), so the editor
   * submits with its form.
   */
  name?: string | undefined;
  /** Tables: the table nodes and a table menu in the toolbar. Default `false`. */
  tables?: boolean | undefined;
  /**
   * Mentions: typing `char` (default `@`) opens a list of `items(query)` (may be async); the
   * chosen item becomes `<span data-type="mention" data-id data-label>`. Read when the editor is
   * created.
   */
  mentions?: EditorMentionProps | undefined;
  /** A toolbar over selected text (`true`: bold, italic, underline, strikethrough, code, link). */
  bubbleMenu?: boolean | EditorBubbleMenuProps | undefined;
  /**
   * More Tiptap extensions, after the built-in ones (one with a built-in's name replaces it).
   * Read when the editor is created: change the component's `key` to use new ones.
   */
  extensions?: EditorControllerOptions["extensions"];
  /** ProseMirror props (Tiptap's `editorProps`), merged with the editor's own. Read at creation. */
  editorProps?: EditorControllerOptions["editorProps"];
  /** ProseMirror parse options for the content (Tiptap's `parseOptions`). Read at creation. */
  parseOptions?: EditorControllerOptions["parseOptions"];
  /** Puts the caret in the editor once it is ready: `"start"`, `"end"`, `"all"`, `true` or a position. */
  autofocus?: EditorControllerOptions["autofocus"];
  /** Text direction of the content: `"ltr"`, `"rtl"` or `"auto"`. Default: inherited. */
  textDirection?: EditorTextDirection | undefined;
  /** Markdown-like shortcuts while typing, such as `# ` for a heading. Default `true`. */
  enableInputRules?: EditorControllerOptions["enableInputRules"];
  /** The same shortcuts on pasted text. Default `true`. */
  enablePasteRules?: EditorControllerOptions["enablePasteRules"];
  /**
   * Checks content against what the editor supports: invalid content calls `onContentError`.
   * The initial content loads without its invalid parts; a new invalid `value` is refused. Read at creation.
   */
  enableContentCheck?: boolean | undefined;
  /** Calls `onContentError` for invalid inserted content even without the check (the content is kept). Read at creation. */
  emitContentError?: boolean | undefined;
  /**
   * Receives the Tiptap editor once it exists, and `null` when it is destroyed: its commands,
   * `getJSON()`, `getText()`, `isEmpty`, `isFocused`, `on()` and `setOptions()`.
   */
  editorRef?: Ref<TiptapEditor | null> | undefined;
  /** Tiptap's `beforeCreate`: the editor is being built. */
  onBeforeCreate?: EditorEventHandler<"beforeCreate">;
  /** Tiptap's `create`: the editor is ready. */
  onCreate?: EditorEventHandler<"create">;
  /** Tiptap's `focus`: the focus entered the text (the root's `onFocus` hears every part). */
  onEditorFocus?: EditorEventHandler<"focus">;
  /** Tiptap's `blur`: the focus left the text. */
  onEditorBlur?: EditorEventHandler<"blur">;
  /** Tiptap's `selectionUpdate`: the selection moved. */
  onSelectionUpdate?: EditorEventHandler<"selectionUpdate">;
  /** Tiptap's `transaction`: any change of the editor's state. */
  onTransaction?: EditorEventHandler<"transaction">;
  /** Tiptap's `paste`: content was pasted into the text, with its ProseMirror `slice`. */
  onEditorPaste?: EditorEventHandler<"paste">;
  /** Tiptap's `drop`: content was dropped into the text (`moved` when dragged from the editor). */
  onEditorDrop?: EditorEventHandler<"drop">;
  /** Tiptap's `delete`: a node or a mark was removed. */
  onDelete?: EditorEventHandler<"delete">;
  /** Tiptap's `contentError`: content didn't fit the editor's schema (see `enableContentCheck`). */
  onContentError?: EditorEventHandler<"contentError">;
  /** Tiptap's `destroy`: the editor was destroyed (unmount, or a new editor for new settings). */
  onDestroy?: EditorEventHandler<"destroy">;
}

/** A handler of a Tiptap event: its props, as `@tiptap/react` gives them. */
export type EditorEventHandler<K extends EditorEventName> =
  | ((props: EditorEventProps[K]) => void)
  | undefined;

/** Each Tiptap event's React prop. */
const EVENT_PROPS = {
  beforeCreate: "onBeforeCreate",
  create: "onCreate",
  focus: "onEditorFocus",
  blur: "onEditorBlur",
  selectionUpdate: "onSelectionUpdate",
  transaction: "onTransaction",
  paste: "onEditorPaste",
  drop: "onEditorDrop",
  delete: "onDelete",
  contentError: "onContentError",
  destroy: "onDestroy",
} as const satisfies Record<EditorEventName, keyof EditorProps>;
type EventHandlers = Pick<EditorProps, (typeof EVENT_PROPS)[EditorEventName]>;

export interface EditorMentionProps {
  /** The character that opens the list. Default `"@"`. */
  char?: string | undefined;
  /** The items for the text typed after `char`; may return a promise. */
  items: EditorMentionOptions["items"];
  /** The query may hold spaces. Default `false`. */
  allowSpaces?: boolean | undefined;
  /** Accessible name of the list. Default "Suggestions". */
  label?: string | undefined;
}

/** The bubble menu's settings (`placement`, `updateDelay` and `shouldShow` are read when it is created). */
export interface EditorBubbleMenuProps {
  /** The buttons, as toolbar actions. Default: bold, italic, underline, strikethrough, code, link. */
  actions?: readonly EditorToolButton["action"][] | undefined;
  /** Side of the selection. Default `"top"`. */
  placement?: EditorBubbleMenuOptions["placement"];
  /** Waits this long after the selection stops changing (ms). Default 250. */
  updateDelay?: number | undefined;
  /** When the menu shows. Default: some text is selected in an editable editor with focus. */
  shouldShow?: EditorBubbleMenuOptions["shouldShow"];
  /** Accessible name of the menu. Default "Text formatting". */
  label?: string | undefined;
}

const BLOCKS = Object.keys(editorBlockLabels) as Exclude<EditorBlock, "other">[];

const INITIAL: EditorState = {
  block: "paragraph",
  active: {} as EditorState["active"],
  disabled: { undo: true, redo: true, unlink: true } as EditorState["disabled"],
  link: null,
  textTransform: null,
  empty: true,
  editable: true,
};

function Icon({ name, part }: { name: EditorIconName; part?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-ok-editor-icon={part}
    >
      <path d={editorIcons[name]} />
    </svg>
  );
}

/**
 * Editor — spec: specs/components/editor.md (ADR-0023). A rich text editor built on Tiptap, through
 * the core editor controller shared with the HTML runtime: a toolbar (heading menu, marks, lists,
 * alignment, code, quote, link, image, undo, fullscreen) over a `contenteditable` textbox.
 */
export const Editor = forwardRef<HTMLDivElement, EditorProps>(function Editor(
  {
    value,
    defaultValue,
    onChange,
    editable = true,
    fullItem,
    error,
    helperText,
    placeholder = "Write something awesome...",
    highlighter,
    onFullscreenChange,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    name,
    tables = false,
    mentions,
    bubbleMenu,
    extensions,
    editorProps,
    parseOptions,
    autofocus,
    textDirection,
    enableInputRules,
    enablePasteRules,
    enableContentCheck,
    emitContentError,
    editorRef,
    onBeforeCreate,
    onCreate,
    onEditorFocus,
    onEditorBlur,
    onSelectionUpdate,
    onTransaction,
    onEditorPaste,
    onEditorDrop,
    onDelete,
    onContentError,
    onDestroy,
    id,
    onKeyDown,
    ...props
  },
  ref,
) {
  // The latest handlers and ref, without a new editor when they change.
  const handlersRef = useRef<EventHandlers>({});
  handlersRef.current = {
    onBeforeCreate,
    onCreate,
    onEditorFocus,
    onEditorBlur,
    onSelectionUpdate,
    onTransaction,
    onEditorPaste,
    onEditorDrop,
    onDelete,
    onContentError,
    onDestroy,
  };
  const editorRefRef = useRef(editorRef);
  editorRefRef.current = editorRef;
  const reactId = useId();
  // Every part id derives from `id` when one is given (readable snippets), else from useId.
  const base = id ? `${id}-` : reactId;
  const ids = {
    content: `${base}content`,
    helper: `${base}helper`,
    heading: `${base}heading`,
    menu: `${base}menu`,
    link: `${base}link`,
    linkTitle: `${base}link-title`,
    image: `${base}image`,
    imageTitle: `${base}image-title`,
    table: `${base}table`,
    tableMenu: `${base}table-menu`,
    bubble: `${base}bubble`,
    mentions: `${base}mentions`,
  };
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rootRefs = useMergedRefs(ref, rootRef);
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EditorController | null>(null);
  const navigationRef = useRef<ReturnType<typeof createToolbarNavigation> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value ?? defaultValue ?? "");
  valueRef.current = value ?? valueRef.current;
  // Values the editor reported (controlled only, oldest first) that the owner may still echo back
  // while the user types on. Capped: an owner that ignores changes never echoes them.
  const emittedRef = useRef<string[]>([]);
  // The string the content was last loaded from (until the next edit): Tiptap normalizes markup
  // (`style="a: b"` → `style="a: b;"`), so comparing it with getValue() would reload the content
  // at mount, moving the selection and adding the trailing paragraph.
  const loadedRef = useRef<string | null>(null);
  const controlledRef = useRef(value !== undefined);
  controlledRef.current = value !== undefined;
  const editableRef = useRef(editable);
  editableRef.current = editable;
  // Read when the editor is created (Tiptap's `useEditor` without dependencies).
  const setupRef = useRef({
    extensions,
    editorProps,
    parseOptions,
    autofocus,
    textDirection,
    enableInputRules,
    enablePasteRules,
    enableContentCheck,
    emitContentError,
  });
  const mentionsRef = useRef(mentions);
  mentionsRef.current = mentions;
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const mentionsListRef = useRef<HTMLDivElement>(null);
  const bubbleMenuRef = useRef<EditorBubbleMenu | null>(null);
  const bubble = bubbleMenu === true ? {} : bubbleMenu || null;
  const bubbleOptions = useRef(bubble);
  bubbleOptions.current = bubble;
  const hasMentions = mentions !== undefined;
  const mentionChar = mentions?.char;
  const mentionSpaces = mentions?.allowSpaces;

  const [state, setState] = useState<EditorState>(INITIAL);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [tableAnchor, setTableAnchor] = useState<HTMLElement | null>(null);
  const [form, setForm] = useState<{ kind: "link" | "image"; anchor: HTMLElement } | null>(null);
  const [href, setHref] = useState("");
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => {
    loadedRef.current = valueRef.current;
    const setup = setupRef.current;
    const controller = createEditorController(contentRef.current as HTMLDivElement, {
      content: valueRef.current,
      editable: editableRef.current,
      placeholder,
      highlighter,
      tables,
      ...(hasMentions
        ? {
            mentions: {
              char: mentionChar,
              allowSpaces: mentionSpaces,
              items: (query: string) => (mentionsRef.current as EditorMentionProps).items(query),
              list: () => mentionsListRef.current,
            },
          }
        : {}),
      ...setup,
      onEvent: (event, props) => {
        const handler = handlersRef.current[EVENT_PROPS[event]] as
          | ((value: typeof props) => void)
          | undefined;
        handler?.(props);
      },
      onChange: (next) => {
        valueRef.current = next;
        loadedRef.current = null;
        if (inputRef.current) inputRef.current.value = next;
        if (controlledRef.current) emittedRef.current = [...emittedRef.current, next].slice(-50);
        onChangeRef.current?.(next);
      },
      onStateChange: setState,
    });
    controllerRef.current = controller;
    const handle = editorRefRef.current;
    setRef(handle, controller.editor);
    if (inputRef.current) inputRef.current.value = controller.getValue();
    setState(controller.getState());
    return () => {
      controller.destroy();
      controllerRef.current = null;
      setRef(handle, null);
    };
  }, [placeholder, highlighter, tables, hasMentions, mentionChar, mentionSpaces]);

  // The bubble menu follows the selection (a new one with each editor).
  const hasBubble = bubble !== null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new editor (state.editable flips at creation) gets a new menu.
  useEffect(() => {
    const controller = controllerRef.current;
    if (!hasBubble || !controller || !bubbleRef.current) return;
    // Read when the menu is created, like the editor's own settings.
    const { placement, updateDelay, shouldShow } = bubbleOptions.current as EditorBubbleMenuProps;
    const menu = createEditorBubbleMenu(controller.editor, bubbleRef.current, {
      placement,
      updateDelay,
      shouldShow,
    });
    bubbleMenuRef.current = menu;
    return () => {
      menu.destroy();
      bubbleMenuRef.current = null;
    };
  }, [hasBubble, placeholder, highlighter, tables, hasMentions, mentionChar, mentionSpaces]);

  // Alt+F10: from the text to the bubble menu (when it shows) or the toolbar.
  useEffect(
    () =>
      editorToolbarShortcut(
        rootRef.current as HTMLElement,
        contentRef.current as HTMLElement,
        () => bubbleMenuRef.current,
      ),
    [],
  );

  // Controlled content: a new `value` replaces the content, unless it is a late echo of a value
  // the editor reported itself (fast typing, batched renders). Like Tiptap, edits the owner
  // ignores are not undone: rich text can't be held back key by key.
  useEffect(() => {
    const controller = controllerRef.current;
    if (value === undefined || !controller || value === loadedRef.current) return;
    const echo = emittedRef.current.indexOf(value);
    if (echo >= 0) {
      emittedRef.current = emittedRef.current.slice(echo + 1);
      return;
    }
    emittedRef.current = [];
    if (value !== controller.getValue()) {
      controller.setContent(value);
      if (inputRef.current) inputRef.current.value = controller.getValue();
      loadedRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    controllerRef.current?.setEditable(editable);
  }, [editable]);

  useEffect(() => {
    const navigation = createToolbarNavigation(toolbarRef.current as HTMLDivElement);
    navigationRef.current = navigation;
    return () => {
      navigation.destroy();
      navigationRef.current = null;
    };
  }, []);
  useLayoutEffect(() => navigationRef.current?.sync());

  // Fullscreen covers the page: lock its scroll and keep Tab inside the editor.
  useEffect(() => {
    if (!fullscreen || !rootRef.current) return;
    return holdEditorFullscreen(rootRef.current);
  }, [fullscreen]);

  const changeFullscreen = (next: boolean) => {
    setFullscreen(next);
    onFullscreenChange?.(next);
  };

  const run = (action: EditorAction, args?: Parameters<EditorController["run"]>[1]) =>
    controllerRef.current?.run(action, args) ?? false;

  const openForm = (kind: "link" | "image", anchor: HTMLElement) => {
    if (form?.kind === kind) {
      setForm(null);
      return;
    }
    if (kind === "link") setHref(state.link ?? "");
    else {
      setSrc("");
      setAlt("");
    }
    setForm({ kind, anchor });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const done = form?.kind === "link" ? run("link", { href }) : run("image", { src, alt });
    if (done) setForm(null);
  };

  const disabled = (action: EditorAction) => !editable || state.disabled[action] === true;
  const blockLabel = editorBlockLabels[state.block === "other" ? "paragraph" : state.block];

  /** A toolbar (or bubble menu) button. */
  const toolButton = (button: EditorToolButton) => {
    const { action } = button;
    if (action === "fullscreen") {
      return (
        <button
          key={action}
          type="button"
          data-ok-editor-action={action}
          aria-label={button.label}
          aria-pressed={fullscreen}
          tabIndex={-1}
          onClick={() => changeFullscreen(!fullscreen)}
        >
          <Icon name="fullscreen" part="enter" />
          <Icon name="exitFullscreen" part="exit" />
        </button>
      );
    }
    const popover = button.popover ? (action as "link" | "image") : null;
    return (
      <button
        key={action}
        type="button"
        data-ok-editor-action={action}
        aria-label={button.label}
        aria-keyshortcuts={button.keys}
        aria-pressed={button.toggle ? state.active[action] === true : undefined}
        aria-haspopup={popover ? "dialog" : undefined}
        aria-expanded={popover ? form?.kind === popover : undefined}
        aria-controls={popover ? ids[popover] : undefined}
        disabled={disabled(action)}
        tabIndex={-1}
        onClick={(event) => (popover ? openForm(popover, event.currentTarget) : run(action))}
      >
        <Icon name={action} />
      </button>
    );
  };
  const groups = editorToolbar.slice(0, -1);
  const last = editorToolbar.at(-1) as (typeof editorToolbar)[number];
  const group = (each: (typeof editorToolbar)[number]) => (
    <div
      key={each.buttons[0]?.action}
      data-ok-editor-group=""
      data-ok-full={each.full ? "" : undefined}
    >
      {each.buttons.map(toolButton)}
    </div>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape from any part leaves fullscreen.
    <div
      ref={rootRefs}
      {...editorAttributes({
        fullItem,
        error,
        tables,
        autofocus: typeof autofocus === "string" ? autofocus : undefined,
        textDirection,
        enableContentCheck,
        emitContentError,
      })}
      data-ok-editable={editable ? undefined : "false"}
      data-ok-enable-input-rules={enableInputRules === false ? "false" : undefined}
      data-ok-enable-paste-rules={enablePasteRules === false ? "false" : undefined}
      data-ok-fullscreen={fullscreen ? "" : undefined}
      data-ok-runtime="off"
      id={id}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        const inOverlay = (event.target as Element).closest("[data-ok-popover]") !== null;
        // ProseMirror marks Escape as handled: only overlays (their own Escape) are skipped.
        if (event.key === "Escape" && fullscreen && !inOverlay) {
          changeFullscreen(false);
        }
      }}
      {...props}
    >
      {/* Fullscreen dims the page behind the editor (editor.css keeps it under the editor). */}
      <Backdrop open={fullscreen} />
      <div
        ref={toolbarRef}
        data-ok-editor-toolbar=""
        role="toolbar"
        aria-label="Formatting"
        aria-controls={ids.content}
      >
        <button
          type="button"
          data-ok-editor-heading=""
          id={ids.heading}
          aria-haspopup="menu"
          aria-expanded={menuAnchor !== null}
          aria-controls={ids.menu}
          disabled={!editable}
          tabIndex={0}
          onClick={(event) => setMenuAnchor(menuAnchor ? null : event.currentTarget)}
        >
          <span data-ok-editor-heading-label="">{blockLabel}</span>
          <Icon name="chevronDown" />
        </button>
        {groups.map(group)}
        {tables ? (
          <div data-ok-editor-group="">
            <button
              type="button"
              data-ok-editor-action="table"
              id={ids.table}
              aria-label="Table"
              aria-haspopup="menu"
              aria-expanded={tableAnchor !== null}
              aria-controls={ids.tableMenu}
              disabled={!editable}
              tabIndex={-1}
              onClick={(event) => setTableAnchor(tableAnchor ? null : event.currentTarget)}
            >
              <Icon name="table" />
            </button>
          </div>
        ) : null}
        {group(last)}
      </div>
      <div data-ok-editor-body="">
        {/* biome-ignore lint/a11y/useSemanticElements: ProseMirror's contenteditable rich text box (focusable once mounted). */}
        {/* biome-ignore lint/a11y/useFocusableInteractive: contenteditable makes it focusable. */}
        <div
          ref={contentRef}
          data-ok-editor-content=""
          id={ids.content}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? "Editor")}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={helperText ? ids.helper : undefined}
          aria-invalid={error ? "true" : undefined}
        />
      </div>
      {helperText ? (
        <p data-ok-editor-helper="" id={ids.helper}>
          {helperText}
        </p>
      ) : null}
      <Menu
        id={ids.menu}
        aria-labelledby={ids.heading}
        open={menuAnchor !== null}
        anchorEl={menuAnchor}
        onOpenChange={() => setMenuAnchor(null)}
      >
        {BLOCKS.map((block) => (
          <MenuItem
            key={block}
            data-ok-editor-block={block}
            selected={state.block === block}
            onClick={() =>
              block === "paragraph"
                ? run("paragraph")
                : run("heading", { level: Number(block.slice(1)) })
            }
          >
            {editorBlockLabels[block]}
          </MenuItem>
        ))}
      </Menu>
      <Popover
        id={ids.link}
        role="dialog"
        aria-labelledby={ids.linkTitle}
        placement="bottom-start"
        open={form?.kind === "link"}
        anchorEl={form?.kind === "link" ? form.anchor : null}
        onOpenChange={() => setForm(null)}
      >
        <form data-ok-editor-form="link" noValidate onSubmit={submit}>
          <p data-ok-editor-form-title="" id={ids.linkTitle}>
            Link URL
          </p>
          <div data-ok-editor-form-row="">
            <TextField
              size="small"
              type="url"
              placeholder="Enter URL"
              aria-labelledby={ids.linkTitle}
              data-ok-editor-field="href"
              value={href}
              onChange={setHref}
            />
            <Button type="submit" variant="contained" disabled={safeEditorUrl(href) === null}>
              Apply
            </Button>
          </div>
        </form>
      </Popover>
      <Popover
        id={ids.image}
        role="dialog"
        aria-labelledby={ids.imageTitle}
        placement="bottom-start"
        open={form?.kind === "image"}
        anchorEl={form?.kind === "image" ? form.anchor : null}
        onOpenChange={() => setForm(null)}
      >
        <form data-ok-editor-form="image" noValidate onSubmit={submit}>
          <p data-ok-editor-form-title="" id={ids.imageTitle}>
            Add image
          </p>
          <TextField
            size="small"
            type="url"
            placeholder="Image URL"
            aria-label="Image URL"
            data-ok-editor-field="src"
            value={src}
            onChange={setSrc}
          />
          <TextField
            size="small"
            placeholder="Alt text"
            aria-label="Alt text"
            data-ok-editor-field="alt"
            value={alt}
            onChange={setAlt}
          />
          <Button type="submit" variant="contained" disabled={safeEditorUrl(src, "image") === null}>
            Apply
          </Button>
        </form>
      </Popover>
      {tables ? (
        <Menu
          id={ids.tableMenu}
          aria-labelledby={ids.table}
          open={tableAnchor !== null}
          anchorEl={tableAnchor}
          onOpenChange={() => setTableAnchor(null)}
        >
          {editorTableActions.map(({ action, label }) => (
            <MenuItem
              key={action}
              data-ok-editor-table-action={action}
              disabled={disabled(action)}
              onClick={() => run(action)}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
      {bubble ? (
        <div
          ref={bubbleRef}
          popover="manual"
          data-ok-popover=""
          data-ok-editor-bubble-menu=""
          data-ok-runtime="off"
          id={ids.bubble}
          role="toolbar"
          aria-label={bubble.label ?? "Text formatting"}
          aria-controls={ids.content}
        >
          {(bubble.actions ?? editorBubbleMenuActions).map((action) => {
            const button = editorToolButton(action);
            return button ? toolButton(button) : null;
          })}
        </div>
      ) : null}
      {mentions ? (
        <div
          ref={mentionsListRef}
          popover="manual"
          data-ok-popover=""
          data-ok-editor-mentions=""
          data-ok-runtime="off"
          data-ok-char={mentionChar}
          data-ok-allow-spaces={mentionSpaces ? "" : undefined}
        >
          {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: listbox options are list items (as Autocomplete). */}
          <ul role="listbox" id={ids.mentions} aria-label={mentions.label ?? "Suggestions"} />
        </div>
      ) : null}
      {name !== undefined ? (
        <input
          ref={inputRef}
          type="hidden"
          data-ok-editor-input=""
          name={name}
          defaultValue={valueRef.current}
        />
      ) : null}
    </div>
  );
});
