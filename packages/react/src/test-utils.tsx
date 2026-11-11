import axe from "axe-core";
import { act } from "react";
import { expect } from "vitest";
import { userEvent } from "vitest/browser";

/**
 * Brand-colored text follows the reference look, not AA (ADR-0014): colored contained / outlined
 * / text buttons, fabs, pressed colored toggles and swatches are exempt from `color-contrast` only. Soft buttons and neutral text
 * are still checked.
 */
export const CONTRAST_EXEMPT = [
  '[data-ok-button][data-ok-color]:not([data-ok-color="inherit"]):not([data-ok-variant="soft"])',
  '[data-ok-fab]:not([data-ok-variant="soft"])',
  '[data-ok-toggle-button][aria-pressed="true"]:not([data-ok-color="standard"])',
  '[data-ok-alert]:not([data-ok-variant="standard"])',
  '[data-ok-pagination]:not([data-ok-color="standard"]):not([data-ok-variant="soft"]) [aria-current="page"]',
  '[data-ok-avatar]:not([data-ok-color="default"])',
  '[data-ok-badge]:not([data-ok-color="default"]) > [data-ok-badge-badge]',
  '[data-ok-chip]:not([data-ok-color="default"]):not([data-ok-variant="soft"])',
  '[data-ok-chip][data-ok-color="white"]',
  '[data-ok-label][data-ok-variant="filled"]:not([data-ok-color="default"])',
  '[data-ok-label][data-ok-variant="outlined"]:not([data-ok-color="default"])',
  '[data-ok-label][data-ok-color="white"]',
  '[data-ok-chip][data-ok-color="black"]',
  '[data-ok-label][data-ok-color="black"]',
  // A disabled label is inactive, dimmed like the reference.
  "[data-ok-label][data-ok-disabled]",
  "[data-swatch]",
  '[data-ok-list-subheader][data-ok-color="primary"]',
  // Typography (and Link) in a palette's main tone follows the reference (ADR-0014); disabled text
  // is inactive; inherited colors (Link `inherit`) are checked.
  '[data-ok-typography][data-ok-color]:not([data-ok-color="textPrimary"]):not([data-ok-color="textSecondary"]):not([data-ok-color="inherit"])',
  '[data-ok-tabs]:not([data-ok-text-color="inherit"]) [role="tab"][aria-selected="true"]',
  '[data-ok-picker-day][aria-selected="true"]',
  '[data-ok-picker-month][aria-checked="true"]',
  '[data-ok-picker-year][aria-checked="true"]',
  '[data-ok-digital-clock-item][aria-selected="true"]',
  '[data-ok-time-clock-number][aria-selected="true"]',
  '[data-ok-time-clock-meridiem][aria-pressed="true"]',
  "[data-ok-editor-content] a",
  "[data-ok-markdown] a",
  '[data-ok-carousel-arrows]:not([data-ok-color="inherit"]) [data-ok-carousel-counter]',
  '[data-ok-carousel-dots]:not([data-ok-color="inherit"]) [data-ok-carousel-dot][aria-current="true"]',
  // A disabled upload zone is an inactive component (WCAG 1.4.3 exception), dimmed like the reference.
  "[data-ok-upload-zone]:has(> [data-ok-upload-input]:disabled)",
  // The label of a disabled Select is inactive (WCAG 1.4.3 exception), like TextField's.
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

/**
 * Ends the exit animations of a closing element (Dialog, Drawer, MotionPresence: ADR-0062) and
 * waits a task inside `act()`, so the owner has closed or unmounted it.
 */
export async function finishExit(element: Element): Promise<void> {
  await act(async () => {
    getComputedStyle(element).opacity;
    for (const animation of element.getAnimations({ subtree: true }))
      if (animation.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY)
        animation.finish();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

/**
 * Waits until the element's CSS transitions and animations (hover colors, shadows) have finished,
 * so computed styles are final. Polling with a timeout is flaky on slow CI runners.
 */
export async function settled(element: Element): Promise<void> {
  // Reading a style flushes it, which starts the transitions of the new state.
  getComputedStyle(element).backgroundColor;
  const running = element.getAnimations({ subtree: true }).filter(waitable);
  await Promise.all(running.map((animation) => animation.finished.catch(() => {})));
}

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

/** Asserts that axe finds no WCAG violations inside `container`. */
export async function expectNoAxeViolations(
  container: Element = document.body,
  { pointer = "park" }: AxeScanOptions = {},
): Promise<void> {
  const parking = pointer === "park" ? await parkPointer() : null;
  let violations: axe.Result[];
  try {
    // Mid-animation opacity lowers measured contrast, so scan the settled UI, once the pointer
    // left (un-hover transitions start then). Infinite animations (spinners) never finish: only
    // finite ones are awaited.
    const finite = document.getAnimations().filter(waitable);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => {})));
    const all = await axe.run(container, {
      runOnly: { type: "tag", values: TAGS },
      rules: { "color-contrast": { enabled: false } },
    });
    const contrast = await axe.run(
      { include: [container], exclude: CONTRAST_EXEMPT.map((selector) => [selector]) },
      { runOnly: { type: "rule", values: ["color-contrast"] } },
    );
    violations = [...all.violations, ...contrast.violations];
  } finally {
    parking?.remove();
  }
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}
