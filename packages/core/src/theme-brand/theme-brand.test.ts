import { contrastRatio, createTheme, defaultTheme, hexToRgb, themeToCss } from "@owlky/tokens";
import { afterEach, describe, expect, it } from "vitest";
import { applyThemeBrand } from "./index.js";

const rgb = (hex: string) => `rgb(${hexToRgb(hex).join(", ")})`;
const style = document.createElement("style");

afterEach(() => {
  applyThemeBrand(null);
  style.remove();
  document.body.replaceChildren();
});

function probe(markup: string, value: string): string {
  style.textContent = themeToCss(defaultTheme);
  document.head.append(style);
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.append(host);
  const element = host.querySelector("#probe") as HTMLElement;
  element.style.color = value;
  return getComputedStyle(element).color;
}

describe("applyThemeBrand", () => {
  const brand = createTheme({ brand: { primary: "#0E7490" } });
  const P = '<span id="probe"></span>';

  it("derives every axis from the brand color on the root", () => {
    expect(applyThemeBrand({ primary: "#0E7490", secondary: "nope" })).toEqual({
      primary: "#0E7490",
    });
    expect(probe(P, "var(--ok-palette-primary-main)")).toBe(rgb(brand.palette.primary.main));
    expect(probe(`<div data-ok-theme="dark">${P}</div>`, "var(--ok-palette-primary-text)")).toBe(
      rgb(brand.schemes.dark.paletteText.primary),
    );
    expect(probe(`<div data-ok-contrast="high">${P}</div>`, "var(--ok-palette-primary-main)")).toBe(
      rgb(brand.highContrast.palette.primary.main),
    );
    expect(probe(P, "var(--ok-palette-primary-lighter)")).toBe(rgb(brand.palette.primary.lighter));
    expect(
      contrastRatio(brand.schemes.light.paletteText.primary, "#FFFFFF"),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("targets a nested scope and removes its colors with null", () => {
    const scope = document.createElement("section");
    document.body.append(scope);
    applyThemeBrand({ primary: "#0E7490" }, { target: scope });
    expect(scope.getAttribute("data-ok-style")).toBe("soft");
    const inner = document.createElement("span");
    scope.append(inner);
    inner.style.color = "var(--ok-palette-primary-main)";
    style.textContent = themeToCss(defaultTheme);
    document.head.append(style);
    expect(getComputedStyle(inner).color).toBe(rgb(brand.palette.primary.main));
    applyThemeBrand(null, { target: scope });
    expect(scope.style.length).toBe(0);
    expect(getComputedStyle(inner).color).toBe(rgb(defaultTheme.palette.primary.main));
  });

  it("ignores invalid colors and writes nothing", () => {
    expect(applyThemeBrand({ primary: "red" })).toEqual({});
    expect(document.documentElement.style.length).toBe(0);
  });
});
