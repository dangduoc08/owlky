import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  canUseFsAccessApi,
  createUploadController,
  type UploadConfig,
  type UploadController,
  type UploadControllerOptions,
} from "./upload-controller.js";
import type { UploadEvaluation } from "./upload-model.js";

const file = (name: string, type = "", size = 1) =>
  new File([new Uint8Array(size)], name, { type });

interface FakeItem {
  kind: string;
  type: string;
  getAsFile(): File | null;
  webkitGetAsEntry?: () => unknown;
}

const item = (f: File): FakeItem => ({
  kind: "file",
  type: f.type,
  getAsFile: () => f,
  webkitGetAsEntry: () => ({ isDirectory: false }),
});

/** A drag event carrying files (plain objects: every engine accepts them). */
function drag(
  type: string,
  files: File[],
  extra: { items?: FakeItem[]; types?: string[]; noData?: boolean } = {},
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const data = {
    types: extra.types ?? ["Files"],
    files,
    items: extra.items ?? files.map(item),
    dropEffect: "none",
  };
  Object.defineProperty(event, "dataTransfer", { value: extra.noData ? null : data });
  return event as DragEvent & { dataTransfer: typeof data };
}

function paste(files: File[], types = ["Files"]) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: { types, files } });
  return event;
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

let controllers: UploadController[] = [];

function setup(config: UploadConfig = {}, options: Partial<UploadControllerOptions> = {}) {
  const host = mount(`
    <form>
      <div data-ok-upload>
        <div data-ok-upload-zone>
          <input type="file" data-ok-upload-input>
          <span data-ok-upload-placeholder>Drop</span>
          <button type="button" data-ok-upload-open>Open</button>
        </div>
      </div>
    </form>`);
  const root = host.querySelector<HTMLElement>("[data-ok-upload]") as HTMLElement;
  const input = root.querySelector<HTMLInputElement>("input") as HTMLInputElement;
  const results: [UploadEvaluation, string][] = [];
  const cfg = { ...config };
  const controller = createUploadController(root, {
    input: () => input,
    config: () => cfg,
    onFiles: (result, source) => results.push([result, source]),
    ...options,
  });
  controllers.push(controller);
  return { host, root, input, results, controller, cfg };
}

afterEach(() => {
  for (const controller of controllers) controller.destroy();
  controllers = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  cleanupDom();
});

describe("createUploadController: drag and drop", () => {
  it("checks dropped files and reports them; the drop's default is prevented", () => {
    const { root, results } = setup({ accept: "image/*", multiple: true });
    const event = drag("drop", [file("a.png", "image/png"), file("b.txt", "text/plain")]);
    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(results).toHaveLength(1);
    const [result, source] = results[0] as [UploadEvaluation, string];
    expect(source).toBe("drop");
    expect(result.accepted.map((f) => f.name)).toEqual(["a.png"]);
    expect(result.rejections.map((r) => r.file.name)).toEqual(["b.txt"]);
  });

  it("writes the drag verdict while files are over the zone", () => {
    const states: unknown[] = [];
    const { root } = setup({ accept: "image/*" }, { onDragChange: (s) => states.push(s) });
    const zone = root.querySelector("[data-ok-upload-zone]") as HTMLElement;
    const enter = drag("dragenter", [file("a.png", "image/png")]);
    zone.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(root.getAttribute("data-ok-drag")).toBe("accept");
    // Entering a child keeps the zone active until every target is left.
    const input = root.querySelector("input") as HTMLElement;
    input.dispatchEvent(drag("dragenter", [file("a.png", "image/png")]));
    zone.dispatchEvent(drag("dragleave", []));
    expect(root.getAttribute("data-ok-drag")).toBe("accept");
    input.dispatchEvent(drag("dragleave", []));
    expect(root.hasAttribute("data-ok-drag")).toBe(false);
    zone.dispatchEvent(drag("dragenter", [file("a.txt", "text/plain")]));
    expect(root.getAttribute("data-ok-drag")).toBe("reject");
    root.dispatchEvent(drag("drop", []));
    expect(root.hasAttribute("data-ok-drag")).toBe(false);
    expect(states.length).toBeGreaterThanOrEqual(4);
  });

  it("forgets targets that left the zone (removed nodes)", () => {
    const { root } = setup();
    const extra = document.createElement("span");
    root.append(extra);
    extra.dispatchEvent(drag("dragenter", [file("a")]));
    extra.remove();
    root.dispatchEvent(drag("dragleave", []));
    expect(root.hasAttribute("data-ok-drag")).toBe(false);
  });

  it("allows the copy effect, or none while it can't take files", () => {
    const { root, cfg, input } = setup();
    const over = drag("dragover", [file("a")]);
    root.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);
    expect(over.dataTransfer.dropEffect).toBe("copy");
    cfg.noDrag = true;
    const blocked = drag("dragover", [file("a")]);
    root.dispatchEvent(blocked);
    expect(blocked.dataTransfer.dropEffect).toBe("none");
    cfg.noDrag = false;
    input.disabled = true;
    const disabled = drag("dragover", [file("a")]);
    root.dispatchEvent(disabled);
    expect(disabled.dataTransfer.dropEffect).toBe("none");
    // No dataTransfer at all: nothing to set.
    root.dispatchEvent(drag("dragover", [], { noData: true }));
  });

  it("ignores drags without files", () => {
    const { root, results } = setup();
    const event = drag("drop", [], { types: ["text/plain"] });
    root.dispatchEvent(event);
    root.dispatchEvent(drag("dragenter", [], { types: ["text/plain"] }));
    root.dispatchEvent(drag("dragover", [], { types: ["text/plain"] }));
    root.dispatchEvent(drag("dragleave", [], { types: ["text/plain"] }));
    expect(event.defaultPrevented).toBe(false);
    expect(results).toHaveLength(0);
    expect(root.hasAttribute("data-ok-drag")).toBe(false);
  });

  it("disabled, noDrag: the drop is prevented but nothing is reported", () => {
    const { root, results, cfg } = setup({ disabled: true });
    const event = drag("drop", [file("a")]);
    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    root.dispatchEvent(drag("dragenter", [file("a")]));
    expect(root.hasAttribute("data-ok-drag")).toBe(false);
    cfg.disabled = false;
    cfg.noDrag = true;
    root.dispatchEvent(drag("drop", [file("a")]));
    expect(results).toHaveLength(0);
  });

  it("noDragEventsBubbling: an inner upload keeps its drags from the outer one", () => {
    const outer = setup({ multiple: true });
    const inner = document.createElement("div");
    inner.setAttribute("data-ok-upload", "");
    const innerInput = document.createElement("input");
    innerInput.type = "file";
    inner.append(innerInput);
    outer.root.append(inner);
    const innerResults: unknown[] = [];
    const innerConfig: UploadConfig = { noDragEventsBubbling: true };
    controllers.push(
      createUploadController(inner, {
        input: () => innerInput,
        config: () => innerConfig,
        onFiles: (r) => innerResults.push(r),
      }),
    );
    inner.dispatchEvent(drag("dragenter", [file("a")]));
    inner.dispatchEvent(drag("drop", [file("a")]));
    expect(innerResults).toHaveLength(1);
    expect(outer.results).toHaveLength(0);
    expect(outer.root.hasAttribute("data-ok-drag")).toBe(false);
    // Without the option both uploads handle the drop.
    innerConfig.noDragEventsBubbling = false;
    inner.dispatchEvent(drag("drop", [file("b")]));
    expect(innerResults).toHaveLength(2);
    expect(outer.results).toHaveLength(1);
  });

  it("reads dropped folders recursively", async () => {
    const { root, results } = setup({ multiple: true });
    const inside = file("inside.txt", "text/plain");
    const deep = file("deep.txt", "text/plain");
    const fileEntry = (f: File) => ({
      isDirectory: false,
      file: (resolve: (f: File) => void) => resolve(f),
    });
    const sub = {
      isDirectory: true,
      createReader: () => {
        let read = false;
        return {
          readEntries: (resolve: (e: unknown[]) => void) => {
            resolve(read ? [] : [fileEntry(deep)]);
            read = true;
          },
        };
      },
    };
    const folder = {
      isDirectory: true,
      createReader: () => {
        const batches = [[fileEntry(inside)], [sub], []];
        return { readEntries: (resolve: (e: unknown[]) => void) => resolve(batches.shift() ?? []) };
      },
    };
    const top = file("top.txt", "text/plain");
    const items: FakeItem[] = [
      { kind: "file", type: "", getAsFile: () => null, webkitGetAsEntry: () => folder },
      item(top),
      { kind: "file", type: "", getAsFile: () => null },
      { kind: "string", type: "text/plain", getAsFile: () => null },
    ];
    root.dispatchEvent(drag("drop", [], { items }));
    expect(root.getAttribute("aria-busy")).toBe("true");
    await flush();
    expect(results[0]?.[0].accepted.map((f) => f.name)).toEqual([
      "inside.txt",
      "deep.txt",
      "top.txt",
    ]);
    expect(root.hasAttribute("aria-busy")).toBe(false);
  });

  it("falls back to dataTransfer.files without items, and to nothing without data", () => {
    const { root, results } = setup({ multiple: true });
    root.dispatchEvent(drag("drop", [file("a")], { items: [] }));
    expect(results[0]?.[0].accepted.map((f) => f.name)).toEqual(["a"]);
    const empty = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(empty, "dataTransfer", { value: { types: ["Files"], files: [] } });
    root.dispatchEvent(empty);
    expect(results[1]?.[0].accepted).toEqual([]);
    // Items without files (strings only) also give the plain files list.
    root.dispatchEvent(
      drag("drop", [file("b")], {
        items: [{ kind: "string", type: "text/plain", getAsFile: () => null }],
      }),
    );
    expect(results[2]?.[0].accepted.map((f) => f.name)).toEqual(["b"]);
  });

  it("reports a failing folder read as an error", async () => {
    const errors: unknown[] = [];
    const { root, results } = setup({ multiple: true }, { onError: (e) => errors.push(e) });
    const broken = {
      isDirectory: true,
      createReader: () => ({
        readEntries: (_: unknown, reject: (e: Error) => void) => reject(new Error("denied")),
      }),
    };
    root.dispatchEvent(
      drag("drop", [], {
        items: [{ kind: "file", type: "", getAsFile: () => null, webkitGetAsEntry: () => broken }],
      }),
    );
    await flush();
    expect(results).toHaveLength(0);
    expect(root.hasAttribute("aria-busy")).toBe(false);
  });
});

describe("createUploadController: document", () => {
  it("keeps files dropped outside an upload from opening in the tab", () => {
    const { cfg } = setup();
    const outside = document.createElement("div");
    document.body.append(outside);
    const over = drag("dragover", [file("a")]);
    outside.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);
    const drop = drag("drop", [file("a")]);
    outside.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    // Text drags and the opt-out are left alone.
    const text = drag("dragover", [], { types: ["text/plain"] });
    outside.dispatchEvent(text);
    expect(text.defaultPrevented).toBe(false);
    cfg.preventDropOnDocument = false;
    const free = drag("drop", [file("a")]);
    outside.dispatchEvent(free);
    expect(free.defaultPrevented).toBe(false);
    const freeOver = drag("dragover", [file("a")]);
    outside.dispatchEvent(freeOver);
    expect(freeOver.defaultPrevented).toBe(false);
    const textDrop = drag("drop", [], { types: ["text/plain"] });
    cfg.preventDropOnDocument = true;
    outside.dispatchEvent(textDrop);
    expect(textDrop.defaultPrevented).toBe(false);
  });

  it("marks a file drag anywhere on the page (data-ok-drag-global)", () => {
    const { root } = setup();
    const outside = document.createElement("div");
    document.body.append(outside);
    outside.dispatchEvent(drag("dragenter", [file("a")]));
    expect(root.hasAttribute("data-ok-drag-global")).toBe(true);
    outside.dispatchEvent(drag("dragleave", []));
    expect(root.hasAttribute("data-ok-drag-global")).toBe(false);
    outside.dispatchEvent(drag("dragleave", []));
    outside.dispatchEvent(drag("dragenter", [], { types: ["text/plain"] }));
    outside.dispatchEvent(drag("dragleave", [], { types: ["text/plain"] }));
    expect(root.hasAttribute("data-ok-drag-global")).toBe(false);
    outside.dispatchEvent(drag("dragenter", [file("a")]));
    document.dispatchEvent(new Event("dragend"));
    expect(root.hasAttribute("data-ok-drag-global")).toBe(false);
  });
});

describe("createUploadController: input and dialog", () => {
  it("reports picked files and dialog opening", () => {
    const opened = vi.fn();
    const { input, results } = setup({}, { onDialogOpen: opened });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    input.dispatchEvent(click);
    expect(opened).toHaveBeenCalledTimes(1);
    const data = new DataTransfer();
    data.items.add(file("a.txt", "text/plain"));
    input.files = data.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(results[0]?.[1]).toBe("input");
    expect(results[0]?.[0].accepted.map((f) => f.name)).toEqual(["a.txt"]);
  });

  it("an empty change is a cancel: the held files go back into the input", () => {
    const cancel = vi.fn();
    const { input, controller, results } = setup({}, { onDialogCancel: cancel });
    const held = file("held.txt", "text/plain");
    controller.sync([held]);
    expect(input.files?.[0]).toBe(held);
    input.files = new DataTransfer().files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(0);
    expect(input.files?.[0]?.name).toBe("held.txt");
    input.dispatchEvent(new Event("cancel"));
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(controller.dialogActive).toBe(false);
  });

  it("noClick refuses pointer clicks; disabled and handled clicks are ignored", () => {
    const opened = vi.fn();
    const { input, cfg } = setup({ noClick: true }, { onDialogOpen: opened });
    const pointer = new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 });
    input.dispatchEvent(pointer);
    expect(pointer.defaultPrevented).toBe(true);
    expect(opened).not.toHaveBeenCalled();
    cfg.noClick = false;
    cfg.disabled = true;
    input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    cfg.disabled = false;
    const handled = new MouseEvent("click", { bubbles: true, cancelable: true });
    handled.preventDefault();
    input.dispatchEvent(handled);
    expect(opened).not.toHaveBeenCalled();
  });

  it("opens the dialog with Enter, open() and [data-ok-upload-open] triggers", () => {
    const { input, root, controller, cfg } = setup({ noClick: true });
    const click = vi.spyOn(input, "click").mockImplementation(() => {
      input.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 0 }));
    });
    const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(click).toHaveBeenCalledTimes(1);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", repeat: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    const handled = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    handled.preventDefault();
    input.dispatchEvent(handled);
    expect(click).toHaveBeenCalledTimes(1);
    cfg.noKeyboard = true;
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    expect(click).toHaveBeenCalledTimes(1);
    (root.querySelector("[data-ok-upload-open]") as HTMLElement).click();
    expect(click).toHaveBeenCalledTimes(2);
    controller.open();
    expect(click).toHaveBeenCalledTimes(3);
    expect(controller.dialogActive).toBe(true);
    cfg.disabled = true;
    controller.open();
    expect(click).toHaveBeenCalledTimes(3);
  });

  it("triggers of another upload, handled clicks and other clicks don't open this one", () => {
    const { root, input } = setup();
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    const nested = document.createElement("div");
    nested.setAttribute("data-ok-upload", "");
    nested.innerHTML = '<button type="button" data-ok-upload-open>Other</button>';
    root.append(nested);
    (nested.querySelector("button") as HTMLElement).click();
    const trigger = root.querySelector<HTMLElement>(":scope > div > [data-ok-upload-open]");
    trigger?.addEventListener("click", (e) => e.preventDefault(), { once: true });
    trigger?.click();
    (root.querySelector("[data-ok-upload-placeholder]") as HTMLElement).click();
    expect(click).not.toHaveBeenCalled();
  });

  it("does nothing without an input", () => {
    const host = mount("<div data-ok-upload></div>");
    const root = host.firstElementChild as HTMLElement;
    const controller = createUploadController(root, {
      input: () => null,
      config: () => ({}),
      onFiles: () => {},
    });
    controllers.push(controller);
    controller.open();
    controller.sync([file("a")]);
    expect(controller.drag).toEqual({ active: false, verdict: null, global: false });
  });

  it("reports a form reset after the native reset", async () => {
    const reset = vi.fn();
    const { host } = setup({}, { onReset: reset });
    (host.querySelector("form") as HTMLFormElement).reset();
    await flush();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("follows a replaced input", () => {
    const host = mount('<div data-ok-upload><input type="file"></div>');
    const root = host.firstElementChild as HTMLElement;
    let input = root.querySelector("input") as HTMLInputElement;
    const results: unknown[] = [];
    const controller = createUploadController(root, {
      input: () => input,
      config: () => ({}),
      onFiles: (r) => results.push(r),
    });
    controllers.push(controller);
    const next = document.createElement("input");
    next.type = "file";
    input.replaceWith(next);
    input = next;
    controller.sync([]);
    const data = new DataTransfer();
    data.items.add(file("a"));
    next.files = data.files;
    next.dispatchEvent(new Event("change"));
    expect(results).toHaveLength(1);
  });

  it("keeps the native selection where DataTransfer can't be built", () => {
    const { controller, input } = setup();
    vi.stubGlobal(
      "DataTransfer",
      class {
        constructor() {
          throw new Error("unsupported");
        }
      },
    );
    expect(() => controller.sync([file("a")])).not.toThrow();
    vi.stubGlobal("DataTransfer", undefined);
    expect(() => controller.sync([file("a")])).not.toThrow();
    expect(input.files?.length ?? 0).toBe(0);
  });
});

describe("createUploadController: paste", () => {
  it("pastes files; ignores pastes without files, noPaste and disabled", () => {
    const { root, results, cfg } = setup({ multiple: true });
    const event = paste([file("shot.png", "image/png")]);
    root.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(results[0]?.[1]).toBe("paste");
    const text = paste([], ["text/plain"]);
    root.dispatchEvent(text);
    expect(text.defaultPrevented).toBe(false);
    root.dispatchEvent(paste([]));
    cfg.noPaste = true;
    root.dispatchEvent(paste([file("a")]));
    cfg.noPaste = false;
    cfg.disabled = true;
    root.dispatchEvent(paste([file("a")]));
    expect(results).toHaveLength(1);
    // Without clipboard data.
    cfg.disabled = false;
    const bare = new Event("paste", { bubbles: true });
    Object.defineProperty(bare, "clipboardData", { value: null });
    root.dispatchEvent(bare);
    expect(results).toHaveLength(1);
  });

  it("a paste handled by an inner upload isn't handled again", () => {
    const outer = setup({ multiple: true });
    const inner = document.createElement("div");
    outer.root.append(inner);
    const innerResults: unknown[] = [];
    controllers.push(
      createUploadController(inner, {
        input: () => null,
        config: () => ({}),
        onFiles: (r) => innerResults.push(r),
      }),
    );
    inner.dispatchEvent(paste([file("a")]));
    expect(innerResults).toHaveLength(1);
    expect(outer.results).toHaveLength(0);
  });
});

describe("createUploadController: validation", () => {
  it("waits for async validators, marks the root busy, and lets the latest drop win", async () => {
    const busy = vi.fn();
    let release: (value: null) => void = () => {};
    const { root, results, cfg } = setup(
      {
        multiple: true,
        validator: (f) =>
          f.name === "slow" ? new Promise((resolve) => (release = resolve)) : null,
      },
      { onProcessingChange: busy },
    );
    root.dispatchEvent(drag("drop", [file("slow")]));
    expect(root.getAttribute("aria-busy")).toBe("true");
    expect(busy).toHaveBeenLastCalledWith(true);
    root.dispatchEvent(drag("drop", [file("fast")]));
    expect(results.map(([r]) => r.accepted[0]?.name)).toEqual(["fast"]);
    release(null);
    await flush();
    expect(results).toHaveLength(1);
    cfg.validator = async () => ({ code: "no", message: "No" });
    root.dispatchEvent(drag("drop", [file("x")]));
    await flush();
    expect(results[1]?.[0].rejections[0]?.errors[0]?.code).toBe("no");
    expect(root.hasAttribute("aria-busy")).toBe(false);
  });

  it("reports validators that throw or reject, and discards the drop", async () => {
    const errors: unknown[] = [];
    const { root, results, cfg } = setup(
      {
        validator: () => {
          throw new Error("boom");
        },
      },
      { onError: (e) => errors.push(e) },
    );
    root.dispatchEvent(drag("drop", [file("a")]));
    expect(errors).toHaveLength(1);
    cfg.validator = () => Promise.reject(new Error("later"));
    root.dispatchEvent(drag("drop", [file("a")]));
    await flush();
    expect(results).toHaveLength(0);
  });

  it("reads files with getFilesFromEvent (sync, async or throwing)", async () => {
    const errors: unknown[] = [];
    const custom = file("custom.txt", "text/plain");
    const { root, results, cfg, input } = setup(
      { multiple: true, getFilesFromEvent: () => [custom] },
      { onError: (e) => errors.push(e) },
    );
    root.dispatchEvent(drag("drop", [file("ignored")]));
    expect(results[0]?.[0].accepted).toEqual([custom]);
    cfg.getFilesFromEvent = async () => [custom, custom];
    const data = new DataTransfer();
    data.items.add(file("picked"));
    input.files = data.files;
    input.dispatchEvent(new Event("change"));
    await flush();
    expect(results[1]?.[0].accepted).toHaveLength(2);
    cfg.getFilesFromEvent = () => {
      throw new Error("read");
    };
    root.dispatchEvent(paste([file("a")]));
    expect(errors).toHaveLength(1);
    // A sync reader whose files make the check throw.
    cfg.getFilesFromEvent = async () => [custom];
    cfg.validator = () => {
      throw new Error("check");
    };
    root.dispatchEvent(drag("drop", [file("a")]));
    await flush();
  });

  it("ignores results that arrive after destroy", async () => {
    let release: (value: null) => void = () => {};
    const { root, results, controller } = setup({
      validator: () => new Promise((resolve) => (release = resolve)),
    });
    root.dispatchEvent(drag("drop", [file("a")]));
    controller.destroy();
    expect(root.hasAttribute("aria-busy")).toBe(false);
    release(null);
    await flush();
    expect(results).toHaveLength(0);
    // Async readers too.
    const second = setup({ getFilesFromEvent: async () => [file("b")] });
    second.root.dispatchEvent(drag("drop", [file("b")]));
    second.controller.destroy();
    await flush();
    expect(second.results).toHaveLength(0);
  });
});

describe("createUploadController: File System Access API", () => {
  const handle = (f: File) => ({ getFile: () => Promise.resolve(f) });

  it("is used only where showOpenFilePicker exists in a secure context", () => {
    expect(canUseFsAccessApi({ isSecureContext: true } as Window)).toBe(false);
    expect(
      canUseFsAccessApi({ isSecureContext: false, showOpenFilePicker: () => {} } as never),
    ).toBe(false);
    expect(
      canUseFsAccessApi({ isSecureContext: true, showOpenFilePicker: () => {} } as never),
    ).toBe(true);
  });

  it("opens the picker with the accept groups and reports the picked files", async () => {
    const picker = vi.fn(() => Promise.resolve([handle(file("a.png", "image/png"))]));
    vi.stubGlobal("showOpenFilePicker", picker);
    const opened = vi.fn();
    const { controller, results, input } = setup(
      {
        useFsAccessApi: true,
        multiple: true,
        accept: "image/png",
        acceptOption: [{ description: "Images", accept: { "image/png": [".png"] } }],
      },
      { onDialogOpen: opened },
    );
    controller.open();
    expect(opened).toHaveBeenCalled();
    expect(picker).toHaveBeenCalledWith({
      multiple: true,
      types: [{ description: "Images", accept: { "image/png": [".png"] } }],
      excludeAcceptAllOption: true,
    });
    await flush();
    expect(results[0]?.[1]).toBe("picker");
    // A click on the input goes to the picker too.
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    input.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(picker).toHaveBeenCalledTimes(2);
  });

  it("uses the accept attribute and getFilesFromEvent with the handles", async () => {
    const picked = [handle(file("a"))];
    vi.stubGlobal(
      "showOpenFilePicker",
      vi.fn(() => Promise.resolve(picked)),
    );
    const reader = vi.fn(() => [file("from-handles")]);
    const { controller, results } = setup({
      useFsAccessApi: true,
      getFilesFromEvent: reader,
    });
    controller.open();
    await flush();
    expect(reader).toHaveBeenCalledWith(picked);
    expect(results[0]?.[0].accepted[0]?.name).toBe("from-handles");
  });

  it("cancel, policy refusal (falls back to the input) and other errors", async () => {
    let failure: unknown = new DOMException("x", "AbortError");
    vi.stubGlobal(
      "showOpenFilePicker",
      vi.fn(() => Promise.reject(failure)),
    );
    const cancel = vi.fn();
    const errors: unknown[] = [];
    const { controller, input } = setup(
      { useFsAccessApi: true },
      { onDialogCancel: cancel, onError: (e) => errors.push(e) },
    );
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    controller.open();
    await flush();
    expect(cancel).toHaveBeenCalledTimes(1);
    failure = new DOMException("x", "NotAllowedError");
    controller.open();
    await flush();
    expect(click).toHaveBeenCalledTimes(1);
    failure = new DOMException("x", "SecurityError");
    controller.open();
    await flush();
    expect(click).toHaveBeenCalledTimes(2);
    failure = "weird";
    controller.open();
    await flush();
    expect(errors).toEqual(["weird"]);
    expect(controller.dialogActive).toBe(false);
  });
});

describe("createUploadController: lifecycle", () => {
  it("destroy removes its state attributes and listeners", () => {
    const { root, results, controller } = setup();
    root.dispatchEvent(drag("dragenter", [file("a")]));
    expect(root.hasAttribute("data-ok-drag")).toBe(true);
    controller.destroy();
    expect(root.hasAttribute("data-ok-drag")).toBe(false);
    expect(root.hasAttribute("data-ok-drag-global")).toBe(false);
    root.dispatchEvent(drag("drop", [file("a")]));
    expect(results).toHaveLength(0);
    expect(controller.processing).toBe(false);
  });
});
