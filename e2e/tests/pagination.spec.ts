import { defaultTheme } from "@owlky/tokens";
import { expect, type Page, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";
import { viewports } from "./viewports.js";

/** Page numbers of the first pagination (`*` = current), `…` for ellipses. */
const range = (page: Page) =>
  page
    .locator("#storybook-root nav[data-ok-pagination]")
    .first()
    .evaluate((nav) =>
      [...nav.querySelectorAll("li > *")]
        .filter(
          (el) =>
            el.getAttribute("data-ok-type") === "page" ||
            el.hasAttribute("data-ok-pagination-ellipsis"),
        )
        .map((el) =>
          el.hasAttribute("data-ok-pagination-ellipsis")
            ? "…"
            : `${el.textContent}${el.getAttribute("aria-current") ? "*" : ""}`,
        ),
    );

for (const impl of implementations) {
  test.describe(`pagination (${impl})`, () => {
    test("click / tap and keyboard change the page and the range", async ({ page, isMobile }) => {
      await openStory(page, storyId(impl, "pagination", "sizes"));
      const nav = page.locator("#storybook-root nav[data-ok-pagination]").nth(1);
      const press = (name: string) =>
        isMobile
          ? nav.getByRole("button", { name, exact: true }).tap()
          : nav.getByRole("button", { name, exact: true }).click();
      expect(await range(page)).toEqual(["1*", "2", "3", "4", "5", "…", "10"]);
      await press("Go to page 5");
      await expect(nav.getByRole("button", { name: "page 5", exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await press("Go to next page");
      await expect(nav.locator('[aria-current="page"]')).toHaveText("6");
      await nav.getByRole("button", { name: "Go to page 7" }).focus();
      await page.keyboard.press("Enter");
      await expect(nav.locator('[aria-current="page"]')).toHaveText("7");
      await expect(nav.getByRole("button", { name: "page 7", exact: true })).toBeFocused();
    });

    test("ranges match the reference", async ({ page }) => {
      await openStory(page, storyId(impl, "pagination", "ranges"));
      const all = await page
        .locator("#storybook-root nav[data-ok-pagination]")
        .evaluateAll((navs) =>
          navs.map((nav) =>
            [...nav.querySelectorAll("li > *")]
              .filter((el) => !["previous", "next"].includes(el.getAttribute("data-ok-type") ?? ""))
              .map((el) =>
                el.getAttribute("aria-current") ? `${el.textContent}*` : el.textContent,
              )
              .join(" "),
          ),
        );
      expect(all).toEqual([
        "1 … 6* … 11",
        "1 … 5 6* 7 … 11",
        "1 2 … 6* … 10 11",
        "1 2 … 5 6* 7 … 10 11",
      ]);
    });

    test("each color reaches the current page in every engine", async ({ page }) => {
      // Parity can't catch this: both implementations share the CSS.
      await openStory(page, storyId(impl, "pagination", "variants"));
      const colors = await page
        .locator('nav[data-ok-pagination][data-ok-variant="text"]')
        .evaluateAll((navs) =>
          navs.map((nav) => [
            nav.getAttribute("data-ok-color"),
            getComputedStyle(nav.querySelector("[aria-current]") as Element).backgroundColor,
          ]),
        );
      const hex = (value: string) => {
        const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16));
        return `rgb(${r}, ${g}, ${b})`;
      };
      const { palette, grey } = defaultTheme;
      expect(colors).toEqual([
        ["standard", hex(grey[800])],
        ...(["primary", "secondary", "info", "success", "warning", "error"] as const).map(
          (name) => [name, hex(palette[name].main)],
        ),
      ]);
    });

    test("disabled pagination can't be used", async ({ page }) => {
      await openStory(page, storyId(impl, "pagination", "shapes"));
      const disabled = page.locator("nav[data-ok-pagination][data-ok-disabled]").first();
      await expect(disabled.getByRole("button", { name: "Go to page 2" })).toBeDisabled();
    });
  });

  test.describe(`pagination responsive (${impl})`, () => {
    for (const viewport of viewports) {
      test(`${viewport.name}: wraps, never overflows, targets ≥ 24px, items don't overlap`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "Layout matrix runs once.");
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const story of ["shapes", "variants", "sizes", "buttons", "ranges", "custom-icons"]) {
          await openStory(page, storyId(impl, "pagination", story));
          const problems = await page.evaluate(() => {
            const out: string[] = [];
            if (document.documentElement.scrollWidth > window.innerWidth)
              out.push("page overflows");
            for (const nav of document.querySelectorAll(
              "#storybook-root nav[data-ok-pagination]",
            )) {
              const boxes = [...nav.querySelectorAll("li > *")].map((el) =>
                el.getBoundingClientRect(),
              );
              boxes.forEach((box, i) => {
                if (box.right > window.innerWidth + 0.5) out.push("item beyond viewport");
                if (box.width < 24 || box.height < 24)
                  out.push(`target ${box.width}×${box.height}`);
                for (const other of boxes.slice(0, i))
                  if (
                    box.left < other.right - 0.5 &&
                    other.left < box.right - 0.5 &&
                    box.top < other.bottom - 0.5 &&
                    other.top < box.bottom - 0.5
                  )
                    out.push("items overlap");
              });
            }
            return out;
          });
          expect(problems, story).toEqual([]);
        }
      });
    }
  });
}
