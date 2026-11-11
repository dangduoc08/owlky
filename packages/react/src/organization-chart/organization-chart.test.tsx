import { act, render, screen } from "@testing-library/react";
import { createRef, type MutableRefObject, type ReactNode, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, parkPointer, settled } from "../test-utils.js";
import {
  OrganizationChart,
  type OrganizationChartApi,
  OrganizationChartNode,
  type OrganizationChartProps,
  OrganizationChartToolbar,
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

// --- Direction (ADR-0052) -----------------------------------------------------------------------

/**
 * Lines that miss their labels: each visible children list's line from its parent and each
 * child's line to its label sit on that label's center, across the bar's axis.
 */
function connectorMisses(root: Element, vertical: boolean): string[] {
  const misses: string[] = [];
  const center = (element: Element, across = vertical) => {
    const rect = (element.firstElementChild ?? element).getBoundingClientRect();
    return across ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
  };
  /** Centers of the lines a pseudo-element draws toward a label. */
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
      misses.push(`line from ${label.textContent}`);
    // Grouped leaves (a grid parent): each stub meets its label's center on the other axis.
    const across = getComputedStyle(parent).display === "grid" ? !vertical : vertical;
    for (const child of list.children) {
      const own = child.querySelector(":scope > [data-ok-organization-chart-label]") as Element;
      const drawn = [...lines(child, "::before", across), ...lines(child, "::after", across)];
      if (!near(drawn, center(own, across))) misses.push(`line to ${own.textContent}`);
    }
  }
  return misses;
}

/** Lead › Middle (own lines) › Report › Deep. */
function Branch(props: Partial<OrganizationChartProps>) {
  return (
    <OrganizationChart aria-label="Team" label={<span>Lead</span>} {...props}>
      <OrganizationChartNode label={<span>First</span>} />
      <OrganizationChartNode
        lineColor="error"
        lineStyle="dashed"
        label={<span>Middle</span>}
        data-testid="middle"
      >
        <OrganizationChartNode label={<span>Report</span>}>
          <OrganizationChartNode label={<span>Deep</span>} />
        </OrganizationChartNode>
      </OrganizationChartNode>
    </OrganizationChart>
  );
}

describe("OrganizationChart per-node lines", () => {
  const stem = (text: string) =>
    pseudo(
      nodeOf(text).querySelector(":scope > [data-ok-organization-chart-children]") as Element,
      "::before",
    );
  function error() {
    const probe = document.createElement("span");
    probe.style.color = "var(--ok-palette-error-light)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }

  it("writes valid node options only, and edgeColorMode only when given", () => {
    const { unmount } = render(<Branch />);
    expect(chart().hasAttribute("data-ok-edge-color-mode")).toBe(false);
    const middle = screen.getByTestId("middle");
    expect(middle.getAttribute("data-ok-line-color")).toBe("error");
    expect(middle.getAttribute("data-ok-line-style")).toBe("dashed");
    expect(nodeOf("First").hasAttribute("data-ok-line-color")).toBe(false);
    unmount();
    render(
      <OrganizationChart aria-label="Team" edgeColorMode={HOSTILE} label="Lead">
        <OrganizationChartNode lineColor={HOSTILE} lineStyle={HOSTILE} label="Only" />
      </OrganizationChart>,
    );
    expect(chart().hasAttribute("data-ok-edge-color-mode")).toBe(false);
    expect(nodeOf("Only").getAttributeNames()).toEqual(["data-ok-organization-chart-node"]);
  });

  it("a node's lines go to its children; edgeColorMode node carries them down the branch", async () => {
    const { rerender } = render(<Branch />);
    expect(stem("Lead").borderLeftColor).toBe(divider());
    expect(stem("Middle").borderLeftColor).toBe(error());
    expect(stem("Middle").borderLeftStyle).toBe("dashed");
    expect(stem("Report").borderLeftColor).toBe(divider());
    rerender(<Branch edgeColorMode="node" />);
    expect(chart().getAttribute("data-ok-edge-color-mode")).toBe("node");
    expect(stem("Report").borderLeftColor).toBe(error());
    expect(stem("Report").borderLeftStyle).toBe("dashed");
    expect(pseudo(nodeOf("Deep"), "::after").borderLeftColor).toBe(error());
    await expectNoAxeViolations();
  });
});

/** A lead with two leaves and one branch with three leaves. */
function Leaves(props: Partial<OrganizationChartProps>) {
  return (
    <OrganizationChart
      aria-label="Team"
      groupLeafNodes
      nodeId="lead"
      label={<span>Lead</span>}
      {...props}
    >
      <OrganizationChartNode nodeId="first" label={<span>First</span>} />
      <OrganizationChartNode nodeId="middle" label={<span>Middle</span>}>
        <OrganizationChartNode nodeId="a" label={<span>Report A</span>} />
        <OrganizationChartNode nodeId="b" label={<span>Report B</span>} />
        <OrganizationChartNode nodeId="c" label={<span>Report C</span>} />
      </OrganizationChartNode>
    </OrganizationChart>
  );
}

describe("OrganizationChart grouped leaves", () => {
  const top = (text: string) => box(screen.getByText(text)).top;

  it("is off by default; writes the flag and the spacing", () => {
    const { rerender } = render(<Team />);
    expect(chart().hasAttribute("data-ok-group-leaf-nodes")).toBe(false);
    rerender(<Leaves groupLeafNodesSpacing={12} />);
    expect(chart().hasAttribute("data-ok-group-leaf-nodes")).toBe(true);
    expect(chart().getAttribute("data-ok-group-leaf-nodes-spacing")).toBe("12");
    expect(chart().style.getPropertyValue("--_ok-org-leaf-spacing")).toBe("12px");
  });

  it("stacks two or more leaves in one column; mixed children stay a row", async () => {
    render(<Leaves />);
    expect(getComputedStyle(nodeOf("Middle")).display).toBe("grid");
    expect(getComputedStyle(nodeOf("Lead")).display).toBe("flex");
    const [a, b, c] = ["Report A", "Report B", "Report C"].map((text) =>
      box(screen.getByText(text)),
    );
    expect(Math.abs((a as DOMRect).left - (b as DOMRect).left)).toBeLessThan(1);
    expect((b as DOMRect).top).toBeGreaterThan((a as DOMRect).bottom);
    expect((c as DOMRect).top).toBeGreaterThan((b as DOMRect).bottom);
    // The column starts on the lead's center: its line runs straight down from the label.
    const middle = box(nodeOf("Middle").firstElementChild as Element);
    const column = box(
      nodeOf("Middle").querySelector(":scope > [data-ok-organization-chart-children]") as Element,
    );
    expect(Math.abs(column.left - (middle.left + middle.width / 2))).toBeLessThan(1);
    expect(connectorMisses(chart(), true)).toEqual([]);
    await expectNoAxeViolations();
  });

  it("works in every direction", () => {
    for (const direction of ["bottom", "left", "right"] as const) {
      const { unmount } = render(<Leaves direction={direction} />);
      expect(connectorMisses(chart(), direction === "bottom")).toEqual([]);
      if (direction === "bottom") expect(top("Report B")).toBeLessThan(top("Report A"));
      else expect(Math.abs(top("Report B") - top("Report A"))).toBeLessThan(1);
      unmount();
    }
  });

  it("collapsible and lazy branches are branches, not leaves", async () => {
    render(
      <Leaves enableExpandCollapse defaultCollapsedNodes={["middle"]}>
        <OrganizationChartNode nodeId="first" label={<span>First</span>} />
        <OrganizationChartNode nodeId="lazy" hasChildren label={<span>Lazy</span>} />
      </Leaves>,
    );
    // The lazy node has an (empty, hidden) children list: the lead's children aren't grouped.
    expect(getComputedStyle(nodeOf("Lead")).display).toBe("flex");
    await expectNoAxeViolations();
  });

  it("a collapsed group opens as a column", async () => {
    render(<Leaves enableExpandCollapse defaultCollapsedNodes={["middle"]} />);
    const toggle = nodeOf("Middle").querySelector(
      ":scope > [data-ok-organization-chart-toggle]",
    ) as HTMLButtonElement;
    await userEvent.click(toggle);
    for (const animation of document.getAnimations()) animation.finish();
    await settled(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(getComputedStyle(nodeOf("Middle")).display).toBe("grid");
    expect(connectorMisses(chart(), true)).toEqual([]);
  });

  it("the highlighted path runs along the column", async () => {
    const apiRef = createRef<OrganizationChartApi>() as MutableRefObject<
      OrganizationChartApi | undefined
    >;
    render(<Leaves apiRef={apiRef} />);
    await act(() => apiRef.current?.highlightNode("c"));
    const c = nodeOf("Report C");
    expect(c.style.getPropertyValue("--_ok-org-path-round")).toBe("1");
    const offset = Number.parseFloat(c.style.getPropertyValue("--_ok-org-path-offset"));
    const a = nodeOf("Report A");
    expect(offset).toBeCloseTo(box(c).top - box(a).top, 0);
    const segment = pseudo(c.firstElementChild as Element, "::before");
    expect(Math.abs(box(c).top + Number.parseFloat(segment.top) - box(a).top)).toBeLessThan(1);
  });
});

describe("OrganizationChart direction", () => {
  const labelBox = (text: string) => box(screen.getByText(text));

  it("is top by default: no attribute, the same markup as before", () => {
    render(<Team />);
    expect(chart().hasAttribute("data-ok-direction")).toBe(false);
    expect(connectorMisses(chart(), true)).toEqual([]);
  });

  it("writes valid directions only", () => {
    const { unmount } = render(<Team direction="top" />);
    expect(chart().getAttribute("data-ok-direction")).toBe("top");
    unmount();
    render(<Team direction={HOSTILE} />);
    expect(chart().hasAttribute("data-ok-direction")).toBe(false);
  });

  it("bottom: children above their parent, lines on the labels' centers", () => {
    render(
      <div style={{ width: 800 }}>
        <Team direction="bottom" />
      </div>,
    );
    expect(chart().getAttribute("data-ok-direction")).toBe("bottom");
    expect(labelBox("Middle").bottom).toBeLessThan(labelBox("Lead").top);
    expect(labelBox("Report").bottom).toBeLessThan(labelBox("Middle").top);
    // Siblings keep their order.
    expect(labelBox("First").left).toBeLessThan(labelBox("Last").left);
    expect(connectorMisses(chart(), true)).toEqual([]);
    const first = pseudo(nodeOf("First"), "::after");
    expect(first.borderBottomWidth).toBe("1px");
    expect(first.borderTopWidth).toBe("0px");
    expect(first.borderBottomLeftRadius).toBe("24px");
  });

  it("left: children at the inline end, a vertical bar between siblings", () => {
    render(
      <div style={{ width: 800 }}>
        <Team direction="left" />
      </div>,
    );
    expect(labelBox("Middle").left).toBeGreaterThan(labelBox("Lead").right);
    expect(labelBox("Report").left).toBeGreaterThan(labelBox("Middle").right);
    expect(labelBox("First").top).toBeLessThan(labelBox("Last").top);
    expect(connectorMisses(chart(), false)).toEqual([]);
    const first = pseudo(nodeOf("First"), "::after");
    expect(first.borderTopLeftRadius).toBe("24px");
    expect(first.width).toBe("40px");
    expect(getComputedStyle(nodeOf("First")).padding).toBe("4px 0px 4px 40px");
  });

  it("right: children at the inline start", () => {
    render(
      <div style={{ width: 800 }}>
        <Team direction="right" lineWidth={2} />
      </div>,
    );
    expect(labelBox("Middle").right).toBeLessThan(labelBox("Lead").left);
    expect(labelBox("Report").right).toBeLessThan(labelBox("Middle").left);
    expect(connectorMisses(chart(), false)).toEqual([]);
    expect(pseudo(nodeOf("First"), "::after").borderTopRightRadius).toBe("24px");
    expect(pseudo(nodeOf("Last"), "::before").borderBottomRightRadius).toBe("24px");
  });

  it("left mirrors in right-to-left pages: the root on the right", () => {
    render(
      <div dir="rtl" style={{ width: 800 }}>
        <Team direction="left" />
      </div>,
    );
    expect(labelBox("Middle").right).toBeLessThan(labelBox("Lead").left);
    expect(connectorMisses(chart(), false)).toEqual([]);
    expect(pseudo(nodeOf("First"), "::after").borderTopRightRadius).toBe("24px");
  });

  it("keeps the tree's reading and focus order in every direction", () => {
    for (const direction of ["bottom", "left", "right"] as const) {
      const { unmount } = render(<Collapsible direction={direction} />);
      const order = [...chart().querySelectorAll("button")].map(
        (button) => button.querySelector("[data-ok-organization-chart-toggle-label]")?.textContent,
      );
      expect(order).toEqual(["Lead's reports", "B's reports", "Child nodes", "Lazy reports"]);
      unmount();
    }
  });

  it("toggles straddle the edge that faces the children; the chevron points at them", () => {
    const turn = (id: string) =>
      getComputedStyle(
        toggleOf(id).querySelector("[data-ok-organization-chart-toggle-icon]") as Element,
      ).rotate;
    const cases = [
      ["bottom", "180deg", "360deg"],
      ["left", "-90deg", "90deg"],
      ["right", "90deg", "270deg"],
    ] as const;
    for (const [direction, collapsed, expanded] of cases) {
      const { unmount } = render(
        <div style={{ width: 900 }}>
          <Collapsible direction={direction} defaultCollapsedNodes={["b"]} />
        </div>,
      );
      expect(turn("b")).toBe(collapsed);
      expect(turn("lead")).toBe(expanded);
      const label = box(node("b").firstElementChild as Element);
      const toggle = box(toggleOf("b"));
      const half = toggle.height / 2;
      if (direction === "bottom") expect(toggle.top + half).toBeCloseTo(label.top, 0);
      if (direction === "left") expect(toggle.left + half).toBeCloseTo(label.right, 0);
      if (direction === "right") expect(toggle.right - half).toBeCloseTo(label.left, 0);
      expect(connectorMisses(chart(), direction === "bottom")).toEqual([]);
      unmount();
    }
    // Right to left: horizontal chevrons turn the other way.
    render(
      <div dir="rtl">
        <Collapsible direction="left" defaultCollapsedNodes={["b"]} />
      </div>,
    );
    expect(turn("b")).toBe("90deg");
  });

  it("has no axe violations in every direction", async () => {
    for (const direction of ["bottom", "left", "right"] as const) {
      const { unmount } = render(
        <Collapsible direction={direction} defaultCollapsedNodes={["b"]} />,
      );
      await expectNoAxeViolations(document.body);
      unmount();
    }
  });
});

// --- Lineage highlight and search -------------------------------------------------------------

describe("OrganizationChart highlight", () => {
  const opacity = (id: string) => getComputedStyle(node(id).firstElementChild as Element).opacity;
  const segment = (id: string) =>
    getComputedStyle(node(id).firstElementChild as Element, "::before");
  /** Waits for the labels' opacity transitions. */
  const still = () =>
    Promise.all(
      [...document.querySelectorAll("[data-ok-organization-chart-label]")].map((label) =>
        settled(label),
      ),
    );

  it("writes the options as attributes and the dim strength as a private property", () => {
    render(<Collapsible highlightOnHover dimOpacity={0.4} />);
    expect(chart().hasAttribute("data-ok-highlight-on-hover")).toBe(true);
    expect(chart().getAttribute("data-ok-dim-opacity")).toBe("0.4");
    expect(chart().style.getPropertyValue("--_ok-org-dim-opacity")).toBe("0.4");
  });

  it("is off by default: hovering changes nothing", async () => {
    render(<Collapsible />);
    await userEvent.hover(screen.getByText("D"));
    await still();
    expect(opacity("a")).toBe("1");
    expect(segment("d").content).toBe("none");
  });

  it("hovering a node keeps its path to the root and fades the rest", async () => {
    render(
      <div style={{ width: 800 }}>
        <Collapsible highlightOnHover dimOpacity={0.5} />
      </div>,
    );
    await userEvent.hover(screen.getByText("D"));
    await still();
    expect(opacity("a")).toBe("0.5");
    expect(opacity("lazy")).toBe("0.5");
    for (const id of ["lead", "b", "c", "d"]) expect(opacity(id)).toBe("1");
    expect(getComputedStyle(toggleOf("b")).opacity).toBe("1");
    expect(getComputedStyle(toggleOf("lazy")).opacity).toBe("0.5");
    // B's segment runs from its label's line to the lead's line, in the highlight color.
    const b = segment("b");
    expect(b.content).not.toBe("none");
    const highlight = getComputedStyle(listOf("lead"), "::before").borderLeftColor;
    expect(b.borderTopColor).toBe(highlight);
    expect(highlight).not.toBe(divider());
    const segmentEnd = box(node("b")).left + Number.parseFloat(b.left) + Number.parseFloat(b.width);
    const stem =
      box(listOf("lead")).left +
      Number.parseFloat(getComputedStyle(listOf("lead"), "::before").left);
    expect(Math.abs(segmentEnd - (stem + 1))).toBeLessThan(1.5);
    expect(segment("a").content).toBe("none");
    await parkPointer();
    await still();
    expect(opacity("a")).toBe("1");
  });

  it("highlightNode opens the collapsed ancestors, marks the node and reports it", async () => {
    const onHighlightedNodeChange = vi.fn();
    const onExpand = vi.fn();
    const apiRef: MutableRefObject<OrganizationChartApi | undefined> = { current: undefined };
    render(
      <Collapsible
        apiRef={apiRef}
        defaultCollapsedNodes={["b", "c"]}
        onExpand={onExpand}
        onHighlightedNodeChange={onHighlightedNodeChange}
      />,
    );
    expect(listOf("b").hidden).toBe(true);
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    await act(async () => {
      await apiRef.current?.highlightNode("d");
    });
    await finish();
    expect(listOf("b").hidden).toBe(false);
    expect(listOf("c").hidden).toBe(false);
    expect(node("d").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(onHighlightedNodeChange).toHaveBeenCalledWith("d");
    expect(onExpand).not.toHaveBeenCalled();
    expect(apiRef.current?.getHighlightedNode()).toBe("d");
    expect(scroll).toHaveBeenCalled();
    await still();
    // A search result fades nothing (contrast); its path turns the highlight color.
    expect(opacity("a")).toBe("1");
    expect(getComputedStyle(listOf("c"), "::before").borderLeftColor).not.toBe(divider());
    expect(getComputedStyle(listOf("lead"), "::before").borderLeftColor).toBe(
      getComputedStyle(listOf("c"), "::before").borderLeftColor,
    );
    expect(getComputedStyle(node("d").firstElementChild as Element).outlineStyle).toBe("solid");
    // Another node replaces it; unknown ids change nothing.
    await act(async () => {
      await apiRef.current?.highlightNode("a");
      await apiRef.current?.highlightNode("nobody");
    });
    expect(node("d").hasAttribute("data-ok-highlighted")).toBe(false);
    expect(node("a").hasAttribute("data-ok-highlighted")).toBe(true);
    act(() => apiRef.current?.clearHighlight());
    expect(document.querySelector("[data-ok-highlighted]")).toBeNull();
    expect(onHighlightedNodeChange).toHaveBeenLastCalledWith(null);
    expect(apiRef.current?.getHighlightedNode()).toBeNull();
    scroll.mockRestore();
  });

  it("controlled: highlightedNode decides; works without expand and collapse", async () => {
    const { rerender } = render(<Team highlightedNode={null} />);
    expect(document.querySelector("[data-ok-highlighted]")).toBeNull();
    const ids = (highlightedNode: string | null) => (
      <OrganizationChart aria-label="Team" label="Lead" highlightedNode={highlightedNode}>
        <OrganizationChartNode nodeId="one" label="One" />
        <OrganizationChartNode nodeId="two" label="Two" />
      </OrganizationChart>
    );
    rerender(ids("two"));
    expect(node("two").hasAttribute("data-ok-highlighted")).toBe(true);
    await still();
    expect(getComputedStyle(node("one").firstElementChild as Element).opacity).toBe("1");
    rerender(ids(null));
    expect(document.querySelector("[data-ok-highlighted]")).toBeNull();
  });

  it("highlightNode works on charts without expand and collapse; repeats report once", async () => {
    const onHighlightedNodeChange = vi.fn();
    const apiRef: MutableRefObject<OrganizationChartApi | undefined> = { current: undefined };
    render(
      <OrganizationChart
        aria-label="Team"
        label="Lead"
        apiRef={apiRef}
        onHighlightedNodeChange={onHighlightedNodeChange}
      >
        <OrganizationChartNode nodeId="one" label="One">
          <OrganizationChartNode nodeId="two" label="Two" />
        </OrganizationChartNode>
      </OrganizationChart>,
    );
    await act(async () => {
      await apiRef.current?.highlightNode("two");
    });
    await act(async () => {
      await apiRef.current?.highlightNode("two");
    });
    expect(node("two").hasAttribute("data-ok-highlighted")).toBe(true);
    expect(onHighlightedNodeChange).toHaveBeenCalledTimes(1);
    act(() => apiRef.current?.clearHighlight());
    act(() => apiRef.current?.clearHighlight());
    expect(onHighlightedNodeChange).toHaveBeenCalledTimes(2);
  });

  it("hover wins over a highlighted node", async () => {
    render(<Collapsible highlightOnHover defaultHighlightedNode="d" />);
    await still();
    expect(opacity("a")).toBe("1");
    await userEvent.hover(screen.getByText("A"));
    await still();
    expect(opacity("a")).toBe("1");
    expect(opacity("d")).toBe("0.3");
    await parkPointer();
  });

  it("has no axe violations with a highlighted node", async () => {
    render(<Collapsible highlightOnHover defaultHighlightedNode="c" />);
    await expectNoAxeViolations(document.body);
  });
});

/** A zoomable chart in a 300 × 200 scroll area, with its toolbar. */
function Zoomable(props: Partial<OrganizationChartProps>) {
  return (
    <>
      <OrganizationChartToolbar chartId="zoom-chart" />
      <section
        data-ok-scrollbar=""
        aria-label="Area"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll area takes the keyboard
        tabIndex={0}
        style={{ width: 300, height: 200, overflow: "auto" }}
      >
        <OrganizationChart
          id="zoom-chart"
          aria-label="Team"
          enableZoomPan
          label={<span style={{ display: "block", width: 500 }}>Lead</span>}
          {...props}
        >
          <OrganizationChartNode nodeId="first" label={<span>First</span>} />
          <OrganizationChartNode nodeId="last" label={<span>Last</span>} />
        </OrganizationChart>
      </section>
    </>
  );
}

describe("OrganizationChart zoom and pan", () => {
  const zoomValue = () => document.querySelector("[data-ok-organization-chart-zoom-value]");

  it("is off by default: no zoom attribute, the same markup as before", () => {
    render(<Team />);
    expect(chart().hasAttribute("data-ok-zoom")).toBe(false);
    expect(chart().hasAttribute("data-ok-enable-zoom-pan")).toBe(false);
    expect(chart().style.getPropertyValue("--_ok-org-zoom")).toBe("");
  });

  it("writes the level while zoom and pan is on, or when it isn't 100%", () => {
    const { rerender } = render(<Team zoom={1.5} />);
    expect(chart().getAttribute("data-ok-zoom")).toBe("1.5");
    expect(getComputedStyle(chart()).zoom).toBe("1.5");
    rerender(<Team zoom={5} maxZoom={3} minZoom={0.5} />);
    expect(chart().getAttribute("data-ok-zoom")).toBe("3");
    expect(chart().getAttribute("data-ok-max-zoom")).toBe("3");
    rerender(<Team enableZoomPan />);
    expect(chart().getAttribute("data-ok-zoom")).toBe("1");
  });

  it("the toolbar zooms, reports the level and shows it; the limits are aria-disabled", async () => {
    const onZoomChange = vi.fn();
    render(<Zoomable onZoomChange={onZoomChange} maxZoom={1.25} />);
    expect(zoomValue()?.textContent).toBe("100%");
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    await userEvent.click(zoomIn);
    expect(onZoomChange).toHaveBeenLastCalledWith(1.25);
    expect(chart().getAttribute("data-ok-zoom")).toBe("1.25");
    expect(zoomValue()?.textContent).toBe("125%");
    expect(zoomIn.getAttribute("aria-disabled")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(onZoomChange).toHaveBeenLastCalledWith(1);
    await userEvent.click(screen.getByRole("button", { name: "Fit to screen" }));
    expect(onZoomChange.mock.lastCall?.[0]).toBeLessThan(1);
    await userEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(onZoomChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("group", { name: "Zoom" })).toBeTruthy();
    await expectNoAxeViolations();
  });

  it("controlled: zoom decides; keys ask through onZoomChange", async () => {
    const onZoomChange = vi.fn();
    render(<Zoomable zoom={1} onZoomChange={onZoomChange} />);
    const area = screen.getByRole("region", { name: "Area" });
    area.focus();
    await userEvent.keyboard("+");
    expect(onZoomChange).toHaveBeenLastCalledWith(1.25);
    expect(chart().getAttribute("data-ok-zoom")).toBe("1");
  });

  it("apiRef: zoom steps, factor, set, reset, fit and center", async () => {
    const apiRef = createRef<OrganizationChartApi>() as MutableRefObject<
      OrganizationChartApi | undefined
    >;
    const onZoomChange = vi.fn();
    render(<Zoomable apiRef={apiRef} onZoomChange={onZoomChange} />);
    const api = () => apiRef.current as OrganizationChartApi;
    act(() => api().zoomIn());
    expect(api().getZoom()).toBe(1.25);
    act(() => api().zoomOut());
    expect(api().getZoom()).toBe(1);
    act(() => api().zoom(1));
    expect(api().getZoom()).toBe(2);
    act(() => api().setZoom(0.1));
    expect(api().getZoom()).toBe(0.25);
    act(() => api().resetZoom());
    expect(api().getZoom()).toBe(1);
    act(() => api().fitScreen());
    expect(api().getZoom()).toBeLessThan(1);
    expect(onZoomChange).toHaveBeenCalledTimes(6);
    await act(() => api().centerOnNode("last"));
    await act(() => api().centerOnNode("nobody"));
  });

  it("centerOnNode opens collapsed ancestors first", async () => {
    const apiRef = createRef<OrganizationChartApi>() as MutableRefObject<
      OrganizationChartApi | undefined
    >;
    render(
      <Leaves
        apiRef={apiRef}
        enableExpandCollapse
        enableZoomPan
        defaultCollapsedNodes={["middle"]}
      />,
    );
    await act(() => apiRef.current?.centerOnNode("b"));
    const toggle = nodeOf("Middle").querySelector(
      ":scope > [data-ok-organization-chart-toggle]",
    ) as Element;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("renders the toolbar and the zoom attributes on the server as on the client", () => {
    const html = renderToString(<Zoomable />);
    expect(html).toContain('data-ok-organization-chart-toolbar="zoom-chart"');
    expect(html).toContain('data-ok-zoom="1"');
    expect(html).toContain("data-ok-enable-zoom-pan");
  });
});

// --- Tree, selection, keyboard and breadcrumb (ADR-0063) ---------------------------------------

describe("OrganizationChart tree, selection and keyboard", () => {
  /** MutationObserver callbacks run on a microtask; React state flushes in act(). */
  const flush = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  const keyOn = (element: HTMLElement, key: string) =>
    act(() => {
      element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    });

  it("is off by default: lists, no roles, no tab stops, the same markup as before", () => {
    const before = renderToString(<Collapsible />);
    render(<Collapsible />);
    expect(chart().hasAttribute("role")).toBe(false);
    expect(node("a").hasAttribute("tabindex")).toBe(false);
    expect(before).not.toContain("data-ok-enable-selection");
    expect(before).not.toContain("data-ok-enable-keyboard-navigation");
    expect(before).not.toContain("data-ok-selected");
  });

  it("enableKeyboardNavigation makes a tree with one tab stop; arrows walk and toggle", async () => {
    const onCollapse = vi.fn();
    render(<Collapsible enableKeyboardNavigation onCollapse={onCollapse} />);
    await flush();
    const tree = screen.getByRole("tree", { name: "Team" });
    expect(tree.hasAttribute("data-ok-enable-keyboard-navigation")).toBe(true);
    expect(screen.getAllByRole("treeitem").length).toBeGreaterThanOrEqual(5);
    expect(node("lead").getAttribute("tabindex")).toBe("0");
    expect(toggleOf("b").getAttribute("tabindex")).toBe("-1");
    expect(node("a").hasAttribute("aria-selected")).toBe(false);
    act(() => node("lead").focus());
    keyOn(node("lead"), "ArrowDown");
    expect(document.activeElement).toBe(node("a"));
    keyOn(node("a"), "ArrowDown");
    keyOn(node("b"), "ArrowLeft");
    expect(onCollapse).toHaveBeenCalledWith("b");
    await finish();
    expect(listOf("b").hidden).toBe(true);
    expect(node("b").getAttribute("aria-expanded")).toBe("false");
    keyOn(node("b"), "ArrowDown");
    expect(document.activeElement).toBe(node("lazy"));
    keyOn(node("lazy"), "Home");
    expect(document.activeElement).toBe(node("lead"));
    keyOn(node("lead"), "End");
    expect(document.activeElement).toBe(node("lazy"));
  });

  it("single selection: a click or Space selects, again clears; onSelectionChange reports", async () => {
    const onSelectionChange = vi.fn();
    render(<Collapsible enableSelection="single" onSelectionChange={onSelectionChange} />);
    await flush();
    expect(screen.getByRole("tree").hasAttribute("aria-multiselectable")).toBe(false);
    click(node("a").firstElementChild as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["a"]);
    expect(node("a").hasAttribute("data-ok-selected")).toBe(true);
    await flush();
    expect(node("a").getAttribute("aria-selected")).toBe("true");
    act(() => node("c").focus());
    keyOn(node("c"), " ");
    expect(onSelectionChange).toHaveBeenLastCalledWith(["c"]);
    expect(node("a").hasAttribute("data-ok-selected")).toBe(false);
    keyOn(node("c"), " ");
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    await expectNoAxeViolations(document.body);
  });

  it("multi selection, controlled, with the apiRef methods and getNodePath", async () => {
    const apiRef: MutableRefObject<OrganizationChartApi | undefined> = { current: undefined };
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Collapsible
        apiRef={apiRef}
        enableSelection="multi"
        selectedNodes={["b"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    await flush();
    expect(screen.getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
    expect(node("b").getAttribute("aria-selected")).toBe("true");
    expect(node("b").getAttribute("tabindex")).toBe("0");
    click(node("d").firstElementChild as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["b", "d"]);
    // Controlled: the prop decides.
    expect(node("d").hasAttribute("data-ok-selected")).toBe(false);
    rerender(
      <Collapsible
        apiRef={apiRef}
        enableSelection="multi"
        selectedNodes={["b", "d"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(apiRef.current?.getSelection()).toEqual(["b", "d"]);
    act(() => apiRef.current?.setSelection(["a", "a", "c"]));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["a", "c"]);
    onSelectionChange.mockClear();
    act(() => apiRef.current?.setSelection(["b", "d"]));
    expect(onSelectionChange).not.toHaveBeenCalled();
    act(() => apiRef.current?.clearSelection());
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    onSelectionChange.mockClear();
    rerender(
      <Collapsible
        apiRef={apiRef}
        enableSelection="multi"
        selectedNodes={[]}
        onSelectionChange={onSelectionChange}
      />,
    );
    act(() => apiRef.current?.clearSelection());
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(apiRef.current?.getNodePath("d")).toEqual(["lead", "b", "c", "d"]);
    expect(apiRef.current?.getNodePath("nobody")).toEqual([]);
  });

  it("uncontrolled defaults; methods do nothing without selection; nodes without nodeId aren't selectable", async () => {
    const apiRef: MutableRefObject<OrganizationChartApi | undefined> = { current: undefined };
    const { rerender } = render(
      <Team apiRef={apiRef} enableSelection="multi" defaultSelectedNodes={["x"]} />,
    );
    await flush();
    click(screen.getByText("First").parentElement as HTMLElement);
    expect(apiRef.current?.getSelection()).toEqual(["x"]);
    expect(nodeOf("First").hasAttribute("aria-selected")).toBe(false);
    rerender(<Team apiRef={apiRef} enableSelection={false} />);
    await flush();
    expect(chart().hasAttribute("role")).toBe(false);
    act(() => apiRef.current?.setSelection(["x", "y"]));
    expect(apiRef.current?.getSelection()).toEqual(["x"]);
  });

  it("the focus highlight follows a focused tree item", async () => {
    render(<Collapsible enableKeyboardNavigation highlightOnHover dimOpacity={0.5} />);
    await flush();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(node("lead"));
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    expect(document.activeElement).toBe(node("c"));
    for (const label of document.querySelectorAll("[data-ok-organization-chart-label]"))
      await settled(label);
    expect(getComputedStyle(node("a").firstElementChild as Element).opacity).toBe("0.5");
    expect(getComputedStyle(node("c").firstElementChild as Element).opacity).toBe("1");
    expect(getComputedStyle(node("b").firstElementChild as Element).opacity).toBe("1");
    expect(node("c").style.getPropertyValue("--_ok-org-path-offset")).not.toBe("");
    // The focus ring is on the label, not around the whole branch.
    expect(getComputedStyle(node("c")).outlineStyle).toBe("none");
    expect(getComputedStyle(node("c").firstElementChild as Element).outlineStyle).toBe("solid");
  });

  it("renders data-ok-selected on the server, and no tree attributes", () => {
    const html = renderToString(
      <Collapsible enableSelection="single" defaultSelectedNodes={["c"]} />,
    );
    expect(html).toContain('data-ok-enable-selection="single"');
    expect(html).toMatch(/data-ok-node-id="c" data-ok-selected=""/);
    expect(html).not.toContain('role="tree');
  });
});
