import { loader, type Monaco } from "@owlky/core/code-editor";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import { type CodeEditorElementInstance, codeEditor, createCodeEditor } from "./code-editor.js";
import { labelOf, readOptions } from "./code-editor-dom.js";
import { nextEvent, useTestWorkers, whenAttribute } from "./test-utils.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];

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
const start = (definition = codeEditor) => {
  runtime = createRuntime()
    .register(...components, definition)
    .start();
  return runtime;
};

const EDITOR = (attributes = "", value = "const a = 1;", extra = "") => `
  <div data-ok-code-editor ${attributes}>
    <textarea data-ok-code-editor-value aria-label="Code" spellcheck="false">${value}</textarea>
    <div data-ok-code-editor-loading role="status">Loading...</div>
    <div data-ok-code-editor-content></div>
    ${extra}
  </div>`;

async function setup(attributes = "", value?: string, extra = "", definition = codeEditor) {
  const host = mount(EDITOR(attributes, value, extra));
  const root = host.querySelector<HTMLElement>("[data-ok-code-editor]") as HTMLElement;
  const field = root.querySelector("textarea") as HTMLTextAreaElement;
  const r = start(definition);
  const instance = r.get<CodeEditorElementInstance>(
    root,
    "code-editor",
  ) as CodeEditorElementInstance;
  return {
    host,
    root,
    field,
    instance,
    ready: () => whenAttribute(root, "data-ok-status", "ready"),
  };
}

describe("code editor (HTML)", () => {
  it("mounts every snippet: CSP-safe, accessible while loading and once ready", async () => {
    for (const [path, html] of snippets) {
      const host = mount(html);
      expectCspSafe(host, html);
      expect(html, path).not.toMatch(/data-ok-status/);
    }
    const r = start();
    await settle();
    const roots = [...document.querySelectorAll<HTMLElement>("[data-ok-code-editor]")];
    expect(roots.length).toBeGreaterThan(3);
    await Promise.all(roots.map((root) => whenAttribute(root, "data-ok-status", "ready")));
    await expectNoAxeViolations(document.body);
    expect(r.get(roots[0] ?? null, "code-editor")).toBeDefined();
  });

  it("shows the textarea without JavaScript, the loading text, then Monaco", async () => {
    const host = mount(EDITOR());
    const root = host.firstElementChild as HTMLElement;
    const field = root.querySelector("textarea") as HTMLTextAreaElement;
    const loading = root.querySelector("[data-ok-code-editor-loading]") as HTMLElement;
    const content = root.querySelector("[data-ok-code-editor-content]") as HTMLElement;
    expect(getComputedStyle(field).display).not.toBe("none");
    expect(getComputedStyle(loading).display).toBe("none");
    expect(getComputedStyle(content).display).toBe("none");
    // At least 300px high without a height.
    expect(root.getBoundingClientRect().height).toBeGreaterThanOrEqual(300);
    start();
    expect(root.getAttribute("data-ok-status")).toBe("loading");
    expect(getComputedStyle(loading).display).toBe("flex");
    expect(getComputedStyle(field).display).toBe("none");
    expect(getComputedStyle(content).visibility).toBe("hidden");
    await whenAttribute(root, "data-ok-status", "ready");
    expect(getComputedStyle(loading).display).toBe("none");
    expect(getComputedStyle(content).visibility).toBe("visible");
    const textbox = content.querySelector("textarea, [role=textbox]") as HTMLElement;
    expect(textbox.getAttribute("aria-label")).toBe("Code");
  });

  it("reads the options, emits mount and change, keeps the textarea's value", async () => {
    const mounted = vi.fn();
    const before = vi.fn();
    document.addEventListener("ok:code-editor:beforemount", before);
    document.addEventListener("ok:code-editor:mount", mounted);
    const { root, field, instance, ready } = await setup(
      `data-ok-language="typescript" data-ok-path="file:///a.ts" data-ok-line="1" data-ok-width="400" data-ok-height="10rem" data-ok-options='{"readOnly":false,"minimap":{"enabled":false}}' data-ok-monaco-theme="vs-dark"`,
    );
    expect(instance.status).toBe("loading");
    expect(instance.value).toBe("const a = 1;");
    expect(instance.editor).toBeNull();
    expect(root.style.getPropertyValue("--_ok-code-editor-width")).toBe("400px");
    expect(root.style.getPropertyValue("--_ok-code-editor-height")).toBe("10rem");
    await ready();
    document.removeEventListener("ok:code-editor:beforemount", before);
    document.removeEventListener("ok:code-editor:mount", mounted);
    expect(before.mock.calls[0]?.[0].detail.monaco).toBe(monaco);
    expect(mounted.mock.calls[0]?.[0].detail.editor).toBe(instance.editor);
    expect(instance.monaco).toBe(monaco);
    expect(instance.status).toBe("ready");
    const editor = instance.editor as NonNullable<typeof instance.editor>;
    expect(editor.getModel()?.uri.toString()).toBe("file:///a.ts");
    expect(editor.getModel()?.getLanguageId()).toBe("typescript");
    expect(editor.getOption(monaco.editor.EditorOption.minimap).enabled).toBe(false);
    expect(root.style.getPropertyValue("--_ok-code-editor-width")).toBe("400px");

    const change = nextEvent<{ value: string; event: unknown }>(root, "ok:code-editor:change");
    editor.setPosition({ lineNumber: 1, column: 13 });
    editor.trigger("keyboard", "type", { text: " // ok" });
    const detail = await change;
    expect(detail.value).toBe("const a = 1; // ok");
    expect(detail.event).not.toBeNull();
    expect(field.value).toBe("const a = 1; // ok");
    expect(instance.value).toBe("const a = 1; // ok");
    // While Monaco is ready, the hidden textarea's own input events report nothing.
    const changes = vi.fn();
    root.addEventListener("ok:code-editor:change", changes);
    field.dispatchEvent(new Event("input"));
    expect(changes).not.toHaveBeenCalled();

    instance.setValue("let b = 2;");
    expect(editor.getValue()).toBe("let b = 2;");
    expect(field.value).toBe("let b = 2;");
    instance.updateOptions({ readOnly: true });
    expect(editor.getOption(monaco.editor.EditorOption.readOnly)).toBe(true);
    instance.focus();
    expect(editor.hasTextFocus()).toBe(true);
    expect(instance.controller.editor).toBe(editor);
  });

  it("follows attribute changes: language, path (from templates), theme, line, size, options", async () => {
    const { root, instance, ready } = await setup(
      'data-ok-path="file:///script.js" data-ok-language="javascript"',
      "console.log(1);",
      `<template data-ok-code-editor-model data-ok-path="file:///style.css" data-ok-language="css">h1 { color: red; }</template>`,
    );
    await ready();
    const editor = instance.editor as NonNullable<typeof instance.editor>;
    const settleObserver = () => new Promise((resolve) => setTimeout(resolve, 0));

    root.setAttribute("data-ok-path", "file:///style.css");
    await settleObserver();
    expect(editor.getValue()).toBe("h1 { color: red; }");
    expect(editor.getModel()?.getLanguageId()).toBe("css");
    root.setAttribute("data-ok-path", "file:///script.js");
    await settleObserver();
    expect(editor.getValue()).toBe("console.log(1);");
    // A path without a template starts empty.
    root.setAttribute("data-ok-path", "file:///new.js");
    await settleObserver();
    expect(editor.getValue()).toBe("");

    root.setAttribute("data-ok-language", "python");
    await settleObserver();
    expect(editor.getModel()?.getLanguageId()).toBe("python");
    root.setAttribute("data-ok-language", "<bad>");
    await settleObserver();
    expect(editor.getModel()?.getLanguageId()).toBe("plaintext");

    const background = () =>
      getComputedStyle(root.querySelector(".monaco-editor-background") as Element).backgroundColor;
    root.setAttribute("data-ok-monaco-theme", "vs-dark");
    await settleObserver();
    expect(background()).toBe("rgb(30, 30, 30)");
    root.setAttribute("data-ok-monaco-theme", '"><img onerror=alert(1)>');
    await settleObserver();
    expect(background()).toBe("rgb(255, 255, 255)");

    const reveal = vi.spyOn(editor, "revealLine");
    root.setAttribute("data-ok-line", "3");
    await settleObserver();
    expect(reveal).toHaveBeenCalledWith(3);
    root.setAttribute("data-ok-height", "200");
    root.setAttribute("data-ok-width", "calc(1px)");
    await settleObserver();
    expect(root.style.getPropertyValue("--_ok-code-editor-height")).toBe("200px");
    expect(root.style.getPropertyValue("--_ok-code-editor-width")).toBe("");
    root.setAttribute("data-ok-options", '{"wordWrap":"on"}');
    await settleObserver();
    expect(editor.getOption(monaco.editor.EditorOption.wordWrap)).toBe("on");
    root.setAttribute("data-ok-path", "x".repeat(3000));
    await settleObserver();
    expect(editor.getModel()?.uri.scheme).toBe("inmemory");
  });

  it("reports validation markers", async () => {
    const { root, ready } = await setup(
      'data-ok-language="json" data-ok-path="file:///bad.json"',
      '{ "a": }',
    );
    const validated = nextEvent<{ markers: unknown[] }>(root, "ok:code-editor:validate");
    await ready();
    const { markers } = await validated;
    expect(markers.length).toBeGreaterThan(0);
  });

  it("restores the markup when the runtime stops", async () => {
    const { root, field, instance, ready } = await setup('data-ok-height="240"');
    await ready();
    instance.editor?.setValue("edited");
    runtime?.stop();
    runtime = undefined;
    expect(root.hasAttribute("data-ok-status")).toBe(false);
    expect(root.style.getPropertyValue("--_ok-code-editor-height")).toBe("");
    expect(field.value).toBe("edited");
    expect(root.querySelector(".monaco-editor")).toBeNull();
  });

  it("stops before Monaco is ready", async () => {
    const { field, instance } = await setup();
    instance.setValue("early");
    expect(instance.value).toBe("early");
    runtime?.stop();
    runtime = undefined;
    expect(field.value).toBe("early");
  });

  it("runs the hooks of createCodeEditor and works without a textarea", async () => {
    const beforeMount = vi.fn();
    const onMount = vi.fn();
    const host = mount("<div data-ok-code-editor><div data-ok-code-editor-content></div></div>");
    const root = host.firstElementChild as HTMLElement;
    const r = start(createCodeEditor({ beforeMount, onMount }));
    const instance = r.get<CodeEditorElementInstance>(
      root,
      "code-editor",
    ) as CodeEditorElementInstance;
    expect(instance.value).toBe("");
    instance.focus();
    instance.setValue("x");
    await whenAttribute(root, "data-ok-status", "ready");
    expect(beforeMount).toHaveBeenCalledWith(monaco);
    expect(onMount).toHaveBeenCalledWith(instance.editor, monaco);
    expect(instance.value).toBe("x");
    const change = nextEvent<{ value: string }>(root, "ok:code-editor:change");
    instance.editor?.trigger("keyboard", "type", { text: "y" });
    expect((await change).value).toBe("yx");
    // Without a label, Monaco's own name stays.
    expect(instance.editor?.getOption(monaco.editor.EditorOption.ariaLabel)).not.toBe("");
  });

  it("needs a content element", () => {
    mount("<div data-ok-code-editor></div>");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    start();
    error.mockRestore();
    expect(
      runtime?.get(document.querySelector("[data-ok-code-editor]"), "code-editor"),
    ).toBeUndefined();
  });

  it("keeps a typed value across a keyboard session", async () => {
    const { root, instance, ready } = await setup("", "");
    await ready();
    const editor = instance.editor as NonNullable<typeof instance.editor>;
    editor.focus();
    const change = nextEvent<{ value: string }>(root, "ok:code-editor:change");
    await userEvent.keyboard("ab");
    await change;
    expect(instance.value).toContain("a");
  });
});

describe("code editor markup helpers", () => {
  it("parse options safely", () => {
    const element = document.createElement("div");
    expect(readOptions(element)).toEqual({});
    element.setAttribute("data-ok-options", "not json");
    expect(readOptions(element)).toEqual({});
    element.setAttribute("data-ok-options", "[1, 2]");
    expect(readOptions(element)).toEqual({});
    element.setAttribute("data-ok-options", "null");
    expect(readOptions(element)).toEqual({});
    element.setAttribute("data-ok-options", `{"a":"${"x".repeat(20_000)}"}`);
    expect(readOptions(element)).toEqual({});
    element.setAttribute(
      "data-ok-options",
      '{"__proto__":{"polluted":true},"rulers":[80,{"constructor":1}],"nested":{"prototype":1,"ok":true}}',
    );
    expect(readOptions(element)).toEqual({ rulers: [80, {}], nested: { ok: true } });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("name a textarea from aria-label, aria-labelledby or its label", () => {
    const host = mount(`
      <span id="a">Query</span><span id="b">editor</span>
      <textarea id="one" aria-label=" Named "></textarea>
      <textarea id="two" aria-labelledby="a b missing"></textarea>
      <label for="three">Labelled</label><textarea id="three"></textarea>
      <textarea id="four"></textarea>`);
    const field = (id: string) => host.querySelector<HTMLTextAreaElement>(`#${id}`);
    expect(labelOf(null)).toBeUndefined();
    expect(labelOf(field("one"))).toBe("Named");
    expect(labelOf(field("two"))).toBe("Query editor");
    expect(labelOf(field("three"))).toBe("Labelled");
    expect(labelOf(field("four"))).toBeUndefined();
  });
});
