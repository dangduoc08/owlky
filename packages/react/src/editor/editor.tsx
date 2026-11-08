"use client";

import { editorAttributes } from "@owlky/core";
import {
  createEditorController,
  createToolbarNavigation,
  type EditorAction,
  type EditorBlock,
  type EditorController,
  type EditorHighlighter,
  type EditorIconName,
  type EditorState,
  editorBlockLabels,
  editorIcons,
  editorToolbar,
  safeEditorUrl,
} from "@owlky/core/editor";
import {
  type FormEvent,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../button/button.js";
import { Menu, MenuItem } from "../menu/menu.js";
import { Popover } from "../popover/popover.js";
import { TextField } from "../text-field/text-field.js";

export type { EditorHighlighter } from "@owlky/core/editor";

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
}

const BLOCKS = Object.keys(editorBlockLabels) as Exclude<EditorBlock, "other">[];

const INITIAL: EditorState = {
  block: "paragraph",
  active: {} as EditorState["active"],
  disabled: { undo: true, redo: true, unlink: true } as EditorState["disabled"],
  link: null,
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
    id,
    onKeyDown,
    ...props
  },
  ref,
) {
  const base = useId();
  const ids = {
    content: id ? `${id}-content` : `${base}content`,
    helper: `${base}helper`,
    heading: `${base}heading`,
    menu: `${base}menu`,
    link: `${base}link`,
    linkTitle: `${base}link-title`,
    image: `${base}image`,
    imageTitle: `${base}image-title`,
  };
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
  const controlledRef = useRef(value !== undefined);
  controlledRef.current = value !== undefined;
  const editableRef = useRef(editable);
  editableRef.current = editable;

  const [state, setState] = useState<EditorState>(INITIAL);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [form, setForm] = useState<{ kind: "link" | "image"; anchor: HTMLElement } | null>(null);
  const [href, setHref] = useState("");
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => {
    const controller = createEditorController(contentRef.current as HTMLDivElement, {
      content: valueRef.current,
      editable: editableRef.current,
      placeholder,
      highlighter,
      onChange: (next) => {
        valueRef.current = next;
        if (controlledRef.current) emittedRef.current = [...emittedRef.current, next].slice(-50);
        onChangeRef.current?.(next);
      },
      onStateChange: setState,
    });
    controllerRef.current = controller;
    setState(controller.getState());
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [placeholder, highlighter]);

  // Controlled content: a new `value` replaces the content, unless it is a late echo of a value
  // the editor reported itself (fast typing, batched renders). Like Tiptap, edits the owner
  // ignores are not undone: rich text can't be held back key by key.
  useEffect(() => {
    const controller = controllerRef.current;
    if (value === undefined || !controller) return;
    const echo = emittedRef.current.indexOf(value);
    if (echo >= 0) {
      emittedRef.current = emittedRef.current.slice(echo + 1);
      return;
    }
    emittedRef.current = [];
    if (value !== controller.getValue()) controller.setContent(value);
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

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape from any part leaves fullscreen.
    <div
      ref={ref}
      {...editorAttributes({ fullItem, error })}
      data-ok-editable={editable ? undefined : "false"}
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
        {editorToolbar.map((group) => (
          <div
            key={group.buttons[0]?.action}
            data-ok-editor-group=""
            data-ok-full={group.full ? "" : undefined}
          >
            {group.buttons.map((button) => {
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
                  onClick={(event) =>
                    popover ? openForm(popover, event.currentTarget) : run(action)
                  }
                >
                  <Icon name={action} />
                </button>
              );
            })}
          </div>
        ))}
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
    </div>
  );
});
