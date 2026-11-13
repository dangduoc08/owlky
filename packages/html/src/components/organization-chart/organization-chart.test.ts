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
  it("covers every story group", () => expect(snippets).toHaveLength(25));

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
        const toggle = item.querySelector(":scope > [data-ok-organization-chart-toggle]");
        if (toggle) {
          // Collapsible charts only: the toggle sits between the label and its list.
          expect(root.hasAttribute("data-ok-enable-expand-collapse")).toBe(true);
          expect(toggle.tagName).toBe("BUTTON");
          expect(toggle.getAttribute("type")).toBe("button");
          expect(
            toggle.querySelector(":scope > [data-ok-organization-chart-toggle-label]")?.textContent,
          ).toBeTruthy();
          expect(
            toggle.previousElementSibling?.hasAttribute("data-ok-organization-chart-label"),
          ).toBe(true);
          expect(toggle.getAttribute("aria-controls")).toBe(list?.id);
          expect(toggle.getAttribute("aria-expanded")).toBe(
            String(!!list && !(list as HTMLElement).hidden && list.children.length > 0),
          );
          expect(list?.hasAttribute("data-ok-collapse")).toBe(true);
        }
        if (list) {
          expect(list.hasAttribute("data-ok-organization-chart-children")).toBe(true);
          // An empty list is a lazy node's: hidden, behind a toggle.
          if (list.children.length === 0) {
            expect((list as HTMLElement).hidden).toBe(true);
            expect(toggle).not.toBeNull();
          }
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

/**
 * Lines that miss their labels (ADR-0052): each visible children list's line from its parent and
 * each child's line to its label sit on that label's center, across the bar's axis.
 */
function connectorMisses(root: Element, vertical: boolean): string[] {
  const misses: string[] = [];
  const center = (element: Element, across = vertical) => {
    const rect = (element.firstElementChild ?? element).getBoundingClientRect();
    return across ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
  };
  const lines = (element: Element, which: "::before" | "::after", across = vertical) => {
    const style = getComputedStyle(element, which);
    if (style.content === "none") return [];
    const host = element.getBoundingClientRect();
    const start = across
      ? host.left + Number.parseFloat(style.left)
      : host.top + Number.parseFloat(style.top);
    const size = Number.parseFloat(across ? style.width : style.height);
    const sides: [number, number][] = across
      ? [
          [Number.parseFloat(style.borderLeftWidth), start],
          [-Number.parseFloat(style.borderRightWidth), start + size],
        ]
      : [
          [Number.parseFloat(style.borderTopWidth), start],
          [-Number.parseFloat(style.borderBottomWidth), start + size],
        ];
    return sides.filter(([width]) => width !== 0).map(([width, edge]) => edge + width / 2);
  };
  const near = (values: number[], target: number) =>
    values.some((value) => Math.abs(value - target) < 1.5);
  for (const list of root.querySelectorAll("[data-ok-organization-chart-children]")) {
    if (list.getClientRects().length === 0) continue;
    const parent = list.parentElement as Element;
    const label = parent.querySelector(":scope > [data-ok-organization-chart-label]") as Element;
    if (!near(lines(list, "::before"), center(label)))
      misses.push(`line from ${label.textContent?.trim()}`);
    // Grouped leaves (a grid parent): each stub meets its label's center on the other axis.
    const across = getComputedStyle(parent).display === "grid" ? !vertical : vertical;
    for (const child of list.children) {
      const own = child.querySelector(":scope > [data-ok-organization-chart-label]") as Element;
      const drawn = [...lines(child, "::before", across), ...lines(child, "::after", across)];
      if (!near(drawn, center(own, across))) misses.push(`line to ${own.textContent?.trim()}`);
    }
  }
  return misses;
}

describe("organization chart directions (CSS only)", () => {
  const label = (host: Element, text: string) =>
    [...host.querySelectorAll("[data-ok-organization-chart-label]")]
      .find((element) => element.textContent?.includes(text))
      ?.getBoundingClientRect() as DOMRect;

  it.each([
    ["bottom", true],
    ["left", false],
    ["right", false],
    ["rtl", false],
    ["collapsible", false],
  ] as const)("direction-%s: every line sits on its label's center", (name, vertical) => {
    const html = snippets.find(([path]) => path.endsWith(`/direction-${name}.html`))?.[1] as string;
    const host = mount(html);
    expect(connectorMisses(rootOf(host), vertical)).toEqual([]);
    const lead = label(host, "Team lead");
    const engineer = label(host, "Engineer");
    if (name === "bottom") expect(engineer.bottom).toBeLessThan(lead.top);
    else if (name === "right" || name === "rtl") expect(engineer.right).toBeLessThan(lead.left);
    else expect(engineer.left).toBeGreaterThan(lead.right);
  });

  it("a hand-written chart follows data-ok-direction changes", () => {
    const host = mount(chart('data-ok-direction="left"'));
    const root = rootOf(host);
    expect(connectorMisses(root, false)).toEqual([]);
    root.setAttribute("data-ok-direction", "bottom");
    expect(connectorMisses(root, true)).toEqual([]);
    root.setAttribute("data-ok-direction", "sideways");
    // Unknown values draw the default (top) chart.
    expect(firstAfter(host).borderTopWidth).toBe("1px");
    expect(connectorMisses(root, true)).toEqual([]);
  });
});

describe("organization chart per-node lines (CSS only)", () => {
  /** Lead › First, Middle (own lines) › Report › Deep, plus Other › Leaf under Middle. */
  const branch = (attrs = "", middle = 'data-ok-line-color="error" data-ok-line-style="dashed"') =>
    `<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid" aria-label="Team" ${attrs}>${node(
      "Lead",
      node("First") +
        `<li data-ok-organization-chart-node ${middle}><div data-ok-organization-chart-label>Middle</div><ul data-ok-organization-chart-children>${
          node("Report", node("Deep")) +
          `<li data-ok-organization-chart-node data-ok-line-color="success"><div data-ok-organization-chart-label>Other</div><ul data-ok-organization-chart-children>${node("Leaf")}</ul></li>`
        }</ul></li>`,
    )}</ul>`;
  const nodeOf = (host: Element, text: string) =>
    [...host.querySelectorAll("[data-ok-organization-chart-node]")].find(
      (item) => item.firstElementChild?.textContent === text,
    ) as HTMLElement;
  /** The line from a node down to its children list (the list's `::before`). */
  const stem = (host: Element, text: string) =>
    getComputedStyle(
      nodeOf(host, text).querySelector(":scope > [data-ok-organization-chart-children]") as Element,
      "::before",
    );
  /** The line from a node's bar to its label (only children: `::after`; others: both halves). */
  const drop = (host: Element, text: string) => getComputedStyle(nodeOf(host, text), "::after");
  const color = (host: Element, value: string) => {
    const probe = document.createElement("span");
    probe.style.color = value;
    rootOf(host).append(probe);
    const result = getComputedStyle(probe).color;
    probe.remove();
    return result;
  };

  it("a node's own color and style draw the lines to its children only", () => {
    const host = mount(branch());
    const divider = color(host, "var(--ok-divider)");
    const error = color(host, "var(--ok-palette-error-light)");
    const success = color(host, "var(--ok-palette-success-light)");
    expect(stem(host, "Lead").borderLeftColor).toBe(divider);
    // Middle's bar half and line to its label belong to the lead's lines.
    expect(getComputedStyle(nodeOf(host, "Middle"), "::before").borderRightColor).toBe(divider);
    expect(stem(host, "Middle").borderLeftColor).toBe(error);
    expect(stem(host, "Middle").borderLeftStyle).toBe("dashed");
    expect(drop(host, "Report").borderLeftColor).toBe(error);
    expect(drop(host, "Report").borderTopStyle).toBe("dashed");
    // One level down, the chart's lines again; a node with its own color keeps it.
    expect(stem(host, "Report").borderLeftColor).toBe(divider);
    expect(stem(host, "Report").borderLeftStyle).toBe("solid");
    expect(drop(host, "Deep").borderLeftColor).toBe(divider);
    expect(stem(host, "Other").borderLeftColor).toBe(success);
    expect(stem(host, "Other").borderLeftStyle).toBe("solid");
    expect(connectorMisses(rootOf(host), true)).toEqual([]);
  });

  it('edge color mode "node": a node\'s lines carry through its branch', () => {
    const host = mount(branch('data-ok-edge-color-mode="node"'));
    const error = color(host, "var(--ok-palette-error-light)");
    const success = color(host, "var(--ok-palette-success-light)");
    expect(stem(host, "Lead").borderLeftColor).toBe(color(host, "var(--ok-divider)"));
    expect(stem(host, "Report").borderLeftColor).toBe(error);
    expect(stem(host, "Report").borderLeftStyle).toBe("dashed");
    expect(drop(host, "Deep").borderLeftColor).toBe(error);
    // A node that sets its own color starts its branch over; the style still carries.
    expect(stem(host, "Other").borderLeftColor).toBe(success);
    expect(stem(host, "Other").borderLeftStyle).toBe("dashed");
  });

  it("follows the chart's line options where a node sets none, and the toggle matches", () => {
    const host = mount(
      branch("data-ok-enable-expand-collapse", 'data-ok-line-style="dotted"')
        .replace('data-ok-line-color="divider"', 'data-ok-line-color="info"')
        .replace(
          "<div data-ok-organization-chart-label>Middle</div>",
          '<div data-ok-organization-chart-label>Middle</div><button type="button" data-ok-organization-chart-toggle aria-expanded="true"><span data-ok-organization-chart-toggle-label>Reports</span></button>',
        ),
    );
    const info = color(host, "var(--ok-palette-info-light)");
    expect(stem(host, "Middle").borderLeftColor).toBe(info);
    expect(stem(host, "Middle").borderLeftStyle).toBe("dotted");
    const toggle = nodeOf(host, "Middle").querySelector(
      "[data-ok-organization-chart-toggle]",
    ) as Element;
    expect(getComputedStyle(toggle).borderTopColor).toBe(info);
    // Unknown values are ignored: the chart's lines apply.
    nodeOf(host, "Middle").setAttribute("data-ok-line-color", "url(x)");
    expect(stem(host, "Middle").borderLeftColor).toBe(info);
  });

  it("has no axe violations", async () => {
    const host = mount(branch('data-ok-edge-color-mode="node"'));
    await expectNoAxeViolations(host);
  });
});

describe("organization chart grouped leaves", () => {
  const leaves = (name: string) =>
    mount(local(snippets.find(([path]) => path.endsWith(`/leaves-${name}.html`))?.[1] as string));
  /** The labels of a node's children, in order, by their card's name. */
  const childLabels = (host: Element, name: string) => {
    const parent = [...host.querySelectorAll("[data-ok-organization-chart-node]")].find((item) =>
      item.firstElementChild?.textContent?.includes(name),
    ) as Element;
    return [
      ...parent.querySelectorAll(
        ":scope > [data-ok-organization-chart-children] > li > [data-ok-organization-chart-label]",
      ),
    ].map((label) => label.getBoundingClientRect());
  };

  it.each([
    ["top", true],
    ["bottom", true],
    ["left", false],
    ["rtl", false],
    ["collapsible", true],
  ] as const)("leaves-%s: one column per lead, every line on its label", (name, vertical) => {
    const host = leaves(name);
    expect(connectorMisses(rootOf(host), vertical)).toEqual([]);
    const reports = childLabels(host, "Jonah Pereira");
    expect(reports).toHaveLength(3);
    const [first, second, third] = reports as [DOMRect, DOMRect, DOMRect];
    if (vertical) {
      // Stacked: the same start, 8px apart (the default spacing), down (or up) the column.
      expect(Math.abs(first.left - second.left)).toBeLessThan(1);
      const gap = name === "bottom" ? first.top - second.bottom : second.top - first.bottom;
      expect(gap).toBeCloseTo(8, 0);
      expect(name === "bottom" ? third.bottom < second.top : third.top > second.bottom).toBe(true);
    } else {
      // Left and right charts: a row after the lead, away from it.
      expect(Math.abs(first.top - second.top)).toBeLessThan(1);
      // (A right chart in a right-to-left page mirrors back: also toward the right.)
      expect(second.left).toBeGreaterThan(first.right);
    }
  });

  it("groups only two or more leaves; follows the flag and the spacing", async () => {
    const host = mount(
      chart('data-ok-group-leaf-nodes data-ok-group-leaf-nodes-spacing="16"').replace(
        node("Report"),
        node("Report") + node("Second report"),
      ),
    );
    const root = rootOf(host);
    const middle = [...root.querySelectorAll("li")].find(
      (item) => item.firstElementChild?.textContent === "Middle",
    ) as HTMLElement;
    const lead = root.firstElementChild as HTMLElement;
    // The lead's children are mixed (Middle has children): a row, not grouped.
    expect(getComputedStyle(lead).display).toBe("flex");
    expect(getComputedStyle(middle).display).toBe("grid");
    start();
    await settle();
    expect(root.style.getPropertyValue("--_ok-org-leaf-spacing")).toBe("16px");
    const [report, second] = childLabels(host, "Middle") as [DOMRect, DOMRect];
    expect(second.top - report.bottom).toBeCloseTo(16, 0);
    expect(connectorMisses(root, true)).toEqual([]);
    // One leaf is a straight line down, as before.
    middle.querySelector("ul > li:last-child")?.remove();
    expect(getComputedStyle(middle).display).toBe("flex");
    root.removeAttribute("data-ok-group-leaf-nodes");
    await settle();
    expect(getComputedStyle(middle).display).toBe("flex");
  });

  it("collapsible: a collapsed group draws nothing; it opens as a column", async () => {
    const host = leaves("collapsible");
    start();
    await settle();
    const priya = toggle(host, "priya");
    expect(priya.getAttribute("aria-expanded")).toBe("false");
    priya.click();
    await finish();
    expect(list(host, "priya").hidden).toBe(false);
    expect(childLabels(host, "Priya Raman")).toHaveLength(4);
    expect(connectorMisses(rootOf(host), true)).toEqual([]);
    await expectNoAxeViolations(host);
  });

  it("the highlighted path runs along the column to the leaf", async () => {
    const host = leaves("top");
    const root = rootOf(host);
    root.setAttribute("data-ok-highlight-on-hover", "");
    const zara = [...root.querySelectorAll("li")].find((item) =>
      item.firstElementChild?.textContent?.includes("Zara Okafor"),
    ) as HTMLElement;
    zara.setAttribute("data-ok-node-id", "zara");
    const instance = start().get(root, "organization-chart") as unknown as {
      highlightNode(id: string): Promise<void>;
    };
    await settle();
    await instance.highlightNode("zara");
    await settle();
    const list = zara.parentElement as HTMLElement;
    const first = (list.firstElementChild as Element).getBoundingClientRect();
    const segment = getComputedStyle(zara.firstElementChild as Element, "::before");
    expect(segment.content).not.toBe("none");
    const top = zara.getBoundingClientRect().top + Number.parseFloat(segment.top);
    expect(Math.abs(top - first.top)).toBeLessThan(1);
    // It turns into Zara's label, at its center, with the last leaf's rounded corner.
    const bottom = top + Number.parseFloat(segment.height);
    const label = (zara.firstElementChild as Element).getBoundingClientRect();
    expect(Math.abs(bottom - (label.top + label.height / 2))).toBeLessThan(1.5);
    expect(segment.borderBottomLeftRadius).not.toBe("0px");
    expect(zara.style.getPropertyValue("--_ok-org-path-round")).toBe("1");
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
    expect(firstAfter(host).borderTopColor).toBe("rgb(163, 179, 255)");
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

// --- Expand and collapse (ADR-0051) ------------------------------------------------------------

interface BranchOptions {
  hidden?: boolean;
  badge?: boolean;
}
const branch = (
  id: string,
  children: string,
  { hidden = false, badge = true }: BranchOptions = {},
) =>
  `<li data-ok-organization-chart-node data-ok-node-id="${id}"><div data-ok-organization-chart-label>${id}</div>` +
  `<button type="button" data-ok-organization-chart-toggle aria-expanded="${!hidden && children !== ""}" aria-controls="list-${id}">` +
  `<span data-ok-organization-chart-toggle-label>${id} reports</span> <svg data-ok-organization-chart-toggle-icon aria-hidden="true" viewBox="0 0 24 24"></svg>${
    badge ? "<span data-ok-organization-chart-badge></span>" : ""
  }</button>` +
  `<ul data-ok-collapse data-ok-organization-chart-children id="list-${id}"${hidden ? " hidden" : ""}>${children}</ul></li>`;
const leaf = (id: string) =>
  `<li data-ok-organization-chart-node data-ok-node-id="${id}"><div data-ok-organization-chart-label>${id}</div></li>`;
/** lead › (a, b › (c › d), lazy (no children yet)) */
const collapsible = (attrs = "", options: BranchOptions = {}) =>
  `<ul data-ok-organization-chart data-ok-line-color="divider" data-ok-line-style="solid" data-ok-enable-expand-collapse aria-label="Team" ${attrs}>${branch(
    "lead",
    leaf("a") + branch("b", branch("c", leaf("d")), options) + branch("lazy", "", { hidden: true }),
  )}</ul>`;

interface ChartInstance {
  expand(id: string): Promise<void>;
  collapse(id: string): void;
  isExpanded(id: string): boolean;
  expandAll(): void;
  collapseAll(): void;
  expandToDepth(depth: number): void;
  expandSubtree(id: string): void;
  collapseSubtree(id: string): void;
}
const instanceOf = (host: Element) =>
  runtime?.get(rootOf(host), "organization-chart") as unknown as ChartInstance;
const toggle = (host: Element, id: string) =>
  host.querySelector(
    `[data-ok-node-id="${id}"] > [data-ok-organization-chart-toggle]`,
  ) as HTMLButtonElement;
const list = (host: Element, id: string) =>
  host.querySelector(
    `[data-ok-node-id="${id}"] > [data-ok-organization-chart-children]`,
  ) as HTMLElement;
const badge = (host: Element, id: string) =>
  toggle(host, id).querySelector("[data-ok-organization-chart-badge]")?.textContent;
/** Collapse animations run here (no reduced motion): end them (spinners loop forever: skip). */
const finish = async () => {
  // The Collapse starts its animation from a MutationObserver: let it start first.
  await settle();
  for (const animation of document.getAnimations())
    if (animation.effect?.getComputedTiming().endTime !== Infinity) animation.finish();
  await settle();
};
const answer = (event: Event) =>
  (event as CustomEvent<{ nodeId: string | null; respondWith(nodes: unknown): void }>).detail;

describe("organization chart expand and collapse", () => {
  it("collapses and expands from the toggle, with events, aria-expanded and the badge", async () => {
    const host = mount(collapsible());
    start();
    await settle();
    const events: string[] = [];
    for (const type of ["expand", "collapse"])
      host.addEventListener(`ok:organization-chart:${type}`, (event) =>
        events.push(`${type}:${(event as CustomEvent<{ nodeId: string }>).detail.nodeId}`),
      );
    expect(badge(host, "b")).toBe("");
    toggle(host, "b").click();
    await finish();
    expect(list(host, "b").hidden).toBe(true);
    expect(toggle(host, "b").getAttribute("aria-expanded")).toBe("false");
    // Two hidden descendants (c and d), at every depth.
    expect(badge(host, "b")).toBe("2");
    // Hidden children draw no connectors: the list isn't rendered.
    expect(getComputedStyle(list(host, "b")).display).toBe("none");
    toggle(host, "b").click();
    await finish();
    expect(list(host, "b").hidden).toBe(false);
    expect(toggle(host, "b").getAttribute("aria-expanded")).toBe("true");
    expect(badge(host, "b")).toBe("");
    expect(events).toEqual(["collapse:b", "expand:b"]);
  });

  it("cancels a toggle when a listener calls preventDefault()", async () => {
    const host = mount(collapsible());
    start();
    host.addEventListener("ok:organization-chart:collapse", (event) => event.preventDefault());
    toggle(host, "b").click();
    await finish();
    expect(list(host, "b").hidden).toBe(false);
    expect(toggle(host, "b").getAttribute("aria-expanded")).toBe("true");
  });

  it("toggles on label clicks only with data-ok-expand-collapse-on-node-click", async () => {
    const host = mount(collapsible());
    start();
    const label = host.querySelector(
      '[data-ok-node-id="b"] > [data-ok-organization-chart-label]',
    ) as HTMLElement;
    label.click();
    await finish();
    expect(list(host, "b").hidden).toBe(false);
    rootOf(host).setAttribute("data-ok-expand-collapse-on-node-click", "");
    await settle();
    label.click();
    await finish();
    expect(list(host, "b").hidden).toBe(true);
    // A button inside the label keeps its own click.
    const inner = document.createElement("button");
    inner.type = "button";
    inner.textContent = "Edit";
    label.append(inner);
    inner.click();
    await finish();
    expect(list(host, "b").hidden).toBe(true);
  });

  it("follows the badge threshold; charts without a badge span show none", async () => {
    const host = mount(collapsible('data-ok-collapse-badge-threshold="3"', { hidden: true }));
    start();
    await settle();
    // b hides 2 nodes: under the threshold of 3.
    expect(badge(host, "b")).toBe("");
    toggle(host, "lead").click();
    await finish();
    expect(badge(host, "lead")).toBe("5");
    // Invalid → the default threshold, 1.
    rootOf(host).setAttribute("data-ok-collapse-badge-threshold", "x");
    await settle();
    expect(badge(host, "b")).toBe("2");
    const bare = mount(collapsible("", { badge: false }));
    await settle();
    toggle(bare, "b").click();
    await finish();
    expect(list(bare, "b").hidden).toBe(true);
    expect(toggle(bare, "b").querySelector("[data-ok-organization-chart-badge]")).toBeNull();
  });

  it("instance methods: batch changes, subtrees, expand and collapse, no events", async () => {
    const host = mount(collapsible());
    start();
    const chart = instanceOf(host);
    const events: Event[] = [];
    host.addEventListener("ok:organization-chart:collapse", (event) => events.push(event));
    host.addEventListener("ok:organization-chart:expand", (event) => events.push(event));
    chart.collapseAll();
    await finish();
    for (const id of ["lead", "b", "c", "lazy"]) expect(chart.isExpanded(id)).toBe(false);
    chart.expandToDepth(1);
    await finish();
    expect(chart.isExpanded("lead")).toBe(true);
    expect(chart.isExpanded("b")).toBe(false);
    chart.expandSubtree("b");
    await finish();
    expect(chart.isExpanded("b")).toBe(true);
    expect(chart.isExpanded("c")).toBe(true);
    chart.collapseSubtree("b");
    await finish();
    expect(chart.isExpanded("b")).toBe(false);
    expect(chart.isExpanded("c")).toBe(false);
    chart.expandAll();
    await finish();
    for (const id of ["lead", "b", "c"]) expect(chart.isExpanded(id)).toBe(true);
    // Batch methods never load lazy children.
    expect(chart.isExpanded("lazy")).toBe(false);
    chart.collapse("c");
    await finish();
    expect(chart.isExpanded("c")).toBe(false);
    await chart.expand("c");
    await finish();
    expect(chart.isExpanded("c")).toBe(true);
    expect(events).toHaveLength(0);
    // Leaves, toggles without a list and unknown ids do nothing.
    chart.collapse("a");
    list(host, "c").remove();
    chart.collapse("c");
    expect(toggle(host, "c").getAttribute("aria-expanded")).toBe("true");
    await chart.expand("nobody");
    chart.collapse("nobody");
    chart.expandSubtree("nobody");
    chart.collapseSubtree("nobody");
    expect(chart.isExpanded("nobody")).toBe(false);
  });

  it("loads lazy children through loadchildren: busy, then appended and expanded", async () => {
    const host = mount(collapsible());
    start();
    let resolve: (nodes: unknown) => void = () => undefined;
    const asked: (string | null)[] = [];
    host.addEventListener("ok:organization-chart:loadchildren", (event) => {
      asked.push(answer(event).nodeId);
      answer(event).respondWith(
        new Promise((done) => {
          resolve = done;
        }),
      );
    });
    toggle(host, "lazy").click();
    await settle();
    expect(toggle(host, "lazy").getAttribute("aria-busy")).toBe("true");
    // A second click (or expand call) while loading waits.
    toggle(host, "lazy").click();
    await instanceOf(host).expand("lazy");
    await settle();
    expect(asked).toEqual(["lazy"]);
    const template = document.createElement("template");
    template.innerHTML = leaf("x") + leaf("y");
    resolve(template.content.cloneNode(true));
    await finish();
    expect(toggle(host, "lazy").hasAttribute("aria-busy")).toBe(false);
    expect(list(host, "lazy").hidden).toBe(false);
    expect(list(host, "lazy").children).toHaveLength(2);
    expect(toggle(host, "lazy").getAttribute("aria-expanded")).toBe("true");
    // Loaded once: collapsing and expanding again doesn't ask.
    toggle(host, "lazy").click();
    await finish();
    expect(badge(host, "lazy")).toBe("2");
    toggle(host, "lazy").click();
    await finish();
    expect(asked).toEqual(["lazy"]);
  });

  it("lazy: a rejection keeps it collapsed and retryable; no nodes make it a leaf", async () => {
    const host = mount(collapsible());
    start();
    let calls = 0;
    host.addEventListener("ok:organization-chart:loadchildren", (event) => {
      calls++;
      if (calls === 1) answer(event).respondWith(Promise.reject(new Error("offline")));
      else answer(event).respondWith([]);
    });
    toggle(host, "lazy").click();
    await finish();
    expect(list(host, "lazy").hidden).toBe(true);
    expect(toggle(host, "lazy").hasAttribute("aria-busy")).toBe(false);
    await instanceOf(host).expand("lazy");
    expect(calls).toBe(2);
    // A leaf now: only the label is left.
    expect(host.querySelector('[data-ok-node-id="lazy"]')?.children).toHaveLength(1);
    // Arrays of elements are appended too.
    const other = mount(collapsible());
    await settle();
    other.addEventListener("ok:organization-chart:loadchildren", (event) => {
      const node = document.createElement("li");
      node.setAttribute("data-ok-organization-chart-node", "");
      answer(event).respondWith([node]);
    });
    toggle(other, "lazy").click();
    await finish();
    expect(list(other, "lazy").children).toHaveLength(1);
    // No answer at all: no children, a leaf.
    const silent = mount(collapsible());
    await settle();
    toggle(silent, "lazy").click();
    await finish();
    expect(silent.querySelector('[data-ok-node-id="lazy"]')?.children).toHaveLength(1);
  });

  it("has no axe violations while collapsed and loading", async () => {
    const host = mount(collapsible());
    start();
    host.addEventListener("ok:organization-chart:loadchildren", (event) =>
      answer(event).respondWith(new Promise(() => undefined)),
    );
    toggle(host, "b").click();
    toggle(host, "lazy").click();
    await finish();
    expect(toggle(host, "lazy").getAttribute("aria-busy")).toBe("true");
    await expectNoAxeViolations(host);
  });

  it("does nothing without data-ok-enable-expand-collapse, and stops when it goes", async () => {
    const host = mount(collapsible());
    rootOf(host).removeAttribute("data-ok-enable-expand-collapse");
    start();
    toggle(host, "b").click();
    await finish();
    expect(list(host, "b").hidden).toBe(false);
    rootOf(host).setAttribute("data-ok-enable-expand-collapse", "");
    await settle();
    toggle(host, "b").click();
    await finish();
    expect(list(host, "b").hidden).toBe(true);
    rootOf(host).removeAttribute("data-ok-enable-expand-collapse");
    await settle();
    toggle(host, "b").click();
    await finish();
    expect(list(host, "b").hidden).toBe(true);
  });

  it("collapsible snippet: the toggle and the methods", async () => {
    const html = snippets.find(([path]) => path.endsWith("/collapsible-group.html"))?.[1] as string;
    const host = mount(html);
    start();
    await settle();
    expect(badge(host, "elias")).toBe("3");
    toggle(host, "elias").click();
    await finish();
    expect(list(host, "elias").hidden).toBe(false);
    instanceOf(host).expandToDepth(1);
    await finish();
    expect(badge(host, "priya")).toBe("4");
  });

  it("lazy snippet: a lead's reports come from its template", async () => {
    const html = snippets.find(([path]) => path.endsWith("/lazy-group.html"))?.[1] as string;
    const host = mount(html);
    start();
    await settle();
    host.addEventListener("ok:organization-chart:loadchildren", (event) => {
      const template = host.querySelector<HTMLTemplateElement>(`#org-lazy-${answer(event).nodeId}`);
      answer(event).respondWith(template?.content.cloneNode(true));
    });
    toggle(host, "priya").click();
    await finish();
    expect(list(host, "priya").hidden).toBe(false);
    // Loaded nodes carry their own toggles.
    toggle(host, "elias").click();
    await finish();
    expect(badge(host, "elias")).toBe("3");
    await expectNoAxeViolations(host);
  });
});

interface HighlightInstance {
  highlightNode(id: string): Promise<void>;
  clearHighlight(): void;
  getHighlightedNode(): string | null;
}

describe("organization chart highlight and search", () => {
  const search = () => {
    const html = snippets.find(([path]) => path.endsWith("/search-group.html"))?.[1] as string;
    return mount(local(html));
  };
  const chartOf = (host: Element) => host.querySelector("#org-search") as HTMLElement;
  const api = (host: Element) =>
    runtime?.get(chartOf(host), "organization-chart") as unknown as HighlightInstance;
  const nodeOf = (host: Element, id: string) =>
    host.querySelector(`[data-ok-node-id="${id}"]`) as HTMLElement;
  const opacity = (host: Element, id: string) =>
    getComputedStyle(nodeOf(host, id).firstElementChild as Element).opacity;
  const still = async (host: Element) => {
    for (const animation of host.ownerDocument.getAnimations())
      if (animation.effect?.getComputedTiming().endTime !== Infinity) animation.finish();
    await settle();
  };

  it("highlightNode opens the collapsed ancestors, marks the node, and clears", async () => {
    const host = search();
    start();
    await settle();
    expect(list(host, "priya").hidden).toBe(true);
    const done = api(host).highlightNode("sofia");
    await finish();
    await done;
    expect(list(host, "priya").hidden).toBe(false);
    expect(list(host, "elias").hidden).toBe(false);
    expect(toggle(host, "priya").getAttribute("aria-expanded")).toBe("true");
    expect(nodeOf(host, "sofia").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(api(host).getHighlightedNode()).toBe("sofia");
    await still(host);
    // A search result fades nothing (contrast).
    expect(opacity(host, "jonah")).toBe("1");
    // The path's segments are measured on its nodes.
    expect(nodeOf(host, "sofia").style.getPropertyValue("--_ok-org-path-offset")).not.toBe("");
    expect(nodeOf(host, "jonah").style.getPropertyValue("--_ok-org-path-offset")).toBe("");
    await api(host).highlightNode("leila");
    expect(nodeOf(host, "sofia").hasAttribute("data-ok-highlighted")).toBe(false);
    await api(host).highlightNode("nobody");
    expect(api(host).getHighlightedNode()).toBe("leila");
    api(host).clearHighlight();
    expect(host.querySelector("[data-ok-highlighted]")).toBeNull();
    expect(api(host).getHighlightedNode()).toBeNull();
    await still(host);
    expect(opacity(host, "jonah")).toBe("1");
  });

  it("writes data-ok-dim-opacity as a private property and follows it", async () => {
    const host = mount(chart('data-ok-dim-opacity="0.25" data-ok-highlight-on-hover'));
    start();
    await settle();
    const root = rootOf(host);
    expect(root.style.getPropertyValue("--_ok-org-dim-opacity")).toBe("0.25");
    root.setAttribute("data-ok-dim-opacity", "nope");
    await settle();
    expect(root.style.getPropertyValue("--_ok-org-dim-opacity")).toBe("");
    runtime?.stop();
    runtime = undefined;
    expect(root.style.getPropertyValue("--_ok-org-dim-opacity")).toBe("");
  });

  it("the search field highlights the picked person (story script pattern)", async () => {
    const host = search();
    start();
    await settle();
    const field = host.querySelector("[data-ok-autocomplete]") as HTMLElement;
    field.addEventListener("ok:autocomplete:change", (event) => {
      const { value } = (event as CustomEvent<{ value: string | null }>).detail;
      if (value) void api(host).highlightNode(value);
    });
    const input = host.querySelector('[role="combobox"]') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    (host.querySelector('[role="option"][data-ok-value="zara"]') as HTMLElement).click();
    await finish();
    expect(nodeOf(host, "zara").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(list(host, "leila").hidden).toBe(false);
  });

  it("has no axe violations with a highlighted node", async () => {
    const host = search();
    start();
    await settle();
    await api(host).highlightNode("tomas");
    await finish();
    await expectNoAxeViolations(host);
  });
});

interface ZoomInstance {
  zoom(factor: number): void;
  zoomIn(): void;
  zoomOut(): void;
  setZoom(level: number): void;
  getZoom(): number;
  resetZoom(): void;
  fitScreen(): void;
  centerOnNode(id: string): Promise<void>;
}

describe("organization chart zoom and pan (ADR-0056)", () => {
  const zoomed = () => {
    const html = snippets.find(([path]) => path.endsWith("/zoom-group.html"))?.[1] as string;
    const host = mount(local(html));
    // The story's scroll area has a fixed height (story CSS).
    (host.querySelector("[data-ok-scrollbar]") as HTMLElement).style.height = "400px";
    return host;
  };
  const chartOf = (host: Element) => host.querySelector("#org-zoom") as HTMLElement;
  const api = (host: Element) =>
    runtime?.get(chartOf(host), "organization-chart") as unknown as ZoomInstance;
  const press = (host: Element, name: string) =>
    (host.querySelector(`[data-ok-organization-chart-${name}]`) as HTMLButtonElement).click();
  const value = (host: Element) =>
    host.querySelector("[data-ok-organization-chart-zoom-value]")?.textContent;
  const key = (target: Element, name: string) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }),
    );

  it("the toolbar zooms through a cancelable event; the level is the attribute", async () => {
    const host = zoomed();
    start();
    await settle();
    const chart = chartOf(host);
    expect(value(host)).toBe("100%");
    const events: { zoom: number; previous: number }[] = [];
    chart.addEventListener("ok:organization-chart:zoom", (event) =>
      events.push((event as CustomEvent<{ zoom: number; previous: number }>).detail),
    );
    press(host, "zoom-in");
    expect(events).toEqual([{ zoom: 1.25, previous: 1 }]);
    expect(chart.getAttribute("data-ok-zoom")).toBe("1.25");
    expect(chart.style.getPropertyValue("--_ok-org-zoom")).toBe("1.25");
    expect(getComputedStyle(chart).zoom).toBe("1.25");
    expect(value(host)).toBe("125%");
    const cancel = (event: Event) => event.preventDefault();
    chart.addEventListener("ok:organization-chart:zoom", cancel);
    press(host, "zoom-in");
    expect(chart.getAttribute("data-ok-zoom")).toBe("1.25");
    chart.removeEventListener("ok:organization-chart:zoom", cancel);
    press(host, "reset");
    expect(chart.getAttribute("data-ok-zoom")).toBe("1");
    // Fit: the whole chart in the 400px area, never above 100%.
    press(host, "fit");
    expect(api(host).getZoom()).toBeLessThan(1);
    const area = host.querySelector("[data-ok-scrollbar]") as HTMLElement;
    const box = (chart.firstElementChild as Element).getBoundingClientRect();
    expect(box.width).toBeLessThanOrEqual(area.clientWidth);
    expect(box.height).toBeLessThanOrEqual(area.clientHeight);
    // Zoomed out, the toggles are smaller than 24px (the user's choice); scanned at 100%.
    press(host, "reset");
    await expectNoAxeViolations(host);
  });

  it("keys and Ctrl + wheel zoom; the limits come from the attributes", async () => {
    const host = zoomed();
    const chart = chartOf(host);
    chart.setAttribute("data-ok-max-zoom", "1.5");
    start();
    await settle();
    const area = host.querySelector("[data-ok-scrollbar]") as HTMLElement;
    key(area, "+");
    key(area, "+");
    expect(api(host).getZoom()).toBe(1.5);
    const zoomIn = host.querySelector("[data-ok-organization-chart-zoom-in]") as Element;
    expect(zoomIn.getAttribute("aria-disabled")).toBe("true");
    key(area, "0");
    expect(api(host).getZoom()).toBe(1);
    const wheel = new WheelEvent("wheel", {
      deltaY: 200,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    area.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(api(host).getZoom()).toBeLessThan(1);
    // Turned off: no zoom from the user; the methods still work.
    chart.removeAttribute("data-ok-enable-zoom-pan");
    await settle();
    key(area, "0");
    expect(api(host).getZoom()).toBeLessThan(1);
    api(host).resetZoom();
    expect(api(host).getZoom()).toBe(1);
  });

  it("instance methods: steps that undo each other, set, factor, fit and center; no events", async () => {
    const host = zoomed();
    start();
    await settle();
    const chart = chartOf(host);
    let events = 0;
    chart.addEventListener("ok:organization-chart:zoom", () => events++);
    api(host).zoomIn();
    expect(api(host).getZoom()).toBe(1.25);
    api(host).zoomOut();
    expect(api(host).getZoom()).toBe(1);
    api(host).zoom(0.5);
    expect(api(host).getZoom()).toBe(1.5);
    api(host).zoom(-0.5);
    expect(api(host).getZoom()).toBe(0.75);
    api(host).setZoom(9);
    expect(api(host).getZoom()).toBe(2);
    api(host).fitScreen();
    expect(api(host).getZoom()).toBeLessThan(1);
    api(host).fitScreen();
    expect(events).toBe(0);
    api(host).setZoom(2);
    await api(host).centerOnNode("tomas");
    await api(host).centerOnNode("nobody");
    await new Promise((resolve) => setTimeout(resolve, 700));
    const area = host.querySelector("[data-ok-scrollbar]") as HTMLElement;
    const label = (
      chart.querySelector(
        '[data-ok-node-id="tomas"] > [data-ok-organization-chart-label]',
      ) as Element
    ).getBoundingClientRect();
    const frame = area.getBoundingClientRect();
    // Centered on each axis, unless the area can't scroll further (Tomás is on the last level).
    const middle = frame.top + area.clientTop + area.clientHeight / 2;
    const center = frame.left + area.clientLeft + area.clientWidth / 2;
    const bottom = area.scrollTop >= area.scrollHeight - area.clientHeight - 1;
    const end = Math.abs(area.scrollLeft) >= area.scrollWidth - area.clientWidth - 1;
    if (!bottom) expect(Math.abs(label.top + label.height / 2 - middle)).toBeLessThan(2);
    if (!end) expect(Math.abs(label.left + label.width / 2 - center)).toBeLessThan(2);
    expect(label.top).toBeGreaterThanOrEqual(frame.top);
    expect(label.bottom).toBeLessThanOrEqual(frame.bottom);
    expect(area.scrollTop).toBeGreaterThan(0);
  });

  it("a chart without the attribute gets it from a method; destroy cleans up", async () => {
    const host = mount(chart());
    const root = rootOf(host);
    const instance = start().get(root, "organization-chart") as unknown as ZoomInstance;
    await settle();
    expect(root.hasAttribute("data-ok-zoom")).toBe(false);
    instance.resetZoom();
    expect(root.getAttribute("data-ok-zoom")).toBe("1");
    instance.setZoom(0.5);
    expect(getComputedStyle(root).zoom).toBe("0.5");
    runtime?.stop();
    runtime = undefined;
    expect(root.style.getPropertyValue("--_ok-org-zoom")).toBe("");
  });
});

interface SelectionInstance {
  setSelection(ids: readonly string[]): void;
  clearSelection(): void;
  getSelection(): string[];
  getNodePath(id: string): string[];
  centerOnNode(id: string): Promise<void>;
}

const press = (target: Element, key: string) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

describe("organization chart tree, selection and breadcrumb (ADR-0063)", () => {
  const story = (name: string) => {
    const html = snippets.find(([path]) => path.endsWith(`/${name}-group.html`))?.[1] as string;
    return mount(local(html));
  };
  const nodeOf = (host: Element, id: string) =>
    host.querySelector(`[data-ok-node-id="${id}"]`) as HTMLElement;
  const api = (host: Element, id: string) =>
    runtime?.get(
      host.querySelector(`#${id}`) as Element,
      "organization-chart",
    ) as unknown as SelectionInstance;

  it("the snippets are plain lists until the runtime turns them into a tree", async () => {
    const host = story("selection");
    const root = host.querySelector("#org-selection") as HTMLElement;
    expect(root.hasAttribute("role")).toBe(false);
    start();
    await settle();
    expect(root.getAttribute("role")).toBe("tree");
    expect(root.getAttribute("aria-multiselectable")).toBe("true");
    expect(nodeOf(host, "maya").getAttribute("role")).toBe("treeitem");
    expect(nodeOf(host, "priya").getAttribute("aria-selected")).toBe("true");
    expect(nodeOf(host, "maya").getAttribute("aria-selected")).toBe("false");
    // The selected node holds the tab stop.
    expect(nodeOf(host, "priya").getAttribute("tabindex")).toBe("0");
    expect(root.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    await expectNoAxeViolations(host);
  });

  it("a click or Space asks through a cancelable select event, then writes data-ok-selected", async () => {
    const host = story("selection");
    start();
    await settle();
    const root = host.querySelector("#org-selection") as HTMLElement;
    const events: { selectedNodes: string[]; nodeId: string; selected: boolean }[] = [];
    root.addEventListener("ok:organization-chart:select", (event) =>
      events.push((event as CustomEvent).detail),
    );
    (nodeOf(host, "jonah").firstElementChild as HTMLElement).click();
    expect(events.at(-1)).toMatchObject({
      selectedNodes: ["priya", "jonah"],
      nodeId: "jonah",
      selected: true,
    });
    expect(nodeOf(host, "jonah").hasAttribute("data-ok-selected")).toBe(true);
    await settle();
    expect(nodeOf(host, "jonah").getAttribute("aria-selected")).toBe("true");
    nodeOf(host, "priya").focus();
    expect(press(nodeOf(host, "priya"), " ").defaultPrevented).toBe(true);
    expect(events.at(-1)).toMatchObject({ selectedNodes: ["jonah"], selected: false });
    expect(nodeOf(host, "priya").hasAttribute("data-ok-selected")).toBe(false);
    const stop = (event: Event) => event.preventDefault();
    root.addEventListener("ok:organization-chart:select", stop);
    press(nodeOf(host, "priya"), " ");
    expect(nodeOf(host, "priya").hasAttribute("data-ok-selected")).toBe(false);
    root.removeEventListener("ok:organization-chart:select", stop);
    expect(api(host, "org-selection").getSelection()).toEqual(["jonah"]);
  });

  it("methods set, clear and read the selection without events; single keeps one node", async () => {
    const host = story("selection");
    start();
    await settle();
    const root = host.querySelector("#org-selection") as HTMLElement;
    let events = 0;
    root.addEventListener("ok:organization-chart:select", () => events++);
    const chart = api(host, "org-selection");
    chart.setSelection(["leila", "jonah", "leila"]);
    expect(chart.getSelection()).toEqual(["leila", "jonah"]);
    expect(nodeOf(host, "priya").hasAttribute("data-ok-selected")).toBe(false);
    chart.clearSelection();
    expect(root.querySelector("[data-ok-selected]")).toBeNull();
    root.setAttribute("data-ok-enable-selection", "single");
    await settle();
    expect(root.hasAttribute("aria-multiselectable")).toBe(false);
    chart.setSelection(["zara", "oskar"]);
    expect(chart.getSelection()).toEqual(["zara"]);
    (nodeOf(host, "oskar").firstElementChild as HTMLElement).click();
    expect(chart.getSelection()).toEqual(["oskar"]);
    expect(events).toBe(1);
    // Off: the tree goes, the state stays in the markup, methods do nothing.
    root.removeAttribute("data-ok-enable-selection");
    await settle();
    expect(root.hasAttribute("role")).toBe(false);
    expect(nodeOf(host, "oskar").hasAttribute("aria-selected")).toBe(false);
    chart.setSelection(["maya"]);
    expect(chart.getSelection()).toEqual(["oskar"]);
    // Keyboard navigation alone: a tree without selection.
    root.setAttribute("data-ok-enable-keyboard-navigation", "");
    await settle();
    expect(root.getAttribute("role")).toBe("tree");
    expect(nodeOf(host, "maya").hasAttribute("aria-selected")).toBe(false);
  });

  it("arrow keys walk the chart and expand or collapse through the cancelable events", async () => {
    const host = story("breadcrumb");
    start();
    await settle();
    const root = host.querySelector("#org-breadcrumb") as HTMLElement;
    const events: string[] = [];
    for (const type of ["expand", "collapse"])
      root.addEventListener(`ok:organization-chart:${type}`, (event) =>
        events.push(`${type}:${(event as CustomEvent<{ nodeId: string }>).detail.nodeId}`),
      );
    nodeOf(host, "maya").focus();
    press(nodeOf(host, "maya"), "ArrowDown");
    expect(document.activeElement).toBe(nodeOf(host, "jonah"));
    press(nodeOf(host, "jonah"), "ArrowLeft");
    await finish();
    expect(list(host, "jonah").hidden).toBe(true);
    press(nodeOf(host, "jonah"), "ArrowLeft");
    expect(document.activeElement).toBe(nodeOf(host, "maya"));
    press(nodeOf(host, "maya"), "ArrowLeft");
    await finish();
    expect(events).toEqual(["collapse:jonah", "collapse:maya"]);
    expect(list(host, "maya").hidden).toBe(true);
    expect(nodeOf(host, "maya").getAttribute("aria-expanded")).toBe("false");
    press(nodeOf(host, "maya"), "ArrowRight");
    await finish();
    expect(list(host, "maya").hidden).toBe(false);
    press(nodeOf(host, "maya"), "ArrowRight");
    expect(document.activeElement).toBe(nodeOf(host, "jonah"));
    press(nodeOf(host, "jonah"), "End");
    expect(document.activeElement).toBe(nodeOf(host, "zara"));
    press(nodeOf(host, "zara"), "Home");
    press(nodeOf(host, "maya"), "t");
    expect(document.activeElement).toBe(nodeOf(host, "tomas"));
    // Enter toggles the focused branch.
    press(nodeOf(host, "tomas"), "ArrowUp");
    press(nodeOf(host, "sofia"), "Enter");
    await finish();
    expect(events.at(-1)).toBe("collapse:sofia");
    // The toggles left the Tab order.
    expect(toggle(host, "maya").getAttribute("tabindex")).toBe("-1");
    // A canceled expand keeps the branch as it is.
    const stop = (event: Event) => event.preventDefault();
    root.addEventListener("ok:organization-chart:expand", stop);
    press(nodeOf(host, "sofia"), "ArrowRight");
    await finish();
    expect(list(host, "sofia").hidden).toBe(true);
    root.removeEventListener("ok:organization-chart:expand", stop);
  });

  it("the breadcrumb follows the selection through getNodePath (story script pattern)", async () => {
    const host = story("breadcrumb");
    start();
    await settle();
    const chart = api(host, "org-breadcrumb");
    expect(chart.getNodePath("sofia")).toEqual(["maya", "priya", "elias", "sofia"]);
    expect(chart.getNodePath("nobody")).toEqual([]);
    expect(chart.getSelection()).toEqual(["sofia"]);
    const trail = () =>
      [...host.querySelectorAll("[data-ok-breadcrumbs-item]")].map((item) =>
        item.textContent?.trim(),
      );
    expect(trail()).toEqual(["Maya Lindqvist", "Priya Raman", "Elias Novak", "Sofia Marchetti"]);
    const root = host.querySelector("#org-breadcrumb") as HTMLElement;
    root.addEventListener("ok:organization-chart:select", (event) => {
      const [id] = (event as CustomEvent<{ selectedNodes: string[] }>).detail.selectedNodes;
      const path = id ? chart.getNodePath(id) : [];
      const list = host.querySelector("[data-ok-breadcrumbs-list]") as HTMLElement;
      list.replaceChildren(
        ...path.map((item) => {
          const li = document.createElement("li");
          li.setAttribute("data-ok-breadcrumbs-item", "");
          li.textContent = item;
          return li;
        }),
      );
    });
    (nodeOf(host, "zara").firstElementChild as HTMLElement).click();
    expect(trail()).toEqual(["maya", "leila", "zara"]);
    await expectNoAxeViolations(host);
  });
});
