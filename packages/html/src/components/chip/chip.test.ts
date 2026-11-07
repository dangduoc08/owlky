import { chipColors, chipVariants } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
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
import { type ChipInstance, chip } from "./chip.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/%3E";
const local = (html: string) => html.replaceAll(/src="avatars\/[^"]+"/g, `src="${PIXEL}"`);

describe("chip snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(12));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(local(html));
    expectNamedButtons(host);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-chip]")) {
      expect(chipVariants).toContain(root.dataset["okVariant"]);
      expect(chipColors).toContain(root.dataset["okColor"]);
      expect(
        root.querySelector(":scope > [data-ok-chip-action] > [data-ok-chip-label]"),
      ).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(local(html));
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("chip runtime", () => {
  const html = (id: string) =>
    `<span id="${id}" data-ok-chip data-ok-variant="filled" data-ok-color="default" data-ok-size="medium"><button type="button" data-ok-chip-action><span data-ok-chip-label>${id}</span></button><button type="button" data-ok-chip-delete aria-label="Remove ${id}">x</button></span>`;

  it("the delete button and Backspace / Delete emit a cancelable ok:chip:delete, then hide", async () => {
    const host = mount(
      html("a") +
        html("b") +
        html("c") +
        `<span data-ok-chip data-ok-variant="filled" data-ok-color="default" data-ok-size="medium"><button type="button" data-ok-chip-action><span data-ok-chip-label>keep</span></button></span>`,
    );
    const rt = start();
    const chips = [...host.querySelectorAll<HTMLElement>("[data-ok-chip]")];
    const events: string[] = [];
    host.addEventListener("ok:chip:delete", (event) =>
      events.push((event.target as HTMLElement).id),
    );
    chips[1]?.addEventListener("ok:chip:delete", (event) => event.preventDefault());
    await userEvent.click(host.querySelector('[aria-label="Remove a"]') as HTMLElement);
    await userEvent.click(host.querySelector('[aria-label="Remove b"]') as HTMLElement);
    (chips[2] as HTMLElement).querySelector<HTMLElement>("[data-ok-chip-action]")?.focus();
    await userEvent.keyboard("{Delete}");
    (chips[3] as HTMLElement).querySelector<HTMLElement>("[data-ok-chip-action]")?.focus();
    await userEvent.keyboard("{Backspace}");
    await userEvent.keyboard("a");
    expect(chips.map((c) => c.hidden)).toEqual([true, false, true, false]);
    expect(events).toEqual(["a", "b", "c"]);
    expect(rt.get<ChipInstance>(chips[1] as Element, "chip")?.delete()).toBe(false);
    expect(components).toContain(chip);
  });
});
