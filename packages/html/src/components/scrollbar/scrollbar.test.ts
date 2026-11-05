import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

afterEach(resetPage);

describe("scrollbar snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(3));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    const areas = host.querySelectorAll<HTMLElement>("[data-ok-scrollbar]");
    expect(areas).toHaveLength(1);
    for (const area of areas) {
      expect(area.localName).toBe("section");
      expect(area.getAttribute("aria-label")).toBe("scrollable content");
      expect(area.tabIndex).toBe(0);
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    await expectNoAxeViolations(mount(html));
  });
});

/** The thumb color in effect, resolved by the engine (works for both scrollbar paths). */
const thumb = (area: Element) => {
  const probe = document.createElement("i");
  probe.style.color = "var(--_ok-scrollbar-now)";
  area.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};
const GREY_500 = /145,? 158,? 171/;
const GREY_600 = /99,? 115,? 129/;
const TRANSPARENT = /^(transparent|rgba\(0, 0, 0, 0\))$/;
const AREA = (attrs = "") =>
  `<section data-ok-scrollbar aria-label="a" tabindex="0" ${attrs} style="height: 40px"><p style="height: 200px">x</p></section>`;

describe("scrollbar CSS without JavaScript", () => {
  it("scrolls natively and hides the thumb at rest", () => {
    const area = mount(AREA()).querySelector("[data-ok-scrollbar]") as HTMLElement;
    expect(getComputedStyle(area).overflow).toBe("auto");
    expect(area.scrollHeight).toBeGreaterThan(area.clientHeight);
    expect(thumb(area)).toMatch(TRANSPARENT);
  });

  it("shows the thumb on hover and while focused; auto-hide off keeps it", async () => {
    const host = mount(`${AREA()}${AREA('data-ok-auto-hide="false"')}`);
    const [hovered, always] = host.querySelectorAll<HTMLElement>("[data-ok-scrollbar]");
    await userEvent.hover(hovered as HTMLElement);
    expect(thumb(hovered as HTMLElement)).toMatch(GREY_500);
    await userEvent.unhover(hovered as HTMLElement);
    (hovered as HTMLElement).focus();
    expect(thumb(hovered as HTMLElement)).toMatch(GREY_500);
    expect(thumb(always as HTMLElement)).toMatch(GREY_500);
    expect(thumb(always as HTMLElement)).toMatch(/0\.48/);
  });

  it("uses the dark disabled tone in dark themes", () => {
    const host = mount(`<div data-ok-theme="dark">${AREA('data-ok-auto-hide="false"')}</div>`);
    const area = host.querySelector("[data-ok-scrollbar]") as HTMLElement;
    const supported = CSS.supports("color", "light-dark(#000, #fff)");
    expect(thumb(area)).toMatch(supported ? GREY_600 : GREY_500);
  });

  it("styles the native bar on the standard or the -webkit- path", () => {
    const area = mount(AREA('data-ok-auto-hide="false"')).querySelector(
      "[data-ok-scrollbar]",
    ) as HTMLElement;
    if (CSS.supports("scrollbar-color", "auto")) {
      // Playwright's headless Firefox hides every scrollbar (`none` on any element).
      const plain = getComputedStyle(document.body).scrollbarWidth;
      expect(getComputedStyle(area).scrollbarWidth).toBe(plain === "none" ? "none" : "thin");
      expect(getComputedStyle(area).scrollbarColor).toMatch(GREY_500);
    } else {
      expect(area.offsetWidth - area.clientWidth).toBe(11);
    }
  });
});
