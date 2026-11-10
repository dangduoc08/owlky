import { Extension } from "@tiptap/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createEditorBubbleMenu,
  defaultBubbleMenuShow,
  type EditorBubbleMenu,
  editorToolbarShortcut,
} from "./bubble-menu.js";
import { createEditorController, type EditorController } from "./editor.js";
import type { EditorMentionItem, EditorMentionOptions } from "./mention.js";
import { createToolbarNavigation, editorTableActions, editorToolButton } from "./toolbar.js";

let controller: EditorController | undefined;
let menu: EditorBubbleMenu | undefined;
afterEach(() => {
  menu?.destroy();
  menu = undefined;
  controller?.destroy();
  controller = undefined;
  cleanupDom();
});

const MARKUP = `
  <div data-ok-editor id="root">
    <div data-ok-editor-toolbar role="toolbar" aria-label="Formatting">
      <button type="button" id="bold-tool">Bold</button>
    </div>
    <div data-ok-editor-content id="content" role="textbox"><p>Hello world</p></div>
    <div popover="manual" data-ok-popover data-ok-editor-bubble-menu role="toolbar" aria-label="Text formatting" id="bubble">
      <button type="button" data-ok-editor-action="bold" id="bubble-bold">B</button>
      <button type="button" data-ok-editor-action="italic" id="bubble-italic">I</button>
    </div>
    <div popover="manual" data-ok-popover data-ok-editor-mentions id="mentions">
      <ul role="listbox" aria-label="Suggestions"></ul>
    </div>
  </div>`;

const page = () => {
  mount(MARKUP);
  const byId = (id: string) => document.getElementById(id) as HTMLElement;
  return { root: byId("root"), content: byId("content"), bubble: byId("bubble"), byId };
};

const create = (
  element: HTMLElement,
  options: Parameters<typeof createEditorController>[1] = {},
) => {
  controller = createEditorController(element, options);
  return controller;
};

/** Selects `text` (first match). */
const select = (c: EditorController, text: string) => {
  let from = -1;
  c.editor.state.doc.descendants((node, position) => {
    if (from < 0 && node.isText && node.text?.includes(text))
      from = position + (node.text?.indexOf(text) ?? 0);
  });
  c.editor.commands.setTextSelection({ from, to: from + text.length });
};

/** Resolves once `test` holds after a DOM change under `node` (or already holds). */
const until = (node: Node, test: () => boolean) =>
  new Promise<void>((resolve) => {
    if (test()) return resolve();
    const observer = new MutationObserver(() => {
      if (!test()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(node, { attributes: true, childList: true, subtree: true });
  });

describe("Tiptap pass-through", () => {
  it("adds extensions, and one with a built-in's name replaces it", () => {
    const { content } = page();
    const shortcut = vi.fn(() => true);
    const Custom = Extension.create({
      name: "custom",
      addKeyboardShortcuts: () => ({ "Mod-k": shortcut }),
    });
    const NoPlaceholder = Extension.create({ name: "placeholder" });
    const c = create(content, { extensions: [Custom, NoPlaceholder], placeholder: "Type" });
    const names = c.editor.extensionManager.extensions.map((extension) => extension.name);
    expect(names).toContain("custom");
    expect(names.filter((name) => name === "placeholder")).toHaveLength(1);
    c.setContent("");
    expect(content.querySelector("[data-placeholder]")).toBeNull();
  });

  it("merges editorProps; the editor's own attributes win", () => {
    const { content } = page();
    const handleKeyDown = vi.fn(() => false);
    create(content, {
      editable: false,
      editorProps: {
        attributes: { spellcheck: "false", "aria-readonly": "false" },
        handleKeyDown,
      },
    });
    expect(content.getAttribute("spellcheck")).toBe("false");
    expect(content.getAttribute("aria-readonly")).toBe("true");
    controller?.destroy();
    const again = page();
    create(again.content, { editorProps: { attributes: () => ({ "data-x": "1" }) } });
    expect(again.content.getAttribute("data-x")).toBe("1");
  });

  it("passes parseOptions, textDirection and autofocus to Tiptap", async () => {
    const { content } = page();
    content.innerHTML = "<p>a   b</p>";
    const c = create(content, {
      parseOptions: { preserveWhitespace: "full" },
      textDirection: "rtl",
      autofocus: "end",
    });
    expect(c.getValue()).toContain("a   b");
    expect(c.getValue()).toContain('dir="rtl"');
    await nextFrame();
    await nextFrame();
    expect(c.editor.state.selection.from).toBe(c.editor.state.doc.content.size - 1);
  });

  it("turns input rules off", async () => {
    const { content } = page();
    const c = create(content, { content: "<p></p>", enableInputRules: false });
    c.editor.view.focus();
    await userEvent.keyboard("> Quote");
    expect(c.getValue()).toBe("<p>&gt; Quote</p>");
    c.destroy();
    const on = page();
    const d = create(on.content, { content: "<p></p>", enablePasteRules: false });
    d.editor.view.focus();
    await userEvent.keyboard("> Quote");
    expect(d.getValue()).toMatch(/^<blockquote><p>Quote<\/p><\/blockquote>/);
  });
});

describe("Tiptap events and content access", () => {
  /** Records every event's name; `next(name)` resolves on the next one of that name. */
  const recorder = () => {
    const names: string[] = [];
    const waiting = new Map<string, (props: unknown) => void>();
    const onEvent = (name: string, props: unknown) => {
      names.push(name);
      waiting.get(name)?.(props);
      waiting.delete(name);
    };
    const next = (name: string) =>
      new Promise<unknown>((resolve) => {
        waiting.set(name, resolve);
      });
    return { names, onEvent, next };
  };

  it("reports beforeCreate at once, then create, focus, selection, transactions, delete and blur", async () => {
    const { content, byId } = page();
    const events = recorder();
    const created = events.next("create");
    const c = create(content, { onEvent: events.onEvent });
    expect(events.names).toEqual(["beforeCreate"]);
    expect(((await created) as { editor: unknown }).editor).toBe(c.editor);

    const focused = events.next("focus");
    c.editor.view.focus();
    expect(((await focused) as { event: Event }).event.type).toBe("focus");

    events.names.length = 0;
    c.editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(events.names).toEqual(expect.arrayContaining(["transaction", "selectionUpdate"]));
    expect(events.names).not.toContain("delete");

    const deleted = events.next("delete");
    c.editor.commands.deleteSelection();
    expect(await deleted).toMatchObject({ type: "node", partial: true });

    const blurred = events.next("blur");
    (byId("bold-tool") as HTMLButtonElement).focus();
    expect(((await blurred) as { event: Event }).event.type).toBe("blur");
    expect(c.getText()).toBe(" world");

    c.destroy();
    expect(events.names.at(-1)).toBe("destroy");
    controller = undefined;
  });

  it("reports paste and drop with their slices", () => {
    const { content } = page();
    const events = recorder();
    const c = create(content, { onEvent: events.onEvent });
    let pasted: unknown;
    void events.next("paste").then((props) => {
      pasted = props;
    });
    c.editor.view.pasteText("Pasted");
    expect(c.getText()).toContain("Pasted");
    const dropped = vi.fn();
    c.setContent("<p>A</p>");
    const slice = c.editor.state.doc.slice(0, 3);
    const event = new Event("drop") as DragEvent;
    void events.next("drop").then(dropped);
    c.editor.emit("drop", { editor: c.editor, event, slice, moved: true });
    return Promise.resolve().then(() => {
      expect(pasted).toMatchObject({ editor: c.editor });
      expect(dropped).toHaveBeenCalledWith({ editor: c.editor, event, slice, moved: true });
    });
  });

  it("content check: invalid content reports contentError and loads without it", () => {
    const { content } = page();
    const events = recorder();
    let error: unknown;
    void events.next("contentError").then((props) => {
      error = props;
    });
    const c = create(content, {
      content: "<p>Kept</p><custom-element>Dropped</custom-element>",
      enableContentCheck: true,
      onEvent: events.onEvent,
    });
    return Promise.resolve().then(() => {
      expect((error as { error: Error }).error).toBeInstanceOf(Error);
      expect(c.getText()).toContain("Kept");
      // A new invalid value is refused.
      c.setContent("<custom-element>No</custom-element>");
      expect(c.getText()).toContain("Kept");
      expect(events.names.filter((name) => name === "contentError")).toHaveLength(2);
      // Other errors still throw.
      const failing = {
        setContent: () => {
          throw new TypeError("other");
        },
      };
      vi.spyOn(c.editor, "commands", "get").mockReturnValue(failing as never);
      expect(() => c.setContent("<p>x</p>")).toThrow("other");
    });
  });

  it("without the check, invalid content loads silently", () => {
    const { content } = page();
    const onEvent = vi.fn();
    const c = create(content, { content: "<p>A</p><custom-element>B</custom-element>", onEvent });
    expect(onEvent.mock.calls.map(([name]) => name)).not.toContain("contentError");
    expect(c.getJSON()).toEqual({
      type: "doc",
      content: expect.arrayContaining([
        { type: "paragraph", attrs: expect.anything(), content: [{ type: "text", text: "A" }] },
      ]),
    });
  });
});

describe("tables", () => {
  it("are off by default: table markup is dropped and the actions refused", () => {
    const { content } = page();
    const c = create(content, {
      content: "<table><tbody><tr><td><p>x</p></td></tr></tbody></table>",
    });
    expect(c.getValue()).not.toContain("<table");
    expect(c.getState().disabled.insertTable).toBe(true);
    expect(c.run("insertTable")).toBe(false);
  });

  it("inserts a table and runs every table action where it can", () => {
    const { content } = page();
    const c = create(content, { tables: true, content: "<p>Before</p>" });
    const state = () => c.getState();
    expect(state().disabled.insertTable).toBe(false);
    expect(state().disabled.deleteRow).toBe(true);
    expect(c.run("deleteRow")).toBe(false);
    expect(c.run("insertTable")).toBe(true);
    const html = c.getValue();
    expect(html.match(/<tr>/g)).toHaveLength(3);
    expect(html.match(/<th\b/g)).toHaveLength(3);
    expect(state().disabled.deleteRow).toBe(false);
    for (const action of [
      "addColumnBefore",
      "addColumnAfter",
      "deleteColumn",
      "addRowBefore",
      "addRowAfter",
      "deleteRow",
      "toggleHeaderRow",
      "toggleHeaderColumn",
    ] as const)
      expect(c.run(action), action).toBe(true);
    // Two rows added, one deleted.
    expect(c.getValue().match(/<tr>/g)).toHaveLength(4);
    // A merge needs a cell selection; a split needs a merged cell.
    expect(state().disabled.mergeCells).toBe(true);
    expect(state().disabled.splitCell).toBe(true);
    expect(c.run("deleteTable")).toBe(true);
    expect(c.getValue()).not.toContain("<table");
  });

  it("merges and splits cells", () => {
    const { content } = page();
    const c = create(content, { tables: true, content: "<p></p>" });
    c.run("insertTable");
    // Select the first two body cells with a cell selection.
    const cells: number[] = [];
    c.editor.state.doc.descendants((node, position) => {
      if (node.type.name === "tableCell") cells.push(position);
    });
    c.editor.commands.setCellSelection({
      anchorCell: cells[0] as number,
      headCell: cells[1] as number,
    });
    expect(c.getState().disabled.mergeCells).toBe(false);
    expect(c.run("mergeCells")).toBe(true);
    expect(c.getValue()).toContain('colspan="2"');
    expect(c.run("splitCell")).toBe(true);
    expect(c.getValue()).not.toContain("colspan");
  });

  it("disables every action when read only", () => {
    const { content } = page();
    const c = create(content, { tables: true, editable: false });
    expect(editorTableActions.every(({ action }) => c.getState().disabled[action])).toBe(true);
  });
});

describe("mentions", () => {
  const PEOPLE: EditorMentionItem[] = [
    { id: "ada", label: "Ada Lovelace" },
    { id: "alan", label: "Alan Turing" },
    { id: "grace", label: "Grace Hopper" },
  ];
  const mentionsOf = (
    items: EditorMentionOptions["items"] = (q) =>
      PEOPLE.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())),
  ) => {
    const { content, byId } = page();
    const list = byId("mentions");
    const listbox = list.querySelector('[role="listbox"]') as HTMLElement;
    const c = create(content, {
      content: "<p></p>",
      mentions: { items, list: () => list },
    });
    c.editor.view.focus();
    return { c, content, list, listbox };
  };
  const options = (listbox: HTMLElement) => [...listbox.querySelectorAll('[role="option"]')];

  it("opens the list on the trigger, moves with the arrows and picks with Enter", async () => {
    const { c, content, list, listbox } = mentionsOf();
    await userEvent.keyboard("@a");
    await until(list, () => list.hasAttribute("data-ok-open"));
    expect(options(listbox).map((o) => o.textContent)).toEqual([
      "Ada Lovelace",
      "Alan Turing",
      "Grace Hopper",
    ]);
    expect(content.getAttribute("aria-controls")).toBe(listbox.id);
    expect(content.getAttribute("aria-activedescendant")).toBe(`${listbox.id}-0`);
    await userEvent.keyboard("{ArrowDown}");
    expect(options(listbox)[1]?.getAttribute("aria-selected")).toBe("true");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(content.getAttribute("aria-activedescendant")).toBe(`${listbox.id}-2`);
    await userEvent.keyboard("{Enter}");
    await until(list, () => !list.hasAttribute("data-ok-open"));
    const mention = content.querySelector("[data-ok-editor-mention]") as HTMLElement;
    expect(mention.getAttribute("data-type")).toBe("mention");
    expect(mention.getAttribute("data-id")).toBe("grace");
    expect(mention.getAttribute("data-label")).toBe("Grace Hopper");
    expect(mention.textContent).toBe("@Grace Hopper");
    expect(c.getValue()).toMatch(/<span [^>]*data-id="grace"[^>]*>@Grace Hopper<\/span>/);
    expect(content.hasAttribute("aria-activedescendant")).toBe(false);
    expect(options(listbox)).toHaveLength(0);
  });

  it("filters as the query grows, closes when nothing matches, and on Escape", async () => {
    const { list, listbox } = mentionsOf();
    await userEvent.keyboard("@gr");
    await until(list, () => options(listbox).length === 1);
    await userEvent.keyboard("x");
    await until(list, () => !list.hasAttribute("data-ok-open"));
    await userEvent.keyboard("{Backspace}");
    await until(list, () => list.hasAttribute("data-ok-open"));
    await userEvent.keyboard("{Escape}");
    await until(list, () => !list.hasAttribute("data-ok-open"));
  });

  it("takes async items and picks with a press, keeping the focus in the text", async () => {
    const { c, content, list, listbox } = mentionsOf(async (q) =>
      PEOPLE.filter((p) => p.id.startsWith(q)),
    );
    await userEvent.keyboard("@al");
    await until(list, () => options(listbox).length === 1);
    const option = options(listbox)[0] as HTMLElement;
    const press = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    option.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    await until(list, () => !list.hasAttribute("data-ok-open"));
    expect(c.getValue()).toContain('data-id="alan"');
    expect(document.activeElement).toBe(content);
    // A press outside an option does nothing.
    list.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  });

  it("ignores keys while the list is closed, and works without a list element", async () => {
    const { content } = page();
    const c = create(content, {
      content: "<p></p>",
      mentions: { char: "#", items: () => PEOPLE, list: () => null },
    });
    c.editor.view.focus();
    await userEvent.keyboard("#a{ArrowDown}{Enter}");
    expect(c.getValue()).not.toContain("mention");
  });

  it("keeps mentions in loaded content, as text without markup", () => {
    const { content } = page();
    const c = create(content, {
      content:
        '<p><span data-type="mention" data-id="ada" data-label="Ada">@Ada</span> <span data-type="mention" data-id="x" data-label="&lt;b&gt;x&lt;/b&gt;" onclick="alert(1)">@x</span></p>',
      mentions: { items: () => [], list: () => null },
    });
    const html = c.getValue();
    expect(html).toContain('data-id="ada"');
    expect(html).not.toContain("onclick");
    expect(content.querySelectorAll("[data-ok-editor-mention] b")).toHaveLength(0);
  });
});

describe("bubble menu", () => {
  const setup = (options: Parameters<typeof createEditorBubbleMenu>[2] = {}) => {
    const { content, bubble, root, byId } = page();
    const c = create(content);
    menu = createEditorBubbleMenu(c.editor, bubble, { updateDelay: 0, ...options });
    return { c, content, bubble, root, byId };
  };

  it("shows over selected text in a focused editor, and hides when it collapses", async () => {
    const onOpenChange = vi.fn();
    const { c, bubble } = setup({ onOpenChange });
    c.editor.view.focus();
    select(c, "world");
    expect(bubble.hasAttribute("data-ok-open")).toBe(true);
    expect(menu?.isOpen).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(bubble.style.getPropertyValue("--_ok-popover-x")).not.toBe("");
    c.editor.commands.setTextSelection(2);
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("stays hidden without focus, and when shouldShow says no", () => {
    const { c, bubble } = setup();
    select(c, "world");
    menu?.update();
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    menu?.setOptions({ updateDelay: 0, shouldShow: ({ from, to }) => to - from > 3 });
    select(c, "wor");
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    select(c, "world");
    expect(bubble.hasAttribute("data-ok-open")).toBe(true);
  });

  it("waits for the update delay", async () => {
    const { c, bubble } = setup({ updateDelay: 30 });
    c.editor.view.focus();
    select(c, "world");
    select(c, "Hello");
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(bubble.hasAttribute("data-ok-open")).toBe(true);
  });

  it("takes focus with Alt+F10, gives it back on Escape, and hides when focus leaves", async () => {
    const { c, content, bubble, root, byId } = setup();
    const release = editorToolbarShortcut(root, content, () => menu);
    createToolbarNavigation(byId("root").querySelector("[data-ok-editor-toolbar]") as HTMLElement);
    c.editor.view.focus();
    select(c, "world");
    await userEvent.keyboard("{Alt>}{F10}{/Alt}");
    expect(document.activeElement?.id).toBe("bubble-bold");
    expect(bubble.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.id).toBe("bubble-italic");
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(content);
    expect(c.editor.state.selection.empty).toBe(false);
    // Without the menu showing, Alt+F10 goes to the main toolbar.
    c.editor.commands.setTextSelection(2);
    await userEvent.keyboard("{Alt>}{F10}{/Alt}");
    expect(document.activeElement?.id).toBe("bold-tool");
    // Focus leaving for the page hides it.
    c.editor.view.focus();
    select(c, "world");
    menu?.focus();
    (document.getElementById("bold-tool") as HTMLElement).focus();
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    expect(menu?.focus()).toBe(false);
    release();
  });

  it("keeps the selection on a press, hides on blur and stops when destroyed", () => {
    const { c, bubble, byId } = setup();
    c.editor.view.focus();
    select(c, "world");
    const press = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    byId("bubble-bold").dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    c.editor.view.dom.blur();
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    menu?.destroy();
    menu = undefined;
    c.editor.view.focus();
    select(c, "world");
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
  });

  it("default shouldShow: no menu over an empty text selection or a read-only editor", () => {
    const { c, bubble } = setup();
    c.setContent("<p></p><p>x</p>");
    c.editor.view.focus();
    expect(defaultBubbleMenuShow({ editor: c.editor, from: 1, to: 1 }, bubble)).toBe(false);
    select(c, "x");
    c.setEditable(false);
    menu?.update();
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
  });

  it("is a toolbar of its own for roving focus, and finds its buttons", () => {
    const { c, bubble } = setup();
    c.editor.view.focus();
    select(c, "world");
    const navigation = createToolbarNavigation(bubble);
    expect((bubble.querySelector("#bubble-bold") as HTMLElement).tabIndex).toBe(0);
    expect((bubble.querySelector("#bubble-italic") as HTMLElement).tabIndex).toBe(-1);
    navigation.destroy();
    expect(editorToolButton("bold")?.label).toBe("Bold");
    expect(editorToolButton("link")?.popover).toBe(true);
  });
});
