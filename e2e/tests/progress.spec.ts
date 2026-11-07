import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

/** Rendered color of a token (hex in CSS) as the engine serializes it. */
const tokenColor = (name: string) => `var(--ok-palette-${name}-main)`;

for (const impl of implementations) {
  test.describe(`progress (${impl})`, () => {
    test("circular colors and determinate arcs, per engine", async ({ page }) => {
      await openStory(page, storyId(impl, "circular-progress", "indeterminate"));
      const colors = await page.evaluate(
        (tokens) =>
          [...document.querySelectorAll<HTMLElement>("[data-ok-circular-progress]")].map((root) => {
            const probe = document.createElement("span");
            const color = root.dataset["okColor"] as string;
            probe.style.color = color === "inherit" ? "inherit" : tokens.replace("NAME", color);
            root.parentElement?.append(probe);
            const expected = getComputedStyle(probe).color;
            probe.remove();
            const circle = root.querySelector("circle") as SVGCircleElement;
            return [getComputedStyle(circle).stroke, expected];
          }),
        tokenColor("NAME"),
      );
      expect(colors).toHaveLength(7);
      for (const [actual, expected] of colors) expect(actual).toBe(expected);

      await openStory(page, storyId(impl, "circular-progress", "determinate"));
      const offsets = await page.evaluate(() =>
        [...document.querySelectorAll("[data-ok-circular-progress] circle")].map((circle) =>
          Number.parseFloat(getComputedStyle(circle).strokeDashoffset),
        ),
      );
      const c = 2 * Math.PI * 20.2;
      expect(offsets.map((o) => Math.round(o))).toEqual(
        [0.75, 0.5, 0.25, 0].map((f) => Math.round(f * c)),
      );
    });

    test("linear determinate and buffer bars sit at their values", async ({ page }) => {
      await openStory(page, storyId(impl, "linear-progress", "buffer"));
      const positions = await page.evaluate(() =>
        [...document.querySelectorAll("[data-ok-linear-progress]")].map((root) => {
          const width = root.getBoundingClientRect().width;
          return ["1", "2"].map((n) => {
            const bar = root.querySelector(`[data-ok-linear-progress-bar="${n}"]`) as Element;
            return Math.round((bar.getBoundingClientRect().right / width) * 100) / 100;
          });
        }),
      );
      expect(positions).toHaveLength(7);
      for (const [one, two] of positions) {
        expect(one).toBeCloseTo(0.25 + 0, 1);
        expect(two).toBeCloseTo(0.3, 1);
      }
    });

    test("Controls change the value in both implementations", async ({ page }) => {
      await openStory(page, storyId(impl, "linear-progress", "determinate"), "light", "value:80");
      const values = await page.evaluate(() =>
        [...document.querySelectorAll("[data-ok-linear-progress]")].map((root) =>
          root.getAttribute("aria-valuenow"),
        ),
      );
      expect(values).toEqual(Array(7).fill("80"));
    });
  });
}

test("HTML: updating aria-valuenow moves the bar (runtime)", async ({ page }) => {
  await openStory(page, storyId("html", "linear-progress", "determinate"));
  const root = page.locator("[data-ok-linear-progress]").first();
  await root.evaluate((element) => element.setAttribute("aria-valuenow", "75"));
  await expect
    .poll(() => root.evaluate((element) => element.style.getPropertyValue("--_ok-progress-value")))
    .toBe("0.75");
});

test("Button loading shows a circular progress in its text color", async ({ page }) => {
  for (const impl of implementations) {
    await openStory(page, storyId(impl, "button", "contained"));
    const spinner = page.locator("[data-ok-button-loader] [data-ok-button-spinner]").first();
    await expect(spinner).toHaveAttribute("data-ok-circular-progress", "");
    const [width, color, buttonColor] = await spinner.evaluate((element) => [
      getComputedStyle(element).width,
      getComputedStyle(element).color,
      getComputedStyle(element.closest("[data-ok-button]") as Element).color,
    ]);
    expect(width).toBe("16px");
    expect(color).toBe(buttonColor);
  }
});
