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
        .locator("[data-ok-text-field]:not([data-ok-phone-input])")
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
  // Markdown (owlky-markdown.js, unified) builds DOM with DOM methods; alignment goes through
  // CSSOM; raw HTML is sanitized and unsafe URLs are removed.
  // Illustrations (owlky-illustrations.js) draw with createElementNS and size through CSSOM.
  const illustration = page.locator("#csp-illustration");
  await expect(illustration).toHaveAttribute("viewBox", "0 0 480 360");
  await expect(illustration).toHaveAttribute("aria-hidden", "true");
  await expect(illustration.locator("[data-ok-tone]").first()).toBeAttached();
  await expect(illustration).toHaveCSS("width", "240px");
  // Phone input (owlky-phone.js): the country list is built with DOM methods, typing is formatted.
  const phone = page.getByRole("textbox", { name: "Phone number" });
  await expect(phone).toHaveValue("(02) 9876 5432");
  await expect(page.locator("#csp-phone-country-listbox [role=option]").first()).toBeAttached();
  await phone.fill("");
  await phone.pressSequentially("0312345678");
  await expect(phone).toHaveValue("(03) 1234 5678");
  const markdown = page.locator("#csp-markdown");
  await expect(markdown.getByRole("heading", { name: "Notes" })).toBeVisible();
  await expect(markdown.getByRole("cell", { name: "3" })).toHaveCSS("text-align", "right");
  await expect(markdown.locator("span")).toHaveCSS("text-transform", "uppercase");
  await expect(markdown.getByRole("checkbox", { name: "Ship it" })).toBeChecked();
  // The unsafe link keeps its text but loses its URL (so it is no longer a link).
  await expect(markdown.locator("a", { hasText: "unsafe" })).not.toHaveAttribute("href");
  await expect(markdown.locator("img[onerror], script")).toHaveCount(0);
  // Image: the load state is an attribute; the error icon is built with createElementNS.
  await page.locator("#csp-image-broken").scrollIntoViewIfNeeded();
  await expect(page.locator("#csp-image")).toHaveAttribute("data-ok-state", "loaded");
  await expect(page.locator("#csp-image-broken")).toHaveAttribute("data-ok-state", "error");
  await expect(page.locator("#csp-image-broken [data-ok-image-icon]")).toBeVisible();
  // The Gantt builds its treegrid and SVG with DOM methods and positions bars through CSSOM.
  const gantt = page.locator("#csp-gantt");
  await expect(gantt.getByRole("treegrid", { name: "Release plan" })).toBeVisible();
  await expect(gantt.locator("[data-ok-gantt-link]")).toHaveCount(1);
  expect(
    await gantt
      .locator('[data-ok-task-id="build"] [data-ok-gantt-bar]')
      .evaluate((element) => (element as HTMLElement).style.getPropertyValue("--_ok-gantt-w")),
  ).toBe("144px");
  // The walktour draws its spotlight with an SVG path and places the step through CSSOM.
  await page.getByRole("button", { name: "Start the tour" }).click();
  const step = page.getByRole("dialog", { name: "Notes" });
  await expect(step).toBeVisible();
  await expect(step.getByRole("button", { name: "Done" })).toBeFocused();
  await expect(page.locator("[data-ok-walktour-mask]")).toHaveAttribute("d", /^M0 0H\d+V\d+H0Z M/);
  expect(
    await step.evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--_ok-walktour-width"),
    ),
  ).toBe("320px");
  await page.keyboard.press("Escape");
  await expect(step).toBeHidden();
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
