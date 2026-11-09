import { afterEach, describe, expect, it, vi } from "vitest";
import { codeEditorLocales, loader, type Monaco, resetLoader, workerFile } from "./loader.js";

// Built by hand: Vite rewrites `new URL("…", import.meta.url)` literals into asset URLs.
const FIXTURES = import.meta.url.replace(/[^/]*$/, "test-fixtures/");
type Slot = { MonacoEnvironment?: { getWorker?(id: string, label: string): unknown } };
const slot = globalThis as Slot;
const fake = { editor: {} } as unknown as Monaco;

afterEach(() => {
  resetLoader();
  delete slot.MonacoEnvironment;
  document.documentElement.removeAttribute("data-ok-fixture-nls");
  for (const link of document.head.querySelectorAll("link[href*='test-fixtures']")) link.remove();
});

describe("loader", () => {
  it("uses a given Monaco instance and shares it", async () => {
    loader.config({ monaco: fake });
    expect(loader.getMonaco()).toBeNull();
    const first = loader.init();
    const second = loader.init();
    await expect(first).resolves.toBe(fake);
    await expect(second).resolves.toBe(fake);
    expect(loader.getMonaco()).toBe(fake);
    // Configuration is fixed once Monaco is loaded.
    loader.config({ monaco: {} as Monaco });
    await expect(loader.init()).resolves.toBe(fake);
  });

  it("imports through `import` and retries after a failure", async () => {
    const load = vi
      .fn<() => Promise<Monaco>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(fake);
    loader.config({ import: load });
    await expect(loader.init()).rejects.toThrow("offline");
    expect(loader.getMonaco()).toBeNull();
    await expect(loader.init()).resolves.toBe(fake);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("cancel() rejects one caller with a cancelation", async () => {
    let resolve: (value: Monaco) => void = () => {};
    loader.config({ import: () => new Promise<Monaco>((done) => (resolve = done)) });
    const canceled = loader.init();
    const kept = loader.init();
    canceled.cancel();
    await expect(canceled).rejects.toEqual({
      type: "cancelation",
      msg: "operation is manually canceled",
    });
    resolve(fake);
    await expect(kept).resolves.toBe(fake);
  });

  it("ignores prototype keys in the configuration", async () => {
    loader.config(JSON.parse('{"__proto__": {"polluted": true}}'));
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    loader.config({ monaco: fake });
    await expect(loader.init()).resolves.toBe(fake);
  });

  it("ignores the UI language without paths.vs", async () => {
    loader.config({ import: async () => fake, "vs/nls": { availableLanguages: { "*": "de" } } });
    await expect(loader.init()).resolves.toBe(fake);
    expect(document.documentElement.hasAttribute("data-ok-fixture-nls")).toBe(false);
    expect(codeEditorLocales).toContain("de");
  });

  it("loads Monaco, its CSS, messages and workers from paths.vs", async () => {
    loader.config({
      paths: { vs: FIXTURES.slice(0, -1) },
      "vs/nls": { availableLanguages: { "*": "DE" } },
    });
    const monaco = (await loader.init()) as unknown as { editor: { fake: boolean } };
    expect(monaco.editor.fake).toBe(true);
    expect(document.documentElement.getAttribute("data-ok-fixture-nls")).toBe("de");
    expect(document.head.querySelector(`link[href="${FIXTURES}monaco.css"]`)).not.toBeNull();
    // Workers come from the same folder, through the owlky-code-editor Trusted Types policy.
    const worker = slot.MonacoEnvironment?.getWorker?.("workerMain.js", "json") as Worker;
    const message = await new Promise((resolve) => {
      worker.onmessage = (event) => resolve(event.data);
    });
    expect(message).toBe("ready");
    worker.terminate();

    // A worker URL outside the configured folder is refused by the policy.
    if (!("trustedTypes" in globalThis)) return;
    const stale = slot.MonacoEnvironment;
    resetLoader();
    loader.config({ paths: { vs: `${FIXTURES}nls/` } });
    expect(() => stale?.getWorker?.("workerMain.js", "json")).toThrow(TypeError);
    resetLoader();
    loader.config({});
    expect(() => stale?.getWorker?.("workerMain.js", "json")).toThrow(TypeError);
  });

  it("reuses the stylesheet and works without Trusted Types", async () => {
    loader.config({ paths: { vs: FIXTURES }, "vs/nls": { availableLanguages: { "*": "xx" } } });
    await loader.init();
    const links = () => document.head.querySelectorAll("link[rel=stylesheet]").length;
    const before = links();
    resetLoader();
    delete slot.MonacoEnvironment;
    loader.config({ paths: { vs: FIXTURES } });
    await loader.init();
    expect(links()).toBe(before);
    expect(document.documentElement.hasAttribute("data-ok-fixture-nls")).toBe(false);
    const own = Object.getOwnPropertyDescriptor(globalThis, "trustedTypes");
    Object.defineProperty(globalThis, "trustedTypes", { value: undefined, configurable: true });
    try {
      // Read through a cast: TypeScript narrowed the slot after the delete above.
      const worker = (slot as Slot).MonacoEnvironment?.getWorker?.(
        "workerMain.js",
        "json",
      ) as Worker;
      expect(worker).toBeInstanceOf(Worker);
      worker.terminate();
    } finally {
      if (own) Object.defineProperty(globalThis, "trustedTypes", own);
      else delete (globalThis as { trustedTypes?: unknown }).trustedTypes;
    }
  });

  it("fails when the CSS of paths.vs is missing", async () => {
    loader.config({ paths: { vs: `${FIXTURES}broken/` } });
    await expect(loader.init()).rejects.toThrow("Could not load");
    expect(document.head.querySelector("link[href*='broken/monaco.css']")).toBeNull();
    expect(loader.getMonaco()).toBeNull();
  });

  it("keeps the page's own MonacoEnvironment workers", async () => {
    const getWorker = vi.fn();
    slot.MonacoEnvironment = { getWorker };
    loader.config({ monaco: undefined, import: async () => fake, getWorker: () => new Worker("") });
    await loader.init();
    expect(slot.MonacoEnvironment.getWorker).toBe(getWorker);
  });

  it("sets getWorker from the configuration", async () => {
    const created = {} as Worker;
    loader.config({ import: async () => fake, getWorker: (label) => (label ? created : created) });
    await loader.init();
    expect(slot.MonacoEnvironment?.getWorker?.("workerMain.js", "css")).toBe(created);
  });

  it("leaves MonacoEnvironment alone without workers to offer", async () => {
    loader.config({ import: async () => fake });
    await loader.init();
    expect(slot.MonacoEnvironment).toBeUndefined();
  });

  it("maps worker labels to Owlky's worker files", () => {
    expect(workerFile("json")).toBe("json.worker.js");
    for (const label of ["css", "scss", "less"]) expect(workerFile(label)).toBe("css.worker.js");
    for (const label of ["html", "handlebars", "razor"])
      expect(workerFile(label)).toBe("html.worker.js");
    for (const label of ["typescript", "javascript"])
      expect(workerFile(label)).toBe("typescript.worker.js");
    expect(workerFile("editorWorkerService")).toBe("editor.worker.js");
  });
});
