import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { List, ListItem } from "../list/list.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { Collapse } from "./collapse.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const root = () => document.querySelector("[data-ok-collapse]") as HTMLElement;
/** Ends the running animation and lets its `finished` promise settle the controller. */
async function finish(element: Element = root()) {
  for (const animation of element.getAnimations()) animation.finish();
  await act(settle);
}

function Demo(props: Partial<Parameters<typeof Collapse>[0]>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Details
      </button>
      {/* A long default: a slow runner's click must not outlast the animation the test reads. */}
      <Collapse in={open} timeout={60_000} {...props}>
        <p style={{ margin: 0, height: 120 }}>Shipping takes two days.</p>
      </Collapse>
    </>
  );
}

describe("Collapse", () => {
  it("renders a closed div with hidden by default, owned by React", () => {
    render(
      <Collapse>
        <p>Text</p>
      </Collapse>,
    );
    const element = root();
    expect(element.tagName).toBe("DIV");
    expect(element.hidden).toBe(true);
    expect(element.getAttribute("data-ok-runtime")).toBe("off");
    expect(element.hasAttribute("style")).toBe(false);
    expect(getComputedStyle(element).display).toBe("none");
  });

  it("writes every option as attributes and the collapsed size as private properties", () => {
    render(
      <Collapse
        in
        orientation="horizontal"
        collapsedSize={40}
        timeout={{ enter: 200, exit: 100 }}
        easing="ease-out"
        disablePrefersReducedMotion
        style={{ color: "red" }}
      >
        <p>Text</p>
      </Collapse>,
    );
    const element = root();
    expect(element.hidden).toBe(false);
    expect(element.getAttribute("data-ok-orientation")).toBe("horizontal");
    expect(element.getAttribute("data-ok-collapsed-size")).toBe("40");
    expect(element.getAttribute("data-ok-timeout")).toBe("200");
    expect(element.getAttribute("data-ok-timeout-exit")).toBe("100");
    expect(element.getAttribute("data-ok-easing")).toBe("ease-out");
    expect(element.hasAttribute("data-ok-disable-prefers-reduced-motion")).toBe(true);
    expect(element.style.getPropertyValue("--_ok-collapsed-size")).toBe("40px");
    expect(element.style.getPropertyValue("--_ok-collapse-closed-display")).toBe("flex");
    expect(element.style.color).toBe("red");
    expect(getComputedStyle(element).display).toBe("flex");
  });

  it("invalid values fall back to the defaults (nothing written)", () => {
    render(
      <Collapse in orientation={HOSTILE} collapsedSize={HOSTILE} timeout={HOSTILE} easing={HOSTILE}>
        <p>Text</p>
      </Collapse>,
    );
    const names = [...root().attributes].map((attribute) => attribute.name).sort();
    expect(names).toEqual(["data-ok-collapse", "data-ok-runtime"]);
  });

  it("closed with a collapsed size: a clipped slice of that size", () => {
    render(
      <Collapse collapsedSize="2.5rem">
        <p style={{ margin: 0, height: 120 }}>Text</p>
      </Collapse>,
    );
    expect(root().getBoundingClientRect().height).toBe(40);
    expect(getComputedStyle(root()).overflow).toBe("hidden");
  });

  it("animates the height and reports each phase once", async () => {
    const calls: string[] = [];
    const record = (name: string) => (node: HTMLElement) => {
      expect(node).toBe(root());
      calls.push(name);
    };
    render(
      <Demo
        onEnter={record("enter")}
        onEntering={record("entering")}
        onEntered={record("entered")}
        onExit={record("exit")}
        onExiting={record("exiting")}
        onExited={record("exited")}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    expect(root().getAttribute("data-ok-state")).toBe("entering");
    expect(root().getAnimations()).toHaveLength(1);
    await finish();
    expect(root().getBoundingClientRect().height).toBe(120);
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    expect(root().getAttribute("data-ok-state")).toBe("exiting");
    expect(getComputedStyle(root()).display).toBe("block");
    await finish();
    expect(calls).toEqual(["enter", "entering", "entered", "exit", "exiting", "exited"]);
    expect(getComputedStyle(root()).display).toBe("none");
  });

  it("timeout and easing reach the animation", async () => {
    render(<Demo timeout={{ enter: 250 }} easing={{ enter: "linear" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    const timing = ((root().getAnimations()[0] as Animation).effect as KeyframeEffect).getTiming();
    expect(timing).toMatchObject({ duration: 250, easing: "linear" });
  });

  it("mountOnEnter renders the children once it first opens, then keeps them", async () => {
    render(<Demo mountOnEnter timeout={0} />);
    expect(screen.queryByText("Shipping takes two days.")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByText("Shipping takes two days.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    expect(screen.getByText("Shipping takes two days.")).not.toBeVisible();
  });

  it("unmountOnExit removes the children once it has closed", async () => {
    const onExited = vi.fn();
    render(<Demo unmountOnExit onExited={onExited} />);
    expect(screen.queryByText("Shipping takes two days.")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    await finish();
    expect(screen.getByText("Shipping takes two days.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    // Still there while it animates out.
    expect(screen.getByText("Shipping takes two days.")).toBeInTheDocument();
    await finish();
    expect(screen.queryByText("Shipping takes two days.")).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("component: renders as another element or component, with its props and no wrapper", async () => {
    const ref = createRef<HTMLElement>();
    render(
      <Collapse component={List} ref={ref} in id="folders" disablePadding timeout="auto">
        <ListItem>Starred</ListItem>
      </Collapse>,
    );
    const list = document.getElementById("folders") as HTMLElement;
    expect(ref.current).toBe(list);
    expect(list.tagName).toBe("UL");
    expect(list.hasAttribute("data-ok-list")).toBe(true);
    expect(list.hasAttribute("data-ok-disable-padding")).toBe(true);
    expect(list.getAttribute("data-ok-timeout")).toBe("auto");
    expect(list.firstElementChild?.tagName).toBe("LI");
    render(
      <Collapse component="section" aria-label="More">
        <p>More</p>
      </Collapse>,
    );
    expect(document.querySelector("section[data-ok-collapse]")).not.toBeNull();
  });

  it("forwards callback refs and survives StrictMode", async () => {
    const seen: (HTMLElement | null)[] = [];
    const { unmount } = render(
      <StrictMode>
        <Demo
          ref={(node: HTMLElement | null) => {
            seen.push(node);
          }}
        />
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    expect(root().getAnimations()).toHaveLength(1);
    await finish();
    expect(root().hasAttribute("data-ok-state")).toBe(false);
    expect(seen).toContain(root());
    unmount();
  });

  it("unmounting mid-animation stops it", async () => {
    const { unmount } = render(<Demo />);
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    const element = root();
    unmount();
    expect(element.getAnimations()).toEqual([]);
  });

  it("server rendering matches the client markup", () => {
    const tree = (
      <Collapse in={false} collapsedSize={40} timeout="auto" id="c">
        <p>Text</p>
      </Collapse>
    );
    const html = renderToString(tree);
    expect(html).toContain('hidden=""');
    expect(html).toContain('data-ok-timeout="auto"');
    expect(html).toContain("--_ok-collapsed-size:40px");
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const onRecoverableError = vi.fn();
    let hydrated: ReturnType<typeof hydrateRoot> | undefined;
    act(() => {
      hydrated = hydrateRoot(host, tree, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    act(() => hydrated?.unmount());
    host.remove();
  });

  it("has no axe violations, open and closed", async () => {
    render(<Demo />);
    await expectNoAxeViolations();
    await userEvent.click(screen.getByRole("button", { name: "Details" }));
    await act(settle);
    await finish();
    await expectNoAxeViolations();
  });
});
