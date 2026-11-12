import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Menu, MenuItem, MenuList, MenuSubmenu } from "./menu.js";

function Demo({
  onChange,
  onPick,
}: {
  onChange?: (open: boolean, reason?: string) => void;
  onPick?: (value: string, prevent?: boolean) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        type="button"
        id="trigger"
        aria-haspopup="menu"
        onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
      >
        Open
      </button>
      <Menu
        id="m"
        aria-labelledby="trigger"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={(open, reason) => {
          onChange?.(open, reason);
          setAnchor(null);
        }}
      >
        <MenuItem disabled onClick={() => onPick?.("off")}>
          Off
        </MenuItem>
        <MenuItem onClick={() => onPick?.("profile")}>Profile</MenuItem>
        <MenuItem selected onClick={() => onPick?.("account")}>
          My account
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            onPick?.("stay");
            event.preventDefault();
          }}
        >
          Stay open
        </MenuItem>
      </Menu>
      <input aria-label="After" />
    </>
  );
}

describe("Menu", () => {
  it("renders a popover with a ul[role=menu] and items", () => {
    render(<Demo />);
    const menu = screen.getByRole("menu", { hidden: true });
    expect(menu.localName).toBe("ul");
    expect(menu.dataset["okMenu"]).toBe("");
    expect(menu.parentElement?.dataset).toMatchObject({
      okPopover: "",
      okPlacement: "bottom-start",
    });
    expect(menu.parentElement?.id).toBe("m");
    const items = screen.getAllByRole("menuitem", { hidden: true });
    expect(items.map((i) => i.getAttribute("tabindex"))).toEqual(["-1", "-1", "-1", "-1"]);
    expect(items[0]?.getAttribute("aria-disabled")).toBe("true");
    expect(items[2]?.dataset["okSelected"]).toBe("");
  });

  it("opens on the selected item; keys move focus; Enter chooses and closes", async () => {
    const onChange = vi.fn();
    const onPick = vi.fn();
    render(<Demo onChange={onChange} onPick={onPick} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    expect(document.activeElement?.textContent).toBe("My account");
    const item = document.activeElement as HTMLElement;
    expect(getComputedStyle(item).fontWeight).toBe("600");
    expect(getComputedStyle(item).borderRadius).toBe("6px");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Stay open");
    await userEvent.keyboard("{ArrowDown}{End}{Home}");
    expect(document.activeElement?.textContent).toBe("Profile");
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement?.textContent).toBe("Stay open");
    await userEvent.keyboard("p");
    expect(document.activeElement?.textContent).toBe("Profile");
    await userEvent.keyboard("{Alt>}m{/Alt}");
    expect(document.activeElement?.textContent).toBe("Profile");
    await userEvent.keyboard("{Enter}");
    expect(onPick).toHaveBeenLastCalledWith("profile");
    expect(onChange).toHaveBeenLastCalledWith(false, "select");
    expect(document.activeElement).toBe(trigger);
    await expectNoAxeViolations();
  });

  it("preventDefault keeps it open; disabled items ignore clicks; Space; Tab and Escape close", async () => {
    const onChange = vi.fn();
    const onPick = vi.fn();
    render(<Demo onChange={onChange} onPick={onPick} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Stay open" }));
    expect(onPick).toHaveBeenLastCalledWith("stay");
    expect(onChange).not.toHaveBeenCalled();
    (screen.getByRole("menuitem", { name: "Off" }) as HTMLElement).click();
    expect(onPick).toHaveBeenCalledTimes(1);
    (screen.getByRole("menuitem", { name: "My account" }) as HTMLElement).focus();
    await userEvent.keyboard(" ");
    expect(onPick).toHaveBeenLastCalledWith("account");
    await userEvent.click(trigger);
    await userEvent.keyboard("{Tab}");
    expect(onChange).toHaveBeenLastCalledWith(false, "tab");
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(onChange).toHaveBeenLastCalledWith(false, "escape");
    await userEvent.keyboard("x");
  });

  it("dense, item flags, refs, paperProps; server render", () => {
    const ref = createRef<HTMLUListElement>();
    const item = createRef<HTMLLIElement>();
    const fn = vi.fn();
    render(
      <Menu
        ref={ref}
        open={false}
        anchorEl={null}
        dense
        aria-label="M"
        paperProps={{ className: "paper" }}
        elevation={12}
      >
        <MenuItem ref={item} dense divider disableGutters>
          A
        </MenuItem>
      </Menu>,
    );
    expect(ref.current?.dataset["okDense"]).toBe("");
    expect(ref.current?.parentElement?.className).toBe("paper");
    // The menu's paper is a Popover, a Paper: `elevation` reaches it.
    expect(ref.current?.parentElement?.dataset).toMatchObject({ okPaper: "", okElevation: "12" });
    expect(item.current?.dataset).toMatchObject({
      okDense: "",
      okShowDivider: "",
      okDisableGutters: "",
    });
    const callback = createRef<HTMLUListElement>();
    render(
      <Menu
        ref={(node) => {
          callback.current = node;
          fn();
        }}
        open={false}
        anchorEl={null}
        aria-label="N"
      >
        <MenuItem>B</MenuItem>
      </Menu>,
    );
    expect(fn).toHaveBeenCalled();
    expect(
      renderToString(
        <Menu open={false} anchorEl={null} aria-label="S">
          <MenuItem selected>C</MenuItem>
        </Menu>,
      ),
    ).toContain('role="menu"');
  });
});

function Nested({ onChange }: { onChange?: (open: boolean, reason?: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button type="button" onClick={(event) => setAnchor(event.currentTarget)}>
        Open
      </button>
      <Menu
        aria-label="File"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={(open, reason) => {
          onChange?.(open, reason);
          setAnchor(null);
        }}
      >
        <MenuItem>New</MenuItem>
        <MenuSubmenu id="share" label="Share">
          <MenuItem>Email</MenuItem>
          <MenuSubmenu id="more" label="More">
            <MenuItem>Fax</MenuItem>
          </MenuSubmenu>
        </MenuSubmenu>
        <MenuSubmenu id="off" label="Off" disabled>
          <MenuItem>Never</MenuItem>
        </MenuSubmenu>
        <MenuItem>Delete</MenuItem>
      </Menu>
      <button type="button">Outside</button>
    </>
  );
}

const isOpen = (id: string) => document.getElementById(id)?.hasAttribute("data-ok-open");
const trigger = (name: string) => screen.getByRole("menuitem", { name, hidden: true });

describe("MenuSubmenu", () => {
  it("keyboard: ArrowRight / Enter open and focus the first item, ArrowLeft and Escape close", async () => {
    const onChange = vi.fn();
    render(<Nested onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.keyboard("{ArrowDown}");
    const share = trigger("Share");
    expect(document.activeElement).toBe(share);
    expect(share.getAttribute("aria-haspopup")).toBe("menu");
    expect(share.getAttribute("aria-controls")).toBe("share");
    await userEvent.keyboard("{ArrowRight}");
    expect(isOpen("share")).toBe(true);
    expect(share.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.textContent).toBe("Email");
    // Keys in the submenu stay in it.
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(trigger("More"));
    await userEvent.keyboard("{Enter}");
    expect(isOpen("more")).toBe(true);
    expect(document.activeElement?.textContent).toBe("Fax");
    await userEvent.keyboard("{Escape}");
    expect(isOpen("more")).toBe(false);
    expect(isOpen("share")).toBe(true);
    expect(document.activeElement).toBe(trigger("More"));
    await userEvent.keyboard("{ArrowLeft}");
    expect(isOpen("share")).toBe(false);
    expect(document.activeElement).toBe(share);
    expect(onChange).not.toHaveBeenCalled();
    // Disabled triggers are skipped; moving on closes open submenus.
    await userEvent.keyboard("{ArrowRight}");
    expect(isOpen("share")).toBe(true);
    share.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(isOpen("share")).toBe(false);
    expect(isOpen("off")).toBe(false);
    expect(document.activeElement).toBe(trigger("Delete"));
    await userEvent.keyboard("{ArrowUp}{ArrowRight}");
    expect(isOpen("share")).toBe(true);
    // Choosing an item in a submenu closes the whole menu.
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(false, "select");
    expect(isOpen("share")).toBe(false);
  });

  it("a click opens it; Tab and a press outside close the whole menu; it closes with the menu", async () => {
    const onChange = vi.fn();
    render(<Nested onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(trigger("Share"));
    expect(isOpen("share")).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Tab}");
    expect(onChange).toHaveBeenLastCalledWith(false, "tab");
    expect(isOpen("share")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(trigger("Share"));
    expect(isOpen("share")).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(onChange).toHaveBeenLastCalledWith(false, "backdrop");
  });

  it("the mouse resting on a trigger opens its submenu without moving focus", async () => {
    render(<Nested />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const active = document.activeElement;
    await userEvent.hover(trigger("Share"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(isOpen("share")).toBe(true);
    expect(document.activeElement).toBe(active);
    await userEvent.hover(trigger("New"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(isOpen("share")).toBe(false);
    await userEvent.hover(trigger("Share"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    // ArrowRight on an open submenu's trigger focuses its first item.
    trigger("Share").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Email");
    await expectNoAxeViolations(document.body);
  });

  it("right to left: the submenu opens on the left; ArrowLeft opens, ArrowRight closes", async () => {
    render(
      <div dir="rtl">
        <Nested />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.keyboard("{ArrowDown}{ArrowLeft}");
    expect(isOpen("share")).toBe(true);
    expect(document.getElementById("share")?.getAttribute("data-ok-placement")).toBe("left-start");
    await userEvent.keyboard("{ArrowRight}");
    expect(isOpen("share")).toBe(false);
  });
});

describe("Menu options and MenuList", () => {
  it("variant menu focuses the first item; disableAutoFocusItem focuses the list", async () => {
    const { rerender } = render(
      <Menu open anchorEl={document.body} aria-label="V" variant="menu">
        <MenuItem>One</MenuItem>
        <MenuItem selected>Two</MenuItem>
      </Menu>,
    );
    expect(document.activeElement?.textContent).toBe("One");
    rerender(
      <Menu open={false} anchorEl={document.body} aria-label="V" disableAutoFocusItem>
        <MenuItem>One</MenuItem>
        <MenuItem selected>Two</MenuItem>
      </Menu>,
    );
    rerender(
      <Menu open anchorEl={document.body} aria-label="V" disableAutoFocusItem>
        <MenuItem>One</MenuItem>
        <MenuItem selected>Two</MenuItem>
      </Menu>,
    );
    const list = screen.getByRole("menu");
    expect(document.activeElement).toBe(list);
    expect(list.getAttribute("tabindex")).toBe("-1");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("One");
  });

  it("standalone: the focus item takes the tab stop; autoFocus, autoFocusItem, wrap and disabled options", async () => {
    const { rerender } = render(
      <MenuList aria-label="L" disabledItemsFocusable disableListWrap>
        <MenuItem disabled>Off</MenuItem>
        <MenuItem>On</MenuItem>
      </MenuList>,
    );
    const list = screen.getByRole("menu");
    expect(list.dataset).toMatchObject({ okDisabledItemsFocusable: "", okDisableListWrap: "" });
    const [off, on] = screen.getAllByRole("menuitem");
    expect(off?.getAttribute("tabindex")).toBe("0");
    expect(on?.getAttribute("tabindex")).toBe("-1");
    off?.focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(off);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(on);
    await userEvent.keyboard("{Tab}");
    rerender(
      <MenuList aria-label="L" autoFocusItem>
        <MenuItem disabled>Off</MenuItem>
        <MenuItem selected>On</MenuItem>
        text
      </MenuList>,
    );
    expect(document.activeElement?.textContent).toBe("On");
    expect(screen.getAllByRole("menuitem")[1]?.getAttribute("tabindex")).toBe("0");
    rerender(
      <MenuList aria-label="L" autoFocus>
        <MenuItem>On</MenuItem>
      </MenuList>,
    );
    expect(document.activeElement).toBe(screen.getByRole("menu"));
    expect(screen.getByRole("menu").getAttribute("tabindex")).toBe("0");
    await expectNoAxeViolations(document.body);
  });
});
