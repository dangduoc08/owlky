import axe from "axe-core";
import { expect } from "vitest";

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
  "[data-swatch]",
  '[data-ok-list-subheader][data-ok-color="primary"]',
  '[data-ok-tabs]:not([data-ok-text-color="inherit"]) [role="tab"][aria-selected="true"]',
];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/**
 * Waits until the element's CSS transitions and animations (hover colors, shadows) have finished,
 * so computed styles are final. Polling with a timeout is flaky on slow CI runners.
 */
export async function settled(element: Element): Promise<void> {
  // Reading a style flushes it, which starts the transitions of the new state.
  getComputedStyle(element).backgroundColor;
  const running = element
    .getAnimations({ subtree: true })
    .filter((a) => a.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY);
  await Promise.all(running.map((animation) => animation.finished.catch(() => {})));
}

/** Asserts that axe finds no WCAG violations inside `container`. */
export async function expectNoAxeViolations(container: Element = document.body): Promise<void> {
  // Mid-animation opacity lowers measured contrast, so scan the settled UI. Infinite animations
  // (spinners) never finish: only finite ones are awaited.
  const finite = document
    .getAnimations()
    .filter((a) => a.effect?.getComputedTiming().endTime !== Number.POSITIVE_INFINITY);
  await Promise.all(finite.map((animation) => animation.finished.catch(() => {})));
  const all = await axe.run(container, {
    runOnly: { type: "tag", values: TAGS },
    rules: { "color-contrast": { enabled: false } },
  });
  const contrast = await axe.run(
    { include: [container], exclude: CONTRAST_EXEMPT.map((selector) => [selector]) },
    { runOnly: { type: "rule", values: ["color-contrast"] } },
  );
  const violations = [...all.violations, ...contrast.violations];
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}
