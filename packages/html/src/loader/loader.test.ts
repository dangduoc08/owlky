import buttonCss from "@owlky/styles/components/button.css?url";
import { afterEach, describe, expect, it, vi } from "vitest";
import swissSheet from "../../dist/owlky-style-swiss.min.css?url";
import { defineComponent } from "../runtime/define.js";
import { createRuntime } from "../runtime/runtime.js";
import type { Runtime } from "../runtime/types.js";
import { resetPage, settle } from "../test-utils.js";
import { installLoader, moduleBase, preloadNames, styleBase } from "./loader.js";
import type { LazyModule } from "./modules.js";

const runtimes: Runtime[] = [];
const pageLinks = new Set(document.querySelectorAll("link"));
afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.stop();
  // Stylesheets the tests or the loader added.
  for (const link of document.querySelectorAll("link")) if (!pageLinks.has(link)) link.remove();
  for (const element of document.querySelectorAll("[data-ok-style]"))
    element.removeAttribute("data-ok-style");
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
function setup(
  options: { fail?: number; preload?: string[]; base?: string; styles?: string | null } = {},
) {
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
    ...("styles" in options ? { styles: options.styles } : {}),
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

/** The folder of the built CDN files (`owlky.css`, `owlky-style-<id>.css`). */
const DIST = new URL("./", new URL(swissSheet, location.href)).href;

const styleLinks = () =>
  [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
    .map((link) => link.href)
    .filter((href) => href.includes("owlky-style-"));

/** Resolves once the loader has dealt with `name` (loaded or failed). */
const settled = (runtime: Runtime, name: string) => runtime.load(name).catch(() => {});

const coreLink = (href: string) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
  return link;
};

describe("design style sheets (ADR-0070 § 6)", () => {
  it("adds a style's sheet once for a data-ok-style in the page, right after the core sheet", async () => {
    const core = coreLink(`${DIST}owlky.min.css`);
    const app = coreLink(`${DIST}snippets/app.css`);
    add('<div id="a" data-ok-style="swiss"></div><div data-ok-style="swiss"></div>');
    const { runtime } = setup();
    expect(styleLinks()).toEqual([`${DIST}owlky-style-swiss.min.css`]);
    await runtime.load("style:swiss");
    expect(core.nextElementSibling).toBe(document.querySelector('link[href$="swiss.min.css"]'));
    expect(app.previousElementSibling?.getAttribute("href")).toContain("owlky-style-swiss");
    expect(runtime.loaded("style:swiss")).toBe(true);
    // The sheet applies: Swiss's square controls.
    const probe = document.getElementById("a") as HTMLElement;
    expect(getComputedStyle(probe).getPropertyValue("--ok-radius-control").trim()).toBe("0px");
    add('<p data-ok-style="swiss"></p>');
    await settle();
    expect(styleLinks()).toHaveLength(1);
  });

  it("follows a style set later, on the root or by a new element, and the core sheet's variant", async () => {
    coreLink(`${DIST}owlky.css`);
    const { runtime } = setup();
    document.documentElement.setAttribute("data-ok-style", "nordic");
    await settle();
    expect(styleLinks()).toEqual([`${DIST}owlky-style-nordic.css`]);
    add('<section data-ok-style="corporate"></section>');
    await settle();
    await Promise.all([settled(runtime, "style:nordic"), settled(runtime, "style:corporate")]);
    expect(runtime.loaded("style:corporate")).toBe(true);
    expect(styleLinks()).toEqual([
      `${DIST}owlky-style-nordic.css`,
      `${DIST}owlky-style-corporate.css`,
    ]);
  });

  it("ignores the default style and unknown values", async () => {
    const { runtime } = setup();
    add('<div data-ok-style="soft"></div><div data-ok-style="nope"></div>');
    document.documentElement.setAttribute("data-ok-style", "__proto__");
    await settle();
    expect(styleLinks()).toEqual([]);
    await expect(runtime.load("style:soft")).rejects.toThrow('Unknown module "style:soft"');
    await expect(runtime.load("style:nope")).rejects.toThrow("Unknown module");
  });

  it("doesn't add a sheet the page links itself, from any folder", async () => {
    const own = coreLink("/assets/theme/owlky-style-bauhaus.css");
    const { runtime } = setup();
    add('<div data-ok-style="bauhaus"></div>');
    await settle();
    await runtime.load("style:bauhaus");
    expect(document.querySelectorAll('link[href*="owlky-style-bauhaus"]')).toHaveLength(1);
    own.remove();
  });

  it("uses data-ok-styles' folder, the folder above the modules without a core sheet, or none", async () => {
    const custom = setup({ styles: DIST, base: "https://cdn.example/owlky/modules/" });
    add('<div data-ok-style="editorial"></div>');
    await settled(custom.runtime, "style:editorial");
    expect(styleLinks()).toEqual([`${DIST}owlky-style-editorial.min.css`]);
    custom.runtime.stop();
    for (const link of document.querySelectorAll('link[href*="owlky-style-"]')) link.remove();

    vi.spyOn(console, "error").mockImplementation(() => {});
    const errors: CustomEvent[] = [];
    document.addEventListener("ok:runtime:error", (event) => errors.push(event as CustomEvent), {
      once: true,
    });
    const fallback = setup({ base: "http://127.0.0.1:9/owlky/modules/" });
    await expect(fallback.runtime.load("style:editorial")).rejects.toThrow("Stylesheet failed");
    expect(errors[0]?.detail).toMatchObject({
      module: "style:editorial",
      url: "http://127.0.0.1:9/owlky/owlky-style-editorial.min.css",
    });
    expect(styleLinks()).toEqual([]);
    fallback.runtime.stop();

    const off = setup({ styles: null });
    add('<div data-ok-style="brutalism"></div>');
    await settle();
    expect(styleLinks()).toEqual([]);
    await expect(off.runtime.load("style:brutalism")).rejects.toThrow("Unknown module");
  });

  it("preloads a style named in data-ok-preload and stops watching with the runtime", async () => {
    const { runtime } = setup({ styles: DIST, preload: ["style:minimal-mono"] });
    await runtime.load("style:minimal-mono");
    expect(styleLinks()).toEqual([`${DIST}owlky-style-minimal-mono.min.css`]);
    runtime.stop();
    add('<div data-ok-style="nordic"></div>');
    await settle();
    expect(styleLinks()).toHaveLength(1);
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

  it("resolves data-ok-styles to a folder, none, or the loader's default", () => {
    const script = document.createElement("script");
    expect(styleBase(script)).toBeUndefined();
    expect(styleBase(null)).toBeUndefined();
    script.setAttribute("data-ok-styles", "/static/styles");
    expect(styleBase(script)).toBe(new URL("/static/styles/", document.baseURI).href);
    script.setAttribute("data-ok-styles", "none");
    expect(styleBase(script)).toBeNull();
  });

  it("splits data-ok-preload on spaces and commas", () => {
    expect(preloadNames(" chart, data-grid  gantt ")).toEqual(["chart", "data-grid", "gantt"]);
    expect(preloadNames(null)).toEqual([]);
  });
});
