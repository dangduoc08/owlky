// Several lists (ADR-0053): the Kanban snippet with the whole runtime (menus, popovers).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
import { components } from "../index.js";
import kanban from "./examples/kanban-group.html?raw";
import type { SortableInstance } from "./sortable.js";

let runtime: Runtime;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;

beforeEach(() => {
  runtime = createRuntime()
    .register(...components)
    .start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
});

const column = (id: string) =>
  [
    ...$(`#kanban-${id}`).querySelectorAll(
      ":scope > [data-ok-sortable-item] .sb-kanban-card > span",
    ),
  ]
    .map((span) => span.textContent)
    .join(",");
const handle = (title: string) => $(`[aria-label="Reorder ${title}"]`);
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("kanban snippet", () => {
  it("four named lists in one group, an empty one; CSP-safe, no axe violations", async () => {
    const host = mount(kanban);
    expectNamedButtons(host);
    expectCspSafe(host, kanban);
    const lists = host.querySelectorAll<HTMLElement>("[data-ok-sortable]");
    expect([...lists].map((list) => list.dataset["okGroup"])).toEqual(Array(4).fill("kanban"));
    expect(column("done")).toBe("");
    // An empty list of a group keeps a drop target's height.
    expect($("#kanban-done").getBoundingClientRect().height).toBeGreaterThanOrEqual(80);
    await expectNoAxeViolations(host);
  });

  it("moves a task to the next column with the keyboard; the transfer event is cancelable", async () => {
    mount(kanban);
    await settle();
    const transfers: unknown[] = [];
    $("#kanban-todo").addEventListener("ok:sortable:transfer", (event) => {
      const { from, to, index } = (event as CustomEvent).detail;
      transfers.push([from.id, to.id, index]);
    });
    handle("Book the venue").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(column("todo")).toBe("Write the brief,Send invitations");
    expect(column("progress")).toBe("Design the poster,Book the venue,Plan the budget");
    expect(transfers).toEqual([["kanban-todo", "kanban-progress", 1]]);
    expect(document.activeElement).toBe(handle("Book the venue"));
    expect($("[data-ok-sortable-announcer]").textContent).toBe(
      "Moved to In progress, position 2 of 3.",
    );
    await userEvent.keyboard(" ");
    $("#kanban-progress").addEventListener("ok:sortable:transfer", (event) =>
      event.preventDefault(),
    );
    handle("Design the poster").focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(column("progress")).toBe("Design the poster,Book the venue,Plan the budget");
  });

  it("the Move menu moves a task to the end of a column, the empty one too", async () => {
    mount(kanban);
    await settle();
    await userEvent.click($('[aria-label="Move Pick the menu"]'));
    await userEvent.click($("#task-6-menu [data-ok-sortable-move-to='kanban-done']"));
    expect(column("review")).toBe("");
    expect(column("done")).toBe("Pick the menu");
    await frame();
    await frame();
    expect($("#kanban-done").contains(document.activeElement)).toBe(true);
    expect($("#task-6-menu").hasAttribute("data-ok-open")).toBe(false);
  });

  it("instance transfer: by element or id, clamped index, validated", async () => {
    mount(kanban);
    await settle();
    const todo = runtime.get<SortableInstance>($("#kanban-todo"), "sortable") as SortableInstance;
    expect(todo.transfer(0, "kanban-done")).toBe(true);
    expect(todo.transfer(0, $("#kanban-done"), 0)).toBe(true);
    expect(column("done")).toBe("Book the venue,Write the brief");
    expect(todo.transfer(0, $("#kanban-review"), 99)).toBe(true);
    expect(column("review")).toBe("Pick the menu,Send invitations");
    expect(todo.transfer(0, "kanban-done")).toBe(false); // no item left
    const done = runtime.get<SortableInstance>($("#kanban-done"), "sortable") as SortableInstance;
    expect(done.transfer(0, "missing")).toBe(false);
    expect(done.transfer(0, "kanban-done")).toBe(false);
    expect(done.transfer(0, $("h3"))).toBe(false);
  });
});
