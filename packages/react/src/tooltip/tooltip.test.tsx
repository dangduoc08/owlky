import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Tooltip } from "./tooltip.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Controlled() {
  const [open, setOpen] = useState(true);
  return (
    <Tooltip title="Shown" open={open} onOpenChange={setOpen}>
      <button type="button">c</button>
    </Tooltip>
  );
}

describe("Tooltip", () => {
  it("renders the trigger and a closed tooltip that names it", () => {
    render(
      <Tooltip id="t" title="Delete" placement="top" arrow transition="fade" enterDelay={200}>
        <button type="button">x</button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.getAttribute("aria-labelledby")).toBe("t");
    const tooltip = document.getElementById("t") as HTMLElement;
    expect(tooltip.getAttribute("role")).toBe("tooltip");
    expect(tooltip.getAttribute("popover")).toBe("manual");
    expect(tooltip.dataset).toMatchObject({
      okTooltip: "",
      okPlacement: "top",
      okArrow: "",
      okTransition: "fade",
      okEnterDelay: "200",
      okRuntime: "off",
    });
    expect(tooltip.querySelector("[data-ok-tooltip-arrow]")).not.toBeNull();
    expect(getComputedStyle(tooltip).display).toBe("none");
  });

  it("hover opens it after the delay; the tooltip is hoverable; leaving closes it", async () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip title="Add" describeChild enterDelay={10} onOpenChange={onOpenChange}>
        <button type="button" aria-describedby="other">
          Save
        </button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("aria-describedby")).toMatch(/^other /);
    await userEvent.hover(button);
    await wait(50);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    expect(getComputedStyle(tooltip).backgroundColor).toBe("rgb(28, 37, 46)");
    expect(getComputedStyle(tooltip).color).toBe("rgb(255, 255, 255)");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await userEvent.hover(tooltip);
    await wait(150);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.unhover(tooltip);
    await wait(150);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("keyboard focus opens it, Escape and blur close it; listeners can be disabled", async () => {
    render(
      <>
        <input aria-label="Before" />
        <Tooltip title="Add">
          <button type="button">+</button>
        </Tooltip>
        <Tooltip title="Off" disableFocusListener disableHoverListener disableTouchListener>
          <button type="button">o</button>
        </Tooltip>
      </>,
    );
    screen.getByRole("textbox").focus();
    await userEvent.keyboard("{Tab}");
    const tooltip = document.querySelector("[data-ok-tooltip]") as HTMLElement;
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement?.textContent).toBe("+");
    await userEvent.keyboard("{Tab}");
    const off = document.querySelectorAll("[data-ok-tooltip]")[1] as HTMLElement;
    expect(off.hasAttribute("data-ok-open")).toBe(false);
    await userEvent.hover(screen.getByRole("button", { name: "Off" }));
    await wait(200);
    expect(off.hasAttribute("data-ok-open")).toBe(false);
  });

  it("controlled open; touch long press; child handlers still run; refs merge", async () => {
    const onPointerDown = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(<Controlled />);
    expect(screen.getByRole("tooltip").hasAttribute("data-ok-open")).toBe(true);
    render(
      <Tooltip title="Touch" enterTouchDelay={20} leaveTouchDelay={20}>
        <button type="button" ref={ref} onPointerDown={onPointerDown}>
          t
        </button>
      </Tooltip>,
    );
    const button = ref.current as HTMLButtonElement;
    const tooltip = document.getElementById(
      button.getAttribute("aria-labelledby") as string,
    ) as HTMLElement;
    const touch = (type: string, pointerType = "touch") =>
      button.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType }));
    touch("pointerdown");
    expect(onPointerDown).toHaveBeenCalled();
    await wait(60);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(true);
    touch("pointerup");
    await wait(60);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
    touch("pointerdown");
    touch("pointercancel");
    touch("pointerdown", "mouse");
    await wait(60);
    expect(tooltip.hasAttribute("data-ok-open")).toBe(false);
  });

  it("controlled hover reports changes; a mouse click focus doesn't open it", async () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip title="Ctl" open={false} onOpenChange={onOpenChange} enterDelay={0}>
        <button type="button" style={{ width: 40, height: 40 }}>
          k
        </button>
      </Tooltip>,
    );
    const button = screen.getByRole("button", { name: "Ctl" });
    await userEvent.hover(button);
    await wait(30);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("tooltip", { hidden: true }).hasAttribute("data-ok-open")).toBe(false);
    await userEvent.unhover(button);
    render(
      <Tooltip title="Click">
        <button type="button" style={{ width: 40, height: 40 }}>
          m
        </button>
      </Tooltip>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Click" }));
    expect(screen.getAllByRole("tooltip", { hidden: true })[1]?.hasAttribute("data-ok-open")).toBe(
      false,
    );
  });

  it("empty titles and non-elements render the child only; server render; axe", async () => {
    const { container } = render(
      <>
        <Tooltip title="">
          <button type="button">a</button>
        </Tooltip>
        <Tooltip title="t">{"text" as never}</Tooltip>
      </>,
    );
    expect(container.querySelector("[data-ok-tooltip]")).toBeNull();
    expect(container.textContent).toBe("atext");
    const html = renderToString(
      <Tooltip id="s" title="Add">
        <button type="button">+</button>
      </Tooltip>,
    );
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('aria-labelledby="s"');
    render(
      <Tooltip title="Add" open>
        <button type="button" style={{ width: 40, height: 40 }}>
          +
        </button>
      </Tooltip>,
    );
    await expectNoAxeViolations();
  });
});
