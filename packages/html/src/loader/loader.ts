/**
 * The CDN loader (ADR-0068 §2): `owlky.js` registers one stub definition per lazy module, so the
 * runtime's first scan and its MutationObserver find heavy roots like any other component. A
 * stub's setup loads the module once: its stylesheet first (when it has one), then the ES module,
 * which registers the real components on the same runtime. No global besides the ADR-0007 slots:
 * the loader lives in the runtime that owns the page (`runtime.load()` / `runtime.loaded()`).
 *
 * Design styles (ADR-0070 § 6, ST5): a `data-ok-style="<id>"` anywhere in the page, at load or
 * set later (markup, `applyThemeSettings({ style })`), attaches `owlky-style-<id>.css` once, after
 * the core sheet. The entry is CSS only, named `style:<id>` (`runtime.load("style:nordic")`,
 * `data-ok-preload="style:nordic"`); a sheet the page links itself is never added twice.
 */
import { themeStyles } from "@owlky/core";
import { setModuleLoader } from "../runtime/runtime.js";
import type { ComponentDefinition, ModuleLoader, Runtime } from "../runtime/types.js";
import { LAZY_MODULES, type LazyModule } from "./modules.js";

const LOG_PREFIX = "[owlky]";

/** `detail` of the `ok:runtime:error` event, dispatched on `document` when a module fails. */
export interface RuntimeErrorDetail {
  /** The module's name, such as `"chart"` or `"style:nordic"`. */
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
  /**
   * Folder of the style sheets (`owlky-style-<id>.css`), ending with `/`; `null` turns the style
   * entries off. Default: the core sheet's folder, else the folder above `base`.
   */
  readonly styles?: string | null | undefined;
}

/** A folder attribute resolved against the document, with its trailing `/`. */
const folder = (path: string) =>
  new URL(path.endsWith("/") ? path : `${path}/`, document.baseURI).href;

/**
 * The folder of the lazy modules for a `<script>` that loaded `owlky.js`: its
 * `data-ok-modules` attribute (resolved against the document), or `modules/` next to the script.
 */
export function moduleBase(script: Element | null): string {
  const custom = script?.getAttribute("data-ok-modules")?.trim();
  if (custom) return folder(custom);
  const src = script instanceof HTMLScriptElement && script.src ? script.src : document.baseURI;
  return new URL("modules/", src).href;
}

/**
 * The style sheet folder of a script's `data-ok-styles` attribute: `undefined` without one (the
 * loader's default), `null` for `none` (no style sheet is added), otherwise the folder.
 */
export function styleBase(script: Element | null): string | null | undefined {
  const custom = script?.getAttribute("data-ok-styles")?.trim();
  if (!custom) return undefined;
  return custom === "none" ? null : folder(custom);
}

/** Names in a `data-ok-preload` value: separated by spaces or commas. */
export const preloadNames = (value: string | null | undefined): string[] =>
  (value ?? "").split(/[\s,]+/).filter(Boolean);

const nativeImport = (url: string): Promise<unknown> => import(/* @vite-ignore */ url);

const stylesheets = () => [
  ...document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
];

/** The `<link>` of the core stylesheet (`owlky(-all)(.min).css`), if the page has one. */
const coreStylesheet = (): HTMLLinkElement | undefined =>
  stylesheets().find((link) => /\/owlky(-all)?(\.min)?\.css(?:[?#].*)?$/.test(link.href));

const STYLE_PREFIX = "style:";
const STYLE_ATTRIBUTE = "data-ok-style";

/**
 * Installs the loader on `runtime`: registers the stubs, watches `data-ok-style` and loads
 * `preload`. Returns the loader that `runtime.load()` uses.
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

  /**
   * Adds a `<link>` (no inline style: strict CSP). `linked` tells whether the page already holds
   * the sheet. Style sheets share rank -1 (in the order they came), right after the core sheet: they set tokens
   * in `@layer theme` only, and their shadow switch wins over the core resolver by source order.
   */
  function attachStylesheet(
    name: string,
    href: string,
    linked = (link: HTMLLinkElement) => link.href === href,
  ): Promise<void> {
    if (stylesheets().some(linked)) return Promise.resolve();
    const rank = order.indexOf(name);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    const next = sheets.find((sheet) => sheet.rank > rank);
    const after =
      [...sheets].reverse().find((sheet) => sheet.rank <= rank)?.link ?? coreStylesheet();
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

  /**
   * Attaches the sheet of a `style:<id>` entry; `undefined` for any other name, the default style
   * (the core sheet holds it) and unknown ids. The variant follows the core sheet's link
   * (`owlky.css` → `owlky-style-<id>.css`); `.min` when the page links none.
   */
  function styleSheet(name: string): (() => Promise<void>) | undefined {
    const id = name.slice(STYLE_PREFIX.length);
    if (
      !name.startsWith(STYLE_PREFIX) ||
      options.styles === null ||
      !(themeStyles as readonly string[]).includes(id) ||
      id === themeStyles[0]
    )
      return undefined;
    return () => {
      const core = coreStylesheet();
      const min = !core || /\.min\.css(?:[?#].*)?$/.test(core.href) ? ".min" : "";
      const base = options.styles ?? core?.href ?? new URL("../", options.base).href;
      const own = new RegExp(`/owlky-style-${id}(\\.min)?\\.css(?:[?#].*)?$`);
      return attachStylesheet(name, new URL(`owlky-style-${id}${min}.css`, base).href, (link) =>
        own.test(link.href),
      );
    };
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
      const style = styleSheet(name);
      if (!module && !style)
        return Promise.reject(new Error(`${LOG_PREFIX} Unknown module "${name}".`));
      const current = pending.get(name);
      if (current) return current;
      const url = new URL(`${name}.js`, options.base).href;
      const promise = (
        style
          ? style()
          : (module?.stylesheet
              ? attachStylesheet(name, new URL(`${name}.css`, options.base).href)
              : Promise.resolve()
            ).then(() => importModule(url))
      ).then(() => {
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
  if (options.styles !== null)
    // On the root element, so the watcher stops with the runtime (`stop()`).
    stubs.push({
      name: "loader:styles",
      selector: ":root",
      setup(_root, { signal }) {
        watchStyles((id) => {
          const name = STYLE_PREFIX + id;
          if (styleSheet(name) && !done.has(name)) void loader.load(name).catch(() => {});
        }, signal);
        return {};
      },
    });
  runtime.register(...stubs);
  for (const name of options.preload ?? []) {
    if (name in modules || styleSheet(name)) void loader.load(name).catch(() => {});
    else if (!runtime.loaded(name))
      console.warn(`${LOG_PREFIX} data-ok-preload: no module named "${name}".`);
  }
  return loader;
}

/**
 * Calls `found` with every `data-ok-style` value in the document, now and whenever one is added
 * or changed: the runtime's own observer sees added nodes only, not attribute changes.
 */
function watchStyles(found: (id: string) => void, signal: AbortSignal) {
  const check = (element: Element) => {
    const id = element.getAttribute(STYLE_ATTRIBUTE);
    if (id) found(id);
  };
  const scan = (node: Node) => {
    if (!(node instanceof Element)) return;
    check(node);
    for (const element of node.querySelectorAll(`[${STYLE_ATTRIBUTE}]`)) check(element);
  };
  scan(document.documentElement);
  const observer = new MutationObserver((records) => {
    for (const record of records)
      if (record.type === "attributes") check(record.target as Element);
      else for (const node of record.addedNodes) scan(node);
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [STYLE_ATTRIBUTE],
  });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
}
