import { expect, type Page, test } from "@playwright/test";

/**
 * Theme scoping of the shipped CSS (dist), independent of components. Guards the token
 * serialization: light/dark/system scopes, nesting, `.dark`, and per-scope shadow colors.
 */
const LIGHT = { text: "#1C252E", paper: "#FFFFFF", shadow: "#919EAB" };
const DARK = { text: "#FFFFFF", paper: "#1C252E", shadow: "#000000" };

async function tokensOf(page: Page, setup: string) {
  return page.evaluate((html) => {
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const target = host.querySelector("#probe") ?? host;
    const style = getComputedStyle(target);
    const read = (name: string) => style.getPropertyValue(name).trim();
    const result = {
      text: read("--ok-text-primary").toUpperCase(),
      paper: read("--ok-bg-paper").toUpperCase(),
      z8: read("--ok-shadow-z8").toUpperCase(),
      elevation: read("--ok-elevation-1").toUpperCase(),
      card: read("--ok-shadow-card").toUpperCase(),
    };
    host.remove();
    return result;
  }, setup);
}

function expectScheme(tokens: Awaited<ReturnType<typeof tokensOf>>, scheme: typeof LIGHT) {
  expect(tokens.text).toBe(scheme.text);
  expect(tokens.paper).toBe(scheme.paper);
  for (const shadow of [tokens.z8, tokens.elevation, tokens.card]) {
    expect(shadow).toContain(`COLOR-MIX(IN SRGB, ${scheme.shadow}`);
  }
}

test.describe("theme scopes (shipped CSS)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/plain-html/index.html");
  });

  test("root is light by default", async ({ page }) => {
    expectScheme(await tokensOf(page, '<div id="probe"></div>'), LIGHT);
  });

  test("data-ok-theme=dark and .dark on the root", async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute("data-ok-theme", "dark"));
    expectScheme(await tokensOf(page, '<div id="probe"></div>'), DARK);
    await page.evaluate(() => {
      document.documentElement.removeAttribute("data-ok-theme");
      document.documentElement.classList.add("dark");
    });
    expectScheme(await tokensOf(page, '<div id="probe"></div>'), DARK);
  });

  test("nested scopes override their ancestors", async ({ page }) => {
    expectScheme(await tokensOf(page, '<div data-ok-theme="dark"><p id="probe"></p></div>'), DARK);
    expectScheme(await tokensOf(page, '<div class="dark"><p id="probe"></p></div>'), DARK);
    await page.evaluate(() => document.documentElement.setAttribute("data-ok-theme", "dark"));
    expectScheme(
      await tokensOf(page, '<div data-ok-theme="light"><p id="probe"></p></div>'),
      LIGHT,
    );
    expectScheme(
      await tokensOf(
        page,
        '<div data-ok-theme="light"><div data-ok-theme="dark"><p id="probe"></p></div></div>',
      ),
      DARK,
    );
  });

  test("an explicit data-ok-theme=light wins over .dark on the same element", async ({ page }) => {
    expectScheme(
      await tokensOf(page, '<div id="probe" class="dark" data-ok-theme="light"></div>'),
      LIGHT,
    );
  });

  test("system follows prefers-color-scheme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    expectScheme(
      await tokensOf(page, '<div data-ok-theme="system"><p id="probe"></p></div>'),
      DARK,
    );
    await page.emulateMedia({ colorScheme: "light" });
    expectScheme(
      await tokensOf(page, '<div data-ok-theme="system"><p id="probe"></p></div>'),
      LIGHT,
    );
  });

  test("responsive typography and color bindings", async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 800 });
    const read = (name: string, html = '<div id="probe"></div>') =>
      page.evaluate(
        ([n, h]) => {
          const host = document.createElement("div");
          host.innerHTML = h as string;
          document.body.append(host);
          const value = getComputedStyle(host.querySelector("#probe") as Element)
            .getPropertyValue(n as string)
            .trim();
          host.remove();
          return value;
        },
        [name, html],
      );
    expect(await read("--ok-typography-h1-font-size")).toBe("4rem");
    await page.setViewportSize({ width: 375, height: 800 });
    expect(await read("--ok-typography-h1-font-size")).toBe("2.5rem");
    expect(await read("--ok-c-main", '<div data-ok-color="primary"><p id="probe"></p></div>')).toBe(
      "",
    );
    expect(
      (await read("--ok-c-main", '<div id="probe" data-ok-color="primary"></div>')).toUpperCase(),
    ).toBe("#00A76F");
  });
});
