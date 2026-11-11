import { avatarColors, avatarVariants } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { avatar } from "./avatar.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/%3E";
const BROKEN = "data:image/png;base64,broken";
// Snippet images live in Storybook's static folder: point them at an inline pixel here.
const local = (html: string) => html.replaceAll(/src="avatars\/[^"]+"/g, `src="${PIXEL}"`);

describe("avatar snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(9));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(local(html));
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-avatar]")) {
      expect(avatarVariants).toContain(root.dataset["okVariant"]);
      expect(avatarColors).toContain(root.dataset["okColor"]);
      for (const img of root.querySelectorAll(":scope > img"))
        expect(img.getAttribute("alt")).not.toBeNull();
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(local(html));
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("avatar runtime", () => {
  it("data-ok-swatch paints a color dot; the group's surplus becomes text", async () => {
    const host = mount(
      '<div data-ok-avatar-group data-ok-spacing="6" role="img" aria-label="Colors"><span data-ok-avatar data-ok-size="16" data-ok-swatch="#FF9800"></span><span data-ok-avatar data-ok-size="16" data-ok-swatch="url(x)"></span><span data-ok-avatar data-ok-size="16" data-ok-avatar-surplus>+13</span></div>',
    );
    start();
    await settle();
    const [dot, bad, surplus] = host.querySelectorAll<HTMLElement>(
      "[data-ok-avatar]",
    ) as unknown as [HTMLElement, HTMLElement, HTMLElement];
    expect(getComputedStyle(dot).backgroundColor).toBe("rgb(255, 152, 0)");
    expect(getComputedStyle(dot).width).toBe("16px");
    expect(getComputedStyle(bad).backgroundColor).toBe("rgb(145, 158, 171)");
    expect(getComputedStyle(surplus).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(surplus).fontSize).toBe("14px");
    expect(getComputedStyle(surplus).width).not.toBe("16px");
    dot.setAttribute("data-ok-swatch", "#2196F3");
    await settle();
    expect(getComputedStyle(dot).backgroundColor).toBe("rgb(33, 150, 243)");
    runtime?.stop();
    expect(dot.style.getPropertyValue("--_ok-swatch")).toBe("");
  });

  const one = (attrs: string, inner = "") =>
    mount(
      `<span data-ok-avatar data-ok-variant="circular" data-ok-color="default" ${attrs}>${inner}</span>`,
    ).firstElementChild as HTMLElement;

  it("data-ok-size becomes the size and follows changes", async () => {
    const root = one('data-ok-size="56"', "A");
    start();
    expect(getComputedStyle(root).width).toBe("56px");
    root.setAttribute("data-ok-size", "2rem");
    await settle();
    expect(root.style.getPropertyValue("--_ok-avatar-size")).toBe("2rem");
    root.setAttribute("data-ok-size", '"><img src=x onerror=alert(1)>');
    await settle();
    expect(root.style.getPropertyValue("--_ok-avatar-size")).toBe("");
    runtime?.destroy(root);
    expect(root.style.length).toBe(0);
    expect(components).toContain(avatar);
  });

  it("a broken image is hidden and replaced by its alt's first letter", async () => {
    start();
    const root = one("", `<img src="${BROKEN}" alt="ada lovelace">`);
    await expect.poll(() => root.querySelector("[data-ok-avatar-fallback]")?.textContent).toBe("A");
    expect(root.querySelector("img")?.hidden).toBe(true);
    const withText = one("", `<img src="${BROKEN}" alt="x">Z`);
    await expect.poll(() => withText.querySelector("img")?.hidden).toBe(true);
    expect(withText.querySelector("[data-ok-avatar-fallback]")).toBeNull();
    const noAlt = one("", `<img src="${BROKEN}" alt="">`);
    await expect.poll(() => noAlt.querySelector("img")?.hidden).toBe(true);
    expect(noAlt.querySelector("[data-ok-avatar-fallback]")).toBeNull();
  });

  it("an image that breaks later is caught by the delegated error listener", async () => {
    const root = one("", '<img alt="hopper">');
    start();
    await settle();
    (root.querySelector("img") as HTMLImageElement).src = BROKEN;
    await expect.poll(() => root.querySelector("[data-ok-avatar-fallback]")?.textContent).toBe("H");
  });

  it("an image that failed before the runtime started also falls back", async () => {
    const root = one("", `<img src="${BROKEN}" alt="grace">`);
    const img = root.querySelector("img") as HTMLImageElement;
    await new Promise((resolve) => {
      if (img.complete) resolve(null);
      img.addEventListener("error", resolve, { once: true });
    });
    start();
    await settle();
    expect(root.querySelector("[data-ok-avatar-fallback]")?.textContent).toBe("G");
  });
});
