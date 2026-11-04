import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import grid from "./examples/grid-group.html?raw";
import horizontal from "./examples/horizontal-group.html?raw";
import vertical from "./examples/vertical-group.html?raw";
import { type SortableInstance, sortable } from "./sortable.js";

let runtime: Runtime;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;

beforeEach(() => {
  runtime = createRuntime().register(sortable).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
  vi.restoreAllMocks();
});

const order = (id = "sortable-grid") =>
  [...$(`#${id}`).querySelectorAll(":scope > [data-ok-sortable-item] > span")]
    .map((span) => span.textContent)
    .join(",");
const instance = (id = "sortable-grid") =>
  runtime.get<SortableInstance>($(`#${id}`), "sortable") as SortableInstance;

describe("sortable snippets", () => {
  it.each([
    ["grid", grid],
    ["vertical", vertical],
    ["horizontal", horizontal],
  ])(
    "%s: named list, handles and remove buttons, CSP-safe, no axe violations",
    async (layout, html) => {
      const host = mount(html);
      expectNamedButtons(host);
      expectCspSafe(host, html);
      const list = host.querySelector("[data-ok-sortable]") as HTMLElement;
      expect(list.dataset["okLayout"]).toBe(layout);
      expect(list.getAttribute("aria-label")).toBeTruthy();
      expect(list.querySelectorAll(":scope > [data-ok-sortable-item]")).toHaveLength(12);
      expect(list.querySelector(":scope > template[data-ok-sortable-template]")).not.toBeNull();
      await expectNoAxeViolations(host);
    },
  );
});

describe("sortable runtime", () => {
  it("reorders the DOM with the keyboard and emits cancelable move events", async () => {
    mount(grid);
    await settle();
    const moves: unknown[] = [];
    $("#sortable-grid").addEventListener("ok:sortable:move", (event) => {
      const { from, to, item } = (event as CustomEvent).detail;
      moves.push([from, to, item.textContent.trim().split(/\s/)[0]]);
    });
    $('[aria-label="Reorder item 1"]').focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(order().startsWith("2,1,3")).toBe(true);
    expect(moves).toEqual([[0, 1, "1"]]);
    expect(instance().move(2, 0)).toBe(true); // backwards through the API
    expect(order().startsWith("3,2,1")).toBe(true);
    moves.length = 0;
    $("#sortable-grid").addEventListener("ok:sortable:move", (event) => event.preventDefault());
    await userEvent.keyboard("{ArrowRight}");
    expect(order().startsWith("3,2,1")).toBe(true);
  });

  it("removes items (cancelable) and adds clones of the template", async () => {
    mount(grid);
    await settle();
    const added = vi.fn();
    $("#sortable-grid").addEventListener("ok:sortable:add", added);
    await userEvent.click($('[aria-label="Remove item 2"]'));
    expect(order()).toBe("1,3,4,5,6,7,8,9,10,11,12");
    $("#sortable-grid").addEventListener("ok:sortable:remove", (event) => event.preventDefault(), {
      once: true,
    });
    expect(instance().remove(0)).toBe(false);
    await userEvent.click($("[data-ok-sortable-add]"));
    expect(added).toHaveBeenCalledOnce();
    const { item, index } = (added.mock.lastCall as [CustomEvent])[0].detail;
    expect(index).toBe(11);
    expect(item.matches("[data-ok-sortable-item]")).toBe(true);
    expect($("#sortable-grid").lastElementChild?.localName).toBe("template");
  });

  it("instance API validates indexes; add without a template returns null", async () => {
    mount(
      '<ul id="bare" data-ok-sortable aria-label="Bare"><li data-ok-sortable-item><span>1</span></li></ul><button type="button" data-ok-sortable-add="bare">Add</button><button type="button" data-ok-sortable-add="missing">Add</button>',
    );
    await settle();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bare = instance("bare");
    expect(bare.move(0, 0)).toBe(false);
    expect(bare.move(0, 5)).toBe(false);
    expect(bare.move(5, 0)).toBe(false);
    expect(bare.remove(3)).toBe(false);
    expect(bare.add()).toBeNull();
    const empty = document.createElement("template");
    empty.setAttribute("data-ok-sortable-template", "");
    $("#bare").append(empty);
    expect(bare.add()).toBeNull();
    (document.querySelectorAll("[data-ok-sortable-add]")[1] as HTMLElement).click();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("is destroyed with the runtime and ignores React-owned lists", async () => {
    mount(`<div data-ok-runtime="off">${vertical}</div>`);
    await settle();
    expect(runtime.get($("#sortable-vertical"), "sortable")).toBeUndefined();
    runtime.stop();
    $('[aria-label="Reorder item 1"]').click();
    expect($('[aria-label="Reorder item 1"]').getAttribute("aria-pressed")).toBe("false");
  });
});
