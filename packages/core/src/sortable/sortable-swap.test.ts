// Swapping strategy and whole-item drags (roadmap 4.18.77).
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  arraySwap,
  createSortableController,
  type SortableController,
  type SortableControllerOptions,
} from "./sortable-controller.js";

const controllers: SortableController[] = [];
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

const STYLE = `<style>
  [data-ok-sortable] { display: grid; grid-template-columns: repeat(3, 100px); gap: 10px; margin: 0; padding: 0; list-style: none; }
  [data-ok-sortable][data-ok-layout="vertical"] { grid-template-columns: 100px; }
  [data-ok-sortable-item] { height: 60px; position: relative; }
  [data-ok-dragging] [data-ok-dragging] { pointer-events: none; }
</style>`;

function setup({
  layout = "grid",
  attrs = 'data-ok-strategy="swap"',
  disabled = [] as number[],
  second = false,
  ...options
}: {
  layout?: string;
  attrs?: string;
  disabled?: number[];
  second?: boolean;
} & SortableControllerOptions = {}) {
  const items = Array.from(
    { length: 6 },
    (_, i) =>
      `<li data-ok-sortable-item data-id="${i + 1}"${disabled.includes(i + 1) ? " data-ok-disabled" : ""}><span>${i + 1}</span>
        <a href="#x">link</a>
        <button type="button" data-ok-sortable-handle aria-pressed="false" aria-label="Reorder ${i + 1}">h</button>
      </li>`,
  ).join("");
  const other = second
    ? `<ul id="b" data-ok-sortable data-ok-layout="vertical" data-ok-group="g" aria-label="B"><li data-ok-sortable-item data-id="9"><button type="button" data-ok-sortable-handle aria-pressed="false" aria-label="Reorder 9">h</button></li></ul>`
    : "";
  mount(
    `${STYLE}<button type="button" id="before">before</button><ul id="a" data-ok-sortable data-ok-layout="${layout}" data-ok-group="g" aria-label="A" ${attrs}>${items}</ul>${other}`,
  );
  const list = document.getElementById("a") as HTMLElement;
  const swapDom = (owner: HTMLElement) => (from: number, to: number) => {
    const all = [...owner.children];
    const a = all[from] as Element;
    const b = all[to] as Element;
    const next = a.nextSibling;
    if (next === b) owner.insertBefore(b, a);
    else {
      owner.insertBefore(a, b);
      owner.insertBefore(b, next);
    }
  };
  const onSwap = vi.fn(swapDom(list));
  const onMove = vi.fn((from: number, to: number) => {
    const all = [...list.children];
    list.insertBefore(
      all[from] as Element,
      to > from ? (all[to] as Element).nextSibling : (all[to] as Element),
    );
  });
  const onTransfer = vi.fn(
    ({ item, to, index }: { item: HTMLElement; to: HTMLElement; index: number }) =>
      void to.insertBefore(item, [...to.children][index] ?? null),
  );
  controllers.push(createSortableController(list, { onSwap, onMove, onTransfer, ...options }));
  const b = document.getElementById("b");
  if (b) controllers.push(createSortableController(b, { onMove: () => {} }));
  const order = () =>
    [...list.children].map((item) => (item as HTMLElement).dataset["id"]).join(",");
  const item = (id: number) => list.querySelector(`[data-id="${id}"]`) as HTMLElement;
  const handle = (id: number) =>
    list.querySelector(`[data-id="${id}"] [data-ok-sortable-handle]`) as HTMLButtonElement;
  const announced = () => document.querySelector("[data-ok-sortable-announcer]")?.textContent ?? "";
  return { list, onSwap, onMove, onTransfer, order, item, handle, announced };
}

function pointer(
  target: EventTarget,
  type: string,
  x: number,
  y: number,
  init: PointerEventInit = {},
) {
  return target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 9,
      clientX: x,
      clientY: y,
      isPrimary: true,
      button: 0,
      pointerType: "mouse",
      ...init,
    }),
  );
}
const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2] as const;
};

describe("arraySwap", () => {
  it("swaps two elements in a copy and ignores indexes out of range", () => {
    const source = Object.freeze([1, 2, 3, 4]);
    expect(arraySwap(source, 0, 2)).toEqual([3, 2, 1, 4]);
    expect(arraySwap(source, 3, 0)).toEqual([4, 2, 3, 1]);
    expect(arraySwap(source, 0, 9)).toEqual([1, 2, 3, 4]);
    expect(source).toEqual([1, 2, 3, 4]);
  });
});

describe("swap strategy: keyboard", () => {
  it("previews the target, then swaps on drop (the others stay)", async () => {
    const { onSwap, onMove, order, item, handle, announced } = setup();
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(order()).toBe("1,2,3,4,5,6");
    expect(item(3).hasAttribute("data-ok-swap-target")).toBe(true);
    expect(item(2).hasAttribute("data-ok-swap-target")).toBe(false);
    expect(item(3).style.transform).toMatch(/^translate\(-220px(, 0px)?\)$/);
    expect(item(1).style.transform).toMatch(/^translate\(220px(, 0px)?\)$/);
    expect(announced()).toBe("Moved to position 3 of 6.");
    await userEvent.keyboard(" ");
    expect(onSwap).toHaveBeenCalledWith(0, 2);
    expect(onMove).not.toHaveBeenCalled();
    expect(order()).toBe("3,2,1,4,5,6");
    expect(item(3).style.transform).toBe("");
    expect(item(1).style.transform).toBe("");
    expect(item(3).hasAttribute("data-ok-swap-target")).toBe(false);
    expect(announced()).toBe("Dropped at position 3 of 6.");
    await nextFrame();
    expect(document.activeElement).toBe(handle(1));
  });

  it("moves by rows, skips disabled items and clears the preview back at the start", async () => {
    const { onSwap, item, handle } = setup({ disabled: [5] });
    handle(2).focus();
    // 5 (below 2) is disabled: the target jumps past it.
    await userEvent.keyboard(" {ArrowDown}");
    expect(item(6).hasAttribute("data-ok-swap-target")).toBe(true);
    expect(item(5).style.transform).toBe("");
    await userEvent.keyboard("{ArrowUp}");
    expect(item(3).hasAttribute("data-ok-swap-target")).toBe(true);
    expect(item(6).hasAttribute("data-ok-swap-target")).toBe(false);
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.querySelector("[data-ok-swap-target]")).toBeNull();
    expect(item(2).style.transform).toBe("");
    await userEvent.keyboard(" ");
    expect(onSwap).not.toHaveBeenCalled();
  });

  it("Escape cancels without a swap", async () => {
    const onDragCancel = vi.fn();
    const { onSwap, order, handle } = setup({ onDragCancel });
    handle(1).focus();
    await userEvent.keyboard(" {ArrowRight}{Escape}");
    expect(onSwap).not.toHaveBeenCalled();
    expect(onDragCancel).toHaveBeenCalledTimes(1);
    expect(order()).toBe("1,2,3,4,5,6");
    expect(document.querySelector("[data-ok-swap-target]")).toBeNull();
  });

  it("reports drag events with the target index", async () => {
    const onDragOver = vi.fn();
    const onDragEnd = vi.fn();
    const { handle } = setup({ onDragOver, onDragEnd });
    handle(4).focus();
    await userEvent.keyboard(" {ArrowLeft} ");
    expect(onDragOver).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    expect(onDragEnd).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
  });

  it("drops on focus loss and moves to another list without a swap", async () => {
    const { onSwap, onTransfer, handle, list } = setup({ layout: "vertical", second: true });
    handle(2).focus();
    await userEvent.keyboard(" {ArrowDown}");
    expect(list.querySelector("[data-ok-swap-target]")).not.toBeNull();
    await userEvent.keyboard("{ArrowRight}");
    expect(onTransfer).toHaveBeenCalledWith(expect.objectContaining({ fromIndex: 1, index: 1 }));
    expect(list.querySelector("[data-ok-swap-target]")).toBeNull();
    expect(onSwap).not.toHaveBeenCalled();
  });

  it("taps: a grabbed item swaps with the tapped handle's item", async () => {
    const { onSwap, order, handle } = setup();
    handle(1).click();
    handle(5).click();
    expect(onSwap).toHaveBeenCalledWith(0, 4);
    expect(order()).toBe("5,2,3,4,1,6");
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });
});

describe("swap strategy: pointer", () => {
  it("previews the item under the pointer, back to none over its own place, swaps on drop", () => {
    const { onSwap, item, handle, order } = setup();
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    const [x3, y3] = center(item(3));
    pointer(document, "pointermove", x3, y3);
    expect(item(3).hasAttribute("data-ok-swap-target")).toBe(true);
    // Over 1's place, which 3 now covers: the preview ends.
    const [x1, y1] = center(item(2));
    pointer(document, "pointermove", x1 - 110, y1);
    expect(document.querySelector("[data-ok-swap-target]")).toBeNull();
    const [x5, y5] = center(item(5));
    pointer(document, "pointermove", x5, y5);
    expect(item(5).hasAttribute("data-ok-swap-target")).toBe(true);
    pointer(document, "pointerup", x5, y5);
    expect(onSwap).toHaveBeenCalledTimes(1);
    expect(onSwap).toHaveBeenCalledWith(0, 4);
    expect(order()).toBe("5,2,3,4,1,6");
    expect(item(5).style.transform).toBe("");
  });

  it("ignores disabled items and gaps", () => {
    const { onSwap, item, handle } = setup({ disabled: [2] });
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    const [x2, y2] = center(item(2));
    pointer(document, "pointermove", x2, y2);
    expect(document.querySelector("[data-ok-swap-target]")).toBeNull();
    // The gap between 2 and 3.
    pointer(document, "pointermove", x2 + 55, y2);
    pointer(document, "pointerup", x2 + 55, y2);
    expect(onSwap).not.toHaveBeenCalled();
  });

  it("pointercancel drops the preview", () => {
    const { onSwap, item, handle } = setup();
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    const [x3, y3] = center(item(3));
    pointer(document, "pointermove", x3, y3);
    pointer(document, "pointercancel", x3, y3);
    expect(onSwap).not.toHaveBeenCalled();
    expect(item(3).style.transform).toBe("");
  });
});

describe("activator: item", () => {
  it("drags from anywhere on the item, but not from controls inside it", () => {
    const { onMove, item, order } = setup({ attrs: 'data-ok-activator="item"' });
    const span = item(1).querySelector("span") as HTMLElement;
    const [x, y] = center(span);
    const allowed = pointer(span, "pointerdown", x, y);
    // Mouse presses on the item's content don't select text or drag images.
    expect(allowed).toBe(false);
    const [x3, y3] = center(item(3));
    pointer(document, "pointermove", x3, y3);
    expect(item(1).hasAttribute("data-ok-dragging")).toBe(true);
    pointer(document, "pointerup", x3, y3);
    expect(onMove).toHaveBeenCalledWith(0, 2);
    expect(order()).toBe("2,3,1,4,5,6");

    const link = item(4).querySelector("a") as HTMLElement;
    const [lx, ly] = center(link);
    expect(pointer(link, "pointerdown", lx, ly)).toBe(true);
    pointer(document, "pointermove", lx + 120, ly);
    expect(item(4).hasAttribute("data-ok-dragging")).toBe(false);
    pointer(document, "pointerup", lx + 120, ly);
  });

  it("keeps handle drags, and lists without it don't drag from the item", () => {
    const { item } = setup({ attrs: "" });
    const span = item(1).querySelector("span") as HTMLElement;
    const [x, y] = center(span);
    pointer(span, "pointerdown", x, y);
    pointer(document, "pointermove", x + 120, y);
    expect(item(1).hasAttribute("data-ok-dragging")).toBe(false);
    pointer(document, "pointerup", x + 120, y);
  });

  it("disabled items don't drag from their content", () => {
    const { item } = setup({ attrs: 'data-ok-activator="item"', disabled: [1] });
    const span = item(1).querySelector("span") as HTMLElement;
    const [x, y] = center(span);
    pointer(span, "pointerdown", x, y);
    pointer(document, "pointermove", x + 120, y);
    expect(item(1).hasAttribute("data-ok-dragging")).toBe(false);
    pointer(document, "pointerup", x + 120, y);
  });

  it("whole-item drags combine with swaps", () => {
    const { onSwap, item } = setup({ attrs: 'data-ok-activator="item" data-ok-strategy="swap"' });
    const span = item(2).querySelector("span") as HTMLElement;
    const [x, y] = center(span);
    pointer(span, "pointerdown", x, y);
    const [x6, y6] = center(item(6));
    pointer(document, "pointermove", x6, y6);
    pointer(document, "pointerup", x6, y6);
    expect(onSwap).toHaveBeenCalledWith(1, 5);
  });
});

it("a click on the before button still works (no session leaks)", async () => {
  setup();
  await userEvent.click(document.getElementById("before") as HTMLElement);
  expect(document.querySelector("[data-ok-grabbed], [data-ok-dragging]")).toBeNull();
});
