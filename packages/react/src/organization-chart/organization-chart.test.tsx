import { render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  OrganizationChart,
  OrganizationChartNode,
  type OrganizationChartProps,
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
