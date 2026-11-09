import { linearProgressVariants, progressColors } from "@owlky/core";
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
import { linearProgress } from "./linear-progress.js";

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

const BARS =
  '<span data-ok-linear-progress-bar="1"></span><span data-ok-linear-progress-bar="2"></span>';
const progress = (attrs: string, inner = BARS) =>
  `<div style="width: 200px"><span role="progressbar" aria-label="p" data-ok-linear-progress ${attrs}>${inner}</span></div>`;
const one = (host: Element) => host.querySelector("[data-ok-linear-progress]") as HTMLElement;
const bar = (root: Element, n: 1 | 2) =>
  root.querySelector(`[data-ok-linear-progress-bar="${n}"]`) as HTMLElement;
/** Bar position as a fraction of the track (translateX / width). */
const shown = (element: Element) =>
  1 +
  new DOMMatrix(getComputedStyle(element).transform).m41 / element.getBoundingClientRect().width;

describe("linear progress snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(5));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-linear-progress]")) {
      expect(root.getAttribute("role")).toBe("progressbar");
      expect(root.getAttribute("aria-label")).not.toBe("");
      const variant = root.dataset["okVariant"];
      expect(linearProgressVariants).toContain(variant);
      expect(progressColors).toContain(root.dataset["okColor"]);
      const known = variant === "determinate" || variant === "buffer";
      expect(root.hasAttribute("aria-valuenow")).toBe(known);
      expect(root.hasAttribute("data-ok-value-buffer")).toBe(variant === "buffer");
      const parts = [...root.children].map(
        (child) => child.getAttribute("data-ok-linear-progress-bar") ?? "dashed",
      );
      expect(parts).toEqual(
        variant === "determinate"
          ? ["1"]
          : variant === "buffer"
            ? ["dashed", "1", "2"]
            : ["1", "2"],
      );
    }
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(html);
    start();
    await settle();
    await expectNoAxeViolations(host);
  });
});

describe("linear progress runtime", () => {
  it("moves the bar with aria-valuenow and the range", async () => {
    const host = mount(
      progress(
        'data-ok-variant="determinate" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"',
        '<span data-ok-linear-progress-bar="1"></span>',
      ),
    );
    start();
    const root = one(host);
    expect(root.style.getPropertyValue("--_ok-progress-value")).toBe("0.25");
    expect(shown(bar(root, 1))).toBeCloseTo(0.25, 3);
    root.setAttribute("aria-valuemin", "20");
    root.setAttribute("aria-valuemax", "30");
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-value")).toBe("0.5");
  });

  it("buffer: bar 2 follows data-ok-value-buffer", async () => {
    const host = mount(
      progress(
        'data-ok-variant="buffer" aria-valuenow="25" data-ok-value-buffer="30"',
        `<span data-ok-linear-progress-dashed></span>${BARS}`,
      ),
    );
    start();
    const root = one(host);
    expect(shown(bar(root, 2))).toBeCloseTo(0.3, 3);
    root.setAttribute("data-ok-value-buffer", "80");
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-buffer")).toBe("0.8");
    root.removeAttribute("data-ok-value-buffer");
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-buffer")).toBe("0");
  });

  it("indeterminate and query carry no values; switching variants clears them", async () => {
    const host = mount(progress('data-ok-variant="determinate" aria-valuenow="40"'));
    start();
    const root = one(host);
    expect(root.style.getPropertyValue("--_ok-progress-value")).toBe("0.4");
    root.setAttribute("data-ok-variant", "query");
    await settle();
    expect(root.style.length).toBe(0);
    expect(getComputedStyle(bar(root, 1)).animationName).toBe("ok-linear-progress-bar-1");
  });

  it.each(['"><img src=x onerror=alert(1)>', "../", "-1e999", "NaN", "9".repeat(5000)])(
    "ignores hostile values: %s",
    async (value) => {
      const host = mount(progress('data-ok-variant="buffer"'));
      const root = one(host);
      for (const name of ["aria-valuenow", "aria-valuemin", "data-ok-value-buffer"])
        root.setAttribute(name, value);
      start();
      await settle();
      expect(root.style.getPropertyValue("--_ok-progress-value")).toBe("0");
      expect(root.style.getPropertyValue("--_ok-progress-buffer")).toBe("0");
      expect(document.querySelector("img")).toBeNull();
    },
  );

  it("cleans up on destroy and stop()", async () => {
    const host = mount(progress('data-ok-variant="determinate" aria-valuenow="10"'));
    const rt = start();
    const root = one(host);
    rt.destroy(host);
    expect(root.style.length).toBe(0);
    root.setAttribute("aria-valuenow", "50");
    await settle();
    expect(root.style.length).toBe(0);
    expect(rt.get(root, "linear-progress")).toBeUndefined();
    expect(components).toContain(linearProgress);
  });
});
