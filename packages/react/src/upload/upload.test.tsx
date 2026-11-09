import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Upload, type UploadApi, UploadAvatar, UploadBox, type UploadValue } from "./upload.js";
import { UploadCloudIcon } from "./upload-icons.js";

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

const root = () => document.querySelector("[data-ok-upload]") as HTMLElement;
const input = () => document.querySelector("[data-ok-upload-input]") as HTMLInputElement;
const names = () =>
  [...document.querySelectorAll("[data-ok-upload-item-name]")].map((n) => n.textContent);
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Drops files on the root (a plain DataTransfer-like object every engine accepts). */
function drop(files: File[], target: Element = root(), type = "drop") {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      types: ["Files"],
      files,
      items: files.map((f) => ({ kind: "file", type: f.type, getAsFile: () => f })),
      dropEffect: "none",
    },
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

afterEach(() => vi.restoreAllMocks());

describe("Upload", () => {
  it("renders a drop zone around a native file input, named by its title", async () => {
    render(<Upload />);
    expect({ ...root().dataset }).toEqual({
      okUpload: "",
      okVariant: "default",
      okLayout: "vertical",
      okRuntime: "off",
    });
    const field = screen.getByLabelText("Drop or select a file");
    expect(field).toBe(input());
    expect(field.getAttribute("type")).toBe("file");
    expect(field.hasAttribute("multiple")).toBe(false);
    expect(
      document.querySelector("[data-ok-upload-illustration]")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(document.querySelector("[data-ok-upload-browse]")?.textContent).toBe("browse");
    expect(document.querySelector<HTMLElement>("[data-ok-upload-remove]")?.hidden).toBe(true);
    expect(document.querySelector("[data-ok-upload-list]")).toBeNull();
    await expectNoAxeViolations();
  });

  it("drops, checks and lists files (multiple), and mirrors them into the input", async () => {
    const onDrop = vi.fn();
    const onDropAccepted = vi.fn();
    const onDropRejected = vi.fn();
    const onChange = vi.fn();
    render(
      <Upload
        multiple
        accept="image/*,.txt"
        maxSize={1000}
        onDrop={onDrop}
        onDropAccepted={onDropAccepted}
        onDropRejected={onDropRejected}
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText("Drop or select files")).toBe(input());
    const event = drop([
      png(),
      file("notes.txt"),
      file("big.txt", "text/plain", 5000),
      file("a.zip"),
    ]);
    expect(event.defaultPrevented).toBe(true);
    expect(names()).toEqual(["photo.png", "notes.txt"]);
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0]?.[0]).toHaveLength(2);
    expect(onDropAccepted).toHaveBeenCalledTimes(1);
    expect(onDropRejected.mock.calls[0]?.[0]).toHaveLength(2);
    expect(onChange.mock.calls[0]?.[0]).toHaveLength(2);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("big.txt - 4.88 KB");
    expect(alert.textContent).toContain("- File is larger than");
    expect(alert.textContent).toContain("a.zip");
    expect(input().files?.length).toBe(2);
    // A second drop adds files.
    drop([file("more.txt")]);
    expect(names()).toEqual(["photo.png", "notes.txt", "more.txt"]);
    expect(document.querySelector("[data-ok-upload-rejections]")?.textContent).toBe("");
    expect(input().files?.length).toBe(3);
    // Sizes and remove buttons named after their file.
    expect(document.querySelector("[data-ok-upload-item-size]")?.textContent).toBe("70 bytes");
    expect(screen.getByRole("button", { name: "Remove notes.txt" })).toBeTruthy();
    await flush();
    expect(document.querySelector<HTMLImageElement>("[data-ok-upload-thumb] img")?.src).toMatch(
      /^blob:/,
    );
    expect(document.querySelector("[data-ok-upload-file]")?.getAttribute("data-ok-kind")).toBe(
      "text",
    );
    // Hovered, the zone keeps its text contrast.
    await userEvent.hover(document.querySelector("[data-ok-upload-zone]") as HTMLElement);
    await expectNoAxeViolations(document.body, { pointer: "keep" });
  });

  it("removes files: the focus moves to the next remove button, then to the input", () => {
    const onRemove = vi.fn();
    render(
      <Upload
        multiple
        defaultValue={[file("a.txt"), file("b.txt"), file("c.txt")]}
        onRemove={onRemove}
      />,
    );
    const b = screen.getByRole("button", { name: "Remove b.txt" });
    b.focus();
    fireEvent.click(b);
    expect(names()).toEqual(["a.txt", "c.txt"]);
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ name: "b.txt" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove c.txt" }));
    fireEvent.click(document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove a.txt" }));
    fireEvent.click(document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(input());
    // A focus that stayed in the upload isn't moved.
    expect(names()).toEqual([]);
  });

  it("keeps the focus where it is when it didn't leave with the button", () => {
    render(<Upload multiple defaultValue={[file("a.txt"), file("b.txt")]} />);
    input().focus();
    fireEvent.click(screen.getByRole("button", { name: "Remove a.txt" }));
    expect(document.activeElement).toBe(input());
  });

  it("Remove all and Upload buttons (shown with their callbacks while files are held)", () => {
    const onRemoveAll = vi.fn();
    const onUpload = vi.fn();
    render(
      <Upload
        multiple
        defaultValue={[file("a.txt")]}
        onRemoveAll={onRemoveAll}
        onUpload={onUpload}
        labels={{ removeAll: "Clear", upload: "Send" }}
      />,
    );
    const actions = document.querySelector<HTMLElement>("[data-ok-upload-actions]") as HTMLElement;
    expect(actions.hidden).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onUpload.mock.calls[0]?.[0][0].name).toBe("a.txt");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onRemoveAll).toHaveBeenCalledTimes(1);
    expect(names()).toEqual([]);
    expect(actions.hidden).toBe(true);
  });

  it("single file: a new file replaces the old one and shows in the zone", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { unmount } = render(<Upload />);
    drop([png("one.png")]);
    await flush();
    const image = document.querySelector<HTMLImageElement>("[data-ok-upload-preview] img");
    expect(image?.alt).toBe("one.png");
    expect(image?.src).toMatch(/^blob:/);
    drop([file("two.pdf", "application/pdf")]);
    await flush();
    expect(document.querySelector("[data-ok-upload-preview-name]")?.textContent).toBe("two.pdf");
    expect(document.querySelector("[data-ok-upload-preview-size]")?.textContent).toBe("5 bytes");
    expect(revoke).toHaveBeenCalled();
    const remove = screen.getByRole("button", { name: "Remove two.pdf 5 bytes" });
    remove.focus();
    fireEvent.click(remove);
    expect(document.querySelector("[data-ok-upload-preview]")).toBeNull();
    expect(document.activeElement).toBe(input());
    drop([png("three.png")]);
    await flush();
    const calls = revoke.mock.calls.length;
    unmount();
    expect(revoke.mock.calls.length).toBeGreaterThan(calls);
  });

  it("controlled: the owner decides", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Upload multiple value={[]} onChange={onChange} />);
    drop([file("a.txt")]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(names()).toEqual([]);
    rerender(<Upload multiple value={onChange.mock.calls[0]?.[0]} onChange={onChange} />);
    expect(names()).toEqual(["a.txt"]);
  });

  it("shows URL values (files uploaded before) by name, without a size", () => {
    render(
      <Upload
        multiple
        defaultValue={["https://example.com/files/My%20report.pdf", "https://example.com/p.png"]}
      />,
    );
    expect(names()).toEqual(["My report.pdf", "p.png"]);
    expect(document.querySelector("[data-ok-upload-item-size]")).toBeNull();
    expect(
      document.querySelector<HTMLImageElement>("[data-ok-upload-thumb] img")?.getAttribute("src"),
    ).toBe("https://example.com/p.png");
  });

  it("layout and thumbnail options", () => {
    render(<Upload multiple layout="horizontal" thumbnail={false} defaultValue={[png()]} />);
    expect(root().dataset["okLayout"]).toBe("horizontal");
    expect(root().dataset["okThumbnail"]).toBe("false");
    expect(document.querySelector("[data-ok-upload-thumb] img")).toBeNull();
    expect(document.querySelector("[data-ok-upload-file-ext]")?.textContent).toBe("PNG");
  });

  it("file names are text, never markup", () => {
    render(<Upload multiple defaultValue={[file(HOSTILE)]} />);
    expect(names()).toEqual([HOSTILE]);
    expect(document.querySelector("[data-ok-upload-list] img")).toBeNull();
  });

  it("error, helper text, noKeyboard, labels and the input's attributes", async () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <form id="f">
        <Upload
          error
          helperText="Required"
          noKeyboard
          name="doc"
          form="f"
          required
          capture="environment"
          inputId="doc"
          inputRef={ref}
          aria-describedby="extra"
        />
        <p id="extra">More</p>
      </form>,
    );
    expect(ref.current).toBe(input());
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(input().tabIndex).toBe(-1);
    expect(input().id).toBe("doc");
    expect(input().name).toBe("doc");
    expect(input().required).toBe(true);
    expect(input().getAttribute("capture")).toBe("environment");
    const helper = document.querySelector("[data-ok-upload-helper-text]") as HTMLElement;
    expect(input().getAttribute("aria-describedby")).toBe(`extra ${helper.id}`);
    expect(root().hasAttribute("data-ok-error")).toBe(true);
  });

  it("reports dialog open and cancel, and errors of validators", () => {
    const onFileDialogOpen = vi.fn();
    const onFileDialogCancel = vi.fn();
    const onError = vi.fn();
    render(
      <Upload
        onFileDialogOpen={onFileDialogOpen}
        onFileDialogCancel={onFileDialogCancel}
        onError={onError}
        validator={() => {
          throw new Error("boom");
        }}
      />,
    );
    act(() => {
      input().dispatchEvent(new MouseEvent("click", { cancelable: true }));
    });
    expect(onFileDialogOpen).toHaveBeenCalledTimes(1);
    act(() => {
      input().dispatchEvent(new Event("cancel"));
    });
    expect(onFileDialogCancel).toHaveBeenCalledTimes(1);
    drop([file("a.txt")]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("a placeholder function receives the drag and processing state", async () => {
    let release: (value: null) => void = () => {};
    render(
      <Upload
        accept="image/*"
        validator={() => new Promise((resolve) => (release = resolve))}
        placeholder={(state) => (
          <span data-testid="state">
            {[
              state.isDragActive && "active",
              state.isDragAccept && "accept",
              state.isDragReject && "reject",
              state.isDragUnknown && "unknown",
              state.isDragGlobal && "global",
              state.isProcessing && "processing",
              state.isFileDialogActive && "dialog",
            ]
              .filter(Boolean)
              .join(" ")}
          </span>
        )}
        aria-label="Photo"
      />,
    );
    const zone = document.querySelector("[data-ok-upload-zone]") as HTMLElement;
    drop([png()], zone, "dragenter");
    expect(screen.getByTestId("state").textContent).toBe("active unknown global");
    expect(screen.getByLabelText("Photo")).toBe(input());
    drop([png()]);
    expect(screen.getByTestId("state").textContent).toBe("processing");
    expect(root().getAttribute("aria-busy")).toBe("true");
    await act(async () => {
      release(null);
      await flush();
    });
    expect(screen.getByTestId("state").textContent).toBe("");
    act(() => {
      input().dispatchEvent(new MouseEvent("click", { cancelable: true }));
    });
    expect(screen.getByTestId("state").textContent).toBe("dialog");
  });

  it("apiRef: open, removeFile, clearFiles, files and rejections", () => {
    const api = createRef<UploadApi>();
    const a = file("a.txt");
    render(<Upload multiple apiRef={api} defaultValue={[a, file("b.txt")]} maxFiles={2} />);
    const click = vi.spyOn(input(), "click").mockImplementation(() => {});
    act(() => api.current?.open());
    expect(click).toHaveBeenCalledTimes(1);
    drop([file("c.txt")]);
    expect(api.current?.rejections[0]?.errors[0]?.code).toBe("too-many-files");
    act(() => api.current?.removeFile(a));
    expect(names()).toEqual(["b.txt"]);
    act(() => api.current?.removeFile(file("missing")));
    expect(api.current?.files).toHaveLength(1);
    act(() => api.current?.clearFiles());
    expect(names()).toEqual([]);
    expect(api.current?.rejections).toEqual([]);
  });

  it("clears its files when the form is reset", async () => {
    render(
      <form>
        <Upload multiple defaultValue={[file("a.txt")]} />
      </form>,
    );
    await act(async () => {
      (document.querySelector("form") as HTMLFormElement).reset();
      await flush();
    });
    expect(names()).toEqual([]);
  });

  it("works in StrictMode (previews survive the double effects)", async () => {
    render(
      <StrictMode>
        <Upload />
      </StrictMode>,
    );
    drop([png()]);
    await act(flush);
    const image = document.querySelector<HTMLImageElement>("[data-ok-upload-preview] img");
    expect(image?.src).toMatch(/^blob:/);
    await new Promise<void>((resolve, reject) => {
      if (image?.complete && image.naturalWidth > 0) resolve();
      image?.addEventListener("load", () => resolve());
      image?.addEventListener("error", () => reject(new Error("revoked")));
    });
  });

  it("renders on the server", () => {
    const html = renderToString(
      <>
        <Upload multiple onUpload={() => {}} defaultValue={["https://e.com/a.png"]} />
        <UploadAvatar />
        <UploadBox />
      </>,
    );
    expect(html).toContain("data-ok-upload-list");
    expect(html).toContain("Upload photo");
  });
});

describe("UploadAvatar", () => {
  it("a round photo picker: images, Upload / Update photo", async () => {
    render(<UploadAvatar helperText="Allowed *.png" labels={{ updatePhoto: "Change" }} />);
    expect(root().dataset["okVariant"]).toBe("avatar");
    expect(input().accept).toBe("image/*");
    const title = screen.getByLabelText("Upload photo");
    expect(title).toBe(input());
    expect(
      document.querySelector("[data-ok-upload-title]")?.getAttribute("data-ok-label-update"),
    ).toBe("Change");
    await expectNoAxeViolations();
    drop([png()]);
    await flush();
    expect(screen.getByLabelText("Change")).toBe(input());
    expect(document.querySelector("[data-ok-upload-remove]")).toBeNull();
  });

  it("a custom title drops the label swap", () => {
    render(<UploadAvatar title="Logo" />);
    const title = document.querySelector("[data-ok-upload-title]") as HTMLElement;
    expect(title.textContent).toBe("Logo");
    expect(title.hasAttribute("data-ok-label-upload")).toBe(false);
  });
});

/** A box whose placeholder counts its files (controlled). */
function CountingBox() {
  const [files, setFiles] = useState<UploadValue[]>([]);
  return (
    <UploadBox
      value={files}
      onChange={setFiles}
      placeholder={
        <>
          <UploadCloudIcon />
          <span>{files.length} files</span>
        </>
      }
    />
  );
}

describe("UploadBox", () => {
  it("a small box named Upload file, multiple by default, without a list", async () => {
    render(<UploadBox />);
    expect(root().dataset["okVariant"]).toBe("box");
    expect(screen.getByLabelText("Upload file")).toBe(input());
    expect(input().multiple).toBe(true);
    drop([file("a.txt")]);
    expect(document.querySelector("[data-ok-upload-list]")).toBeNull();
    await expectNoAxeViolations();
  });

  it("takes a placeholder", () => {
    render(<CountingBox />);
    drop([file("a.txt"), file("b.txt")]);
    expect(document.querySelector("[data-ok-upload-placeholder]")?.textContent).toBe("2 files");
  });
});
