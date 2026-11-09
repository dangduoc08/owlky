import { paperElevations, paperVariants } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6'/%3E";
// Snippet pictures live in Storybook's static folder: point them at an inline picture here.
const local = (html: string) => html.replaceAll(/src="images\/[^"]+"/g, `src="${PIXEL}"`);

/** The computed value of `box-shadow: <value>` (engines serialize shadows differently). */
function shadowOf(value: string, scope: Element = document.body) {
  const probe = document.createElement("div");
  probe.style.boxShadow = value;
  scope.append(probe);
  const shadow = getComputedStyle(probe).boxShadow;
  probe.remove();
  return shadow;
}

/** The shadow a card casts for its options (spec: card.md, "Layout and tokens"). */
function expectedShadow(card: HTMLElement) {
  const level = card.dataset["okElevation"];
  if (card.dataset["okVariant"] === "outlined") return "none";
  if (card.hasAttribute("data-ok-raised")) return shadowOf("var(--ok-elevation-8)");
  if (level === "0") return "none";
  return shadowOf(level === "1" ? "var(--ok-shadow-card)" : `var(--ok-elevation-${level})`);
}

describe("card snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(10));

  it.each(snippets)("%s: a Paper root with the card marker and its shadow", (_, html) => {
    const host = mount(local(html));
    const cards = host.querySelectorAll<HTMLElement>("[data-ok-card]");
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.hasAttribute("data-ok-paper")).toBe(true);
      expect(paperVariants).toContain(card.dataset["okVariant"]);
      expect(paperElevations).toContain(card.dataset["okElevation"]);
      const style = getComputedStyle(card);
      expect(style.boxShadow).toBe(expectedShadow(card));
      expect(style.borderRadius).toBe("16px");
      expect(style.overflow).toBe("hidden");
    }
    for (const part of host.querySelectorAll("[data-ok-card-content]"))
      expect(getComputedStyle(part).padding).toBe("24px");
    for (const part of host.querySelectorAll("[data-ok-card-actions]"))
      expect(getComputedStyle(part).display).toBe("flex");
    for (const area of host.querySelectorAll("[data-ok-card-action-area]")) {
      expect(["BUTTON", "A"]).toContain(area.tagName);
      if (area.tagName === "BUTTON") expect(area.getAttribute("type")).toBe("button");
      expect(area.getBoundingClientRect().width).toBe(
        area.parentElement?.getBoundingClientRect().width,
      );
    }
  });

  it("header parts: the title and subheader are Typography", () => {
    const html = snippets.find(([path]) => path.endsWith("complex-interaction-group.html"))?.[1];
    const host = mount(local(html ?? ""));
    const title = host.querySelector<HTMLElement>("[data-ok-card-header-title]");
    const subheader = host.querySelector<HTMLElement>("[data-ok-card-header-subheader]");
    expect(title?.dataset["okTypography"]).toBe("");
    expect(title?.dataset["okVariant"]).toBe("h6");
    expect(subheader?.dataset["okVariant"]).toBe("body2");
    expect(getComputedStyle(subheader as Element).marginTop).toBe("4px");
    expect(getComputedStyle(host.querySelector("[data-ok-card-header]") as Element).padding).toBe(
      "24px 24px 0px",
    );
    // The method is a Collapse around the card content: it starts hidden; the page script shows it.
    const method = host.querySelector<HTMLElement>("#card-garden-method");
    expect(method?.hidden).toBe(true);
    expect(method?.dataset["okCollapse"]).toBe("");
    expect(method?.dataset["okTimeout"]).toBe("auto");
    expect(method?.firstElementChild?.hasAttribute("data-ok-card-content")).toBe(true);
  });

  it("media: a media element fills the width; other elements hold a cover image", () => {
    const html = snippets
      .filter(([path]) => /media-(background|img)\.html$/.test(path))
      .map(([, snippet]) => snippet)
      .join("");
    const host = mount(local(html));
    const [cover, img] = host.querySelectorAll<HTMLElement>("[data-ok-card-media]");
    const image = cover?.querySelector("[data-ok-card-media-image]") as HTMLImageElement;
    expect(image.alt).toBe("");
    expect(image.getBoundingClientRect().width).toBe(cover?.getBoundingClientRect().width);
    expect(getComputedStyle(image).objectFit).toBe("cover");
    expect(img?.tagName).toBe("IMG");
    expect(img?.getBoundingClientRect().width).toBe(
      img?.parentElement?.getBoundingClientRect().width,
    );
  });

  it("works without JavaScript: unknown values fall back to the card surface", () => {
    const host = mount(
      '<div data-ok-paper data-ok-card data-ok-variant="x" data-ok-elevation="99">Card</div>' +
        "<div data-ok-paper data-ok-card>Bare</div>",
    );
    for (const card of host.querySelectorAll("[data-ok-card]")) {
      expect(getComputedStyle(card).boxShadow).toBe(shadowOf("var(--ok-shadow-card)"));
      expect(getComputedStyle(card).borderStyle).toBe("none");
    }
  });

  it("dark scope: the dark paper", () => {
    const host = mount(
      '<div data-ok-theme="dark"><div data-ok-paper data-ok-card data-ok-variant="elevation" data-ok-elevation="1">Dark</div></div>',
    );
    expect(getComputedStyle(host.querySelector("[data-ok-card]") as Element).backgroundColor).toBe(
      "rgb(28, 37, 46)",
    );
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(local(html)));
  });
});
