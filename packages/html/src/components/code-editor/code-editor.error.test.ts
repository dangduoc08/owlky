import { loader } from "@owlky/core/code-editor";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage } from "../../test-utils.js";
import { diffEditor } from "../diff-editor/diff-editor.js";
import { type CodeEditorElementInstance, codeEditor } from "./code-editor.js";
import { nextEvent, whenAttribute } from "./test-utils.js";

// This file's page can't load Monaco (a separate module instance of the loader per test file).
beforeAll(() => {
  loader.config({ import: () => Promise.reject(new Error("offline")) });
});
let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

describe("code editor fallback (Monaco can't load)", () => {
  it("shows the textarea again, reports the error and its typing", async () => {
    const host = mount(`
      <div data-ok-code-editor data-ok-height="200">
        <textarea data-ok-code-editor-value aria-label="Code" spellcheck="false">a</textarea>
        <div data-ok-code-editor-loading role="status">Loading...</div>
        <div data-ok-code-editor-content></div>
      </div>
      <div data-ok-diff-editor>
        <textarea data-ok-diff-editor-original aria-label="Original">x</textarea>
        <textarea data-ok-diff-editor-modified aria-label="Modified">y</textarea>
        <div data-ok-diff-editor-loading role="status">Loading...</div>
        <div data-ok-diff-editor-content></div>
      </div>`);
    const root = host.querySelector<HTMLElement>("[data-ok-code-editor]") as HTMLElement;
    const diff = host.querySelector<HTMLElement>("[data-ok-diff-editor]") as HTMLElement;
    const errors = [
      nextEvent<{ error: Error }>(root, "ok:code-editor:error"),
      nextEvent<{ error: Error }>(diff, "ok:diff-editor:error"),
    ];
    runtime = createRuntime().register(codeEditor, diffEditor).start();
    await whenAttribute(root, "data-ok-status", "error");
    await whenAttribute(diff, "data-ok-status", "error");
    expect((await errors[0])?.error.message).toBe("offline");
    expect((await errors[1])?.error.message).toBe("offline");
    const field = root.querySelector("textarea") as HTMLTextAreaElement;
    expect(getComputedStyle(field).display).not.toBe("none");
    expect(
      getComputedStyle(root.querySelector("[data-ok-code-editor-loading]") as Element).display,
    ).toBe("none");
    for (const each of diff.querySelectorAll("textarea"))
      expect(getComputedStyle(each).display).not.toBe("none");
    await expectNoAxeViolations(host);

    const instance = runtime.get<CodeEditorElementInstance>(
      root,
      "code-editor",
    ) as CodeEditorElementInstance;
    expect(instance.status).toBe("error");
    instance.focus();
    expect(document.activeElement).toBe(field);
    const change = nextEvent<{ value: string; event: unknown }>(root, "ok:code-editor:change");
    await userEvent.keyboard("b");
    // Focus puts the caret first.
    expect(await change).toEqual({ value: "ba", event: null });
    expect(instance.value).toBe("ba");
  });
});
