import { fireEvent, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CircularProgress } from "../circular-progress/circular-progress.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Backdrop } from "./backdrop.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
/** The computed values of `keys` (CSSStyleDeclaration doesn't compare as a plain object). */
const styles = (element: Element, keys: readonly string[]) =>
  Object.fromEntries(keys.map((key) => [key, css(element).getPropertyValue(key)]));
const root = () => document.querySelector("[data-ok-backdrop]") as HTMLElement;

function Demo({ onClick }: { onClick?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Show backdrop
      </button>
      <Backdrop
        open={open}
        onClick={() => {
          onClick?.();
          setOpen(false);
        }}
      >
        <CircularProgress color="inherit" aria-label="Loading" />
      </Backdrop>
    </>
  );
}

describe("Backdrop", () => {
  it("closed: in the DOM, hidden from hit testing and the accessibility tree", async () => {
    render(
      <Backdrop open={false}>
        <CircularProgress color="inherit" aria-label="Loading" />
      </Backdrop>,
    );
    expect({ ...root().dataset }).toEqual({ okBackdrop: "", okRuntime: "off" });
    await settled(root());
    expect(styles(root(), ["visibility", "opacity"])).toEqual({
      visibility: "hidden",
      opacity: "0",
    });
    expect(screen.queryByRole("progressbar")).toBeNull();
    await expectNoAxeViolations();
  });

  it("open: covers the viewport, dims the page and centers its children", async () => {
    render(
      <Backdrop open>
        <CircularProgress color="inherit" aria-label="Loading" />
      </Backdrop>,
    );
    const backdrop = root();
    expect(backdrop.hasAttribute("data-ok-open")).toBe(true);
    await settled(backdrop);
    expect(
      styles(backdrop, ["position", "display", "z-index", "opacity", "visibility", "color"]),
    ).toEqual({
      position: "fixed",
      display: "flex",
      "z-index": "1300",
      opacity: "1",
      visibility: "visible",
      color: "rgb(255, 255, 255)",
    });
    expect(css(backdrop).backgroundColor).not.toMatch(/^rgba\(0, 0, 0, 0\)$|transparent/);
    expect(backdrop.getBoundingClientRect()).toMatchObject({
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const progress = screen.getByRole("progressbar", { name: "Loading" });
    const box = progress.getBoundingClientRect();
    expect(Math.abs(box.left + box.width / 2 - window.innerWidth / 2)).toBeLessThan(1);
    expect(Math.abs(box.top + box.height / 2 - window.innerHeight / 2)).toBeLessThan(1);
    // The progress inherits the backdrop's white.
    expect(css(progress).color).toBe("rgb(255, 255, 255)");
    await expectNoAxeViolations();
  });

  it("fades: in over the short duration, out over the shorter one", () => {
    const { rerender } = render(<Backdrop open />);
    expect(css(root()).transitionDuration).toBe("0.25s, 0s");
    rerender(<Backdrop open={false} />);
    expect(css(root()).transitionDuration).toBe("0.2s, 0s");
    expect(css(root()).transitionDelay).toBe("0s, 0.2s");
  });

  it("invisible: transparent, still catches clicks; invalid values are ignored", async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Backdrop open invisible onClick={onClick} />);
    expect(root().hasAttribute("data-ok-invisible")).toBe(true);
    await settled(root());
    expect(css(root()).backgroundColor).toMatch(/^rgba\(0, 0, 0, 0\)$|transparent/);
    fireEvent.click(root());
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Backdrop open invisible={HOSTILE} />);
    expect(root().hasAttribute("data-ok-invisible")).toBe(false);
  });

  it("the demo: a trigger opens it, a click anywhere closes it, focus stays on the trigger", async () => {
    const onClick = vi.fn();
    render(
      <StrictMode>
        <Demo onClick={onClick} />
      </StrictMode>,
    );
    const trigger = screen.getByRole("button", { name: "Show backdrop" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(root().hasAttribute("data-ok-open")).toBe(true);
    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeTruthy();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(screen.getByRole("progressbar"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(root().hasAttribute("data-ok-open")).toBe(false);
    await settled(root());
    expect(css(root()).visibility).toBe("hidden");
    expect(document.activeElement).toBe(trigger);
  });

  it("passes ref, className, style and DOM props to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Backdrop open ref={ref} id="b" className="mine" style={{ zIndex: 5 }} aria-busy="true" />,
    );
    expect(ref.current).toBe(root());
    expect(root()).toMatchObject({ id: "b", className: "mine" });
    expect(root().getAttribute("aria-busy")).toBe("true");
    expect(css(root()).zIndex).toBe("5");
  });

  it("server render matches the client markup", () => {
    const element = (
      <Backdrop open invisible>
        <span>Saving</span>
      </Backdrop>
    );
    const html = renderToString(element);
    const { container } = render(element);
    expect(html).toBe(container.innerHTML);
    expect(renderToString(<Backdrop open={false} />)).toBe(
      '<div data-ok-backdrop="" data-ok-runtime="off"></div>',
    );
  });

  it("transitionDuration sets both fades; style still merges", () => {
    render(
      <Backdrop open transitionDuration={40} style={{ color: "red" }} data-testid="b">
        x
      </Backdrop>,
    );
    const backdrop = screen.getByTestId("b");
    expect(backdrop.dataset["okTransitionDuration"]).toBe("40");
    expect(backdrop.style.color).toBe("red");
    expect(getComputedStyle(backdrop).transitionDuration).toMatch(/^0\.04s/);
  });
});
