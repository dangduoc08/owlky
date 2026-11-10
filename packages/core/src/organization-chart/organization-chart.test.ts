import { afterEach, describe, expect, it, vi } from "vitest";
import {
  organizationChartAttributes,
  organizationChartDirections,
  organizationChartOptions,
  readNumber,
  readStyle,
} from "../index.js";
import {
  createOrganizationChartController,
  ORGANIZATION_CHART_LENGTHS,
  organizationChartDepth,
  organizationChartDescendants,
  organizationChartExpanded,
  organizationChartList,
  organizationChartLoaded,
  organizationChartNode,
  organizationChartNodeId,
  organizationChartNodes,
  organizationChartPlan,
  organizationChartStyle,
  organizationChartToggle,
} from "./organization-chart.js";

const HOSTILE = '"><img src=x onerror=alert(1)>';

describe("organizationChartAttributes", () => {
  it("writes the explicit style defaults and no lengths", () => {
    expect(organizationChartAttributes()).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-color": "divider",
      "data-ok-line-style": "solid",
    });
  });

  it("writes every option value", () => {
    expect(
      organizationChartAttributes({
        lineHeight: 20,
        lineWidth: "2px",
        lineColor: "primary",
        lineStyle: "dashed",
        lineBorderRadius: "0.5rem",
        nodePadding: 8,
      }),
    ).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-height": "20",
      "data-ok-line-width": "2px",
      "data-ok-line-color": "primary",
      "data-ok-line-style": "dashed",
      "data-ok-line-border-radius": "0.5rem",
      "data-ok-node-padding": "8",
    });
  });

  it("drops invalid values (unknown enums, negative or hostile lengths)", () => {
    expect(
      organizationChartAttributes({
        lineHeight: -4,
        lineWidth: "calc(1px + 1px)",
        lineColor: HOSTILE as never,
        lineStyle: "groove" as never,
        lineBorderRadius: HOSTILE,
        nodePadding: Number.NaN,
      }),
    ).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-color": "divider",
      "data-ok-line-style": "solid",
    });
  });

  it("accepts every color and style of the schema", () => {
    for (const lineColor of organizationChartOptions.options.lineColor.values)
      expect(organizationChartAttributes({ lineColor })["data-ok-line-color"]).toBe(lineColor);
    for (const lineStyle of organizationChartOptions.options.lineStyle.values)
      expect(organizationChartAttributes({ lineStyle })["data-ok-line-style"]).toBe(lineStyle);
  });

  it("reads options back from the markup, with defaults", () => {
    const element = document.createElement("ul");
    const { options } = organizationChartOptions;
    expect(readNumber(element, options.lineHeight)).toBe(40);
    expect(readNumber(element, options.lineWidth)).toBe(1);
    expect(readNumber(element, options.lineBorderRadius)).toBe(24);
    expect(readNumber(element, options.nodePadding)).toBe(4);
    expect(readStyle(element, options.lineColor)).toBe("divider");
    element.setAttribute("data-ok-line-height", "3em");
    element.setAttribute("data-ok-line-color", "warning");
    expect(readNumber(element, options.lineHeight)).toBe("3em");
    expect(readStyle(element, options.lineColor)).toBe("warning");
  });

  it("writes a direction only when one is given and valid (ADR-0052)", () => {
    expect(organizationChartAttributes()["data-ok-direction"]).toBeUndefined();
    for (const direction of organizationChartDirections)
      expect(organizationChartAttributes({ direction })["data-ok-direction"]).toBe(direction);
    expect(
      organizationChartAttributes({ direction: HOSTILE as never })["data-ok-direction"],
    ).toBeUndefined();
    const element = document.createElement("ul");
    expect(readStyle(element, organizationChartOptions.options.direction)).toBe("top");
    element.setAttribute("data-ok-direction", "right");
    expect(readStyle(element, organizationChartOptions.options.direction)).toBe("right");
  });
});

describe("organizationChartStyle", () => {
  it("is empty without values (the stylesheet's defaults apply)", () => {
    expect(organizationChartStyle({})).toEqual({});
  });

  it("turns numbers into px and keeps lengths with units", () => {
    expect(
      organizationChartStyle({
        lineHeight: 20,
        lineWidth: "2px",
        lineBorderRadius: "0.75rem",
        nodePadding: "1.5em",
      }),
    ).toEqual({
      "--_ok-org-line-height": "20px",
      "--_ok-org-line-width": "2px",
      "--_ok-org-line-radius": "0.75rem",
      "--_ok-org-node-padding": "1.5em",
    });
  });

  it("leaves out invalid values", () => {
    expect(
      organizationChartStyle({
        lineHeight: "-1px",
        lineWidth: HOSTILE,
        lineBorderRadius: "1e999",
        nodePadding: { toString: () => "4px" },
      }),
    ).toEqual({});
  });

  it("names one private property per length option", () => {
    expect(Object.keys(ORGANIZATION_CHART_LENGTHS)).toEqual([
      "lineHeight",
      "lineWidth",
      "lineBorderRadius",
      "nodePadding",
    ]);
    for (const name of Object.values(ORGANIZATION_CHART_LENGTHS))
      expect(name).toMatch(/^--_ok-org-/);
  });
});

// --- Expand and collapse (ADR-0051) ------------------------------------------------------------

describe("organizationChartAttributes: expand and collapse", () => {
  it("writes the flags when on and a valid threshold; nothing by default", () => {
    expect(
      organizationChartAttributes({
        enableExpandCollapse: true,
        expandCollapseOnNodeClick: true,
        collapseBadgeThreshold: 3,
      }),
    ).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-color": "divider",
      "data-ok-line-style": "solid",
      "data-ok-enable-expand-collapse": "",
      "data-ok-expand-collapse-on-node-click": "",
      "data-ok-collapse-badge-threshold": "3",
    });
    expect(
      organizationChartAttributes({ enableExpandCollapse: false, collapseBadgeThreshold: 0 }),
    ).toEqual(organizationChartAttributes());
  });
});

const branch = (id: string, children: string, hidden = false) =>
  `<li data-ok-organization-chart-node data-ok-node-id="${id}"><div data-ok-organization-chart-label>${id}</div>` +
  `<button type="button" data-ok-organization-chart-toggle aria-expanded="${!hidden && children !== ""}"><span data-ok-organization-chart-badge></span></button>` +
  `<ul data-ok-organization-chart-children${hidden ? " hidden" : ""}>${children}</ul></li>`;
const leaf = (id: string, content = id) =>
  `<li data-ok-organization-chart-node data-ok-node-id="${id}"><div data-ok-organization-chart-label>${content}</div></li>`;
/** lead › (a, b › (c › d), lazy); `a`'s label holds a nested chart (n1 › n2). */
const NESTED = `<ul data-ok-organization-chart aria-label="Nested">${branch("n1", leaf("n2"))}</ul>`;
function mountChart(): HTMLElement {
  const host = document.createElement("div");
  // Test markup only (library code never uses innerHTML).
  host.innerHTML = `<ul data-ok-organization-chart data-ok-enable-expand-collapse aria-label="Team">${branch(
    "lead",
    leaf("a", NESTED) + branch("b", branch("c", leaf("d"))) + branch("lazy", "", true),
  )}</ul>`;
  document.body.append(host);
  return host.firstElementChild as HTMLElement;
}
const byId = (root: Element, id: string) => organizationChartNode(root, id) as HTMLElement;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("organization chart tree helpers", () => {
  afterEach(() => document.body.replaceChildren());

  it("finds the chart's own nodes, toggles, lists, ids and depths", () => {
    const root = mountChart();
    expect(organizationChartNodes(root).map(organizationChartNodeId)).toEqual([
      "lead",
      "a",
      "b",
      "c",
      "d",
      "lazy",
    ]);
    expect(organizationChartNode(root, "n1")).toBeNull();
    expect(organizationChartToggle(byId(root, "a"))).toBeNull();
    expect(organizationChartList(byId(root, "a"))).toBeNull();
    expect(organizationChartDepth(byId(root, "lead"))).toBe(0);
    expect(organizationChartDepth(byId(root, "d"))).toBe(3);
    // A nested chart counts from its own root.
    const nested = root.querySelector('[data-ok-node-id="n2"]') as Element;
    expect(organizationChartDepth(nested)).toBe(1);
    expect(organizationChartDescendants(root, byId(root, "lead"))).toBe(5);
    expect(organizationChartDescendants(root, byId(root, "a"))).toBe(0);
    expect(organizationChartLoaded(byId(root, "lazy"))).toBe(false);
    expect(organizationChartLoaded(byId(root, "a"))).toBe(false);
    expect(organizationChartExpanded(byId(root, "lazy"))).toBe(false);
    expect(organizationChartExpanded(byId(root, "b"))).toBe(true);
  });

  it("plans the batch methods on loaded nodes with toggles only", () => {
    const root = mountChart();
    const ids = (plan: Map<HTMLElement, boolean>) =>
      Object.fromEntries(
        [...plan].map(([node, expand]) => [organizationChartNodeId(node), expand]),
      );
    expect(ids(organizationChartPlan(root, { type: "expandAll" }))).toEqual({
      lead: true,
      b: true,
      c: true,
    });
    expect(ids(organizationChartPlan(root, { type: "collapseAll" }))).toEqual({
      lead: false,
      b: false,
      c: false,
      lazy: false,
    });
    expect(ids(organizationChartPlan(root, { type: "expandToDepth", depth: 1.7 }))).toEqual({
      lead: true,
      b: false,
      c: false,
      lazy: false,
    });
    expect(ids(organizationChartPlan(root, { type: "expandToDepth", depth: -3 }))).toEqual({
      lead: false,
      b: false,
      c: false,
      lazy: false,
    });
    const b = byId(root, "b");
    expect(ids(organizationChartPlan(root, { type: "expandSubtree", node: b }))).toEqual({
      b: true,
      c: true,
    });
    expect(ids(organizationChartPlan(root, { type: "collapseSubtree", node: b }))).toEqual({
      b: false,
      c: false,
    });
  });
});

describe("createOrganizationChartController", () => {
  afterEach(() => document.body.replaceChildren());

  it("reports toggle clicks as intent and changes nothing itself", () => {
    const root = mountChart();
    const onToggle = vi.fn();
    const controller = createOrganizationChartController(root, { onToggle });
    (organizationChartToggle(byId(root, "b")) as HTMLButtonElement).click();
    expect(onToggle).toHaveBeenLastCalledWith(byId(root, "b"), false);
    expect(organizationChartExpanded(byId(root, "b"))).toBe(true);
    (organizationChartToggle(byId(root, "lazy")) as HTMLButtonElement).click();
    expect(onToggle).toHaveBeenLastCalledWith(byId(root, "lazy"), true);
    // Busy toggles (loading) wait.
    organizationChartToggle(byId(root, "lazy"))?.setAttribute("aria-busy", "true");
    (organizationChartToggle(byId(root, "lazy")) as HTMLButtonElement).click();
    expect(onToggle).toHaveBeenCalledTimes(2);
    // Label clicks only with expandCollapseOnNodeClick; leaves and nested charts are ignored.
    const label = (id: string) =>
      byId(root, id).querySelector(":scope > [data-ok-organization-chart-label]") as HTMLElement;
    label("b").click();
    expect(onToggle).toHaveBeenCalledTimes(2);
    controller.update({ onToggle, expandCollapseOnNodeClick: true });
    // A focusable scroll area around the chart is outside the label: label clicks still count.
    root.parentElement?.setAttribute("tabindex", "0");
    label("b").click();
    expect(onToggle).toHaveBeenCalledTimes(3);
    label("a").click();
    (root.querySelector('[data-ok-node-id="n1"] > button') as HTMLButtonElement).click();
    (root.querySelector('[data-ok-node-id="n1"] > div') as HTMLElement).click();
    expect(onToggle).toHaveBeenCalledTimes(3);
    // Interactive content inside a label keeps its click; so do prevented clicks.
    const inner = document.createElement("a");
    inner.href = "#x";
    label("b").append(inner);
    inner.addEventListener("click", (event) => event.preventDefault());
    inner.click();
    const span = document.createElement("span");
    label("b").append(span);
    span.addEventListener("click", (event) => event.preventDefault());
    span.click();
    expect(onToggle).toHaveBeenCalledTimes(3);
    controller.destroy();
    (organizationChartToggle(byId(root, "b")) as HTMLButtonElement).click();
    expect(onToggle).toHaveBeenCalledTimes(3);
  });

  it("writes the hidden count on collapsed nodes' badges and follows changes", async () => {
    const root = mountChart();
    const badge = (id: string) =>
      organizationChartToggle(byId(root, id))?.querySelector("[data-ok-organization-chart-badge]")
        ?.textContent;
    const controller = createOrganizationChartController(root);
    expect(badge("b")).toBe("");
    (organizationChartList(byId(root, "b")) as HTMLElement).hidden = true;
    await tick();
    expect(badge("b")).toBe("2");
    // Lazy loads add nodes: the count follows.
    const added = document.createElement("li");
    added.setAttribute("data-ok-organization-chart-node", "");
    (organizationChartList(byId(root, "c")) as HTMLElement).append(added);
    await tick();
    expect(badge("b")).toBe("3");
    controller.update({ collapseBadgeThreshold: 4 });
    expect(badge("b")).toBe("");
    controller.update({ collapseBadgeThreshold: 0 });
    expect(badge("b")).toBe("3");
    expect(badge("lazy")).toBe("");
    controller.sync();
    controller.destroy();
    (organizationChartList(byId(root, "b")) as HTMLElement).hidden = false;
    await tick();
    expect(badge("b")).toBe("3");
  });
});
