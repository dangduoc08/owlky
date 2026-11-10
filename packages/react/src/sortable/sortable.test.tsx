import { render, screen } from "@testing-library/react";
import { createRef, type Ref, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { arrayMove, moveBetweenLists, Sortable, type SortableProps } from "./sortable.js";

type Demo = Partial<SortableProps<number>> & {
  count?: number;
  removable?: boolean;
  ref?: Ref<HTMLUListElement>;
};

function Numbers({ count = 4, removable = true, ...props }: Demo) {
  const [items, setItems] = useState(() => Array.from({ length: count }, (_, i) => i + 1));
  return (
    <Sortable
      aria-label="Numbers"
      items={items}
      getKey={(n) => n}
      getItemLabel={(n) => `item ${n}`}
      renderItem={(n) => <span>{n}</span>}
      onReorder={setItems}
      onRemove={removable ? (n) => setItems((all) => all.filter((x) => x !== n)) : undefined}
      {...props}
    />
  );
}

const order = () =>
  screen
    .getAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent)
    .join(",");
const handle = (n: number) => screen.getByRole("button", { name: `Reorder item ${n}` });

describe("Sortable anatomy", () => {
  it("renders a named list with explicit defaults, handles and remove buttons", () => {
    const ref = createRef<HTMLUListElement>();
    render(<Numbers ref={ref} layout={"x" as never} />);
    const list = screen.getByRole("list", { name: "Numbers" });
    expect(ref.current).toBe(list);
    expect(list.dataset).toMatchObject({ okSortable: "", okLayout: "grid", okRuntime: "off" });
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    expect(handle(1).dataset).toMatchObject({ okIconButton: "", okColor: "default", okSize: "sm" });
    expect(screen.getByRole("button", { name: "Remove item 1" })).toBeTruthy();
  });

  it("without onRemove there are no remove buttons; default labels use positions", () => {
    render(
      <Sortable
        aria-label="Plain"
        layout="vertical"
        items={["a", "b"]}
        getKey={(x) => x}
        renderItem={(x) => x}
        onReorder={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Reorder Item 2" })).toBeTruthy();
  });

  it("renders the same markup on the server", () => {
    const html = renderToString(<Numbers layout="horizontal" />);
    const server = document.createElement("div");
    server.innerHTML = html;
    const { container } = render(<Numbers layout="horizontal" />);
    expect(server.innerHTML).toBe(container.innerHTML);
  });

  it("exports arrayMove", () => {
    expect(arrayMove(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
});

describe("Sortable behavior", () => {
  it("reorders with the keyboard; focus stays on the moved handle", async () => {
    render(<Numbers layout="vertical" />);
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(order()).toBe("2,3,1,4");
    await vi.waitFor(() => expect(document.activeElement).toBe(handle(1)));
    expect(handle(1).getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard(" ");
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });

  it("moves with two taps and removes items, keeping focus in the list", async () => {
    render(
      <StrictMode>
        <Numbers />
      </StrictMode>,
    );
    await userEvent.click(handle(4));
    await userEvent.click(handle(1));
    expect(order()).toBe("4,1,2,3");
    await userEvent.click(screen.getByRole("button", { name: "Remove item 1" }));
    expect(order()).toBe("4,2,3");
    await vi.waitFor(() => expect(document.activeElement).toBe(handle(2)));
  });

  it("controlled: nothing moves unless the owner applies onReorder", async () => {
    const onReorder = vi.fn();
    render(
      <Sortable
        aria-label="Fixed"
        items={[1, 2, 3]}
        getKey={(n) => n}
        renderItem={(n) => <span>{n}</span>}
        onReorder={onReorder}
        messages={{ grabbed: () => "Pris." }}
      />,
    );
    screen.getByRole("button", { name: "Reorder Item 1" }).focus();
    await userEvent.keyboard(" ");
    expect(document.querySelector("[data-ok-sortable-announcer]")?.textContent).toBe("Pris.");
    await userEvent.keyboard("{ArrowRight}");
    expect(onReorder).toHaveBeenCalledWith([2, 1, 3]);
    expect(order()).toBe("1,2,3");
  });

  it("styles the layouts and has no axe violations", async () => {
    render(
      <>
        <Numbers layout="vertical" />
        <Numbers layout="horizontal" removable={false} />
      </>,
    );
    const [vertical, horizontal] = screen.getAllByRole("list");
    expect(getComputedStyle(vertical as Element).flexDirection).toBe("column");
    expect(getComputedStyle(horizontal as Element).overflowX).toBe("auto");
    expect(
      getComputedStyle(screen.getAllByRole("listitem")[0] as Element).borderTopLeftRadius,
    ).toBe("12px");
    await expectNoAxeViolations();
  });
});

function Board({ withTransfer = true }: { withTransfer?: boolean }) {
  const [lists, setLists] = useState<Record<string, number[]>>({ a: [1, 2], b: [3], c: [] });
  return (
    <>
      {Object.keys(lists).map((id) => (
        <Sortable
          key={id}
          id={id}
          group="g"
          accept={id === "c" ? ["g", "other"] : undefined}
          layout="vertical"
          aria-label={`List ${id}`}
          items={lists[id] ?? []}
          getKey={(n) => n}
          getItemLabel={(n) => `item ${n}`}
          renderItem={(n) => (
            <>
              <span>{n}</span>
              <button type="button" data-ok-sortable-move-to="c">{`Move ${n}`}</button>
            </>
          )}
          onReorder={(items) => setLists((all) => ({ ...all, [id]: items }))}
          onTransfer={
            withTransfer ? (event) => setLists((all) => moveBetweenLists(all, event)) : undefined
          }
        />
      ))}
    </>
  );
}

const listOrder = (name: string) =>
  [...screen.getByRole("list", { name }).querySelectorAll(":scope > li > span")]
    .map((span) => span.textContent)
    .join(",");

/** Resolves once a list's children change (React committed a transfer). */
const committed = (name: string) =>
  new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(screen.getByRole("list", { name }), { childList: true });
  });
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("Sortable between lists", () => {
  it("writes the group, accept and an id", () => {
    render(
      <>
        <Board />
        <Sortable
          aria-label="Plain"
          items={[]}
          getKey={String}
          renderItem={String}
          onReorder={() => {}}
          group="z"
        />
      </>,
    );
    const a = screen.getByRole("list", { name: "List a" });
    expect(a.id).toBe("a");
    expect(a.dataset).toMatchObject({ okGroup: "g" });
    expect(a.hasAttribute("data-ok-accept")).toBe(false);
    expect(screen.getByRole("list", { name: "List c" }).dataset["okAccept"]).toBe("g other");
    expect(screen.getByRole("list", { name: "Plain" }).id).not.toBe("");
  });

  it("moves an item to the next list with the arrow keys; focus follows the new element", async () => {
    render(<Board />);
    handle(2).focus();
    await userEvent.keyboard(" ");
    const done = committed("List b");
    await userEvent.keyboard("{ArrowRight}");
    await done;
    expect(listOrder("List a")).toBe("1");
    expect(listOrder("List b")).toBe("3,2");
    await frame();
    await frame();
    expect(document.activeElement).toBe(handle(2));
    expect(handle(2).getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard("{Escape}");
    await frame();
    await frame();
    expect(listOrder("List a")).toBe("1,2");
    expect(document.activeElement).toBe(handle(2));
  });

  it("move-to buttons move an item into an empty list; two taps move between lists", async () => {
    render(<Board />);
    await userEvent.click(screen.getByRole("button", { name: "Move 1" }));
    expect(listOrder("List c")).toBe("1");
    await frame();
    expect(document.activeElement).toBe(handle(1));
    await userEvent.click(handle(3));
    await userEvent.click(handle(1));
    expect(listOrder("List c")).toBe("3,1");
    expect(listOrder("List b")).toBe("");
    await expectNoAxeViolations();
  });

  it("disabled items, auto scroll off and drag events with the item's data", async () => {
    const events: string[] = [];
    const log = (kind: string) => (event: { item: number; index: number; list: string }) =>
      events.push(`${kind}:${event.item}@${event.index} in ${event.list}`);
    render(
      <Numbers
        id="n"
        layout="vertical"
        autoScroll={false}
        isItemDisabled={(n) => n === 1}
        onDragStart={log("start")}
        onDragOver={log("over")}
        onDragEnd={log("end")}
        onDragCancel={log("cancel")}
      />,
    );
    const list = screen.getByRole("list", { name: "Numbers" });
    expect(list.dataset["okAutoScroll"]).toBe("false");
    const first = screen.getAllByRole("listitem")[0] as HTMLElement;
    expect(first.hasAttribute("data-ok-disabled")).toBe(true);
    expect((handle(1) as HTMLButtonElement).disabled).toBe(true);
    expect((handle(2) as HTMLButtonElement).disabled).toBe(false);
    handle(3).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{ArrowUp}"); // item 1 can't be passed
    expect(order()).toBe("1,3,2,4");
    await userEvent.keyboard(" ");
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Escape}");
    expect(events).toEqual([
      "start:3@2 in n",
      "over:3@1 in n",
      "end:3@1 in n",
      "start:3@1 in n",
      "cancel:3@1 in n",
    ]);
  });

  it("without onTransfer, items stay in their list", async () => {
    render(<Board withTransfer={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Move 1" }));
    expect(listOrder("List a")).toBe("1,2");
  });
});
