import { linkColors, linkUnderlines, typographyVariantNames } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

const resolve = (property: "color" | "textDecorationColor", value: string) => {
  const probe = document.createElement("span");
  probe.style[property] = value;
  document.body.append(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
};

describe("link snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(6));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const links = host.querySelectorAll<HTMLElement>("[data-ok-link]");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.hasAttribute("data-ok-typography")).toBe(true);
      expect(typographyVariantNames).toContain(link.dataset["okVariant"]);
      expect(linkColors).toContain(link.dataset["okColor"]);
      expect(linkUnderlines).toContain(link.dataset["okUnderline"]);
      // A destination is a link with a real href; an action is a button.
      if (link.localName === "a") expect(link.getAttribute("href")).toMatch(/^(#|https:)/);
      else expect(link.outerHTML).toMatch(/^<button type="button"/);
      if (link.getAttribute("target") === "_blank")
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    // Laid out like the story row (Storybook's flex row with a gap), as standalone links are.
    const row = mount(html);
    row.style.cssText = "display: flex; flex-wrap: wrap; gap: 0.75rem";
    await expectNoAxeViolations(row);
  });

  it("styles a plain link from its attributes, without JavaScript", async () => {
    const host = mount(
      '<p style="font-size: 30px; color: rgb(1, 2, 3)">Read <a href="#a" data-ok-typography data-ok-link data-ok-variant="inherit" data-ok-color="error" data-ok-underline="always">the guide</a> or <a href="#b" data-ok-typography data-ok-link data-ok-variant="inherit" data-ok-color="inherit" data-ok-underline="hover">the notes</a>.</p>',
    );
    const [error, inherit] = host.querySelectorAll("a") as unknown as [HTMLElement, HTMLElement];
    const style = getComputedStyle(error);
    expect(style.fontSize).toBe("30px");
    expect(style.color).toBe(resolve("color", "var(--ok-palette-error-text)"));
    expect(style.textDecorationLine).toBe("underline");
    expect(style.textDecorationColor).toBe(
      resolve("textDecorationColor", "rgb(var(--ok-palette-error-main-channel) / 0.4)"),
    );
    expect(getComputedStyle(inherit).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(inherit).textDecorationLine).toBe("none");
    await userEvent.hover(inherit);
    expect(getComputedStyle(inherit).textDecorationLine).toBe("underline");
    await userEvent.unhover(inherit);
  });

  it("unknown values get no link styles beyond the defaults", () => {
    const host = mount(
      '<div style="color: rgb(1, 2, 3)"><a href="#x" data-ok-typography data-ok-link data-ok-color="&quot;&gt;&lt;img onerror&gt;" data-ok-underline="../x">x</a></div>',
    );
    const link = host.querySelector("a") as HTMLElement;
    expect(getComputedStyle(link).textDecorationLine).toBe("none");
  });
});
