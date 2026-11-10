// Several lists (ADR-0053): groups, accept, keys, taps, move-to triggers, drags, owners that
// render new elements.
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  arrayMove,
  createSortableController,
  moveBetweenLists,
  type SortableController,
  type SortableControllerOptions,
} from "./sortable-controller.js";

const controllers: SortableController[] = [];
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
});

const STYLE = `<style>
  [data-ok-sortable] { display: grid; grid-template-columns: repeat(2, 100px); gap: 10px; min-height: 60px; margin: 0 0 10px; padding: 10px; list-style: none; }
  [data-ok-sortable-item] { height: 50px; position: relative; }
  [data-ok-dragging] [data-ok-dragging] { pointer-events: none; }
</style>`;

/** Lists of a board: `[id, layout, ids, attributes]`. */
type Board = [string, string, number[], string?][];

/** Two frames later: slower than one key press, so a transfer is still pending meanwhile. */
const later = (callback: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(callback));

const itemHtml = (id: number) =>
  `<li data-ok-sortable-item data-id="${id}"><span>${id}</span><button type="button" data-ok-sortable-move-to="b" aria-label="Move ${id}">m</button><button type="button" data-ok-sortable-handle aria-pressed="false" aria-label="Reorder ${id}">h</button></li>`;

/**
 * A board of lists with controllers. `owner: "dom"` applies intents to the DOM (HTML runtime);
 * `"render"` re-creates every list's items from its data on the next frame, like React does
 * across lists (a transferred item comes back as a new element).
 */
function board(
  lists: Board,
  owner: "dom" | "render" = "dom",
  extra: SortableControllerOptions = {},
) {
  mount(
    `${STYLE}${lists
      .map(
        ([id, layout, ids, attrs = 'data-ok-group="g"']) =>
          `<ul id="${id}" data-ok-sortable data-ok-layout="${layout}" ${attrs} aria-label="List ${id}">${ids.map(itemHtml).join("")}</ul>`,
      )
      .join("")}`,
  );
  const data = new Map(lists.map(([id, , ids]) => [id, [...ids]]));
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const template = document.createElement("template");
  const render = () => {
    // Keyed like React: items that stay in their list keep their element.
    for (const [id, ids] of data) {
      const kept = (n: number) => el(id).querySelector(`:scope > [data-id="${n}"]`);
      el(id).replaceChildren(
        ...ids.map((n) => {
          const element = kept(n);
          if (element) return element;
          template.innerHTML = itemHtml(n);
          return template.content.firstElementChild as Element;
        }),
      );
    }
  };
  const transfers: unknown[] = [];
  for (const [id] of lists)
    controllers.push(
      createSortableController(el(id), {
        onMove: (from, to) => {
          data.set(id, arrayMove(data.get(id) as number[], from, to));
          if (owner === "render") return void requestAnimationFrame(render);
          const all = [...el(id).children];
          el(id).insertBefore(
            all[from] as Element,
            to > from ? (all[to] as Element).nextSibling : (all[to] as Element),
          );
        },
        onTransfer: ({ item, from, to, fromIndex, index }) => {
          transfers.push([from.id, to.id, fromIndex, index]);
          const [n] = (data.get(from.id) as number[]).splice(fromIndex, 1);
          (data.get(to.id) as number[]).splice(index, 0, n as number);
          if (owner === "render") return void later(render);
          to.insertBefore(item, [...to.children][index] ?? null);
        },
        ...extra,
      }),
    );
  const order = (id: string) =>
    [...el(id).children].map((li) => (li as HTMLElement).dataset["id"]).join(",");
  const handle = (n: number) =>
    document.querySelector(`[data-id="${n}"] [data-ok-sortable-handle]`) as HTMLButtonElement;
  const announced = () => document.querySelector("[data-ok-sortable-announcer]")?.textContent ?? "";
  return { el, order, handle, announced, transfers };
}

function pointer(target: Element, type: string, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 7,
      clientX: x,
      clientY: y,
      isPrimary: true,
      button: 0,
    }),
  );
}
const center = (element: Element) => {
  const box = element.getBoundingClientRect();
  return [box.left + box.width / 2, box.top + box.height / 2] as const;
};
const frames = async (count = 3) => {
  for (let i = 0; i < count; i++) await nextFrame();
};
const pressEscape = () =>
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );

describe("moveBetweenLists", () => {
  it("moves one item between the arrays of a record, or within one", () => {
    const lists = Object.freeze({ a: [1, 2, 3], b: [4] });
    expect(moveBetweenLists(lists, { from: "a", to: "b", fromIndex: 1, index: 0 })).toEqual({
      a: [1, 3],
      b: [2, 4],
    });
    expect(moveBetweenLists(lists, { from: "a", to: "c", fromIndex: 0, index: 9 })).toEqual({
      a: [2, 3],
      b: [4],
      c: [1],
    });
    expect(moveBetweenLists(lists, { from: "a", to: "a", fromIndex: 0, index: 2 })["a"]).toEqual([
      2, 3, 1,
    ]);
    expect(moveBetweenLists(lists, { from: "x", to: "a", fromIndex: 0, index: 0 })).toEqual(lists);
    expect(lists.a).toEqual([1, 2, 3]);
  });
});

describe("keys across lists", () => {
  it("vertical lists: ←/→ move the item to the neighbor lists, keeping the index and the focus", async () => {
    const { order, handle, announced, transfers } = board([
      ["a", "vertical", [1, 2]],
      ["x", "vertical", [9], 'data-ok-group="other"'],
      ["b", "vertical", [3, 4, 5]],
    ]);
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowLeft}"); // no list before
    await userEvent.keyboard("{ArrowRight}"); // skips "x" (another group)
    expect(order("a")).toBe("1");
    expect(order("b")).toBe("3,2,4,5");
    expect(transfers).toEqual([["a", "b", 1, 1]]);
    expect(document.activeElement).toBe(handle(2));
    expect(handle(2).getAttribute("aria-pressed")).toBe("true");
    expect(announced()).toBe("Moved to List b, position 2 of 4.");
    await userEvent.keyboard("{ArrowDown}");
    expect(order("b")).toBe("3,4,2,5");
    await userEvent.keyboard("{Escape}"); // back to its start list and index
    expect(order("a")).toBe("1,2");
    expect(order("b")).toBe("3,4,5");
    expect(announced()).toBe("Reorder cancelled. Back at position 2 of 2.");
    await nextFrame();
    expect(document.activeElement).toBe(handle(2));
    expect(handle(2).getAttribute("aria-pressed")).toBe("false");
  });

  it("horizontal lists use ↑/↓ and drop in the new list", async () => {
    const { order, handle, announced } = board([
      ["a", "horizontal", [1, 2]],
      ["b", "horizontal", [3]],
    ]);
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    expect(order("b")).toBe("3,2"); // index 1 kept
    await userEvent.keyboard("{ArrowUp}");
    expect(order("a")).toBe("1,2");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard(" ");
    expect(announced()).toBe("Dropped at position 2 of 2.");
    expect(handle(2).getAttribute("aria-pressed")).toBe("false");
  });

  it("grids go past their ends; accept takes other groups, one way", async () => {
    const { order, handle } = board([
      ["a", "grid", [1, 2]],
      ["b", "grid", [3, 4], 'data-ok-group="done" data-ok-accept="g"'],
    ]);
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}"); // past the end: the next list's start
    expect(order("b")).toBe("2,3,4");
    await userEvent.keyboard("{ArrowLeft}"); // "a" doesn't accept "done": stays
    expect(order("b")).toBe("2,3,4");
    expect(order("a")).toBe("1");
    await userEvent.keyboard("{Escape}"); // "a" doesn't accept "done" either: it stays
    expect(order("b")).toBe("2,3,4");
    cleanupDom();
    for (const controller of controllers.splice(0)) controller.destroy();
    const back = board([
      ["a", "grid", [1, 2]],
      ["b", "grid", [3]],
    ]);
    back.handle(3).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowLeft}"); // past the start: the previous list's end
    expect(back.order("a")).toBe("1,2,3");
  });

  it("focus leaving the list holding the item drops it", async () => {
    const { handle } = board([
      ["a", "vertical", [1, 2]],
      ["b", "vertical", [3]],
    ]);
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await frames(4);
    handle(3).focus(); // inside the list holding it: still grabbed
    expect(handle(1).getAttribute("aria-pressed")).toBe("true");
    handle(2).focus();
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });
});

describe("taps and move-to triggers", () => {
  it("two taps move an item into another list; a list that doesn't take it grabs its own item", async () => {
    const { order, handle } = board([
      ["a", "vertical", [1, 2]],
      ["b", "vertical", [3, 4]],
      ["c", "vertical", [5], ""],
    ]);
    await userEvent.click(handle(1));
    await userEvent.click(handle(4));
    expect(order("a")).toBe("2");
    expect(order("b")).toBe("3,1,4");
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    await nextFrame();
    expect(document.activeElement).toBe(handle(1));
    await userEvent.click(handle(2));
    await userEvent.click(handle(5)); // "c" has no group
    expect(order("c")).toBe("5");
    expect(handle(2).getAttribute("aria-pressed")).toBe("false");
    expect(handle(5).getAttribute("aria-pressed")).toBe("true");
  });

  it("a refused tap move drops the item where it is", async () => {
    const { order, handle, announced } = board(
      [
        ["a", "vertical", [1]],
        ["b", "vertical", [2]],
      ],
      "dom",
      { onTransfer: () => false },
    );
    await userEvent.click(handle(1));
    await userEvent.click(handle(2));
    expect(order("a")).toBe("1");
    expect(announced()).toBe("Dropped at position 1 of 1.");
  });

  it("move-to triggers move an item to the end of the named list, empty lists too", async () => {
    const { order, handle, announced } = board([
      ["a", "vertical", [1, 2]],
      ["b", "vertical", []],
    ]);
    await userEvent.click(handle(1)); // grabbed, then moved by the trigger
    await userEvent.click(document.querySelector('[aria-label="Move 1"]') as HTMLElement);
    expect(order("b")).toBe("1");
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    expect(announced()).toBe("Moved to List b, position 1 of 1.");
    await nextFrame();
    expect(document.activeElement).toBe(handle(1));
    // Inside "b" the trigger names its own list; unknown ids do nothing either.
    await userEvent.click(document.querySelector('[aria-label="Move 1"]') as HTMLElement);
    expect(order("b")).toBe("1");
    document.querySelector('[aria-label="Move 2"]')?.setAttribute("data-ok-sortable-move-to", "z");
    await userEvent.click(document.querySelector('[aria-label="Move 2"]') as HTMLElement);
    expect(order("a")).toBe("2");
  });
});

describe("owners that render new elements", () => {
  it("the grab follows the new item: keys, focus, cancel", async () => {
    const { order, handle, announced } = board(
      [
        ["a", "vertical", [1, 2]],
        ["b", "vertical", [3]],
      ],
      "render",
    );
    handle(1).focus();
    await userEvent.keyboard(" ");
    // Both keys in one task: the second comes while the transfer is pending, and is ignored.
    for (const key of ["ArrowRight", "ArrowDown"])
      handle(1).dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
    await frames(4);
    expect(order("b")).toBe("1,3");
    expect(document.activeElement).toBe(handle(1));
    expect(handle(1).getAttribute("aria-pressed")).toBe("true");
    expect(announced()).toBe("Moved to List b, position 1 of 2.");
    await userEvent.keyboard("{ArrowDown}");
    await frames(4);
    expect(order("b")).toBe("3,1");
    await userEvent.keyboard("{Escape}");
    await frames(4);
    expect(order("a")).toBe("1,2");
    expect(document.activeElement).toBe(handle(1));
    expect(announced()).toMatch(/cancelled/);
  });

  it("taps and move-to triggers focus the new item", async () => {
    const { order, handle } = board(
      [
        ["a", "vertical", [1, 2]],
        ["b", "vertical", [3]],
      ],
      "render",
    );
    await userEvent.click(handle(1));
    await userEvent.click(handle(3));
    await frames(4);
    expect(order("b")).toBe("1,3");
    expect(document.activeElement).toBe(handle(1));
    await userEvent.click(document.querySelector('[aria-label="Move 2"]') as HTMLElement);
    await frames(4);
    expect(order("b")).toBe("1,3,2");
    expect(document.activeElement).toBe(handle(2));
  });

  it("an owner that accepts but never renders: the transfer is dropped after a few frames", async () => {
    mount(
      `<ul id="a" data-ok-sortable data-ok-layout="vertical" data-ok-group="g"><li data-ok-sortable-item><button type="button" data-ok-sortable-handle aria-label="h">h</button></li></ul><ul id="b" data-ok-sortable data-ok-group="g"></ul>`,
    );
    const silent = createSortableController(document.getElementById("a") as HTMLElement, {
      onTransfer: () => undefined,
    });
    const other = createSortableController(document.getElementById("b") as HTMLElement);
    controllers.push(silent, other);
    (document.querySelector("#a button") as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await frames(12);
    expect(silent.grabbed).toBe(0);
    other.destroy(); // "b" has no controller any more: no target
    await userEvent.keyboard("{ArrowRight}");
    await frames(12);
    expect(silent.grabbed).toBe(0);
  });

  it("lists without onTransfer never give items", async () => {
    mount(
      `<ul id="a" data-ok-sortable data-ok-layout="vertical" data-ok-group="g"><li data-ok-sortable-item><button type="button" data-ok-sortable-handle aria-label="h">h</button></li></ul><ul id="b" data-ok-sortable data-ok-group="g"></ul>`,
    );
    const a = createSortableController(document.getElementById("a") as HTMLElement);
    controllers.push(a, createSortableController(document.getElementById("b") as HTMLElement));
    (document.querySelector("#a button") as HTMLElement).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(a.grabbed).toBe(0);
  });
});

describe("pointer drags across lists", () => {
  it("onto another list's item, into an empty list, then Escape cancels back", () => {
    const { order, handle, el, announced } = board([
      ["a", "vertical", [1, 2]],
      ["b", "vertical", [3]],
      ["c", "vertical", []],
    ]);
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    const [bx, by] = center(document.querySelector('[data-id="3"]') as Element);
    pointer(handle(1), "pointermove", bx, by);
    expect(order("b")).toBe("1,3");
    expect(el("b").hasAttribute("data-ok-dragging")).toBe(true);
    expect(el("a").hasAttribute("data-ok-dragging")).toBe(false);
    expect(announced()).toBe("Moved to List b, position 1 of 2.");
    const [cx, cy] = center(el("c"));
    pointer(document.body, "pointermove", cx, cy);
    expect(order("c")).toBe("1");
    // Its own list's padding doesn't move it.
    const box = el("c").getBoundingClientRect();
    pointer(document.body, "pointermove", box.left + 2, box.top + 2);
    expect(order("c")).toBe("1");
    pressEscape();
    expect(order("a")).toBe("1,2");
    expect(order("c")).toBe("");
    expect(el("c").hasAttribute("data-ok-dragging")).toBe(false);
    expect(announced()).toMatch(/cancelled\. Back at position 1 of 2/);
  });

  it("the Scrollbar around a list is part of its box; lists of other groups are skipped", () => {
    mount(
      `${STYLE}<ul id="a" data-ok-sortable data-ok-group="g" aria-label="A">${itemHtml(1)}</ul><section data-ok-scrollbar style="padding: 20px"><ul id="b" data-ok-sortable data-ok-group="g" aria-label="B"></ul></section><ul id="c" data-ok-sortable data-ok-group="h">${itemHtml(2)}</ul>`,
    );
    const lists = ["a", "b", "c"].map((id) => document.getElementById(id) as HTMLElement);
    for (const list of lists)
      controllers.push(
        createSortableController(list, {
          onTransfer: ({ item, to }) => void to.append(item),
        }),
      );
    const handle = document.querySelector("#a [data-ok-sortable-handle]") as HTMLElement;
    const [x, y] = center(handle);
    pointer(handle, "pointerdown", x, y);
    pointer(handle, "pointermove", x + 10, y);
    const [cx, cy] = center(document.querySelector('#c [data-id="2"]') as Element);
    pointer(document.body, "pointermove", cx, cy);
    expect(lists[2]?.children).toHaveLength(1);
    const frame = (document.querySelector("section") as HTMLElement).getBoundingClientRect();
    pointer(document.body, "pointermove", frame.left + 5, frame.top + 5);
    expect(lists[1]?.children).toHaveLength(1);
    pointer(document.body, "pointerup", frame.left + 5, frame.top + 5);
    expect(document.querySelector("[data-ok-dragging]")).toBeNull();
  });

  it("an item rendered anew keeps being dragged, then drops", async () => {
    const { order, el, handle, announced } = board(
      [
        ["a", "vertical", [1, 2]],
        ["b", "vertical", [3]],
      ],
      "render",
    );
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    const [bx, by] = center(document.querySelector('[data-id="3"]') as Element);
    pointer(document.body, "pointermove", bx, by);
    pointer(document.body, "pointermove", bx, by + 1); // pending: no second transfer
    await frames(4);
    expect(order("b")).toBe("1,3");
    const moved = el("b").firstElementChild as HTMLElement;
    expect(moved.hasAttribute("data-ok-dragging")).toBe(true);
    expect(moved.style.transform).toMatch(/translate/);
    pointer(document.body, "pointerup", bx, by + 1);
    expect(moved.hasAttribute("data-ok-dragging")).toBe(false);
    expect(announced()).toBe("Dropped at position 1 of 2.");
  });

  it("pointercancel after a move to another list restores the item (owner that re-renders)", async () => {
    const { order, handle } = board(
      [
        ["a", "vertical", [1, 2]],
        ["b", "vertical", [3]],
      ],
      "render",
    );
    const [x, y] = center(handle(2));
    pointer(handle(2), "pointerdown", x, y);
    pointer(handle(2), "pointermove", x + 10, y);
    const [bx, by] = center(document.querySelector('[data-id="3"]') as Element);
    pointer(document.body, "pointermove", bx, by);
    await frames(4);
    expect(order("b")).toBe("2,3");
    pointer(document.body, "pointercancel", bx, by);
    await frames(4);
    expect(order("a")).toBe("1,2");
  });

  it("destroying the list of a drag in progress ends it", () => {
    const { handle, el } = board([
      ["a", "vertical", [1]],
      ["b", "vertical", [2]],
    ]);
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    (controllers[0] as SortableController).destroy();
    expect(el("a").hasAttribute("data-ok-dragging")).toBe(false);
    pointer(document.body, "pointermove", x + 40, y);
    expect(document.querySelector("[data-ok-dragging]")).toBeNull();
  });
});

describe("edge cases", () => {
  it("lists without a group give nothing; unnamed lists; clamped moves; registration order", async () => {
    mount(
      `${STYLE}<ul id="b" data-ok-sortable data-ok-layout="vertical" data-ok-group="g">${itemHtml(3)}</ul><ul id="a" data-ok-sortable data-ok-layout="vertical">${itemHtml(1)}${itemHtml(2)}</ul>`,
    );
    const onMove = (from: number, to: number) => {
      const list = document.getElementById("a") as HTMLElement;
      const all = [...list.children];
      list.insertBefore(
        all[from] as Element,
        to > from ? (all[to] as Element).nextSibling : (all[to] as Element),
      );
    };
    // Registered after "a" although it comes first in the page.
    const a = createSortableController(document.getElementById("a") as HTMLElement, {
      onMove,
      onTransfer: ({ item, to }) => void to.append(item),
    });
    const b = createSortableController(document.getElementById("b") as HTMLElement, {
      onTransfer: ({ item, to }) => void to.append(item),
    });
    controllers.push(a, b);
    const handle = (n: number) =>
      document.querySelector(`[data-id="${n}"] [data-ok-sortable-handle]`) as HTMLElement;
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowUp}"); // already first
    await userEvent.keyboard("{ArrowLeft}"); // no group: no other list
    expect(a.grabbed).toBe(0);
    await userEvent.keyboard("{Escape}");
    // "b" gives to "a"? "a" has no group and no accept: no.
    handle(3).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(b.grabbed).toBe(0);
    await userEvent.keyboard("{Escape}");
    document.getElementById("a")?.setAttribute("data-ok-accept", "g");
    handle(3).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.getElementById("a")?.lastElementChild).toBe(handle(3).closest("li"));
    expect(document.querySelector("[data-ok-sortable-announcer]")?.textContent).toBe(
      "Moved to another list, position 3 of 3.",
    );
    // A grabbed item removed by its owner: no index any more.
    handle(3).closest("li")?.remove();
    expect(a.grabbed).toBe(-1);
  });

  it("presses and clicks that do nothing", async () => {
    const { handle, el, order } = board([
      ["a", "vertical", [1, 2]],
      ["b", "vertical", [3]],
    ]);
    await userEvent.click(el("a").querySelector("span") as HTMLElement); // not a handle
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    const [x, y] = center(handle(1));
    // A press whose item goes away before the drag starts.
    pointer(handle(2), "pointerdown", ...center(handle(2)));
    handle(2).closest("li")?.remove();
    pointer(document.body, "pointermove", x + 40, y);
    expect(document.querySelector("[data-ok-dragging]")).toBeNull();
    pointer(document.body, "pointerup", x + 40, y);
    // Keys during a press other than Escape; Escape before the drag starts.
    pointer(handle(1), "pointerdown", x, y);
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    pressEscape();
    pointer(handle(1), "pointermove", x + 10, y);
    // A second press during the drag is ignored; the pointer over nothing changes nothing.
    pointer(handle(3), "pointerdown", ...center(handle(3)));
    pointer(document.body, "pointermove", 1, 1);
    expect(order("a")).toBe("1");
    expect(el("a").hasAttribute("data-ok-dragging")).toBe(true);
    pointer(document.body, "pointerup", 1, 1);
    expect(document.querySelector("[data-ok-dragging]")).toBeNull();
  });

  it("a sortable that has no controller isn't a target", () => {
    const { handle } = board([["a", "vertical", [1]]]);
    mount(`<ul id="z" data-ok-sortable data-ok-group="g" style="min-height: 80px"></ul>`);
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    pointer(document.body, "pointermove", ...center(document.getElementById("z") as Element));
    expect(document.getElementById("z")?.children).toHaveLength(0);
    pointer(document.body, "pointerup", 0, 0);
  });

  it("a drag that ends while the transfer is pending; a grab removed before its focus returns", async () => {
    const { handle, el } = board(
      [
        ["a", "vertical", [1, 2]],
        ["b", "vertical", [3]],
      ],
      "render",
    );
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    pointer(document.body, "pointermove", ...center(el("b").firstElementChild as Element));
    pointer(document.body, "pointerup", 0, 0); // before the owner renders
    await frames(4);
    expect(document.querySelector("[data-ok-dragging]")).toBeNull();
    expect(handle(1).closest("ul")).toBe(el("b"));
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowUp}");
    handle(2).closest("li")?.remove(); // gone before the focus is restored
    await frames(4);
  });

  it("owners that drop the item (or never render) leave nothing to follow", async () => {
    mount(
      `${STYLE}<ul id="a" data-ok-sortable data-ok-layout="vertical" data-ok-group="g" aria-label="A">${itemHtml(1)}${itemHtml(2)}${itemHtml(4)}</ul><ul id="b" data-ok-sortable data-ok-group="g" aria-label="B"></ul>`,
    );
    const lost = createSortableController(document.getElementById("a") as HTMLElement, {
      // Accepted, but the item is deleted instead of moved (or never moved at all).
      onTransfer: ({ item }) => {
        if (item.dataset["id"] === "1") later(() => item.remove());
      },
    });
    controllers.push(lost, createSortableController(document.getElementById("b") as HTMLElement));
    const handle = (n: number) =>
      document.querySelector(`[data-id="${n}"] [data-ok-sortable-handle]`) as HTMLElement;
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    await frames(4);
    expect(document.getElementById("b")?.children).toHaveLength(0);
    // Taps and move-to triggers whose owner never applies them.
    await userEvent.click(handle(2));
    await userEvent.click(document.querySelector('[aria-label="Move 2"]') as HTMLElement);
    await frames(12);
    expect(handle(2).closest("ul")?.id).toBe("a");
    await userEvent.click(handle(4));
    const empty = document.getElementById("b") as HTMLElement;
    empty.append(Object.assign(document.createElement("li"), { innerHTML: itemHtml(9) }));
    await frames(12);
  });

  it("a refused cancel back to a list that doesn't take the item announces it in place", async () => {
    const { order, handle, announced } = board([
      ["a", "vertical", [1]],
      ["b", "vertical", [2], 'data-ok-group="done" data-ok-accept="g"'],
    ]);
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    pointer(document.body, "pointermove", ...center(handle(2).closest("li") as Element));
    expect(order("b")).toBe("1,2");
    pressEscape();
    expect(order("b")).toBe("1,2");
    expect(announced()).toMatch(/cancelled/);
  });
});
