import { loader, type Monaco } from "@owlky/core/code-editor";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage } from "../../test-utils.js";
import { nextEvent, useTestWorkers, whenAttribute } from "../code-editor/test-utils.js";
import { createDiffEditor, type DiffEditorElementInstance, diffEditor } from "./diff-editor.js";

let monaco: Monaco;
beforeAll(async () => {
  useTestWorkers();
  monaco = await loader.init();
});
let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  for (const model of monaco.editor.getModels()) model.dispose();
});

const DIFF = (attributes = "") => `
  <div data-ok-diff-editor ${attributes}>
    <textarea data-ok-diff-editor-original aria-label="Before">a\nb\n</textarea>
    <textarea data-ok-diff-editor-modified aria-label="After">a\nc\n</textarea>
    <div data-ok-diff-editor-loading role="status">Loading...</div>
    <div data-ok-diff-editor-content></div>
  </div>`;

function setup(attributes = "", definition = diffEditor) {
  const host = mount(DIFF(attributes));
  const root = host.firstElementChild as HTMLElement;
  runtime = createRuntime().register(definition).start();
  const instance = runtime.get<DiffEditorElementInstance>(
    root,
    "diff-editor",
  ) as DiffEditorElementInstance;
  return { root, instance, ready: () => whenAttribute(root, "data-ok-status", "ready") };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("diff editor (HTML)", () => {
  it("mounts both texts with their labels and reports mount", async () => {
    const { root, instance, ready } = setup(
      'data-ok-language="markdown" data-ok-modified-language="plaintext" data-ok-height="300" data-ok-original-model-path="file:///a.md" data-ok-modified-model-path="file:///b.md" data-ok-options=\'{"renderSideBySide":true}\'',
    );
    const mounted = nextEvent<{ editor: unknown; monaco: Monaco }>(root, "ok:diff-editor:mount");
    expect(instance.status).toBe("loading");
    expect(instance.original).toBe("a\nb\n");
    expect(instance.modified).toBe("a\nc\n");
    expect(instance.editor).toBeNull();
    expect(root.style.getPropertyValue("--_ok-code-editor-height")).toBe("300px");
    await ready();
    expect((await mounted).monaco).toBe(monaco);
    expect(instance.status).toBe("ready");
    expect(instance.monaco).toBe(monaco);
    const editor = instance.editor as NonNullable<typeof instance.editor>;
    const models = () => editor.getModel() as NonNullable<ReturnType<typeof editor.getModel>>;
    expect(models().original.uri.toString()).toBe("file:///a.md");
    expect(models().original.getLanguageId()).toBe("markdown");
    expect(models().modified.getLanguageId()).toBe("plaintext");
    const label = (side: "getOriginalEditor" | "getModifiedEditor") =>
      editor[side]().getOption(monaco.editor.EditorOption.ariaLabel);
    expect(label("getOriginalEditor")).toContain("Before");
    expect(label("getModifiedEditor")).toContain("After");

    instance.setOriginal("x\n");
    instance.setModified("y\n");
    expect(instance.original).toBe("x\n");
    expect(instance.modified).toBe("y\n");
    instance.updateOptions({ renderSideBySide: false });
    expect(instance.controller.editor).toBe(editor);

    root.setAttribute("data-ok-original-language", "json");
    await tick();
    expect(models().original.getLanguageId()).toBe("json");
    root.setAttribute("data-ok-modified-model-path", "file:///c.md");
    await tick();
    expect(models().modified.uri.toString()).toBe("file:///c.md");
    root.setAttribute("data-ok-monaco-theme", "hc-black");
    root.setAttribute("data-ok-options", '{"readOnly":true}');
    root.setAttribute("data-ok-width", "50%");
    await tick();
    expect(root.style.getPropertyValue("--_ok-code-editor-width")).toBe("50%");
    expect(editor.getModifiedEditor().getOption(monaco.editor.EditorOption.readOnly)).toBe(true);
  });

  it("reveals data-ok-line and follows it", async () => {
    const host = mount(`
      <div data-ok-diff-editor data-ok-height="300" data-ok-line="250">
        <textarea data-ok-diff-editor-original aria-label="Before">${"x\n".repeat(300)}</textarea>
        <textarea data-ok-diff-editor-modified aria-label="After">${"x\n".repeat(300)}</textarea>
        <div data-ok-diff-editor-content></div>
      </div>`);
    const root = host.firstElementChild as HTMLElement;
    runtime = createRuntime().register(diffEditor).start();
    await whenAttribute(root, "data-ok-status", "ready");
    const instance = runtime.get<DiffEditorElementInstance>(root, "diff-editor");
    const editor = instance?.editor as NonNullable<DiffEditorElementInstance["editor"]>;
    expect(editor.getModifiedEditor().getScrollTop()).toBeGreaterThan(0);
    const reveal = vi.spyOn(editor, "revealLine");
    root.setAttribute("data-ok-line", "3");
    await tick();
    expect(reveal).toHaveBeenCalledWith(3);
  });

  it("writes the texts back when the runtime stops", async () => {
    const beforeMount = vi.fn();
    const onMount = vi.fn();
    const { root, instance, ready } = setup("", createDiffEditor({ beforeMount, onMount }));
    await ready();
    expect(beforeMount).toHaveBeenCalledWith(monaco);
    expect(onMount).toHaveBeenCalledWith(instance.editor, monaco);
    instance.editor?.getModifiedEditor().setValue("changed");
    runtime?.stop();
    runtime = undefined;
    expect(
      (root.querySelector("[data-ok-diff-editor-modified]") as HTMLTextAreaElement).value,
    ).toBe("changed");
    expect(root.hasAttribute("data-ok-status")).toBe(false);
  });

  it("works without textareas and stops before Monaco is ready", async () => {
    const host = mount("<div data-ok-diff-editor><div data-ok-diff-editor-content></div></div>");
    const root = host.firstElementChild as HTMLElement;
    runtime = createRuntime().register(diffEditor).start();
    const instance = runtime.get<DiffEditorElementInstance>(
      root,
      "diff-editor",
    ) as DiffEditorElementInstance;
    expect(instance.original).toBe("");
    expect(instance.modified).toBe("");
    instance.setOriginal("o");
    instance.setModified("m");
    runtime.stop();
    runtime = undefined;
    expect(root.hasAttribute("data-ok-status")).toBe(false);
  });

  it("needs a content element", () => {
    mount("<div data-ok-diff-editor></div>");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    runtime = createRuntime().register(diffEditor).start();
    error.mockRestore();
    expect(
      runtime.get(document.querySelector("[data-ok-diff-editor]"), "diff-editor"),
    ).toBeUndefined();
  });
});
