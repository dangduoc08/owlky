import { circularProgressVariants, progressColors } from "@owlky/core";
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
import { circularProgress } from "./circular-progress.js";

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

const SVG =
  '<svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44"><circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" /></svg>';
const progress = (attrs: string) =>
  `<span role="progressbar" aria-label="p" data-ok-circular-progress ${attrs}>${SVG}</span>`;
const one = (host: Element) => host.querySelector("[data-ok-circular-progress]") as HTMLElement;
const circleOf = (root: Element) => root.querySelector("circle") as SVGCircleElement;
const css = (element: Element) => getComputedStyle(element);
const CIRCUMFERENCE = 2 * Math.PI * 20.2;

describe("circular progress snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(3));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(html);
    for (const root of host.querySelectorAll<HTMLElement>("[data-ok-circular-progress]")) {
      expect(root.getAttribute("role")).toBe("progressbar");
      expect(root.getAttribute("aria-label")).not.toBe("");
      expect(circularProgressVariants).toContain(root.dataset["okVariant"]);
      expect(progressColors).toContain(root.dataset["okColor"]);
      const determinate = root.dataset["okVariant"] === "determinate";
      for (const name of ["aria-valuenow", "aria-valuemin", "aria-valuemax"])
        expect(root.hasAttribute(name)).toBe(determinate);
      expect(root.querySelector(":scope > svg[aria-hidden='true'] > circle")).not.toBeNull();
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

describe("circular progress CSS without JavaScript", () => {
  it("indeterminate spins at 40px; determinate shows no arc until the value is known", () => {
    const host = mount(progress('data-ok-variant="indeterminate" data-ok-color="primary"'));
    expect(css(one(host)).width).toBe("40px");
    expect(css(one(host)).animationName).toBe("ok-circular-progress-rotate");
    const later = mount(progress('data-ok-variant="determinate" aria-valuenow="50"'));
    expect(css(circleOf(one(later))).strokeDasharray).toMatch(/^0(px)?,? 200px$/);
  });
});

describe("circular progress runtime", () => {
  it("draws the determinate arc and follows aria-valuenow changes", async () => {
    const host = mount(
      progress(
        'data-ok-variant="determinate" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"',
      ),
    );
    start();
    const root = one(host);
    const circle = circleOf(root);
    expect(Number.parseFloat(css(circle).strokeDasharray)).toBeCloseTo(CIRCUMFERENCE, 2);
    expect(Number.parseFloat(css(circle).strokeDashoffset)).toBeCloseTo(0.75 * CIRCUMFERENCE, 2);
    root.setAttribute("aria-valuenow", "100");
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-dashoffset")).toBe("0px");
    root.setAttribute("aria-valuemax", "200");
    await settle();
    expect(Number.parseFloat(root.style.getPropertyValue("--_ok-progress-dashoffset"))).toBeCloseTo(
      0.5 * CIRCUMFERENCE,
      2,
    );
    expect(root.getAttribute("style")).not.toContain("<");
  });

  it("size, thickness and the variant switch", async () => {
    const host = mount(
      progress('data-ok-variant="indeterminate" data-ok-size="48" data-ok-thickness="8"'),
    );
    start();
    const root = one(host);
    expect(css(root).width).toBe("48px");
    expect(circleOf(root).getAttribute("r")).toBe("18");
    expect(circleOf(root).getAttribute("stroke-width")).toBe("8");
    expect(root.style.getPropertyValue("--_ok-progress-dasharray")).toBe("");
    root.setAttribute("data-ok-size", "2rem");
    root.removeAttribute("data-ok-thickness");
    root.setAttribute("data-ok-variant", "determinate");
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-size")).toBe("2rem");
    expect(root.style.getPropertyValue("--_ok-progress-thickness")).toBe("");
    expect(circleOf(root).getAttribute("r")).toBe("20.2");
    // No value yet: min.
    expect(Number.parseFloat(root.style.getPropertyValue("--_ok-progress-dashoffset"))).toBeCloseTo(
      CIRCUMFERENCE,
      2,
    );
    root.removeAttribute("data-ok-size");
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-size")).toBe("");
  });

  it.each([
    '"><img src=x onerror=alert(1)>',
    "../",
    "calc(1px + 1px)",
    "-4",
    "1e999",
    "9".repeat(5000),
  ])("ignores hostile values: %s", async (value) => {
    const host = mount(progress('data-ok-variant="determinate"'));
    const root = one(host);
    for (const name of ["aria-valuenow", "aria-valuemax", "data-ok-size", "data-ok-thickness"])
      root.setAttribute(name, value);
    start();
    await settle();
    expect(root.style.getPropertyValue("--_ok-progress-size")).toBe("");
    expect(root.style.getPropertyValue("--_ok-progress-thickness")).toBe("");
    expect(circleOf(root).getAttribute("stroke-width")).toBe("3.6");
    expect(css(root).width).toBe("40px");
    expect(document.querySelector("img")).toBeNull();
  });

  it("is idempotent, mounts later markup and cleans up on removal and stop()", async () => {
    const host = mount(progress('data-ok-variant="determinate" aria-valuenow="10"'));
    const rt = start();
    rt.init();
    rt.start();
    const root = one(host);
    expect(rt.get(root, "circular-progress")).toBeDefined();
    const later = mount(progress('data-ok-variant="determinate" aria-valuenow="60"'));
    await settle();
    const added = one(later);
    expect(added.style.getPropertyValue("--_ok-progress-dashoffset")).not.toBe("");
    rt.destroy(later);
    expect(added.style.getPropertyValue("--_ok-progress-dashoffset")).toBe("");
    added.setAttribute("aria-valuenow", "70");
    await settle();
    expect(added.style.getPropertyValue("--_ok-progress-dashoffset")).toBe("");
    rt.stop();
    expect(root.style.length).toBe(0);
    expect(components).toContain(circularProgress);
  });

  it("leaves React-owned progress alone", async () => {
    const host = mount(
      `<div data-ok-runtime="off">${progress('data-ok-variant="determinate" aria-valuenow="10"')}</div>`,
    );
    start();
    await settle();
    expect(one(host).style.length).toBe(0);
  });
});
