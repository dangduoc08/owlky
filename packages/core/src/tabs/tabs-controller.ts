/*
 * Tabs behavior (WAI-ARIA tabs pattern, MUI Tabs), shared by React and the HTML runtime:
 * arrow-key focus movement, selection intent, the sliding indicator and the scroll buttons.
 * The controller owns no state: the owner selects (`aria-selected`, `tabindex`) when `onSelect`
 * reports a request, then calls `update()`.
 */

export interface TabsControllerOptions {
  /** The user asked to select `tab` (click, Enter / Space, or a focus move with `selectionFollowsFocus`). */
  onSelect(tab: HTMLElement, value: string): void;
}

export interface TabsController {
  /** Re-measures the indicator and the scroll state; scrolls a newly selected tab into view. */
  update(): void;
  /** Scrolls the tabs one page toward `"start"` or `"end"` (what the scroll buttons do). */
  scroll(direction: "start" | "end"): void;
  destroy(): void;
}

const TAB = '[role="tab"]';
/** Root flags written by the controller: the tabs can scroll toward the start / the end. */
export const TABS_SCROLL_START = "data-ok-can-scroll-start";
export const TABS_SCROLL_END = "data-ok-can-scroll-end";
/** Indicator flag: set after the first measure, so the indicator only slides between tabs. */
export const TABS_INDICATOR_READY = "data-ok-ready";

/** A tab's value: its `value` attribute, else its position. */
export const tabValue = (tab: Element, index: number): string =>
  tab.getAttribute("value") ?? String(index);

/** The tabs of `root` (not those of nested tabs), in order. */
export function tabsOf(root: Element): HTMLElement[] {
  const list = root.querySelector('[role="tablist"]');
  if (!list) return [];
  return [...list.querySelectorAll<HTMLElement>(TAB)].filter(
    (tab) => tab.closest("[data-ok-tabs]") === root,
  );
}

const enabled = (tab: HTMLElement) =>
  !(tab as HTMLButtonElement).disabled && tab.getAttribute("aria-disabled") !== "true";

/**
 * The tab a key moves focus to: next / previous along the orientation (wrapping, disabled tabs
 * skipped, mirrored in right-to-left), Home, End. `null` = not a navigation key.
 */
export function tabsKeyTarget(
  tabs: readonly HTMLElement[],
  current: Element | null,
  key: string,
  vertical: boolean,
  rtl = false,
): HTMLElement | null {
  const items = tabs.filter(enabled);
  if (items.length === 0) return null;
  const index = items.indexOf(current as HTMLElement);
  const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
  const previous = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
  if (key === next) return items[(index + 1) % items.length] as HTMLElement;
  if (key === previous) return items[index <= 0 ? items.length - 1 : index - 1] as HTMLElement;
  if (key === "Home") return items[0] as HTMLElement;
  if (key === "End") return items[items.length - 1] as HTMLElement;
  return null;
}

const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Connects the tabs inside `root` (`[data-ok-tabs]`): its tab list (`[role="tablist"]`), the
 * optional scroller (`[data-ok-tabs-scroller]`), indicator (`[data-ok-tabs-indicator]`) and scroll
 * buttons (`[data-ok-tabs-scroll-button="start|end"]`).
 */
export function createTabsController(
  root: HTMLElement,
  options: TabsControllerOptions,
): TabsController {
  const abort = new AbortController();
  const { signal } = abort;
  const vertical = () => root.getAttribute("data-ok-orientation") === "vertical";
  const list = () => root.querySelector<HTMLElement>('[role="tablist"]');
  const scroller = () => root.querySelector<HTMLElement>("[data-ok-tabs-scroller]");
  const indicator = () => root.querySelector<HTMLElement>("[data-ok-tabs-indicator]");
  const own = (target: EventTarget | null) => {
    const tab = target instanceof Element ? target.closest<HTMLElement>(TAB) : null;
    return tab && tabsOf(root).includes(tab) ? tab : null;
  };
  const request = (tab: HTMLElement) => {
    if (!enabled(tab) || tab.getAttribute("aria-selected") === "true") return;
    options.onSelect(tab, tabValue(tab, tabsOf(root).indexOf(tab)));
  };
  let selected: HTMLElement | null = null;
  let measured = false;

  root.addEventListener(
    "click",
    (event) => {
      const tab = own(event.target);
      if (tab) {
        request(tab);
        return;
      }
      const button = (event.target as Element).closest?.("[data-ok-tabs-scroll-button]");
      if (button && root.contains(button))
        controller.scroll(button.getAttribute("data-ok-tabs-scroll-button") as "start" | "end");
    },
    { signal },
  );
  root.addEventListener(
    "keydown",
    (event) => {
      const tab = own(event.target);
      if (!tab || event.altKey || event.ctrlKey || event.metaKey) return;
      const rtl = getComputedStyle(root).direction === "rtl";
      const target = tabsKeyTarget(tabsOf(root), tab, event.key, vertical(), rtl);
      if (!target) return;
      event.preventDefault();
      target.focus();
    },
    { signal },
  );
  root.addEventListener(
    "focusin",
    (event) => {
      const tab = own(event.target);
      if (tab && root.hasAttribute("data-ok-selection-follows-focus")) request(tab);
    },
    { signal },
  );

  const syncScroll = () => {
    const area = scroller();
    let start = false;
    let end = false;
    if (area) {
      const position = vertical() ? area.scrollTop : Math.abs(area.scrollLeft);
      const size = vertical() ? area.clientHeight : area.clientWidth;
      const total = vertical() ? area.scrollHeight : area.scrollWidth;
      start = position > 1;
      end = position + size < total - 1;
    }
    root.toggleAttribute(TABS_SCROLL_START, start);
    root.toggleAttribute(TABS_SCROLL_END, end);
  };

  /** Scrolls `tab` into the scroller's view (only the scroller, never the page). */
  const reveal = (tab: HTMLElement, smooth: boolean) => {
    const area = scroller();
    if (!area) return;
    const box = tab.getBoundingClientRect();
    const view = area.getBoundingClientRect();
    const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? "smooth" : "auto";
    if (vertical()) {
      if (box.top < view.top) area.scrollBy({ top: box.top - view.top, behavior });
      else if (box.bottom > view.bottom) area.scrollBy({ top: box.bottom - view.bottom, behavior });
    } else if (box.left < view.left) area.scrollBy({ left: box.left - view.left, behavior });
    else if (box.right > view.right) area.scrollBy({ left: box.right - view.right, behavior });
  };

  const controller: TabsController = {
    update() {
      const tabs = tabsOf(root);
      const current = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? null;
      const line = indicator();
      const area = list();
      if (line && area) {
        const position = current ? (vertical() ? current.offsetTop : current.offsetLeft) : 0;
        const size = current ? (vertical() ? current.offsetHeight : current.offsetWidth) : 0;
        line.style.setProperty("--_ok-tabs-indicator-start", `${position}px`);
        line.style.setProperty("--_ok-tabs-indicator-size", `${size}px`);
        if (!measured && current) {
          measured = true;
          // Slide only between tabs: the first position is set without a transition.
          requestAnimationFrame(() => {
            if (!signal.aborted) line.setAttribute(TABS_INDICATOR_READY, "");
          });
        }
      }
      if (current && current !== selected) reveal(current, selected !== null);
      selected = current;
      syncScroll();
    },
    scroll(direction) {
      const area = scroller();
      if (!area) return;
      const page = vertical() ? area.clientHeight : area.clientWidth;
      const rtl = getComputedStyle(area).direction === "rtl";
      const sign = (direction === "end" ? 1 : -1) * (rtl && !vertical() ? -1 : 1);
      const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
      area.scrollBy(vertical() ? { top: sign * page, behavior } : { left: sign * page, behavior });
    },
    destroy() {
      abort.abort();
      observer?.disconnect();
    },
  };

  const area = scroller();
  area?.addEventListener("scroll", syncScroll, { signal, passive: true });
  const observer =
    typeof ResizeObserver === "function" ? new ResizeObserver(() => controller.update()) : null;
  if (observer) {
    observer.observe(root);
    const tablist = list();
    if (tablist) observer.observe(tablist);
  }
  // Web fonts change the tab widths once they load.
  document.fonts?.ready.then(() => {
    if (!signal.aborted) controller.update();
  });
  controller.update();
  return controller;
}
