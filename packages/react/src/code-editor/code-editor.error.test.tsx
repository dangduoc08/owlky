import { loader } from "@owlky/core/code-editor";
import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DiffEditor } from "../diff-editor/diff-editor.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { CodeEditor, useMonaco } from "./code-editor.js";
import { whenAttribute } from "./test-utils.js";

function Probe() {
  useMonaco();
  return null;
}

// This file's page can't load Monaco (one loader module per test file).
beforeAll(() => {
  loader.config({ import: () => Promise.reject(new Error("offline")) });
});

describe("CodeEditor and DiffEditor when Monaco can't load", () => {
  it("show their textareas, report the error and the fallback's typing", async () => {
    const onError = vi.fn();
    const onDiffError = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <>
        <CodeEditor aria-label="Code" defaultValue="a" onChange={onChange} onError={onError} />
        <DiffEditor original="x" modified="y" onError={onDiffError} />
      </>,
    );
    const root = container.querySelector("[data-ok-code-editor]") as HTMLElement;
    const diff = container.querySelector("[data-ok-diff-editor]") as HTMLElement;
    await whenAttribute(root, "data-ok-status", "error");
    await whenAttribute(diff, "data-ok-status", "error");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "offline" }));
    expect(onDiffError).toHaveBeenCalledWith(expect.objectContaining({ message: "offline" }));
    const field = root.querySelector("textarea") as HTMLTextAreaElement;
    expect(getComputedStyle(field).display).not.toBe("none");
    await expectNoAxeViolations(container);
    field.focus();
    await userEvent.keyboard("b");
    expect(onChange).toHaveBeenLastCalledWith("ba", undefined);
  });

  it("useMonaco logs the failure", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const logged = new Promise<void>((resolve) => error.mockImplementation(() => resolve()));
    render(<Probe />);
    await logged;
    expect(error).toHaveBeenCalledWith("Monaco couldn't load:", expect.any(Error));
    error.mockRestore();
  });
});
