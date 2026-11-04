import axe from "axe-core";
import { expect } from "vitest";

/** Test helpers (not published). */
export function mount(html: string, parent: ParentNode = document.body): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  parent.append(host);
  return host;
}

/** Lets MutationObserver callbacks and the runtime's microtask flush run. */
export const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function resetPage(): void {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  delete (globalThis as unknown as Record<symbol, unknown>)[Symbol.for("minimal-tailwind.runtime")];
  delete (globalThis as { MinimalTailwind?: unknown }).MinimalTailwind;
}

/** Brand-colored text follows the reference look (ADR-0014): exempt from `color-contrast` only. */
const CONTRAST_EXEMPT = [
  '[data-mt-button][data-mt-color]:not([data-mt-color="inherit"]):not([data-mt-variant="soft"])',
  '[data-mt-fab]:not([data-mt-variant="soft"])',
  '[data-mt-toggle-button][aria-pressed="true"]:not([data-mt-color="inherit"])',
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Asserts that axe finds no WCAG 2.2 AA violations inside `host`. */
export async function expectNoAxeViolations(host: Element): Promise<void> {
  const all = await axe.run(host, {
    runOnly: { type: "tag", values: TAGS },
    rules: { "color-contrast": { enabled: false } },
  });
  const contrast = await axe.run(
    { include: [host], exclude: CONTRAST_EXEMPT.map((selector) => [selector]) },
    { runOnly: { type: "rule", values: ["color-contrast"] } },
  );
  const violations = [...all.violations, ...contrast.violations];
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
