import { expect, type Page, test } from "@playwright/test";

/**
 * Theme scoping of the shipped CSS (dist), independent of components. Guards the token
 * serialization: light/dark/system scopes, nesting, `.dark`, and per-scope shadow colors.
 */
const LIGHT = { text: "#18181B", paper: "#FFFFFF", shadow: "#1E1A4D" };
const DARK = { text: "#FAFAFA", paper: "#18181B", shadow: "#000000" };

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
    // Space toggles (ADR-0072) leave extra whitespace in substituted values.
    expect(shadow.replace(/\s+/g, " ")).toContain(`COLOR-MIX(IN SRGB, ${scheme.shadow}`);
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

  test("opt-in style sheets (CDN files) style their scope and nest", async ({ page }) => {
    // The shipped minified sheets, linked after owlky.css as the docs say (ADR-0073).
    await page.evaluate(async () => {
      const links = ["swiss", "neo-brutalism"].map((name) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `../../packages/html/dist/owlky-style-${name}.min.css`;
        document.head.append(link);
        return new Promise((resolve, reject) => {
          link.onload = resolve;
          link.onerror = reject;
        });
      });
      await Promise.all(links);
    });
    const paper = (html: string) =>
      page.evaluate((markup) => {
        const host = document.createElement("div");
        host.innerHTML = markup;
        document.body.append(host);
        const style = getComputedStyle(host.querySelector("[data-ok-paper]") as Element);
        const result = {
          radius: style.borderTopLeftRadius,
          border: style.borderTopWidth,
          shadow: style.boxShadow,
          font: style.getPropertyValue("--ok-font-family").trim(),
        };
        host.remove();
        return result;
      }, html);
    const card = '<div data-ok-paper data-ok-elevation="8">Card</div>';
    const soft = await paper(card);
    expect(soft.radius).toBe("10px");
    expect(soft.shadow).not.toBe("none");
    const swiss = await paper(`<div data-ok-style="swiss">${card}</div>`);
    expect(swiss).toMatchObject({ radius: "0px", border: "1px", shadow: "none" });
    expect(swiss.font).toMatch(/^"Inter Variable"/);
    const neo = await paper(`<div data-ok-style="neo-brutalism">${card}</div>`);
    expect(neo).toMatchObject({ radius: "8px", border: "2px" });
    expect(neo.shadow).toMatch(/ 4px 4px 0px 0px$/);
    // Nearest style wins, through a dark scope and a nested default style.
    expect(
      (
        await paper(
          `<div data-ok-style="swiss"><div data-ok-style="neo-brutalism" data-ok-theme="dark">${card}</div></div>`,
        )
      ).shadow,
    ).toMatch(/^rgb\(2[0-5]\d, 2[0-5]\d, 2[0-5]\d\) 4px 4px 0px 0px$/);
    expect(
      await paper(
        `<div data-ok-style="neo-brutalism"><div data-ok-style="soft">${card}</div></div>`,
      ),
    ).toMatchObject({ radius: "10px", border: "0px" });
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
    ).toBe("#615FFF");
  });
});
