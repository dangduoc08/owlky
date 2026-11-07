import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Popover, type PopoverProps } from "./popover.js";

function Demo(
  props: Partial<PopoverProps> & { onChange?: (open: boolean, reason?: string) => void },
) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { onChange, ...rest } = props;
  return (
    <>
      <button type="button" onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}>
        Open
      </button>
      <Popover
        role="dialog"
        aria-label="Details"
        open={anchor !== null}
        anchorEl={anchor}
        onOpenChange={(open, reason) => {
          onChange?.(open, reason);
          setAnchor(null);
        }}
        {...rest}
      >
        <button type="button">Inside</button>
      </Popover>
      <button type="button">Outside</button>
    </>
  );
}

function Hover() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" id="a" onClick={() => setOpen(!open)}>
        Toggle
      </button>
      <Popover
        open={open}
        anchorEl={() => document.getElementById("a")}
        disableAutoFocus
        disableRestoreFocus
        data-testid="p"
      >
        <button type="button">In</button>
      </Popover>
    </>
  );
}

describe("Popover", () => {
  it("renders a closed div[popover=manual] with its options", () => {
    render(<Demo placement="right-end" arrow disableEscapeKeyDown />);
    const popover = screen.getByRole("dialog", { hidden: true });
    expect(popover.getAttribute("popover")).toBe("manual");
    expect(popover.dataset).toMatchObject({
      okPopover: "",
      okPlacement: "right-end",
      okArrow: "",
      okDisableEscapeKeyDown: "",
      okRuntime: "off",
    });
    expect(
      popover.querySelector(":scope > [data-ok-popover-arrow][aria-hidden='true']"),
    ).not.toBeNull();
    expect(getComputedStyle(popover).display).toBe("none");
  });

  it("opens next to the anchor, focuses inside; Escape and outside presses ask to close", async () => {
    const onChange = vi.fn();
    render(<Demo onChange={onChange} />);
    const open = screen.getByRole("button", { name: "Open" });
    await userEvent.click(open);
    const popover = screen.getByRole("dialog");
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
    expect(popover.matches(":popover-open")).toBe(true);
    expect(document.activeElement?.textContent).toBe("Inside");
    const box = popover.getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(open.getBoundingClientRect().bottom);
    expect(getComputedStyle(popover).borderRadius).toBe("10px");
    await userEvent.keyboard("{Escape}");
    expect(onChange).toHaveBeenLastCalledWith(false, "escape");
    expect(popover.hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(open);
    await userEvent.click(open);
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(onChange).toHaveBeenLastCalledWith(false, "backdrop");
    await expectNoAxeViolations();
  });

  it("disableAutoFocus / disableRestoreFocus / initialFocus; anchor as a function", async () => {
    render(<Hover />);
    const toggle = screen.getByRole("button", { name: "Toggle" });
    await userEvent.click(toggle);
    const popover = screen.getByTestId("p");
    expect(popover.hasAttribute("data-ok-open")).toBe(true);
    expect(document.activeElement).toBe(toggle);
    expect(popover.dataset).toMatchObject({ okDisableAutoFocus: "", okDisableRestoreFocus: "" });
    await userEvent.click(toggle);
    expect(popover.hasAttribute("data-ok-open")).toBe(false);

    const target = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <Popover open={false} anchorEl={null} initialFocus={() => target.current} data-testid="q">
        <button type="button">First</button>
        <button type="button" ref={target}>
          Second
        </button>
      </Popover>,
    );
    rerender(
      <Popover open anchorEl={toggle} initialFocus={() => target.current} data-testid="q">
        <button type="button">First</button>
        <button type="button" ref={target}>
          Second
        </button>
      </Popover>,
    );
    expect(document.activeElement).toBe(target.current);
    rerender(
      <Popover open anchorEl={null} data-testid="q">
        x
      </Popover>,
    );
    expect(screen.getByTestId("q").hasAttribute("data-ok-open")).toBe(false);
  });

  it("forwards refs; server-renders closed", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Popover ref={ref} open={false} anchorEl={null} className="x">
        y
      </Popover>,
    );
    expect(ref.current?.className).toBe("x");
    const html = renderToString(
      <Popover open={false} anchorEl={null} arrow>
        z
      </Popover>,
    );
    expect(html).toContain('popover="manual"');
    expect(html).toContain('data-ok-popover-arrow=""');
    expect(html).not.toContain("data-ok-open");
  });
});
