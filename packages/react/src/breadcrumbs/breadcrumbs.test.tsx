import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Breadcrumbs, BreadcrumbsDot } from "./breadcrumbs.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const nav = () => document.querySelector("[data-ok-breadcrumbs]") as HTMLElement;
const visibleItems = () =>
  [...document.querySelectorAll("[data-ok-breadcrumbs-list] > li:not([hidden])")].map((li) =>
    li.hasAttribute("data-ok-breadcrumbs-separator")
      ? "|"
      : li.hasAttribute("data-ok-breadcrumbs-collapsed")
        ? "…"
        : (li.textContent ?? ""),
  );

function Trail(props: Parameters<typeof Breadcrumbs>[0]) {
  return (
    <Breadcrumbs {...props}>
      <a href="#a">A</a>
      <a href="#b">B</a>
      <a href="#c">C</a>
      <a href="#d">D</a>
      <span aria-current="page">E</span>
    </Breadcrumbs>
  );
}

describe("Breadcrumbs", () => {
  it("a nav landmark with an ordered list, separators between items", async () => {
    render(
      <Breadcrumbs>
        <a href="#home">Home</a>
        {null}
        <span aria-current="page">Page</span>
      </Breadcrumbs>,
    );
    const landmark = screen.getByRole("navigation", { name: "breadcrumb" });
    expect({ ...landmark.dataset }).toEqual({ okBreadcrumbs: "", okRuntime: "off" });
    const list = landmark.querySelector("ol") as HTMLOListElement;
    expect(list.hasAttribute("data-ok-breadcrumbs-list")).toBe(true);
    expect([...list.children].map((li) => li.localName)).toEqual(["li", "li", "li"]);
    const separator = list.children[1] as HTMLElement;
    expect(separator.getAttribute("aria-hidden")).toBe("true");
    expect(separator.textContent).toBe("/");
    expect(visibleItems()).toEqual(["Home", "|", "Page"]);
    await expectNoAxeViolations();
  });

  it("looks like the reference: 14px secondary text, 16px apart, current page primary", () => {
    render(<Trail />);
    expect(css(nav()).color).toBe("rgb(82, 82, 92)");
    expect(css(nav()).fontSize).toBe("14px");
    expect(css(nav().querySelector("ol") as Element).columnGap).toBe("16px");
    expect(css(screen.getByText("E")).color).toBe("rgb(24, 24, 27)");
    expect(css(screen.getByRole("link", { name: "A" })).textDecorationLine).toBe("none");
  });

  it("links: underline on hover, a focus ring on keyboard focus", async () => {
    render(<Trail />);
    const link = screen.getByRole("link", { name: "A" });
    await userEvent.hover(link);
    expect(css(link).textDecorationLine).toBe("underline");
    await userEvent.tab();
    expect(document.activeElement).toBe(link);
    expect(css(link).outlineStyle).toBe("solid");
  });

  it("custom separators: text, a node, the dot", () => {
    const { rerender } = render(<Trail separator="›" />);
    expect(document.querySelector("[data-ok-breadcrumbs-separator]")?.textContent).toBe("›");
    rerender(<Trail separator={<BreadcrumbsDot />} />);
    const dot = document.querySelector("[data-ok-breadcrumbs-dot]") as HTMLElement;
    expect(dot.getBoundingClientRect()).toMatchObject({ width: 4, height: 4 });
    expect(css(dot).borderRadius).toBe("9999px");
  });

  it("collapses past maxItems and expands on demand, focusing the first revealed item", async () => {
    render(<Trail maxItems={3} expandText="Show the path" />);
    expect(nav().dataset["okMaxItems"]).toBe("3");
    expect(visibleItems()).toEqual(["A", "|", "…", "|", "E"]);
    expect(screen.queryByRole("link", { name: "B" })).toBeNull();
    const expand = screen.getByRole("button", { name: "Show the path" });
    expect(expand.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(expand.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    await expectNoAxeViolations();
    await userEvent.click(expand);
    expect(visibleItems()).toEqual(["A", "|", "B", "|", "C", "|", "D", "|", "E"]);
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "B" }));
    expect(nav().hasAttribute("data-ok-expanded")).toBe(true);
  });

  it("itemsBeforeCollapse / itemsAfterCollapse; invalid values use the defaults", () => {
    const { rerender } = render(
      <Trail maxItems={2} itemsBeforeCollapse={2} itemsAfterCollapse={2} />,
    );
    expect(visibleItems()).toEqual(["A", "|", "B", "|", "…", "|", "D", "|", "E"]);
    rerender(<Trail maxItems={2} itemsBeforeCollapse={0} itemsAfterCollapse={1} />);
    expect(visibleItems()).toEqual(["…", "|", "E"]);
    rerender(<Trail maxItems={HOSTILE} itemsBeforeCollapse={HOSTILE} />);
    expect(visibleItems()).toHaveLength(9);
    expect(nav().hasAttribute("data-ok-max-items")).toBe(false);
  });

  it("the default expand text, keyboard expansion", async () => {
    render(<Trail maxItems={2} />);
    const expand = screen.getByRole("button", { name: "Show path" });
    expand.focus();
    await userEvent.keyboard("{Enter}");
    expect(visibleItems()).toHaveLength(9);
  });

  it("icons are 20px, before the text", () => {
    render(
      <Breadcrumbs>
        <a href="#home">
          <svg aria-hidden="true" viewBox="0 0 24 24" />
          Home
        </a>
      </Breadcrumbs>,
    );
    expect(document.querySelector("svg")?.getBoundingClientRect().width).toBe(20);
  });

  it("long items wrap instead of overflowing", () => {
    render(
      <div style={{ width: 200 }}>
        <Breadcrumbs>
          <a href="#a">Averyveryverylongsegmentwithoutanyspaces</a>
          <span aria-current="page">Page</span>
        </Breadcrumbs>
      </div>,
    );
    expect(nav().scrollWidth).toBeLessThanOrEqual(200);
  });

  it("passes ref, label and DOM props to the nav", () => {
    const ref = createRef<HTMLElement>();
    render(<Trail ref={ref} aria-label="Trail" id="t" className="mine" />);
    expect(ref.current).toBe(screen.getByRole("navigation", { name: "Trail" }));
    expect(ref.current).toMatchObject({ id: "t", className: "mine" });
  });

  it("server render matches the client markup (collapsed too)", () => {
    for (const element of [<Trail key="a" />, <Trail key="b" maxItems={3} />]) {
      const html = renderToString(element);
      const { container, unmount } = render(element);
      expect(html).toBe(container.innerHTML);
      unmount();
    }
  });
});
