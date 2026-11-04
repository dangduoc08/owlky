import { isScrollLocked } from "@minimal-tailwind/core";
import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Button } from "../button/button.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Drawer, DrawerClose, DrawerContent, type DrawerProps, DrawerTrigger } from "./drawer.js";

function Example({
  anchor,
  closeOnEscape,
  closeOnBackdropClick,
  ...props
}: DrawerProps & {
  anchor?: "left" | "right" | "top" | "bottom";
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
}) {
  return (
    <Drawer {...props}>
      <DrawerTrigger variant="outlined">Open</DrawerTrigger>
      <DrawerContent
        anchor={anchor}
        aria-label="Menu"
        closeOnEscape={closeOnEscape}
        closeOnBackdropClick={closeOnBackdropClick}
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

describe("Drawer anatomy", () => {
  it("renders a closed, named drawer with explicit defaults and a trigger", () => {
    render(<Example anchor={"x" as never} />);
    expect(dialog().open).toBe(false);
    expect(dialog().dataset).toMatchObject({ mtDrawer: "", mtAnchor: "left", mtRuntime: "off" });
    expect(dialog().getAttribute("aria-label")).toBe("Menu");
    expect(dialog().querySelector(":scope > [data-mt-drawer-content]")).not.toBeNull();
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
    const objectRef = { current: null as HTMLDialogElement | null };
    let fromCallback: HTMLDialogElement | null = null;
    render(
      <>
        <Drawer>
          <DrawerContent ref={objectRef} aria-label="A" />
        </Drawer>
        <Drawer>
          <DrawerContent
            ref={(node) => {
              fromCallback = node;
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
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(isScrollLocked()).toBe(false);
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("backdrop click and DrawerClose close it; a click inside doesn't", async () => {
    render(<Example defaultOpen />);
    expect(dialog().open).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Inside" }));
    expect(dialog().open).toBe(true);
    await backdropClick();
    expect(dialog().open).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog().open).toBe(false);
  });

  it("closeOnEscape / closeOnBackdropClick = false keep it open", async () => {
    render(<Example defaultOpen closeOnEscape={false} closeOnBackdropClick={false} />);
    await userEvent.keyboard("{Escape}");
    await backdropClick();
    expect(dialog().open).toBe(true);
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
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
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
    ["top", / 0px 16px 32px -4px/],
  ] as const)("%s drawers use their shadow token", (anchor, shadow) => {
    render(<Example defaultOpen anchor={anchor} />);
    const content = dialog().querySelector("[data-mt-drawer-content]") as HTMLElement;
    expect(getComputedStyle(content).boxShadow).toMatch(shadow);
  });
});
