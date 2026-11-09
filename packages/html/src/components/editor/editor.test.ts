import { isScrollLocked } from "@owlky/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
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
const snippet = snippets[0]?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});
const start = (definition = editor) => {
  runtime = createRuntime()
    .register(...components, definition)
    .start();
  return runtime;
};
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The first editor of the story snippet (the second is its read-only preview). */
const setup = async () => {
  const host = mount(snippet);
  const r = start();
  await settle();
  const root = host.querySelector<HTMLElement>("[data-ok-editor]") as HTMLElement;
  const content = root.querySelector<HTMLElement>("[data-ok-editor-content]") as HTMLElement;
  const instance = r.get<EditorInstance>(root, "editor") as EditorInstance;
  const tool = (action: string) =>
    root.querySelector<HTMLButtonElement>(
      `[data-ok-editor-action="${action}"]`,
    ) as HTMLButtonElement;
  return { host, root, content, instance, tool, runtime: r };
};

async function selectText(content: HTMLElement, text: string) {
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent?.includes(text)) node = walker.nextNode();
  const start = node?.textContent?.indexOf(text) ?? 0;
  content.focus();
  const range = document.createRange();
  range.setStart(node as Node, start);
  range.setEnd(node as Node, start + text.length);
  const selection = document.getSelection() as Selection;
  selection.removeAllRanges();
  selection.addRange(range);
  await frame();
  await frame();
}

describe("editor snippet", () => {
  it("has one story snippet with valid, CSP-safe anatomy", async () => {
    expect(snippets).toHaveLength(1);
    const host = mount(snippet);
    expectCspSafe(host, snippet);
    for (const svg of host.querySelectorAll("svg"))
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    for (const root of host.querySelectorAll("[data-ok-editor]")) {
      const toolbar = root.querySelector("[data-ok-editor-toolbar]");
      const content = root.querySelector("[data-ok-editor-content]");
      expect(toolbar?.getAttribute("role")).toBe("toolbar");
      expect(toolbar?.getAttribute("aria-controls")).toBe(content?.id);
      expect(content?.getAttribute("role")).toBe("textbox");
      for (const button of root.querySelectorAll("[data-ok-editor-toolbar] button"))
        expect(button.getAttribute("aria-label") ?? button.textContent?.trim()).toBeTruthy();
      for (const trigger of root.querySelectorAll("[data-ok-popover-open]"))
        expect(
          root.querySelector(`#${trigger.getAttribute("data-ok-popover-open")}`),
        ).not.toBeNull();
    }
    // Without JavaScript the content is readable markup.
    expect(host.querySelector("[data-ok-editor-content] h4")?.textContent).toBe("Plan the release");
  });

  it("mounts the content markup as an editable textbox and passes axe", async () => {
    const { host, content, instance, root } = await setup();
    expect(content.getAttribute("contenteditable")).toBe("true");
    expect(instance.value).toContain("<h4>Plan the release</h4>");
    expect(content.querySelector("[data-ok-editor-code-block] pre")).not.toBeNull();
    expect(root.querySelector("[data-ok-editor-heading-label]")?.textContent).toBe("Heading 4");
    // The story's preview is Markdown (its own runtime): its source is the editor's HTML.
    expect(host.querySelectorAll("[data-ok-editor]")).toHaveLength(1);
    expect(host.querySelector("[data-ok-markdown-source]")?.textContent).toContain(
      "<h4>Plan the release</h4>",
    );
    // A read-only editor: no editing, toolbar hidden.
    const readOnly = mount(`<div data-ok-editor data-ok-editable="false">
      <div data-ok-editor-toolbar role="toolbar" aria-label="Formatting"></div>
      <div data-ok-editor-body><div data-ok-editor-content role="textbox" aria-label="Read only"><p>Text</p></div></div>
    </div>`);
    await settle();
    const previewContent = readOnly.querySelector("[data-ok-editor-content]") as HTMLElement;
    expect(previewContent.getAttribute("contenteditable")).toBe("false");
    expect(previewContent.getAttribute("aria-readonly")).toBe("true");
    expect(
      getComputedStyle(readOnly.querySelector("[data-ok-editor-toolbar]") as Element).display,
    ).toBe("none");
    expectNamedButtons(root.querySelector("[data-ok-editor-toolbar]") as Element);
    await expectNoAxeViolations(host);
  });

  it("is idempotent and restores plain markup on stop()", async () => {
    const { content, runtime: r, root } = await setup();
    r.init();
    expect(content.querySelectorAll("h4")).toHaveLength(1);
    r.stop();
    runtime = undefined;
    expect(content.hasAttribute("contenteditable")).toBe(false);
    expect(content.getAttribute("role")).toBe("textbox");
    expect(content.querySelector("h4")?.textContent).toBe("Plan the release");
    expect(root.querySelector("[data-ok-editor-code-block]")).toBeNull();
  });

  it("runs toolbar actions, keeps aria-pressed in step and emits changes", async () => {
    const { root, content, tool } = await setup();
    const changes: string[] = [];
    root.addEventListener("ok:editor:change", (event) =>
      changes.push((event as CustomEvent<{ value: string }>).detail.value),
    );
    await selectText(content, "keeps");
    await userEvent.click(tool("italic"));
    expect(content.querySelector("em em, p em")?.textContent).toBeTruthy();
    expect(changes.at(-1)).toContain("<em>keeps</em>");
    expect(tool("italic").getAttribute("aria-pressed")).toBe("true");
    expect(tool("undo").disabled).toBe(false);
    await userEvent.click(tool("undo"));
    expect(changes.at(-1)).not.toContain("<em>keeps</em>");
    await userEvent.click(tool("alignCenter"));
    expect(tool("alignCenter").getAttribute("aria-pressed")).toBe("true");
  });

  it("changes the block from the heading menu", async () => {
    const { root, content } = await setup();
    await selectText(content, "keeps");
    const heading = root.querySelector<HTMLButtonElement>(
      "[data-ok-editor-heading]",
    ) as HTMLButtonElement;
    expect(heading.textContent).toBe("Paragraph");
    await userEvent.click(heading);
    const menu = root.querySelector("[role=menu]") as HTMLElement;
    await userEvent.click(menu.querySelector('[data-ok-editor-block="h2"]') as HTMLElement);
    expect(content.querySelector("h2")?.textContent).toContain("keeps");
    expect(heading.textContent).toBe("Heading 2");
    expect(
      menu.querySelector('[data-ok-editor-block="h2"]')?.hasAttribute("data-ok-selected"),
    ).toBe(true);
    await userEvent.click(heading);
    await userEvent.click(menu.querySelector('[data-ok-editor-block="paragraph"]') as HTMLElement);
    expect(content.querySelector("h2")).toBeNull();
    // Items without a known block do nothing.
    root.dispatchEvent(
      new CustomEvent("ok:menu:select", { bubbles: true, detail: { item: document.body } }),
    );
  });

  it("adds a link through the form, prefilled with the current link", async () => {
    const { root, content, tool } = await setup();
    await selectText(content, "keeps");
    await userEvent.click(tool("link"));
    const form = root.querySelector('[data-ok-editor-form="link"]') as HTMLFormElement;
    const field = form.querySelector("input") as HTMLInputElement;
    const apply = form.querySelector("button[type=submit]") as HTMLButtonElement;
    expect(field.value).toBe("");
    expect(apply.disabled).toBe(true);
    await userEvent.fill(field, "javascript:alert(1)");
    expect(apply.disabled).toBe(true);
    await userEvent.fill(field, "example.com/a");
    expect(apply.disabled).toBe(false);
    await userEvent.click(apply);
    expect(content.querySelector('a[href="https://example.com/a"]')?.textContent).toBe("keeps");
    expect(tool("link").getAttribute("aria-expanded")).toBe("false");
    await selectText(content, "keeps");
    expect(tool("unlink").disabled).toBe(false);
    await userEvent.click(tool("link"));
    expect(field.value).toBe("https://example.com/a");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(tool("unlink"));
    expect(content.querySelector('a[href="https://example.com/a"]')).toBeNull();
  });

  it("inserts an image; an invalid form stays open", async () => {
    const { root, content, tool, instance } = await setup();
    // A known caret (inside the heading), not wherever the engine left the selection.
    instance.controller.editor.commands.setTextSelection(2);
    await userEvent.click(tool("image"));
    const form = root.querySelector('[data-ok-editor-form="image"]') as HTMLFormElement;
    const [src, alt] = form.querySelectorAll("input");
    form.requestSubmit();
    expect(tool("image").getAttribute("aria-expanded")).toBe("true");
    await userEvent.fill(src as HTMLInputElement, "https://example.com/cat.png");
    await userEvent.fill(alt as HTMLInputElement, "A cat");
    // Enter submits too (e2e); WebKit's implicit submission right after fill() is flaky here.
    await userEvent.click(form.querySelector("button[type=submit]") as HTMLButtonElement);
    expect(content.querySelector('img[alt="A cat"]')).not.toBeNull();
    expect(instance.value).toContain('<img src="https://example.com/cat.png" alt="A cat">');
  });

  it("toggles fullscreen with the button, Escape and the instance", async () => {
    const { root, content, tool, instance } = await setup();
    const events: boolean[] = [];
    root.addEventListener("ok:editor:fullscreen", (event) =>
      events.push((event as CustomEvent<{ fullscreen: boolean }>).detail.fullscreen),
    );
    await userEvent.click(tool("fullscreen"));
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(true);
    expect(tool("fullscreen").getAttribute("aria-pressed")).toBe("true");
    expect(instance.fullscreen).toBe(true);
    // The composed Backdrop dims the page behind; the page doesn't scroll.
    const backdrop = root.querySelector(":scope > [data-ok-backdrop]") as HTMLElement;
    expect(backdrop.hasAttribute("data-ok-open")).toBe(true);
    expect(isScrollLocked()).toBe(true);
    content.focus();
    await userEvent.keyboard("{Escape}");
    expect(instance.fullscreen).toBe(false);
    expect(backdrop.hasAttribute("data-ok-open")).toBe(false);
    expect(isScrollLocked()).toBe(false);
    instance.setFullscreen(false);
    instance.setFullscreen(true);
    expect(events).toEqual([true, false, true]);
    await userEvent.click(tool("link"));
    await userEvent.keyboard("{Escape}");
    expect(instance.fullscreen).toBe(true);
  });

  it("keeps Tab inside while fullscreen, also from markup, and releases on stop", async () => {
    const host = mount(
      '<div data-ok-editor data-ok-fullscreen><div data-ok-editor-toolbar role="toolbar" aria-label="Formatting"><button type="button" data-ok-editor-action="bold" aria-label="Bold">B</button></div><div data-ok-editor-body><div data-ok-editor-content role="textbox" aria-label="Notes"><p>x</p></div></div></div><button type="button">Behind</button>',
    );
    start();
    await settle();
    expect(isScrollLocked()).toBe(true);
    const content = host.querySelector<HTMLElement>("[data-ok-editor-content]") as HTMLElement;
    content.focus();
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Bold");
    runtime?.stop();
    runtime = undefined;
    expect(isScrollLocked()).toBe(false);
  });

  it("shows text transforms from markup without a style attribute", async () => {
    const { content, instance } = await setup();
    const span = content.querySelector("span[style]") as HTMLElement;
    expect(getComputedStyle(span).textTransform).toBe("uppercase");
    expect(instance.value).toContain('<span style="text-transform: uppercase;">before</span>');
    expect(instance.value).toContain('<span style="text-transform: capitalize;">upgrade</span>');
  });

  it("offers value, setValue, setEditable and focus", async () => {
    const { root, content, instance, tool } = await setup();
    const onChange = vi.fn();
    root.addEventListener("ok:editor:change", onChange);
    instance.setValue("<p>Replaced</p>");
    expect(content.textContent).toBe("Replaced");
    expect(onChange).not.toHaveBeenCalled();
    instance.setEditable(false);
    expect(root.getAttribute("data-ok-editable")).toBe("false");
    expect(content.getAttribute("contenteditable")).toBe("false");
    expect(tool("bold").disabled).toBe(true);
    instance.setEditable(true);
    expect(root.hasAttribute("data-ok-editable")).toBe(false);
    expect(tool("bold").disabled).toBe(false);
    instance.focus();
    await frame();
    expect(document.activeElement).toBe(content);
    expect(instance.controller.editor.isEditable).toBe(true);
  });

  it("moves through the toolbar with the arrow keys", async () => {
    const { root, tool } = await setup();
    const heading = root.querySelector<HTMLButtonElement>(
      "[data-ok-editor-heading]",
    ) as HTMLButtonElement;
    expect(heading.tabIndex).toBe(0);
    heading.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tool("bold"));
  });

  it("highlights code with createEditor({ highlighter }) and reads data-ok-placeholder", async () => {
    const host = mount(
      `<div data-ok-editor data-ok-placeholder="Type here"><div data-ok-editor-toolbar role="toolbar" aria-label="Formatting"><button type="button" data-ok-editor-action="nope" aria-label="Unknown">?</button></div><div data-ok-editor-body><div data-ok-editor-content role="textbox" aria-label="Code"><pre><code class="language-js">let</code></pre></div></div></div>
      <div data-ok-editor><div data-ok-editor-toolbar role="toolbar" aria-label="Formatting"></div><div data-ok-editor-body><div data-ok-editor-content role="textbox" aria-label="Empty"></div></div></div>`,
    );
    start(
      createEditor({
        highlighter: {
          listLanguages: () => ["js"],
          registered: () => true,
          highlight: (_l, value) => ({
            type: "root",
            children: [
              {
                type: "element",
                properties: { className: ["hljs-keyword"] },
                children: [{ type: "text", value }],
              },
            ],
          }),
          highlightAuto: (value) => ({ type: "root", children: [{ type: "text", value }] }),
        },
      }),
    );
    await settle();
    expect(host.querySelector(".hljs-keyword")?.textContent).toBe("let");
    (host.querySelector('[data-ok-editor-action="nope"]') as HTMLElement).click();
    const empty = host.querySelectorAll("[data-ok-editor-content]")[1] as HTMLElement;
    expect(empty.querySelector("p")?.getAttribute("data-placeholder")).toBe(
      "Write something awesome...",
    );
  });

  it("tolerates partial custom markup", async () => {
    const host = mount(`<div data-ok-editor>
      <div data-ok-editor-toolbar role="toolbar" aria-label="Formatting"><button type="button" data-ok-editor-heading aria-label="Block"></button></div>
      <div data-ok-editor-body><div data-ok-editor-content role="textbox" aria-label="Notes"><ul><li><p>Item</p></li></ul></div></div>
      <form data-ok-editor-form="link"><input aria-label="Other"></form>
      <form data-ok-editor-form="image"><button type="submit">Apply</button></form>
      <div data-plain><input aria-label="Plain"></div>
    </div>`);
    const r = start();
    await settle();
    const root = host.querySelector("[data-ok-editor]") as HTMLElement;
    const instance = r.get<EditorInstance>(root, "editor") as EditorInstance;
    const [link, image] = root.querySelectorAll("form");
    const plain = root.querySelector("[data-plain]");
    for (const form of [link, image, plain]) {
      form?.querySelector("input, button")?.dispatchEvent(new Event("input", { bubbles: true }));
      form?.dispatchEvent(new Event("ok:popover:open", { bubbles: true }));
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
    expect((image as HTMLFormElement).querySelector("button")?.disabled).toBe(true);
    expect(instance.value).toContain("<p>Item</p>");
    expect(instance.value).not.toMatch(/<a |<img/);
    instance.controller.editor.commands.setTextSelection(3);
    expect(instance.controller.getState().block).toBe("other");
  });

  it("refuses markup without content or toolbar", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<div data-ok-editor></div>`);
    start();
    await settle();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
