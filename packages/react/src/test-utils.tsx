import axe from "axe-core";
import { expect } from "vitest";

/** Asserts that axe finds no WCAG violations inside `container`. */
export async function expectNoAxeViolations(container: Element = document.body): Promise<void> {
  // Mid-animation opacity lowers measured contrast; scan the settled UI.
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished.catch(() => {})),
  );
  const result = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  });
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);
}
