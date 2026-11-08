import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount, nextFrame } from "../test-utils.js";
import {
  createTabsController,
  TABS_INDICATOR_READY,
  TABS_SCROLL_END,
  TABS_SCROLL_START,
  tabsKeyTarget,
  tabsOf,
  tabValue,
} from "./tabs-controller.js";

afterEach(cleanupDom);

/** Tabs with fixed sizes (core tests have no stylesheet). */
function tabsMarkup({
  count = 3,
  vertical = false,
  scrollable = false,
  disabled = [] as number[],
  selected = 0,
}: {
  count?: number;
  vertical?: boolean;
  scrollable?: boolean;
  disabled?: number[];
  selected?: number;
} = {}) {
  const tabs = Array.from(
    { length: count },
    (_, i) =>
      `<button type="button" role="tab" data-ok-tab value="t${i}" aria-selected="${i === selected}" tabindex="${i === selected ? 0 : -1}"${disabled.includes(i) ? " disabled" : ""}>Tab ${i}</button>`,
  ).join("");
  const host =
    mount(`<div data-ok-tabs data-ok-orientation="${vertical ? "vertical" : "horizontal"}"${
      scrollable ? ' data-ok-variant="scrollable"' : ""
    }>
      ${scrollable ? '<div data-ok-tabs-scroll-button="start"></div>' : ""}
      <div data-ok-tabs-scroller><div role="tablist" data-ok-tabs-list>${tabs}</div><span data-ok-tabs-indicator></span></div>
      ${scrollable ? '<div data-ok-tabs-scroll-button="end"></div>' : ""}
    </div>`);
  const root = host.querySelector<HTMLElement>("[data-ok-tabs]") as HTMLElement;
  const scroller = root.querySelector<HTMLElement>("[data-ok-tabs-scroller]") as HTMLElement;
  const list = root.querySelector<HTMLElement>("[role=tablist]") as HTMLElement;
  root.style.display = "flex";
  if (vertical) root.style.flexDirection = "column";
  scroller.style.position = "relative";
  scroller.style.overflow = scrollable ? "auto" : "hidden";
  if (vertical) scroller.style.height = scrollable ? "100px" : "";
  else scroller.style.width = scrollable ? "200px" : "";
  list.style.display = "flex";
  if (vertical) list.style.flexDirection = "column";
  for (const tab of list.children as HTMLCollectionOf<HTMLElement>) {
    tab.style.flex = "none";
    tab.style.width = "100px";
    tab.style.height = "40px";
    tab.style.margin = "0";
    tab.style.padding = "0";
    tab.style.border = "0";
  }
  return { root, scroller, list, tabs: [...list.children] as HTMLElement[] };
}

const press = (target: Element, key: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );

const indicator = (root: Element) =>
  root.querySelector<HTMLElement>("[data-ok-tabs-indicator]") as HTMLElement;
const vars = (root: Element) => ({
  start: indicator(root).style.getPropertyValue("--_ok-tabs-indicator-start"),
  size: indicator(root).style.getPropertyValue("--_ok-tabs-indicator-size"),
});

/** What an owner does when the controller reports a selection. */
function select(tabs: HTMLElement[], tab: HTMLElement) {
  for (const item of tabs) {
    item.setAttribute("aria-selected", String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  }
}

describe("tab helpers", () => {
  it("tabValue: the value attribute, else the position", () => {
    const tab = document.createElement("button");
    expect(tabValue(tab, 2)).toBe("2");
    tab.setAttribute("value", "home");
    expect(tabValue(tab, 2)).toBe("home");
  });

  it("tabsOf: own tabs in order, not those of nested tabs; none without a tab list", () => {
    const { root } = tabsMarkup();
    const panel = document.createElement("div");
    panel.innerHTML =
      '<div data-ok-tabs><div role="tablist"><button role="tab">Inner</button></div></div>';
    root.querySelector("[role=tablist]")?.append(panel);
    expect(tabsOf(root).map((tab) => tab.textContent)).toEqual(["Tab 0", "Tab 1", "Tab 2"]);
    expect(tabsOf(document.createElement("div"))).toEqual([]);
  });

  it("tabsKeyTarget: next / previous wrap and skip disabled tabs; Home / End; other keys → null", () => {
    const { tabs } = tabsMarkup({ count: 4, disabled: [1] });
    const [a, , c, d] = tabs as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    expect(tabsKeyTarget(tabs, a, "ArrowRight", false)).toBe(c);
    expect(tabsKeyTarget(tabs, d, "ArrowRight", false)).toBe(a);
    expect(tabsKeyTarget(tabs, a, "ArrowLeft", false)).toBe(d);
    expect(tabsKeyTarget(tabs, c, "ArrowLeft", false)).toBe(a);
    expect(tabsKeyTarget(tabs, c, "Home", false)).toBe(a);
    expect(tabsKeyTarget(tabs, a, "End", false)).toBe(d);
    expect(tabsKeyTarget(tabs, a, "ArrowDown", false)).toBeNull();
    expect(tabsKeyTarget(tabs, a, "Enter", false)).toBeNull();
    // Vertical: Up / Down; right-to-left mirrors Left / Right.
    expect(tabsKeyTarget(tabs, a, "ArrowDown", true)).toBe(c);
    expect(tabsKeyTarget(tabs, a, "ArrowUp", true)).toBe(d);
    expect(tabsKeyTarget(tabs, a, "ArrowRight", true)).toBeNull();
    expect(tabsKeyTarget(tabs, a, "ArrowLeft", false, true)).toBe(c);
    // Focus outside the tabs starts from the first one.
    expect(tabsKeyTarget(tabs, null, "ArrowRight", false)).toBe(a);
    for (const tab of tabs) (tab as HTMLButtonElement).disabled = true;
    expect(tabsKeyTarget(tabs, a, "ArrowRight", false)).toBeNull();
  });
});

describe("createTabsController", () => {
  it("places the indicator under the selected tab, then lets it slide", async () => {
    const { root, tabs } = tabsMarkup({ selected: 1 });
    const controller = createTabsController(root, { onSelect: vi.fn() });
    expect(vars(root)).toEqual({ start: "100px", size: "100px" });
    expect(indicator(root).hasAttribute(TABS_INDICATOR_READY)).toBe(false);
    await nextFrame();
    expect(indicator(root).hasAttribute(TABS_INDICATOR_READY)).toBe(true);
    select(tabs, tabs[2] as HTMLElement);
    controller.update();
    expect(vars(root)).toEqual({ start: "200px", size: "100px" });
    // No selection: no line.
    for (const tab of tabs) tab.setAttribute("aria-selected", "false");
    controller.update();
    expect(vars(root)).toEqual({ start: "0px", size: "0px" });
    controller.destroy();
  });

  it("vertical: the indicator follows the tab's top and height", () => {
    const { root } = tabsMarkup({ vertical: true, selected: 2 });
    createTabsController(root, { onSelect: vi.fn() }).destroy();
    expect(vars(root)).toEqual({ start: "80px", size: "40px" });
  });

  it("works without an indicator or a tab list", () => {
    const empty = mount("<div data-ok-tabs></div>").firstElementChild as HTMLElement;
    const controller = createTabsController(empty, { onSelect: vi.fn() });
    expect(() => controller.update()).not.toThrow();
    controller.scroll("end");
    controller.destroy();
  });

  it("click: reports the tab and its value; ignores the selected, disabled and foreign tabs", () => {
    const { root, tabs } = tabsMarkup({ disabled: [2] });
    const onSelect = vi.fn();
    const controller = createTabsController(root, { onSelect });
    (tabs[1] as HTMLElement).click();
    expect(onSelect).toHaveBeenCalledWith(tabs[1], "t1");
    onSelect.mockClear();
    (tabs[0] as HTMLElement).click();
    (tabs[2] as HTMLElement).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    (tabs[2] as HTMLElement).setAttribute("aria-disabled", "true");
    (tabs[2] as HTMLElement).removeAttribute("disabled");
    (tabs[2] as HTMLElement).click();
    root.querySelector<HTMLElement>("[data-ok-tabs-scroller]")?.click();
    expect(onSelect).not.toHaveBeenCalled();
    controller.destroy();
    (tabs[1] as HTMLElement).click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keyboard: arrows, Home and End move focus only (manual activation)", () => {
    const { root, tabs } = tabsMarkup();
    const onSelect = vi.fn();
    const controller = createTabsController(root, { onSelect });
    const [a, b, c] = tabs as [HTMLElement, HTMLElement, HTMLElement];
    a.focus();
    expect(press(a, "ArrowRight")).toBe(false);
    expect(document.activeElement).toBe(b);
    press(b, "End");
    expect(document.activeElement).toBe(c);
    press(c, "Home");
    expect(document.activeElement).toBe(a);
    // Other keys and modified arrows are left to the browser.
    expect(press(a, "x")).toBe(true);
    expect(press(a, "ArrowRight", { altKey: true })).toBe(true);
    expect(press(a, "ArrowRight", { ctrlKey: true })).toBe(true);
    expect(press(a, "ArrowRight", { metaKey: true })).toBe(true);
    expect(press(root, "ArrowRight")).toBe(true);
    expect(document.activeElement).toBe(a);
    expect(onSelect).not.toHaveBeenCalled();
    controller.destroy();
  });

  it("selectionFollowsFocus: a focus move selects", () => {
    const { root, tabs } = tabsMarkup();
    root.setAttribute("data-ok-selection-follows-focus", "");
    const onSelect = vi.fn();
    const controller = createTabsController(root, { onSelect });
    (tabs[0] as HTMLElement).focus();
    expect(onSelect).not.toHaveBeenCalled(); // already selected
    press(tabs[0] as HTMLElement, "ArrowRight");
    expect(onSelect).toHaveBeenCalledWith(tabs[1], "t1");
    controller.destroy();
  });

  it("scrollable: flags the edges that can scroll, scroll buttons page through", async () => {
    const { root, scroller, tabs } = tabsMarkup({ count: 6, scrollable: true });
    const controller = createTabsController(root, { onSelect: vi.fn() });
    expect(root.hasAttribute(TABS_SCROLL_START)).toBe(false);
    expect(root.hasAttribute(TABS_SCROLL_END)).toBe(true);
    const spy = vi.spyOn(scroller, "scrollBy");
    root.querySelector<HTMLElement>('[data-ok-tabs-scroll-button="end"]')?.click();
    expect(spy).toHaveBeenLastCalledWith({ left: 200, behavior: "smooth" });
    controller.scroll("start");
    expect(spy).toHaveBeenLastCalledWith({ left: -200, behavior: "smooth" });
    spy.mockRestore();
    scroller.scrollLeft = 400;
    scroller.dispatchEvent(new Event("scroll"));
    expect(root.hasAttribute(TABS_SCROLL_START)).toBe(true);
    expect(root.hasAttribute(TABS_SCROLL_END)).toBe(false);
    // A newly selected tab scrolls into view (only the scroller moves).
    select(tabs, tabs[0] as HTMLElement);
    controller.update();
    select(tabs, tabs[5] as HTMLElement);
    scroller.scrollLeft = 0;
    controller.update();
    await vi.waitUntil(() => scroller.scrollLeft >= 399, { timeout: 3000 });
    select(tabs, tabs[0] as HTMLElement);
    controller.update();
    await vi.waitUntil(() => scroller.scrollLeft === 0, { timeout: 3000 });
    controller.destroy();
  });

  it("vertical scroll and reduced motion: pages by height, scrolls at once", () => {
    const { root, scroller, tabs } = tabsMarkup({ count: 6, scrollable: true, vertical: true });
    const media = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList);
    const spy = vi.spyOn(scroller, "scrollBy");
    try {
      const controller = createTabsController(root, { onSelect: vi.fn() });
      controller.scroll("end");
      expect(spy).toHaveBeenLastCalledWith({ top: 100, behavior: "auto" });
      // Scrolled 100px: the last tab (bottom at 240px) needs 40px more.
      select(tabs, tabs[5] as HTMLElement);
      controller.update();
      expect(spy).toHaveBeenLastCalledWith({ top: 40, behavior: "auto" });
      select(tabs, tabs[0] as HTMLElement);
      controller.update();
      expect(spy).toHaveBeenLastCalledWith({ top: -140, behavior: "auto" });
      controller.destroy();
    } finally {
      media.mockRestore();
      spy.mockRestore();
    }
  });

  it("right-to-left: the end button scrolls toward the left", () => {
    const { root, scroller } = tabsMarkup({ count: 6, scrollable: true });
    root.dir = "rtl";
    const controller = createTabsController(root, { onSelect: vi.fn() });
    const spy = vi.spyOn(scroller, "scrollBy");
    controller.scroll("end");
    expect(spy).toHaveBeenLastCalledWith({ left: -200, behavior: "smooth" });
    spy.mockRestore();
    controller.destroy();
  });

  it("re-measures when the tabs resize, and stops after destroy", async () => {
    const { root, tabs } = tabsMarkup();
    const controller = createTabsController(root, { onSelect: vi.fn() });
    (tabs[0] as HTMLElement).style.width = "150px";
    await vi.waitUntil(() => vars(root).size === "150px", { timeout: 3000 });
    controller.destroy();
    (tabs[0] as HTMLElement).style.width = "120px";
    await nextFrame();
    await nextFrame();
    expect(vars(root).size).toBe("150px");
  });

  it("without ResizeObserver or fonts: still measures once", () => {
    const original = globalThis.ResizeObserver;
    const fonts = Object.getOwnPropertyDescriptor(Document.prototype, "fonts");
    // @ts-expect-error simulate an engine without ResizeObserver
    delete globalThis.ResizeObserver;
    Object.defineProperty(document, "fonts", { value: undefined, configurable: true });
    try {
      const { root } = tabsMarkup();
      const controller = createTabsController(root, { onSelect: vi.fn() });
      expect(vars(root).size).toBe("100px");
      controller.destroy();
    } finally {
      globalThis.ResizeObserver = original;
      delete (document as { fonts?: unknown }).fonts;
      if (fonts) Object.defineProperty(Document.prototype, "fonts", fonts);
    }
  });
});
