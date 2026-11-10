import { fabColors, fabSizes, fabVariants } from "@owlky/core";
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
    for (const fab of host.querySelectorAll<HTMLElement>("[data-ok-fab]")) {
      expect(fabVariants).toContain(fab.dataset["okVariant"]);
      expect(fabColors).toContain(fab.dataset["okColor"]);
      expect(fabSizes).toContain(fab.dataset["okSize"]);
      // Round fabs are named by aria-label, extended fabs by their label.
      expect(fab.hasAttribute("aria-label")).toBe(!fab.hasAttribute("data-ok-extended"));
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
      '<button type="button" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="lg" aria-label="a"></button>' +
        '<button type="button" data-ok-fab data-ok-variant="soft" data-ok-color="info" data-ok-size="sm" data-ok-extended>Label</button>' +
        '<button type="button" data-ok-fab data-ok-variant="bogus" data-ok-color="nope" data-ok-size="huge" aria-label="c"></button>',
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

  it("a disabled router link that keeps its href gets no pointer events", () => {
    const host = mount(
      '<a href="/new" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" aria-label="New"><svg aria-hidden="true" viewBox="0 0 24 24"></svg></a>' +
        '<a href="/off" aria-disabled="true" tabindex="-1" data-ok-fab data-ok-variant="contained" data-ok-color="primary" data-ok-size="md" aria-label="Off"><svg aria-hidden="true" viewBox="0 0 24 24"></svg></a>',
    );
    const [link, off] = [...host.querySelectorAll<HTMLElement>("[data-ok-fab]")] as HTMLElement[];
    expect(getComputedStyle(link as HTMLElement).pointerEvents).toBe("auto");
    expect(getComputedStyle(off as HTMLElement).pointerEvents).toBe("none");
  });
});
