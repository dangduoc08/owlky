import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Each paper's shadow equals `var(--ok-elevation-<level>)` resolved in its own scope. */
function shadows(page: Page) {
  return page.locator("[data-ok-paper]").evaluateAll((papers) =>
    papers.map((paper) => {
      const probe = document.createElement("div");
      const level = paper.getAttribute("data-ok-elevation");
      const outlined = paper.getAttribute("data-ok-variant") === "outlined";
      probe.style.boxShadow =
        outlined || level === "0" ? "none" : `var(--ok-elevation-${level ?? "1"})`;
      paper.parentElement?.append(probe);
      const expected = getComputedStyle(probe).boxShadow;
      probe.remove();
      return getComputedStyle(paper).boxShadow === expected;
    }),
  );
}

for (const impl of implementations) {
  test.describe(`paper (${impl})`, () => {
    test("basic: three surfaces at levels 0, 1 and 3", async ({ page }) => {
      await openStory(page, storyId(impl, "paper", "basic"));
      const papers = page.locator("[data-ok-paper]");
      await expect(papers).toHaveCount(3);
      expect(await papers.evaluateAll((all) => all.map((p) => p.dataset["okElevation"]))).toEqual([
        "0",
        "1",
        "3",
      ]);
      expect(await shadows(page)).toEqual([true, true, true]);
      expect(await papers.first().evaluate((p) => getComputedStyle(p).boxShadow)).toBe("none");
    });

    for (const theme of ["light", "dark"] as const) {
      test(`elevation (${theme}): every level casts its shadow, in a light and a dark page`, async ({
        page,
      }) => {
        await openStory(page, storyId(impl, "paper", "elevation"), theme);
        await expect(page.locator("[data-ok-paper]")).toHaveCount(20);
        expect((await shadows(page)).every(Boolean)).toBe(true);
        const backgrounds = await page
          .locator(".sb-paper-levels")
          .evaluateAll((scopes) =>
            scopes.map(
              (scope) =>
                getComputedStyle(scope.querySelector("[data-ok-paper]") as Element).backgroundColor,
            ),
          );
        expect(backgrounds).toEqual(["rgb(255, 255, 255)", "rgb(24, 24, 27)"]);
      });
    }

    test("variants: the outlined paper has a 1px outline and no shadow", async ({ page }) => {
      await openStory(page, storyId(impl, "paper", "variants"));
      const outlined = page.locator('[data-ok-paper][data-ok-variant="outlined"]');
      const style = await outlined.evaluate((p) => {
        const s = getComputedStyle(p);
        return { shadow: s.boxShadow, width: s.borderTopWidth, border: s.borderTopStyle };
      });
      expect(style).toEqual({ shadow: "none", width: "1px", border: "solid" });
      expect(await shadows(page)).toEqual([true, true]);
    });

    test("corners: rounded 10px, square 0", async ({ page }) => {
      await openStory(page, storyId(impl, "paper", "corners"));
      const radii = await page
        .locator("[data-ok-paper]")
        .evaluateAll((all) => all.map((p) => getComputedStyle(p).borderTopLeftRadius));
      expect(radii).toEqual(["10px", "0px"]);
    });

    test("the Controls' variant and square reach every example", async ({ page }) => {
      await openStory(
        page,
        storyId(impl, "paper", "basic"),
        "light",
        "variant:outlined;square:!true",
      );
      const styles = await page.locator("[data-ok-paper]").evaluateAll((all) =>
        all.map((p) => {
          const s = getComputedStyle(p);
          return `${s.boxShadow} ${s.borderTopLeftRadius} ${s.borderTopStyle}`;
        }),
      );
      expect(styles).toEqual(Array(3).fill("none 0px solid"));
    });
  });
}
