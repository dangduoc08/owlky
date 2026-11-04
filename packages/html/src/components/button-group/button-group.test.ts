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

describe("button group snippets", () => {
  it("covers every variant × group, plus sizes and orientation", () => {
    expect(snippets).toHaveLength(14);
  });

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    expectNamedButtons(host);
    const groups = host.querySelectorAll<HTMLElement>("[data-mt-button-group]");
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.getAttribute("role")).toBe("group");
      expect(group.getAttribute("aria-label")).toBeTruthy();
      expect(["horizontal", "vertical"]).toContain(group.dataset["mtOrientation"]);
      for (const child of group.children) expect(child.hasAttribute("data-mt-button")).toBe(true);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

describe("button group CSS without JavaScript", () => {
  it("joins the buttons without gaps and squares the inner corners", () => {
    const button = (label: string) =>
      `<button type="button" data-mt-button data-mt-variant="outlined" data-mt-color="primary" data-mt-size="md"><span data-mt-button-label>${label}</span></button>`;
    const host = mount(
      `<div role="group" data-mt-button-group data-mt-orientation="horizontal" aria-label="x">${button("A")}${button("B")}</div>`,
    );
    const [a, b] = host.querySelectorAll("button") as unknown as HTMLElement[];
    expect((b as HTMLElement).getBoundingClientRect().left).toBe(
      (a as HTMLElement).getBoundingClientRect().right,
    );
    expect(getComputedStyle(a as HTMLElement).borderTopRightRadius).toBe("0px");
    expect(getComputedStyle(a as HTMLElement).borderRightColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(b as HTMLElement).borderTopLeftRadius).toBe("0px");
  });
});
