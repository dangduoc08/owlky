import { expect, test } from "@playwright/test";
import { implementations, openStory, storyId } from "./helpers.js";

const background = (page: import("@playwright/test").Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

for (const impl of implementations) {
  test(`light and dark themes (${impl})`, async ({ page }) => {
    await openStory(page, storyId(impl, "button", "colors"), "light");
    expect(await background(page, '[data-mt-color="inherit"]')).toBe("rgb(28, 37, 46)");
    expect(await background(page, '[data-mt-color="primary"]')).toBe("rgb(0, 167, 111)");

    await openStory(page, storyId(impl, "button", "colors"), "dark");
    expect(await background(page, '[data-mt-color="inherit"]')).toBe("rgb(255, 255, 255)");
    expect(await background(page, "body")).toBe("rgb(20, 26, 33)");

    await openStory(page, storyId(impl, "dialog", "basic"), "dark");
    await page.getByRole("button", { name: "Open dialog" }).click();
    expect(await background(page, "[data-mt-dialog-content]")).toBe("rgb(28, 37, 46)");
  });
}

test("a nested data-mt-theme scope overrides the page theme", async ({ page }) => {
  await openStory(page, storyId("html", "button", "variants"), "dark");
  const color = await page.evaluate(() => {
    const scope = document.createElement("div");
    scope.dataset["mtTheme"] = "light";
    scope.innerHTML = '<button data-mt-button data-mt-variant="contained">x</button>';
    document.body.append(scope);
    return getComputedStyle(scope.querySelector("button") as Element).backgroundColor;
  });
  expect(color).toBe("rgb(28, 37, 46)");
});
