import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Editor, type EditorHighlighter } from "./editor.js";

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const textbox = (name = "Notes") => screen.getByRole("textbox", { name });
const tool = (name: string) => screen.getByRole("button", { name });

/** Selects `text` (first match) through the DOM, like a user drag. */
async function selectText(text: string) {
  const root = textbox();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent?.includes(text)) node = walker.nextNode();
  const start = node?.textContent?.indexOf(text) ?? 0;
  root.focus();
  const range = document.createRange();
  range.setStart(node as Node, start);
  range.setEnd(node as Node, start + text.length);
  const selection = document.getSelection() as Selection;
  selection.removeAllRanges();
  selection.addRange(range);
  // ProseMirror reads the DOM selection on selectionchange.
  await frame();
  await frame();
}

function Controlled({
  refuse = false,
  onChange,
}: {
  refuse?: boolean;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState("<p>Hello world</p>");
  return (
    <>
      <Editor
        aria-label="Notes"
        value={value}
        onChange={(next) => {
          onChange?.(next);
          if (!refuse) setValue(next);
        }}
      />
      <output data-testid="value">{value}</output>
      <button type="button" onClick={() => setValue("<p>Reset</p>")}>
        Reset
      </button>
    </>
  );
}

/** The owner accepts every change, but late (after more keys were typed). */
function Lagging() {
  const [value, setValue] = useState("<p>Hi</p>");
  return (
    <Editor
      aria-label="Notes"
      value={value}
      onChange={(next) => setTimeout(() => setValue(next), 40)}
    />
  );
}

describe("Editor", () => {
  it("renders the anatomy: toolbar, textbox, menu and form popovers", async () => {
    const { container } = render(<Editor aria-label="Notes" defaultValue="<p>Hi</p>" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-ok-editor")).toBe(true);
    expect(root.getAttribute("data-ok-runtime")).toBe("off");
    expect(root.hasAttribute("data-ok-full-item")).toBe(false);
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    expect(toolbar.getAttribute("aria-controls")).toBe(textbox().id);
    expect(textbox().getAttribute("contenteditable")).toBe("true");
    expect(textbox().getAttribute("aria-multiline")).toBe("true");
    expect(textbox().textContent).toBe("Hi");
    expect(root.querySelectorAll("[data-ok-editor-group][data-ok-full]")).toHaveLength(3);
    expect(root.querySelector("[role=menu]")?.getAttribute("aria-labelledby")).toBe(
      root.querySelector("[data-ok-editor-heading]")?.id,
    );
    expect(root.querySelectorAll("[data-ok-popover][role=dialog]")).toHaveLength(2);
    await expectNoAxeViolations(container);
  });

  it("writes the options", () => {
    const { container } = render(
      <Editor
        aria-label="Notes"
        fullItem
        error
        helperText="Required"
        className="x"
        style={{ width: 300 }}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-ok-full-item")).toBe(true);
    expect(root.hasAttribute("data-ok-error")).toBe(true);
    expect(root.className).toBe("x");
    expect(root.style.width).toBe("300px");
    const helper = screen.getByText("Required");
    expect(textbox().getAttribute("aria-describedby")).toBe(helper.id);
    expect(textbox().getAttribute("aria-invalid")).toBe("true");
  });

  it("names the textbox Editor by default, or by aria-labelledby", () => {
    render(
      <>
        <Editor />
        <h2 id="t">Title</h2>
        <Editor aria-labelledby="t" />
      </>,
    );
    expect(screen.getByRole("textbox", { name: "Editor" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Title" }).hasAttribute("aria-label")).toBe(false);
  });

  it("formats the selection from the toolbar and reports the HTML", async () => {
    const onChange = vi.fn();
    render(<Editor aria-label="Notes" defaultValue="<p>Hello world</p>" onChange={onChange} />);
    await selectText("Hello");
    await userEvent.click(tool("Bold"));
    expect(onChange).toHaveBeenLastCalledWith("<p><strong>Hello</strong> world</p>");
    expect(tool("Bold").getAttribute("aria-pressed")).toBe("true");
    expect(tool("Italic").getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(tool("Bullet list"));
    expect(onChange).toHaveBeenLastCalledWith(
      "<ul><li><p><strong>Hello</strong> world</p></li></ul><p></p>",
    );
  });

  it("is controlled: applies new values, keeps edits the owner ignores", async () => {
    const onChange = vi.fn();
    render(<Controlled refuse onChange={onChange} />);
    await selectText("Hello");
    await userEvent.click(tool("Italic"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(textbox().querySelector("em")).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(textbox().textContent).toBe("Reset");
  });

  it("ignores late echoes of values it reported while typing on", async () => {
    render(<Lagging />);
    // `commands` is bound to the current state: read it for every command.
    const { editor } = textbox() as unknown as {
      editor: { commands: { setTextSelection(p: number): void; insertContent(t: string): void } };
    };
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    editor.commands.setTextSelection(3);
    editor.commands.insertContent("a");
    await wait(20);
    editor.commands.insertContent("b");
    // The echo of "Hia" arrives here, while the editor already holds "Hiab".
    await wait(30);
    editor.commands.insertContent("c");
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(textbox().textContent).toBe("Hiabc");
  });

  it("follows accepted changes without re-setting the content", async () => {
    render(<Controlled />);
    await selectText("world");
    await userEvent.click(tool("Underline"));
    expect(screen.getByTestId("value").textContent).toBe("<p>Hello <u>world</u></p>");
    expect(textbox().querySelector("u")?.textContent).toBe("world");
  });

  it("changes the block from the heading menu", async () => {
    render(<Editor aria-label="Notes" defaultValue="<p>Title</p>" />);
    await selectText("Title");
    const heading = screen.getByRole("button", { name: "Paragraph" });
    await userEvent.click(heading);
    expect(heading.getAttribute("aria-expanded")).toBe("true");
    const item = screen.getByRole("menuitem", { name: "Heading 3" });
    await userEvent.click(item);
    expect(textbox().querySelector("h3")?.textContent).toBe("Title");
    expect(screen.getByRole("button", { name: "Heading 3" })).toBe(heading);
    await userEvent.click(heading);
    expect(
      screen.getByRole("menuitem", { name: "Heading 3" }).hasAttribute("data-ok-selected"),
    ).toBe(true);
    await userEvent.click(screen.getByRole("menuitem", { name: "Paragraph" }));
    expect(textbox().querySelector("h3")).toBeNull();
    await userEvent.click(heading);
    await userEvent.click(heading);
    expect(heading.getAttribute("aria-expanded")).toBe("false");
  });

  it("adds, edits and removes a link through the link form", async () => {
    render(<Editor aria-label="Notes" defaultValue="<p>Read more</p>" />);
    await selectText("more");
    const button = tool("Insert link");
    await userEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const dialog = screen.getByRole("dialog", { name: "Link URL" });
    const field = screen.getByRole("textbox", { name: "Link URL" }) as HTMLInputElement;
    const apply = () => dialog.querySelector("button[type=submit]") as HTMLButtonElement;
    expect(apply().disabled).toBe(true);
    await userEvent.fill(field, "javascript:alert(1)");
    expect(apply().disabled).toBe(true);
    await userEvent.fill(field, "example.com");
    expect(apply().disabled).toBe(false);
    await userEvent.click(apply());
    const link = textbox().querySelector("a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    // The form opens with the current link.
    await selectText("more");
    expect(tool("Remove link").hasAttribute("disabled")).toBe(false);
    await userEvent.click(button);
    expect((screen.getByRole("textbox", { name: "Link URL" }) as HTMLInputElement).value).toBe(
      "https://example.com",
    );
    await userEvent.click(button);
    await userEvent.click(tool("Remove link"));
    expect(textbox().querySelector("a")).toBeNull();
  });

  it("inserts an image with its text alternative; Enter submits", async () => {
    const onChange = vi.fn();
    render(<Editor aria-label="Notes" defaultValue="<p>Photo</p>" onChange={onChange} />);
    await userEvent.click(tool("Insert image"));
    const url = screen.getByRole("textbox", { name: "Image URL" });
    await userEvent.fill(url, "https://example.com/cat.png");
    await userEvent.fill(screen.getByRole("textbox", { name: "Alt text" }), "A cat");
    await userEvent.type(url, "{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining('<img src="https://example.com/cat.png" alt="A cat">'),
    );
    expect(tool("Insert image").getAttribute("aria-expanded")).toBe("false");
  });

  it("does not run an invalid form", async () => {
    render(<Editor aria-label="Notes" defaultValue="<p>Photo</p>" />);
    await userEvent.click(tool("Insert image"));
    const form = document.querySelector("[data-ok-editor-form=image]") as HTMLFormElement;
    act(() => form.requestSubmit());
    expect(tool("Insert image").getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard("{Escape}");
    expect(tool("Insert image").getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles fullscreen with the button and leaves it with Escape", async () => {
    const onFullscreenChange = vi.fn();
    const { container } = render(
      <Editor aria-label="Notes" onFullscreenChange={onFullscreenChange} onKeyDown={() => {}} />,
    );
    const root = container.firstElementChild as HTMLElement;
    await userEvent.click(tool("Fullscreen"));
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(true);
    expect(tool("Fullscreen").getAttribute("aria-pressed")).toBe("true");
    expect(getComputedStyle(root).position).toBe("fixed");
    textbox().focus();
    await userEvent.keyboard("{Escape}");
    expect(root.hasAttribute("data-ok-fullscreen")).toBe(false);
    expect(onFullscreenChange.mock.calls).toEqual([[true], [false]]);
    await userEvent.keyboard("{Escape}");
    expect(onFullscreenChange).toHaveBeenCalledTimes(2);
  });

  it("keeps fullscreen when Escape closes a popover", async () => {
    const { container } = render(<Editor aria-label="Notes" />);
    await userEvent.click(tool("Fullscreen"));
    await userEvent.click(tool("Insert link"));
    await userEvent.keyboard("{Escape}");
    expect((container.firstElementChild as HTMLElement).hasAttribute("data-ok-fullscreen")).toBe(
      true,
    );
  });

  it("runs every toolbar button", async () => {
    render(<Editor aria-label="Notes" fullItem defaultValue="<p>Text</p>" />);
    await selectText("Text");
    for (const name of [
      "Align center",
      "Strikethrough",
      "Code",
      "Line break",
      "Clear formatting",
    ]) {
      await userEvent.click(tool(name));
    }
    await userEvent.click(tool("Blockquote"));
    expect(textbox().querySelector("blockquote")).not.toBeNull();
    await userEvent.click(tool("Undo"));
    expect(textbox().querySelector("blockquote")).toBeNull();
    await userEvent.click(tool("Redo"));
    expect(textbox().querySelector("blockquote")).not.toBeNull();
    await userEvent.click(tool("Horizontal rule"));
    expect(textbox().querySelector("hr")).not.toBeNull();
  });

  it("is one tab stop: arrow keys move through the toolbar", async () => {
    render(<Editor aria-label="Notes" />);
    const heading = screen.getByRole("button", { name: "Paragraph" });
    heading.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tool("Bold"));
    expect(tool("Bold").tabIndex).toBe(0);
    expect(heading.tabIndex).toBe(-1);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(tool("Fullscreen"));
  });

  it("is read only with editable={false} and can switch back", async () => {
    const { container, rerender } = render(
      <Editor aria-label="Notes" editable={false} defaultValue="<p>Text</p>" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-ok-editable")).toBe("false");
    expect(textbox().getAttribute("contenteditable")).toBe("false");
    expect(textbox().getAttribute("aria-readonly")).toBe("true");
    expect(
      getComputedStyle(root.querySelector("[data-ok-editor-toolbar]") as Element).display,
    ).toBe("none");
    rerender(<Editor aria-label="Notes" defaultValue="<p>Text</p>" />);
    expect(textbox().getAttribute("contenteditable")).toBe("true");
    expect(tool("Bold").hasAttribute("disabled")).toBe(false);
  });

  it("highlights code with a highlighter", () => {
    const highlighter: EditorHighlighter = {
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
    };
    render(
      <Editor
        aria-label="Notes"
        fullItem
        highlighter={highlighter}
        defaultValue='<pre><code class="language-js">let</code></pre>'
      />,
    );
    expect(textbox().querySelector(".hljs-keyword")?.textContent).toBe("let");
    expect(screen.getByRole("combobox", { name: "Language" })).toBeTruthy();
  });

  it("unmounts cleanly in StrictMode and renders on the server", () => {
    const { unmount } = render(
      <StrictMode>
        <Editor aria-label="Notes" defaultValue="<p>Strict</p>" />
      </StrictMode>,
    );
    expect(textbox().textContent).toBe("Strict");
    expect(textbox().querySelectorAll("p")).toHaveLength(1);
    unmount();
    const html = renderToString(<Editor aria-label="Notes" fullItem defaultValue="<p>x</p>" />);
    expect(html).toContain("data-ok-editor-content");
    expect(html).toContain('role="toolbar"');
  });
});
