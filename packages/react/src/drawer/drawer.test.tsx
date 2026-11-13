import { isScrollLocked } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Button } from "../button/button.js";
import { expectNoAxeViolations, finishExit } from "../test-utils.js";
import { Drawer, DrawerClose, DrawerContent, type DrawerProps, DrawerTrigger } from "./drawer.js";

function Example({
  anchor,
  disableEscapeKeyDown,
  hideBackdrop,
  ...props
}: DrawerProps & {
  anchor?: "left" | "right" | "top" | "bottom";
  disableEscapeKeyDown?: boolean;
  hideBackdrop?: boolean;
}) {
  return (
    <Drawer {...props}>
      <DrawerTrigger variant="outlined">Open</DrawerTrigger>
      <DrawerContent
        anchor={anchor}
        aria-label="Menu"
        disableEscapeKeyDown={disableEscapeKeyDown}
        hideBackdrop={hideBackdrop}
      >
        <Button>Inside</Button>
        <DrawerClose>Close</DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

const dialog = () => document.querySelector("dialog") as HTMLDialogElement;
const backdropClick = () =>
  userEvent.click(dialog(), { position: { x: window.innerWidth - 10, y: 10 } });

function RefuseBackdrop({ report }: { report: (open: boolean, reason?: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Example
      open={open}
      onOpenChange={(next, reason) => {
        report(next, reason);
        if (reason !== "backdrop") setOpen(next);
      }}
    />
  );
}

describe("Docked drawers", () => {
  it("persistent: an <aside> toggled by its trigger (aria-expanded, aria-controls), no modal", async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer variant="persistent" onOpenChange={onOpenChange}>
        <DrawerTrigger>Menu</DrawerTrigger>
        <DrawerContent aria-label="Nav" anchor="right">
          <Button>Inside</Button>
        </DrawerContent>
      </Drawer>,
    );
    const aside = screen.getByLabelText("Nav", { selector: "aside" });
    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(aside.dataset).toMatchObject({ okVariant: "persistent", okAnchor: "right" });
    expect(aside.hidden).toBe(true);
    expect(trigger.getAttribute("aria-controls")).toBe(aside.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("aria-haspopup")).toBe(false);
    await userEvent.click(trigger);
    expect(aside.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(isScrollLocked()).toBe(false);
    await userEvent.click(trigger);
    expect(aside.hidden).toBe(true);
    expect(onOpenChange.mock.calls).toEqual([[true], [false, "close"]]);
  });

  it("permanent: always shown, keeps a custom id and has no axe violations", async () => {
    render(
      <Drawer variant="permanent" open={false}>
        <DrawerContent aria-label="Side" id="side">
          <Button>Link</Button>
        </DrawerContent>
      </Drawer>,
    );
    const aside = screen.getByLabelText("Side", { selector: "aside" });
    expect(aside.hidden).toBe(false);
    expect(aside.id).toBe("side");
    expect(getComputedStyle(aside.firstElementChild as Element).boxShadow).toBe("none");
    await expectNoAxeViolations();
  });
});

describe("Drawer anatomy", () => {
  it("renders a closed, named drawer with explicit defaults and a trigger", () => {
    render(<Example anchor={"x" as never} />);
    expect(dialog().open).toBe(false);
    expect(dialog().dataset).toMatchObject({ okDrawer: "", okAnchor: "left", okRuntime: "off" });
    expect(dialog().getAttribute("aria-label")).toBe("Menu");
    const content = dialog().querySelector(":scope > [data-ok-drawer-content]") as HTMLElement;
    // The content is a square Paper: Paper's radius is restated by the drawer.
    expect(content.dataset["okPaper"]).toBe("");
    expect(getComputedStyle(content).borderTopRightRadius).toBe("0px");
    expect(screen.getByRole("button", { name: "Open" }).getAttribute("aria-haspopup")).toBe(
      "dialog",
    );
  });

  it("renders the same markup on the server", () => {
    const html = renderToString(<Example anchor="right" />);
    const server = document.createElement("div");
    server.innerHTML = html;
    const { container } = render(<Example anchor="right" />);
    expect(server.innerHTML).toBe(container.innerHTML);
  });

  it("forwards object and callback refs to the dialog", () => {
    const objectRef = { current: null as HTMLElement | null };
    let fromCallback: HTMLDialogElement | null = null;
    render(
      <>
        <Drawer>
          <DrawerContent ref={objectRef} aria-label="A" />
        </Drawer>
        <Drawer>
          <DrawerContent
            ref={(node) => {
              fromCallback = node as HTMLDialogElement | null;
            }}
            aria-label="B"
          />
        </Drawer>
      </>,
    );
    expect(objectRef.current?.getAttribute("aria-label")).toBe("A");
    expect((fromCallback as HTMLDialogElement | null)?.getAttribute("aria-label")).toBe("B");
  });

  it("parts throw outside <Drawer>", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<DrawerTrigger>x</DrawerTrigger>)).toThrow(/inside <Drawer>/);
    vi.restoreAllMocks();
  });
});

function FormDrawer() {
  const [open, setOpen] = useState(true);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent aria-label="Form">
        <form method="dialog">
          <button type="submit">Done</button>
        </form>
      </DrawerContent>
      <output>{String(open)}</output>
    </Drawer>
  );
}

describe("Drawer behavior", () => {
  it("opens from the trigger, focuses inside, locks scroll and has no axe violations", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(dialog().open).toBe(true);
    expect(document.activeElement?.textContent).toBe("Inside");
    expect(isScrollLocked()).toBe(true);
    await expectNoAxeViolations();
  });

  it("Escape closes and focus returns to the trigger", async () => {
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    await finishExit(dialog());
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(isScrollLocked()).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[true], [false, "escape"]]);
  });

  it("backdrop click and DrawerClose close it; a click inside doesn't", async () => {
    render(<Example defaultOpen />);
    expect(dialog().open).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(dialog().open).toBe(true);
    await backdropClick();
    await finishExit(dialog());
    expect(dialog().open).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await finishExit(dialog());
    expect(dialog().open).toBe(false);
  });

  it("disableEscapeKeyDown ignores Escape; hideBackdrop keeps the drawer modal", async () => {
    render(<Example defaultOpen disableEscapeKeyDown hideBackdrop />);
    expect(dialog().dataset).toMatchObject({ okDisableEscapeKeyDown: "", okHideBackdrop: "" });
    await userEvent.keyboard("{Escape}");
    expect(dialog().open).toBe(true);
    expect(getComputedStyle(dialog(), "::backdrop").backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await backdropClick();
    await finishExit(dialog());
    expect(dialog().open).toBe(false);
  });

  it("reports why it closes; a controlled owner can refuse by reason", async () => {
    const onOpenChange = vi.fn();
    render(<RefuseBackdrop report={onOpenChange} />);
    await backdropClick();
    expect(dialog().open).toBe(true);
    await userEvent.keyboard("{Escape}");
    await finishExit(dialog());
    expect(dialog().open).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([
      [false, "backdrop"],
      [false, "escape"],
    ]);
  });

  it("controlled: the owner decides; preventDefault on trigger / close cancels", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Example open={false} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(dialog().open).toBe(false);
    rerender(<Example open onOpenChange={onOpenChange} />);
    expect(dialog().open).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false, "escape");
    expect(dialog().open).toBe(true);

    rerender(
      <Drawer defaultOpen>
        <DrawerTrigger onClick={(e) => e.preventDefault()}>Blocked</DrawerTrigger>
        <DrawerContent aria-label="Menu">
          <DrawerClose onClick={(e) => e.preventDefault()}>Stay</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(dialog().open).toBe(true);
  });

  it("a blocked trigger doesn't open it", async () => {
    render(
      <Drawer>
        <DrawerTrigger onClick={(e) => e.preventDefault()}>Blocked</DrawerTrigger>
        <DrawerContent aria-label="Menu">x</DrawerContent>
      </Drawer>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Blocked" }));
    expect(dialog().open).toBe(false);
  });

  it("syncs when the browser closes it (form method=dialog)", async () => {
    render(<FormDrawer />);
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("status").textContent).toBe("false");
  });

  it("works in StrictMode and releases the scroll lock when unmounted while open", () => {
    const { unmount } = render(
      <StrictMode>
        <Example defaultOpen anchor="bottom" />
      </StrictMode>,
    );
    expect(dialog().open).toBe(true);
    expect(isScrollLocked()).toBe(true);
    unmount();
    expect(isScrollLocked()).toBe(false);
  });

  it.each([
    ["left", / 40px 40px 80px -8px/],
    ["right", / -40px 40px 80px -8px/],
    ["top", / 0px 16px 40px -6px/],
  ] as const)("%s drawers use their shadow token", (anchor, shadow) => {
    render(<Example defaultOpen anchor={anchor} />);
    const content = dialog().querySelector("[data-ok-drawer-content]") as HTMLElement;
    expect(getComputedStyle(content).boxShadow).toMatch(shadow);
  });
});

describe("Drawer options", () => {
  it("elevation, transitionDuration, keepMounted, disableRestoreFocus, disableScrollLock", async () => {
    render(
      <Drawer>
        <DrawerTrigger variant="outlined">Open</DrawerTrigger>
        <DrawerContent
          aria-label="Menu"
          elevation={0}
          transitionDuration={50}
          keepMounted={false}
          disableRestoreFocus
          disableScrollLock
        >
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    const element = dialog();
    expect(element.dataset).toMatchObject({
      okElevation: "0",
      okTransitionDuration: "50",
      okDisableRestoreFocus: "",
      okDisableScrollLock: "",
    });
    expect(element.style.getPropertyValue("--_ok-drawer-duration")).toBe("50ms");
    expect(screen.queryByRole("button", { name: "Close", hidden: true })).toBeNull();
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    expect(isScrollLocked()).toBe(false);
    const content = element.querySelector("[data-ok-drawer-content]") as HTMLElement;
    expect(getComputedStyle(content).boxShadow).toBe("none");
    expect(getComputedStyle(content).transitionDuration).toBe("0.05s");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await finishExit(element);
    expect(element.open).toBe(false);
    expect(document.activeElement).not.toBe(trigger);
    expect(screen.queryByRole("button", { name: "Close", hidden: true })).toBeNull();
  });

  it("slides out before closing; keepMounted={false} children stay until then", async () => {
    render(
      <Drawer defaultOpen>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent aria-label="Menu" keepMounted={false} transitionDuration={80}>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </Drawer>,
    );
    const element = dialog();
    // Let the slide in end first: a close at its very start has nothing left to play.
    for (const animation of element.getAnimations({ subtree: true })) animation.finish();
    // A synchronous click: a slow pointer click under load can outlast the 80 ms exit.
    await act(async () => screen.getByRole("button", { name: "Close" }).click());
    expect(element.getAttribute("data-ok-state")).toBe("exiting");
    expect(element.open).toBe(true);
    const content = element.querySelector("[data-ok-drawer-content]") as HTMLElement;
    expect(getComputedStyle(content).transitionDuration).toBe("0.08s");
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    await finishExit(element);
    expect(element.open).toBe(false);
    expect(screen.queryByRole("button", { name: "Close", hidden: true })).toBeNull();
  });
});
