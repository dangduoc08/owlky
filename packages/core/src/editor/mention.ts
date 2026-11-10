/*
 * Editor mentions (ADR-0050): Tiptap's Mention node and Suggestion utility, with Owlky's list —
 * a listbox in a Popover anchored to the typed query, picked with the keyboard while focus stays
 * in the text (`aria-activedescendant`), like Autocomplete. Core renders the options with DOM
 * methods into the owner's listbox (React and HTML render the same empty list).
 */
import type { Editor } from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { createPopoverController, type PopoverController } from "../popover/popover-controller.js";

/** A person (or anything else) a mention can name. */
export interface EditorMentionItem {
  /** Written to `data-id`. */
  readonly id: string;
  /** Shown in the list and in the text after the trigger character. */
  readonly label: string;
}

export interface EditorMentionOptions {
  /** The character that opens the list. Default `"@"`. */
  readonly char?: string | undefined;
  /** The items for what was typed after the trigger (`""` right after it); may be async. */
  readonly items: (
    query: string,
  ) => readonly EditorMentionItem[] | PromiseLike<readonly EditorMentionItem[]>;
  /** The query may hold spaces (`@Ada Lovelace`). Default `false`. */
  readonly allowSpaces?: boolean | undefined;
  /** The list's Popover (`[data-ok-editor-mentions]` with a `[role=listbox]` inside). */
  readonly list: () => HTMLElement | null | undefined;
}

/** The list's options (`data-ok-editor-mention-option`), in order. */
export const MENTION_OPTION = "data-ok-editor-mention-option";

let lists = 0;

/** The suggestion renderer: shows the items in the owner's listbox and picks one. */
function mentionList(options: EditorMentionOptions, editor: () => Editor | null) {
  let popover: PopoverController | null = null;
  let element: HTMLElement | null = null;
  let items: readonly EditorMentionItem[] = [];
  let active = 0;
  let props: SuggestionProps<EditorMentionItem> | null = null;
  const id = `ok-mentions-${++lists}`;
  const listbox = () => element?.querySelector<HTMLElement>('[role="listbox"]') ?? null;
  const content = () => editor()?.view.dom as HTMLElement | undefined;

  const pick = (index: number) => {
    const item = items[index];
    if (item && props) props.command({ id: item.id, label: item.label });
  };

  function paint() {
    const list = listbox();
    if (!list) return;
    if (!list.id) list.id = id;
    const doc = list.ownerDocument;
    list.replaceChildren(
      ...items.map((item, index) => {
        const option = doc.createElement("li");
        option.setAttribute("role", "option");
        option.id = `${list.id}-${index}`;
        option.setAttribute(MENTION_OPTION, "");
        option.setAttribute("aria-selected", String(index === active));
        option.textContent = item.label;
        return option;
      }),
    );
    const textbox = content();
    if (!textbox) return;
    if (items.length) {
      textbox.setAttribute("aria-controls", list.id);
      textbox.setAttribute("aria-activedescendant", `${list.id}-${active}`);
      list.querySelector(`[aria-selected="true"]`)?.scrollIntoView?.({ block: "nearest" });
    } else close();
  }

  function close() {
    popover?.close();
    const textbox = content();
    textbox?.removeAttribute("aria-activedescendant");
    textbox?.removeAttribute("aria-controls");
  }

  const onPress = (event: Event) => {
    // Keep the focus (and the query) in the text.
    event.preventDefault();
    const option = (event.target as Element).closest(`[${MENTION_OPTION}]`);
    const list = listbox();
    if (option && list) pick([...list.children].indexOf(option));
  };

  function onUpdate(next: SuggestionProps<EditorMentionItem>) {
    if (!element || !popover) return;
    props = next;
    items = next.items;
    active = 0;
    paint();
    if (!items.length) return;
    if (popover.isOpen) popover.update();
    else popover.open({ getBoundingClientRect: () => props?.clientRect?.() ?? new DOMRect() });
  }

  return {
    onStart(next: SuggestionProps<EditorMentionItem>) {
      element = options.list() ?? null;
      if (!element) return;
      popover = createPopoverController(element, {
        placement: "bottom-start",
        autoFocus: false,
        restoreFocus: false,
        // The suggestion closes the list (Escape, a press elsewhere moves the caret out).
        closeOnEscape: false,
        closeOnOutside: false,
      });
      element.addEventListener("mousedown", onPress);
      onUpdate(next);
    },
    onUpdate,
    onKeyDown({ event }: SuggestionKeyDownProps) {
      if (!popover?.isOpen || !items.length) return false;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        active = (active + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        paint();
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        pick(active);
        return true;
      }
      return false;
    },
    onExit() {
      close();
      listbox()?.replaceChildren();
      element?.removeEventListener("mousedown", onPress);
      popover?.destroy();
      popover = null;
      element = null;
      props = null;
      items = [];
    },
  };
}

/** The Mention node with Owlky's list. `editor` returns the editor once it exists. */
export function createMention(options: EditorMentionOptions, editor: () => Editor | null) {
  return Mention.configure({
    HTMLAttributes: { "data-ok-editor-mention": "" },
    suggestion: {
      char: options.char ?? "@",
      allowSpaces: options.allowSpaces === true,
      items: ({ query }) =>
        options.items(query) as EditorMentionItem[] | Promise<EditorMentionItem[]>,
      render: () => mentionList(options, editor),
    },
  });
}
