import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  arrayMove,
  createSortableController,
  type SortableController,
  type SortableControllerOptions,
} from "./sortable-controller.js";

const controllers: SortableController[] = [];
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

// Layout only (no package CSS in core tests): fixed-size items, dragged item ignores the pointer.
const STYLE = `<style>
  [data-mt-sortable] { display: grid; grid-template-columns: repeat(var(--cols), 100px); gap: 10px; margin: 0; padding: 0; list-style: none; }
  [data-mt-sortable-item] { height: 60px; position: relative; }
  [data-mt-dragging] [data-mt-dragging] { pointer-events: none; }
</style>`;

function setup(layout = "grid", cols = 3, count = 6, options: SortableControllerOptions = {}) {
  const items = Array.from(
    { length: count },
    (_, i) =>
      `<li data-mt-sortable-item data-id="${i + 1}"><span>${i + 1}</span>
        <button type="button" data-mt-sortable-remove aria-label="Remove ${i + 1}">x</button>
        <button type="button" data-mt-sortable-handle aria-pressed="false" aria-label="Reorder ${i + 1}">h</button>
      </li>`,
  ).join("");
  mount(
    `${STYLE}<button type="button" id="before">before</button><ul data-mt-sortable data-mt-layout="${layout}" style="--cols:${cols}">${items}</ul><button type="button" id="after">after</button>`,
  );
  const list = document.querySelector("[data-mt-sortable]") as HTMLElement;
  // A synchronous DOM owner, like the HTML runtime.
  const onMove = vi.fn((from: number, to: number) => {
    const all = [...list.children];
    const item = all[from] as Element;
    list.insertBefore(item, to > from ? (all[to] as Element).nextSibling : (all[to] as Element));
  });
  const onRemove = vi.fn((index: number) => list.children[index]?.remove());
  const controller = createSortableController(list, { onMove, onRemove, ...options });
  controllers.push(controller);
  const order = () =>
    [...list.children].map((item) => (item as HTMLElement).dataset["id"]).join(",");
  const handle = (id: number) =>
    list.querySelector(`[data-id="${id}"] [data-mt-sortable-handle]`) as HTMLButtonElement;
  const announced = () => document.querySelector("[data-mt-sortable-announcer]")?.textContent ?? "";
  return { list, controller, onMove, onRemove, order, handle, announced };
}

function pointer(target: Element, type: string, x: number, y: number, init: PointerEventInit = {}) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 7,
      clientX: x,
      clientY: y,
      isPrimary: true,
      button: 0,
      ...init,
    }),
  );
}
const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2] as const;
};

describe("arrayMove", () => {
  it("moves one element in a copy", () => {
    const source = Object.freeze([1, 2, 3, 4]);
    expect(arrayMove(source, 0, 2)).toEqual([2, 3, 1, 4]);
    expect(arrayMove(source, 3, 0)).toEqual([4, 1, 2, 3]);
    expect(source).toEqual([1, 2, 3, 4]);
  });
});

describe("keyboard and taps", () => {
  it("Space grabs, arrows move (grid rows by columns), Space drops, with announcements", async () => {
    const { order, handle, announced, controller } = setup("grid", 3);
    handle(1).focus();
    await userEvent.keyboard(" ");
    expect(handle(1).getAttribute("aria-pressed")).toBe("true");
    expect(controller.grabbed).toBe(0);
    expect(announced()).toMatch(/Grabbed item at position 1 of 6/);
    await userEvent.keyboard("{ArrowRight}");
    expect(order()).toBe("2,1,3,4,5,6");
    expect(document.activeElement).toBe(handle(1));
    await userEvent.keyboard("{ArrowDown}");
    expect(order()).toBe("2,3,4,5,1,6");
    expect(announced()).toBe("Moved to position 5 of 6.");
    await userEvent.keyboard("{ArrowDown}"); // clamped to the end
    expect(order()).toBe("2,3,4,5,6,1");
    await userEvent.keyboard("{ArrowRight}"); // already last: nothing
    await userEvent.keyboard("{ArrowUp}");
    expect(order()).toBe("2,3,1,4,5,6");
    await userEvent.keyboard("{Enter}");
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    expect(announced()).toBe("Dropped at position 3 of 6.");
  });

  it("vertical and horizontal layouts use their own axis; other keys do nothing", async () => {
    const vertical = setup("vertical", 1, 3);
    vertical.handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(vertical.order()).toBe("1,2,3");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("a");
    expect(vertical.order()).toBe("2,1,3");
    cleanupDom();
    const horizontal = setup("horizontal", 3, 3);
    horizontal.handle(3).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowLeft}");
    expect(horizontal.order()).toBe("1,3,2");
  });

  it("Escape cancels back to the start position", async () => {
    const { order, handle, announced } = setup();
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Escape}");
    expect(order()).toBe("1,2,3,4,5,6");
    expect(announced()).toMatch(/cancelled\. Back at position 2/);
    await nextFrame();
    expect(document.activeElement).toBe(handle(2));
  });

  it("two taps move an item onto another item's position", async () => {
    const { order, handle, onMove } = setup();
    await userEvent.click(handle(1));
    await userEvent.click(handle(5));
    expect(order()).toBe("2,3,4,5,1,6");
    expect(onMove).toHaveBeenCalledWith(0, 4);
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });

  it("focus moving inside the list keeps the item grabbed; keys on other elements are ignored", async () => {
    const { handle, order } = setup();
    handle(1).focus();
    await userEvent.keyboard(" ");
    await nextFrame();
    await nextFrame();
    (document.querySelector('[aria-label="Remove 1"]') as HTMLElement).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(order()).toBe("1,2,3,4,5,6");
    expect(handle(1).getAttribute("aria-pressed")).toBe("true");
  });

  it("focus leaving the list drops the grabbed item", async () => {
    const { handle } = setup();
    handle(1).focus();
    await userEvent.keyboard(" ");
    await nextFrame();
    (document.getElementById("after") as HTMLElement).focus();
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });
});

describe("remove", () => {
  it("reports the index, announces it and focuses the next (or previous) handle", async () => {
    const { order, handle, onRemove, announced } = setup("grid", 3, 3);
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.click(document.querySelector('[aria-label="Remove 2"]') as HTMLElement);
    expect(onRemove).toHaveBeenCalledWith(1);
    expect(order()).toBe("1,3");
    expect(announced()).toBe("Removed the item at position 2. 2 items left.");
    expect(document.activeElement).toBe(handle(3));
    await userEvent.click(document.querySelector('[aria-label="Remove 3"]') as HTMLElement);
    expect(document.activeElement).toBe(handle(1));
    await userEvent.click(document.querySelector('[aria-label="Remove 1"]') as HTMLElement);
    expect(order()).toBe("");
  });
});

describe("pointer dragging", () => {
  it("a press without movement is a click; a drag moves over items and drops", () => {
    const { list, order, handle, announced } = setup();
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 2, y);
    pointer(handle(1), "pointerup", x + 2, y);
    expect(list.hasAttribute("data-mt-dragging")).toBe(false);
    handle(1).click();
    expect(handle(1).getAttribute("aria-pressed")).toBe("true"); // the click grabbed it
    handle(1).click();

    const item1 = list.querySelector('[data-id="1"]') as HTMLElement;
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 20, y);
    expect(item1.hasAttribute("data-mt-dragging")).toBe(true);
    expect(announced()).toMatch(/Grabbed/);
    const [tx, ty] = center(list.querySelector('[data-id="3"]') as Element);
    pointer(handle(1), "pointermove", tx, ty);
    expect(order()).toBe("2,3,1,4,5,6");
    expect(item1.style.transform).toMatch(/translate/);
    pointer(handle(1), "pointerup", tx, ty);
    expect(item1.hasAttribute("data-mt-dragging")).toBe(false);
    expect(item1.style.transform).toBe("");
    expect(announced()).toBe("Dropped at position 3 of 6.");
    handle(1).click(); // the click after a drag is swallowed
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });

  it("pointercancel and Escape restore the start position", () => {
    const { order, handle } = setup();
    for (const end of ["cancel", "escape"]) {
      const [x, y] = center(handle(2));
      pointer(handle(2), "pointerdown", x, y);
      pointer(handle(2), "pointermove", x + 30, y);
      const [tx, ty] = center(document.querySelector('[data-id="6"]') as Element);
      pointer(handle(2), "pointermove", tx, ty);
      expect(order()).not.toBe("1,2,3,4,5,6");
      if (end === "cancel") pointer(handle(2), "pointercancel", tx, ty);
      else
        handle(2).dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
        );
      expect(order()).toBe("1,2,3,4,5,6");
    }
  });

  it("ignores other pointers, other buttons, presses outside handles and cancels without a drag", () => {
    const { list, order, handle } = setup();
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y, { button: 2 });
    pointer(handle(1), "pointerdown", x, y, { isPrimary: false });
    pointer(list.querySelector("span") as Element, "pointerdown", x, y);
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 50, y, { pointerId: 9 });
    pointer(handle(1), "pointerup", x + 50, y, { pointerId: 9 });
    pointer(handle(1), "pointercancel", x + 50, y, { pointerId: 9 });
    expect(list.hasAttribute("data-mt-dragging")).toBe(false);
    pointer(handle(1), "pointercancel", x, y);
    pointer(handle(1), "pointermove", x + 50, y);
    pointer(handle(1), "pointerup", x + 50, y);
    expect(order()).toBe("1,2,3,4,5,6");
  });
});

describe("lifecycle and options", () => {
  it("setOptions swaps callbacks and messages; destroy releases and stops listening", async () => {
    const { list, controller, handle, announced, onMove } = setup();
    const next = vi.fn();
    controller.setOptions({ onMove: next, messages: { grabbed: () => "Pris." } });
    handle(1).focus();
    await userEvent.keyboard(" ");
    expect(announced()).toBe("Pris.");
    await userEvent.keyboard("{ArrowRight}");
    expect(next).toHaveBeenCalledWith(0, 1);
    expect(onMove).not.toHaveBeenCalled();
    const [x, y] = center(handle(2));
    pointer(handle(2), "pointerdown", x, y);
    pointer(handle(2), "pointermove", x + 30, y);
    controller.destroy();
    controller.destroy();
    expect(controller.grabbed).toBe(-1);
    expect(list.hasAttribute("data-mt-dragging")).toBe(false);
    handle(3).click();
    expect(handle(3).getAttribute("aria-pressed")).toBe("false");
  });

  it("works without callbacks and recreates the announcer if it was removed", async () => {
    mount(
      `${STYLE}<ul data-mt-sortable style="--cols:2"><li data-mt-sortable-item><button type="button" data-mt-sortable-handle aria-label="h1">h</button></li><li data-mt-sortable-item><button type="button" data-mt-sortable-handle aria-label="h2">h</button></li></ul>`,
    );
    const list = document.querySelector("[data-mt-sortable]") as HTMLElement;
    const controller = createSortableController(list);
    controllers.push(controller);
    document.querySelector("[data-mt-sortable-announcer]")?.remove();
    const first = list.querySelector("button") as HTMLButtonElement;
    first.focus();
    await userEvent.keyboard(" ");
    expect(document.querySelector("[data-mt-sortable-announcer]")?.textContent).toMatch(/Grabbed/);
    await userEvent.keyboard("{ArrowDown}"); // grid without data-mt-layout: rows by columns
    expect(document.querySelector("[data-mt-sortable-announcer]")?.textContent).toMatch(/Moved/);
    await userEvent.click(list.querySelectorAll("button")[1] as HTMLElement); // moves (no owner)
    expect(controller.grabbed).toBe(-1);
  });
});
