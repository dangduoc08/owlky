import { editorOptions, readBehavior } from "@owlky/core";
import {
  createEditorController,
  createToolbarNavigation,
  type EditorAction,
  type EditorController,
  type EditorHighlighter,
  type EditorState,
  editorActions,
  editorBlockLabels,
  safeEditorUrl,
} from "@owlky/core/editor";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface EditorInstance extends ComponentInstance {
  /** Current HTML, `""` when empty. */
  readonly value: string;
  /**
   * Replaces the content with an HTML string (parsed by the browser's `DOMParser`: pages that
   * enforce Trusted Types need a policy for it). Emits no event.
   */
  setValue(value: string): void;
  readonly fullscreen: boolean;
  setFullscreen(fullscreen: boolean): void;
  setEditable(editable: boolean): void;
  focus(): void;
  /** The core controller (its `editor` is the Tiptap editor). */
  readonly controller: EditorController;
}

export interface CreateEditorOptions {
  /** Syntax highlighting and the language menu of code blocks (for example lowlight). */
  highlighter?: EditorHighlighter | undefined;
}

const { editable: editableOption, fullscreen: fullscreenOption } = editorOptions.options;
const DEFAULT_PLACEHOLDER = "Write something awesome...";
const isAction = (value: string | null): value is EditorAction =>
  editorActions.includes(value as EditorAction);

/**
 * Editor — spec: specs/components/editor.md (ADR-0023). Not in the default `components` list (it
 * loads Tiptap): register it with `getRuntime().register(editor)`, import `@owlky/html/editor`,
 * or load `owlky-editor.js` after `owlky.js`. `createEditor({ highlighter })` adds syntax
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
 * Events:  ok:editor:change (detail `{ value }`), ok:editor:fullscreen (detail `{ fullscreen }`).
 */
export const createEditor = ({ highlighter }: CreateEditorOptions = {}) =>
  defineComponent<EditorInstance>({
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
        navigation.sync();
      };

      const navigation = createToolbarNavigation(toolbar);
      const controller = createEditorController(content, {
        editable,
        placeholder: element.getAttribute("data-ok-placeholder") ?? DEFAULT_PLACEHOLDER,
        highlighter,
        onChange: (value) => emit("change", { value }),
        onStateChange: paint,
      });
      paint(controller.getState());

      const setFullscreen = (next: boolean) => {
        if (element.hasAttribute(fullscreenOption.attr) === next) return;
        element.toggleAttribute(fullscreenOption.attr, next);
        for (const button of own("[data-ok-editor-action='fullscreen']"))
          button.setAttribute("aria-pressed", String(next));
        emit("fullscreen", { fullscreen: next });
      };

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

      toolbar.addEventListener(
        "click",
        (event) => {
          const button = (event.target as Element).closest("[data-ok-editor-action]");
          if (!button || button.closest("[data-ok-editor]") !== element) return;
          const action = button.getAttribute("data-ok-editor-action");
          if (action === "fullscreen") setFullscreen(!element.hasAttribute(fullscreenOption.attr));
          // Link and image open their popover (data-ok-popover-open); the form runs the action.
          else if (isAction(action) && action !== "link" && action !== "image")
            controller.run(action);
        },
        { signal },
      );

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
          if (block === "paragraph") controller.run("paragraph");
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
        destroy() {
          navigation.destroy();
          controller.destroy({ restore: true });
        },
      };
    },
  });

/** The editor without syntax highlighting. */
export const editor = createEditor();
