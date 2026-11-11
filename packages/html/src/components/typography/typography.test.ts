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
  it("covers every story group", () => expect(snippets).toHaveLength(12));

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

  it("clamps text to data-ok-max-lines lines; persistent keeps their height", () => {
    const text = "A sentence far too long for eighty pixels, ".repeat(8);
    const host = mount(
      `<div style="width: 80px"><p data-ok-typography data-ok-variant="body1" data-ok-max-lines="2">${text}</p><p data-ok-typography data-ok-variant="body1" data-ok-max-lines="4" data-ok-persistent>Short</p><p data-ok-typography data-ok-variant="body1" data-ok-max-lines="11">Short</p></div>`,
    );
    const [clamped, persistent, unknown] = host.querySelectorAll("p") as unknown as HTMLElement[];
    expect(getComputedStyle(clamped as Element).webkitLineClamp).toBe("2");
    expect((clamped as Element).getBoundingClientRect().height).toBe(48);
    expect((persistent as Element).getBoundingClientRect().height).toBe(96);
    // A line count outside 1–10 has no rule: every line shows.
    expect(getComputedStyle(unknown as Element).webkitLineClamp).toBe("none");
  });

  it("an unknown variant gets no type scale styles", () => {
    const host = mount(
      '<div style="font-size: 30px"><p data-ok-typography data-ok-variant="&quot;&gt;&lt;img onerror&gt;">x</p></div>',
    );
    expect(getComputedStyle(host.querySelector("p") as Element).fontSize).toBe("30px");
  });
});
