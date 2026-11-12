import buttonCss from "@owlky/styles/components/button.css?url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "../runtime/define.js";
import { createRuntime } from "../runtime/runtime.js";
import type { Runtime } from "../runtime/types.js";
import { resetPage, settle } from "../test-utils.js";
import { installLoader, moduleBase, preloadNames } from "./loader.js";
import type { LazyModule } from "./modules.js";

const runtimes: Runtime[] = [];
const pageLinks = new Set(document.querySelectorAll("link"));
afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.stop();
  // Stylesheets the tests or the loader added.
  for (const link of document.querySelectorAll("link")) if (!pageLinks.has(link)) link.remove();
  resetPage();
  vi.restoreAllMocks();
});

// Stylesheets that load: two component files the test server serves from one folder.
const SHEETS = new URL("./", new URL(buttonCss, location.href)).href;
const MODULES: Record<string, LazyModule> = {
  demo: { selector: "[data-ok-demo]", definitions: ["demo"] },
  button: { selector: "[data-ok-xbutton]", definitions: ["button"], stylesheet: true },
  chip: { selector: "[data-ok-xchip]", definitions: ["chip"], stylesheet: true },
};

/** A runtime with the loader over MODULES; `importModule` registers the module's definition. */
function setup(options: { fail?: number; preload?: string[]; base?: string } = {}) {
  const runtime = createRuntime();
  runtimes.push(runtime);
  const setups: string[] = [];
  const imports: string[] = [];
  let failures = options.fail ?? 0;
  const importModule = vi.fn(async (url: string) => {
    imports.push(url);
    if (failures > 0) {
      failures--;
      throw new TypeError("Failed to fetch dynamically imported module");
    }
    const name = /([a-z]+)\.js$/.exec(url)?.[1] ?? "";
    runtime.register(
      defineComponent({
        name,
        selector: `[data-ok-${name}]`,
        setup(element) {
          setups.push(`${name}:${element.id}`);
          return {};
        },
      }),
    );
  });
  const loader = installLoader(runtime, {
    base: options.base ?? "https://cdn.example/owlky/modules/",
    modules: MODULES,
    importModule,
    ...(options.preload ? { preload: options.preload } : {}),
  });
  runtime.start();
  return { runtime, loader, setups, imports, importModule };
}

const add = (html: string) => {
  const host = document.createElement("div");
  host.setAttribute("data-test-host", "");
  host.innerHTML = html;
  document.body.append(host);
  return host;
};

/** Resolves when `count` stylesheets the loader added have loaded or failed. */
const sheetsSettled = () =>
  Promise.all(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(
      (link) =>
        link.sheet ||
        new Promise((resolve) => {
          link.addEventListener("load", resolve, { once: true });
          link.addEventListener("error", resolve, { once: true });
        }),
    ),
  );

describe("module loader (ADR-0068)", () => {
  it("loads a module when the page holds one of its roots, once", async () => {
    add('<div id="a" data-ok-demo></div><div id="b" data-ok-demo></div>');
    const { runtime, setups, imports } = setup();
    expect(runtime.loaded("demo")).toBe(false);
    await runtime.load("demo");
    expect(imports).toEqual(["https://cdn.example/owlky/modules/demo.js"]);
    expect(setups).toEqual(["demo:a", "demo:b"]);
    expect(runtime.loaded("demo")).toBe(true);
    // Roots added later mount through the real definition; the module isn't imported again.
    add('<div id="c" data-ok-demo></div>');
    await settle();
    expect(setups).toEqual(["demo:a", "demo:b", "demo:c"]);
    expect(imports).toHaveLength(1);
  });

  it("finds roots that are added after start", async () => {
    const { runtime, imports } = setup();
    expect(imports).toEqual([]);
    add('<div id="a" data-ok-demo></div>');
    await settle();
    await runtime.load("demo");
    expect(imports).toHaveLength(1);
  });

  it("skips roots owned by another implementation", async () => {
    add('<div data-ok-runtime="off"><div data-ok-demo></div></div>');
    const { imports } = setup();
    await settle();
    expect(imports).toEqual([]);
  });

  it("preloads named modules and warns about unknown names", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { runtime, imports } = setup({ preload: ["demo", "nope"] });
    await runtime.load("demo");
    expect(imports).toEqual(["https://cdn.example/owlky/modules/demo.js"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope"'));
  });

  it("attaches a module's stylesheet before its code, after the core sheet, in module order", async () => {
    const sheet = (href: string) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-test-sheet", "");
      return link;
    };
    document.head.append(sheet("/test-core/owlky.css"), sheet("/test-app/app.css"));
    const { runtime, importModule } = setup({ base: SHEETS });
    let loadedAtImport = false;
    importModule.mockImplementation(async () => {
      const link = document.querySelector<HTMLLinkElement>(`link[href="${SHEETS}chip.css"]`);
      loadedAtImport = Boolean(link?.sheet);
    });
    await runtime.load("chip");
    // The module's code runs only once its stylesheet has loaded.
    expect(loadedAtImport).toBe(true);
    await runtime.load("button");
    await sheetsSettled();
    const order = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
      .map((link) => new URL(link.href).pathname.split("/").slice(-1)[0])
      .filter((file) => ["owlky.css", "button.css", "chip.css", "app.css"].includes(file ?? ""));
    // `button` comes before `chip` in the table, whatever the load order; both before app.css.
    expect(order).toEqual(["owlky.css", "button.css", "chip.css", "app.css"]);
  });

  it("doesn't add a stylesheet the page links itself", async () => {
    const own = document.createElement("link");
    own.rel = "stylesheet";
    own.href = `${SHEETS}chip.css`;
    own.setAttribute("data-test-sheet", "");
    document.head.append(own);
    const { runtime } = setup({ base: SHEETS });
    await runtime.load("chip");
    expect(document.querySelectorAll(`link[href="${SHEETS}chip.css"]`)).toHaveLength(1);
  });

  it("reports a failure, then loads on the next call", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const events: CustomEvent[] = [];
    document.addEventListener("ok:runtime:error", (event) => events.push(event as CustomEvent), {
      once: true,
    });
    add('<div id="a" data-ok-demo></div>');
    const { runtime, setups } = setup({ fail: 1 });
    await expect(runtime.load("demo")).rejects.toThrow("dynamically imported");
    expect(runtime.loaded("demo")).toBe(false);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load module "demo"'),
      expect.any(TypeError),
    );
    expect(events[0]?.detail).toMatchObject({
      module: "demo",
      url: "https://cdn.example/owlky/modules/demo.js",
    });
    await runtime.load("demo");
    expect(setups).toEqual(["demo:a"]);
  });

  it("retries once when the browser comes back online", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    add('<div id="a" data-ok-demo></div>');
    const { runtime, imports, setups } = setup({ fail: 1 });
    await expect(runtime.load("demo")).rejects.toThrow();
    dispatchEvent(new Event("online"));
    // The retry is pending: load() returns its promise instead of starting another import.
    await runtime.load("demo");
    expect(imports).toHaveLength(2);
    expect(setups).toEqual(["demo:a"]);
  });

  it("reports a stylesheet that fails and doesn't run the module", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { runtime, imports } = setup({ base: "http://127.0.0.1:9/m/" });
    const events: CustomEvent[] = [];
    document.addEventListener("ok:runtime:error", (event) => events.push(event as CustomEvent), {
      once: true,
    });
    await expect(runtime.load("button")).rejects.toThrow("Stylesheet failed");
    expect(imports).toEqual([]);
    expect(events[0]?.detail.url).toBe("http://127.0.0.1:9/m/button.css");
    expect(document.querySelector('link[href$="/m/button.css"]')).toBeNull();
  });

  it("resolves for registered components and rejects unknown modules", async () => {
    const { runtime } = setup();
    runtime.register(defineComponent({ name: "light", selector: "[data-x]", setup: () => ({}) }));
    await expect(runtime.load("light")).resolves.toBeUndefined();
    expect(runtime.loaded("light")).toBe(true);
    await expect(runtime.load("nope")).rejects.toThrow('Unknown module "nope"');
  });

  it("keeps the first loader of a runtime (a second copy of owlky.js)", async () => {
    const { runtime, imports } = setup();
    const second = vi.fn(async () => {});
    installLoader(runtime, {
      base: "https://other.example/",
      modules: MODULES,
      importModule: second,
      preload: ["demo"],
    });
    await runtime.load("demo");
    expect(second).not.toHaveBeenCalled();
    expect(imports).toEqual(["https://cdn.example/owlky/modules/demo.js"]);
  });

  it("rejects load() on a runtime without a loader", async () => {
    const runtime = createRuntime();
    runtimes.push(runtime);
    await expect(runtime.load("chart")).rejects.toThrow("No module loader");
    expect(runtime.loaded("chart")).toBe(false);
  });
});

describe("module base and preload names", () => {
  it("resolves modules/ next to the script, or the data-ok-modules folder", () => {
    const script = document.createElement("script");
    script.src = "https://cdn.example/npm/@owlky/html/dist/owlky.js";
    expect(moduleBase(script)).toBe("https://cdn.example/npm/@owlky/html/dist/modules/");
    script.setAttribute("data-ok-modules", "/static/owlky");
    expect(moduleBase(script)).toBe(new URL("/static/owlky/", document.baseURI).href);
    expect(moduleBase(null)).toBe(new URL("modules/", document.baseURI).href);
  });

  it("splits data-ok-preload on spaces and commas", () => {
    expect(preloadNames(" chart, data-grid  gantt ")).toEqual(["chart", "data-grid", "gantt"]);
    expect(preloadNames(null)).toEqual([]);
  });
});
