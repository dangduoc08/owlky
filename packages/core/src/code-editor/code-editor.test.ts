import { defaultTheme, themeToCss } from "@owlky/tokens";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  type CodeEditorControllerOptions,
  type CodeEditorStatus,
  createCodeEditorController,
  createDiffEditorController,
  type DiffEditorControllerOptions,
  getOrCreateModel,
} from "./controller.js";
import { loader, type Monaco, resetLoader } from "./loader.js";
import { testWorker, whenAttribute } from "./test-utils.js";

const style = document.createElement("style");
let monaco: Monaco;
beforeAll(async () => {
  loader.config({ getWorker: testWorker });
  monaco = await loader.init();
});
beforeEach(() => {
  style.textContent = themeToCss(defaultTheme);
  document.head.append(style);
});
afterEach(() => {
  style.remove();
  cleanupDom();
  for (const model of monaco.editor.getModels()) model.dispose();
});

const ROOT =
  '<div data-ok-code-editor style="height:200px"><div data-ok-code-editor-content style="height:200px"></div></div>';

/** A code editor whose status is mirrored on its root (`data-ok-status`). */
function setup(options: CodeEditorControllerOptions = {}, html = ROOT) {
  const host = mount(html);
  const root = host.firstElementChild as HTMLElement;
  const content = root.querySelector<HTMLElement>("[data-ok-code-editor-content]") as HTMLElement;
  const statuses: CodeEditorStatus[] = [];
  const controller = createCodeEditorController(content, {
    ...options,
    onStatusChange(status, error) {
      statuses.push(status);
      root.setAttribute("data-ok-status", status);
      options.onStatusChange?.(status, error);
    },
  });
  const ready = () => whenAttribute(root, "data-ok-status", "ready");
  return { host, root, content, controller, statuses, ready };
}

const type = (
  editor: { trigger(source: string, id: string, payload: unknown): void },
  text: string,
) => editor.trigger("keyboard", "type", { text });

describe("createCodeEditorController", () => {
  it("mounts Monaco after beforeMount, then reports onMount and ready", async () => {
    const order: string[] = [];
    const { controller, content, ready, statuses } = setup({
      defaultValue: '{ "a": 1 }',
      defaultLanguage: "json",
      beforeMount: (m) => order.push(`before:${m === monaco}`),
      onMount: (editor, m) => order.push(`mount:${editor === controller.editor}:${m === monaco}`),
    });
    expect(controller.status).toBe("loading");
    expect(controller.editor).toBeNull();
    expect(controller.getValue()).toBe('{ "a": 1 }');
    await ready();
    expect(order).toEqual(["before:true", "mount:true:true"]);
    expect(statuses).toEqual(["ready"]);
    expect(controller.status).toBe("ready");
    expect(controller.monaco).toBe(monaco);
    expect(content.querySelector(".monaco-editor")).not.toBeNull();
    expect(controller.editor?.getModel()?.getLanguageId()).toBe("json");
    expect(controller.getValue()).toBe('{ "a": 1 }');
  });

  it("uses value over defaultValue, Owlky's mono font and the given options", async () => {
    const { controller, ready } = setup(
      { value: "a", defaultValue: "b", options: { readOnly: true, ariaLabel: "Code" } },
      '<div data-ok-code-editor style="--ok-font-family-mono: monospace"><div data-ok-code-editor-content style="height:120px"></div></div>',
    );
    await ready();
    const editor = controller.editor;
    expect(editor?.getValue()).toBe("a");
    expect(editor?.getOption(monaco.editor.EditorOption.fontFamily)).toBe("monospace");
    expect(editor?.getOption(monaco.editor.EditorOption.readOnly)).toBe(true);
    expect(editor?.getOption(monaco.editor.EditorOption.ariaLabel)).toBe("Code");
  });

  it("reports changes, but not values it was given", async () => {
    const onChange = vi.fn();
    const { controller, ready } = setup({ defaultValue: "hello", onChange });
    await ready();
    const editor = controller.editor as NonNullable<typeof controller.editor>;
    editor.setPosition({ lineNumber: 1, column: 6 });
    type(editor, "!");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe("hello!");
    expect(onChange.mock.calls[0]?.[1].changes).toHaveLength(1);
    controller.update({ value: "replaced" });
    expect(editor.getValue()).toBe("replaced");
    expect(onChange).toHaveBeenCalledTimes(1);
    // The replacement is one undoable edit.
    editor.trigger("keyboard", "undo", null);
    expect(editor.getValue()).toBe("hello!");
    // The same value changes nothing.
    controller.update({ value: editor.getValue() });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("sets values directly when read only", async () => {
    const { controller, ready } = setup({ defaultValue: "a", options: { readOnly: true } });
    await ready();
    controller.update({ value: "b" });
    expect(controller.getValue()).toBe("b");
  });

  it("switches models by path and keeps their view states", async () => {
    const { controller, ready } = setup({
      defaultPath: "file:///a.ts",
      defaultValue: "const a = 1;\nconst b = 2;\n",
      defaultLanguage: "typescript",
    });
    await ready();
    const editor = controller.editor as NonNullable<typeof controller.editor>;
    // Naming the model it already shows keeps it.
    controller.update({ path: "file:///a.ts" });
    expect(editor.getModel()?.uri.toString()).toBe("file:///a.ts");
    editor.setPosition({ lineNumber: 2, column: 3 });
    controller.update({ path: "file:///b.css", language: "css", value: "a { color: red; }" });
    expect(editor.getModel()?.uri.toString()).toBe("file:///b.css");
    expect(editor.getModel()?.getLanguageId()).toBe("css");
    expect(editor.getValue()).toBe("a { color: red; }");
    // Back to the first model: its content and cursor come back.
    controller.update({ path: "file:///a.ts", value: undefined, language: undefined });
    expect(editor.getValue()).toContain("const b = 2;");
    expect(editor.getPosition()?.lineNumber).toBe(2);
    // The same path is a no-op.
    controller.update({ path: "file:///a.ts" });
    expect(editor.getModel()?.uri.toString()).toBe("file:///a.ts");
  });

  it("restores a saved view state when a path mounts again, unless saveViewState is off", async () => {
    const first = setup({
      defaultPath: "file:///keep.ts",
      defaultValue: "1\n2\n3\n",
      keepCurrentModel: true,
    });
    await first.ready();
    first.controller.editor?.setPosition({ lineNumber: 3, column: 1 });
    first.controller.destroy();
    expect(monaco.editor.getModel(monaco.Uri.parse("file:///keep.ts"))).not.toBeNull();
    const second = setup({ defaultPath: "file:///keep.ts" });
    await second.ready();
    expect(second.controller.editor?.getPosition()?.lineNumber).toBe(3);
    expect(second.controller.getValue()).toBe("1\n2\n3\n");
    second.controller.destroy();
    // Disposed with the editor (keepCurrentModel off).
    expect(monaco.editor.getModel(monaco.Uri.parse("file:///keep.ts"))).toBeNull();

    const off = setup({
      defaultPath: "file:///x.ts",
      defaultValue: "1\n2\n",
      saveViewState: false,
    });
    await off.ready();
    const editor = off.controller.editor as NonNullable<typeof off.controller.editor>;
    editor.setPosition({ lineNumber: 2, column: 1 });
    off.controller.update({ path: "file:///y.ts" });
    off.controller.update({ path: "file:///x.ts" });
    expect(editor.getPosition()?.lineNumber).toBe(1);
    off.controller.destroy();
    const kept = setup({
      defaultPath: "file:///z.ts",
      saveViewState: false,
      keepCurrentModel: true,
    });
    await kept.ready();
    kept.controller.destroy();
    expect(monaco.editor.getModel(monaco.Uri.parse("file:///z.ts"))).not.toBeNull();
  });

  it("updates language, line, options and theme", async () => {
    const { controller, root, ready } = setup({ defaultValue: "x\n".repeat(200), line: 1 });
    await ready();
    const editor = controller.editor as NonNullable<typeof controller.editor>;
    const reveal = vi.spyOn(editor, "revealLine");
    const updateOptions = vi.spyOn(editor, "updateOptions");
    controller.update({ language: "python" });
    expect(editor.getModel()?.getLanguageId()).toBe("python");
    controller.update({ line: 150 });
    controller.update({ line: 150 });
    expect(reveal).toHaveBeenCalledTimes(1);
    const options = { minimap: { enabled: false } };
    controller.update({ options });
    controller.update({ options });
    expect(updateOptions).toHaveBeenCalledTimes(1);
    const background = () =>
      getComputedStyle(root.querySelector(".monaco-editor-background") as Element).backgroundColor;
    expect(background()).toBe("rgb(255, 255, 255)");
    controller.update({ theme: "vs-dark" });
    expect(background()).toBe("rgb(30, 30, 30)");
    controller.update({ theme: "auto" });
    expect(background()).toBe("rgb(255, 255, 255)");
    // `auto` follows the scope's data-ok-theme.
    root.setAttribute("data-ok-theme", "dark");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(background()).toBe("rgb(24, 24, 27)");
    controller.update({ theme: "auto" });
  });

  it("reports the current model's markers", async () => {
    let reported: (() => void) | undefined;
    const onValidate = vi.fn((_markers: { message: string }[]) => reported?.());
    const { controller, ready } = setup({ defaultPath: "file:///v.txt", onValidate });
    await ready();
    const next = () => new Promise<void>((resolve) => (reported = resolve));
    const model = controller.editor?.getModel() as NonNullable<
      ReturnType<NonNullable<typeof controller.editor>["getModel"]>
    >;
    const first = next();
    monaco.editor.setModelMarkers(model, "test", [
      {
        severity: monaco.MarkerSeverity.Error,
        message: "Bad",
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      },
    ]);
    await first;
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onValidate.mock.calls[0]?.[0][0]?.message).toBe("Bad");
    // Other models' markers are not reported.
    const other = monaco.editor.createModel("", "plaintext", monaco.Uri.parse("file:///other.txt"));
    monaco.editor.setModelMarkers(other, "test", [
      {
        severity: monaco.MarkerSeverity.Error,
        message: "Other",
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      },
    ]);
    const second = next();
    monaco.editor.setModelMarkers(model, "test", []);
    await second;
    expect(onValidate).toHaveBeenCalledTimes(2);
    expect(onValidate.mock.calls[1]?.[0]).toEqual([]);
  });

  it("validates JSON through its worker", async () => {
    const markers = new Promise<unknown[]>((resolve) => {
      const { ready } = setup({
        defaultPath: "file:///bad.json",
        defaultLanguage: "json",
        defaultValue: '{ "a": }',
        onValidate: (found) => {
          if (found.length > 0) resolve(found);
        },
      });
      void ready();
    });
    expect((await markers).length).toBeGreaterThan(0);
  });

  it("works without a root, tokens or values", async () => {
    style.remove();
    const host = mount('<div style="height:120px"></div>');
    const content = host.firstElementChild as HTMLElement;
    let done: () => void = () => {};
    const mounted = new Promise<void>((resolve) => (done = resolve));
    const controller = createCodeEditorController(content, { onMount: () => done() });
    expect(controller.getValue()).toBe("");
    await mounted;
    const editor = controller.editor as NonNullable<typeof controller.editor>;
    expect(editor.getValue()).toBe("");
    // A path for the model it already shows, then a new one from nothing.
    controller.update({ path: "" });
    expect(editor.getModel()?.uri.scheme).toBe("inmemory");
    controller.update({ path: "file:///new.txt" });
    expect(editor.getValue()).toBe("");
    controller.destroy();

    const diffHost = mount('<div style="height:120px"></div>');
    let diffDone: () => void = () => {};
    const diffMounted = new Promise<void>((resolve) => (diffDone = resolve));
    const diff = createDiffEditorController(diffHost.firstElementChild as HTMLElement, {
      onMount: () => diffDone(),
    });
    await diffMounted;
    expect(diff.editor?.getModel()?.original.getLanguageId()).toBe("plaintext");
    diff.destroy();
  });

  it("creates in-memory models without a path", () => {
    const model = getOrCreateModel(monaco, "text", "plaintext", undefined);
    expect(model.uri.scheme).toBe("inmemory");
    expect(getOrCreateModel(monaco, "", undefined, "file:///m.txt")).toBe(
      getOrCreateModel(monaco, "other", undefined, "file:///m.txt"),
    );
  });

  it("does nothing once destroyed or before Monaco is ready", async () => {
    const onMount = vi.fn();
    const early = setup({ onMount });
    early.controller.update({ value: "ignored" });
    expect(early.controller.getValue()).toBe("ignored");
    early.controller.destroy();
    early.controller.destroy();
    await loader.init();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onMount).not.toHaveBeenCalled();

    // Removed from the page before Monaco is ready: nothing is created.
    const detached = setup({ onMount });
    detached.host.remove();
    await loader.init();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onMount).not.toHaveBeenCalled();
    expect(detached.controller.status).toBe("loading");

    const done = setup();
    await done.ready();
    done.controller.destroy();
    done.controller.update({ value: "late" });
    expect(done.controller.editor).toBeNull();
  });

  it("reports an error when mounting throws", async () => {
    const onStatusChange = vi.fn();
    const { root } = setup({
      beforeMount: () => {
        throw new Error("broken language");
      },
      onStatusChange,
    });
    await whenAttribute(root, "data-ok-status", "error");
    expect(onStatusChange).toHaveBeenCalledWith("error", expect.any(Error));
  });

  it("reports an error when Monaco can't load", async () => {
    resetLoader();
    loader.config({ import: () => Promise.reject(new Error("offline")) });
    const { root, controller } = setup();
    // An editor removed while loading isn't told about the failure.
    const removed = setup();
    removed.controller.destroy();
    await whenAttribute(root, "data-ok-status", "error");
    expect(controller.status).toBe("error");
    expect(removed.statuses).toEqual([]);
    // Back to the real Monaco for the other tests.
    resetLoader();
    loader.config({ monaco });
  });
});

const DIFF =
  '<div data-ok-diff-editor><div data-ok-diff-editor-content style="height:200px"></div></div>';

function setupDiff(options: DiffEditorControllerOptions = {}) {
  const host = mount(DIFF);
  const root = host.firstElementChild as HTMLElement;
  const content = root.querySelector<HTMLElement>("[data-ok-diff-editor-content]") as HTMLElement;
  const controller = createDiffEditorController(content, {
    ...options,
    onStatusChange(status) {
      root.setAttribute("data-ok-status", status);
    },
  });
  return { root, controller, ready: () => whenAttribute(root, "data-ok-status", "ready") };
}

describe("createDiffEditorController", () => {
  it("mounts both models and updates them", async () => {
    const onMount = vi.fn();
    const beforeMount = vi.fn();
    const { controller, root, ready } = setupDiff({
      original: "a\nb\n",
      modified: "a\nc\n",
      language: "markdown",
      modifiedLanguage: "plaintext",
      options: { originalAriaLabel: "Before", modifiedAriaLabel: "After" },
      onMount,
      beforeMount,
    });
    expect(controller.status).toBe("loading");
    await ready();
    expect(beforeMount).toHaveBeenCalledWith(monaco);
    expect(onMount).toHaveBeenCalledWith(controller.editor, monaco);
    expect(controller.monaco).toBe(monaco);
    expect(controller.status).toBe("ready");
    expect(root.querySelector(".monaco-diff-editor")).not.toBeNull();
    const editor = controller.editor as NonNullable<typeof controller.editor>;
    const models = () => editor.getModel() as NonNullable<ReturnType<typeof editor.getModel>>;
    expect(models().original.getLanguageId()).toBe("markdown");
    expect(models().modified.getLanguageId()).toBe("plaintext");

    controller.update({ original: "x\n", modified: "y\n" });
    expect(models().original.getValue()).toBe("x\n");
    expect(models().modified.getValue()).toBe("y\n");
    controller.update({ original: "x\n" });
    controller.update({ language: "css", modifiedLanguage: undefined, originalLanguage: "json" });
    expect(models().original.getLanguageId()).toBe("json");
    expect(models().modified.getLanguageId()).toBe("css");
    controller.update({ language: undefined, originalLanguage: undefined });
    expect(models().original.getLanguageId()).toBe("plaintext");

    const updateOptions = vi.spyOn(editor, "updateOptions");
    const options = { renderSideBySide: false };
    controller.update({ options });
    controller.update({ options });
    expect(updateOptions).toHaveBeenCalledTimes(1);
    // The side labels survive option updates (Monaco drops them otherwise).
    const label = (side: "getOriginalEditor" | "getModifiedEditor") =>
      editor[side]().getOption(monaco.editor.EditorOption.ariaLabel);
    expect(label("getOriginalEditor")).toContain("Before");
    expect(label("getModifiedEditor")).toContain("After");
    controller.update({ options: { renderSideBySide: true, originalAriaLabel: "Old" } });
    controller.update({ options: { renderSideBySide: false } });
    expect(label("getOriginalEditor")).toContain("Old");
    expect(label("getModifiedEditor")).toContain("After");
    controller.update({ theme: "hc-black" });
    controller.update({ theme: "hc-black" });

    controller.update({ originalModelPath: "file:///o.md", modifiedModelPath: "file:///m.md" });
    expect(models().original.uri.toString()).toBe("file:///o.md");
    controller.update({ modifiedModelPath: "file:///m2.md" });
    expect(models().modified.uri.toString()).toBe("file:///m2.md");
    controller.update({ originalModelPath: "file:///o.md" });
    controller.destroy();
    controller.destroy();
    expect(monaco.editor.getModel(monaco.Uri.parse("file:///o.md"))).toBeNull();
    controller.update({ original: "late" });
  });

  it("reveals the line of the modified text", async () => {
    const text = "x\n".repeat(300);
    const { controller, ready } = setupDiff({ original: text, modified: text, line: 250 });
    await ready();
    const editor = controller.editor as NonNullable<typeof controller.editor>;
    expect(editor.getModifiedEditor().getScrollTop()).toBeGreaterThan(0);
    const reveal = vi.spyOn(editor, "revealLine");
    controller.update({ line: 1 });
    controller.update({ line: 1 });
    controller.update({ line: undefined });
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(reveal).toHaveBeenCalledWith(1);
    controller.destroy();
  });

  it("keeps models on request and stops before Monaco is ready", async () => {
    const kept = setupDiff({
      originalModelPath: "file:///ko.txt",
      modifiedModelPath: "file:///km.txt",
      keepCurrentOriginalModel: true,
      keepCurrentModifiedModel: true,
      options: { readOnly: true },
    });
    await kept.ready();
    kept.controller.update({ modified: "read only" });
    expect(kept.controller.editor?.getModifiedEditor().getValue()).toBe("read only");
    kept.controller.destroy();
    expect(monaco.editor.getModel(monaco.Uri.parse("file:///ko.txt"))).not.toBeNull();
    expect(monaco.editor.getModel(monaco.Uri.parse("file:///km.txt"))).not.toBeNull();

    const onMount = vi.fn();
    const early = setupDiff({ onMount });
    early.controller.update({ modified: "early" });
    early.controller.destroy();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onMount).not.toHaveBeenCalled();
    expect(early.controller.editor).toBeNull();
  });
});
