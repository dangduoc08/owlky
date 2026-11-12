import { dialogMaxWidths, isScrollLocked } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, finishExit, settled } from "../test-utils.js";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  type DialogProps,
  DialogTitle,
} from "./dialog.js";

function Demo({
  onChange,
  ...props
}: Partial<DialogProps> & { onChange?: (open: boolean, reason?: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog
        open={open}
        onOpenChange={(next, reason) => {
          onChange?.(next, reason);
          setOpen(next);
        }}
        {...props}
      >
        <DialogTitle>Share your location?</DialogTitle>
        <DialogContent>
          <DialogContentText>Apps can use it.</DialogContentText>
          <input aria-label="Name" />
        </DialogContent>
        <DialogActions>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** The computed `box-shadow` of a token (a probe element, removed again). */
function shadowOf(token: string): string {
  const probe = document.createElement("div");
  probe.style.boxShadow = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).boxShadow;
  probe.remove();
  return value;
}

describe("Dialog", () => {
  it("renders a closed dialog named by its title, with the paper inside", () => {
    render(<Demo />);
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(false);
    expect(dialog.dataset).toMatchObject({
      okDialog: "",
      okMaxWidth: "sm",
      okScroll: "paper",
      okRuntime: "off",
    });
    const title = dialog.querySelector("[data-ok-dialog-title]") as HTMLElement;
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(dialog.querySelector(":scope > [data-ok-dialog-paper]")).not.toBeNull();
  });

  it("the paper is a Paper: the dialog shadow by default, Paper's with an elevation", async () => {
    const { rerender } = render(<Demo />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    const paper = dialog.querySelector(":scope > [data-ok-dialog-paper]") as HTMLElement;
    expect(Object.keys(paper.dataset).slice(0, 2)).toEqual(["okDialogPaper", "okPaper"]);
    expect(dialog.hasAttribute("data-ok-elevation")).toBe(false);
    expect(getComputedStyle(paper).boxShadow).toBe(shadowOf("--ok-shadow-dialog"));
    expect(getComputedStyle(paper).borderRadius).toBe("16px");
    rerender(<Demo elevation={8} />);
    expect(paper.dataset["okElevation"]).toBe("8");
    expect(dialog.hasAttribute("data-ok-elevation")).toBe(false);
    // Paper animates shadow changes: read the value once the transition is over.
    await settled(paper);
    expect(getComputedStyle(paper).boxShadow).toBe(shadowOf("--ok-elevation-8"));
    rerender(<Demo elevation={8} fullScreen />);
    await settled(paper);
    expect(getComputedStyle(paper).boxShadow).toBe("none");
    await expectNoAxeViolations();
    await userEvent.keyboard("{Escape}");
    await finishExit(dialog);
    expect(dialog.open).toBe(false);
  });

  it("opens modally, focuses the first field, sizes the paper; Escape and the backdrop close", async () => {
    const onChange = vi.fn();
    render(<Demo onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Share your location?" });
    expect((dialog as HTMLDialogElement).open).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Name");
    const paper = dialog.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    expect(getComputedStyle(paper).borderRadius).toBe("16px");
    const text = dialog.querySelector("[data-ok-dialog-content-text]") as HTMLElement;
    expect(getComputedStyle(text).color).toBe("rgb(99, 115, 129)");
    const title = dialog.querySelector("[data-ok-dialog-title]") as HTMLElement;
    expect(getComputedStyle(title).padding).toBe("24px");
    await expectNoAxeViolations();
    await userEvent.keyboard("{Escape}");
    expect(onChange).toHaveBeenLastCalledWith(false, "escape");
    await finishExit(dialog);
    expect((dialog as HTMLDialogElement).open).toBe(false);
    await userEvent.click(trigger);
    await userEvent.click(dialog, { position: { x: 4, y: 4 } });
    expect(onChange).toHaveBeenLastCalledWith(false, "backdrop");
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await finishExit(dialog);
    expect((dialog as HTMLDialogElement).open).toBe(false);
  });

  it.each(dialogMaxWidths)("maxWidth %s", (maxWidth) => {
    render(<Demo maxWidth={maxWidth} />);
    expect(document.querySelector("dialog")?.dataset["okMaxWidth"]).toBe(maxWidth);
  });

  it("flags, disableEscapeKeyDown, a native close, aria-label instead of a title", async () => {
    const onChange = vi.fn();
    render(
      <Demo
        onChange={onChange}
        fullWidth
        fullScreen
        scroll="body"
        hideBackdrop
        disableEscapeKeyDown
        paperProps={{ className: "paper" }}
      />,
    );
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.dataset).toMatchObject({
      okFullWidth: "",
      okFullScreen: "",
      okScroll: "body",
      okHideBackdrop: "",
      okDisableEscapeKeyDown: "",
    });
    expect(dialog.querySelector(".paper")).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.keyboard("{Escape}");
    expect(dialog.open).toBe(true);
    dialog.close();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(onChange).toHaveBeenLastCalledWith(false, "close");
    render(
      <Dialog open={false} aria-label="Named">
        x
      </Dialog>,
    );
    const named = document.querySelector('dialog[aria-label="Named"]') as HTMLDialogElement;
    expect(named.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("parts: dividers, disableSpacing, own title id, refs; server render", () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <Dialog ref={ref} open={false}>
        <DialogTitle id="own">T</DialogTitle>
        <DialogContent dividers>c</DialogContent>
        <DialogActions disableSpacing>a</DialogActions>
      </Dialog>,
    );
    expect(ref.current?.localName).toBe("dialog");
    expect(
      document.querySelector("[data-ok-dialog-content]")?.hasAttribute("data-ok-dividers"),
    ).toBe(true);
    expect(
      document.querySelector("[data-ok-dialog-actions]")?.hasAttribute("data-ok-disable-spacing"),
    ).toBe(true);
    expect(document.getElementById("own")).not.toBeNull();
    const html = renderToString(
      <Dialog open={false}>
        <DialogTitle>S</DialogTitle>
      </Dialog>,
    );
    expect(html).toContain("data-ok-dialog-paper");
  });

  it("keepMounted false renders the children only while open; disableRestoreFocus, disableScrollLock", async () => {
    render(<Demo keepMounted={false} disableRestoreFocus disableScrollLock />);
    const element = document.querySelector("dialog") as HTMLDialogElement;
    expect(element.dataset).toMatchObject({ okDisableRestoreFocus: "", okDisableScrollLock: "" });
    expect(element.querySelector("[data-ok-dialog-title]")).toBeNull();
    const open = screen.getByRole("button", { name: "Open" });
    await userEvent.click(open);
    expect(screen.getByRole("dialog", { name: "Share your location?" })).toBeTruthy();
    expect(isScrollLocked()).toBe(false);
    await userEvent.keyboard("{Escape}");
    // The children stay until the exit has played.
    expect(element.querySelector("[data-ok-dialog-title]")).not.toBeNull();
    await finishExit(element);
    expect(element.open).toBe(false);
    expect(document.activeElement).not.toBe(open);
    expect(element.querySelector("[data-ok-dialog-title]")).toBeNull();
  });
});

function Toggle() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        Toggle
      </button>
      <Dialog open={open} onOpenChange={setOpen} hideBackdrop>
        <DialogTitle>Toggle</DialogTitle>
        <DialogActions>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}

describe("Dialog exit transitions", () => {
  it("plays the exit before closing, then returns the focus", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const element = document.querySelector("dialog") as HTMLDialogElement;
    const paper = element.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    await userEvent.keyboard("{Escape}");
    expect(element.getAttribute("data-ok-state")).toBe("exiting");
    expect(element.open).toBe(true);
    expect(getComputedStyle(paper).animationName).toBe("ok-dialog-out");
    await finishExit(element);
    expect(element.open).toBe(false);
    expect(element.hasAttribute("data-ok-state")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("reopening during the exit keeps the dialog open", async () => {
    render(<Toggle />);
    const element = document.querySelector("dialog") as HTMLDialogElement;
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(element.getAttribute("data-ok-state")).toBe("exiting");
    // The page is inert while the dialog is modal: reopen as the owner would.
    (screen.getByRole("button", { name: "Toggle", hidden: true }) as HTMLButtonElement).click();
    await finishExit(element);
    expect(element.open).toBe(true);
    expect(element.hasAttribute("data-ok-state")).toBe(false);
  });

  it("transitionDuration writes the lengths (a number or { enter, exit })", async () => {
    const { rerender } = render(
      <Dialog open={false} transitionDuration={100}>
        <DialogTitle>T</DialogTitle>
      </Dialog>,
    );
    const element = document.querySelector("dialog") as HTMLDialogElement;
    expect(element.dataset["okTransitionDuration"]).toBe("100");
    expect(element.hasAttribute("data-ok-transition-duration-exit")).toBe(false);
    expect(element.style.getPropertyValue("--_ok-dialog-enter")).toBe("100ms");
    expect(element.style.getPropertyValue("--_ok-dialog-exit")).toBe("100ms");
    rerender(
      <Dialog open transitionDuration={{ enter: 300, exit: 120 }}>
        <DialogTitle>T</DialogTitle>
      </Dialog>,
    );
    expect(element.dataset["okTransitionDuration"]).toBe("300");
    expect(element.dataset["okTransitionDurationExit"]).toBe("120");
    const paper = element.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    expect(getComputedStyle(paper).animationDuration).toBe("0.3s");
    rerender(
      <Dialog open={false} transitionDuration={{ enter: 300, exit: 120 }}>
        <DialogTitle>T</DialogTitle>
      </Dialog>,
    );
    expect(getComputedStyle(paper).animationDuration).toBe("0.12s");
    await finishExit(element);
    expect(element.open).toBe(false);
  });

  it("a Motion paper plays its exit with transitionDuration", async () => {
    const { rerender } = render(
      <Dialog open transition="zoomIn" transitionDuration={{ exit: 90 }}>
        <DialogTitle>T</DialogTitle>
      </Dialog>,
    );
    const element = document.querySelector("dialog") as HTMLDialogElement;
    const paper = element.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    rerender(
      <Dialog open={false} transition="zoomIn" transitionDuration={{ exit: 90 }}>
        <DialogTitle>T</DialogTitle>
      </Dialog>,
    );
    expect(paper.getAttribute("data-ok-state")).toBe("exit");
    expect(getComputedStyle(paper).animationDuration).toBe("0.09s");
    await finishExit(element);
    expect(element.open).toBe(false);
    expect(paper.getAttribute("data-ok-state")).toBe("enter");
  });

  it("closes at once without an exit animation (reduced motion)", async () => {
    const style = document.createElement("style");
    style.textContent = "[data-ok-dialog-paper], dialog::backdrop { animation: none !important; }";
    document.head.append(style);
    const onChange = vi.fn();
    render(<Demo onChange={onChange} keepMounted={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const element = document.querySelector("dialog") as HTMLDialogElement;
    await userEvent.keyboard("{Escape}");
    expect(element.open).toBe(false);
    expect(element.hasAttribute("data-ok-state")).toBe(false);
    style.remove();
  });
});
