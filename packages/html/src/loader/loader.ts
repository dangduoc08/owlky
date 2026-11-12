/**
 * The CDN loader (ADR-0068 §2): `owlky.js` registers one stub definition per lazy module, so the
 * runtime's first scan and its MutationObserver find heavy roots like any other component. A
 * stub's setup loads the module once: its stylesheet first (when it has one), then the ES module,
 * which registers the real components on the same runtime. No global besides the ADR-0007 slots:
 * the loader lives in the runtime that owns the page (`runtime.load()` / `runtime.loaded()`).
 */
import { setModuleLoader } from "../runtime/runtime.js";
import type { ComponentDefinition, ModuleLoader, Runtime } from "../runtime/types.js";
import { LAZY_MODULES, type LazyModule } from "./modules.js";

const LOG_PREFIX = "[owlky]";

/** `detail` of the `ok:runtime:error` event, dispatched on `document` when a module fails. */
export interface RuntimeErrorDetail {
  /** The module's name, such as `"chart"`. */
  readonly module: string;
  /** The URL that failed: the module or its stylesheet. */
  readonly url: string;
  readonly error: unknown;
}

export interface LoaderOptions {
  /** Absolute URL of the folder that holds the modules, ending with `/`. */
  readonly base: string;
  /** Module names to load at once (the script's `data-ok-preload`). */
  readonly preload?: readonly string[];
  /** The module table. Default: every lazy module of the CDN bundle. */
  readonly modules?: Readonly<Record<string, LazyModule>>;
  /** Imports a module URL. Default: the native `import()`. */
  readonly importModule?: (url: string) => Promise<unknown>;
}

/**
 * The folder of the lazy modules for a `<script>` that loaded `owlky.js`: its
 * `data-ok-modules` attribute (resolved against the document), or `modules/` next to the script.
 */
export function moduleBase(script: Element | null): string {
  const custom = script?.getAttribute("data-ok-modules")?.trim();
  if (custom) return new URL(custom.endsWith("/") ? custom : `${custom}/`, document.baseURI).href;
  const src = script instanceof HTMLScriptElement && script.src ? script.src : document.baseURI;
  return new URL("modules/", src).href;
}

/** Names in a `data-ok-preload` value: separated by spaces or commas. */
export const preloadNames = (value: string | null | undefined): string[] =>
  (value ?? "").split(/[\s,]+/).filter(Boolean);

const nativeImport = (url: string): Promise<unknown> => import(/* @vite-ignore */ url);

/** The `<link>` of the core stylesheet (`owlky.css` / `owlky.min.css`), if the page has one. */
function coreStylesheet(): HTMLLinkElement | undefined {
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')) {
    if (/\/owlky(\.min)?\.css(?:[?#].*)?$/.test(link.href)) return link;
  }
  return undefined;
}

/**
 * Installs the loader on `runtime`: registers the stubs and loads `preload`. Returns the loader
 * that `runtime.load()` uses.
 */
export function installLoader(runtime: Runtime, options: LoaderOptions): ModuleLoader {
  const modules: Readonly<Record<string, LazyModule>> = options.modules ?? LAZY_MODULES;
  const order = Object.keys(modules);
  const importModule = options.importModule ?? nativeImport;
  const pending = new Map<string, Promise<void>>();
  const done = new Set<string>();
  const retrying = new Set<string>();
  /** Stylesheets this loader added, by module rank, so they stay in the canonical order. */
  const sheets: { rank: number; link: HTMLLinkElement }[] = [];

  function attachStylesheet(name: string, href: string): Promise<void> {
    const existing = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')];
    if (existing.some((link) => link.href === href)) return Promise.resolve();
    const rank = order.indexOf(name);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    const next = sheets.find((sheet) => sheet.rank > rank);
    const after =
      [...sheets].reverse().find((sheet) => sheet.rank < rank)?.link ?? coreStylesheet();
    if (next) next.link.before(link);
    else if (after) after.after(link);
    else document.head.append(link);
    const entry = { rank, link };
    sheets.push(entry);
    sheets.sort((a, b) => a.rank - b.rank);
    return new Promise((resolve, reject) => {
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener(
        "error",
        () => {
          link.remove();
          sheets.splice(sheets.indexOf(entry), 1);
          reject(Object.assign(new Error(`Stylesheet failed: ${href}`), { url: href }));
        },
        { once: true },
      );
    });
  }

  function report(name: string, url: string, error: unknown) {
    console.error(`${LOG_PREFIX} Failed to load module "${name}" from ${url}.`, error);
    const detail: RuntimeErrorDetail = { module: name, url, error };
    document.dispatchEvent(new CustomEvent("ok:runtime:error", { bubbles: true, detail }));
  }

  /** One automatic retry per module, when the browser comes back online. */
  function retryOnline(name: string) {
    if (retrying.has(name)) return;
    retrying.add(name);
    addEventListener("online", () => void loader.load(name).catch(() => {}), { once: true });
  }

  const loader: ModuleLoader = {
    load(name) {
      const module = modules[name];
      if (!module) return Promise.reject(new Error(`${LOG_PREFIX} Unknown module "${name}".`));
      const current = pending.get(name);
      if (current) return current;
      const url = new URL(`${name}.js`, options.base).href;
      const promise = (
        module.stylesheet
          ? attachStylesheet(name, new URL(`${name}.css`, options.base).href)
          : Promise.resolve()
      )
        .then(() => importModule(url))
        .then(() => {
          done.add(name);
        });
      pending.set(name, promise);
      promise.catch((error: unknown) => {
        // The next `load()` (or the `online` retry) starts again.
        pending.delete(name);
        const failed = (error as { url?: unknown } | null)?.url;
        report(name, typeof failed === "string" ? failed : url, error);
        retryOnline(name);
      });
      return promise;
    },
    loaded: (name) => done.has(name),
  };

  if (!setModuleLoader(runtime, loader)) {
    // A second copy of `owlky.js`: the first copy's loader serves the page.
    for (const name of options.preload ?? []) void runtime.load(name).catch(() => {});
    return loader;
  }
  const stubs: ComponentDefinition[] = Object.entries(modules).map(([name, module]) => ({
    name: `loader:${name}`,
    selector: module.selector,
    setup() {
      if (!done.has(name)) void loader.load(name).catch(() => {});
      return {};
    },
  }));
  runtime.register(...stubs);
  for (const name of options.preload ?? []) {
    if (name in modules) void loader.load(name).catch(() => {});
    else if (!runtime.loaded(name))
      console.warn(`${LOG_PREFIX} data-ok-preload: no module named "${name}".`);
  }
  return loader;
}
