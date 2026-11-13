import { render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Tab, TabContext, TabPanel, Tabs } from "./tabs.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const root = () => document.querySelector("[data-ok-tabs]") as HTMLElement;
const indicator = () => document.querySelector("[data-ok-tabs-indicator]") as HTMLElement;
const tab = (name: string) => screen.getByRole("tab", { name });
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function Icon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

/** Tabs with their panels, the selection in app state. */
function Demo({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("one");
  return (
    <>
      <Tabs
        value={value}
        onChange={(next) => {
          onChange?.(next);
          setValue(next);
        }}
        aria-label="Demo"
      >
        <Tab value="one" label="One" id="t-one" aria-controls="p-one" />
        <Tab value="two" label="Two" id="t-two" aria-controls="p-two" />
        <Tab value="three" label="Three" id="t-three" aria-controls="p-three" disabled />
      </Tabs>
      {["one", "two", "three"].map((id) => (
        <TabPanel key={id} id={`p-${id}`} aria-labelledby={`t-${id}`} hidden={value !== id}>
          Panel {id}
        </TabPanel>
      ))}
    </>
  );
}

describe("Tabs", () => {
  it("renders the tabs anatomy with explicit defaults", async () => {
    render(
      <Tabs aria-label="Basic">
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );
    expect({ ...root().dataset }).toEqual({
      okTabs: "",
      okVariant: "standard",
      okOrientation: "horizontal",
      okTextColor: "inherit",
      okIndicatorColor: "inherit",
      okScrollButtons: "auto",
      okRuntime: "off",
    });
    const list = screen.getByRole("tablist", { name: "Basic" });
    expect(list.hasAttribute("aria-orientation")).toBe(false);
    // Values default to the position; the first tab is selected and alone in the tab order.
    expect(tab("One").getAttribute("value")).toBe("0");
    expect(tab("One").getAttribute("aria-selected")).toBe("true");
    expect(tab("One").tabIndex).toBe(0);
    expect(tab("Two").tabIndex).toBe(-1);
    expect(tab("One").querySelector("[data-ok-tab-label]")?.textContent).toBe("One");
    expect(document.querySelector("[data-ok-tabs-scroll-button]")).toBeNull();
    await expectNoAxeViolations();
  });

  it("looks like the reference: 48px tabs, 40px apart, 600 when selected, a 2px line", async () => {
    render(
      <Tabs aria-label="Look">
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>,
    );
    const one = tab("One");
    const two = tab("Two");
    expect(one.getBoundingClientRect().height).toBe(48);
    expect(two.getBoundingClientRect().left - one.getBoundingClientRect().right).toBe(40);
    expect([css(one).fontWeight, css(one).fontSize]).toEqual(["600", "14px"]);
    expect(Number.parseFloat(css(one).lineHeight)).toBeCloseTo(22, 1);
    expect(css(two).fontWeight).toBe("500");
    expect(css(two).color).toBe("rgb(82, 82, 92)");
    expect(css(one).color).toBe("rgb(24, 24, 27)");
    const line = indicator().getBoundingClientRect();
    const box = one.getBoundingClientRect();
    expect(line.height).toBe(2);
    expect(line.left).toBeCloseTo(box.left, 0);
    expect(line.width).toBeCloseTo(box.width, 0);
    expect(line.bottom).toBeCloseTo(box.bottom, 0);
    expect(css(indicator()).backgroundColor).toBe("rgb(24, 24, 27)");
  });

  it("selects on click and Enter; arrows only move focus; panels follow", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <Demo onChange={onChange} />
      </StrictMode>,
    );
    expect(screen.getByRole("tabpanel", { name: "One" }).textContent).toBe("Panel one");
    await userEvent.click(tab("Two"));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("two");
    expect(tab("Two").getAttribute("aria-selected")).toBe("true");
    expect(tab("Two").tabIndex).toBe(0);
    expect(tab("One").tabIndex).toBe(-1);
    expect(screen.getByRole("tabpanel", { name: "Two" })).toBeTruthy();
    expect(screen.queryByRole("tabpanel", { name: "One" })).toBeNull();
    // The line slides under the new tab.
    await nextFrame();
    await settled(indicator());
    expect(indicator().getBoundingClientRect().left).toBeCloseTo(
      tab("Two").getBoundingClientRect().left,
      0,
    );
    // Clicking the selected tab or a disabled one changes nothing.
    onChange.mockClear();
    await userEvent.click(tab("Two"));
    expect(onChange).not.toHaveBeenCalled();
    // Keyboard: Left moves focus (skipping disabled "Three" when wrapping), Enter selects.
    tab("Two").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("One"));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("one");
    expect(tab("One").getAttribute("aria-selected")).toBe("true");
    await expectNoAxeViolations();
  });

  it("uncontrolled: defaultValue, and a controlled value that refuses changes", async () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <Tabs defaultValue="b" onChange={onChange} aria-label="Uncontrolled">
        <Tab value="a" label="A" />
        <Tab value="b" label="B" />
      </Tabs>,
    );
    expect(tab("B").getAttribute("aria-selected")).toBe("true");
    await userEvent.click(tab("A"));
    expect(onChange).toHaveBeenCalledWith("a");
    expect(tab("A").getAttribute("aria-selected")).toBe("true");
    unmount();
    render(
      <Tabs value="b" onChange={onChange} aria-label="Refusing">
        <Tab value="a" label="A" />
        <Tab value="b" label="B" />
      </Tabs>,
    );
    await userEvent.click(tab("A"));
    expect(tab("B").getAttribute("aria-selected")).toBe("true");
  });

  it("no selection (false): the first enabled tab is in the tab order, no line", () => {
    render(
      <Tabs value={false} aria-label="None">
        <Tab label="A" disabled />
        <Tab label="B" />
      </Tabs>,
    );
    expect(tab("A").tabIndex).toBe(-1);
    expect(tab("B").tabIndex).toBe(0);
    expect(tab("B").getAttribute("aria-selected")).toBe("false");
    expect(indicator().getBoundingClientRect().width).toBe(0);
  });

  it("selectionFollowsFocus: arrow keys select", async () => {
    const onChange = vi.fn();
    render(
      <Tabs selectionFollowsFocus onChange={onChange} aria-label="Follow">
        <Tab label="A" />
        <Tab label="B" />
      </Tabs>,
    );
    expect(root().hasAttribute("data-ok-selection-follows-focus")).toBe(true);
    tab("A").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("1");
    expect(tab("B").getAttribute("aria-selected")).toBe("true");
  });

  it("vertical: aria-orientation, a column, Down / Up and the line on the right", async () => {
    render(
      <Tabs orientation="vertical" aria-label="Vertical">
        <Tab label="A" />
        <Tab label="B" />
      </Tabs>,
    );
    expect(screen.getByRole("tablist").getAttribute("aria-orientation")).toBe("vertical");
    const a = tab("A").getBoundingClientRect();
    const b = tab("B").getBoundingClientRect();
    expect(b.top).toBe(a.bottom);
    const line = indicator().getBoundingClientRect();
    expect(line.width).toBe(2);
    expect(line.height).toBeCloseTo(a.height, 0);
    expect(line.right).toBeCloseTo(root().getBoundingClientRect().right, 0);
    tab("A").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(tab("B"));
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(tab("A"));
  });

  it("colors: textColor and indicatorColor use the palette", () => {
    render(
      <Tabs textColor="primary" indicatorColor="secondary" aria-label="Colors">
        <Tab label="A" />
      </Tabs>,
    );
    expect(css(tab("A")).color).toBe("rgb(79, 57, 246)");
    expect(css(indicator()).backgroundColor).toBe("rgb(127, 34, 254)");
  });

  it("icons: position values, 72px tall with a label, icon-only tabs named by aria-label", async () => {
    render(
      <Tabs aria-label="Icons">
        <Tab label="Top" icon={<Icon />} />
        <Tab label="Start" icon={<Icon />} iconPosition="start" />
        <Tab label="End" icon={<Icon />} iconPosition="end" />
        <Tab label="Bottom" icon={<Icon />} iconPosition="bottom" />
        <Tab icon={<Icon />} aria-label="Only" />
        <Tab label="Hostile" icon={<Icon />} iconPosition={HOSTILE} />
      </Tabs>,
    );
    expect(tab("Top").getAttribute("data-ok-icon-position")).toBe("top");
    expect(tab("Top").getBoundingClientRect().height).toBe(72);
    expect(css(tab("Top")).flexDirection).toBe("column");
    expect(css(tab("Bottom")).flexDirection).toBe("column-reverse");
    expect(css(tab("Start")).flexDirection).toBe("row");
    expect(css(tab("End")).flexDirection).toBe("row-reverse");
    expect(tab("Only").hasAttribute("data-ok-icon-position")).toBe(false);
    expect(tab("Only").querySelector("svg")?.getBoundingClientRect().width).toBe(24);
    expect(tab("Hostile").hasAttribute("data-ok-icon-position")).toBe(false);
    await expectNoAxeViolations();
  });

  it("wrapped labels wrap; others stay on one line", () => {
    render(
      <div style={{ width: 400 }}>
        <Tabs aria-label="Wrap">
          <Tab label="A long label that keeps going and going past the limit" wrapped />
          <Tab label="Short" />
        </Tabs>
      </div>,
    );
    const wrapped = screen.getByRole("tab", { name: /long label/ });
    expect(wrapped.hasAttribute("data-ok-wrapped")).toBe(true);
    expect(wrapped.getBoundingClientRect().width).toBeLessThanOrEqual(264);
    expect(css(tab("Short")).whiteSpace).toBe("nowrap");
  });

  it("fullWidth and centered", () => {
    const { rerender } = render(
      <div style={{ width: 600 }}>
        <Tabs variant="fullWidth" aria-label="Full">
          <Tab label="A" />
          <Tab label="B" />
        </Tabs>
      </div>,
    );
    expect(tab("A").getBoundingClientRect().width).toBe(300);
    rerender(
      <div style={{ width: 600 }}>
        <Tabs centered aria-label="Full">
          <Tab label="A" />
        </Tabs>
      </div>,
    );
    const box = tab("A").getBoundingClientRect();
    expect(box.left + box.width / 2).toBeCloseTo(300, 0);
  });

  it("scrollable: scroll buttons appear on overflow and page through the tabs", async () => {
    render(
      <div style={{ width: 360 }}>
        <Tabs variant="scrollable" aria-label="Scroll">
          {Array.from({ length: 8 }, (_, i) => `Item ${i}`).map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </div>,
    );
    const start = document.querySelector('[data-ok-tabs-scroll-button="start"]') as HTMLElement;
    const end = document.querySelector('[data-ok-tabs-scroll-button="end"]') as HTMLElement;
    expect(start.getAttribute("aria-hidden")).toBe("true");
    expect(root().hasAttribute("data-ok-can-scroll-end")).toBe(true);
    expect(css(start).opacity).toBe("0");
    expect(css(end).opacity).toBe("0.8");
    const scroller = document.querySelector("[data-ok-tabs-scroller]") as HTMLElement;
    expect(css(scroller).overflowX).toBe("auto");
    end.click();
    await vi.waitUntil(() => scroller.scrollLeft > 0, { timeout: 3000 });
    await vi.waitUntil(() => root().hasAttribute("data-ok-can-scroll-start"), { timeout: 3000 });
  });

  it("scrollButtons: false renders none; true keeps them without overflow", () => {
    const { rerender } = render(
      <Tabs variant="scrollable" scrollButtons={false} aria-label="S">
        <Tab label="A" />
      </Tabs>,
    );
    expect(document.querySelector("[data-ok-tabs-scroll-button]")).toBeNull();
    expect(root().dataset["okScrollButtons"]).toBe("false");
    rerender(
      <Tabs
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        visibleScrollbar
        aria-label="S"
      >
        <Tab label="A" />
      </Tabs>,
    );
    expect(root().dataset["okScrollButtons"]).toBe("true");
    const end = document.querySelector('[data-ok-tabs-scroll-button="end"]') as HTMLElement;
    expect(css(end).display).toBe("flex");
    expect(root().hasAttribute("data-ok-allow-scroll-buttons-mobile")).toBe(true);
    expect(root().hasAttribute("data-ok-visible-scrollbar")).toBe(true);
    rerender(
      <Tabs variant="scrollable" aria-label="S">
        <Tab label="A" />
      </Tabs>,
    );
    // auto without overflow: hidden.
    expect(css(document.querySelector("[data-ok-tabs-scroll-button]") as Element).display).toBe(
      "none",
    );
  });

  it("segmented: a filled bar and a raised pill behind the selected tab", async () => {
    render(
      <Tabs segmented aria-label="Segmented">
        <Tab label="A" />
        <Tab label="B" />
      </Tabs>,
    );
    expect(css(root()).backgroundColor).toBe("rgb(244, 244, 245)");
    expect(css(root()).borderRadius).toBe("10px");
    expect(tab("A").getBoundingClientRect().height).toBe(52);
    const pill = getComputedStyle(indicator(), "::after");
    expect(pill.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(pill.boxShadow).not.toBe("none");
    expect(indicator().getBoundingClientRect().height).toBe(52);
    await expectNoAxeViolations();
  });

  it("focus ring on keyboard focus", async () => {
    render(
      <>
        <input aria-label="Before" />
        <Tabs aria-label="Focus">
          <Tab label="A" />
        </Tabs>
      </>,
    );
    screen.getByLabelText("Before").focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(tab("A"));
    expect(css(tab("A")).outlineStyle).toBe("solid");
  });

  it("ignores children that aren't elements and passes props through", () => {
    const ref = createRef<HTMLDivElement>();
    const tabRef = createRef<HTMLButtonElement>();
    render(
      <Tabs ref={ref} id="t" className="mine" aria-labelledby="h" data-x="1">
        {null}
        text
        <Tab ref={tabRef} label="A" className="tab" />
      </Tabs>,
    );
    expect(ref.current).toBe(root());
    expect(root()).toMatchObject({ id: "t", className: "mine" });
    expect(root().dataset["x"]).toBe("1");
    expect(screen.getByRole("tablist").getAttribute("aria-labelledby")).toBe("h");
    expect(tabRef.current?.className).toBe("tab");
  });

  it("no tabs: an empty tab list without a line", () => {
    render(<Tabs aria-label="Empty" />);
    expect(screen.getByRole("tablist", { name: "Empty" }).children).toHaveLength(0);
    expect(indicator().getBoundingClientRect().width).toBe(0);
  });

  it("a Tab outside Tabs is a plain tab in the tab order", () => {
    render(<Tab label="Alone" />);
    expect(screen.getByRole("tab", { name: "Alone" }).tabIndex).toBe(0);
  });

  it("TabPanel: role, tab order, focus ring, hidden", async () => {
    render(
      <TabPanel aria-label="Panel" className="p">
        Content
      </TabPanel>,
    );
    const panel = screen.getByRole("tabpanel", { name: "Panel" });
    expect(panel.tabIndex).toBe(0);
    expect(panel.className).toBe("p");
    await userEvent.tab();
    expect(css(panel).outlineStyle).toBe("solid");
  });

  it("reduced motion: the indicator doesn't slide", () => {
    render(
      <Tabs aria-label="Motion">
        <Tab label="A" />
      </Tabs>,
    );
    // Without the ready flag (first measure) there is no transition either.
    indicator().removeAttribute("data-ok-ready");
    expect(css(indicator()).transitionDuration).toBe("0s");
  });

  it("server render matches the client markup and unmounts cleanly", () => {
    const element = (
      <Tabs variant="scrollable" aria-label="SSR">
        <Tab label="A" value="a" />
        <Tab label="B" value="b" icon={<Icon />} iconPosition="start" />
      </Tabs>
    );
    const html = renderToString(element);
    const { container, unmount } = render(element);
    // The controller adds measured state after mount.
    const clone = container.cloneNode(true) as HTMLElement;
    for (const el of clone.querySelectorAll("*")) {
      el.removeAttribute("style");
      el.removeAttribute("data-ok-ready");
      el.removeAttribute("data-ok-can-scroll-start");
      el.removeAttribute("data-ok-can-scroll-end");
    }
    expect(html).toBe(clone.innerHTML);
    unmount();
  });
});

const RouterLink = ({ to, ...props }: { to: string } & Record<string, unknown>) => (
  <a href={`/app${to}`} {...props} />
);

function ContextDemo() {
  const [value, setValue] = useState("one");
  return (
    <TabContext value={value}>
      <Tabs onChange={setValue} aria-label="Views">
        <Tab value="one" label="One" />
        <Tab value="two" label="Two" />
      </Tabs>
      <TabPanel value="one">First</TabPanel>
      <TabPanel value="two" keepMounted>
        Second
      </TabPanel>
      <TabPanel>Free</TabPanel>
    </TabContext>
  );
}

describe("Link tabs and TabContext", () => {
  it("href and component render links in a navigation landmark; aria-current marks the page", async () => {
    const onChange = vi.fn();
    render(
      <Tabs value="b" onChange={onChange} aria-label="Pages">
        <Tab value="a" label="A" href="#a" />
        <Tab value="b" label="B" component={RouterLink} to="/b" />
      </Tabs>,
    );
    const nav = screen.getByRole("navigation", { name: "Pages" });
    expect(nav.querySelector('[role="tablist"]')).toBeNull();
    const a = screen.getByRole("link", { name: "A" });
    const b = screen.getByRole("link", { name: "B" });
    expect(b.getAttribute("href")).toBe("/app/b");
    expect(b.getAttribute("aria-current")).toBe("page");
    expect(a.hasAttribute("aria-current")).toBe(false);
    expect(a.dataset).toMatchObject({ okTab: "", okValue: "a" });
    a.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(a);
    expect(onChange).toHaveBeenCalledWith("a");
    await expectNoAxeViolations(document.body);
  });

  it("TabContext links tabs and panels; TabPanel value hides itself; keepMounted", async () => {
    render(<ContextDemo />);
    const one = screen.getByRole("tab", { name: "One" });
    const first = screen.getByRole("tabpanel", { name: "One" });
    expect(one.getAttribute("aria-controls")).toBe(first.id);
    expect(first.getAttribute("aria-labelledby")).toBe(one.id);
    const second = document.getElementById(
      screen.getByRole("tab", { name: "Two" }).getAttribute("aria-controls") as string,
    ) as HTMLElement;
    expect(second.hidden).toBe(true);
    expect(second.textContent).toBe("Second");
    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(second.hidden).toBe(false);
    expect(first.hidden).toBe(true);
    expect(first.textContent).toBe("");
    expect(screen.getByText("Free").hidden).toBe(false);
  });
});
