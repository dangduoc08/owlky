import { fabColors, fabVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Fab } from "./fab.js";

const Icon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 12h16" />
  </svg>
);

const css = (element: Element) => getComputedStyle(element);

describe("Fab", () => {
  it("renders a native button with explicit defaults", () => {
    render(
      <Fab aria-label="Add">
        <Icon />
      </Fab>,
    );
    const fab = screen.getByRole("button", { name: "Add" });
    expect(fab.getAttribute("type")).toBe("button");
    expect(fab.dataset).toMatchObject({
      okFab: "",
      okVariant: "contained",
      okColor: "default",
      okSize: "md",
    });
  });

  it.each(fabVariants)("variant %s", (variant) => {
    render(<Fab aria-label="x" variant={variant} />);
    expect(screen.getByRole("button").dataset["okVariant"]).toBe(variant);
  });

  it.each(fabColors)("color %s", (color) => {
    render(<Fab aria-label="x" color={color} />);
    expect(screen.getByRole("button").dataset["okColor"]).toBe(color);
  });

  it.each([
    ["sm", false, 40],
    ["md", false, 48],
    ["lg", false, 56],
    ["sm", true, 36],
    ["md", true, 40],
    ["lg", true, 48],
  ] as const)("size %s (extended %s) is %ipx tall", (size, extended, height) => {
    render(
      <Fab size={size} extended={extended} aria-label="x">
        <Icon />
        {extended ? "Label" : null}
      </Fab>,
    );
    const fab = screen.getByRole("button");
    expect(fab.getBoundingClientRect().height).toBe(height);
    if (!extended) expect(fab.getBoundingClientRect().width).toBe(height);
    else expect(fab.getBoundingClientRect().width).toBeGreaterThan(height);
  });

  it("falls back to defaults for invalid values and forwards props and refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Fab
        ref={ref}
        aria-label="x"
        variant={"<b>" as never}
        color={"__proto__" as never}
        size={"huge" as never}
        extended
        animate
        title="t"
      />,
    );
    const fab = screen.getByRole("button");
    expect(fab.dataset).toMatchObject({
      okVariant: "contained",
      okColor: "default",
      okSize: "md",
      okExtended: "",
      okAnimate: "",
    });
    expect(fab.title).toBe("t");
    expect(ref.current).toBe(fab);
  });

  it("applies the reference colors per variant", () => {
    render(
      <>
        <Fab aria-label="default" />
        <Fab aria-label="inherit" color="inherit" />
        <Fab aria-label="primary" color="primary" />
        <Fab aria-label="outlined" variant="outlined" color="primary" />
        <Fab aria-label="soft" variant="soft" color="primary" />
      </>,
    );
    const get = (name: string) => css(screen.getByRole("button", { name }));
    expect(get("default").backgroundColor).toBe("rgb(223, 227, 232)");
    expect(get("default").color).toBe("rgb(28, 37, 46)");
    expect(get("inherit").backgroundColor).toBe("rgb(28, 37, 46)");
    expect(get("inherit").color).toBe("rgb(255, 255, 255)");
    expect(get("primary").backgroundColor).toBe("rgb(0, 167, 111)");
    expect(get("primary").color).toBe("rgb(255, 255, 255)");
    expect(get("primary").boxShadow).toMatch(/8px 16px/);
    expect(get("outlined").borderTopColor).toBe("rgba(0, 167, 111, 0.48)");
    expect(get("outlined").boxShadow).toBe("none");
    expect(get("soft").backgroundColor).toBe("rgba(0, 167, 111, 0.16)");
  });

  it("darkens and drops the shadow on hover", async () => {
    render(<Fab aria-label="x" color="primary" />);
    const fab = screen.getByRole("button");
    await userEvent.hover(fab);
    await vi.waitFor(() => {
      expect(css(fab).backgroundColor).toBe("rgb(0, 120, 103)");
      expect(css(fab).boxShadow).toBe("none");
    });
  });

  it("disabled: no activation, no shadow", async () => {
    const onClick = vi.fn();
    render(<Fab aria-label="x" color="primary" disabled onClick={onClick} />);
    const fab = screen.getByRole("button");
    await userEvent.click(fab, { force: true });
    expect(onClick).not.toHaveBeenCalled();
    expect(css(fab).boxShadow).toBe("none");
    expect(css(fab).backgroundColor).toMatch(/^(rgba\(145, 158, 171|color\(srgb 0\.5686)/);
  });

  it("renders a link with href, and an inert link when disabled", () => {
    const ref = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <>
        <Fab ref={ref} href="/new" aria-label="New">
          <Icon />
        </Fab>
        <Fab href="/new" disabled aria-label="Off" />
      </>,
    );
    const link = screen.getByRole("link", { name: "New" });
    expect(ref.current).toBe(link);
    expect(link.getAttribute("href")).toBe("/new");
    expect(css(link).textDecorationLine).toBe("none");
    const off = screen.getByRole("link", { name: "Off" });
    expect(off.hasAttribute("href")).toBe(false);
    expect(off.getAttribute("aria-disabled")).toBe("true");
    expect(css(off).boxShadow).toBe("none");
  });

  it("renders the same markup on the server and has no axe violations", async () => {
    const element = (
      <div>
        <Fab color="success" extended>
          <Icon />
          Navigate
        </Fab>
        {fabVariants.map((variant) => (
          <Fab key={variant} variant={variant} color="info" aria-label={variant}>
            <Icon />
          </Fab>
        ))}
      </div>
    );
    const server = document.createElement("div");
    server.innerHTML = renderToString(element);
    const { container } = render(element);
    expect(server.firstElementChild?.outerHTML).toBe(container.firstElementChild?.outerHTML);
    await expectNoAxeViolations();
  });
});
