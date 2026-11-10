import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Dropzone, type DropzoneRef, type DropzoneState, useDropzone } from "./use-dropzone.js";

const file = (name: string, type = "text/plain", size = 5) =>
  new File([new Uint8Array(size)], name, { type });
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const zone = () => screen.getByRole("button", { name: "Upload files" });

/** Drag or drop files on a target (a plain DataTransfer-like object every engine accepts). */
function fire(type: string, files: File[], target: Element = zone()) {
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
}

let seen: DropzoneState | undefined;
function Field(props: Parameters<typeof useDropzone>[0] & { onClickZone?: () => void }) {
  const { onClickZone, ...options } = props;
  const state = useDropzone(options);
  seen = state;
  return (
    <div
      {...state.getRootProps({
        role: "button",
        "aria-label": "Upload files",
        onClick: onClickZone,
      })}
    >
      <input {...state.getInputProps({ "aria-label": "Files" })} />
      Upload files
      <span data-testid="state">
        {[
          state.isDragActive && "active",
          state.isDragAccept && "accept",
          state.isDragReject && "reject",
          state.isFocused && "focused",
        ]
          .filter(Boolean)
          .join(" ")}
      </span>
    </div>
  );
}

/** A root whose own click handler prevents the default. */
function Own() {
  const state = useDropzone();
  return (
    <div
      {...state.getRootProps({
        role: "button",
        "aria-label": "Upload files",
        onClick: (event: { preventDefault(): void }) => event.preventDefault(),
      })}
    >
      <input {...state.getInputProps()} aria-label="Files" />
      Upload files
    </div>
  );
}

describe("useDropzone", () => {
  it("prop getters: a focusable root, a hidden file input; drops report accepted and rejected files", async () => {
    const onDrop = vi.fn();
    const onDropAccepted = vi.fn();
    const onDropRejected = vi.fn();
    render(
      <Field
        accept={{ "text/plain": [] }}
        onDrop={onDrop}
        onDropAccepted={onDropAccepted}
        onDropRejected={onDropRejected}
      />,
    );
    expect(zone().tabIndex).toBe(0);
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.hidden).toBe(true);
    expect(input.multiple).toBe(true);
    expect(input.accept).toBe("text/plain");
    fire("drop", [file("a.txt"), file("b.png", "image/png")]);
    await flush();
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0]?.[0].map((f: File) => f.name)).toEqual(["a.txt"]);
    expect(onDropAccepted).toHaveBeenCalledTimes(1);
    expect(onDropRejected.mock.calls[0]?.[0][0].errors[0].code).toBe("file-invalid-type");
    expect(seen?.acceptedFiles.map((f) => f.name)).toEqual(["a.txt"]);
    expect(seen?.fileRejections).toHaveLength(1);
    await expectNoAxeViolations();
  });

  it("drag state and dragFileRejections while files are over the root", () => {
    render(<Field accept="image/*" maxFiles={1} />);
    fire("dragenter", [file("a.txt"), file("b.png", "image/png"), file("c.png", "image/png")]);
    expect(screen.getByTestId("state").textContent).toBe("active reject");
    expect(seen?.dragFileRejections.map((r) => [r.index, r.errors[0]?.code])).toEqual([
      [0, "file-invalid-type"],
      [2, "too-many-files"],
    ]);
    fire("dragleave", []);
    expect(screen.getByTestId("state").textContent).toBe("");
    expect(seen?.dragFileRejections).toEqual([]);
    fire("dragenter", [file("b.png", "image/png")]);
    expect(screen.getByTestId("state").textContent).toBe("active accept");
  });

  it("click and Enter / Space open the dialog; noClick, noKeyboard and your handlers", async () => {
    const onFileDialogOpen = vi.fn();
    const onClickZone = vi.fn();
    const { unmount } = render(
      <Field onFileDialogOpen={onFileDialogOpen} onClickZone={onClickZone} />,
    );
    const input = document.querySelector("input") as HTMLInputElement;
    const click = vi.spyOn(input, "click").mockImplementation(() => {
      input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await userEvent.click(zone());
    expect(onClickZone).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(onFileDialogOpen).toHaveBeenCalledTimes(1);
    zone().focus();
    expect(screen.getByTestId("state").textContent).toBe("focused");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(click).toHaveBeenCalledTimes(3);
    act(() => zone().blur());
    expect(screen.getByTestId("state").textContent).toBe("");
    unmount();
    render(<Field noClick noKeyboard onClickZone={(() => undefined) as () => void} />);
    const other = document.querySelector("input") as HTMLInputElement;
    const otherClick = vi.spyOn(other, "click").mockImplementation(() => undefined);
    expect(zone().hasAttribute("tabindex")).toBe(false);
    await userEvent.click(zone());
    act(() => zone().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(otherClick).not.toHaveBeenCalled();
    act(() => seen?.open());
    expect(otherClick).toHaveBeenCalledTimes(1);
  });

  it("a handler that prevents the default keeps the dropzone's behavior off", async () => {
    render(<Own />);
    const input = document.querySelector("input") as HTMLInputElement;
    const click = vi.spyOn(input, "click").mockImplementation(() => undefined);
    await userEvent.click(zone());
    expect(click).not.toHaveBeenCalled();
  });

  it("picks from the input; a disabled dropzone takes nothing", async () => {
    const onDrop = vi.fn();
    const { rerender } = render(<Field onDrop={onDrop} multiple={false} />);
    const input = document.querySelector("input") as HTMLInputElement;
    expect(input.multiple).toBe(false);
    await userEvent.upload(input, [file("one.txt")]);
    await flush();
    expect(onDrop.mock.calls[0]?.[0].map((f: File) => f.name)).toEqual(["one.txt"]);
    rerender(<Field onDrop={onDrop} disabled />);
    fire("drop", [file("two.txt")]);
    await flush();
    expect(onDrop).toHaveBeenCalledTimes(1);
  });
});

describe("Dropzone", () => {
  it("renders its children with the state; the ref opens the dialog", () => {
    const ref = createRef<DropzoneRef>();
    render(
      <Dropzone ref={ref}>
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div {...getRootProps({ role: "button", "aria-label": "Upload files" })}>
            <input {...getInputProps()} aria-label="Files" />
            {isDragActive ? "Drop here" : "Drag files"}
          </div>
        )}
      </Dropzone>,
    );
    expect(zone().textContent).toBe("Drag files");
    fire("dragenter", [file("a.txt")]);
    expect(zone().textContent).toBe("Drop here");
    const input = document.querySelector("input") as HTMLInputElement;
    const click = vi.spyOn(input, "click").mockImplementation(() => undefined);
    act(() => ref.current?.open());
    expect(click).toHaveBeenCalledTimes(1);
  });
});
