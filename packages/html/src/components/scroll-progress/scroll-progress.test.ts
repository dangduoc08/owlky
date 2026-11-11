import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectCspSafe, expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { ScrollProgressInstance } from "./scroll-progress.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) =>
  (snippets.find(([path]) => path.includes(name)) as [string, string])[1];

/** The stories' layout (Storybook's demo CSS): areas that scroll. */
const LAYOUT = `<style>
  .sb-scroll-progress-area { display: grid; height: 320px; gap: 16px; padding: 16px; box-sizing: border-box; }
  .sb-scroll-progress-row { display: flex; gap: 16px; padding: 16px; box-sizing: border-box; }
  .sb-scroll-progress-card { height: 120px; }
  .sb-scroll-progress-row > .sb-scroll-progress-card { flex: 0 0 160px; height: 200px; }
  .sb-scroll-progress-page { position: fixed; inset: 0 0 auto; }
  .sb-scroll-progress-document { min-height: 2000px; }
</style>`;

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  vi.restoreAllMocks();
  runtime?.stop();
  runtime = undefined;
  resetPage();
  window.scrollTo(0, 0);
});

/** Scroll events and timelines update on the next frames. */
const frames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
const shown = (element: Element) =>
  Number(getComputedStyle(element).getPropertyValue("--_ok-scroll-progress"));
const instance = (element: Element) =>
  runtime?.get(element, "scroll-progress") as ScrollProgressInstance;

/** Pretends scroll-driven animations aren't supported (other features stay as they are). */
const withoutTimelines = () => {
  const supports = CSS.supports.bind(CSS) as (...args: string[]) => boolean;
  vi.spyOn(CSS, "supports").mockImplementation((...args: string[]) =>
    args.join(" ").includes("animation-timeline") ? false : supports(...args),
  );
};

describe("scroll progress snippets", () => {
  it("covers every story", () => expect(snippets).toHaveLength(3));

  it.each(snippets)("%s: decorative determinate progress, CSP-safe", async (_, html) => {
    const host = mount(html);
    expectCspSafe(host, html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-scroll-progress]")) {
      expect(root.getAttribute("role")).toBe("progressbar");
      expect(root.getAttribute("aria-hidden")).toBe("true");
      expect(root.getAttribute("data-ok-variant")).toBe("determinate");
      expect(root.hasAttribute("aria-valuenow")).toBe(false);
      const id = root.getAttribute("data-ok-scroll-container");
      if (id) expect(document.getElementById(id)).not.toBeNull();
    }
    start();
    await expectNoAxeViolations(host);
  });
});

describe("scroll progress runtime", () => {
  it.each([
    ["native or CSS", false],
    ["fallback", true],
  ])("follows a vertical container (%s)", async (_, fallback) => {
    if (fallback) withoutTimelines();
    const host = mount(`${LAYOUT}${snippet("scroll-y")}`);
    start();
    const [circle, line] = host.querySelectorAll<HTMLElement>(
      "[data-ok-scroll-progress]",
    ) as unknown as [HTMLElement, HTMLElement];
    const area = document.getElementById("cards-y") as HTMLElement;
    const max = area.scrollHeight - area.clientHeight;
    expect(instance(line).mode).toBe(
      fallback || !("ScrollTimeline" in window) ? "fallback" : "native",
    );
    area.scrollTop = max / 2;
    await frames();
    for (const root of [circle, line]) expect(shown(root)).toBeCloseTo(0.5, 2);
    expect(instance(line).progress).toBeCloseTo(0.5, 2);
    const svg = circle.querySelector("circle") as SVGElement;
    expect(Number.parseFloat(getComputedStyle(svg).strokeDashoffset)).toBeCloseTo(
      (Math.PI * 40.4) / 2,
      0,
    );
    instance(line).update();
  });

  it("follows a horizontal container", async () => {
    const host = mount(`${LAYOUT}${snippet("scroll-x")}`);
    start();
    const line = host.querySelector("[data-ok-linear-progress]") as HTMLElement;
    const row = document.getElementById("cards-x") as HTMLElement;
    row.scrollLeft = (row.scrollWidth - row.clientWidth) / 4;
    await frames();
    expect(shown(line)).toBeCloseTo(0.25, 2);
  });

  it("follows the page", async () => {
    const host = mount(`${LAYOUT}${snippet("document")}`);
    start();
    const line = host.querySelector("[data-ok-scroll-progress]") as HTMLElement;
    const root = document.documentElement;
    window.scrollTo(0, (root.scrollHeight - root.clientHeight) / 2);
    await frames();
    expect(shown(line)).toBeCloseTo(0.5, 2);
    expect(["css", "fallback"]).toContain(instance(line).mode);
  });

  it("starts over when an option changes and stops with the runtime", async () => {
    withoutTimelines();
    const host = mount(`${LAYOUT}${snippet("scroll-y")}`);
    start();
    const line = host.querySelector("[data-ok-linear-progress]") as HTMLElement;
    const area = document.getElementById("cards-y") as HTMLElement;
    expect(line.hasAttribute("data-ok-fallback")).toBe(true);
    line.setAttribute("data-ok-scroll-axis", "x");
    await Promise.resolve();
    area.scrollTop = 100;
    await frames();
    // The area doesn't scroll sideways.
    expect(shown(line)).toBe(0);
    line.removeAttribute("data-ok-scroll-axis");
    await Promise.resolve();
    await frames();
    expect(shown(line)).toBeGreaterThan(0);
    runtime?.stop();
    expect(line.hasAttribute("data-ok-fallback")).toBe(false);
    expect(line.getAnimations()).toHaveLength(0);
  });
});
