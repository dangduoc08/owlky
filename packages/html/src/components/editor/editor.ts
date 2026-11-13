import { editorOptions, parsePlacement, readBehavior } from "@owlky/core";
import {
  createEditorBubbleMenu,
  createEditorController,
  createToolbarNavigation,
  type EditorAction,
  type EditorBubbleMenu,
  type EditorController,
  type EditorControllerOptions,
  type EditorEventName,
  type EditorEventProps,
  type EditorHighlighter,
  type EditorJSONContent,
  type EditorMentionItem,
  type EditorState,
  editorActions,
  editorBlockLabels,
  editorToolbarShortcut,
  holdEditorFullscreen,
  safeEditorUrl,
  type TiptapEditor,
} from "@owlky/core/editor";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec, SetupContext } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface EditorEvents {
  /** After the content changed, with its HTML. */
  change: EventSpec<{ value: string }>;
  /** After the editor entered or left full screen. */
  fullscreen: EventSpec<{ fullscreen: boolean }>;
  /**
   * The mention list needs items for `query` (the text after the trigger). `items` holds the
   * matches from `template[data-ok-editor-mention-items]`; call `respondWith(itemsOrPromise)` to
   * show others (for example from a server).
   */
  mentionsearch: EventSpec<{
    query: string;
    char: string;
    items: readonly EditorMentionItem[];
    respondWith(
      items: readonly EditorMentionItem[] | PromiseLike<readonly EditorMentionItem[]>,
    ): void;
  }>;
  /** Tiptap's `beforeCreate`: the editor is being built (the instance doesn't exist yet). */
  beforecreate: EventSpec;
  /** Tiptap's `create`: the editor is ready, with its HTML. */
  create: EventSpec<{ value: string }>;
  /** Tiptap's `focus`: the focus entered the text. */
  focus: EventSpec<{ event: FocusEvent }>;
  /** Tiptap's `blur`: the focus left the text. */
  blur: EventSpec<{ event: FocusEvent }>;
  /** Tiptap's `selectionUpdate`: the selection moved, from `from` to `to` (document positions). */
  selectionupdate: EventSpec<{ from: number; to: number; empty: boolean }>;
  /** Tiptap's `transaction`: any change of the editor's state; `docChanged` when the content changed. */
  transaction: EventSpec<{ docChanged: boolean }>;
  /** Tiptap's `paste`: content was pasted, with its plain text. */
  paste: EventSpec<{ event: ClipboardEvent; text: string }>;
  /** Tiptap's `drop`: content was dropped, with its plain text; `moved` when it was dragged from the editor. */
  drop: EventSpec<{ event: DragEvent; text: string; moved: boolean }>;
  /**
   * Tiptap's `delete`: a node or a mark was removed. `name` is its type (`paragraph`, `bold`…),
   * `from` / `to` the removed range, `partial` when only part of it went.
   */
  delete: EventSpec<{
    type: "node" | "mark";
    name: string;
    from: number;
    to: number;
    partial: boolean;
  }>;
  /** Tiptap's `contentError`: content didn't fit the editor's schema (with `data-ok-enable-content-check`). */
  contenterror: EventSpec<{ message: string }>;
  /** Tiptap's `destroy`: the editor was destroyed (the runtime stopped or the element left). */
  destroy: EventSpec;
}

export interface EditorInstance extends ComponentInstance {
  /** Current HTML, `""` when empty. */
  readonly value: string;
  /**
   * Replaces the content with an HTML string (parsed by the browser's `DOMParser`: pages that
   * enforce Trusted Types need a policy for it). Emits no event.
   */
  setValue(value: string): void;
  /** Whether the editor is in full screen. */
  readonly fullscreen: boolean;
  /** Enters or leaves full screen. */
  setFullscreen(fullscreen: boolean): void;
  /** Turns editing on or off. */
  setEditable(editable: boolean): void;
  /** Moves the focus into the editor. */
  focus(): void;
  /** The core controller (its `editor` is the Tiptap editor). */
  readonly controller: EditorController;
  /** The Tiptap editor: its commands, `on()` for events, `isEmpty`, `isFocused`, `setOptions()`. */
  readonly editor: TiptapEditor;
  /** The content as ProseMirror JSON. */
  getJSON(): EditorJSONContent;
  /** The content as plain text, blocks separated by a blank line. */
  getText(): string;
}

export interface CreateEditorOptions {
  /** Syntax highlighting and the language menu of code blocks (for example lowlight). */
  highlighter?: EditorHighlighter | undefined;
  /** More Tiptap extensions for every editor (one with a built-in's name replaces it). */
  extensions?: EditorControllerOptions["extensions"];
  /** ProseMirror props (Tiptap's `editorProps`), merged with the editor's own. */
  editorProps?: EditorControllerOptions["editorProps"];
  /** ProseMirror parse options for the content (Tiptap's `parseOptions`). */
  parseOptions?: EditorControllerOptions["parseOptions"];
}

const {
  editable: editableOption,
  fullscreen: fullscreenOption,
  tables: tablesOption,
  autofocus: autofocusOption,
  textDirection: textDirectionOption,
  enableInputRules: inputRulesOption,
  enablePasteRules: pasteRulesOption,
  enableContentCheck: contentCheckOption,
  emitContentError: contentErrorOption,
} = editorOptions.options;

/**
 * Emits a Tiptap event as `ok:editor:<lowercase name>`, with a detail of plain values: no
 * ProseMirror objects (transactions, slices, nodes), so listeners need no Tiptap types.
 */
function relay(
  emit: SetupContext<EditorEvents>["emit"],
  controller: () => EditorController | undefined,
): NonNullable<EditorControllerOptions["onEvent"]> {
  return (name, props) => {
    const all = props as EditorEventProps[EditorEventName];
    switch (name) {
      case "beforeCreate":
        emit("beforecreate");
        break;
      case "create":
        emit("create", { value: controller()?.getValue() ?? "" });
        break;
      case "focus":
      case "blur":
        emit(name, { event: (all as EditorEventProps["focus"]).event });
        break;
      case "selectionUpdate": {
        const { from, to, empty } = all.editor.state.selection;
        emit("selectionupdate", { from, to, empty });
        break;
      }
      case "transaction":
        emit("transaction", {
          docChanged: (all as EditorEventProps["transaction"]).transaction.docChanged,
        });
        break;
      case "paste": {
        const { event, slice } = all as EditorEventProps["paste"];
        emit("paste", { event, text: slice.content.textBetween(0, slice.content.size, "\n\n") });
        break;
      }
      case "drop": {
        const { event, slice, moved } = all as EditorEventProps["drop"];
        const text = slice.content.textBetween(0, slice.content.size, "\n\n");
        emit("drop", { event, text, moved });
        break;
      }
      case "delete": {
        const removed = all as EditorEventProps["delete"];
        emit("delete", {
          type: removed.type,
          name: removed.type === "node" ? removed.node.type.name : removed.mark.type.name,
          from: removed.deletedRange.from,
          to: removed.deletedRange.to,
          partial: removed.partial,
        });
        break;
      }
      case "contentError":
        emit("contenterror", {
          message: (all as EditorEventProps["contentError"]).error.message,
        });
        break;
      default:
        emit("destroy");
    }
  };
}
/** Most mentions the list shows from the template. */
const MENTION_LIMIT = 10;

/** The template's items whose label contains `query` (case-insensitive). */
function templateItems(
  template: HTMLTemplateElement | undefined,
  query: string,
): EditorMentionItem[] {
  if (!template) return [];
  const needle = query.toLocaleLowerCase();
  return [...template.content.querySelectorAll("[data-ok-value]")]
    .map((item) => ({
      id: item.getAttribute("data-ok-value") as string,
      label: (item.textContent as string).trim(),
    }))
    .filter((item) => item.label.toLocaleLowerCase().includes(needle))
    .slice(0, MENTION_LIMIT);
}
const DEFAULT_PLACEHOLDER = "Write something awesome...";
const isAction = (value: string | null): value is EditorAction =>
  editorActions.includes(value as EditorAction);

/**
 * Editor — spec: specs/components/editor.md (ADR-0023). Not in the default `components` list (it
 * loads Tiptap): register it with `getRuntime().register(editor)`, import `@owlky/html/editor`,
 * or let `owlky.js` load it on a CDN page (ADR-0068). `createEditor({ highlighter })` adds syntax
 * highlighting.
 *
 * Markup:  <div data-ok-editor data-ok-full-item>
 *            <div data-ok-editor-toolbar role="toolbar" aria-label="Formatting">
 *              <button data-ok-editor-heading data-ok-popover-open="menu-id">…</button>
 *              <div data-ok-editor-group><button data-ok-editor-action="bold" aria-pressed="false">…</button>…</div>…
 *            </div>
 *            <div data-ok-editor-body><div data-ok-editor-content role="textbox">…content…</div></div>
 *            …heading Menu, link and image Popovers (form[data-ok-editor-form])…
 *          </div>
 * Behavior: mounts Tiptap on the content (its markup is the initial value), keeps the toolbar's
 *          `aria-pressed` / `disabled` / heading label in step, runs toolbar actions, the heading
 *          menu and the link / image forms; Fullscreen and Escape toggle `data-ok-fullscreen`.
 * Events:  ok:editor:change (detail `{ value }`), ok:editor:fullscreen (detail `{ fullscreen }`),
 *          Tiptap's events in lowercase (`create`, `focus`, `blur`, `selectionupdate`,
 *          `transaction`, `paste`, `drop`, `delete`, `contenterror`, `beforecreate`, `destroy`)
 *          with plain details; the instance's `editor` is the Tiptap editor.
 */
export const createEditor = ({
  highlighter,
  extensions,
  editorProps,
  parseOptions,
}: CreateEditorOptions = {}) =>
  defineComponent<EditorInstance, EditorEvents>({
    name: "editor",
    selector: "[data-ok-editor]",

    setup(element, { emit, signal, runtime }) {
      const own = <T extends Element>(selector: string) =>
        [...element.querySelectorAll<T>(selector)].filter(
          (node) => node.closest("[data-ok-editor]") === element,
        );
      const content = own<HTMLElement>("[data-ok-editor-content]")[0];
      const toolbar = own<HTMLElement>("[data-ok-editor-toolbar]")[0];
      if (!content || !toolbar) throw new Error("Editor markup needs a content and a toolbar.");
      let editable = readBehavior(element, editableOption);
      let state: EditorState | null = null;

      const paint = (next: EditorState) => {
        state = next;
        for (const button of own<HTMLButtonElement>("[data-ok-editor-action]")) {
          const action = button.getAttribute("data-ok-editor-action");
          // The table menu's trigger.
          if (action === "table" && button.disabled === editable) button.disabled = !editable;
          if (!isAction(action)) continue;
          const pressed = String(next.active[action]);
          if (
            button.hasAttribute("aria-pressed") &&
            button.getAttribute("aria-pressed") !== pressed
          )
            button.setAttribute("aria-pressed", pressed);
          const disabled = !editable || next.disabled[action];
          if (button.disabled !== disabled) button.disabled = disabled;
        }
        for (const heading of own<HTMLButtonElement>("[data-ok-editor-heading]")) {
          heading.disabled = !editable;
          const label = heading.querySelector("[data-ok-editor-heading-label]");
          const text = editorBlockLabels[next.block === "other" ? "paragraph" : next.block];
          // Only real changes: replacing the text node under the pointer between mousedown and
          // mouseup (Tiptap's blur transaction) makes WebKit drop the click.
          if (label && label.textContent !== text) label.textContent = text;
        }
        for (const item of own<HTMLElement>("[data-ok-editor-block]")) {
          const selected = item.dataset["okEditorBlock"] === next.block;
          if (item.hasAttribute("data-ok-selected") !== selected)
            item.toggleAttribute("data-ok-selected", selected);
        }
        for (const item of own<HTMLElement>("[data-ok-editor-table-action]")) {
          const action = item.getAttribute("data-ok-editor-table-action");
          const off = !editable || !isAction(action) || next.disabled[action];
          if ((item.getAttribute("aria-disabled") === "true") !== off) {
            if (off) item.setAttribute("aria-disabled", "true");
            else item.removeAttribute("aria-disabled");
          }
        }
        navigation.sync();
      };

      // Mentions: the list popover in the markup turns them on; items from the template or
      // the `mentionsearch` event.
      const mentionList = own<HTMLElement>("[data-ok-editor-mentions]")[0];
      const mentionTemplate = own<HTMLTemplateElement>("template[data-ok-editor-mention-items]")[0];
      const mentionChar = mentionList?.getAttribute("data-ok-char") || "@";
      const choice = <V extends string>(spec: { attr: string; values: readonly V[] }) => {
        const value = element.getAttribute(spec.attr);
        return spec.values.includes(value as V) ? (value as V) : undefined;
      };
      const settings = {
        tables: element.hasAttribute(tablesOption.attr),
        autofocus: choice(autofocusOption),
        textDirection: choice(textDirectionOption),
        enableInputRules: readBehavior(element, inputRulesOption),
        enablePasteRules: readBehavior(element, pasteRulesOption),
        enableContentCheck: element.hasAttribute(contentCheckOption.attr),
        emitContentError: element.hasAttribute(contentErrorOption.attr),
        extensions,
        editorProps,
        parseOptions,
      };

      const input = own<HTMLInputElement>("input[data-ok-editor-input]")[0];
      const navigation = createToolbarNavigation(toolbar);
      // `beforeCreate` (and an initial content error) fire while the controller is being built.
      let built: EditorController | undefined;
      const controller = createEditorController(content, {
        editable,
        placeholder: element.getAttribute("data-ok-placeholder") ?? DEFAULT_PLACEHOLDER,
        highlighter,
        ...settings,
        onEvent: relay(emit, () => built),
        ...(mentionList
          ? {
              mentions: {
                char: mentionChar,
                allowSpaces: mentionList.hasAttribute("data-ok-allow-spaces"),
                list: () => mentionList,
                items: (query: string) => {
                  let items:
                    | readonly EditorMentionItem[]
                    | PromiseLike<readonly EditorMentionItem[]> = templateItems(
                    mentionTemplate,
                    query,
                  );
                  emit("mentionsearch", {
                    query,
                    char: mentionChar,
                    items: items as readonly EditorMentionItem[],
                    respondWith(next) {
                      items = next;
                    },
                  });
                  return items;
                },
              },
            }
          : {}),
        onChange: (value) => {
          if (input) input.value = value;
          emit("change", { value });
        },
        onStateChange: paint,
      });
      built = controller;
      if (input) input.value = controller.getValue();
      paint(controller.getState());

      // The bubble menu: the toolbar over selected text, when the markup has one.
      const bubbleElement = own<HTMLElement>("[data-ok-editor-bubble-menu]")[0];
      // A non-negative number of ms; anything else (or nothing) keeps Tiptap's 250.
      const delayText = bubbleElement?.getAttribute("data-ok-update-delay") ?? "";
      const delay = /^\d+$/.test(delayText) ? Number(delayText) : undefined;
      const bubble: EditorBubbleMenu | null = bubbleElement
        ? createEditorBubbleMenu(controller.editor, bubbleElement, {
            placement: parsePlacement(bubbleElement.getAttribute("data-ok-placement"), "top"),
            updateDelay: delay,
          })
        : null;
      const releaseShortcut = editorToolbarShortcut(element, content, () => bubble);

      // Fullscreen: the page behind is dimmed (the root's Backdrop), locked and out of Tab's reach.
      let release: (() => void) | null = null;
      const setFullscreen = (next: boolean) => {
        if (element.hasAttribute(fullscreenOption.attr) === next) return;
        element.toggleAttribute(fullscreenOption.attr, next);
        for (const button of own("[data-ok-editor-action='fullscreen']"))
          button.setAttribute("aria-pressed", String(next));
        for (const backdrop of element.querySelectorAll(":scope > [data-ok-backdrop]"))
          backdrop.toggleAttribute("data-ok-open", next);
        release?.();
        release = next ? holdEditorFullscreen(element) : null;
        emit("fullscreen", { fullscreen: next });
      };
      if (element.hasAttribute(fullscreenOption.attr)) release = holdEditorFullscreen(element);

      const popoverOf = (node: Element) =>
        runtime.get<{ close(reason?: string): boolean } & ComponentInstance>(
          node.closest("[data-ok-popover]"),
          "popover",
        );

      const fields = (form: Element) => {
        const field = (name: string) =>
          form.querySelector<HTMLInputElement>(`[data-ok-editor-field="${name}"]`);
        return { href: field("href"), src: field("src"), alt: field("alt") };
      };
      const validate = (form: Element) => {
        const { href, src } = fields(form);
        const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
        if (!submit) return;
        submit.disabled =
          form.getAttribute("data-ok-editor-form") === "link"
            ? safeEditorUrl(href?.value ?? "") === null
            : safeEditorUrl(src?.value ?? "", "image") === null;
      };

      const onToolClick = (event: Event) => {
        const button = (event.target as Element).closest<HTMLElement>("[data-ok-editor-action]");
        if (!button || button.closest("[data-ok-editor]") !== element) return;
        const action = button.getAttribute("data-ok-editor-action");
        if (action === "fullscreen") setFullscreen(!element.hasAttribute(fullscreenOption.attr));
        else if (action === "link" || action === "image") {
          // Toolbar buttons open their form with data-ok-popover-open; the bubble menu is
          // outside the runtime's reach (data-ok-runtime="off"), so it opens it here.
          if (!bubbleElement?.contains(button)) return;
          const form = (element.getRootNode() as Document | ShadowRoot).getElementById(
            button.getAttribute("aria-controls") as string,
          );
          runtime
            .getOrCreate<{ toggle(anchor: Element): boolean } & ComponentInstance>(form, "popover")
            ?.toggle(button);
        } else if (isAction(action)) controller.run(action);
      };
      toolbar.addEventListener("click", onToolClick, { signal });
      bubbleElement?.addEventListener("click", onToolClick, { signal });

      element.addEventListener(
        "ok:popover:open",
        (event) => {
          const form = (event.target as Element).querySelector("[data-ok-editor-form]");
          if (!form) return;
          const { href, src, alt } = fields(form);
          if (href) href.value = state?.link ?? "";
          if (src) src.value = "";
          if (alt) alt.value = "";
          validate(form);
        },
        { signal },
      );

      element.addEventListener(
        "input",
        (event) => {
          const form = (event.target as Element).closest("[data-ok-editor-form]");
          if (form) validate(form);
        },
        { signal },
      );

      element.addEventListener(
        "submit",
        (event) => {
          const form = (event.target as Element).closest("[data-ok-editor-form]");
          if (!form) return;
          event.preventDefault();
          const { href, src, alt } = fields(form);
          const done =
            form.getAttribute("data-ok-editor-form") === "link"
              ? controller.run("link", { href: href?.value ?? "" })
              : controller.run("image", { src: src?.value ?? "", alt: alt?.value ?? "" });
          if (done) popoverOf(form)?.close("api");
        },
        { signal },
      );

      element.addEventListener(
        "ok:menu:select",
        (event) => {
          const item = (event as CustomEvent<{ item: Element }>).detail.item;
          const block = item.getAttribute("data-ok-editor-block");
          const table = item.getAttribute("data-ok-editor-table-action");
          if (isAction(table)) controller.run(table);
          else if (block === "paragraph") controller.run("paragraph");
          else if (block && /^h[1-6]$/.test(block))
            controller.run("heading", { level: Number(block.slice(1)) });
        },
        { signal },
      );

      element.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Escape" &&
            element.hasAttribute(fullscreenOption.attr) &&
            (event.target as Element).closest("[data-ok-popover]") === null
          )
            setFullscreen(false);
        },
        { signal },
      );

      return {
        get value() {
          return controller.getValue();
        },
        setValue(value) {
          controller.setContent(value);
          if (input) input.value = controller.getValue();
        },
        get fullscreen() {
          return element.hasAttribute(fullscreenOption.attr);
        },
        setFullscreen,
        setEditable(next) {
          editable = next;
          element.toggleAttribute(editableOption.attr, !next);
          if (!next) element.setAttribute(editableOption.attr, "false");
          controller.setEditable(next);
          paint(controller.getState());
        },
        focus() {
          controller.focus();
        },
        controller,
        get editor() {
          return controller.editor;
        },
        getJSON: () => controller.getJSON(),
        getText: () => controller.getText(),
        destroy() {
          release?.();
          releaseShortcut();
          bubble?.destroy();
          navigation.destroy();
          controller.destroy({ restore: true });
        },
      };
    },
  });

/** The editor without syntax highlighting. */
export const editor = createEditor();
