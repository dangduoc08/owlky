// Swapping strategy and whole-item drags (roadmap 4.18.77).
import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { arraySwap, Sortable, type SortableProps } from "./sortable.js";

function Numbers(props: Partial<SortableProps<number>>) {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);
  return (
    <Sortable
      aria-label="Numbers"
      layout="vertical"
      items={items}
      getKey={(n) => n}
      getItemLabel={(n) => `item ${n}`}
      renderItem={(n) => <span>{n}</span>}
      onReorder={setItems}
      {...props}
    />
  );
}

/** A swap list that reports every `onReorder`. */
function Spied({ spy }: { spy: (items: number[]) => void }) {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);
  return (
    <Numbers
      strategy="swap"
      items={items}
      onReorder={(next) => {
        spy(next);
        setItems(next);
      }}
    />
  );
}

const order = () =>
  screen
    .getAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent)
    .join(",");
const handle = (n: number) => screen.getByRole("button", { name: `Reorder item ${n}` });
const item = (n: number) => handle(n).closest("li") as HTMLElement;
/** Resolves after React's commit and the controller's focus frame. */
const frames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

function pointer(target: EventTarget, type: string, x: number, y: number) {
  return target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 5,
      clientX: x,
      clientY: y,
      isPrimary: true,
      button: 0,
      pointerType: "mouse",
    }),
  );
}
const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2] as const;
};

describe("Sortable strategy and activator", () => {
  it("writes the options only when given", () => {
    const { rerender } = render(<Numbers />);
    const list = screen.getByRole("list", { name: "Numbers" });
    expect(list.hasAttribute("data-ok-strategy")).toBe(false);
    expect(list.hasAttribute("data-ok-activator")).toBe(false);
    rerender(<Numbers strategy="swap" activator="item" />);
    expect(list.dataset).toMatchObject({ okStrategy: "swap", okActivator: "item" });
    rerender(<Numbers strategy={"x" as never} />);
    expect(list.hasAttribute("data-ok-strategy")).toBe(false);
  });

  it("swaps with the keyboard: onReorder gets arraySwap's result; focus stays", async () => {
    const onReorder = vi.fn();
    render(<Spied spy={onReorder} />);
    handle(1).focus();
    await userEvent.keyboard(" {ArrowDown}{ArrowDown}{ArrowDown}");
    expect(order()).toBe("1,2,3,4,5");
    expect(item(4).hasAttribute("data-ok-swap-target")).toBe(true);
    await userEvent.keyboard(" ");
    expect(onReorder).toHaveBeenCalledWith([4, 2, 3, 1, 5]);
    expect(order()).toBe("4,2,3,1,5");
    await frames();
    expect(document.activeElement).toBe(handle(1));
    expect(document.querySelector("[data-ok-swap-target]")).toBeNull();
  });

  it("swaps by pointer and drags from the whole item", async () => {
    render(<Numbers strategy="swap" activator="item" />);
    const text = item(2).querySelector("span") as HTMLElement;
    const [x, y] = center(text);
    expect(pointer(text, "pointerdown", x, y)).toBe(false);
    const [x5, y5] = center(item(5));
    pointer(document, "pointermove", x5, y5);
    expect(item(5).hasAttribute("data-ok-swap-target")).toBe(true);
    pointer(document, "pointerup", x5, y5);
    await frames();
    expect(order()).toBe("1,5,3,4,2");
  });

  it("exports arraySwap and passes axe while a swap is previewed", async () => {
    expect(arraySwap(["a", "b", "c"], 0, 2)).toEqual(["c", "b", "a"]);
    render(<Numbers strategy="swap" activator="item" />);
    handle(3).focus();
    await userEvent.keyboard(" {ArrowUp}");
    await expectNoAxeViolations(document.body);
    await userEvent.keyboard("{Escape}");
  });
});
