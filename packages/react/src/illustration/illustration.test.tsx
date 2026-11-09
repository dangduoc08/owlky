import { type Illustration as IllustrationData, illustrationColors } from "@owlky/core";
import { error404, illustrations, signIn, upload } from "@owlky/core/illustrations";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Illustration } from "./illustration.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const svgOf = (container: Element) =>
  container.querySelector("svg[data-ok-illustration]") as SVGSVGElement;
const css = (element: Element) => getComputedStyle(element);

describe("Illustration", () => {
  it("renders a decorative, primary, 480px picture by default", () => {
    // The test page is 414px wide: give the default width room.
    const { container } = render(
      <div style={{ width: 600 }}>
        <Illustration illustration={error404} />
      </div>,
    );
    const svg = svgOf(container);
    expect(svg.dataset).toMatchObject({
      okIllustration: "error-404",
      okColor: "primary",
      okRuntime: "off",
    });
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.hasAttribute("role")).toBe(false);
    expect(svg.hasAttribute("data-ok-size")).toBe(false);
    expect(svg.getAttribute("viewBox")).toBe("0 0 480 360");
    expect(css(svg).width).toBe("480px");
    expect(css(svg).height).toBe("360px");
    expect(css(svg).display).toBe("block");
  });

  it.each(illustrations.map((item) => [item.name, item] as const))(
    "%s: renders every node with its tone",
    (_, item) => {
      const { container } = render(<Illustration illustration={item} />);
      const svg = svgOf(container);
      const shapes = svg.querySelectorAll(":not(g)");
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) {
        expect(shape.getAttribute("data-ok-tone")).not.toBeNull();
        expect(css(shape).fill === "none" ? css(shape).stroke : css(shape).fill).toMatch(
          /^(rgba?\(|color\()/,
        );
      }
      expect(svg.querySelectorAll("[style], [href], script, foreignObject")).toHaveLength(0);
    },
  );

  it("names the picture with title (role img) or aria-label", () => {
    render(
      <>
        <Illustration illustration={signIn} title="Sign in to continue" />
        <Illustration illustration={error404} aria-label="Page not found" />
        <span id="caption">Upload files</span>
        <Illustration illustration={upload} aria-labelledby="caption" />
      </>,
    );
    const titled = screen.getByRole("img", { name: "Sign in to continue" });
    expect(titled.querySelector(":scope > title")?.textContent).toBe("Sign in to continue");
    expect(titled.hasAttribute("aria-hidden")).toBe(false);
    expect(screen.getByRole("img", { name: "Page not found" }).hasAttribute("aria-hidden")).toBe(
      false,
    );
    expect(screen.getByRole("img", { name: "Upload files" })).toBeDefined();
  });

  it.each(illustrationColors)("color %s paints the brand tones", (color) => {
    const { container } = render(
      <div>
        <Illustration illustration={error404} color={color} />
        <span style={{ color: `var(--ok-palette-${color}-main)` }}>probe</span>
      </div>,
    );
    const svg = svgOf(container);
    expect(svg.dataset["okColor"]).toBe(color);
    const main = svg.querySelector('[data-ok-tone="main"]:not([data-ok-stroke])') as Element;
    expect(css(main).fill).toBe(css(container.querySelector("span") as Element).color);
  });

  it("sizes the width (number or CSS length); the height follows the canvas", () => {
    const { container, rerender } = render(<Illustration illustration={error404} size={240} />);
    const svg = svgOf(container);
    expect(svg.dataset["okSize"]).toBe("240");
    expect(css(svg).width).toBe("240px");
    expect(css(svg).height).toBe("180px");
    rerender(<Illustration illustration={error404} size="10rem" />);
    expect(css(svg).width).toBe("160px");
  });

  it("never grows past its container", () => {
    const { container } = render(
      <div style={{ width: 200 }}>
        <Illustration illustration={error404} />
      </div>,
    );
    expect(css(svgOf(container)).width).toBe("200px");
  });

  it("falls back to defaults for invalid options", () => {
    const { container } = render(
      <div style={{ width: 600 }}>
        <Illustration illustration={error404} color={HOSTILE} size={HOSTILE} />
      </div>,
    );
    const svg = svgOf(container);
    expect(svg.dataset["okColor"]).toBe("primary");
    expect(svg.hasAttribute("data-ok-size")).toBe(false);
    expect(svg.style.getPropertyValue("--_ok-illustration-size")).toBe("");
    expect(css(svg).width).toBe("480px");
  });

  it("drops unsafe nodes and attributes of custom data", () => {
    const custom = {
      name: "custom",
      viewBox: "0 0 10 10",
      nodes: [
        { tag: "script", attrs: { d: "x" } },
        { tag: "path", tone: "main", attrs: { d: "M0 0h10", href: "javascript:alert(1)" } },
        { tag: "foreignObject", children: [] },
      ],
    } as unknown as IllustrationData;
    const { container } = render(<Illustration illustration={custom} />);
    const svg = svgOf(container);
    expect(svg.children).toHaveLength(1);
    expect(svg.querySelector("path")?.hasAttribute("href")).toBe(false);
  });

  it("passes the ref, class name and style through", () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(
      <Illustration
        ref={ref}
        illustration={upload}
        className="art"
        style={{ marginTop: 8 }}
        size={100}
      />,
    );
    const svg = svgOf(container);
    expect(ref.current).toBe(svg);
    expect(svg.getAttribute("class")).toBe("art");
    expect(svg.style.marginTop).toBe("8px");
    expect(svg.style.getPropertyValue("--_ok-illustration-size")).toBe("100px");
  });

  it("renders on the server without inline event handlers", () => {
    const html = renderToStaticMarkup(<Illustration illustration={error404} />);
    expect(html).toContain('data-ok-illustration="error-404"');
    expect(html).not.toMatch(/\son[a-z]+=|javascript:|<script/i);
  });

  it.each(["light", "dark"] as const)("has no axe violations (%s)", async (theme) => {
    const { container } = render(
      <div data-ok-theme={theme}>
        <Illustration illustration={error404} />
        <Illustration illustration={signIn} title="Sign in" />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
