import { selectionControlColors, selectionControlSizes } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { FormControlLabel } from "../form-control-label/form-control-label.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Switch } from "./switch.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const rootOf = (input: Element) => input.closest("[data-ok-switch]") as HTMLElement;
const part = (root: Element, name: "track" | "thumb") =>
  root.querySelector(`[data-ok-switch-${name}]`) as HTMLElement;
const probeColor = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const color = css(probe).color;
  probe.remove();
  return color;
};

describe("Switch", () => {
  it("renders a native checkbox with role switch, a 34 × 20 track and a 14px thumb", () => {
    render(<Switch aria-label="Wi-Fi" />);
    const input = screen.getByRole("switch", { name: "Wi-Fi" }) as HTMLInputElement;
    expect(input.type).toBe("checkbox");
    const root = rootOf(input);
    expect(root.dataset).toMatchObject({ okSwitch: "", okColor: "primary", okSize: "medium" });
    expect(root.getBoundingClientRect()).toMatchObject({ width: 58, height: 38 });
    const track = part(root, "track");
    expect(track.getBoundingClientRect()).toMatchObject({ width: 34, height: 20 });
    expect(css(part(root, "thumb")).width).toBe("14px");
    expect(track.getAttribute("aria-hidden")).toBe("true");
    expect(css(track).backgroundColor).toMatch(/145, 158, 171|0\.5686/);
  });

  it("toggles on click and Space; the thumb slides and the track fills", async () => {
    const onChange = vi.fn();
    render(<Switch aria-label="a" onChange={onChange} />);
    const input = screen.getByRole("switch") as HTMLInputElement;
    const root = rootOf(input);
    const thumb = part(root, "thumb");
    const before = thumb.getBoundingClientRect().left;
    await userEvent.click(input);
    expect(onChange).toHaveBeenLastCalledWith(true);
    await settled(thumb);
    expect(thumb.getBoundingClientRect().left - before).toBeCloseTo(14, 0);
    expect(css(part(root, "track")).backgroundColor).toBe(
      probeColor("var(--ok-palette-primary-main)"),
    );
    input.focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("works without onChange", async () => {
    render(<Switch aria-label="a" />);
    const input = screen.getByRole("switch") as HTMLInputElement;
    await userEvent.click(input);
    expect(input.checked).toBe(true);
  });

  it("controlled refusal keeps the state", async () => {
    const onChange = vi.fn();
    render(<Switch aria-label="a" checked={false} onChange={onChange} />);
    const input = screen.getByRole("switch") as HTMLInputElement;
    await userEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(input.checked).toBe(false);
  });

  it.each(selectionControlColors)("color %s fills the track when on", (color) => {
    render(<Switch color={color} aria-label="a" defaultChecked />);
    const root = rootOf(screen.getByRole("switch"));
    expect(css(part(root, "track")).backgroundColor).toBe(
      probeColor(
        color === "default" ? "var(--ok-text-primary)" : `var(--ok-palette-${color}-main)`,
      ),
    );
  });

  it.each(selectionControlSizes)("size %s", (size) => {
    render(<Switch size={size} aria-label="a" />);
    const root = rootOf(screen.getByRole("switch"));
    const track = part(root, "track").getBoundingClientRect();
    expect([track.width, track.height]).toEqual(size === "small" ? [26, 16] : [34, 20]);
    expect(root.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  });

  it("edge pulls the switch out; disabled fades the track and refuses clicks", async () => {
    const onChange = vi.fn();
    render(
      <>
        <Switch aria-label="start" edge="start" />
        <Switch aria-label="end" edge="end" />
        <Switch aria-label="off" disabled onChange={onChange} />
      </>,
    );
    expect(css(rootOf(screen.getByRole("switch", { name: "start" }))).marginLeft).toBe("-8px");
    expect(css(rootOf(screen.getByRole("switch", { name: "end" }))).marginRight).toBe("-8px");
    const off = screen.getByRole("switch", { name: "off" });
    await userEvent.click(off, { force: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(css(part(rootOf(off), "track")).opacity).toBe("0.48");
  });

  it("hover shows a halo; focus-visible a ring around the track", async () => {
    render(<Switch aria-label="a" />);
    const input = screen.getByRole("switch");
    const root = rootOf(input);
    await userEvent.hover(input);
    await settled(part(root, "thumb"));
    expect(css(part(root, "thumb")).boxShadow).toContain("9px");
    await userEvent.unhover(input);
    await userEvent.keyboard("{Tab}");
    if (document.activeElement === input)
      expect(css(part(root, "track")).outlineStyle).toBe("solid");
  });

  it("invalid options fall back; ref, props and className reach the right element", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Switch
        ref={ref}
        color={HOSTILE}
        size={HOSTILE}
        edge={HOSTILE}
        name="wifi"
        className="extra"
        aria-label="a"
      />,
    );
    const input = screen.getByRole("switch") as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect(input.name).toBe("wifi");
    const root = rootOf(input);
    expect(root.className).toBe("extra");
    expect(root.dataset).toMatchObject({ okColor: "primary", okSize: "medium" });
    expect(root.hasAttribute("data-ok-edge")).toBe(false);
  });

  it("renders on the server with the same markup", () => {
    const element = <Switch aria-label="a" defaultChecked size="small" edge="end" />;
    const html = renderToString(element);
    expect(html).toContain('role="switch"');
    expect(html).toContain('data-ok-edge="end"');
    const { container } = render(element);
    // Same DOM (serialization differs: attribute order, void tags).
    const server = document.createElement("div");
    server.innerHTML = html;
    expect(container.firstElementChild?.isEqualNode(server.firstElementChild)).toBe(true);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Switch aria-label="One" />
        <Switch aria-label="Two" defaultChecked color="default" />
        <FormControlLabel label="Three" control={<Switch disabled />} />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
