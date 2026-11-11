import { afterEach, describe, expect, it, vi } from "vitest";
import { clipboardText, copyToClipboard } from "./clipboard.js";

// Every path is stubbed: a real clipboard call could open a browser prompt (Firefox waits forever).
const clipboard = (value: unknown) =>
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
const activation = (value: { isActive: boolean } | undefined) =>
  vi.spyOn(navigator, "userActivation", "get").mockReturnValue(value as UserActivation);

/** The copy command: fires a `copy` event whose `clipboardData` records what is written. */
const command = (result = true, withData = true) => {
  const written: string[] = [];
  const exec = vi.spyOn(document, "execCommand").mockImplementation(() => {
    const event = new Event("copy", { bubbles: true, cancelable: true });
    if (withData)
      Object.defineProperty(event, "clipboardData", {
        value: { setData: (_type: string, text: string) => written.push(text) },
      });
    document.dispatchEvent(event);
    return result;
  });
  return { exec, written };
};

afterEach(() => {
  delete (navigator as { clipboard?: unknown }).clipboard;
  vi.restoreAllMocks();
});

describe("copyToClipboard", () => {
  it("writes with the Clipboard API during a gesture", async () => {
    activation({ isActive: true });
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    await expect(copyToClipboard("https://example.com")).resolves.toEqual({ ok: true });
    expect(writeText).toHaveBeenCalledWith("https://example.com");
  });

  it("refuses outside a gesture without asking the browser", async () => {
    activation({ isActive: false });
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    const { exec } = command();
    await expect(copyToClipboard("x")).resolves.toEqual({ ok: false, reason: "gesture" });
    expect(writeText).not.toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();
  });

  it("works where the user activation API is missing", async () => {
    activation(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    await expect(copyToClipboard("x")).resolves.toEqual({ ok: true });
  });

  it("falls back to the copy command without the Clipboard API", async () => {
    activation({ isActive: true });
    clipboard(undefined);
    const focused = document.body.appendChild(document.createElement("input"));
    focused.focus();
    const { exec, written } = command();
    await expect(copyToClipboard("fallback")).resolves.toEqual({ ok: true });
    expect(exec).toHaveBeenCalledWith("copy");
    expect(written).toEqual(["fallback"]);
    // Nothing is added to the page and the focus stays put.
    expect(document.activeElement).toBe(focused);
    expect(document.querySelector("textarea")).toBeNull();
    focused.remove();
  });

  it("reports an unsupported browser when the copy command does nothing", async () => {
    activation({ isActive: true });
    clipboard({});
    command(false);
    await expect(copyToClipboard("x")).resolves.toEqual({ ok: false, reason: "unsupported" });
    vi.restoreAllMocks();
    activation({ isActive: true });
    // A command that claims success but never fires a copy event with data didn't copy.
    command(true, false);
    await expect(copyToClipboard("x")).resolves.toEqual({ ok: false, reason: "unsupported" });
    vi.restoreAllMocks();
    activation({ isActive: true });
    vi.spyOn(document, "execCommand").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    await expect(copyToClipboard("x")).resolves.toEqual({ ok: false, reason: "unsupported" });
  });

  it("tries the copy command when the Clipboard API refuses, else reports denied", async () => {
    activation({ isActive: true });
    clipboard({ writeText: vi.fn().mockRejectedValue(new DOMException("No", "NotAllowedError")) });
    const { written } = command();
    await expect(copyToClipboard("retry")).resolves.toEqual({ ok: true });
    expect(written).toEqual(["retry"]);
    vi.restoreAllMocks();
    activation({ isActive: true });
    command(false);
    await expect(copyToClipboard("retry")).resolves.toEqual({ ok: false, reason: "denied" });
  });

  it("writes the clipboard of another document", async () => {
    const frame = document.body.appendChild(document.createElement("iframe"));
    const doc = frame.contentDocument as Document;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(doc.defaultView?.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(doc.defaultView?.navigator, "userActivation", {
      value: { isActive: true },
      configurable: true,
    });
    await expect(copyToClipboard("frame", { document: doc })).resolves.toEqual({ ok: true });
    expect(writeText).toHaveBeenCalledWith("frame");
    frame.remove();
  });
});

describe("clipboardText", () => {
  it("reads form values and collapses white space in other elements", () => {
    const input = document.createElement("input");
    input.value = "  kept  as typed ";
    const area = document.createElement("textarea");
    area.value = "a\nb";
    const select = document.createElement("select");
    select.append(new Option("One", "1"), new Option("Two", "2", true, true));
    const paragraph = document.createElement("p");
    paragraph.textContent = "\n  Written over\n  two lines.\n";
    expect(clipboardText(input)).toBe("  kept  as typed ");
    expect(clipboardText(area)).toBe("a\nb");
    expect(clipboardText(select)).toBe("2");
    expect(clipboardText(paragraph)).toBe("Written over two lines.");
    expect(clipboardText(document.createElement("div"))).toBe("");
  });
});
