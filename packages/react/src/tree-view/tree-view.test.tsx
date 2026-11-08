import { render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { RichTreeView, SimpleTreeView, type SimpleTreeViewProps, TreeItem } from "./tree-view.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const ITEMS = [
  {
    id: "a",
    label: "Apples",
    children: [
      { id: "a1", label: "Alpha" },
      { id: "a2", label: "Amber" },
    ],
  },
  { id: "b", label: "Bananas" },
  { id: "c", label: "Cherries", disabled: true },
];
const item = (name: string) => screen.getByRole("treeitem", { name: new RegExp(`^${name}`) });
const content = (name: string) =>
  item(name).querySelector(":scope > [data-ok-tree-item-content]") as HTMLElement;

function Tree(props: Partial<SimpleTreeViewProps>) {
  return <RichTreeView aria-label="Fruits" items={ITEMS} {...props} />;
}

function Items() {
  return <TreeItem itemId="h" label="Helper" />;
}

describe("Tree view", () => {
  it("a named tree of items with explicit defaults and one tab stop", async () => {
    render(<Tree />);
    const tree = screen.getByRole("tree", { name: "Fruits" });
    expect({ ...tree.dataset }).toEqual({
      okTreeView: "",
      okVariant: "standard",
      okExpansionTrigger: "content",
      okRuntime: "off",
    });
    expect(item("Apples").getAttribute("aria-expanded")).toBe("false");
    expect(item("Bananas").hasAttribute("aria-expanded")).toBe(false);
    expect(item("Apples").getAttribute("aria-selected")).toBe("false");
    expect(item("Cherries").getAttribute("aria-disabled")).toBe("true");
    expect([item("Apples").tabIndex, item("Bananas").tabIndex]).toEqual([0, -1]);
    expect(screen.queryByRole("group")).toBeNull();
    await expectNoAxeViolations();
  });

  it("looks like the reference: 30px rows, 12px indent per level, 14px labels", async () => {
    render(<Tree defaultExpandedItems={["a"]} />);
    expect(content("Apples").getBoundingClientRect().height).toBe(30);
    expect(getComputedStyle(content("Apples")).paddingLeft).toBe("8px");
    expect(getComputedStyle(content("Alpha")).paddingLeft).toBe("20px");
    expect(
      getComputedStyle(item("Alpha").querySelector("[data-ok-tree-item-label]") as Element)
        .fontSize,
    ).toBe("14px");
  });

  it("click expands and selects; the chevron turns", async () => {
    const onExpandedItemsChange = vi.fn();
    const onItemExpansionToggle = vi.fn();
    const onSelectedItemsChange = vi.fn();
    render(
      <StrictMode>
        <Tree
          onExpandedItemsChange={onExpandedItemsChange}
          onItemExpansionToggle={onItemExpansionToggle}
          onSelectedItemsChange={onSelectedItemsChange}
        />
      </StrictMode>,
    );
    await userEvent.click(content("Apples"));
    expect(onExpandedItemsChange).toHaveBeenLastCalledWith(["a"]);
    expect(onItemExpansionToggle).toHaveBeenLastCalledWith("a", true);
    expect(onSelectedItemsChange).toHaveBeenLastCalledWith("a");
    expect(item("Apples").getAttribute("aria-expanded")).toBe("true");
    expect(item("Apples").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("group")).toBeTruthy();
    expect(getComputedStyle(content("Apples")).backgroundColor).toBe("rgba(0, 167, 111, 0.08)");
    await userEvent.click(content("Apples"));
    expect(item("Apples").getAttribute("aria-expanded")).toBe("false");
  });

  it("keyboard: arrows move and open, Enter, Space, typeahead", async () => {
    const onSelectedItemsChange = vi.fn();
    render(<Tree onSelectedItemsChange={onSelectedItemsChange} />);
    item("Apples").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(item("Apples").getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(item("Alpha"));
    await userEvent.keyboard(" ");
    expect(onSelectedItemsChange).toHaveBeenLastCalledWith("a1");
    expect(item("Alpha").tabIndex).toBe(0);
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(item("Apples"));
    await userEvent.keyboard("b");
    expect(document.activeElement).toBe(item("Bananas"));
    await userEvent.keyboard("{Home}{Enter}");
    expect(item("Apples").getAttribute("aria-expanded")).toBe("false");
    expect(getComputedStyle(content("Apples")).outlineStyle).toBe("solid");
  });

  it("multi select and checkboxes: toggle, range; checkboxes show the selection", async () => {
    const onSelectedItemsChange = vi.fn();
    render(
      <Tree
        checkboxSelection
        defaultExpandedItems={["a"]}
        onSelectedItemsChange={onSelectedItemsChange}
      />,
    );
    expect(screen.getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
    await userEvent.click(
      content("Apples").querySelector("[data-ok-tree-item-checkbox] input") as HTMLElement,
    );
    expect(onSelectedItemsChange).toHaveBeenLastCalledWith(["a"]);
    await userEvent.click(
      content("Bananas").querySelector("[data-ok-tree-item-checkbox] input") as HTMLElement,
    );
    expect(onSelectedItemsChange).toHaveBeenLastCalledWith(["a", "b"]);
    expect((content("Bananas").querySelector("input") as HTMLInputElement).checked).toBe(true);
    await userEvent.click(content("Alpha"), { modifiers: ["Shift"] } as never);
    await userEvent.keyboard("{Shift>}");
    await userEvent.click(content("Amber"));
    await userEvent.keyboard("{/Shift}");
    expect(onSelectedItemsChange.mock.lastCall?.[0]).toEqual(expect.arrayContaining(["a2"]));
    await expectNoAxeViolations();
  });

  it("disableSelection, iconContainer trigger, controlled refusal", async () => {
    const { rerender } = render(<Tree disableSelection expansionTrigger="iconContainer" />);
    expect(item("Apples").hasAttribute("aria-selected")).toBe(false);
    await userEvent.click(
      content("Apples").querySelector("[data-ok-tree-item-label]") as HTMLElement,
    );
    expect(item("Apples").getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(
      content("Apples").querySelector("[data-ok-tree-item-icon]") as HTMLElement,
    );
    expect(item("Apples").getAttribute("aria-expanded")).toBe("true");
    rerender(<Tree expandedItems={[]} selectedItems={null} />);
    await userEvent.click(content("Apples"));
    expect(item("Apples").getAttribute("aria-expanded")).toBe("false");
    expect(item("Apples").getAttribute("aria-selected")).toBe("false");
  });

  it("custom icons, end icon and the lines variant; invalid values fall back", () => {
    render(
      <SimpleTreeView
        aria-label="Icons"
        variant="lines"
        defaultExpandedItems={["x"]}
        expansionTrigger={HOSTILE}
        expandIcon={<svg data-testid="plus" aria-hidden="true" viewBox="0 0 24 24" />}
        endIcon={<svg data-testid="end" aria-hidden="true" viewBox="0 0 24 24" />}
      >
        <TreeItem itemId="x" label="X">
          <TreeItem itemId="y" label="Y" />
        </TreeItem>
      </SimpleTreeView>,
    );
    expect(screen.getByRole("tree").dataset["okExpansionTrigger"]).toBe("content");
    expect(screen.getAllByTestId("plus")).toHaveLength(2);
    expect(
      getComputedStyle(item("X").querySelector("[data-ok-tree-collapse-icon]") as Element).display,
    ).toBe("block");
    expect(
      getComputedStyle(item("X").querySelector("[data-ok-tree-expand-icon]") as Element).display,
    ).toBe("none");
    expect(screen.getByTestId("end")).toBeTruthy();
    expect(getComputedStyle(screen.getByRole("group")).borderLeftStyle).toBe("dashed");
  });

  it("items inside helper components still get the tab stop", () => {
    render(
      <SimpleTreeView aria-label="Helpers">
        <Items />
      </SimpleTreeView>,
    );
    expect(item("Helper").tabIndex).toBe(0);
  });

  it("a TreeItem outside a tree renders a lone item; refs pass through", () => {
    const ref = createRef<HTMLUListElement>();
    const itemRef = createRef<HTMLLIElement>();
    render(
      <SimpleTreeView ref={ref} aria-label="R">
        <TreeItem ref={itemRef} itemId="r" label="R" />
      </SimpleTreeView>,
    );
    expect(ref.current?.getAttribute("role")).toBe("tree");
    expect(itemRef.current?.getAttribute("data-ok-item-id")).toBe("r");
    render(
      <ul aria-label="loose">
        <TreeItem itemId="z" label="Loose" />
      </ul>,
    );
    expect(screen.getByText("Loose").closest("li")?.tabIndex).toBe(-1);
  });

  it("server render matches the client markup", () => {
    const element = (
      <Tree checkboxSelection defaultExpandedItems={["a"]} defaultSelectedItems={["b"]} />
    );
    const html = renderToString(element);
    const { container } = render(element);
    const server = document.createElement("div");
    server.innerHTML = html;
    expect(container.firstElementChild?.isEqualNode(server.firstElementChild)).toBe(true);
  });
});
