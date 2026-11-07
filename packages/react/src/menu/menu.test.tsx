import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Menu, MenuItem } from "./menu.js";

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
      >
        <MenuItem ref={item} dense divider disableGutters>
          A
        </MenuItem>
      </Menu>,
    );
    expect(ref.current?.dataset["okDense"]).toBe("");
    expect(ref.current?.parentElement?.className).toBe("paper");
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
