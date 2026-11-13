import AxeBuilder from "@axe-core/playwright";
import { styleNames } from "@owlky/tokens";
import { expect, test } from "@playwright/test";
import { CONTRAST_EXEMPT } from "./helpers.js";
import { openStyled, STYLE_SAMPLE } from "./style-sample.js";

/**
 * Axe per design style (ST6): a sample of stories × every style × light / dark. `a11y.spec.ts`
 * scans every story in the default style; this one checks that each opt-in sheet keeps the
 * components at WCAG 2.2 AA. The CSS is shared by both implementations (parity checks the DOM),
 * so one framework is enough. Tagged `@styles`: CI's chromium shards split it with the rest.
 */
// Declared before any fixture, so other projects never launch a browser for these tests.
test.skip(({ browserName }) => browserName !== "chromium", "axe results are engine-independent.");

for (const style of styleNames) {
  for (const theme of ["light", "dark"] as const) {
    for (const sample of STYLE_SAMPLE) {
      test(`${style} style: ${sample.name} (${theme}) has no WCAG 2.2 AA violations @styles`, async ({
        page,
      }) => {
        await openStyled(page, sample, style, theme);
        // A modal dialog sits in the top layer: scan the whole page for it.
        const scope = sample.open ? "body" : "#storybook-root";
        const all = await new AxeBuilder({ page })
          .include(scope)
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .disableRules(["color-contrast"])
          .analyze();
        let contrast = new AxeBuilder({ page }).include(scope).withRules(["color-contrast"]);
        for (const selector of CONTRAST_EXEMPT) contrast = contrast.exclude(selector);
        const violations = [...all.violations, ...(await contrast.analyze()).violations];
        expect(
          violations.map(
            (v) =>
              `${v.id}: ${v.help} (${v.nodes.map((n) => `${n.target.join(" ")}: ${n.failureSummary?.split("\n").at(-1)?.trim()}`).join("; ")})`,
          ),
        ).toEqual([]);
      });
    }
  }
}
