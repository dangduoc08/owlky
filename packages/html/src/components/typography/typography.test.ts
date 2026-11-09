import {
  typographyAligns,
  typographyColors,
  typographyVariantMapping,
  typographyVariantNames,
} from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("typography snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-typography]")) {
      const variant = root.dataset["okVariant"] as (typeof typographyVariantNames)[number];
      expect(typographyVariantNames).toContain(variant);
      if (root.dataset["okColor"] !== undefined)
        expect(typographyColors).toContain(root.dataset["okColor"]);
      if (root.dataset["okAlign"] !== undefined)
        expect(typographyAligns).toContain(root.dataset["okAlign"]);
      // Usage keeps the default element; other stories pick theirs.
      if (_.endsWith("usage-group.html") && !["button", "caption", "overline"].includes(variant))
        expect(root.localName).toBe(typographyVariantMapping[variant]);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });

  it("styles a plain element from its attributes, without JavaScript", () => {
    const host = mount(
      '<div style="width: 60px"><p data-ok-typography data-ok-variant="h4" data-ok-color="error" data-ok-no-wrap>A long heading line</p></div>',
    );
    const root = host.querySelector("p") as HTMLElement;
    const style = getComputedStyle(root);
    expect(style.margin).toBe("0px");
    expect(style.whiteSpace).toBe("nowrap");
    expect(style.textOverflow).toBe("ellipsis");
    expect(root.scrollWidth).toBeGreaterThan(root.clientWidth);
    const probe = document.createElement("span");
    probe.style.fontSize = "var(--ok-typography-h4-font-size)";
    probe.style.color = "var(--ok-palette-error-main)";
    host.append(probe);
    expect(style.fontSize).toBe(getComputedStyle(probe).fontSize);
    expect(style.color).toBe(getComputedStyle(probe).color);
  });

  it("an unknown variant gets no type scale styles", () => {
    const host = mount(
      '<div style="font-size: 30px"><p data-ok-typography data-ok-variant="&quot;&gt;&lt;img onerror&gt;">x</p></div>',
    );
    expect(getComputedStyle(host.querySelector("p") as Element).fontSize).toBe("30px");
  });
});
