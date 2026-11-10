import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Editor } from "./editor.js";

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const textbox = (name = "Notes") => screen.getByRole("textbox", { name });

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
  await frame();
  await frame();
}

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

describe("Editor tables", () => {
  it("adds a table menu that inserts and edits tables", async () => {
    render(<Editor aria-label="Notes" tables defaultValue="<p>Plan</p>" />);
    const trigger = screen.getByRole("button", { name: "Table" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(document.querySelector("[data-ok-editor]")?.hasAttribute("data-ok-tables")).toBe(true);
    await selectText("Plan");
    await act(async () => trigger.click());
    const insert = screen.getByRole("menuitem", { name: "Insert table" });
    expect(screen.getByRole("menuitem", { name: "Delete row" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    await act(async () => insert.click());
    expect(textbox().querySelectorAll("tr")).toHaveLength(3);
    await act(async () => trigger.click());
    expect(screen.getByRole("menuitem", { name: "Delete row" }).hasAttribute("aria-disabled")).toBe(
      false,
    );
    await act(async () => screen.getByRole("menuitem", { name: "Add row after" }).click());
    expect(textbox().querySelectorAll("tr")).toHaveLength(4);
    await expectNoAxeViolations();
    // The trigger toggles the menu.
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("has no table menu without tables", () => {
    render(<Editor aria-label="Notes" />);
    expect(screen.queryByRole("button", { name: "Table" })).toBeNull();
  });
});

describe("Editor bubble menu", () => {
  it("shows its buttons over the selection, runs them, and Alt+F10 reaches it", async () => {
    render(
      <Editor
        aria-label="Notes"
        defaultValue="<p>Hello world</p>"
        bubbleMenu={{ updateDelay: 0, actions: ["bold", "link"], label: "Selection" }}
      />,
    );
    const menu = document.querySelector("[data-ok-editor-bubble-menu]") as HTMLElement;
    expect(menu.getAttribute("aria-label")).toBe("Selection");
    expect(menu.getAttribute("data-ok-runtime")).toBe("off");
    expect(menu.hasAttribute("data-ok-open")).toBe(false);
    await selectText("world");
    await until(menu, () => menu.hasAttribute("data-ok-open"));
    expect(menu.hasAttribute("data-ok-open")).toBe(true);
    const bold = menu.querySelector('[data-ok-editor-action="bold"]') as HTMLButtonElement;
    await act(async () => bold.click());
    expect(textbox().innerHTML).toContain("<strong>world</strong>");
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard("{Alt>}{F10}{/Alt}");
    expect(document.activeElement).toBe(bold);
    await expectNoAxeViolations();
    // Its link button opens the link form.
    const link = menu.querySelector('[data-ok-editor-action="link"]') as HTMLButtonElement;
    await act(async () => link.click());
    expect(screen.getByRole("dialog", { name: "Link URL" })).toBeTruthy();
  });

  it("follows a custom shouldShow; true gives the default buttons", async () => {
    const shouldShow = vi.fn(() => true);
    const { unmount } = render(
      <Editor
        aria-label="Notes"
        defaultValue="<p>Hi</p>"
        bubbleMenu={{ updateDelay: 0, shouldShow }}
      />,
    );
    await selectText("Hi");
    expect(shouldShow).toHaveBeenCalled();
    unmount();
    const { unmount: again } = render(
      <Editor
        aria-label="Notes"
        bubbleMenu={{ actions: ["bold", "nothing" as "bold"] }}
        defaultValue="<p>Hi</p>"
      />,
    );
    // Unknown actions draw no button.
    expect(document.querySelectorAll("[data-ok-editor-bubble-menu] button")).toHaveLength(1);
    again();
    render(<Editor aria-label="Notes" bubbleMenu defaultValue="<p>Hi</p>" />);
    const menu = document.querySelector("[data-ok-editor-bubble-menu]") as HTMLElement;
    expect(menu.getAttribute("aria-label")).toBe("Text formatting");
    expect(
      [...menu.querySelectorAll("[data-ok-editor-action]")].map((b) =>
        b.getAttribute("data-ok-editor-action"),
      ),
    ).toEqual(["bold", "italic", "underline", "strike", "code", "link"]);
  });

  it("moves to the main toolbar with Alt+F10 when nothing is selected", async () => {
    render(<Editor aria-label="Notes" defaultValue="<p>Hi</p>" />);
    textbox().focus();
    await userEvent.keyboard("{Alt>}{F10}{/Alt}");
    expect(document.activeElement?.hasAttribute("data-ok-editor-heading")).toBe(true);
  });
});

describe("Editor mentions", () => {
  it("lists items from the callback and inserts the chosen one", async () => {
    const items = vi.fn((query: string) =>
      [
        { id: "ada", label: "Ada Lovelace" },
        { id: "alan", label: "Alan Turing" },
      ].filter((item) => item.label.toLowerCase().startsWith(query.toLowerCase())),
    );
    const onChange = vi.fn();
    render(<Editor aria-label="Notes" mentions={{ items, label: "People" }} onChange={onChange} />);
    const listbox = screen.getByRole("listbox", { name: "People", hidden: true });
    const list = listbox.parentElement as HTMLElement;
    textbox().focus();
    await userEvent.keyboard("@al");
    await until(list, () => list.hasAttribute("data-ok-open"));
    expect(items).toHaveBeenLastCalledWith("al");
    expect(listbox.textContent).toBe("Alan Turing");
    await expectNoAxeViolations();
    await userEvent.keyboard("{Enter}");
    await until(list, () => !list.hasAttribute("data-ok-open"));
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('data-id="alan"'));
  });

  it("writes the char and allowSpaces on the list for the HTML runtime", () => {
    render(
      <Editor aria-label="Notes" mentions={{ char: "#", allowSpaces: true, items: () => [] }} />,
    );
    const list = document.querySelector("[data-ok-editor-mentions]") as HTMLElement;
    expect(list.getAttribute("data-ok-char")).toBe("#");
    expect(list.hasAttribute("data-ok-allow-spaces")).toBe(true);
  });
});

describe("Editor settings", () => {
  it("submits its value with a form through a hidden input", async () => {
    const { container } = render(
      <form>
        <Editor aria-label="Notes" name="notes" defaultValue="<p>Hi</p>" />
      </form>,
    );
    const form = container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("notes")).toBe("<p>Hi</p>");
    textbox().focus();
    await userEvent.keyboard("{Control>}a{/Control}Bye");
    expect(new FormData(form).get("notes")).toBe("<p>Bye</p>");
  });

  it("keeps a controlled value in the hidden input", async () => {
    const { container, rerender } = render(
      <form>
        <Editor aria-label="Notes" name="notes" value="<p>One</p>" />
      </form>,
    );
    rerender(
      <form>
        <Editor aria-label="Notes" name="notes" value="<p>Two</p>" />
      </form>,
    );
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("notes")).toBe(
      "<p>Two</p>",
    );
  });

  it("writes the settings as options and passes them to Tiptap", async () => {
    render(
      <Editor
        aria-label="Notes"
        defaultValue="<p>a   b</p>"
        autofocus="end"
        textDirection="rtl"
        enableInputRules={false}
        enablePasteRules={false}
        parseOptions={{ preserveWhitespace: "full" }}
        editorProps={{ attributes: { spellcheck: "false" } }}
      />,
    );
    const root = document.querySelector("[data-ok-editor]") as HTMLElement;
    expect(root.getAttribute("data-ok-autofocus")).toBe("end");
    expect(root.getAttribute("data-ok-text-direction")).toBe("rtl");
    expect(root.getAttribute("data-ok-enable-input-rules")).toBe("false");
    expect(root.getAttribute("data-ok-enable-paste-rules")).toBe("false");
    expect(textbox().getAttribute("spellcheck")).toBe("false");
    expect(textbox().querySelector("p")?.getAttribute("dir")).toBe("rtl");
    expect(textbox().textContent).toBe("a   b");
    await until(textbox(), () => document.activeElement === textbox());
  });

  it("renders the new parts on the server", () => {
    const html = renderToString(
      <Editor
        aria-label="Notes"
        id="e"
        tables
        bubbleMenu
        mentions={{ items: () => [] }}
        name="n"
      />,
    );
    expect(html).toContain('data-ok-editor-bubble-menu=""');
    expect(html).toContain('data-ok-editor-mentions=""');
    expect(html).toContain('id="e-table"');
    expect(html).toContain('name="n"');
  });
});
