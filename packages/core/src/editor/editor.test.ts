import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import type { EditorHighlighter, HighlightNode } from "./code-block.js";
import { createEditorController, type EditorController } from "./editor.js";
import { editorIcons } from "./icons.js";
import {
  createToolbarNavigation,
  editorActions,
  editorBlockLabels,
  editorToolbar,
  safeEditorUrl,
} from "./toolbar.js";

let controller: EditorController | undefined;
afterEach(() => {
  controller?.destroy();
  controller = undefined;
  cleanupDom();
});

const content = (html = "") =>
  mount(`<div data-ok-editor-content role="textbox">${html}</div>`)
    .firstElementChild as HTMLElement;

const create = (
  element: HTMLElement,
  options: Parameters<typeof createEditorController>[1] = {},
) => {
  controller = createEditorController(element, options);
  return controller;
};

/** Selects the text `text` (first match) in the editor. */
const select = (c: EditorController, text: string) => {
  let from = -1;
  c.editor.state.doc.descendants((node, position) => {
    if (from < 0 && node.isText && node.text?.includes(text)) {
      from = position + (node.text?.indexOf(text) ?? 0);
    }
  });
  c.editor.commands.setTextSelection({ from, to: from + text.length });
};

describe("safeEditorUrl", () => {
  it.each([
    ["https://example.com/a?b#c", "https://example.com/a?b#c"],
    ["  http://example.com ", "http://example.com"],
    ["mailto:hi@example.com", "mailto:hi@example.com"],
    ["tel:+123", "tel:+123"],
    ["/docs", "/docs"],
    ["./a", "./a"],
    ["../a", "../a"],
    ["#top", "#top"],
    ["?q=1", "?q=1"],
    ["example.com/path", "https://example.com/path"],
    ["sub.example.co:8080", "https://sub.example.co:8080"],
  ])("accepts %s", (input, output) => expect(safeEditorUrl(input)).toBe(output));

  it.each([
    "",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "java\nscript:alert(1)",
    " \tjavascript:alert(1)",
    "data:text/html,<script>",
    "vbscript:x",
    "//evil.example",
    'https://a.example/"><img onerror=x>',
    "plain words",
    "localhost",
    `https://${"a".repeat(2050)}.example`,
  ])("refuses %j", (input) => expect(safeEditorUrl(input)).toBeNull());

  it("allows only http(s) and relative image sources", () => {
    expect(safeEditorUrl("https://example.com/a.png", "image")).toBe("https://example.com/a.png");
    expect(safeEditorUrl("/a.png", "image")).toBe("/a.png");
    expect(safeEditorUrl("mailto:a@example.com", "image")).toBeNull();
    expect(safeEditorUrl("data:image/png;base64,AAAA", "image")).toBeNull();
  });
});

describe("icons", () => {
  it("draws every toolbar button", () => {
    for (const group of editorToolbar)
      for (const { action } of group.buttons)
        expect(editorIcons[action === "fullscreen" ? "fullscreen" : action]).toMatch(/^M/);
    expect(editorIcons.exitFullscreen).toMatch(/^M/);
    expect(editorIcons.chevronDown).toMatch(/^M/);
  });
});

describe("toolbar table", () => {
  it("names every button and covers every action except the block ones", () => {
    const actions = editorToolbar.flatMap((group) => group.buttons.map((button) => button.action));
    expect(new Set(actions).size).toBe(actions.length);
    for (const action of editorActions) {
      if (action === "paragraph" || action === "heading") continue;
      expect(actions).toContain(action);
    }
    expect(actions).toContain("fullscreen");
    for (const group of editorToolbar)
      for (const button of group.buttons) expect(button.label).not.toMatch(/[⌘⇧⌥]/);
    expect(Object.values(editorBlockLabels)).toHaveLength(7);
  });
});

describe("createEditorController", () => {
  it("parses the markup already in the element and mounts on it", () => {
    const element = content("<h4>Title</h4><p><strong>Bold</strong> text</p>");
    const c = create(element);
    expect(element.getAttribute("contenteditable")).toBe("true");
    expect(element.getAttribute("role")).toBe("textbox");
    expect(element.querySelector("h4")?.textContent).toBe("Title");
    expect(c.getValue()).toBe("<h4>Title</h4><p><strong>Bold</strong> text</p>");
    expect(document.head.querySelector("style[data-tiptap-style]")).toBeNull();
  });

  it("drops scripts, handlers and unsafe links from loaded content", () => {
    const element = content(
      '<p onclick="x()">A <a href="javascript:alert(1)">bad</a> <a href="https://ok.example">good</a></p><script>window.pwned = 1</script><img src="x" onerror="window.pwned = 1">',
    );
    const c = create(element);
    const value = c.getValue();
    expect(value).not.toMatch(/onclick|onerror|javascript:|<script/);
    expect(value).toContain('href="https://ok.example"');
    expect((window as { pwned?: number }).pwned).toBeUndefined();
  });

  it("takes an HTML string and reports an empty editor as an empty string", () => {
    const element = content("<p>ignored</p>");
    const c = create(element, { content: "" });
    expect(element.textContent).toBe("");
    expect(c.getValue()).toBe("");
    expect(c.getState().empty).toBe(true);
    c.setContent("<p>Hi</p>");
    expect(c.getValue()).toBe("<p>Hi</p>");
  });

  it("shows the placeholder in the empty first paragraph", () => {
    const element = content();
    create(element, { content: "", placeholder: "Write here" });
    expect(element.querySelector("p")?.getAttribute("data-placeholder")).toBe("Write here");
  });

  it("reports changes and state", () => {
    const onChange = vi.fn();
    const onStateChange = vi.fn();
    const c = create(content("<p>Hello world</p>"), { onChange, onStateChange });
    select(c, "Hello");
    expect(onStateChange).toHaveBeenCalled();
    expect(c.run("bold")).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> world</p>");
    expect(c.getState().active.bold).toBe(true);
    expect(c.getState().disabled.undo).toBe(false);
    expect(c.getState().disabled.redo).toBe(true);
    expect(c.getState().disabled.unlink).toBe(true);
  });

  it.each([
    ["bold", "<strong>"],
    ["italic", "<em>"],
    ["underline", "<u>"],
    ["strike", "<s>"],
    ["code", "<code>"],
  ] as const)("toggles %s", (action, tag) => {
    const c = create(content("<p>Hello world</p>"));
    select(c, "Hello");
    c.run(action);
    expect(c.getValue()).toContain(`${tag}Hello`);
    expect(c.getState().active[action]).toBe(true);
    c.run(action);
    expect(c.getValue()).toBe("<p>Hello world</p>");
  });

  it.each([
    ["bulletList", "<ul>"],
    ["orderedList", "<ol>"],
    ["blockquote", "<blockquote>"],
    ["codeBlock", "<pre>"],
  ] as const)("toggles the %s block", (action, tag) => {
    const c = create(content("<p>Hello</p>"));
    select(c, "Hello");
    c.run(action);
    expect(c.getValue()).toContain(tag);
    expect(c.getState().active[action]).toBe(true);
    expect(c.getState().block).toBe("other");
  });

  it("sets headings and paragraphs (and ignores invalid levels)", () => {
    const c = create(content("<p>Title</p>"));
    select(c, "Title");
    expect(c.run("heading", { level: 2 })).toBe(true);
    // Tiptap's trailing node keeps an empty paragraph after a last block that isn't one.
    expect(c.getValue()).toBe("<h2>Title</h2><p></p>");
    expect(c.getState().block).toBe("h2");
    expect(c.getState().active.heading).toBe(true);
    expect(c.run("heading", { level: 9 })).toBe(false);
    expect(c.run("heading")).toBe(false);
    c.run("paragraph");
    expect(c.getValue()).toBe("<p>Title</p><p></p>");
    expect(c.getState().block).toBe("paragraph");
    expect(c.getState().active.paragraph).toBe(true);
  });

  it.each([
    ["alignLeft", "left"],
    ["alignCenter", "center"],
    ["alignRight", "right"],
    ["alignJustify", "justify"],
  ] as const)("%s aligns and toggles back", (action, value) => {
    const c = create(content("<p>Text</p>"));
    select(c, "Text");
    c.run(action);
    expect(c.getValue()).toBe(`<p style="text-align: ${value};">Text</p>`);
    expect(c.getState().active[action]).toBe(true);
    c.run(action);
    expect(c.getValue()).toBe("<p>Text</p>");
  });

  it("inserts rules, line breaks and clears formatting", () => {
    const c = create(content("<h3><strong>Big</strong></h3>"));
    select(c, "Big");
    c.run("clearFormat");
    expect(c.getValue()).toBe("<p>Big</p><p></p>");
    c.editor.commands.setTextSelection(2);
    c.run("hardBreak");
    expect(c.getValue()).toContain("<br>");
    c.run("horizontalRule");
    expect(c.getValue()).toContain("<hr>");
  });

  it("clears formatting with Mod-Shift-X", () => {
    const c = create(content("<p><em>Slanted</em></p>"));
    select(c, "Slanted");
    c.editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key: "x", ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    c.editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", { key: "x", metaKey: true, shiftKey: true, bubbles: true }),
    );
    expect(c.getValue()).toBe("<p>Slanted</p>");
  });

  it("undoes and redoes", () => {
    const c = create(content("<p>Text</p>"));
    select(c, "Text");
    c.run("italic");
    expect(c.run("undo")).toBe(true);
    expect(c.getValue()).toBe("<p>Text</p>");
    expect(c.getState().disabled.redo).toBe(false);
    expect(c.run("redo")).toBe(true);
    expect(c.getValue()).toBe("<p><em>Text</em></p>");
  });

  it("links the selection, inserts a link at the caret, edits and removes it", () => {
    const c = create(content("<p>Read more</p>"));
    select(c, "more");
    expect(c.run("link", { href: "javascript:alert(1)" })).toBe(false);
    expect(c.run("link")).toBe(false);
    expect(c.run("link", { href: "example.com" })).toBe(true);
    expect(c.getValue()).toContain(
      '<a target="_blank" rel="noopener noreferrer nofollow" href="https://example.com">more</a>',
    );
    c.editor.commands.setTextSelection(8);
    expect(c.getState().link).toBe("https://example.com");
    expect(c.getState().disabled.unlink).toBe(false);
    expect(c.run("link", { href: "/docs" })).toBe(true);
    expect(c.getValue()).toContain('href="/docs">more</a>');
    expect(c.run("unlink")).toBe(true);
    expect(c.getValue()).toBe("<p>Read more</p>");
    c.editor.commands.setTextSelection(1);
    c.run("link", { href: "https://a.example" });
    expect(c.getValue()).toContain('href="https://a.example">https://a.example</a>Read');
  });

  it("inserts images with a text alternative, refusing unsafe sources", () => {
    const c = create(content("<p>Photo</p>"));
    expect(c.run("image", { src: "data:image/png;base64,AAAA" })).toBe(false);
    expect(c.run("image")).toBe(false);
    expect(c.run("image", { src: "https://example.com/a.png", alt: " A cat " })).toBe(true);
    expect(c.getValue()).toContain('<img src="https://example.com/a.png" alt="A cat">');
  });

  it("refuses unknown actions", () => {
    const c = create(content("<p>x</p>"));
    expect(c.run("nope" as never)).toBe(false);
  });

  it("switches to read only and back", () => {
    const element = content("<p>Text</p>");
    const onStateChange = vi.fn();
    const c = create(element, { editable: false, onStateChange });
    expect(element.getAttribute("contenteditable")).toBe("false");
    expect(element.getAttribute("aria-readonly")).toBe("true");
    expect(c.getState().editable).toBe(false);
    expect(Object.values(c.getState().disabled).every(Boolean)).toBe(true);
    expect(c.run("bold")).toBe(false);
    c.setEditable(false);
    expect(onStateChange).not.toHaveBeenCalled();
    c.setEditable(true);
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(element.getAttribute("contenteditable")).toBe("true");
    expect(element.hasAttribute("aria-readonly")).toBe(false);
  });

  it("focuses and destroys, optionally restoring the content as markup", async () => {
    const element = content("<p>Kept <em>here</em></p>");
    const c = create(element);
    c.focus();
    // Tiptap focuses on the next frame.
    await nextFrame();
    expect(document.activeElement).toBe(element);
    c.destroy({ restore: true });
    expect(element.hasAttribute("contenteditable")).toBe(false);
    expect(element.hasAttribute("class")).toBe(false);
    expect(element.getAttribute("role")).toBe("textbox");
    expect(element.querySelector("em")?.textContent).toBe("here");
    // Calls after destroy do nothing.
    c.destroy();
    c.focus();
    c.setContent("<p>x</p>");
    c.setEditable(false);
    expect(c.run("bold")).toBe(false);
    controller = undefined;
    const other = content("<p>Gone</p>");
    createEditorController(other).destroy();
    expect(other.childNodes).toHaveLength(0);
  });
});

describe("code blocks", () => {
  const text = (value: string): HighlightNode => ({ type: "text", value });
  const highlighter: EditorHighlighter = {
    listLanguages: () => ["javascript", "css"],
    registered: (language) => language === "javascript" || language === "css",
    highlight: (_language, value) => ({
      type: "root",
      children: [
        {
          type: "element",
          properties: { className: ["hljs-keyword"] },
          children: [text(value.slice(0, 5))],
        },
        {
          type: "element",
          properties: { className: "not-an-array" },
          children: [text(value.slice(5))],
        },
        { type: "text" },
        { type: "element" },
      ],
    }),
    highlightAuto: (value) => ({ type: "root", children: [text(value)] }),
  };

  it("renders a plain code block without a highlighter", () => {
    const element = content('<pre><code class="language-css">a {}</code></pre>');
    const c = create(element);
    const block = element.querySelector("[data-ok-editor-code-block]");
    expect(block?.querySelector("select")).toBeNull();
    expect(block?.querySelector("pre > code")?.className).toBe("language-css");
    expect(c.getValue()).toBe('<pre><code class="language-css">a {}</code></pre>');
  });

  it("highlights, lists languages and changes the language", () => {
    const element = content('<pre><code class="language-javascript">const a = 1;</code></pre>');
    const c = create(element, { highlighter });
    const select = element.querySelector<HTMLSelectElement>("[data-ok-editor-language]");
    expect(select?.getAttribute("aria-label")).toBe("Language");
    expect([...(select?.options ?? [])].map((o) => o.value)).toEqual(["", "javascript", "css"]);
    expect(select?.value).toBe("javascript");
    expect(element.querySelector(".hljs-keyword")?.textContent).toBe("const");
    (select as HTMLSelectElement).value = "";
    select?.dispatchEvent(new Event("change"));
    expect(c.getValue()).toBe("<pre><code>const a = 1;</code></pre><p></p>");
    expect(element.querySelector("pre > code")?.hasAttribute("class")).toBe(false);
    expect(element.querySelector(".hljs-keyword")).toBeNull();
    (select as HTMLSelectElement).value = "css";
    select?.dispatchEvent(new Event("change"));
    expect(c.getValue()).toBe('<pre><code class="language-css">const a = 1;</code></pre><p></p>');
    // Typing re-highlights; selection changes keep the decorations.
    c.editor.commands.setTextSelection(2);
    c.editor.commands.insertContent("x");
    expect(element.querySelector(".hljs-keyword")).not.toBeNull();
    // Leaving the code block replaces the node view.
    c.run("codeBlock");
    expect(element.querySelector("[data-ok-editor-code-block]")).toBeNull();
  });

  it("keeps the language menu's own events and mutations out of the document", async () => {
    const element = content('<pre><code class="language-css">a</code></pre>');
    const c = create(element, { highlighter });
    const select = element.querySelector("select") as HTMLSelectElement;
    const block = element.querySelector("[data-ok-editor-code-block]") as HTMLElement;
    const before = c.getValue();
    select.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    select.setAttribute("data-test", "1");
    block.setAttribute("data-test", "1");
    await nextFrame();
    expect(c.getValue()).toBe(before);
    expect(element.querySelector("select")).toBe(select);
  });

  it("lets the plain code block's events and mutations through to ProseMirror", async () => {
    const element = content("<pre><code>a</code></pre>");
    const c = create(element);
    const block = element.querySelector("[data-ok-editor-code-block]") as HTMLElement;
    block.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    block.setAttribute("data-test", "1");
    await nextFrame();
    expect(c.getValue()).toBe("<pre><code>a</code></pre>");
  });

  it("updates a plain code block's language class and refuses other node types", () => {
    const element = content("<pre><code>a</code></pre>");
    const c = create(element);
    c.editor.commands.setTextSelection(1);
    c.editor.commands.updateAttributes("codeBlock", { language: "css" });
    expect(element.querySelector("pre > code")?.className).toBe("language-css");
    const node = c.editor.state.doc.firstChild as NonNullable<typeof c.editor.state.doc.firstChild>;
    const make = c.editor.extensionManager.nodeViews["codeBlock"] as unknown as (
      ...args: unknown[]
    ) => { update(node: unknown): boolean };
    const view = make(node, c.editor.view, () => 0, [], []);
    expect(view.update(c.editor.schema.nodes["paragraph"]?.create())).toBe(false);
  });

  it("ignores a language change after the editor is gone", () => {
    const element = content("<pre><code>a</code></pre>");
    const c = create(element, { highlighter });
    const select = element.querySelector("select") as HTMLSelectElement;
    c.editor.view.destroy();
    select.value = "css";
    expect(() => select.dispatchEvent(new Event("change"))).not.toThrow();
  });

  it("survives a highlighter that throws", () => {
    const element = content("<pre><code>x</code></pre>");
    create(element, {
      highlighter: {
        ...highlighter,
        highlightAuto: () => {
          throw new Error("grammar");
        },
      },
    });
    expect(element.querySelector("pre")?.textContent).toBe("x");
  });
});

describe("createToolbarNavigation", () => {
  const toolbar = () =>
    mount(`<div role="toolbar">
      <button type="button" id="a">A</button>
      <button type="button" id="b" disabled>B</button>
      <button type="button" id="c">C</button>
      <button type="button" id="hidden" hidden>H</button>
      <button type="button" id="d">D</button>
      <div data-ok-popover><button type="button" id="inside">I</button></div>
    </div>`).firstElementChild as HTMLElement;
  const key = (target: Element, name: string) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }),
    );
  const byId = (id: string) => document.getElementById(id) as HTMLElement;

  it("keeps one tab stop and moves it with the arrow keys, Home and End", () => {
    const element = toolbar();
    const navigation = createToolbarNavigation(element);
    expect(byId("a").tabIndex).toBe(0);
    expect(byId("c").tabIndex).toBe(-1);
    expect(byId("inside").hasAttribute("tabindex")).toBe(false);
    byId("a").focus();
    key(byId("a"), "ArrowRight");
    expect(document.activeElement?.id).toBe("c");
    key(byId("c"), "ArrowRight");
    expect(document.activeElement?.id).toBe("d");
    key(byId("d"), "ArrowRight");
    expect(document.activeElement?.id).toBe("a");
    key(byId("a"), "ArrowLeft");
    expect(document.activeElement?.id).toBe("d");
    key(byId("d"), "Home");
    expect(document.activeElement?.id).toBe("a");
    key(byId("a"), "End");
    expect(document.activeElement?.id).toBe("d");
    expect(byId("d").tabIndex).toBe(0);
    expect(byId("a").tabIndex).toBe(-1);
    expect(key(byId("d"), "x")).toBe(true);
    // Keys from elements that aren't toolbar items are ignored.
    expect(key(byId("inside"), "ArrowRight")).toBe(true);
    byId("c").focus();
    expect(byId("c").tabIndex).toBe(0);
    byId("inside").focus();
    expect(byId("c").tabIndex).toBe(0);
    // A disabled current item hands the tab stop to the first enabled one.
    (byId("c") as HTMLButtonElement).disabled = true;
    navigation.sync();
    expect(byId("a").tabIndex).toBe(0);
    navigation.destroy();
    key(byId("a"), "ArrowRight");
    expect(byId("a").tabIndex).toBe(0);
  });

  it("works with no enabled item", () => {
    const element = mount(`<div role="toolbar"><button type="button" disabled>A</button></div>`)
      .firstElementChild as HTMLElement;
    const navigation = createToolbarNavigation(element);
    expect(element.querySelector("button")?.tabIndex).toBe(-1);
    navigation.destroy();
  });
});
