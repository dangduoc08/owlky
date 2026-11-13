import { imageEffects, imageFits, imageOverlays, imagePositions, imageRatios } from "@owlky/core";
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
import { type ImageInstance, image } from "./image.js";

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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6'/%3E";
const OTHER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='8'/%3E";
const BROKEN = "data:image/png;base64,AAAA";
// Snippet images live in Storybook's static folder: point them at an inline picture here.
const local = (html: string) =>
  html
    .replaceAll(/src="images\/missing\.svg"/g, `src="${BROKEN}"`)
    .replaceAll(/src="images\/[^"]+"/g, `src="${PIXEL}"`)
    .replaceAll(/srcset="[^"]*"/g, "");

const DEFAULTS = 'data-ok-fit="cover" data-ok-position="center" data-ok-effect="blur"';
/** An image root; `attrs` override the defaults (the first of two equal attributes wins). */
const markup = (src: string, attrs = "", img = "") =>
  `<span data-ok-image ${attrs} ${DEFAULTS}><span data-ok-image-placeholder aria-hidden="true"></span><img src="${src}" alt="A picture" ${img}></span>`;
const rootOf = (host: Element) => host.querySelector("[data-ok-image]") as HTMLElement;
const imgOf = (host: Element) => host.querySelector("[data-ok-image] > img") as HTMLImageElement;

/** Resolves once the root's `data-ok-state` is `state` (a MutationObserver, never polling). */
function stateIs(root: HTMLElement, state: string): Promise<void> {
  if (root.getAttribute("data-ok-state") === state) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (root.getAttribute("data-ok-state") !== state) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-ok-state"] });
  });
}

describe("image snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(7));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(local(html));
    const roots = host.querySelectorAll<HTMLElement>("[data-ok-image]");
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      expect(root.tagName).toBe("SPAN");
      expect(root.hasAttribute("data-ok-state")).toBe(false);
      expect(imageFits).toContain(root.dataset["okFit"]);
      expect(imagePositions).toContain(root.dataset["okPosition"]);
      expect(imageEffects).toContain(root.dataset["okEffect"]);
      if (root.dataset["okRatio"]) expect(imageRatios).toContain(root.dataset["okRatio"]);
      if (root.dataset["okOverlay"]) {
        expect(imageOverlays).toContain(root.dataset["okOverlay"]);
        expect(root.querySelector(":scope > [data-ok-image-overlay]")).not.toBeNull();
      }
      const img = root.querySelector(":scope > img") as HTMLImageElement;
      expect(img.hasAttribute("alt")).toBe(true);
      expect(img.getAttribute("decoding")).toBe("async");
      expect(["lazy", "eager"]).toContain(img.getAttribute("loading"));
      const placeholder = root.querySelector(":scope > [data-ok-image-placeholder]");
      expect(placeholder?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(local(html));
    start();
    // Lazy pictures below the test page stay loading: scan whatever state each one reached.
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("image CSS", () => {
  it("shows the picture without JavaScript (no state)", () => {
    const host = mount(markup(PIXEL, 'data-ok-ratio="16/9"'));
    const root = rootOf(host);
    root.style.width = "320px";
    expect(root.getBoundingClientRect().height).toBeCloseTo(180, 0);
    expect(getComputedStyle(imgOf(host)).opacity).toBe("1");
    expect(getComputedStyle(imgOf(host)).objectFit).toBe("cover");
    const placeholder = host.querySelector("[data-ok-image-placeholder]") as Element;
    expect(getComputedStyle(placeholder).opacity).toBe("0");
  });

  it("hides the picture behind the placeholder while loading", () => {
    const host = mount(markup(PIXEL, 'data-ok-state="loading"'));
    expect(getComputedStyle(imgOf(host)).opacity).toBe("0");
    expect(getComputedStyle(imgOf(host)).filter).toBe("blur(12px)");
    const placeholder = host.querySelector("[data-ok-image-placeholder]") as Element;
    expect(getComputedStyle(placeholder).opacity).toBe("1");
    expect(getComputedStyle(placeholder).backgroundImage).toContain("radial-gradient");
  });

  it.each([
    ["opacity", "none"],
    ["black-and-white", "grayscale(1)"],
    ["none", "none"],
  ])("effect %s while loading: filter %s", (effect, filter) => {
    const host = mount(markup(PIXEL, `data-ok-state="loading" data-ok-effect="${effect}"`));
    expect(getComputedStyle(imgOf(host)).filter).toBe(filter);
  });

  it("shows visible-by-default pictures at once and hides their placeholder", () => {
    const host = mount(markup(PIXEL, 'data-ok-state="loading" data-ok-visible-by-default'));
    expect(getComputedStyle(imgOf(host)).opacity).toBe("1");
    const placeholder = host.querySelector("[data-ok-image-placeholder]") as Element;
    expect(getComputedStyle(placeholder).display).toBe("none");
    const off = mount(markup(PIXEL, 'data-ok-state="loading" data-ok-disable-placeholder'));
    expect(
      getComputedStyle(off.querySelector("[data-ok-image-placeholder]") as Element).display,
    ).toBe("none");
  });

  it("maps fit, position and every ratio", () => {
    const host = mount(markup(PIXEL, 'data-ok-fit="contain" data-ok-position="top-left"'));
    expect(getComputedStyle(imgOf(host)).objectFit).toBe("contain");
    expect(getComputedStyle(imgOf(host)).objectPosition).toBe("0% 0%");
    const root = rootOf(host);
    root.style.width = "210px";
    for (const ratio of imageRatios) {
      root.setAttribute("data-ok-ratio", ratio);
      const [w, h] = ratio.split("/").map(Number) as [number, number];
      expect(root.getBoundingClientRect().height).toBeCloseTo((210 * h) / w, 0);
    }
  });

  it("paints the overlays", () => {
    const host = mount(
      markup(PIXEL, 'data-ok-overlay="dark"').replace(
        "<img",
        '<span data-ok-image-overlay aria-hidden="true"></span><img',
      ),
    );
    const root = rootOf(host);
    const overlay = host.querySelector("[data-ok-image-overlay]") as Element;
    expect(getComputedStyle(overlay).backgroundColor).toBe("rgba(24, 24, 27, 0.48)");
    root.setAttribute("data-ok-overlay", "primary");
    expect(getComputedStyle(overlay).backgroundImage).toMatch(
      /^linear-gradient\(rgba\(255, 255, 255, 0\), rgba\(97, 95, 255, 0\.8\)\)$/,
    );
    root.setAttribute("data-ok-overlay-from", "secondary");
    expect(getComputedStyle(overlay).backgroundImage).toMatch(
      /^linear-gradient\(to top, rgba\(127, 34, 254, 0\.24\), rgba\(97, 95, 255, 0\.8\)\)$/,
    );
    root.removeAttribute("data-ok-overlay");
    expect(getComputedStyle(overlay).display).toBe("none");
  });
});

describe("image runtime", () => {
  it("goes from loading to loaded and reports it", async () => {
    const host = mount(markup(`${PIXEL}#1`));
    const root = rootOf(host);
    const events: unknown[] = [];
    root.addEventListener("ok:image:load", (event) => events.push((event as CustomEvent).detail));
    start();
    await stateIs(root, "loaded");
    expect(events).toEqual([{ src: `${PIXEL}#1` }]);
    expect(runtime?.get<ImageInstance>(root, "image")?.state).toBe("loaded");
    expect(root.querySelector("[data-ok-image-icon]")).toBeNull();
  });

  it("marks errors, adds the icon, and loads again on a new src", async () => {
    const host = mount(markup(BROKEN));
    const root = rootOf(host);
    const errors: unknown[] = [];
    root.addEventListener("ok:image:error", (event) => errors.push((event as CustomEvent).detail));
    start();
    await stateIs(root, "error");
    const icon = root.querySelector(":scope > [data-ok-image-icon]") as SVGElement;
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.getAttribute("data-ok-icon")).toBe("gallery-remove-linear");
    expect(icon.querySelectorAll("path, circle").length).toBeGreaterThan(0);
    expect(errors).toEqual([{ src: BROKEN }]);
    // A second error keeps one icon.
    imgOf(host).dispatchEvent(new Event("error"));
    expect(root.querySelectorAll("[data-ok-image-icon]")).toHaveLength(1);
    expect(errors).toHaveLength(2);
    // The broken picture keeps its text alternative in the accessibility tree.
    expect(getComputedStyle(imgOf(host)).opacity).toBe("0");
    expect(imgOf(host).hidden).toBe(false);
    imgOf(host).src = `${OTHER}#2`;
    await stateIs(root, "loaded");
    expect(root.querySelector("[data-ok-image-icon]")).toBeNull();
  });

  it("reads images that settled before the runtime started", async () => {
    const host = mount(markup(`${PIXEL}#3`) + markup(BROKEN));
    const [good, bad] = host.querySelectorAll<HTMLImageElement>("img");
    await (good as HTMLImageElement).decode();
    await new Promise((resolve) =>
      (bad as HTMLImageElement).complete
        ? resolve(undefined)
        : bad?.addEventListener("error", resolve, { once: true }),
    );
    start();
    const [first, second] = host.querySelectorAll<HTMLElement>("[data-ok-image]");
    expect(first?.getAttribute("data-ok-state")).toBe("loaded");
    expect(second?.getAttribute("data-ok-state")).toBe("error");
    expect(second?.querySelector("[data-ok-image-icon]")).not.toBeNull();
  });

  it("keeps lazy pictures far below the page loading", async () => {
    const host = mount(
      `<div style="height: 30000px"></div>${markup(`${PIXEL}#4`, "", 'loading="lazy"')}`,
    );
    start();
    await settle();
    expect(rootOf(host).getAttribute("data-ok-state")).toBe("loading");
  });

  it("is idempotent, mounts later markup, and cleans up on stop()", async () => {
    const rt = start();
    const host = mount(markup(BROKEN));
    const root = rootOf(host);
    await stateIs(root, "error");
    rt.init();
    expect(root.querySelectorAll("[data-ok-image-icon]")).toHaveLength(1);
    expect(rt.get(root, "image")).toBeDefined();
    rt.stop();
    expect(root.hasAttribute("data-ok-state")).toBe(false);
    expect(root.querySelector("[data-ok-image-icon]")).toBeNull();
    expect(components).toContain(image);
  });

  it("writes a custom ratio through CSSOM, follows changes and cleans up", async () => {
    const host = mount(markup(`${PIXEL}#r`, 'data-ok-ratio="16/10"'));
    const root = rootOf(host);
    root.style.width = "160px";
    await imgOf(host).decode();
    // Before the runtime: the picture keeps its own ratio (8 × 6).
    expect(root.getBoundingClientRect().height).toBeCloseTo(120, 0);
    const rt = start();
    expect(root.style.getPropertyValue("--_ok-image-ratio")).toBe("16 / 10");
    expect(root.getBoundingClientRect().height).toBeCloseTo(100, 0);
    root.setAttribute("data-ok-ratio", "4");
    await settle();
    expect(root.getBoundingClientRect().height).toBeCloseTo(40, 0);
    // A named ratio is a CSS rule: the property goes away.
    root.setAttribute("data-ok-ratio", "16/9");
    await settle();
    expect(root.style.getPropertyValue("--_ok-image-ratio")).toBe("");
    expect(root.getBoundingClientRect().height).toBeCloseTo(90, 0);
    root.setAttribute("data-ok-ratio", "2/1");
    await settle();
    rt.stop();
    runtime = undefined;
    expect(root.style.getPropertyValue("--_ok-image-ratio")).toBe("");
  });

  it("does nothing without an img (a custom ratio still applies until stop())", () => {
    const host = mount('<span data-ok-image data-ok-fit="cover" data-ok-ratio="3/1"></span>');
    const rt = start();
    expect(rt.get<ImageInstance>(rootOf(host), "image")?.state).toBe("loaded");
    expect(rootOf(host).hasAttribute("data-ok-state")).toBe(false);
    expect(rootOf(host).style.getPropertyValue("--_ok-image-ratio")).toBe("3 / 1");
    rt.stop();
    runtime = undefined;
    expect(rootOf(host).style.getPropertyValue("--_ok-image-ratio")).toBe("");
  });

  it("ignores hostile option values", async () => {
    const host = mount(markup(`${PIXEL}#5`));
    const root = rootOf(host);
    for (const attr of ["data-ok-ratio", "data-ok-fit", "data-ok-overlay", "data-ok-effect"])
      root.setAttribute(attr, '"><img src=x onerror=alert(1)>');
    start();
    await stateIs(root, "loaded");
    expect(document.querySelectorAll("img")).toHaveLength(1);
    expect(getComputedStyle(imgOf(host)).objectFit).toBe("cover");
  });

  it("leaves React-owned images alone", async () => {
    const host = mount(`<div data-ok-runtime="off">${markup(`${PIXEL}#6`)}</div>`);
    start();
    await settle();
    expect(rootOf(host).hasAttribute("data-ok-state")).toBe(false);
  });
});
