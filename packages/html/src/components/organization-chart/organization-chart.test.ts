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
  it("covers every story group", () => expect(snippets).toHaveLength(14));

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
  const center = (element: Element) => {
    const rect = (element.firstElementChild ?? element).getBoundingClientRect();
    return vertical ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
  };
  const lines = (element: Element, which: "::before" | "::after") => {
    const style = getComputedStyle(element, which);
    if (style.content === "none") return [];
    const host = element.getBoundingClientRect();
    const start = vertical
      ? host.left + Number.parseFloat(style.left)
      : host.top + Number.parseFloat(style.top);
    const size = Number.parseFloat(vertical ? style.width : style.height);
    const sides: [number, number][] = vertical
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
    for (const child of list.children) {
      const own = child.querySelector(":scope > [data-ok-organization-chart-label]") as Element;
      if (!near([...lines(child, "::before"), ...lines(child, "::after")], center(own)))
        misses.push(`line to ${own.textContent?.trim()}`);
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
