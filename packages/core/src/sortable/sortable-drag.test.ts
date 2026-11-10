// Disabled items, drag events and auto scroll (roadmap 4.18.76).
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createSortableController,
  type SortableController,
  type SortableControllerOptions,
  type SortableDragEvent,
} from "./sortable-controller.js";

const controllers: SortableController[] = [];
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  cleanupDom();
  window.scrollTo(0, 0);
});

const STYLE = `<style>
  [data-ok-sortable] { display: flex; gap: 10px; margin: 0; padding: 10px; list-style: none; }
  [data-ok-sortable][data-ok-layout="vertical"] { flex-direction: column; }
  [data-ok-sortable-item] { flex: 0 0 50px; min-width: 50px; position: relative; }
  [data-ok-dragging] [data-ok-dragging] { pointer-events: none; }
</style>`;

const item = (id: number, disabled = false) =>
  `<li data-ok-sortable-item data-id="${id}"${disabled ? " data-ok-disabled" : ""}><span>${id}</span><button type="button" data-ok-sortable-move-to="b" aria-label="Move ${id}">m</button><button type="button" data-ok-sortable-handle aria-pressed="false" aria-label="Reorder ${id}"${disabled ? " disabled" : ""}>h</button></li>`;

/** A list in `wrapper` (`%` = the list) with a DOM owner. */
function setup(
  ids: number[],
  {
    disabled = [] as number[],
    layout = "vertical",
    wrapper = "%",
    attrs = "",
    ...options
  }: {
    disabled?: number[];
    layout?: string;
    wrapper?: string;
    attrs?: string;
  } & SortableControllerOptions = {},
) {
  const list = `<ul id="a" data-ok-sortable data-ok-layout="${layout}" data-ok-group="g" aria-label="A" ${attrs}>${ids.map((id) => item(id, disabled.includes(id))).join("")}</ul>`;
  mount(
    `${STYLE}${wrapper.replace("%", list)}<ul id="b" data-ok-sortable data-ok-group="g" aria-label="B"></ul>`,
  );
  const el = document.getElementById("a") as HTMLElement;
  const dom = (owner: HTMLElement) => ({
    onMove: (from: number, to: number) => {
      const all = [...owner.children];
      owner.insertBefore(
        all[from] as Element,
        to > from ? (all[to] as Element).nextSibling : (all[to] as Element),
      );
    },
    onTransfer: ({
      item: moved,
      to,
      index,
    }: {
      item: HTMLElement;
      to: HTMLElement;
      index: number;
    }) => void to.insertBefore(moved, [...to.children][index] ?? null),
  });
  controllers.push(createSortableController(el, { ...dom(el), ...options }));
  const b = document.getElementById("b") as HTMLElement;
  controllers.push(createSortableController(b, dom(b)));
  const order = () => [...el.children].map((li) => (li as HTMLElement).dataset["id"]).join(",");
  const handle = (n: number) =>
    document.querySelector(`[data-id="${n}"] [data-ok-sortable-handle]`) as HTMLButtonElement;
  return { el, order, handle };
}

function pointer(target: Element, type: string, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 3,
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
const scrolled = (target: EventTarget) =>
  new Promise((resolve) => target.addEventListener("scroll", resolve, { once: true }));
/** Short summary of drag events: `<kind>:<item id>@<index> in <list id>`. */
const summary = (kind: string) => (event: SortableDragEvent) =>
  `${kind}:${event.item.dataset["id"]}@${event.index} in ${event.list.id}`;

describe("disabled items", () => {
  it("can't be grabbed, dragged or moved by a trigger", async () => {
    const { order, handle } = setup([1, 2, 3], { disabled: [1] });
    handle(1).click();
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    // A handle without the native `disabled` still refuses (the item's attribute decides).
    handle(1).removeAttribute("disabled");
    handle(1).click();
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x, y + 40);
    expect(document.querySelector("[data-ok-dragging]")).toBeNull();
    pointer(handle(1), "pointerup", x, y + 40);
    await userEvent.click(document.querySelector('[aria-label="Move 1"]') as HTMLElement);
    expect(order()).toBe("1,2,3");
  });

  it("are skipped by keys: the item jumps past them, or stays when none is left", async () => {
    const { order, handle } = setup([1, 2, 3, 4, 5], { disabled: [1, 3] });
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowUp}"); // only a disabled item before it
    expect(order()).toBe("1,2,3,4,5");
    await userEvent.keyboard("{ArrowDown}"); // past 3
    expect(order()).toBe("1,3,4,2,5");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}"); // already last
    expect(order()).toBe("1,3,4,5,2");
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{ArrowUp}"); // 3 then 1: no place left before them
    expect(order()).toBe("1,3,2,4,5");
  });

  it("aren't pointer targets", () => {
    const { order, handle } = setup([1, 2, 3], { disabled: [1] });
    const [x, y] = center(handle(3));
    pointer(handle(3), "pointerdown", x, y);
    pointer(handle(3), "pointermove", x, y - 10);
    pointer(document.body, "pointermove", ...center(handle(1).closest("li") as Element));
    expect(order()).toBe("1,2,3");
    pointer(document.body, "pointermove", ...center(handle(2).closest("li") as Element));
    expect(order()).toBe("1,3,2");
    pointer(document.body, "pointerup", 0, 0);
  });
});

describe("drag events", () => {
  it("keys and taps: start, over (also into another list), end, cancel", async () => {
    const events: string[] = [];
    const { handle } = setup([1, 2, 3], {
      onDragStart: (e) => events.push(summary("start")(e)),
      onDragOver: (e) => events.push(summary("over")(e)),
      onDragEnd: (e) => events.push(summary("end")(e)),
      onDragCancel: (e) => events.push(summary("cancel")(e)),
    });
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard(" ");
    expect(events.splice(0)).toEqual(["start:1@0 in a", "over:1@1 in a", "end:1@1 in a"]);
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Escape}");
    expect(events.splice(0)).toEqual(["start:1@1 in a", "cancel:1@1 in a"]);
    await userEvent.click(handle(1));
    await userEvent.click(handle(3));
    expect(events.splice(0)).toEqual(["start:1@1 in a", "over:1@2 in a", "end:1@2 in a"]);
    // Into the other list: "over" names it; "b" has no callbacks, so its own end is silent.
    handle(2).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(events.splice(0)).toEqual(["start:2@0 in a", "over:2@0 in b"]);
  });

  it("a tap into another list ends there (or in place when refused)", async () => {
    const ends: string[] = [];
    mount(
      `${STYLE}<ul id="a" data-ok-sortable data-ok-group="g">${item(1)}${item(2)}</ul><ul id="b" data-ok-sortable data-ok-group="g">${item(3)}</ul>`,
    );
    const a = document.getElementById("a") as HTMLElement;
    const b = document.getElementById("b") as HTMLElement;
    let refuse = false;
    controllers.push(
      createSortableController(a, {
        onTransfer: ({ item: moved, to }) => (refuse ? false : void to.prepend(moved)),
        onDragEnd: (e) => ends.push(summary("end")(e)),
      }),
      createSortableController(b, { onDragEnd: (e) => ends.push(summary("end")(e)) }),
    );
    const handle = (n: number) =>
      document.querySelector(`[data-id="${n}"] [data-ok-sortable-handle]`) as HTMLElement;
    await userEvent.click(handle(1));
    await userEvent.click(handle(3));
    expect(ends.splice(0)).toEqual(["end:1@0 in b"]);
    refuse = true;
    await userEvent.click(handle(2));
    await userEvent.click(handle(3));
    expect(ends.splice(0)).toEqual(["end:2@0 in a"]);
  });

  it("pointer drags: start, over, end; pointercancel cancels", () => {
    const events: string[] = [];
    const { handle } = setup([1, 2, 3], {
      onDragStart: (e) => events.push(summary("start")(e)),
      onDragOver: (e) => events.push(summary("over")(e)),
      onDragEnd: (e) => events.push(summary("end")(e)),
      onDragCancel: (e) => events.push(summary("cancel")(e)),
    });
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x, y + 10);
    pointer(document.body, "pointermove", ...center(handle(2).closest("li") as Element));
    pointer(document.body, "pointerup", 0, 0);
    expect(events.splice(0)).toEqual(["start:1@0 in a", "over:1@1 in a", "end:1@1 in a"]);
    const [x1, y1] = center(handle(1));
    pointer(handle(1), "pointerdown", x1, y1);
    pointer(handle(1), "pointermove", x1 + 10, y1);
    pointer(document.body, "pointercancel", 0, 0);
    expect(events.splice(0)).toEqual(["start:1@1 in a", "cancel:1@1 in a"]);
  });
});

describe("auto scroll", () => {
  const SCROLLER = `<div id="s" style="height: 150px; width: 300px; overflow: auto">%</div>`;

  it("scrolls the container the pointer is near the edge of, and moves the item meanwhile", async () => {
    const { order, handle } = setup([1, 2, 3, 4, 5, 6, 7, 8], { wrapper: SCROLLER });
    const scroller = document.getElementById("s") as HTMLElement;
    const box = scroller.getBoundingClientRect();
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x, y + 10);
    pointer(document.body, "pointermove", x, box.bottom - 2);
    await scrolled(scroller);
    expect(scroller.scrollTop).toBeGreaterThan(0);
    // The top edge scrolls back; the item keeps following the pointer.
    for (let i = 0; i < 4; i++) await nextFrame();
    expect(order().startsWith("1,")).toBe(false);
    const top = scroller.scrollTop;
    pointer(document.body, "pointermove", x, box.top + 2);
    for (let i = 0; i < 4; i++) await nextFrame();
    expect(scroller.scrollTop).toBeLessThan(top);
    pointer(document.body, "pointerup", 0, 0);
  });

  it("scrolls horizontally, stops at the content's end, and leaves containers the pointer isn't over", async () => {
    const { handle } = setup([1, 2, 3, 4, 5, 6, 7, 8], {
      wrapper: SCROLLER,
      layout: "horizontal",
    });
    const scroller = document.getElementById("s") as HTMLElement;
    const box = scroller.getBoundingClientRect();
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x + 10, y);
    pointer(document.body, "pointermove", box.right + 40, y); // past the edge: top speed
    await scrolled(scroller);
    const max = scroller.scrollWidth - scroller.clientWidth;
    for (let i = 0; i < 40 && scroller.scrollLeft < max - 1; i++) await nextFrame();
    expect(scroller.scrollLeft).toBeGreaterThan(0);
    const end = scroller.scrollLeft;
    for (let i = 0; i < 4; i++) await nextFrame();
    expect(scroller.scrollLeft).toBe(end); // no further than the content
    pointer(document.body, "pointermove", box.right + 40, box.bottom + 40); // outside on both axes
    pointer(document.body, "pointerup", 0, 0);
  });

  it("scrolls the page near the window's edges", async () => {
    const { handle } = setup([1, 2], { wrapper: `%<div style="height: 3000px"></div>` });
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x, y + 10);
    pointer(document.body, "pointermove", x, window.innerHeight - 1);
    await scrolled(window);
    expect(window.scrollY).toBeGreaterThan(0);
    pointer(document.body, "pointerup", 0, 0);
  });

  it('is off with data-ok-auto-scroll="false"', async () => {
    const onScroll = vi.fn();
    const { handle } = setup([1, 2, 3, 4, 5, 6, 7, 8], {
      wrapper: SCROLLER,
      attrs: 'data-ok-auto-scroll="false"',
    });
    const scroller = document.getElementById("s") as HTMLElement;
    scroller.addEventListener("scroll", onScroll);
    const [x, y] = center(handle(1));
    pointer(handle(1), "pointerdown", x, y);
    pointer(handle(1), "pointermove", x, y + 10);
    pointer(document.body, "pointermove", x, scroller.getBoundingClientRect().bottom - 2);
    for (let i = 0; i < 5; i++) await nextFrame();
    expect(scroller.scrollTop).toBe(0);
    pointer(document.body, "pointerup", 0, 0);
  });
});
