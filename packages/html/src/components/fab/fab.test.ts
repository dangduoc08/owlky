import { fabColors, fabSizes, fabVariants } from "@minimal-tailwind/core";
import { afterEach, describe, expect, it } from "vitest";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
} from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("fab snippets", () => {
  it("covers every variant × group, plus animate", () => expect(snippets).toHaveLength(13));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const fab of host.querySelectorAll<HTMLElement>("[data-mt-fab]")) {
      expect(fabVariants).toContain(fab.dataset["mtVariant"]);
      expect(fabColors).toContain(fab.dataset["mtColor"]);
      expect(fabSizes).toContain(fab.dataset["mtSize"]);
      // Round fabs are named by aria-label, extended fabs by their label.
      expect(fab.hasAttribute("aria-label")).toBe(!fab.hasAttribute("data-mt-extended"));
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("fab CSS without JavaScript", () => {
  it("styles round and extended fabs; unknown values fall back to the defaults", () => {
    const host = mount(
      '<button type="button" data-mt-fab data-mt-variant="contained" data-mt-color="primary" data-mt-size="lg" aria-label="a"></button>' +
        '<button type="button" data-mt-fab data-mt-variant="soft" data-mt-color="info" data-mt-size="sm" data-mt-extended>Label</button>' +
        '<button type="button" data-mt-fab data-mt-variant="bogus" data-mt-color="nope" data-mt-size="huge" aria-label="c"></button>',
    );
    const [round, extended, fallback] = host.querySelectorAll("button") as unknown as HTMLElement[];
    const box = (el: HTMLElement | undefined) => (el as HTMLElement).getBoundingClientRect();
    expect([box(round).width, box(round).height]).toEqual([56, 56]);
    expect(getComputedStyle(round as HTMLElement).backgroundColor).toBe("rgb(0, 167, 111)");
    expect(box(extended).height).toBe(36);
    expect(getComputedStyle(extended as HTMLElement).backgroundColor).toBe(
      "rgba(0, 184, 217, 0.16)",
    );
    expect(box(fallback).height).toBe(48);
    expect(getComputedStyle(fallback as HTMLElement).backgroundColor).toBe("rgb(223, 227, 232)");
  });
});
