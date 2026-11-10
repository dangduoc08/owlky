import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNamedButtons,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { UploadInstance } from "./upload.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const snippet = (name: string) => snippets.find(([path]) => path.includes(name))?.[1] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  vi.restoreAllMocks();
  resetPage();
});
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};

const PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);
const png = (name = "photo.png") => new File([PNG], name, { type: "image/png" });
const file = (name: string, type = "text/plain", size = 5) =>
  new File([new Uint8Array(size)], name, { type });
const HOSTILE = '"><img src=x onerror=alert(1)>.txt';

function drop(target: Element, files: File[]) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      types: ["Files"],
      files,
      items: files.map((f) => ({ kind: "file", type: f.type, getAsFile: () => f })),
      dropEffect: "none",
    },
  });
  target.dispatchEvent(event);
  return event;
}

function setup(name: string) {
  const host = mount(snippet(name));
  start();
  const root = host.querySelector<HTMLElement>("[data-ok-upload]") as HTMLElement;
  const input = root.querySelector<HTMLInputElement>("[data-ok-upload-input]") as HTMLInputElement;
  const instance = runtime?.get<UploadInstance>(root, "upload") as UploadInstance;
  const events: [string, unknown][] = [];
  for (const type of [
    "drop",
    "change",
    "remove",
    "upload",
    "dialogopen",
    "dialogcancel",
    "drag",
    "error",
  ])
    root.addEventListener(`ok:upload:${type}`, (e) =>
      events.push([type, (e as CustomEvent).detail]),
    );
  return { host, root, input, instance, events };
}
const names = (root: Element) =>
  [...root.querySelectorAll("[data-ok-upload-list] [data-ok-upload-item-name]")].map(
    (n) => n.textContent,
  );

describe("upload snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(8));

  it.each(snippets)(
    "%s: valid anatomy, CSP-safe, named controls, no axe violations",
    async (_, html) => {
      const host = mount(html);
      expectCspSafe(host, html);
      expectNamedButtons(host);
      for (const root of host.querySelectorAll("[data-ok-upload]")) {
        const input = root.querySelector("input") as HTMLInputElement;
        expect(input.type).toBe("file");
        expect(input.hasAttribute("data-ok-upload-input")).toBe(true);
        expect(
          input.getAttribute("aria-label") ?? input.getAttribute("aria-labelledby"),
        ).toBeTruthy();
        expect(root.querySelector("[data-ok-upload-rejections]")?.getAttribute("role")).toBe(
          "alert",
        );
      }
      start();
      await expectNoAxeViolations(host);
    },
  );
});

describe("upload runtime", () => {
  it("drops, checks and lists files from the template; mirrors them into the input", async () => {
    const { root, input, instance, events } = setup("validation");
    const event = drop(root, [png(), file("notes.txt"), png("second.png"), png("third.png")]);
    expect(event.defaultPrevented).toBe(true);
    expect(names(root)).toEqual(["photo.png", "second.png", "third.png"]);
    expect(instance.files).toHaveLength(3);
    expect(input.files?.length).toBe(3);
    expect(events.map(([type]) => type)).toEqual(["drop", "change"]);
    expect(events[1]?.[1]).toMatchObject({ reason: "add" });
    const alert = root.querySelector("[data-ok-upload-rejections]") as HTMLElement;
    expect(alert.textContent).toContain("notes.txt - 5 bytes");
    expect(alert.textContent).toContain("- File type must be one of .png, .jpg, .jpeg");
    expect(instance.rejections).toHaveLength(1);
    // maxFiles counts the held files.
    drop(root, [png("fourth.png")]);
    expect(instance.rejections[0]?.errors[0]?.code).toBe("too-many-files");
    const button = root.querySelector<HTMLElement>("[data-ok-upload-remove]") as HTMLElement;
    const name = root.querySelector("[data-ok-upload-item-name]") as HTMLElement;
    expect(button.getAttribute("aria-labelledby")).toBe(`${button.id} ${name.id}`);
    expect(root.querySelector<HTMLImageElement>("[data-ok-upload-thumb] img")?.src).toMatch(
      /^blob:/,
    );
    await expectNoAxeViolations(root);
  });

  it("removes files with their buttons; the focus moves on; remove can be refused", () => {
    const { root, input, instance, events } = setup("multiple");
    drop(root, [file("a.txt"), file("b.txt"), file("c.txt")]);
    const buttons = () => [
      ...root.querySelectorAll<HTMLElement>("[data-ok-upload-list] [data-ok-upload-remove]"),
    ];
    buttons()[1]?.focus();
    buttons()[1]?.click();
    expect(names(root)).toEqual(["a.txt", "c.txt"]);
    expect(document.activeElement).toBe(buttons()[1]);
    root.addEventListener("ok:upload:remove", (e) => e.preventDefault(), { once: true });
    buttons()[0]?.click();
    expect(names(root)).toEqual(["a.txt", "c.txt"]);
    buttons()[1]?.focus();
    buttons()[1]?.click();
    expect(document.activeElement).toBe(buttons()[0]);
    buttons()[0]?.click();
    expect(document.activeElement).toBe(input);
    expect(instance.files).toEqual([]);
    expect(events.filter(([type]) => type === "remove")).toHaveLength(4);
  });

  it("Remove all and Upload buttons", () => {
    const { root, instance, events, input } = setup("multiple");
    const actions = root.querySelector<HTMLElement>("[data-ok-upload-actions]") as HTMLElement;
    expect(actions.hidden).toBe(true);
    drop(root, [file("a.txt")]);
    expect(actions.hidden).toBe(false);
    (root.querySelector("[data-ok-upload-submit]") as HTMLElement).click();
    expect(events.find(([type]) => type === "upload")?.[1]).toEqual({ files: instance.files });
    (root.querySelector("[data-ok-upload-remove-all]") as HTMLElement).click();
    expect(instance.files).toEqual([]);
    expect(actions.hidden).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(events.at(-1)).toEqual(["change", { files: [], reason: "clear" }]);
    // Clicks elsewhere do nothing.
    (root.querySelector("[data-ok-upload-placeholder]") as HTMLElement).click();
  });

  it("a cancelled drop keeps the files", () => {
    const { root, instance } = setup("multiple");
    root.addEventListener("ok:upload:drop", (e) => e.preventDefault(), { once: true });
    drop(root, [file("a.txt")]);
    expect(instance.files).toEqual([]);
    drop(root, [file("b.txt")]);
    expect(names(root)).toEqual(["b.txt"]);
  });

  it("single file: the preview fills the zone; a new file replaces it; remove", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { root, input, instance } = setup("single");
    const remove = root.querySelector<HTMLElement>("[data-ok-upload-remove]") as HTMLElement;
    expect(remove.hidden).toBe(true);
    drop(root, [png("one.png")]);
    const image = root.querySelector<HTMLImageElement>("[data-ok-upload-preview] img");
    expect(image?.alt).toBe("one.png");
    expect(remove.hidden).toBe(false);
    // The remove button is named after the preview.
    expect(remove.getAttribute("aria-labelledby")?.split(" ")[1]).toBe(image?.parentElement?.id);
    drop(root, [file("two.pdf", "application/pdf")]);
    expect(revoke).toHaveBeenCalled();
    expect(root.querySelector("[data-ok-upload-preview-name]")?.textContent).toBe("two.pdf");
    expect(root.querySelector("[data-ok-upload-file]")?.getAttribute("data-ok-kind")).toBe("pdf");
    expect(root.querySelectorAll("[data-ok-upload-preview]")).toHaveLength(1);
    // Same file again: the preview stays.
    instance.setFiles([...instance.files]);
    expect(root.querySelectorAll("[data-ok-upload-preview]")).toHaveLength(1);
    remove.focus();
    remove.click();
    expect(root.querySelector("[data-ok-upload-preview]")).toBeNull();
    expect(remove.hidden).toBe(true);
    expect(document.activeElement).toBe(input);
    await expectNoAxeViolations(root);
  });

  it("avatar: Upload / Update photo, and a photo written in the markup", () => {
    const host = mount(snippet("avatar"));
    const zone = host.querySelector("[data-ok-upload-zone]") as HTMLElement;
    const existing = document.createElement("span");
    existing.setAttribute("data-ok-upload-preview", "");
    const img = document.createElement("img");
    img.alt = "Me";
    existing.append(img);
    zone.append(existing);
    start();
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    const title = root.querySelector("[data-ok-upload-title]") as HTMLElement;
    expect(title.textContent).toBe("Update photo");
    drop(root, [png()]);
    expect(root.querySelectorAll("[data-ok-upload-preview]")).toHaveLength(1);
    expect(existing.isConnected).toBe(false);
    const instance = runtime?.get<UploadInstance>(root, "upload") as UploadInstance;
    instance.clearFiles();
    expect(title.textContent).toBe("Upload photo");
    // Files over the size limit are rejected.
    drop(root, [new File([new Uint8Array(4 * 1024 * 1024)], "big.png", { type: "image/png" })]);
    expect(instance.rejections[0]?.errors[0]?.code).toBe("file-too-large");
  });

  it("the markup's own preview can be removed (single file)", () => {
    const host = mount(snippet("single"));
    const zone = host.querySelector("[data-ok-upload-zone]") as HTMLElement;
    const existing = document.createElement("span");
    existing.setAttribute("data-ok-upload-preview", "");
    existing.id = "upload-single-preview";
    existing.textContent = "report.pdf";
    zone.querySelector("[data-ok-upload-remove]")?.before(existing);
    start();
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    const remove = root.querySelector<HTMLElement>("[data-ok-upload-remove]") as HTMLElement;
    expect(remove.hidden).toBe(false);
    root.addEventListener("ok:upload:remove", (e) => e.preventDefault(), { once: true });
    remove.click();
    expect(existing.isConnected).toBe(true);
    remove.click();
    expect(existing.isConnected).toBe(false);
    expect(remove.hidden).toBe(true);
    // Nothing left to remove.
    remove.hidden = false;
    remove.click();
  });

  it("thumbnails off, file names as text, no template", () => {
    const host = mount(snippet("multiple"));
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    root.setAttribute("data-ok-thumbnail", "false");
    start();
    drop(root, [png(), file(HOSTILE)]);
    expect(root.querySelector("[data-ok-upload-thumb] img")).toBeNull();
    expect(root.querySelector("[data-ok-upload-file-ext]")?.textContent).toBe("PNG");
    expect(names(root)).toEqual(["photo.png", HOSTILE]);
    expect(root.querySelectorAll("[data-ok-upload-list] img")).toHaveLength(0);
    // Toggling thumbnails back on swaps the icons for previews.
    root.removeAttribute("data-ok-thumbnail");
    const instance = runtime?.get<UploadInstance>(root, "upload") as UploadInstance;
    instance.setFiles(instance.files);
    expect(root.querySelectorAll("[data-ok-upload-thumb] img")).toHaveLength(1);
    // Without a template, files are kept but not listed.
    const bare = mount(snippet("multiple"));
    bare.querySelector("template")?.remove();
    runtime?.init(bare);
    const other = bare.querySelector("[data-ok-upload]") as HTMLElement;
    drop(other, [file("x.txt")]);
    expect(other.querySelectorAll("[data-ok-upload-item]")).toHaveLength(0);
    expect(runtime?.get<UploadInstance>(other, "upload")?.files).toHaveLength(1);
  });

  it("noKeyboard takes the input out of the tab order", () => {
    const host = mount(snippet("open-dialog"));
    start();
    const input = host.querySelector("input") as HTMLInputElement;
    expect(input.tabIndex).toBe(-1);
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    root.removeAttribute("data-ok-no-keyboard");
    runtime?.get<UploadInstance>(root, "upload")?.setFiles([]);
    expect(input.hasAttribute("tabindex")).toBe(false);
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    (host.querySelector("[data-ok-upload-open]") as HTMLElement).click();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("events: dialog, drag and errors; the instance API", async () => {
    const { root, input, instance, events } = setup("multiple");
    input.dispatchEvent(new MouseEvent("click", { cancelable: true }));
    expect(instance.isFileDialogActive).toBe(true);
    input.dispatchEvent(new Event("cancel"));
    expect(instance.isFileDialogActive).toBe(false);
    const enter = new Event("dragenter", { bubbles: true, cancelable: true });
    Object.defineProperty(enter, "dataTransfer", {
      value: { types: ["Files"], items: [{ kind: "file", type: "text/plain" }] },
    });
    root.dispatchEvent(enter);
    expect(instance.dragState.verdict).toBe("accept");
    expect(instance.dragState.rejections).toEqual([]);
    expect(root.getAttribute("data-ok-drag")).toBe("accept");
    let release: (v: null) => void = () => {};
    instance.setValidator(() => new Promise((resolve) => (release = resolve)));
    drop(root, [file("a.txt")]);
    expect(instance.isProcessing).toBe(true);
    release(null);
    await settle();
    expect(instance.files).toHaveLength(1);
    instance.setValidator(() => {
      throw new Error("boom");
    });
    drop(root, [file("b.txt")]);
    instance.setValidator(() => ({ code: "x", message: "X" }));
    instance.setErrorMessage((error) => `Translated ${error.code}`);
    drop(root, [file("c.txt")]);
    expect(instance.rejections[0]?.errors[0]?.message).toBe("Translated x");
    instance.setValidator(null);
    instance.setErrorMessage(null);
    instance.setFilesFromEvent(() => [file("custom.txt")]);
    drop(root, [file("ignored.txt")]);
    expect(names(root)).toContain("custom.txt");
    instance.setFilesFromEvent(null);
    expect(events.map(([type]) => type)).toEqual(
      expect.arrayContaining(["dialogopen", "dialogcancel", "drag", "error", "drop", "change"]),
    );
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    instance.open();
    expect(click).toHaveBeenCalledTimes(1);
    const first = instance.files[0] as File;
    instance.removeFile(first);
    expect(instance.files).not.toContain(first);
    instance.setFiles([file("x"), file("y")]);
    expect(names(root)).toEqual(["x", "y"]);
  });

  it("single uploads keep one file from setFiles", () => {
    const { instance, root } = setup("single");
    instance.setFiles([png("a.png"), png("b.png")]);
    expect(instance.files).toHaveLength(1);
    expect(root.querySelectorAll("[data-ok-upload-preview]")).toHaveLength(1);
    instance.setFiles([]);
    expect(root.querySelector("[data-ok-upload-preview]")).toBeNull();
  });

  it("a form reset clears the files; destroy releases the previews", async () => {
    const host = mount(`<form>${snippet("multiple")}</form>`);
    start();
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    const changes: unknown[] = [];
    root.addEventListener("ok:upload:change", (e) => changes.push((e as CustomEvent).detail));
    drop(root, [png()]);
    (host.querySelector("form") as HTMLFormElement).reset();
    await settle();
    expect(changes.at(-1)).toEqual({ files: [], reason: "reset" });
    drop(root, [png()]);
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    runtime?.destroy(host);
    expect(revoke).toHaveBeenCalled();
  });

  it("works with minimal markup (parts are optional)", () => {
    const host = mount(`
      <div data-ok-upload id="multi">
        <div data-ok-upload-zone><input type="file" data-ok-upload-input multiple></div>
        <ul data-ok-upload-list></ul>
        <template data-ok-upload-template><li data-ok-upload-item></li></template>
      </div>
      <div data-ok-upload id="single">
        <div data-ok-upload-zone>
          <input type="file" data-ok-upload-input>
          <button type="button" data-ok-upload-remove hidden>Remove</button>
        </div>
      </div>
      <div data-ok-upload id="bare"></div>`);
    start();
    const multi = host.querySelector("#multi") as HTMLElement;
    const a = file("a.txt");
    drop(multi, [a, file("b.txt")]);
    expect(multi.querySelectorAll("[data-ok-upload-item]")).toHaveLength(2);
    const instance = runtime?.get<UploadInstance>(multi, "upload") as UploadInstance;
    instance.setFiles([]);
    instance.setFiles([a]);
    expect(multi.querySelectorAll("[data-ok-upload-item]")).toHaveLength(1);
    const single = host.querySelector("#single") as HTMLElement;
    drop(single, [file("c.txt")]);
    const remove = single.querySelector<HTMLElement>("[data-ok-upload-remove]") as HTMLElement;
    expect(remove.id).toMatch(/^ok-upload-/);
    expect(single.querySelector("[data-ok-upload-zone] > [data-ok-upload-preview]")).not.toBeNull();
    // The focus stays where it is when it didn't leave with the button.
    const input = single.querySelector("input") as HTMLInputElement;
    input.focus();
    remove.click();
    expect(document.activeElement).toBe(input);
    const bare = host.querySelector("#bare") as HTMLElement;
    drop(bare, [file("d.txt")]);
    expect(runtime?.get<UploadInstance>(bare, "upload")?.files).toHaveLength(1);
  });

  it("previews are made once per file; nested uploads handle their own clicks", () => {
    const host = mount(snippet("multiple"));
    start();
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    const create = vi.spyOn(URL, "createObjectURL");
    drop(root, [png()]);
    const instance = runtime?.get<UploadInstance>(root, "upload") as UploadInstance;
    root.setAttribute("data-ok-thumbnail", "false");
    instance.setFiles(instance.files);
    root.removeAttribute("data-ok-thumbnail");
    instance.setFiles(instance.files);
    expect(create).toHaveBeenCalledTimes(1);
    const nested = document.createElement("div");
    nested.setAttribute("data-ok-upload", "");
    nested.innerHTML = '<button type="button" data-ok-upload-remove-all>Clear</button>';
    root.append(nested);
    (nested.querySelector("button") as HTMLElement).click();
    expect(instance.files).toHaveLength(1);
  });

  it("the error flag marks the input invalid", () => {
    const host = mount(snippet("states-group-1"));
    const root = host.querySelector("[data-ok-upload]") as HTMLElement;
    const input = root.querySelector("input") as HTMLInputElement;
    input.removeAttribute("aria-invalid");
    start();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    root.removeAttribute("data-ok-error");
    runtime?.get<UploadInstance>(root, "upload")?.clearFiles();
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("box uploads hold files without a list", () => {
    const { root, instance } = setup("box");
    drop(root, [file("a.txt"), file("b.txt")]);
    expect(instance.files).toHaveLength(2);
    expect(root.querySelector("[data-ok-upload-list]")).toBeNull();
  });
});
