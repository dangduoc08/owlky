import { isScrollLocked } from "@minimal-tailwind/core";
import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "./dialog.js";

function Example(props: DialogProps & { content?: DialogContentProps }) {
  const { content, ...root } = props;
  return (
    <Dialog {...root}>
      <DialogTrigger variant="contained">Open dialog</DialogTrigger>
      <DialogContent size="xs" {...content}>
        <DialogTitle>Delete project?</DialogTitle>
        <DialogBody>
          <DialogDescription>This permanently deletes the project.</DialogDescription>
        </DialogBody>
        <DialogActions>
          <DialogClose variant="outlined">Cancel</DialogClose>
          <DialogClose variant="contained" color="error">
            Delete
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

/** Refuses the first close request, accepts the second. */
function RefusesFirstClose() {
  const [open, setOpen] = useState(true);
  const [requests, setRequests] = useState(0);
  return (
    <>
      <Example
        open={open}
        onOpenChange={(next) => {
          setRequests((n) => n + 1);
          if (requests >= 1) setOpen(next);
        }}
      />
      <output>{requests}</output>
    </>
  );
}

const dialogElement = () => document.querySelector("dialog") as HTMLDialogElement;

describe("Dialog", () => {
  it("renders closed, with the shared anatomy and runtime opt-out", () => {
    render(<Example />);
    const element = dialogElement();
    expect(element.open).toBe(false);
    expect(element.dataset).toMatchObject({ mtDialog: "", mtSize: "xs", mtRuntime: "off" });
    expect(element.querySelector("[data-mt-dialog-content] [data-mt-dialog-title]")).toBeTruthy();
  });

  it("opens from the trigger with title and description wired up", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = screen.getByRole("dialog", { name: "Delete project?" });
    expect(dialog.getAttribute("aria-describedby")).toBe(
      screen.getByText("This permanently deletes the project.").id,
    );
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(isScrollLocked()).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(dialogElement().open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(isScrollLocked()).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("closes from DialogClose and from a backdrop click", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(dialogElement().open).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await userEvent.click(dialogElement(), { position: { x: 5, y: 5 } });
    expect(dialogElement().open).toBe(false);
  });

  it("respects closeOnEscape / closeOnBackdropClick = false", async () => {
    render(<Example content={{ closeOnEscape: false, closeOnBackdropClick: false }} />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await userEvent.keyboard("{Escape}");
    await userEvent.click(dialogElement(), { position: { x: 5, y: 5 } });
    expect(dialogElement().open).toBe(true);
  });

  it("is fully controlled: a refused close keeps it open", async () => {
    render(<RefusesFirstClose />);
    expect(dialogElement().open).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(dialogElement().open).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(dialogElement().open).toBe(false);
  });

  it("syncs state when a form[method=dialog] closes it", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <form method="dialog">
            <DialogTitle>Subscribe</DialogTitle>
            <button type="submit">OK</button>
          </form>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(isScrollLocked()).toBe(false);
  });

  it("releases the scroll lock when unmounted while open", async () => {
    const { unmount } = render(<Example defaultOpen />);
    await vi.waitFor(() => expect(dialogElement().open).toBe(true));
    unmount();
    expect(isScrollLocked()).toBe(false);
  });

  it("works under StrictMode (double effects)", async () => {
    render(
      <StrictMode>
        <Example />
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(dialogElement().open).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(dialogElement().open).toBe(false);
    expect(isScrollLocked()).toBe(false);
  });

  it("throws a helpful error outside <Dialog>", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<DialogTitle>Orphan</DialogTitle>)).toThrow(/inside <Dialog>/);
    vi.restoreAllMocks();
  });

  it("has no axe violations when open", async () => {
    render(<Example defaultOpen />);
    await vi.waitFor(() => expect(dialogElement().open).toBe(true));
    await expectNoAxeViolations();
  });
});
