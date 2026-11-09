import type * as MonacoApi from "monaco-editor";

/** The Monaco namespace (`import * as monaco from "monaco-editor"`). */
export type Monaco = typeof MonacoApi;

/** Monaco's worker labels Owlky builds a worker for (other labels use the editor worker). */
export type CodeEditorWorker = "editor" | "json" | "css" | "html" | "typescript";

/** Monaco UI languages with a message file (`"vs/nls"` → `availableLanguages`). */
export const codeEditorLocales = [
  "cs",
  "de",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pl",
  "pt-br",
  "ru",
  "tr",
  "zh-cn",
  "zh-tw",
] as const;
export type CodeEditorLocale = (typeof codeEditorLocales)[number];

/**
 * Where Monaco comes from (`loader.config`, ADR-0034). Monaco is always self-hosted: nothing is
 * fetched from a third-party CDN unless `paths.vs` points there.
 */
export interface LoaderConfig {
  /** A Monaco namespace you already imported: used as is (no loading). */
  readonly monaco?: Monaco | undefined;
  /**
   * The folder of Owlky's Monaco build (`@owlky/html/dist/monaco/`: `monaco.js`, `monaco.css`,
   * `*.worker.js`, `nls/`), for example a copy on your own server. Relative URLs resolve against
   * the document. Without it Monaco is imported from the `monaco-editor` package (bundlers).
   */
  readonly paths?: { readonly vs?: string | undefined } | undefined;
  /** Imports the `monaco-editor` package (default `() => import("monaco-editor")`). */
  readonly import?: (() => Promise<Monaco>) | undefined;
  /**
   * Creates Monaco's web workers (label: `editorWorkerService`, `json`, `css`, `html`,
   * `typescript`, …). Default: the `*.worker.js` files of `paths.vs`. A page that already defines
   * `MonacoEnvironment.getWorker` or `getWorkerUrl` keeps its own.
   */
  readonly getWorker?: ((label: string) => Worker | Promise<Worker>) | undefined;
  /**
   * Monaco's UI language with `paths.vs`: `{ availableLanguages: { "*": "de" } }` loads
   * `nls/de.js` first. With the package, import `monaco-editor/nls/lang/de.js` yourself first.
   */
  readonly "vs/nls"?:
    | { readonly availableLanguages?: Readonly<Record<string, string>> | undefined }
    | undefined;
}

/** A promise that can stop waiting: `cancel()` rejects it with `{ type: "cancelation" }`. */
export interface CancelablePromise<T> extends Promise<T> {
  cancel(): void;
}

/** Rejection reason of a canceled `loader.init()`. */
export interface CancelationError {
  readonly type: "cancelation";
  readonly msg: string;
}

interface MonacoEnvironmentSlot {
  MonacoEnvironment?: MonacoApi.Environment | undefined;
}

interface TrustedTypesLike {
  createPolicy(
    name: string,
    rules: { createScriptURL(value: string): string },
  ): { createScriptURL(value: string): unknown };
}

/** The worker file of Owlky's Monaco build for a Monaco worker label. */
export function workerFile(label: string): `${CodeEditorWorker}.worker.js` {
  switch (label) {
    case "json":
      return "json.worker.js";
    case "css":
    case "scss":
    case "less":
      return "css.worker.js";
    case "html":
    case "handlebars":
    case "razor":
      return "html.worker.js";
    case "typescript":
    case "javascript":
      return "typescript.worker.js";
    default:
      return "editor.worker.js";
  }
}

const folder = (vs: string) => {
  const url = new URL(vs, document.baseURI).href;
  return url.endsWith("/") ? url : `${url}/`;
};

/** The default source: the `monaco-editor` package (bundlers split it into a lazy chunk). */
const importMonaco = (): Promise<Monaco> => import("monaco-editor");

/** An ES module from a URL the page configured (never from markup). */
const importUrl = (url: string): Promise<Record<string, unknown>> =>
  import(/* @vite-ignore */ /* webpackIgnore: true */ url);

let config: LoaderConfig = {};
let monaco: Monaco | null = null;
let pending: Promise<Monaco> | null = null;
let policy: { createScriptURL(value: string): unknown } | null | undefined;
const stylesheets = new Map<string, Promise<void>>();

/** Worker URLs go through a Trusted Types policy that only accepts files of `paths.vs`. */
function scriptUrl(url: string): string {
  const trustedTypes = (globalThis as { trustedTypes?: TrustedTypesLike }).trustedTypes;
  if (!trustedTypes) return url;
  policy ??= trustedTypes.createPolicy("owlky-code-editor", {
    createScriptURL(value) {
      const current = config.paths?.vs;
      if (current === undefined || !value.startsWith(folder(current)))
        throw new TypeError(`Not a Monaco worker of paths.vs: ${value}`);
      return value;
    },
  });
  return policy.createScriptURL(url) as string;
}

/** Points `MonacoEnvironment.getWorker` at the configured workers, unless the page has its own. */
function environment(vs: string | undefined) {
  const slot = globalThis as MonacoEnvironmentSlot;
  const current = slot.MonacoEnvironment;
  if (current?.getWorker || current?.getWorkerUrl) return;
  const create =
    config.getWorker ??
    (vs === undefined
      ? undefined
      : (label: string) =>
          new Worker(scriptUrl(`${vs}${workerFile(label)}`), { type: "module", name: label }));
  if (!create) return;
  slot.MonacoEnvironment = { ...current, getWorker: (_id, label) => create(label) };
}

function stylesheet(href: string): Promise<void> {
  let loaded = stylesheets.get(href);
  if (!loaded) {
    loaded = new Promise<void>((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener(
        "error",
        () => {
          link.remove();
          stylesheets.delete(href);
          reject(new Error(`Could not load ${href}`));
        },
        { once: true },
      );
      document.head.append(link);
    });
    stylesheets.set(href, loaded);
  }
  return loaded;
}

const locale = (): CodeEditorLocale | undefined => {
  const value = config["vs/nls"]?.availableLanguages?.["*"];
  return codeEditorLocales.find((each) => each === value?.toLowerCase());
};

async function load(): Promise<Monaco> {
  if (config.monaco) return config.monaco;
  const vs = config.paths?.vs === undefined ? undefined : folder(config.paths.vs);
  environment(vs);
  if (vs === undefined) return (config.import ?? importMonaco)();
  const language = locale();
  if (language) await importUrl(`${vs}nls/${language}.js`);
  const [module] = await Promise.all([importUrl(`${vs}monaco.js`), stylesheet(`${vs}monaco.css`)]);
  return module as unknown as Monaco;
}

/**
 * Loads Monaco once per page and shares it (ADR-0034): `config()` says where from, `init()` loads
 * it, `getMonaco()` returns it once loaded. Mirrors `@monaco-editor/loader`, without its default
 * CDN: Monaco comes from the `monaco-editor` package or from `paths.vs` (self-hosted).
 */
export const loader = {
  /** Sets where Monaco comes from. Call it before the first editor loads; later calls are ignored. */
  config(next: LoaderConfig): void {
    if (monaco || pending) return;
    // Spread defines own properties: a `__proto__` key can't reach the prototype.
    config = { ...config, ...next };
  },
  /** Loads Monaco (once); `cancel()` stops this caller from waiting. A failed load can be retried. */
  init(): CancelablePromise<Monaco> {
    pending ??= load().then(
      (loaded) => {
        monaco = loaded;
        return loaded;
      },
      (error: unknown) => {
        pending = null;
        throw error;
      },
    );
    let cancel!: () => void;
    const canceled = new Promise<never>((_, reject) => {
      cancel = () =>
        reject({ type: "cancelation", msg: "operation is manually canceled" } as CancelationError);
    });
    const promise = Promise.race([pending, canceled]) as CancelablePromise<Monaco>;
    promise.cancel = cancel;
    return promise;
  },
  /** Monaco once loaded, otherwise `null`. */
  getMonaco(): Monaco | null {
    return monaco;
  },
};

/** Tests only: forgets the loaded Monaco and the configuration. */
export function resetLoader(): void {
  config = {};
  monaco = null;
  pending = null;
}
