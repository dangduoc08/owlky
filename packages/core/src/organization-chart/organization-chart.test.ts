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
  createOrganizationChartHighlight,
  ORGANIZATION_CHART_LENGTHS,
  organizationChartAncestors,
  organizationChartDepth,
  organizationChartDescendants,
  organizationChartExpanded,
  organizationChartHighlighted,
  organizationChartList,
  organizationChartLoaded,
  organizationChartNode,
  organizationChartNodeId,
  organizationChartNodes,
  organizationChartPathStyle,
  organizationChartPlan,
  organizationChartStyle,
  organizationChartToggle,
  revealOrganizationChartNode,
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

// --- Lineage highlight and search ---------------------------------------------------------------

describe("organizationChartStyle: dimOpacity", () => {
  it("writes the dim strength, capped at 1; invalid values are left out", () => {
    expect(organizationChartStyle({ dimOpacity: 0.5 })).toEqual({ "--_ok-org-dim-opacity": "0.5" });
    expect(organizationChartStyle({ dimOpacity: "0" })).toEqual({ "--_ok-org-dim-opacity": "0" });
    expect(organizationChartStyle({ dimOpacity: 4 })).toEqual({ "--_ok-org-dim-opacity": "1" });
    expect(organizationChartStyle({ dimOpacity: -1 })).toEqual({});
    expect(organizationChartStyle({ dimOpacity: HOSTILE })).toEqual({});
    expect(organizationChartAttributes({ highlightOnHover: true, dimOpacity: 0.4 })).toMatchObject({
      "data-ok-highlight-on-hover": "",
      "data-ok-dim-opacity": "0.4",
    });
    expect(organizationChartAttributes()["data-ok-highlight-on-hover"]).toBeUndefined();
  });
});

/** A lead over three children 100px, 50px and 150px wide (or tall): the list's center is at 150px. */
function mountRow(attrs = "", listAttrs = "") {
  const across = attrs.includes('"left"') || attrs.includes('"right"');
  const size = (px: number) => (across ? `height:${px}px;width:40px` : `width:${px}px;height:40px`);
  const child = (id: string, px: number) =>
    `<li data-ok-organization-chart-node data-ok-node-id="${id}" style="flex:none;padding:0;${size(px)}"><div data-ok-organization-chart-label>${id}</div></li>`;
  const host = document.createElement("div");
  // Test markup only (library code never uses innerHTML).
  host.innerHTML = `<ul data-ok-organization-chart aria-label="Row" ${attrs}><li data-ok-organization-chart-node data-ok-node-id="lead"><div data-ok-organization-chart-label>lead</div><ul data-ok-organization-chart-children ${listAttrs} style="display:flex;flex-direction:${across ? "column" : "row"};padding:0;width:max-content">${child("x", 100)}${child("y", 50)}${child("z", 150)}</ul></li></ul>`;
  document.body.append(host);
  return host.firstElementChild as HTMLElement;
}
const pathOf = (root: Element, id: string) =>
  organizationChartPathStyle(organizationChartNode(root, id) as HTMLElement);

describe("organization chart lineage helpers", () => {
  afterEach(() => document.body.replaceChildren());

  it("lists a node's ancestors, nearest first, within its own chart", () => {
    const root = mountChart();
    expect(organizationChartAncestors(byId(root, "d")).map(organizationChartNodeId)).toEqual([
      "c",
      "b",
      "lead",
    ]);
    expect(organizationChartAncestors(byId(root, "lead"))).toEqual([]);
    const nested = root.querySelector('[data-ok-node-id="n2"]') as Element;
    expect(organizationChartAncestors(nested).map(organizationChartNodeId)).toEqual(["n1"]);
    expect(organizationChartHighlighted(root)).toEqual([]);
    byId(root, "c").setAttribute("data-ok-highlighted", "");
    expect(organizationChartHighlighted(root)).toEqual([byId(root, "c")]);
  });

  it("measures each child's way to its list's center, in logical px", () => {
    const root = mountRow();
    expect(pathOf(root, "lead")).toBeNull();
    expect(pathOf(root, "x")).toEqual({
      "--_ok-org-path-offset": "100px",
      "--_ok-org-path-forward": "1",
      "--_ok-org-path-round": "1",
    });
    expect(pathOf(root, "y")).toEqual({
      "--_ok-org-path-offset": "25px",
      "--_ok-org-path-forward": "1",
      "--_ok-org-path-round": "0",
    });
    expect(pathOf(root, "z")).toEqual({
      "--_ok-org-path-offset": "-75px",
      "--_ok-org-path-forward": "0",
      "--_ok-org-path-round": "1",
    });
  });

  it("measures along the block axis for left and right charts, and from the end in RTL", () => {
    const left = mountRow('data-ok-direction="left"');
    expect(pathOf(left, "z")?.["--_ok-org-path-offset"]).toBe("-75px");
    document.body.replaceChildren();
    const rtl = mountRow("", 'dir="rtl"');
    expect(pathOf(rtl, "x")?.["--_ok-org-path-offset"]).toBe("100px");
    expect(pathOf(rtl, "z")?.["--_ok-org-path-forward"]).toBe("0");
  });

  it("measures in layout px inside a scaled container", () => {
    const root = mountRow();
    (root.parentElement as HTMLElement).style.transform = "scale(0.5)";
    expect(pathOf(root, "x")?.["--_ok-org-path-offset"]).toBe("100px");
  });

  it("an only child sits on its parent's line; hidden lists measure nothing", () => {
    const root = mountChart();
    expect(pathOf(root, "d")?.["--_ok-org-path-round"]).toBe("0");
    (organizationChartList(byId(root, "b")) as HTMLElement).hidden = true;
    expect(pathOf(root, "c")?.["--_ok-org-path-offset"]).toBe("0px");
  });
});

describe("createOrganizationChartHighlight", () => {
  afterEach(() => document.body.replaceChildren());
  const offset = (root: Element, id: string) =>
    (organizationChartNode(root, id) as HTMLElement).style.getPropertyValue(
      "--_ok-org-path-offset",
    );
  const over = (element: Element, related: Element | null = null) =>
    element.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, relatedTarget: related }),
    );
  const out = (element: Element, related: Element | null) =>
    element.dispatchEvent(
      new PointerEvent("pointerout", { bubbles: true, relatedTarget: related }),
    );
  const label = (root: Element, id: string) =>
    (organizationChartNode(root, id) as HTMLElement).firstElementChild as HTMLElement;

  it("measures the hovered and focused paths only with data-ok-highlight-on-hover", () => {
    const root = mountRow();
    const highlight = createOrganizationChartHighlight(root);
    over(label(root, "z"));
    expect(offset(root, "z")).toBe("");
    root.setAttribute("data-ok-highlight-on-hover", "");
    out(label(root, "z"), document.body);
    over(label(root, "z"));
    expect(offset(root, "z")).toBe("-75px");
    // Moving to another node moves the measures.
    out(label(root, "z"), label(root, "x"));
    over(label(root, "x"));
    expect(offset(root, "x")).toBe("100px");
    expect(offset(root, "z")).toBe("");
    // Leaving: the stale measures stay until the next change (CSS no longer shows them).
    out(label(root, "x"), null);
    highlight.sync();
    expect(offset(root, "x")).toBe("");
    // Focus inside a label counts too.
    const button = document.createElement("button");
    button.textContent = "Open";
    label(root, "y").append(button);
    button.focus();
    expect(offset(root, "y")).toBe("25px");
    button.blur();
    highlight.sync();
    expect(offset(root, "y")).toBe("");
    // Targets outside labels and toggles change nothing.
    over(root);
    expect(offset(root, "x")).toBe("");
    highlight.destroy();
  });

  it("follows data-ok-highlighted and layout changes, and cleans up", async () => {
    const root = mountRow();
    const highlight = createOrganizationChartHighlight(root);
    const z = organizationChartNode(root, "z") as HTMLElement;
    z.setAttribute("data-ok-highlighted", "");
    await tick();
    expect(offset(root, "z")).toBe("-75px");
    // A sibling goes away: the list's center moves.
    (organizationChartNode(root, "y") as HTMLElement).remove();
    await tick();
    expect(offset(root, "z")).toBe("-50px");
    highlight.destroy();
    expect(offset(root, "z")).toBe("");
    z.removeAttribute("data-ok-highlighted");
    z.setAttribute("data-ok-highlighted", "");
    await tick();
    expect(offset(root, "z")).toBe("");
  });
});

describe("revealOrganizationChartNode", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("scrolls the label into view after the ancestors' animations", async () => {
    const root = mountChart();
    const d = byId(root, "d");
    const target = d.firstElementChild as HTMLElement;
    const scroll = vi.spyOn(target, "scrollIntoView").mockImplementation(() => {});
    const list = organizationChartList(byId(root, "b")) as HTMLElement;
    const animation = list.animate([{ opacity: 0 }, { opacity: 1 }], 10_000);
    const done = revealOrganizationChartNode(d);
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(scroll).not.toHaveBeenCalled();
    animation.finish();
    await done;
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.calls[0]?.[0]).toMatchObject({ block: "nearest", inline: "nearest" });
    // A cancelled animation (an interrupted Collapse) counts as done too.
    const cancelled = list.animate([{ opacity: 0 }, { opacity: 1 }], 10_000);
    const second = revealOrganizationChartNode(d);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await tick();
    cancelled.cancel();
    await second;
    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it("jumps with reduced motion and skips nodes that went away", async () => {
    const root = mountChart();
    const d = byId(root, "d");
    const target = d.firstElementChild as HTMLElement;
    const scroll = vi.spyOn(target, "scrollIntoView").mockImplementation(() => {});
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    await revealOrganizationChartNode(d);
    expect(scroll.mock.calls[0]?.[0]).toMatchObject({ behavior: "auto" });
    const gone = revealOrganizationChartNode(d);
    d.remove();
    await gone;
    expect(scroll).toHaveBeenCalledTimes(1);
  });
});
