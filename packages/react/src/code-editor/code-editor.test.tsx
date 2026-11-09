import { codeEditorAttributes } from "@owlky/core";
import { loader, type Monaco } from "@owlky/core/code-editor";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DiffEditor } from "../diff-editor/diff-editor.js";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  CodeEditor,
  type CodeEditorProps,
  optionsAttribute,
  sizeStyle,
  useMonaco,
} from "./code-editor.js";
import { useTestWorkers, whenAttribute } from "./test-utils.js";

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

/** Reports what `useMonaco()` returns. */
function Probe({ onValue }: { onValue: (monaco: Monaco | null) => void }) {
  onValue(useMonaco());
  return null;
}

const rootOf = (container: HTMLElement) =>
  container.querySelector("[data-ok-code-editor]") as HTMLElement;

/** Renders an editor and resolves with its Monaco editor once mounted (outside React's act). */
function setup(props: CodeEditorProps = {}) {
  let mounted: (editor: Parameters<NonNullable<CodeEditorProps["onMount"]>>[0]) => void = () => {};
  const editor = new Promise<Parameters<NonNullable<CodeEditorProps["onMount"]>>[0]>(
    (resolve) => (mounted = resolve),
  );
  const onMount = vi.fn((instance, m: Monaco) => {
    mounted(instance);
    props.onMount?.(instance, m);
  });
  const view = render(<CodeEditor {...props} onMount={onMount} />);
  const root = rootOf(view.container);
  return {
    ...view,
    root,
    onMount,
    ready: async () => {
      const instance = await editor;
      await whenAttribute(root, "data-ok-status", "ready");
      return instance;
    },
    rerenderWith: (next: CodeEditorProps) =>
      view.rerender(<CodeEditor {...next} onMount={onMount} />),
  };
}

describe("CodeEditor", () => {
  it("renders the same anatomy on the server", () => {
    const html = renderToString(
      <CodeEditor
        aria-label="Script"
        defaultValue="a < b"
        defaultLanguage="javascript"
        height={200}
      />,
    );
    expect(html).toContain('data-ok-code-editor=""');
    expect(html).toContain('data-ok-status="loading"');
    expect(html).toContain('data-ok-language="javascript"');
    expect(html).toContain('data-ok-height="200"');
    expect(html).toContain("--_ok-code-editor-height:200px");
    expect(html).toContain('aria-label="Script"');
    expect(html).toContain("a &lt; b</textarea>");
    expect(html).toContain('role="status">Loading...</div>');
  });

  it("mounts Monaco with its props, then is accessible", async () => {
    const beforeMount = vi.fn();
    const ref = createRef<HTMLDivElement>();
    const { root, ready, onMount, container } = setup({
      defaultValue: "const a = 1;",
      defaultLanguage: "typescript",
      defaultPath: "file:///a.ts",
      width: "50%",
      height: 240,
      line: 1,
      theme: "vs-dark",
      keepCurrentModel: true,
      saveViewState: false,
      className: "content",
      wrapperProps: { title: "Frame", style: { margin: 4 } },
      options: { minimap: { enabled: false } },
      loading: <strong>Wait</strong>,
      beforeMount,
    });
    const view = render(<CodeEditor ref={ref} defaultValue="" />, {
      container: document.body.appendChild(document.createElement("div")),
    });
    expect(ref.current).toBe(rootOf(view.container));
    expect(root.getAttribute("data-ok-status")).toBe("loading");
    expect(root.querySelector("[data-ok-code-editor-loading] strong")?.textContent).toBe("Wait");
    expect(root.getAttribute("title")).toBe("Frame");
    expect(root.style.margin).toBe("4px");
    expect(root.style.getPropertyValue("--_ok-code-editor-width")).toBe("50%");
    expect(root.getAttribute("data-ok-path")).toBe("file:///a.ts");
    expect(root.getAttribute("data-ok-save-view-state")).toBe("false");
    expect(root.getAttribute("data-ok-options")).toBe('{"minimap":{"enabled":false}}');
    expect(root.getAttribute("data-ok-monaco-theme")).toBe("vs-dark");
    expect(root.querySelector("[data-ok-code-editor-content]")?.className).toBe("content");
    const editor = await ready();
    expect(beforeMount).toHaveBeenCalledWith(monaco);
    expect(onMount).toHaveBeenCalledWith(editor, monaco);
    expect(editor.getModel()?.getLanguageId()).toBe("typescript");
    expect(editor.getOption(monaco.editor.EditorOption.ariaLabel)).toBe("Code editor");
    expect(editor.getOption(monaco.editor.EditorOption.minimap).enabled).toBe(false);
    await expectNoAxeViolations(container);
    view.unmount();
  });

  it("reports typing, applies a new value without reporting it, and keeps the textarea", async () => {
    const onChange = vi.fn();
    const { root, ready, rerenderWith } = setup({ value: "hello", onChange, "aria-label": "Text" });
    const editor = await ready();
    const field = root.querySelector("textarea") as HTMLTextAreaElement;
    editor.setPosition({ lineNumber: 1, column: 6 });
    editor.trigger("keyboard", "type", { text: "!" });
    expect(onChange).toHaveBeenLastCalledWith(
      "hello!",
      expect.objectContaining({ changes: expect.any(Array) }),
    );
    expect(field.value).toBe("hello!");
    rerenderWith({ value: "replaced", onChange, "aria-label": "Text" });
    expect(editor.getValue()).toBe("replaced");
    expect(onChange).toHaveBeenCalledTimes(1);
    // The hidden textarea reports nothing while Monaco is ready.
    fireEvent.input(field, { target: { value: "ignored" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    // A new language and theme; a new options object with the same content changes nothing.
    const updateOptions = vi.spyOn(editor, "updateOptions");
    rerenderWith({
      value: "replaced",
      language: "python",
      theme: "hc-black",
      line: 1,
      "aria-label": "Text",
      options: { wordWrap: "on" },
    });
    expect(editor.getModel()?.getLanguageId()).toBe("python");
    expect(updateOptions).toHaveBeenCalledTimes(1);
    rerenderWith({
      value: "replaced",
      language: "python",
      theme: "hc-black",
      line: 1,
      "aria-label": "Text",
      options: { wordWrap: "on" },
    });
    expect(updateOptions).toHaveBeenCalledTimes(1);
  });

  it("switches models by path with each file's defaults", async () => {
    const files = {
      "a.js": { language: "javascript", value: "a();" },
      "b.css": { language: "css", value: "b {}" },
    };
    const props = (name: keyof typeof files): CodeEditorProps => ({
      path: `file:///${name}`,
      defaultLanguage: files[name].language,
      defaultValue: files[name].value,
    });
    const { ready, rerenderWith, root } = setup(props("a.js"));
    const editor = await ready();
    expect(editor.getValue()).toBe("a();");
    rerenderWith(props("b.css"));
    expect(editor.getValue()).toBe("b {}");
    expect(editor.getModel()?.getLanguageId()).toBe("css");
    expect(root.getAttribute("data-ok-language")).toBe("css");
    rerenderWith(props("a.js"));
    expect(editor.getValue()).toBe("a();");
  });

  it("reports markers through onValidate", async () => {
    const markers = new Promise<unknown[]>((resolve) => {
      setup({
        defaultPath: "file:///bad.json",
        defaultLanguage: "json",
        defaultValue: '{ "a": }',
        onValidate: (found) => {
          if (found.length > 0) resolve(found);
        },
      });
    });
    expect((await markers).length).toBeGreaterThan(0);
  });

  it("works in StrictMode and writes values given before Monaco is ready", async () => {
    const { container, rerender } = render(
      <StrictMode>
        <CodeEditor value="one" />
      </StrictMode>,
    );
    const root = rootOf(container);
    rerender(
      <StrictMode>
        <CodeEditor value="two" />
      </StrictMode>,
    );
    expect((root.querySelector("textarea") as HTMLTextAreaElement).value).toBe("two");
    await whenAttribute(root, "data-ok-status", "ready");
    expect(root.querySelectorAll(".monaco-editor")).toHaveLength(1);
  });

  it("passes its root to callback refs and starts empty without values", async () => {
    let node: HTMLDivElement | null = null;
    let diffNode: HTMLDivElement | null = null;
    const { container, unmount } = render(
      <>
        <CodeEditor
          ref={(element) => {
            node = element;
          }}
        />
        <DiffEditor
          ref={(element) => {
            diffNode = element;
          }}
        />
      </>,
    );
    expect(node).toBe(rootOf(container));
    expect(diffNode).toBe(container.querySelector("[data-ok-diff-editor]"));
    expect((rootOf(container).querySelector("textarea") as HTMLTextAreaElement).value).toBe("");
    unmount();
    expect(node).toBeNull();
  });

  it("useMonaco returns Monaco once loaded", async () => {
    let seen: Monaco | null = null;
    render(<Probe onValue={(value) => (seen = value)} />);
    expect(seen).toBe(monaco);
  });

  it("writes known options only (helpers)", () => {
    expect(sizeStyle(undefined, "bad")).toEqual({});
    expect(sizeStyle(10, "2rem")).toEqual({
      "--_ok-code-editor-width": "10px",
      "--_ok-code-editor-height": "2rem",
    });
    expect(optionsAttribute(undefined)).toBeUndefined();
    expect(optionsAttribute({})).toBeUndefined();
    expect(codeEditorAttributes({ theme: "auto" })["data-ok-monaco-theme"]).toBe("auto");
  });
});
