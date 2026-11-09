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
  // The time clock rebuilds its numbers with DOM methods and turns the hand through CSSOM.
  const clock = page.locator("#tc-basic");
  await clock.getByRole("listbox").focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(clock).toHaveAttribute("data-ok-view", "minutes");
  await expect
    .poll(() =>
      clock
        .locator("[data-ok-time-clock-pointer]")
        .evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--_ok-clock-angle"),
        ),
    )
    .toBe("180deg");
  // The chart builds its SVG with createElementNS and places the tooltip through CSSOM.
  const chart = page.getByRole("group", { name: "Visits" });
  await expect(chart.locator("[data-ok-chart-area]")).toHaveCount(2);
  await chart.focus();
  await page.keyboard.press("End");
  await expect(chart.getByRole("status")).toContainText("Wed");
  await expect
    .poll(() =>
      chart
        .getByRole("status")
        .evaluate((element) =>
          (element as HTMLElement).style.getPropertyValue("--_ok-chart-tip-x"),
        ),
    )
    .toMatch(/^\d+px$/);
  // The date calendar rebuilds months with DOM methods and patches days in place.
  const calendar = page.locator("#dc-basic");
  await calendar.getByRole("button", { name: "Next month" }).click();
  await calendar.locator('[data-ok-date="2025-06-12"]').click();
  await expect(calendar.locator('[data-ok-date="2025-06-12"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  // The date range calendar picks a start and an end and draws the band with attributes.
  const range = page.locator("#rc-one");
  await range.locator('[data-ok-date="2025-05-10"]').click();
  await range.locator('[data-ok-date="2025-05-12"]').click();
  await expect(range).toHaveAttribute("data-ok-value", "2025-05-10/2025-05-12");
  await expect(range.locator('[data-ok-date="2025-05-11"]')).toHaveAttribute(
    "data-ok-in-range",
    "",
  );
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
  // A text transform from markup without a style attribute; fullscreen locks scroll through CSSOM.
  await expect(story.locator("span")).toHaveCSS("text-transform", "uppercase");
  await page.getByRole("button", { name: "Fullscreen" }).click();
  await expect(page.locator("[data-ok-editor] > [data-ok-backdrop]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-ok-editor] > [data-ok-backdrop]")).toBeHidden();
  await expect(page.getByRole("switch", { name: "Wi-Fi" })).not.toBeChecked();
  // The carousel sizes slides, reorders a loop and writes tweens through CSSOM.
  const carousel = page.getByRole("region", { name: "Photos" });
  await expect(carousel).toHaveAttribute("data-ok-looping", "");
  await carousel.getByRole("button", { name: "Next slide" }).click();
  await expect(carousel.getByRole("group", { name: "2 of 4" })).toHaveAttribute(
    "data-ok-snapped",
    "",
  );
  expect(
    await carousel.evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--_ok-carousel-basis-xs"),
    ),
  ).toBe("70%");
  expect(
    await page.evaluate(() => (window as unknown as { violations: string[] }).violations),
  ).toEqual([]);
});

/**
 * ADR-0034: the Code editor's documented policy (Monaco needs inline styles, data: fonts and its
 * Trusted Types policies; scripts stay 'self'). Monaco and its workers load from dist/monaco/.
 */
test("the code editor works under its documented CSP", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { violations: string[] }).violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { violations: string[] }).violations.push(
        `${event.violatedDirective}: ${event.blockedURI}`,
      );
    });
  });
  await page.goto("/examples/csp/code-editor.html");
  const code = page.locator("#code");
  const diff = page.locator("#diff");
  await expect(code).toHaveAttribute("data-ok-status", "ready");
  await expect(diff).toHaveAttribute("data-ok-status", "ready");
  // Typing goes through Monaco; the JSON worker (a module worker from paths.vs) validates.
  await code.locator(".view-lines").getByText('"tabSize"').click();
  await page.keyboard.press("End");
  await page.keyboard.type(",");
  await expect(code.locator(".squiggly-error").first()).toBeAttached();
  // The diff editor's worker computed the changes.
  await expect(diff.locator(".char-insert, .line-insert").first()).toBeAttached();
  expect(
    await page.evaluate(() => (window as unknown as { violations: string[] }).violations),
  ).toEqual([]);
});
