import axe from "axe-core";
import { expect } from "vitest";
import { userEvent } from "vitest/browser";

/** Test helpers (not published). */
export function mount(html: string, parent: ParentNode = document.body): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  parent.append(host);
  return host;
}

/** Lets MutationObserver callbacks and the runtime's microtask flush run. */
export const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Ends the exit animations of a closing element (Dialog, Drawer, Motion: ADR-0062) and waits a
 * task, so the owner has closed or removed it.
 */
export async function finishExit(element: Element): Promise<void> {
  getComputedStyle(element).opacity;
  for (const animation of element.getAnimations({ subtree: true }))
    if (animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY)
      animation.finish();
  await settle();
}

export function resetPage(): void {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  delete (globalThis as unknown as Record<symbol, unknown>)[Symbol.for("owlky.runtime")];
  delete (globalThis as { Owlky?: unknown }).Owlky;
}

/**
 * Parts exempt from axe `color-contrast`: only inactive (disabled) ones, as WCAG 1.4.3 allows.
 * Every other color pair, brand colors included, meets AA (ADR-0070 § 7).
 */
const CONTRAST_EXEMPT = [
  // Only inactive parts (WCAG 1.4.3 exception): every other color pair meets AA (ADR-0070 § 7).
  "[data-ok-label][data-ok-disabled]",
  // Disabled text (Typography and Link `textDisabled`) marks inactive content.
  '[data-ok-typography][data-ok-color="textDisabled"]',
  // A disabled upload zone is an inactive component.
  "[data-ok-upload-zone]:has(> [data-ok-upload-input]:disabled)",
  // The label of a disabled Select is inactive, like TextField's.
  "[data-ok-form-control]:has(> [data-ok-select] > [data-ok-select-input]:disabled) > [data-ok-input-label]",
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Animations a test can wait for: finite, running, on the document's timeline. Spinners loop
 * forever; paused and scroll-driven ones (scroll progress) end only when something scrolls.
 */
export const waitable = (animation: Animation): boolean =>
  animation.playState === "running" &&
  animation.timeline === document.timeline &&
  animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY;

export interface AxeScanOptions {
  /**
   * `"park"` (default) first moves the real pointer onto a spot of its own: the page's mouse
   * outlives tests and test files, so a pointer left where an earlier test clicked hovers whatever
   * is mounted there next (Firefox only after a later layout), and hover colors (soft buttons)
   * measure below the resting contrast. `"keep"` scans a hover state on purpose.
   */
  readonly pointer?: "park" | "keep";
}

/** Moves the real pointer onto a 1px element above the page; remove it after the scan. */
export async function parkPointer(): Promise<HTMLElement> {
  const parking = document.createElement("div");
  parking.setAttribute("aria-hidden", "true");
  parking.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;z-index:2147483647";
  document.body.append(parking);
  // A modal in the top layer covers it: the pointer still leaves the parts axe measures.
  await userEvent.hover(parking, { force: true });
  return parking;
}

/** Asserts that axe finds no WCAG 2.2 AA violations inside `host`. */
export async function expectNoAxeViolations(
  host: Element,
  { pointer = "park" }: AxeScanOptions = {},
): Promise<void> {
  const parking = pointer === "park" ? await parkPointer() : null;
  let violations: axe.Result[];
  try {
    // Mid-transition colors lower measured contrast (slow CI runners): scan the settled UI, once
    // the pointer left (un-hover transitions start then). Infinite animations (spinners) never
    // finish, so only finite ones are awaited.
    const finite = document.getAnimations().filter(waitable);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => {})));
    const all = await axe.run(host, {
      runOnly: { type: "tag", values: TAGS },
      rules: { "color-contrast": { enabled: false } },
    });
    const contrast = await axe.run(
      { include: [host], exclude: CONTRAST_EXEMPT.map((selector) => [selector]) },
      { runOnly: { type: "rule", values: ["color-contrast"] } },
    );
    violations = [...all.violations, ...contrast.violations];
  } finally {
    parking?.remove();
  }
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}
/** Every snippet is CSP-safe: no inline handlers, inline styles, scripts or javascript: URLs. */
export function expectCspSafe(host: Element, html: string): void {
  for (const element of host.querySelectorAll("*")) {
    for (const { name } of element.attributes) {
      expect(name.startsWith("on"), `${element.tagName} ${name}`).toBe(false);
      expect(name).not.toBe("style");
    }
  }
  expect(html).not.toMatch(/<script|javascript:/i);
}

/** Decorative icons are hidden and every button is a `type="button"` with a name. */
export function expectNamedButtons(host: Element): void {
  for (const svg of host.querySelectorAll("svg"))
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  for (const button of host.querySelectorAll("button")) {
    expect(button.getAttribute("type")).toBe("button");
    const name = button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "";
    expect(name, button.outerHTML).not.toBe("");
  }
}
