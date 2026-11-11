import { loader, type Monaco } from "@owlky/core/code-editor";
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useTestWorkers, whenAttribute } from "../code-editor/test-utils.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { DiffEditor, type DiffEditorProps } from "./diff-editor.js";

let monaco: Monaco;
beforeAll(async () => {
  useTestWorkers();
  monaco = await loader.init();
});
afterEach(() => {
  // Unmount the editors first: Monaco refuses models disposed under a mounted editor.
  cleanup();
  for (const model of monaco.editor.getModels()) model.dispose();
});

function setup(props: DiffEditorProps) {
  let mounted: (editor: Parameters<NonNullable<DiffEditorProps["onMount"]>>[0]) => void = () => {};
  const editor = new Promise<Parameters<NonNullable<DiffEditorProps["onMount"]>>[0]>(
    (resolve) => (mounted = resolve),
  );
  const onMount = vi.fn((instance) => mounted(instance));
  const view = render(<DiffEditor {...props} onMount={onMount} />);
  const root = view.container.querySelector("[data-ok-diff-editor]") as HTMLElement;
  return {
    ...view,
    root,
    onMount,
    ready: async () => {
      const instance = await editor;
      await whenAttribute(root, "data-ok-status", "ready");
      return instance;
    },
    rerenderWith: (next: DiffEditorProps) =>
      view.rerender(<DiffEditor {...next} onMount={onMount} />),
  };
}

describe("DiffEditor", () => {
  it("renders the same anatomy on the server", () => {
    const html = renderToString(<DiffEditor original="a" modified="b" language="markdown" />);
    expect(html).toContain('data-ok-diff-editor=""');
    expect(html).toContain('data-ok-language="markdown"');
    expect(html).toContain('aria-label="Original"');
    expect(html).toContain('aria-label="Modified"');
  });

  it("mounts both models and follows its props", async () => {
    const beforeMount = vi.fn();
    const props: DiffEditorProps = {
      original: "a\nb\n",
      modified: "a\nc\n",
      language: "markdown",
      originalModelPath: "file:///o.md",
      modifiedModelPath: "file:///m.md",
      height: 300,
      className: "diff",
      wrapperProps: { title: "Changes" },
      options: { originalAriaLabel: "Before" },
      beforeMount,
    };
    const ref = createRef<HTMLDivElement>();
    const other = render(<DiffEditor ref={ref} />);
    expect(ref.current).toBe(other.container.querySelector("[data-ok-diff-editor]"));
    other.unmount();
    const { root, ready, rerenderWith, onMount, container } = setup(props);
    expect(root.getAttribute("title")).toBe("Changes");
    expect(root.getAttribute("data-ok-original-model-path")).toBe("file:///o.md");
    expect(root.querySelector("[data-ok-diff-editor-content]")?.className).toBe("diff");
    expect(root.querySelector("[data-ok-diff-editor-original]")?.getAttribute("aria-label")).toBe(
      "Before",
    );
    const editor = await ready();
    expect(beforeMount).toHaveBeenCalledWith(monaco);
    expect(onMount).toHaveBeenCalledWith(editor, monaco);
    const models = () => editor.getModel() as NonNullable<ReturnType<typeof editor.getModel>>;
    expect(models().original.uri.toString()).toBe("file:///o.md");
    expect(models().modified.getLanguageId()).toBe("markdown");
    expect(editor.getOriginalEditor().getOption(monaco.editor.EditorOption.ariaLabel)).toContain(
      "Before",
    );
    expect(editor.getModifiedEditor().getOption(monaco.editor.EditorOption.ariaLabel)).toContain(
      "Modified",
    );
    await expectNoAxeViolations(container);

    rerenderWith({
      ...props,
      original: "x\n",
      modified: "y\n",
      modifiedLanguage: "json",
      modifiedModelPath: "file:///m2.md",
      theme: "vs-dark",
      options: { originalAriaLabel: "Before", renderSideBySide: false },
    });
    expect(models().original.getValue()).toBe("x\n");
    expect(models().modified.getValue()).toBe("y\n");
    expect(models().modified.uri.toString()).toBe("file:///m2.md");
    expect(models().modified.getLanguageId()).toBe("json");
  });

  it("reveals `line` and follows it", async () => {
    const text = "x\n".repeat(300);
    const { root, ready, rerenderWith } = setup({ original: text, modified: text, line: 250 });
    expect(root.getAttribute("data-ok-line")).toBe("250");
    const editor = await ready();
    expect(editor.getModifiedEditor().getScrollTop()).toBeGreaterThan(0);
    const reveal = vi.spyOn(editor, "revealLine");
    rerenderWith({ original: text, modified: text, line: 2 });
    expect(reveal).toHaveBeenCalledWith(2);
    expect(root.getAttribute("data-ok-line")).toBe("2");
  });
});
