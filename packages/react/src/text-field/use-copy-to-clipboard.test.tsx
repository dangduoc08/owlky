import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { IconButton } from "../icon-button/icon-button.js";
import { Toaster, toast } from "../snackbar/snackbar.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { InputAdornment, TextField } from "./text-field.js";
import { useCopyToClipboard } from "./use-copy-to-clipboard.js";

// Every clipboard call is stubbed: a real one could open a browser prompt.
let writeText = vi.fn();
const clipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  clipboard({ writeText });
});
afterEach(() => {
  delete (navigator as { clipboard?: unknown }).clipboard;
  vi.restoreAllMocks();
  toast.dismiss();
});

/** The reference demo: a field with a copy button, a toast after each copy. */
function CopyField() {
  const [value, setValue] = useState("https://example.com/a");
  const { copy, copiedText } = useCopyToClipboard();
  return (
    <>
      <TextField
        label="Link"
        value={value}
        onChange={setValue}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              edge="end"
              aria-label="Copy"
              onClick={async () => {
                const result = await copy(value);
                if (result.ok) toast.success("Copied!");
                else toast.error(`Couldn't copy (${result.reason})`);
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" />
            </IconButton>
          </InputAdornment>
        }
      />
      <output data-testid="copied">{copiedText ?? "none"}</output>
      <Toaster position="bottom-left" />
    </>
  );
}

/** Resolves once `check()` holds, re-checked on every DOM change (no polling timeout). */
const until = (check: () => boolean | undefined) =>
  new Promise<void>((resolve) => {
    if (check()) return resolve();
    const observer = new MutationObserver(() => {
      if (!check()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });

/** Exposes the hook's result to the test. */
let probe: ReturnType<typeof useCopyToClipboard> | undefined;
function Probe() {
  probe = useCopyToClipboard();
  return <span>{probe.copiedText ?? "none"}</span>;
}

const list = () => document.querySelector("[data-ok-toaster-list]") as HTMLElement;

describe("useCopyToClipboard", () => {
  it("copies on a press, remembers the text and announces the toast", async () => {
    render(<CopyField />);
    const input = screen.getByRole("textbox", { name: "Link" });
    await userEvent.clear(input);
    await userEvent.type(input, "typed");
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await until(() => list()?.textContent?.includes("Copied!"));
    expect(writeText).toHaveBeenCalledWith("typed");
    expect(screen.getByTestId("copied").textContent).toBe("typed");
    expect(list().getAttribute("aria-live")).toBe("polite");
    await expectNoAxeViolations(document.body);
  });

  it("reports a refused copy and forgets the last text", async () => {
    render(<CopyField />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await until(() => screen.getByTestId("copied").textContent === "https://example.com/a");
    clipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("No", "NotAllowedError")) });
    vi.spyOn(document, "execCommand").mockReturnValue(false);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await until(() => list()?.textContent?.includes("Couldn't copy (denied)"));
    expect(screen.getByTestId("copied").textContent).toBe("none");
  });

  it("refuses outside a user gesture", async () => {
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue({
      isActive: false,
    } as UserActivation);
    render(<Probe />);
    let result: unknown;
    await act(async () => {
      result = await probe?.copy("x");
    });
    expect(result).toEqual({ ok: false, reason: "gesture" });
    expect(writeText).not.toHaveBeenCalled();
    expect(probe?.copiedText).toBeNull();
  });

  it("renders on the server", () => {
    expect(renderToString(<Probe />)).toContain("none");
  });
});
