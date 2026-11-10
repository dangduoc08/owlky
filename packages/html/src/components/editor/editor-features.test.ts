import { Extension } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { createEditor, type EditorInstance, editor } from "./editor.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  snippets.find(([path]) => path.endsWith(`/${name}-group.html`))?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const setup = async (markup: string, definition = editor) => {
  const host = mount(markup);
  runtime = createRuntime()
    .register(...components, definition)
    .start();
  await settle();
  const root = host.querySelector<HTMLElement>("[data-ok-editor]") as HTMLElement;
  const content = root.querySelector<HTMLElement>("[data-ok-editor-content]") as HTMLElement;
  const instance = runtime.get<EditorInstance>(root, "editor") as EditorInstance;
  return { host, root, content, instance };
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

/** Selects `text` in the editor through the editor (synchronous selection update). */
const select = (instance: EditorInstance, text: string) => {
  const { editor: tiptap } = instance.controller;
  let from = -1;
  tiptap.state.doc.descendants((node, position) => {
    if (from < 0 && node.isText && node.text?.includes(text))
      from = position + (node.text?.indexOf(text) ?? 0);
  });
  tiptap.view.focus();
  tiptap.commands.setTextSelection({ from, to: from + text.length });
};

describe("editor tables (snippet)", () => {
  it("runs the table menu's actions and keeps their disabled state in step", async () => {
    const { host, root, instance } = await setup(snippet("table"));
    expect(root.querySelectorAll("[data-ok-editor-content] table th")).toHaveLength(3);
    const item = (action: string) =>
      root.querySelector(`[data-ok-editor-table-action="${action}"]`) as HTMLElement;
    // The caret is outside the table: only "Insert table" can run.
    expect(item("deleteRow").getAttribute("aria-disabled")).toBe("true");
    expect(item("insertTable").hasAttribute("aria-disabled")).toBe(false);
    select(instance, "Design");
    expect(item("deleteRow").hasAttribute("aria-disabled")).toBe(false);
    const trigger = root.querySelector('[data-ok-editor-action="table"]') as HTMLButtonElement;
    trigger.click();
    await settle();
    const menu = root.querySelector(
      "[data-ok-popover]:has([data-ok-editor-table-action])",
    ) as HTMLElement;
    expect(menu.hasAttribute("data-ok-open")).toBe(true);
    await expectNoAxeViolations(host);
    item("addRowAfter").click();
    await settle();
    expect(instance.value.match(/<tr>/g)).toHaveLength(4);
    instance.setEditable(false);
    expect(trigger.disabled).toBe(true);
    expect(item("insertTable").getAttribute("aria-disabled")).toBe("true");
    instance.setEditable(true);
    expect(trigger.disabled).toBe(false);
  });
});

describe("editor bubble menu (snippet)", () => {
  const open = async () => {
    const markup = snippet("bubble-menu").replace(
      "data-ok-editor-bubble-menu",
      'data-ok-editor-bubble-menu data-ok-update-delay="0"',
    );
    const page = await setup(markup);
    const bubble = page.root.querySelector("[data-ok-editor-bubble-menu]") as HTMLElement;
    return { ...page, bubble };
  };

  it("shows over the selection, runs its buttons and passes axe", async () => {
    const { host, bubble, instance } = await open();
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    select(instance, "Select some text");
    expect(bubble.hasAttribute("data-ok-open")).toBe(true);
    expectNamedButtons(bubble);
    (bubble.querySelector('[data-ok-editor-action="bold"]') as HTMLButtonElement).click();
    expect(instance.value).toContain("<strong>Select some text</strong>");
    expect(
      bubble.querySelector('[data-ok-editor-action="bold"]')?.getAttribute("aria-pressed"),
    ).toBe("true");
    await expectNoAxeViolations(host);
  });

  it("opens the link form from its link button; Alt+F10 moves focus into it", async () => {
    const { root, bubble, instance, content } = await open();
    select(instance, "Select some text");
    await userEvent.keyboard("{Alt>}{F10}{/Alt}");
    expect(bubble.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(content);
    const link = bubble.querySelector('[data-ok-editor-action="link"]') as HTMLButtonElement;
    link.click();
    await settle();
    const form = root.querySelector('[data-ok-editor-form="link"]') as HTMLElement;
    expect(form.closest("[data-ok-popover]")?.hasAttribute("data-ok-open")).toBe(true);
  });
});

describe("editor mentions (snippet)", () => {
  it("lists the template's people, picks one with Enter and passes axe", async () => {
    const { host, root, content, instance } = await setup(snippet("mentions"));
    const list = root.querySelector("[data-ok-editor-mentions]") as HTMLElement;
    instance.controller.editor.commands.setTextSelection(
      instance.controller.editor.state.doc.content.size - 1,
    );
    instance.controller.editor.view.focus();
    await userEvent.keyboard(" @gr");
    await until(list, () => list.hasAttribute("data-ok-open"));
    const options = () => [...list.querySelectorAll('[role="option"]')].map((o) => o.textContent);
    expect(options()).toEqual(["Grace Hopper"]);
    expect(content.getAttribute("aria-activedescendant")).toBeTruthy();
    await expectNoAxeViolations(host);
    await userEvent.keyboard("{Enter}");
    await until(list, () => !list.hasAttribute("data-ok-open"));
    expect(instance.value).toContain('data-id="grace"');
  });

  it("waits Tiptap's 250 ms without data-ok-update-delay (or with an invalid one)", async () => {
    const markup = snippet("bubble-menu").replace(
      "data-ok-editor-bubble-menu",
      'data-ok-editor-bubble-menu data-ok-update-delay="soon"',
    );
    const { root, instance } = await setup(markup);
    const bubble = root.querySelector("[data-ok-editor-bubble-menu]") as HTMLElement;
    select(instance, "Select some text");
    expect(bubble.hasAttribute("data-ok-open")).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(bubble.hasAttribute("data-ok-open")).toBe(true);
  });

  it("takes items from the event alone, without a template", async () => {
    const markup = snippet("mentions").replace(
      /<template data-ok-editor-mention-items>[\s\S]*?<\/template>/,
      "",
    );
    const { root, instance } = await setup(markup);
    root.addEventListener("ok:editor:mentionsearch", (event) => {
      const { items, respondWith } = (event as CustomEvent).detail;
      expect(items).toEqual([]);
      respondWith([{ id: "x", label: "Xavier" }]);
    });
    const list = root.querySelector("[data-ok-editor-mentions]") as HTMLElement;
    instance.controller.editor.view.focus();
    await userEvent.keyboard("@x");
    await until(list, () => list.hasAttribute("data-ok-open"));
    expect(list.textContent?.trim()).toBe("Xavier");
  });

  it("takes items from ok:editor:mentionsearch", async () => {
    const { root, instance } = await setup(snippet("mentions"));
    root.addEventListener("ok:editor:mentionsearch", (event) => {
      const { query, items, respondWith } = (event as CustomEvent).detail;
      respondWith(Promise.resolve([...items, { id: "server", label: `Server ${query}` }]));
    });
    const list = root.querySelector("[data-ok-editor-mentions]") as HTMLElement;
    instance.controller.editor.view.focus();
    await userEvent.keyboard("@lin");
    await until(list, () => list.querySelectorAll('[role="option"]').length === 2);
    expect(list.textContent).toContain("Server lin");
  });
});

describe("editor settings (attributes and createEditor options)", () => {
  const MARKUP = (attributes: string) => `
    <form id="form">
      <div data-ok-editor ${attributes}>
        <div data-ok-editor-toolbar role="toolbar" aria-label="Formatting"></div>
        <div data-ok-editor-body><div data-ok-editor-content role="textbox" aria-label="Notes"><p>One   two</p></div></div>
        <input type="hidden" data-ok-editor-input name="notes">
      </div>
    </form>`;

  it("submits the value with its form, and reads direction, autofocus and rules", async () => {
    const { host, content, instance } = await setup(
      MARKUP(
        'data-ok-text-direction="rtl" data-ok-autofocus="end" data-ok-enable-input-rules="false" data-ok-enable-paste-rules="false"',
      ),
    );
    const form = host.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("notes")).toBe(instance.value);
    expect(instance.value).toContain('dir="rtl"');
    await until(content, () => document.activeElement === content);
    await userEvent.keyboard("> x");
    expect(instance.value).not.toContain("<blockquote>");
    expect(new FormData(form).get("notes")).toBe(instance.value);
    instance.setValue("<p>New</p>");
    expect(new FormData(form).get("notes")).toBe('<p dir="rtl">New</p>');
    expect(instance.controller.editor.options.enablePasteRules).toBe(false);
  });

  it("passes extensions, editorProps and parseOptions from createEditor()", async () => {
    const Custom = Extension.create({ name: "custom" });
    const definition = createEditor({
      extensions: [Custom],
      editorProps: { attributes: { spellcheck: "false" } },
      parseOptions: { preserveWhitespace: "full" },
    });
    const { content, instance } = await setup(MARKUP(""), definition);
    expect(instance.controller.editor.extensionManager.extensions.map((e) => e.name)).toContain(
      "custom",
    );
    expect(content.getAttribute("spellcheck")).toBe("false");
    expect(instance.value).toContain("One   two");
  });
});
