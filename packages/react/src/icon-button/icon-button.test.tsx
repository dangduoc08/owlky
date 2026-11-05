import { iconButtonColors, iconButtonSizes } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { IconButton } from "./icon-button.js";

const Icon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 12h16" />
  </svg>
);

const css = (element: Element) => getComputedStyle(element);

describe("IconButton", () => {
  it("renders a named native button with explicit defaults", () => {
    render(
      <IconButton aria-label="Settings">
        <Icon />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Settings" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset).toMatchObject({ okIconButton: "", okColor: "default", okSize: "md" });
    expect(button.hasAttribute("data-ok-animate")).toBe(false);
  });

  it.each(iconButtonColors)("color %s", (color) => {
    render(<IconButton aria-label="x" color={color} />);
    expect(screen.getByRole("button").dataset["okColor"]).toBe(color);
  });

  it.each([
    ["sm", 28, 18],
    ["md", 36, 20],
    ["lg", 48, 24],
  ] as const)("size %s is %ipx with a %ipx icon", (size, box, icon) => {
    expect(iconButtonSizes).toContain(size);
    render(
      <IconButton aria-label="x" size={size}>
        <Icon />
      </IconButton>,
    );
    const button = screen.getByRole("button");
    expect(button.getBoundingClientRect().height).toBe(box);
    expect(button.getBoundingClientRect().width).toBe(box);
    expect((button.querySelector("svg") as SVGElement).getBoundingClientRect().width).toBe(icon);
  });

  it("falls back to defaults for invalid values and forwards props and refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton
        ref={ref}
        aria-label="x"
        color={"__proto__" as never}
        size={"huge" as never}
        type="submit"
        className="custom"
        animate
      />,
    );
    const button = screen.getByRole("button");
    expect(button.dataset).toMatchObject({ okColor: "default", okSize: "md", okAnimate: "" });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.className).toBe("custom");
    expect(ref.current).toBe(button);
  });

  it("uses secondary text for default, text color for inherit and main for palette colors", () => {
    render(
      <>
        <IconButton aria-label="default" />
        <IconButton aria-label="inherit" color="inherit" />
        <IconButton aria-label="primary" color="primary" />
      </>,
    );
    expect(css(screen.getByRole("button", { name: "default" })).color).toBe("rgb(99, 115, 129)");
    expect(css(screen.getByRole("button", { name: "inherit" })).color).toBe("rgb(28, 37, 46)");
    expect(css(screen.getByRole("button", { name: "primary" })).color).toBe("rgb(0, 167, 111)");
  });

  it("tints the background on hover and scales when animated", async () => {
    render(<IconButton aria-label="x" color="primary" animate />);
    const button = screen.getByRole("button");
    await userEvent.hover(button);
    await settled(button);
    expect(css(button).backgroundColor).toBe("rgba(0, 167, 111, 0.08)");
    expect(css(button).transform).not.toBe("none");
  });

  it("activates natively and not when disabled", async () => {
    const onClick = vi.fn();
    render(
      <>
        <IconButton aria-label="on" onClick={onClick} />
        <IconButton aria-label="off" onClick={onClick} disabled />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "on" }));
    await userEvent.click(screen.getByRole("button", { name: "off" }), { force: true });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(css(screen.getByRole("button", { name: "off" })).color).toMatch(
      /^(rgba\(145, 158, 171|color\(srgb 0\.5686)/,
    );
  });

  it("edge pulls the button out by its padding; loading replaces the icon and disables", () => {
    render(
      <>
        <IconButton aria-label="start" edge="start">
          <Icon />
        </IconButton>
        <IconButton aria-label="end" edge="end" size="sm" />
        <IconButton aria-label="busy" loading>
          <Icon />
        </IconButton>
        <IconButton aria-label="text" loading loadingIndicator="…" />
      </>,
    );
    const start = screen.getByRole("button", { name: "start" });
    expect(start.dataset["okEdge"]).toBe("start");
    expect(css(start).marginLeft).toBe("-8px");
    expect(css(screen.getByRole("button", { name: "end" })).marginRight).toBe("-5px");
    expect(start.hasAttribute("aria-busy")).toBe(false);
    const busy = screen.getByRole("button", { name: "busy" }) as HTMLButtonElement;
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute("aria-busy")).toBe("true");
    expect(
      busy.querySelector("[data-ok-icon-button-loader] [data-ok-button-spinner]"),
    ).not.toBeNull();
    expect(css(busy.querySelector("svg") as Element).visibility).toBe("hidden");
    expect(screen.getByRole("button", { name: "text" }).textContent).toBe("…");
  });

  it("renders the same markup on the server and has no axe violations", async () => {
    const element = (
      <IconButton aria-label="Mail" color="error" size="lg" animate>
        <Icon />
      </IconButton>
    );
    const server = document.createElement("div");
    server.innerHTML = renderToString(element);
    const { container } = render(element);
    expect(server.firstElementChild?.outerHTML).toBe(container.firstElementChild?.outerHTML);
    await expectNoAxeViolations();
  });
});
