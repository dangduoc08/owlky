// Disabled items, drag events and custom announcements (roadmap 4.18.76).
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
import disabled from "./examples/disabled-items-group.html?raw";
import { sortable } from "./sortable.js";

let runtime: Runtime;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;

beforeEach(() => {
  runtime = createRuntime().register(sortable).start();
});

afterEach(() => {
  runtime.stop();
  resetPage();
});

const order = () =>
  [...$("#sortable-disabled").querySelectorAll(":scope > [data-ok-sortable-item] > span")]
    .map((span) => span.textContent)
    .join(",");
const announced = () => $("[data-ok-sortable-announcer]").textContent;

describe("disabled items snippet", () => {
  it("a pinned item with a disabled handle; CSP-safe, no axe violations", async () => {
    const host = mount(disabled);
    expectNamedButtons(host);
    expectCspSafe(host, disabled);
    const pinned = $("#sortable-disabled > li");
    expect(pinned.hasAttribute("data-ok-disabled")).toBe(true);
    expect(($('[aria-label="Reorder Overview"]') as HTMLButtonElement).disabled).toBe(true);
    expect(getComputedStyle($('[aria-label="Reorder Overview"]')).cursor).toBe("default");
    await expectNoAxeViolations(host);
  });

  it("other items can't take its place; drag events report each step", async () => {
    mount(disabled);
    await settle();
    const events: string[] = [];
    for (const name of ["dragstart", "dragover", "dragend", "dragcancel"])
      $("#sortable-disabled").addEventListener(`ok:sortable:${name}`, (event) => {
        const { item, index, list } = (event as CustomEvent).detail;
        events.push(`${name}:${item.textContent.trim()}@${index} in ${list.id}`);
      });
    $('[aria-label="Reorder Sales"]').focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowUp}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Escape}");
    expect(order()).toBe("Overview (pinned),Sales,Orders,Visitors,Reviews");
    expect(events).toEqual([
      "dragstart:Sales@1 in sortable-disabled",
      "dragover:Sales@2 in sortable-disabled",
      "dragcancel:Sales@2 in sortable-disabled",
    ]);
    await userEvent.keyboard(" ");
    await userEvent.keyboard(" ");
    expect(events.at(-1)).toBe("dragend:Sales@1 in sortable-disabled");
  });
});

describe("custom announcements", () => {
  it("data-ok-message-* replace the texts, with {position}, {total} and {list}", async () => {
    mount(disabled);
    const list = $("#sortable-disabled");
    list.setAttribute("data-ok-message-grabbed", "Pris : {position} sur {total} ({list}).");
    list.setAttribute("data-ok-message-moved", "Déplacé en {position}.");
    await settle();
    $('[aria-label="Reorder Sales"]').focus();
    await userEvent.keyboard(" ");
    expect(announced()).toBe("Pris : 2 sur 5 (Dashboard widgets).");
    await userEvent.keyboard("{ArrowDown}");
    expect(announced()).toBe("Déplacé en 3.");
    list.removeAttribute("data-ok-message-moved"); // read when announced: back to the default
    await userEvent.keyboard("{ArrowDown}");
    expect(announced()).toBe("Moved to position 4 of 5.");
    await userEvent.keyboard(" ");
  });
});
