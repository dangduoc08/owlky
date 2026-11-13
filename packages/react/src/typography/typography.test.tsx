import {
  typographyAligns,
  typographyColors,
  typographyVariantMapping,
  typographyVariantNames,
} from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Typography } from "./typography.js";

const typographyVariants = typographyVariantNames.filter((name) => name !== "inherit");
const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

/** The computed value of `property` set to `value` on a probe inside `parent`. */
function resolve(
  property: "fontSize" | "fontWeight" | "color",
  value: string,
  parent = document.body,
) {
  const probe = document.createElement("span");
  probe.style[property] = value;
  parent.append(probe);
  const resolved = css(probe)[property];
  probe.remove();
  return resolved;
}

function Custom(props: object) {
  return <strong data-custom="" {...props} />;
}

describe("Typography", () => {
  it("renders a body1 paragraph without margins by default", () => {
    render(<Typography>Text</Typography>);
    const root = screen.getByText("Text");
    expect(root.localName).toBe("p");
    expect({ ...root.dataset }).toEqual({ okTypography: "", okVariant: "body1" });
    expect(css(root).margin).toBe("0px");
    expect(css(root).fontSize).toBe("16px");
    expect(css(root).lineHeight).toBe("24px");
  });

  it.each(typographyVariants)("variant %s: its element and the type scale tokens", (variant) => {
    render(<Typography variant={variant}>Text</Typography>);
    const root = screen.getByText("Text");
    expect(root.localName).toBe(typographyVariantMapping[variant]);
    expect(root.dataset["okVariant"]).toBe(variant);
    const style = css(root);
    expect(style.fontSize).toBe(resolve("fontSize", `var(--ok-typography-${variant}-font-size)`));
    expect(style.fontWeight).toBe(
      resolve("fontWeight", `var(--ok-typography-${variant}-font-weight)`),
    );
    expect(style.textTransform).toBe(variant === "overline" ? "uppercase" : "none");
    // Soft (the default style) uses Nunito for headings and text alike.
    expect(style.fontFamily).toMatch(/Nunito/);
  });

  it("variant inherit takes the parent's font", () => {
    render(
      <div style={{ font: "italic 700 30px/40px serif", textTransform: "uppercase" }}>
        <Typography variant="inherit">Text</Typography>
      </div>,
    );
    const style = css(screen.getByText("Text"));
    expect(style).toMatchObject({
      fontSize: "30px",
      lineHeight: "40px",
      fontWeight: "700",
      fontStyle: "italic",
      textTransform: "uppercase",
    });
    expect(screen.getByText("Text").localName).toBe("p");
  });

  it.each(typographyColors)("color %s", (color) => {
    render(<Typography color={color}>Text</Typography>);
    const root = screen.getByText("Text");
    const token = color.startsWith("text")
      ? `--ok-text-${color.slice(4).toLowerCase()}`
      : `--ok-palette-${color}-text`;
    expect(css(root).color).toBe(resolve("color", `var(${token})`));
  });

  it("without color, the text keeps the parent's color", () => {
    render(
      <div style={{ color: "rgb(1, 2, 3)" }}>
        <Typography variant="h4">Text</Typography>
      </div>,
    );
    expect(css(screen.getByText("Text")).color).toBe("rgb(1, 2, 3)");
  });

  it.each(typographyAligns)("align %s", (align) => {
    render(
      <div style={{ textAlign: "right" }}>
        <Typography align={align}>Text</Typography>
      </div>,
    );
    expect(css(screen.getByText("Text")).textAlign).toBe(align === "inherit" ? "right" : align);
  });

  it("gutterBottom adds 0.35em below; noWrap truncates with an ellipsis", () => {
    render(
      <div style={{ width: 80 }}>
        <Typography variant="h4" gutterBottom>
          Gutter
        </Typography>
        <Typography noWrap>A sentence far too long for eighty pixels</Typography>
      </div>,
    );
    const gutter = screen.getByText("Gutter");
    expect(Number.parseFloat(css(gutter).marginBottom)).toBeCloseTo(
      Number.parseFloat(css(gutter).fontSize) * 0.35,
      1,
    );
    const line = screen.getByText(/A sentence/);
    expect(css(line)).toMatchObject({
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    expect(line.scrollWidth).toBeGreaterThan(line.clientWidth);
    expect(line.getBoundingClientRect().height).toBe(24);
  });

  it.each([1, 2, 3, 4, 10])("maxLines %i clamps the text to that many lines", (lines) => {
    const text = "A sentence far too long for eighty pixels, ".repeat(8);
    render(
      <div style={{ width: 80 }}>
        <Typography maxLines={lines}>{text}</Typography>
      </div>,
    );
    const root = screen.getByText(text.trim());
    expect(root.dataset["okMaxLines"]).toBe(String(lines));
    expect(css(root)).toMatchObject({ overflow: "hidden", webkitLineClamp: String(lines) });
    // body1: a 24px line height.
    expect(root.getBoundingClientRect().height).toBe(24 * lines);
    expect(root.scrollHeight).toBeGreaterThan(root.clientHeight);
  });

  it("persistent keeps the height of maxLines lines for short text; without maxLines it does nothing", () => {
    render(
      <div style={{ width: 200 }}>
        <Typography variant="h6" maxLines={3} persistent>
          Short
        </Typography>
        <Typography maxLines="2">Short too</Typography>
        <Typography persistent>No clamp</Typography>
      </div>,
    );
    const persistent = screen.getByText("Short");
    expect(persistent.getBoundingClientRect().height).toBeCloseTo(
      Number.parseFloat(css(persistent).lineHeight) * 3,
      0,
    );
    expect(screen.getByText("Short too").getBoundingClientRect().height).toBe(24);
    const plain = screen.getByText("No clamp");
    expect(css(plain).webkitLineClamp).toBe("none");
    expect(plain.getBoundingClientRect().height).toBe(24);
  });

  it("component and variantMapping pick the element; props and ref reach it", () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <Typography ref={ref} variant="h1" component="h2" id="title">
          Component
        </Typography>
        <Typography variant="h1" variantMapping={{ h1: "h3", body1: "div" }}>
          Mapped
        </Typography>
        <Typography variantMapping={{ body1: "div" }}>Body</Typography>
        <Typography component="label" htmlFor="title" variant="caption">
          Label
        </Typography>
        <Typography component={Custom}>Custom</Typography>
      </>,
    );
    expect(ref.current).toBe(screen.getByText("Component"));
    expect(ref.current?.localName).toBe("h2");
    expect(ref.current?.id).toBe("title");
    expect(screen.getByRole("heading", { level: 2 }).dataset["okVariant"]).toBe("h1");
    expect(screen.getByText("Mapped").localName).toBe("h3");
    expect(screen.getByText("Body").localName).toBe("div");
    expect(screen.getByText("Label").getAttribute("for")).toBe("title");
    expect(screen.getByText("Custom").localName).toBe("strong");
    expect(screen.getByText("Custom").dataset).toMatchObject({ custom: "", okVariant: "body1" });
  });

  it("refuses invalid values", () => {
    render(
      <Typography
        variant={HOSTILE}
        color={HOSTILE}
        align={HOSTILE}
        noWrap={HOSTILE}
        maxLines={HOSTILE}
        persistent={HOSTILE}
      >
        Text
      </Typography>,
    );
    const root = screen.getByText("Text");
    expect(root.localName).toBe("p");
    expect({ ...root.dataset }).toEqual({ okTypography: "", okVariant: "body1" });
  });

  it("renders on the server like on the client, in StrictMode", () => {
    for (const variant of typographyVariantNames) {
      const markup = renderToString(<Typography variant={variant}>x</Typography>);
      const tag = typographyVariantMapping[variant];
      expect(markup).toBe(`<${tag} data-ok-typography="" data-ok-variant="${variant}">x</${tag}>`);
    }
    const { container } = render(
      <StrictMode>
        <Typography color="primary" align="center" gutterBottom>
          x
        </Typography>
      </StrictMode>,
    );
    expect(container.innerHTML).toBe(
      renderToString(
        <Typography color="primary" align="center" gutterBottom>
          x
        </Typography>,
      ),
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        {typographyVariantNames.map((variant) => (
          <Typography key={variant} variant={variant}>
            {variant}
          </Typography>
        ))}
        {typographyColors.map((color) => (
          <Typography key={color} color={color}>
            {color}
          </Typography>
        ))}
        <Typography maxLines={2} persistent>
          Two lines at most
        </Typography>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
