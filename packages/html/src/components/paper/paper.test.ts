import { paperElevations, paperVariants } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

/** The computed value of `box-shadow: <value>` (engines serialize shadows differently). */
function shadowOf(value: string, scope: Element = document.body) {
  const probe = document.createElement("div");
  probe.style.boxShadow = value;
  scope.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

describe("paper snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(4));

  it.each(snippets)("%s: valid anatomy and the shadow of its level", (_, html) => {
    const host = mount(html);
    const papers = host.querySelectorAll<HTMLElement>("[data-ok-paper]");
    expect(papers.length).toBeGreaterThan(0);
    for (const paper of papers) {
      const variant = paper.dataset["okVariant"] as (typeof paperVariants)[number];
      const level = paper.dataset["okElevation"] as (typeof paperElevations)[number];
      expect(paperVariants).toContain(variant);
      expect(paperElevations).toContain(level);
      expect(paper.hasAttribute("role")).toBe(false);
      const style = getComputedStyle(paper);
      const expected =
        variant === "outlined" || level === "0"
          ? "none"
          : shadowOf(`var(--ok-elevation-${level})`, paper.parentElement as Element);
      expect(style.boxShadow).toBe(expected);
      expect(style.borderRadius).toBe(paper.hasAttribute("data-ok-square") ? "0px" : "10px");
    }
  });

  it("works without JavaScript: unknown values fall back to the base surface", () => {
    const host = mount(
      '<div data-ok-paper data-ok-variant="x" data-ok-elevation="99">Paper</div>' +
        "<div data-ok-paper>Bare</div>",
    );
    for (const paper of host.querySelectorAll("[data-ok-paper]")) {
      expect(getComputedStyle(paper).boxShadow).toBe(shadowOf("var(--ok-elevation-1)"));
      expect(getComputedStyle(paper).borderStyle).toBe("none");
    }
  });

  it("dark scope: the dark paper, the same shadow levels", () => {
    const host = mount(
      '<div data-ok-theme="dark"><div data-ok-paper data-ok-variant="elevation" data-ok-elevation="4">Dark</div></div>',
    );
    const paper = host.querySelector("[data-ok-paper]") as HTMLElement;
    expect(getComputedStyle(paper).backgroundColor).toBe("rgb(24, 24, 27)");
    expect(getComputedStyle(paper).boxShadow).toBe(
      shadowOf("var(--ok-elevation-4)", paper.parentElement as Element),
    );
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});
