import { iconButtonColors, iconButtonSizes } from "@owlky/core";
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

describe("icon button snippets", () => {
  it("covers every story", () => expect(snippets).toHaveLength(4));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    for (const button of host.querySelectorAll<HTMLElement>("[data-ok-icon-button]")) {
      expect(iconButtonColors).toContain(button.dataset["okColor"]);
      expect(iconButtonSizes).toContain(button.dataset["okSize"]);
      expect(button.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("icon button CSS without JavaScript", () => {
  it("sizes the button and its icon; unknown values fall back to the defaults", () => {
    const host = mount(
      '<button type="button" data-ok-icon-button data-ok-size="lg" aria-label="a"><svg aria-hidden="true" viewBox="0 0 24 24"></svg></button>' +
        '<button type="button" data-ok-icon-button data-ok-size="huge" data-ok-color="nope" aria-label="b"></button>',
    );
    const [large, fallback] = host.querySelectorAll("button") as unknown as HTMLElement[];
    expect((large as HTMLElement).getBoundingClientRect().height).toBe(48);
    expect(
      ((large as HTMLElement).querySelector("svg") as SVGElement).getBoundingClientRect().width,
    ).toBe(24);
    expect((fallback as HTMLElement).getBoundingClientRect().height).toBe(36);
    expect(getComputedStyle(fallback as HTMLElement).color).toBe("rgb(99, 115, 129)");
  });
});
