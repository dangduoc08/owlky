import { organizationChartLineColors, organizationChartLineStyles } from "@owlky/core";
import { afterEach, describe, expect, it } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { organizationChart } from "./organization-chart.js";

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
// Snippet images live in Storybook's static folder: point them at an inline pixel here.
const local = (html: string) => html.replaceAll(/src="avatars\/[^"]+"/g, `src="${PIXEL}"`);

const node = (label: string, children = "") =>
  `<li data-ok-organization-chart-node><div data-ok-organization-chart-label>${label}</div>${
    children ? `<ul data-ok-organization-chart-children>${children}</ul>` : ""
  }</li>`;
const chart = (attrs = "") =>
  `<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid" aria-label="Team" ${attrs}>${node(
    "Lead",
    node("First") + node("Middle", node("Report")) + node("Last"),
  )}</ul>`;
const rootOf = (host: Element) => host.querySelector("[data-ok-organization-chart]") as HTMLElement;
const LENGTHS = [
  "--_ok-org-line-height",
  "--_ok-org-line-width",
  "--_ok-org-line-radius",
  "--_ok-org-node-padding",
];
const lengths = (root: HTMLElement) => LENGTHS.map((name) => root.style.getPropertyValue(name));
const firstAfter = (host: Element) =>
  getComputedStyle(
    host.querySelector("[data-ok-organization-chart-children] > li") as Element,
    "::after",
  );

describe("organization chart snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(7));

  it.each(snippets)("%s: valid anatomy", (_, html) => {
    const host = mount(local(html));
    const roots = host.querySelectorAll<HTMLElement>("[data-ok-organization-chart]");
    expect(roots.length).toBeGreaterThan(0);
    for (const root of roots) {
      expect(root.tagName).toBe("UL");
      expect(root.getAttribute("aria-label")).toBeTruthy();
      expect(organizationChartLineColors).toContain(root.dataset["okLineColor"]);
      expect(organizationChartLineStyles).toContain(root.dataset["okLineStyle"]);
      expect(root.querySelectorAll(":scope > li[data-ok-organization-chart-node]")).toHaveLength(1);
      for (const item of root.querySelectorAll("[data-ok-organization-chart-node]")) {
        expect(item.tagName).toBe("LI");
        expect(item.firstElementChild?.hasAttribute("data-ok-organization-chart-label")).toBe(true);
        const list = item.querySelector(":scope > ul");
        if (list) {
          expect(list.hasAttribute("data-ok-organization-chart-children")).toBe(true);
          expect(list.children.length).toBeGreaterThan(0);
        }
      }
    }
    // Scroll areas are named and focusable.
    for (const area of host.querySelectorAll("[data-ok-scrollbar]")) {
      expect(area.getAttribute("aria-label")).toBeTruthy();
      expect(area.getAttribute("tabindex")).toBe("0");
    }
    expectNamedButtons(host);
  });

  it.each(snippets)("%s: CSP-safe", (_, html) => expectCspSafe(mount(html), html));

  it.each(snippets)("%s: no axe violations", async (_, html) => {
    const host = mount(local(html));
    start();
    await settle();
    await expectNoAxeViolations(host);
  });

  it("menu buttons open their menu", async () => {
    const html = snippets.find(([path]) => path.endsWith("/standard-group.html"))?.[1] as string;
    const host = mount(local(html));
    start();
    await settle();
    const button = host.querySelector("#org-standard-priya-button") as HTMLButtonElement;
    button.click();
    await settle();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const menu = host.querySelector("#org-standard-priya-menu") as HTMLElement;
    expect(menu.hasAttribute("data-ok-open")).toBe(true);
    expect(menu.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
    expect(
      (host.querySelector("#org-standard-maya-button") as Element).getAttribute("aria-expanded"),
    ).toBe("false");
  });
});

describe("organization chart CSS without JavaScript", () => {
  it("draws the default lines: 40px, 1px solid, 24px corners, 4px node padding", () => {
    const host = mount(chart('data-ok-line-height="20"'));
    const after = firstAfter(host);
    expect(after.height).toBe("40px");
    expect(after.borderTopWidth).toBe("1px");
    expect(after.borderTopStyle).toBe("solid");
    expect(after.borderTopLeftRadius).toBe("24px");
    const child = host.querySelector("[data-ok-organization-chart-children] > li") as Element;
    expect(getComputedStyle(child).padding).toBe("40px 4px 0px");
  });
});

describe("organization chart runtime", () => {
  it("writes the lengths as private properties and follows changes", async () => {
    const host = mount(
      chart(
        'data-ok-line-height="20" data-ok-line-width="2px" data-ok-line-border-radius="0.5rem" data-ok-node-padding="8"',
      ),
    );
    start();
    const root = rootOf(host);
    expect(lengths(root)).toEqual(["20px", "2px", "0.5rem", "8px"]);
    expect(firstAfter(host).height).toBe("20px");
    expect(firstAfter(host).borderTopWidth).toBe("2px");
    expect(firstAfter(host).borderTopLeftRadius).toBe("8px");
    root.setAttribute("data-ok-line-height", "3em");
    root.removeAttribute("data-ok-line-width");
    await settle();
    expect(lengths(root)).toEqual(["3em", "", "0.5rem", "8px"]);
    expect(firstAfter(host).borderTopWidth).toBe("1px");
    // Other attributes don't redraw anything.
    root.setAttribute("data-ok-line-color", "primary");
    await settle();
    expect(lengths(root)).toEqual(["3em", "", "0.5rem", "8px"]);
    expect(firstAfter(host).borderTopColor).toBe("rgb(91, 228, 155)");
  });

  it.each([
    '"><img src=x onerror=alert(1)>',
    "../",
    "calc(1px + 1px)",
    "-4",
    "1e999",
    "9".repeat(5000),
  ])("ignores hostile values: %s", async (value) => {
    const host = mount(chart());
    const root = rootOf(host);
    for (const attr of [
      "data-ok-line-height",
      "data-ok-line-width",
      "data-ok-line-border-radius",
      "data-ok-node-padding",
    ])
      root.setAttribute(attr, value);
    start();
    await settle();
    expect(lengths(root)).toEqual(["", "", "", ""]);
    expect(root.getAttribute("style")).toBeNull();
    expect(firstAfter(host).height).toBe("40px");
    expect(document.querySelector("img")).toBeNull();
  });

  it("is idempotent, mounts later markup and cleans up on removal and stop()", async () => {
    const host = mount(chart('data-ok-line-height="10"'));
    const rt = start();
    rt.init();
    rt.start();
    const root = rootOf(host);
    expect(rt.get(root, "organization-chart")).toBeDefined();
    const later = mount(chart('data-ok-node-padding="6"'));
    await settle();
    const added = rootOf(later);
    expect(added.style.getPropertyValue("--_ok-org-node-padding")).toBe("6px");
    rt.destroy(later);
    expect(added.style.getPropertyValue("--_ok-org-node-padding")).toBe("");
    added.setAttribute("data-ok-node-padding", "9");
    await settle();
    expect(added.style.getPropertyValue("--_ok-org-node-padding")).toBe("");
    rt.stop();
    expect(root.style.length).toBe(0);
    expect(components).toContain(organizationChart);
  });

  it("leaves React-owned charts alone", async () => {
    const host = mount(`<div data-ok-runtime="off">${chart('data-ok-line-height="10"')}</div>`);
    start();
    await settle();
    expect(rootOf(host).style.length).toBe(0);
  });
});
