import { expect, test } from "@playwright/test";
import { editorSelected } from "./helpers.js";

/** S6: the shipped CSS, runtime bundle and snippets work under a strict CSP with Trusted Types. */
test("no CSP or Trusted Types violations", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { violations: string[] }).violations.push(
        `${event.violatedDirective}: ${event.blockedURI}`,
      );
    });
  });
  await page.goto("/examples/csp/index.html");
  await page.waitForFunction(() => Boolean((window as unknown as { Owlky?: unknown }).Owlky));
  await expect(page.getByRole("button", { name: "Primary" })).toHaveCSS(
    "background-color",
    "rgb(0, 167, 111)",
  );
  // The progress runtime writes its custom properties through CSSOM, which the CSP allows.
  await expect(page.getByRole("progressbar", { name: "Upload" })).toHaveCSS("width", "48px");
  await expect
    .poll(() =>
      page
        .getByRole("progressbar", { name: "Video" })
        .evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--_ok-progress-buffer"),
        ),
    )
    .toBe("0.4");
  await expect(page.getByRole("checkbox", { name: "Mixed" })).toHaveJSProperty(
    "indeterminate",
    true,
  );
  await expect
    .poll(() =>
      page
        .locator("[data-ok-text-field]")
        .evaluate((element) => (element as HTMLElement).style.getPropertyValue("--_ok-max-rows")),
    )
    .toBe("3");
  await page.getByRole("textbox", { name: "Notes" }).fill("Hello");
  await page.getByRole("switch", { name: "Wi-Fi" }).click();
  // The Editor (owlky-editor.js, Tiptap) mounts and edits without inline styles or HTML sinks.
  const story = page.getByRole("textbox", { name: "Story" });
  await expect(story).toHaveAttribute("contenteditable", "true");
  await story.focus();
  await story.locator("em").dblclick();
  await editorSelected(story);
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(story.locator("strong")).toHaveText("this");
  await expect(page.getByRole("switch", { name: "Wi-Fi" })).not.toBeChecked();
  expect(
    await page.evaluate(() => (window as unknown as { violations: string[] }).violations),
  ).toEqual([]);
});
