import { act, render, screen } from "@testing-library/react";
import { createRef, type MutableRefObject, type ReactNode, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  OrganizationChart,
  type OrganizationChartApi,
  OrganizationChartNode,
  type OrganizationChartProps,
  useOrganizationChartApiRef,
} from "./organization-chart.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;

/** A lead with three people; the middle one has a report. */
function Team(props: Partial<OrganizationChartProps>) {
  return (
    <OrganizationChart aria-label="Team" label={<span>Lead</span>} {...props}>
      <OrganizationChartNode label={<span>First</span>} />
      <OrganizationChartNode label={<span>Middle</span>}>
        <OrganizationChartNode label={<span>Report</span>} />
      </OrganizationChartNode>
      <OrganizationChartNode label={<span>Last</span>} />
    </OrganizationChart>
  );
}

const chart = () => screen.getByRole("list", { name: "Team" });
const nodeOf = (text: string) =>
  screen.getByText(text).closest("[data-ok-organization-chart-node]") as HTMLElement;
const box = (element: Element) => element.getBoundingClientRect();
const pseudo = (element: Element, which: "::before" | "::after") =>
  getComputedStyle(element, which);
/** The divider color as this engine serializes it. */
function divider() {
  const probe = document.createElement("span");
  probe.style.color = "var(--ok-divider)";
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

describe("OrganizationChart", () => {
  it("renders nested lists with explicit style defaults", async () => {
    render(<Team />);
    const root = chart();
    expect(root.tagName).toBe("UL");
    expect({ ...root.dataset }).toEqual({
      okOrganizationChart: "",
      okLineColor: "divider",
      okLineStyle: "solid",
      okRuntime: "off",
    });
    expect(root.getAttribute("style")).toBeNull();
    const top = root.querySelector(":scope > li") as HTMLElement;
    expect(top.hasAttribute("data-ok-organization-chart-node")).toBe(true);
    expect(top.querySelector(":scope > [data-ok-organization-chart-label]")?.textContent).toBe(
      "Lead",
    );
    const children = top.querySelector(":scope > ul[data-ok-organization-chart-children]");
    expect(children?.children).toHaveLength(3);
    // Nodes without children have no children list (no line hangs below them).
    expect(nodeOf("First").querySelector("ul")).toBeNull();
    expect(nodeOf("Middle").querySelectorAll("ul")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    await expectNoAxeViolations();
  });

  it("a chart without children is one node", () => {
    render(
      <OrganizationChart aria-label="Team" label="Alone">
        {null}
        {false}
      </OrganizationChart>,
    );
    expect(chart().querySelector("[data-ok-organization-chart-children]")).toBeNull();
  });

  it("writes every option as attributes and private properties", () => {
    render(
      <Team
        lineHeight={20}
        lineWidth="2px"
        lineColor="primary"
        lineStyle="dashed"
        lineBorderRadius="0.5rem"
        nodePadding={8}
      />,
    );
    const root = chart();
    expect({ ...root.dataset }).toMatchObject({
      okLineHeight: "20",
      okLineWidth: "2px",
      okLineColor: "primary",
      okLineStyle: "dashed",
      okLineBorderRadius: "0.5rem",
      okNodePadding: "8",
    });
    expect(root.style.getPropertyValue("--_ok-org-line-height")).toBe("20px");
    expect(root.style.getPropertyValue("--_ok-org-line-width")).toBe("2px");
    expect(root.style.getPropertyValue("--_ok-org-line-radius")).toBe("0.5rem");
    expect(root.style.getPropertyValue("--_ok-org-node-padding")).toBe("8px");
  });

  it("invalid values fall back to the defaults", () => {
    render(
      <Team
        lineHeight={-1}
        lineWidth={HOSTILE}
        lineColor={HOSTILE}
        lineStyle={HOSTILE}
        lineBorderRadius="calc(1px)"
        nodePadding={Number.POSITIVE_INFINITY}
      />,
    );
    const root = chart();
    expect({ ...root.dataset }).toEqual({
      okOrganizationChart: "",
      okLineColor: "divider",
      okLineStyle: "solid",
      okRuntime: "off",
    });
    expect(root.getAttribute("style")).toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("forwards refs, rest props and style (after the lengths)", () => {
    const chartRef = createRef<HTMLUListElement>();
    const nodeRef = createRef<HTMLLIElement>();
    render(
      <OrganizationChart
        ref={chartRef}
        aria-label="Team"
        label="Lead"
        lineHeight={10}
        id="chart"
        className="extra"
        style={{ color: "rgb(1, 2, 3)", "--_ok-org-line-height": "12px" } as never}
      >
        <OrganizationChartNode ref={nodeRef} label="Child" id="child" className="node" />
      </OrganizationChart>,
    );
    expect(chartRef.current).toBe(chart());
    expect(chart().id).toBe("chart");
    expect(chart().className).toBe("extra");
    expect(chart().style.color).toBe("rgb(1, 2, 3)");
    expect(chart().style.getPropertyValue("--_ok-org-line-height")).toBe("12px");
    expect(nodeRef.current?.id).toBe("child");
    expect(nodeRef.current?.className).toBe("node");
  });

  it("looks like the reference: 40px lines, 1px divider, centered labels, rounded turns", () => {
    render(
      <div style={{ width: 800 }}>
        <Team />
      </div>,
    );
    const root = chart();
    expect(box(root).width).toBe(800);
    const lead = box(screen.getByText("Lead"));
    expect(lead.left + lead.width / 2).toBeCloseTo(400, 0);
    // Two line heights between a label and its children's labels.
    expect(box(screen.getByText("First")).top - lead.bottom).toBeCloseTo(80, 0);
    const children = root.querySelector("[data-ok-organization-chart-children]") as HTMLElement;
    const down = pseudo(children, "::before");
    expect(down.height).toBe("40px");
    expect(down.borderInlineStartWidth).toBe("1px");
    expect(down.borderInlineStartStyle).toBe("solid");
    expect(down.borderInlineStartColor).toBe(divider());
    // First child: only the end half, turning down with a 24px corner.
    expect(pseudo(nodeOf("First"), "::before").borderTopWidth).toBe("0px");
    const firstAfter = pseudo(nodeOf("First"), "::after");
    expect(firstAfter.borderTopWidth).toBe("1px");
    expect(firstAfter.borderLeftWidth).toBe("1px");
    expect(firstAfter.borderTopLeftRadius).toBe("24px");
    // Middle: both halves, straight down.
    expect(pseudo(nodeOf("Middle"), "::before").borderTopWidth).toBe("1px");
    expect(pseudo(nodeOf("Middle"), "::after").borderTopLeftRadius).toBe("0px");
    // Last: the start half turns down; nothing on the end side.
    const lastBefore = pseudo(nodeOf("Last"), "::before");
    expect(lastBefore.borderRightWidth).toBe("1px");
    expect(lastBefore.borderTopRightRadius).toBe("24px");
    const lastAfter = pseudo(nodeOf("Last"), "::after");
    expect(lastAfter.borderTopWidth).toBe("0px");
    expect(lastAfter.borderLeftWidth).toBe("0px");
    // Only child: a straight line, no bar.
    const only = nodeOf("Report");
    expect(pseudo(only, "::before").borderTopWidth).toBe("0px");
    expect(pseudo(only, "::before").borderRightWidth).toBe("0px");
    expect(pseudo(only, "::after").borderTopWidth).toBe("0px");
    expect(pseudo(only, "::after").borderLeftWidth).toBe("1px");
    // Child nodes: the line height above, 4px on each side.
    expect(getComputedStyle(only).padding).toBe("40px 4px 0px");
  });

  it("every vertical line sits on the same pixels as its label's center", () => {
    render(
      <div style={{ width: 800 }}>
        <Team lineWidth={2} />
      </div>,
    );
    // The last child's turn is shifted by the line width onto the other lines' pixels.
    const last = nodeOf("Last");
    const label = box(screen.getByText("Last").parentElement as Element);
    const center = label.left + label.width / 2 - box(last).left;
    const before = pseudo(last, "::before");
    const right = box(last).width - Number.parseFloat(before.right);
    expect(right - 2).toBeCloseTo(center, 0);
    const middle = nodeOf("Middle");
    const middleLabel = box(screen.getByText("Middle").parentElement as Element);
    expect(Number.parseFloat(pseudo(middle, "::after").left)).toBeCloseTo(
      middleLabel.left + middleLabel.width / 2 - box(middle).left,
      0,
    );
  });

  it("applies the line options", () => {
    render(
      <div style={{ width: 800 }}>
        <Team
          lineHeight="1rem"
          lineWidth={3}
          lineColor="warning"
          lineStyle="dotted"
          lineBorderRadius={0}
          nodePadding={10}
        />
      </div>,
    );
    const after = pseudo(nodeOf("First"), "::after");
    expect(after.height).toBe("16px");
    expect(after.borderTopWidth).toBe("3px");
    expect(after.borderTopStyle).toBe("dotted");
    expect(after.borderTopColor).toBe("rgb(255, 214, 102)");
    expect(after.borderTopLeftRadius).toBe("0px");
    expect(getComputedStyle(nodeOf("First")).paddingLeft).toBe("10px");
  });

  it("inherit draws the lines in the chart's text color; dashed lines", () => {
    render(<Team lineColor="inherit" lineStyle="dashed" style={{ color: "rgb(10, 20, 30)" }} />);
    const after = pseudo(nodeOf("Middle"), "::after");
    expect(after.borderLeftColor).toBe("rgb(10, 20, 30)");
    expect(after.borderLeftStyle).toBe("dashed");
  });

  it("palette colors use their light tone", () => {
    const expected = {
      primary: "rgb(91, 228, 155)",
      secondary: "rgb(198, 132, 255)",
      info: "rgb(97, 243, 243)",
      success: "rgb(119, 237, 139)",
      error: "rgb(255, 172, 130)",
    } as const;
    for (const [color, rgb] of Object.entries(expected)) {
      const { unmount } = render(<Team lineColor={color as never} />);
      expect(pseudo(nodeOf("Middle"), "::before").borderTopColor).toBe(rgb);
      unmount();
    }
  });

  it("a chart nested in a label keeps its own defaults", () => {
    render(
      <OrganizationChart aria-label="Outer" label="Outer" lineHeight={8} lineColor="error">
        <OrganizationChartNode
          label={
            <OrganizationChart aria-label="Team" label="Inner">
              <OrganizationChartNode label="Leaf" />
            </OrganizationChart>
          }
        />
      </OrganizationChart>,
    );
    const leaf = pseudo(nodeOf("Leaf"), "::after");
    expect(leaf.height).toBe("40px");
    expect(leaf.borderLeftColor).toBe(divider());
  });

  it("mirrors in right-to-left pages", () => {
    render(
      <div dir="rtl" style={{ width: 800 }}>
        <Team />
      </div>,
    );
    const first = box(screen.getByText("First"));
    const last = box(screen.getByText("Last"));
    expect(first.left).toBeGreaterThan(last.left);
    const after = pseudo(nodeOf("First"), "::after");
    expect(after.borderRightWidth).toBe("1px");
    expect(after.borderTopRightRadius).toBe("24px");
  });

  it("wide charts start at the container's start (a scroll area reaches every node)", () => {
    render(
      <div style={{ width: 120, overflow: "auto" }} data-testid="scroller">
        <Team />
      </div>,
    );
    const scroller = screen.getByTestId("scroller");
    expect(scroller.scrollWidth).toBeGreaterThan(120);
    expect(box(chart()).left).toBe(box(scroller).left);
    expect(box(screen.getByText("First")).left).toBeGreaterThanOrEqual(box(scroller).left);
  });

  it("renders on the server with the client markup, and in StrictMode", () => {
    const markup = renderToString(<Team lineHeight={20} />);
    expect(markup).toContain('data-ok-organization-chart=""');
    expect(markup).toContain("--_ok-org-line-height:20px");
    const server = new DOMParser().parseFromString(markup, "text/html").body
      .firstElementChild as HTMLElement;
    const { container } = render(
      <StrictMode>
        <Team lineHeight={20} />
      </StrictMode>,
    );
    const client = container.firstElementChild as HTMLElement;
    expect(server.style.getPropertyValue("--_ok-org-line-height")).toBe("20px");
    expect(client.style.getPropertyValue("--_ok-org-line-height")).toBe("20px");
    const unstyled = (element: Element) => element.outerHTML.replace(/ style="[^"]*"/, "");
    expect(unstyled(client)).toBe(unstyled(server));
  });
});

// --- Expand and collapse (ADR-0051) ------------------------------------------------------------

/** lead › (a, b › (c › d), lazy (hasChildren)); every node has a `nodeId`. */
function Collapsible(props: Partial<OrganizationChartProps>) {
  return (
    <OrganizationChart
      aria-label="Team"
      enableExpandCollapse
      nodeId="lead"
      toggleLabel="Lead's reports"
      label={<span>Lead</span>}
      {...props}
    >
      <OrganizationChartNode nodeId="a" label={<span>A</span>} />
      <OrganizationChartNode nodeId="b" toggleLabel="B's reports" label={<span>B</span>}>
        <OrganizationChartNode nodeId="c" label={<span>C</span>}>
          <OrganizationChartNode nodeId="d" label={<span>D</span>} />
        </OrganizationChartNode>
      </OrganizationChartNode>
      <OrganizationChartNode nodeId="lazy" hasChildren toggleLabel="Lazy reports" label="Lazy" />
    </OrganizationChart>
  );
}

const node = (id: string) => document.querySelector(`[data-ok-node-id="${id}"]`) as HTMLElement;
const toggleOf = (id: string) =>
  node(id).querySelector(":scope > [data-ok-organization-chart-toggle]") as HTMLButtonElement;
const listOf = (id: string) =>
  node(id).querySelector(":scope > [data-ok-organization-chart-children]") as HTMLElement;
const badgeOf = (id: string) =>
  toggleOf(id).querySelector("[data-ok-organization-chart-badge]")?.textContent;
const click = (element: HTMLElement) => act(() => element.click());
/** Collapse animations run (no reduced motion here): end them once they started. */
async function finish() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  for (const animation of document.getAnimations())
    if (animation.effect?.getComputedTiming().endTime !== Infinity) animation.finish();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

let hookApi: OrganizationChartApi | undefined;
/** A chart with its methods from the hook, and buttons that call them. */
function WithHook({ onApi }: { onApi: (api: OrganizationChartApi | undefined) => void }) {
  const ref = useOrganizationChartApiRef();
  return (
    <>
      <button type="button" onClick={() => ref.current?.collapseAll()}>
        Collapse all
      </button>
      <Collapsible apiRef={ref} collapseBadgeThreshold={2} />
      <button type="button" onClick={() => onApi(ref.current)}>
        Read
      </button>
    </>
  );
}

describe("OrganizationChart expand and collapse", () => {
  it("is off by default: no toggles, the same markup as before", () => {
    const { container } = render(<Collapsible enableExpandCollapse={false} />);
    expect(container.querySelector("[data-ok-organization-chart-toggle]")).toBeNull();
    expect(container.querySelector("[data-ok-collapse]")).toBeNull();
    // A lazy node outside a collapsible chart is a leaf.
    expect(node("lazy").children).toHaveLength(1);
    expect(chart().hasAttribute("data-ok-enable-expand-collapse")).toBe(false);
  });

  it("renders a toggle per branch that controls its Collapse list", () => {
    render(<Collapsible />);
    expect(chart().hasAttribute("data-ok-enable-expand-collapse")).toBe(true);
    const toggle = screen.getByRole("button", { name: "B's reports" });
    expect(toggle).toBe(toggleOf("b"));
    expect(toggle.getAttribute("type")).toBe("button");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-controls")).toBe(listOf("b").id);
    expect(listOf("b").hasAttribute("data-ok-collapse")).toBe(true);
    expect(listOf("b").hidden).toBe(false);
    // Default label; leaves have no toggle.
    expect(toggleOf("c").textContent?.trim()).toBe("Child nodes");
    expect(node("a").querySelector("[data-ok-organization-chart-toggle]")).toBeNull();
    // A lazy node: an empty, hidden list and a spinner.
    expect(toggleOf("lazy").getAttribute("aria-expanded")).toBe("false");
    expect(listOf("lazy").hidden).toBe(true);
    expect(listOf("lazy").childElementCount).toBe(0);
    expect(toggleOf("lazy").querySelector("[data-ok-organization-chart-spinner]")).not.toBeNull();
  });

  it("collapses and expands from the toggle, reports it and shows the hidden count", async () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    const onCollapsedNodesChange = vi.fn();
    render(
      <Collapsible
        onExpand={onExpand}
        onCollapse={onCollapse}
        onCollapsedNodesChange={onCollapsedNodesChange}
      />,
    );
    click(toggleOf("b"));
    await finish();
    expect(onCollapse).toHaveBeenCalledWith("b");
    expect(onCollapsedNodesChange).toHaveBeenLastCalledWith(["b"]);
    expect(listOf("b").hidden).toBe(true);
    expect(toggleOf("b").getAttribute("aria-expanded")).toBe("false");
    expect(badgeOf("b")).toBe("2");
    expect(getComputedStyle(listOf("b")).display).toBe("none");
    expect(screen.getByRole("button", { name: "B's reports 2" })).toBe(toggleOf("b"));
    click(toggleOf("b"));
    await finish();
    expect(onExpand).toHaveBeenCalledWith("b");
    expect(onCollapsedNodesChange).toHaveBeenLastCalledWith([]);
    expect(listOf("b").hidden).toBe(false);
    expect(badgeOf("b")).toBe("");
  });

  it("controlled: collapsedNodes decides; defaultCollapsedNodes starts collapsed", async () => {
    const onCollapsedNodesChange = vi.fn();
    const { rerender } = render(
      <Collapsible collapsedNodes={["c"]} onCollapsedNodesChange={onCollapsedNodesChange} />,
    );
    expect(listOf("c").hidden).toBe(true);
    expect(badgeOf("c")).toBe("1");
    click(toggleOf("c"));
    await finish();
    expect(onCollapsedNodesChange).toHaveBeenCalledWith([]);
    // Refused by the owner: still collapsed.
    expect(listOf("c").hidden).toBe(true);
    rerender(<Collapsible collapsedNodes={[]} />);
    await finish();
    expect(listOf("c").hidden).toBe(false);
    rerender(<Collapsible key="other" defaultCollapsedNodes={["b"]} />);
    expect(listOf("b").hidden).toBe(true);
  });

  it("toggles on label clicks with expandCollapseOnNodeClick, not from content buttons", async () => {
    render(
      <Collapsible
        expandCollapseOnNodeClick
        collapseBadgeThreshold={3}
        label={
          <span>
            Lead <button type="button">Edit</button>
          </span>
        }
      />,
    );
    expect(chart().hasAttribute("data-ok-expand-collapse-on-node-click")).toBe(true);
    expect(chart().getAttribute("data-ok-collapse-badge-threshold")).toBe("3");
    click(screen.getByText("B"));
    await finish();
    expect(listOf("b").hidden).toBe(true);
    // Two hidden: under the threshold of 3.
    expect(badgeOf("b")).toBe("");
    click(screen.getByRole("button", { name: "Edit" }));
    await finish();
    expect(listOf("lead").hidden).toBe(false);
    click(screen.getByText("Lead"));
    await finish();
    expect(listOf("lead").hidden).toBe(true);
    expect(badgeOf("lead")).toBe("5");
  });

  it("collapseBadgeEnabled={false} renders no badge", () => {
    render(<Collapsible collapseBadgeEnabled={false} defaultCollapsedNodes={["b"]} />);
    expect(toggleOf("b").querySelector("[data-ok-organization-chart-badge]")).toBeNull();
  });

  it("loads lazy children on the first expand: busy, then rendered and expanded", async () => {
    let resolve: (nodes: ReactNode) => void = () => undefined;
    const loadChildren = vi.fn(
      () =>
        new Promise<ReactNode>((done) => {
          resolve = done;
        }),
    );
    render(<Collapsible loadChildren={loadChildren} />);
    click(toggleOf("lazy"));
    await finish();
    expect(loadChildren).toHaveBeenCalledWith({ id: "lazy" });
    expect(toggleOf("lazy").getAttribute("aria-busy")).toBe("true");
    click(toggleOf("lazy"));
    await finish();
    expect(loadChildren).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve([
        <OrganizationChartNode key="x" nodeId="x" label="X" />,
        <OrganizationChartNode key="y" nodeId="y" label="Y">
          <OrganizationChartNode nodeId="z" label="Z" />
        </OrganizationChartNode>,
      ]);
    });
    await finish();
    expect(toggleOf("lazy").hasAttribute("aria-busy")).toBe(false);
    expect(listOf("lazy").hidden).toBe(false);
    expect(listOf("lazy").childElementCount).toBe(2);
    expect(toggleOf("lazy").querySelector("[data-ok-organization-chart-spinner]")).toBeNull();
    // Loaded nodes are collapsible too.
    expect(toggleOf("y")).not.toBeNull();
    click(toggleOf("lazy"));
    await finish();
    expect(badgeOf("lazy")).toBe("3");
    click(toggleOf("lazy"));
    await finish();
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it("lazy: a rejection keeps it collapsed and retryable; no nodes make it a leaf", async () => {
    const loadChildren = vi
      .fn<(node: { id: string }) => Promise<ReactNode>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([]);
    const apiRef = createRef<OrganizationChartApi>() as MutableRefObject<
      OrganizationChartApi | undefined
    >;
    render(<Collapsible loadChildren={loadChildren} apiRef={apiRef} />);
    click(toggleOf("lazy"));
    await finish();
    expect(listOf("lazy").hidden).toBe(true);
    expect(toggleOf("lazy").hasAttribute("aria-busy")).toBe(false);
    await act(() => apiRef.current?.expand("lazy") as Promise<void>);
    await finish();
    expect(loadChildren).toHaveBeenCalledTimes(2);
    expect(node("lazy").children).toHaveLength(1);
  });

  it("a lazy node without loadChildren stays collapsed", async () => {
    render(<Collapsible />);
    click(toggleOf("lazy"));
    await finish();
    expect(listOf("lazy").hidden).toBe(true);
  });

  it("apiRef: batch methods, subtrees, expand and collapse, without callbacks", async () => {
    const apiRef = createRef<OrganizationChartApi>() as MutableRefObject<
      OrganizationChartApi | undefined
    >;
    const onCollapse = vi.fn();
    const { unmount } = render(<Collapsible apiRef={apiRef} onCollapse={onCollapse} />);
    const api = apiRef.current as OrganizationChartApi;
    act(() => api.collapseAll());
    await finish();
    for (const id of ["lead", "b", "c", "lazy"]) expect(api.isExpanded(id)).toBe(false);
    expect(listOf("lead").hidden).toBe(true);
    act(() => api.expandToDepth(1));
    await finish();
    expect(api.isExpanded("lead")).toBe(true);
    expect(api.isExpanded("b")).toBe(false);
    act(() => api.expandSubtree("b"));
    await finish();
    expect(api.isExpanded("c")).toBe(true);
    act(() => api.collapseSubtree("b"));
    await finish();
    expect(api.isExpanded("b")).toBe(false);
    expect(api.isExpanded("c")).toBe(false);
    act(() => api.expandAll());
    await finish();
    for (const id of ["lead", "b", "c"]) expect(api.isExpanded(id)).toBe(true);
    expect(api.isExpanded("lazy")).toBe(false);
    act(() => api.collapse("c"));
    // Collapsing it again changes nothing.
    act(() => api.collapse("c"));
    await finish();
    expect(listOf("c").hidden).toBe(true);
    await act(() => api.expand("c"));
    await finish();
    expect(listOf("c").hidden).toBe(false);
    // Unknown ids and leaves do nothing.
    act(() => {
      api.collapse("nobody");
      api.collapse("a");
      api.expandSubtree("nobody");
      api.collapseSubtree("nobody");
    });
    expect(api.isExpanded("nobody")).toBe(false);
    expect(onCollapse).not.toHaveBeenCalled();
    unmount();
    expect(apiRef.current).toBeUndefined();
  });

  it("useOrganizationChartApiRef gives a ref for apiRef", async () => {
    render(<WithHook onApi={(value) => (hookApi = value)} />);
    click(screen.getByRole("button", { name: "Collapse all" }));
    await finish();
    expect(listOf("lead").hidden).toBe(true);
    // c hides one node: under the threshold of 2.
    expect(badgeOf("c")).toBe("");
    expect(badgeOf("lead")).toBe("5");
    click(screen.getByRole("button", { name: "Read" }));
    const api = hookApi as OrganizationChartApi | undefined;
    expect(api?.isExpanded("lead")).toBe(false);
    await act(() => (api as OrganizationChartApi).expand("a"));
    await act(() => (api as OrganizationChartApi).expand("nobody"));
  });

  it("nodes without nodeId toggle too", async () => {
    render(
      <OrganizationChart aria-label="Team" enableExpandCollapse label="Lead">
        <OrganizationChartNode label="B">
          <OrganizationChartNode label="C" />
        </OrganizationChartNode>
      </OrganizationChart>,
    );
    const toggle = screen.getAllByRole("button", { name: "Child nodes" })[1] as HTMLButtonElement;
    click(toggle);
    await finish();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("has no axe violations while collapsed and loading", async () => {
    render(
      <Collapsible
        defaultCollapsedNodes={["b"]}
        loadChildren={() => new Promise<ReactNode>(() => undefined)}
      />,
    );
    click(toggleOf("lazy"));
    await finish();
    expect(toggleOf("lazy").getAttribute("aria-busy")).toBe("true");
    await expectNoAxeViolations(document.body);
  });

  it("renders the same markup on the server", () => {
    const markup = renderToString(<Collapsible defaultCollapsedNodes={["b"]} />);
    expect(markup).toContain('data-ok-enable-expand-collapse=""');
    expect(markup).toContain('aria-expanded="false"');
    const { container } = render(
      <StrictMode>
        <Collapsible defaultCollapsedNodes={["b"]} />
      </StrictMode>,
    );
    // The badge's count is written after mount; ids differ between renders.
    const plain = (html: string) =>
      html
        .replace(/ style="[^"]*"/g, "")
        .replace(/ (id|aria-controls)="[^"]*"/g, "")
        .replace(/(<span data-ok-organization-chart-badge="">)[^<]*/g, "$1");
    const server = new DOMParser().parseFromString(markup, "text/html").body
      .firstElementChild as HTMLElement;
    expect(plain((container.firstElementChild as HTMLElement).outerHTML)).toBe(
      plain(server.outerHTML),
    );
  });
});
