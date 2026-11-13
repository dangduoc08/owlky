import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

/**
 * ADR-0068: owlky.js loads a heavy component's ES module from modules/ next to it when the page
 * holds one, `data-ok-preload` loads modules ahead of use, a failed module is reported and retried,
 * and the markup works before its module arrives. The pages have a strict CSP.
 */

/** Module files (not shared chunks) the page requested, by name. */
function moduleRequests(page: Page): string[] {
  const names: string[] = [];
  page.on("request", (request) => {
    const match = /\/packages\/html\/dist\/modules\/([\w-]+)\.js$/.exec(
      new URL(request.url()).pathname,
    );
    if (match?.[1]) names.push(match[1]);
  });
  return names;
}

/** Records CSP violations and `ok:runtime:error` events from the start of the page. */
async function record(page: Page) {
  await page.addInitScript(() => {
    const scope = window as unknown as { violations: string[]; loadErrors: string[] };
    scope.violations = [];
    scope.loadErrors = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      scope.violations.push(`${event.violatedDirective}: ${event.blockedURI}`),
    );
    document.addEventListener("ok:runtime:error", (event) =>
      scope.loadErrors.push((event as CustomEvent<{ module: string }>).detail.module),
    );
  });
}

const recorded = (page: Page) =>
  page.evaluate(() => {
    const scope = window as unknown as { violations: string[]; loadErrors: string[] };
    return { violations: scope.violations, loadErrors: scope.loadErrors };
  });

/** Adds a second chart with DOM methods (the page's Trusted Types policy forbids innerHTML). */
const addChart = (page: Page) =>
  page.locator("#later").evaluate((host) => {
    const el = (tag: string, attrs: Record<string, string> = {}, text?: string) => {
      const node = document.createElement(tag);
      for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
      if (text !== undefined) node.textContent = text;
      return node;
    };
    const figure = el("figure", {
      id: "later-chart",
      "data-ok-chart": "",
      "data-ok-type": "line",
      "data-ok-x-type": "category",
    });
    const table = el("table", { "data-ok-chart-data": "" });
    const head = el("tr");
    head.append(el("th", { scope: "col" }, "Day"));
    head.append(el("th", { scope: "col", "data-ok-color": "info" }, "Visits"));
    const body = el("tbody");
    for (const [day, value] of [
      ["Mon", "3"],
      ["Tue", "5"],
    ]) {
      const row = el("tr");
      row.append(el("th", { scope: "row" }, day), el("td", {}, value));
      body.append(row);
    }
    const thead = el("thead");
    thead.append(head);
    table.append(el("caption", {}, "Later"), thead, body);
    figure.append(table);
    host.append(figure);
  });

test.describe("CDN loader", () => {
  test("loads a heavy component's module when the page holds one", async ({ page }) => {
    await record(page);
    const requested = moduleRequests(page);
    await page.goto("/examples/loader/index.html");
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    await expect(page.locator("#chart [data-ok-chart-bar]").first()).toBeAttached();
    expect(requested).toEqual(["chart"]);
    expect(await page.evaluate(() => window.Owlky?.loaded("chart"))).toBe(true);
    expect(await page.evaluate(() => window.Owlky?.loaded("data-grid"))).toBe(false);
    // A root added later mounts at once: its module is already in.
    await addChart(page);
    await expect(page.locator("#later-chart")).toHaveAttribute("data-ok-ready", "");
    // A root of another module, added later, loads that module.
    await page.locator("#later").evaluate((host) => {
      const motion = document.createElement("div");
      motion.setAttribute("data-ok-motion", "");
      motion.setAttribute("data-ok-variant", "fadeIn");
      motion.textContent = "Moving";
      host.append(motion);
    });
    await expect.poll(() => page.evaluate(() => window.Owlky?.loaded("motion"))).toBe(true);
    expect(requested).toEqual(["chart", "motion"]);
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("a module's stylesheet loads before its code, after the core sheet, in module order", async ({
    page,
  }) => {
    await record(page);
    // Every request for a module's stylesheet or script, in the order the browser sent them.
    const requests: string[] = [];
    page.on("request", (request) => {
      const match = /\/packages\/html\/dist\/modules\/([\w-]+\.(?:css|js))$/.exec(
        new URL(request.url()).pathname,
      );
      if (match?.[1]) requests.push(match[1]);
    });
    await page.goto("/examples/csp/index.html");
    const modules = [
      "chart",
      "illustration",
      "date-picker",
      "data-grid",
      "gantt",
      "carousel",
      "markdown",
      "editor",
      "phone-input",
      "walktour",
    ];
    await expect
      .poll(() => page.evaluate((names) => names.filter((n) => !window.Owlky?.loaded(n)), modules))
      .toEqual([]);
    // The sheet of each module was requested before its script.
    for (const name of modules)
      expect(requests.indexOf(`${name}.css`), `${name}.css before ${name}.js`).toBeLessThan(
        requests.indexOf(`${name}.js`),
      );
    // The core sheet comes first, then the module sheets in the order of families.json, whatever
    // the order the modules loaded in; every sheet has loaded (`sheet` is set).
    const sheets = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
        .filter((link) => /\/(owlky|modules\/[\w-]+)\.css$/.test(link.href))
        .map((link) => ({
          file: /\/((?:modules\/)?[\w-]+)\.css$/.exec(link.href)?.[1] ?? "",
          loaded: Boolean(link.sheet),
        })),
    );
    const { styles: _styles, ...families } = JSON.parse(
      readFileSync(new URL("../../packages/styles/src/families.json", import.meta.url), "utf8"),
    ) as Record<string, unknown>;
    const order = Object.keys(families);
    expect(sheets.map((sheet) => sheet.file)).toEqual([
      "owlky",
      ...order.filter((name) => modules.includes(name)).map((name) => `modules/${name}`),
    ]);
    expect(sheets.every((sheet) => sheet.loaded)).toBe(true);
    // The core sheet doesn't hold the modules' styles: the data grid's header is styled by its own.
    const grid = await page.evaluate(() => {
      const sheet = [...document.styleSheets].find((each) => each.href?.endsWith("/owlky.css"));
      return [...(sheet?.cssRules ?? [])].some((rule) =>
        rule.cssText.includes("data-ok-data-grid"),
      );
    });
    expect(grid).toBe(false);
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("a light page loads only the modules data-ok-preload names", async ({ page }) => {
    await record(page);
    const requested = moduleRequests(page);
    await page.goto("/examples/loader/light.html");
    await page.waitForFunction(() => Boolean(window.Owlky));
    await page.evaluate(() => window.Owlky?.load("data-grid"));
    expect(requested).toEqual(["data-grid"]);
    expect(await page.evaluate(() => window.Owlky?.loaded("chart"))).toBe(false);
    // `load()` resolves at once for light components.
    expect(await page.evaluate(() => window.Owlky?.load("dialog").then(() => "ok"))).toBe("ok");
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("reports a module that fails and retries when the browser is back online", async ({
    page,
    context,
  }) => {
    await record(page);
    let failures = 0;
    await page.route("**/packages/html/dist/modules/chart.js", async (route) => {
      if (failures === 0) {
        failures++;
        await route.abort("internetdisconnected");
      } else await route.continue();
    });
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/examples/loader/index.html");
    await expect.poll(async () => (await recorded(page)).loadErrors).toEqual(["chart"]);
    expect(errors.some((text) => text.includes('Failed to load module "chart"'))).toBe(true);
    // Without its module the chart is its data table, as without JavaScript.
    await expect(page.locator("#chart")).not.toHaveAttribute("data-ok-ready", "");
    await expect(page.getByRole("table", { name: "Deploys per weekday" })).toBeVisible();
    await context.setOffline(true);
    await context.setOffline(false);
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    expect(failures).toBe(1);
  });

  test("on a slow network, the markup works before its module arrives", async ({ page }) => {
    await record(page);
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/packages/html/dist/modules/chart.js", async (route) => {
      await held;
      await route.continue();
    });
    // Firefox and WebKit hold the load event for a pending module import: wait for the DOM only.
    await page.goto("/examples/loader/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.Owlky));
    // Light components work at once; the chart shows its data table until its module runs.
    await expect(page.getByRole("button", { name: "Light" })).toHaveCSS(
      "background-color",
      "rgb(0, 167, 111)",
    );
    await expect(page.getByRole("table", { name: "Deploys per weekday" })).toBeVisible();
    expect(await page.evaluate(() => window.Owlky?.loaded("chart"))).toBe(false);
    release();
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("owlky.mjs loads the same modules from a module script", async ({ page }) => {
    await record(page);
    const requested = moduleRequests(page);
    const scripts: string[] = [];
    page.on("request", (request) => {
      const name = /\/dist\/(owlky\.m?js)$/.exec(new URL(request.url()).pathname)?.[1];
      if (name) scripts.push(name);
    });
    await page.goto("/examples/loader/module.html");
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    // `data-ok-preload` on the module script loaded Motion before any Motion root appeared.
    await expect.poll(() => page.evaluate(() => window.Owlky?.loaded("motion"))).toBe(true);
    expect(requested.sort()).toEqual(["chart", "motion"]);
    expect(scripts).toEqual(["owlky.mjs"]);
    // Light components work as with owlky.js.
    await expect(page.getByRole("button", { name: "Light" })).toHaveCSS(
      "background-color",
      "rgb(0, 167, 111)",
    );
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  test("every module of the strict-CSP page loads without a violation", async ({ page }) => {
    await record(page);
    const requested = moduleRequests(page);
    await page.goto("/examples/csp/index.html");
    const modules = [
      "carousel",
      "chart",
      "data-grid",
      "date-picker",
      "editor",
      "gantt",
      "illustration",
      "markdown",
      "phone-input",
      "walktour",
    ];
    await expect
      .poll(() => page.evaluate((names) => names.filter((n) => !window.Owlky?.loaded(n)), modules))
      .toEqual([]);
    expect([...new Set(requested)].sort()).toEqual(modules);
    // Each module set its components up: one instance per component checked here.
    const mounted = await page.evaluate(() =>
      (
        [
          ["#csp-grid", "data-grid"],
          ["#csp-gantt", "gantt"],
          ["#dc-basic", "date-calendar"],
          ["#csp-markdown", "markdown"],
        ] as const
      ).filter(([selector, name]) => !window.Owlky?.get(document.querySelector(selector), name)),
    );
    expect(mounted).toEqual([]);
    expect(await recorded(page)).toEqual({ violations: [], loadErrors: [] });
  });

  /**
   * The layout shift (Chromium's Layout Instability API) of the loader page while the Chart's
   * module is held back for 500 ms, as on a slow network. `linked`: the page links the Chart's
   * stylesheet in its head (the loader doesn't add it twice); otherwise the loader adds it.
   */
  async function lateChartShift(page: Page, linked: boolean): Promise<number> {
    await page.addInitScript(() => {
      const scope = window as unknown as { shift: number };
      scope.shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[])
          if (!entry.hadRecentInput) scope.shift += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    if (!linked)
      await page.route("**/examples/loader/index.html", async (route) => {
        const response = await route.fetch();
        const html = (await response.text()).replace(/<link[^>]*modules\/chart\.css[^>]*>/, "");
        await route.fulfill({ response, body: html });
      });
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/packages/html/dist/modules/chart.js", async (route) => {
      await held;
      await route.continue();
    });
    await page.goto("/examples/loader/index.html", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("table", { name: "Deploys per weekday" })).toBeVisible();
    // A slow network: the table is on screen for a while before the module arrives.
    await page.waitForTimeout(500);
    release();
    await expect(page.locator("#chart")).toHaveAttribute("data-ok-ready", "");
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const shift = await page.evaluate(() => (window as unknown as { shift: number }).shift);
    test.info().annotations.push({ type: "cumulative layout shift", description: String(shift) });
    return shift;
  }

  test("a chart with its stylesheet linked shifts the content below it by little when it loads late", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "layout-shift entries are Chromium-only");
    // Google's "good" threshold: the docs recommend linking the stylesheet of a heavy component
    // that shows on first paint (and `data-ok-preload` for its module).
    expect(await lateChartShift(page, true)).toBeLessThan(0.1);
  });

  test("a chart whose stylesheet the loader adds shifts the content by little too", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "layout-shift entries are Chromium-only");
    // Without a link the chart's own sheet arrives after the first paint, but the core sheet
    // already holds the figure's box and the data table (chart-first-paint.css), so the page
    // shifts only when the chart draws: under the "good" limit, as with the link.
    expect(await lateChartShift(page, false)).toBeLessThan(0.1);
  });
});
