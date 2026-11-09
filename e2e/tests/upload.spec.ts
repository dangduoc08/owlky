import { expect, type Page, test } from "@playwright/test";
import { implementations, normalizeStory, openStory, storyId } from "./helpers.js";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const FILES = [
  { name: "photo.png", mimeType: "image/png", buffer: PNG },
  { name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(2048) },
  { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
];

/** Drops files on the zone with a real DataTransfer. */
async function dropFiles(page: Page, names: string[]) {
  const data = await page.evaluateHandle((list) => {
    const transfer = new DataTransfer();
    for (const name of list)
      transfer.items.add(
        new File(["x".repeat(10)], name, {
          type: name.endsWith(".png") ? "image/png" : "text/plain",
        }),
      );
    return transfer;
  }, names);
  const zone = page.locator("[data-ok-upload-zone]").first();
  await zone.dispatchEvent("dragenter", { dataTransfer: data });
  await zone.dispatchEvent("dragover", { dataTransfer: data });
  await zone.dispatchEvent("drop", { dataTransfer: data });
}

const names = (page: Page) => page.locator("[data-ok-upload-item-name]").allTextContents();

for (const impl of implementations) {
  test.describe(`upload (${impl})`, () => {
    test("a press on the zone opens the file dialog; picked files are listed and submitted", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "upload", "multiple"));
      const chooser = page.waitForEvent("filechooser");
      await page.locator("[data-ok-upload-zone]").click();
      await (await chooser).setFiles(FILES);
      await expect.poll(() => names(page)).toEqual(["photo.png", "report.pdf", "notes.txt"]);
      expect(
        await page
          .locator("[data-ok-upload-input]")
          .evaluate((i: HTMLInputElement) => i.files?.length),
      ).toBe(3);
      await expect(page.locator("[data-ok-upload-actions]")).toBeVisible();
      await expect(page.getByRole("button", { name: "Remove report.pdf" })).toBeVisible();
    });

    test("keyboard: Tab to the zone (focus ring), Enter opens the dialog, remove buttons move the focus", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName === "webkit", "WebKit on macOS doesn't Tab to file inputs by default.");
      // File chooser interception starts asynchronously: turn it on before any key is pressed.
      page.on("filechooser", () => {});
      await openStory(page, storyId(impl, "upload", "multiple"));
      await page.keyboard.press("Tab");
      const input = page.locator("[data-ok-upload-input]");
      await expect(input).toBeFocused();
      const outline = await page
        .locator("[data-ok-upload-zone]")
        .evaluate((zone) => getComputedStyle(zone).outlineStyle);
      expect(outline).toBe("solid");
      const chooser = page.waitForEvent("filechooser");
      await page.keyboard.press("Enter");
      await (await chooser).setFiles(FILES);
      await expect.poll(() => names(page)).toHaveLength(3);
      await page.getByRole("button", { name: "Remove photo.png" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: "Remove report.pdf" })).toBeFocused();
      await page.keyboard.press("Space");
      await expect(page.getByRole("button", { name: "Remove notes.txt" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(input).toBeFocused();
      await expect(page.locator("[data-ok-upload-actions]")).toBeHidden();
    });

    test("drops files, checks them and lists the rejections", async ({ page }) => {
      await openStory(page, storyId(impl, "upload", "validation"));
      await dropFiles(page, ["a.png", "b.txt", "c.png"]);
      await expect.poll(() => names(page)).toEqual(["a.png", "c.png"]);
      await expect(page.getByRole("alert")).toContainText("b.txt");
      await expect(page.locator("[data-ok-upload]")).not.toHaveAttribute("data-ok-drag", /.*/);
      await dropFiles(page, ["d.png", "e.png"]);
      await expect(page.getByRole("alert")).toContainText("Too many files");
      await expect.poll(() => names(page)).toEqual(["a.png", "c.png", "d.png"]);
    });

    test("single file: the photo fills the zone and the remove button clears it", async ({
      page,
    }) => {
      await openStory(page, storyId(impl, "upload", "single"));
      await page.locator("[data-ok-upload-input]").setInputFiles([FILES[0] as (typeof FILES)[0]]);
      const image = page.locator("[data-ok-upload-preview] img");
      await expect(image).toHaveAttribute("src", /^blob:/);
      await expect(image).toHaveAttribute("alt", "photo.png");
      await page.getByRole("button", { name: "Remove photo.png" }).click();
      await expect(page.locator("[data-ok-upload-preview]")).toHaveCount(0);
      await expect(page.getByText("Drop or select a file")).toBeVisible();
    });

    test("avatar: Update photo shows over the photo", async ({ page }) => {
      await openStory(page, storyId(impl, "upload", "avatar"));
      await page.locator("[data-ok-upload-input]").setInputFiles([FILES[0] as (typeof FILES)[0]]);
      await expect(page.locator("[data-ok-upload-preview] img")).toHaveAttribute("src", /^blob:/);
      await expect(page.getByLabel("Update photo")).toBeAttached();
      await expect(page.locator("[data-ok-upload-placeholder]")).toHaveCSS("opacity", "0");
    });

    test("noClick: the zone doesn't open the dialog; the button does", async ({ page }) => {
      await openStory(page, storyId(impl, "upload", "open-dialog"));
      let opened = 0;
      page.on("filechooser", () => opened++);
      await page.locator("[data-ok-upload-zone]").click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(200);
      expect(opened).toBe(0);
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Open file dialog" }).click();
      await chooser;
    });

    test("the disabled upload takes no files", async ({ page }) => {
      await openStory(page, storyId(impl, "upload", "states"));
      const disabled = page.locator("[data-ok-upload-input]").nth(1);
      await expect(disabled).toBeDisabled();
      await expect(page.locator("[data-ok-upload-zone]").nth(1)).toHaveCSS("opacity", "0.48");
    });
  });
}

test("with files, React and HTML render the same list and rejections", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Structure is browser-independent.");
  const snapshots: unknown[] = [];
  for (const impl of implementations) {
    // Thumbnails off: previews are object URLs, different on each page.
    await openStory(
      page,
      storyId(impl, "upload", "multiple"),
      "light",
      "thumbnail:!false;maxFiles:3",
    );
    await dropFiles(page, ["a.png", "b.txt", "c.png", "d.png", "e.png"]);
    await expect.poll(() => names(page)).toHaveLength(3);
    snapshots.push(await normalizeStory(page));
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
});
