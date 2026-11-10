// Swapping strategy and whole-item drags (roadmap 4.18.77).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import vertical from "./examples/vertical-group.html?raw";
import { type SortableInstance, sortable } from "./sortable.js";

let runtime: Runtime;

beforeEach(() => {
  runtime = createRuntime().register(sortable).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

/** The vertical snippet with extra list attributes. */
async function setup(attrs: string) {
  const host = mount(
    vertical.replace('data-ok-layout="vertical"', `data-ok-layout="vertical" ${attrs}`),
  );
  await settle();
  const list = host.querySelector("[data-ok-sortable]") as HTMLElement;
  const items = () => [...list.querySelectorAll<HTMLElement>(":scope > [data-ok-sortable-item]")];
  const order = () =>
    items()
      .slice(0, 5)
      .map((li) => li.querySelector("span")?.textContent)
      .join(",");
  const handle = (n: number) =>
    items()[n]?.querySelector("[data-ok-sortable-handle]") as HTMLButtonElement;
  return { host, list, items, order, handle };
}

function pointer(target: EventTarget, type: string, x: number, y: number) {
  return target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 3,
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

describe("sortable swap strategy", () => {
  it("swaps two items with the keyboard and fires a cancelable ok:sortable:swap", async () => {
    const { list, order, handle, items } = await setup('data-ok-strategy="swap"');
    const before = order().split(",");
    const seen: unknown[] = [];
    list.addEventListener("ok:sortable:swap", (event) => {
      const { from, to } = (event as CustomEvent<{ from: number; to: number }>).detail;
      seen.push([from, to]);
    });
    const first = items()[0];
    handle(0).focus();
    await userEvent.keyboard(" {ArrowDown}{ArrowDown} ");
    expect(seen).toEqual([[0, 2]]);
    expect(order().split(",")).toEqual([before[2], before[1], before[0], before[3], before[4]]);
    expect(items()[2]).toBe(first);
  });

  it("a prevented swap keeps the order; the instance swaps adjacent and distant items", async () => {
    const { list, order } = await setup('data-ok-strategy="swap"');
    const instance = runtime.get<SortableInstance>(list, "sortable") as SortableInstance;
    const start = order();
    const [a, b, c] = start.split(",");
    expect(instance.swap(0, 1)).toBe(true);
    expect(order().split(",").slice(0, 3)).toEqual([b, a, c]);
    expect(instance.swap(1, 0)).toBe(true);
    expect(instance.swap(2, 0)).toBe(true);
    expect(order().split(",").slice(0, 3)).toEqual([c, b, a]);
    expect(instance.swap(0, 0)).toBe(false);
    expect(instance.swap(0, 99)).toBe(false);
    list.addEventListener("ok:sortable:swap", (event) => event.preventDefault());
    expect(instance.swap(0, 2)).toBe(false);
    expect(order().split(",").slice(0, 3)).toEqual([c, b, a]);
  });

  it("drags from the whole item with data-ok-activator", async () => {
    const { host, list, order, items } = await setup(
      'data-ok-strategy="swap" data-ok-activator="item"',
    );
    const start = order().split(",");
    const text = items()[0]?.querySelector("span") as HTMLElement;
    const [x, y] = center(text);
    pointer(text, "pointerdown", x, y);
    const [x2, y2] = center(items()[1] as HTMLElement);
    pointer(document, "pointermove", x2, y2);
    expect(items()[1]?.hasAttribute("data-ok-swap-target")).toBe(true);
    await expectNoAxeViolations(host);
    pointer(document, "pointerup", x2, y2);
    expect(order().split(",").slice(0, 2)).toEqual([start[1], start[0]]);
    expect(list.querySelector("[data-ok-swap-target]")).toBeNull();
  });
});
