import { dividerVariants, orientations } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("divider snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(5));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-divider]")) {
      expect(dividerVariants).toContain(root.dataset["okVariant"]);
      expect(orientations).toContain(root.dataset["okOrientation"]);
      const vertical = root.dataset["okOrientation"] === "vertical";
      const text = root.querySelector(":scope > [data-ok-divider-text]");
      expect(root.localName).toBe(text ? "div" : "hr");
      if (text) expect(root.getAttribute("role")).toBe("separator");
      expect(root.getAttribute("aria-orientation") ?? "horizontal").toBe(
        vertical ? "vertical" : "horizontal",
      );
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});
