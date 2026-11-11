import { linkColors, linkUnderlines, typographyVariantNames } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { type ComponentProps, createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Link } from "./link.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

/** The computed value of `property` set to `value` on a probe. */
function resolve(property: "fontSize" | "color" | "textDecorationColor", value: string) {
  const probe = document.createElement("span");
  probe.style[property] = value;
  document.body.append(probe);
  const resolved = css(probe)[property];
  probe.remove();
  return resolved;
}

function RouterLink({ to, ...props }: { to: string } & ComponentProps<"a">) {
  return <a data-router="" href={`/app${to}`} {...props} />;
}

describe("Link", () => {
  it("renders a primary, underlined link in the parent's font by default", () => {
    render(
      <p style={{ fontSize: 30, lineHeight: "40px" }}>
        Read the <Link href="#guide">guide</Link>
      </p>,
    );
    const link = screen.getByRole("link", { name: "guide" });
    expect(link.localName).toBe("a");
    expect(link.getAttribute("href")).toBe("#guide");
    expect(link.hasAttribute("rel")).toBe(false);
    expect({ ...link.dataset }).toEqual({
      okTypography: "",
      okLink: "",
      okVariant: "inherit",
      okColor: "primary",
      okUnderline: "always",
    });
    const style = css(link);
    expect(style.margin).toBe("0px");
    expect(style.fontSize).toBe("30px");
    expect(style.lineHeight).toBe("40px");
    expect(style.color).toBe(resolve("color", "var(--ok-palette-primary-main)"));
    expect(style.textDecorationLine).toBe("underline");
    expect(style.textDecorationColor).toBe(
      resolve("textDecorationColor", "rgb(var(--ok-palette-primary-main-channel) / 0.4)"),
    );
    expect(style.cursor).toBe("pointer");
  });

  it("passes href through untouched", () => {
    render(
      <>
        <Link href="https://example.com/a?b=1&c=2#d">Absolute</Link>
        <Link href="">Empty</Link>
      </>,
    );
    expect(screen.getByText("Absolute").getAttribute("href")).toBe(
      "https://example.com/a?b=1&c=2#d",
    );
    expect(screen.getByText("Empty").localName).toBe("a");
    expect(screen.getByText("Empty").getAttribute("href")).toBe("");
  });

  it.each(typographyVariantNames)("variant %s uses the type scale", (variant) => {
    render(
      <Link href="#x" variant={variant}>
        Text
      </Link>,
    );
    const link = screen.getByText("Text");
    expect(link.localName).toBe("a");
    expect(link.dataset["okVariant"]).toBe(variant);
    if (variant !== "inherit")
      expect(css(link).fontSize).toBe(
        resolve("fontSize", `var(--ok-typography-${variant}-font-size)`),
      );
  });

  it.each(linkColors)("color %s", (color) => {
    render(
      <div style={{ color: "rgb(1, 2, 3)" }}>
        <Link href="#x" color={color}>
          Text
        </Link>
      </div>,
    );
    const link = screen.getByText("Text");
    const expected =
      color === "inherit"
        ? "rgb(1, 2, 3)"
        : resolve(
            "color",
            color.startsWith("text")
              ? `var(--ok-text-${color.slice(4).toLowerCase()})`
              : `var(--ok-palette-${color}-main)`,
          );
    expect(css(link).color).toBe(expected);
    // Palette colors draw the underline at 40 %; text tones and `inherit` in the text color.
    expect(css(link).textDecorationColor).toBe(
      color.startsWith("text") || color === "inherit"
        ? expected
        : resolve("textDecorationColor", `rgb(var(--ok-palette-${color}-main-channel) / 0.4)`),
    );
  });

  it.each(linkUnderlines)("underline %s, at rest and on hover", async (underline) => {
    render(
      <Link href="#x" underline={underline}>
        Text
      </Link>,
    );
    const link = screen.getByText("Text");
    expect(link.dataset["okUnderline"]).toBe(underline);
    expect(css(link).textDecorationLine).toBe(underline === "always" ? "underline" : "none");
    await userEvent.hover(link);
    expect(css(link).textDecorationLine).toBe(underline === "none" ? "none" : "underline");
    if (underline !== "none") expect(css(link).textDecorationColor).toBe(css(link).color);
    await userEvent.unhover(link);
  });

  it("Typography's align, gutterBottom and noWrap", () => {
    render(
      <div style={{ width: 80 }}>
        <Link href="#x" variant="body2" component="a" align="right" gutterBottom noWrap>
          A link text far too long for eighty pixels
        </Link>
      </div>,
    );
    const link = screen.getByRole("link");
    expect(link.dataset).toMatchObject({ okAlign: "right", okGutterBottom: "", okNoWrap: "" });
    expect(css(link)).toMatchObject({ whiteSpace: "nowrap", textOverflow: "ellipsis" });
  });

  it("maxLines clamps a link like Typography (As link)", async () => {
    const text = "A link text far too long for eighty pixels, ".repeat(6);
    const { container } = render(
      <div style={{ width: 80 }}>
        <Link href="#x" variant="body2" maxLines={3} persistent>
          {text}
        </Link>
      </div>,
    );
    const link = screen.getByRole("link");
    expect(link.dataset).toMatchObject({ okMaxLines: "3", okPersistent: "" });
    expect(css(link).webkitLineClamp).toBe("3");
    expect(link.getBoundingClientRect().height).toBeCloseTo(
      Number.parseFloat(css(link).lineHeight) * 3,
      0,
    );
    await expectNoAxeViolations(container);
  });

  it("without href or component, renders an accessible button", async () => {
    const onClick = vi.fn();
    render(
      <>
        <input aria-label="Before" />
        <Link variant="body2" onClick={onClick}>
          Show more
        </Link>
        <Link type="submit">Send</Link>
      </>,
    );
    const button = screen.getByRole("button", { name: "Show more" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.dataset).toMatchObject({ okLink: "", okVariant: "body2" });
    const style = css(button);
    expect(style).toMatchObject({
      paddingTop: "0px",
      paddingLeft: "0px",
      borderTopStyle: "none",
      backgroundColor: "rgba(0, 0, 0, 0)",
      textDecorationLine: "underline",
      verticalAlign: "middle",
    });
    expect(style.color).toBe(resolve("color", "var(--ok-palette-primary-main)"));
    expect(screen.getByRole("button", { name: "Send" }).getAttribute("type")).toBe("submit");
    screen.getByRole("textbox", { name: "Before" }).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(button);
    expect(css(button).outlineStyle).toBe("solid");
    expect(css(button).outlineWidth).toBe("2px");
    expect(css(button).outlineColor).toBe(resolve("color", "var(--ok-text-primary)"));
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("component renders a router link (or any element); props and ref reach it", () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <Link ref={ref} component={RouterLink} to="/settings" underline="hover">
          Settings
        </Link>
        <Link component="span">Span</Link>
      </>,
    );
    const link = screen.getByRole("link", { name: "Settings" });
    expect(ref.current).toBe(link);
    expect(link.getAttribute("href")).toBe("/app/settings");
    expect(link.dataset).toMatchObject({ router: "", okLink: "", okUnderline: "hover" });
    expect(screen.getByText("Span").localName).toBe("span");
    expect(screen.getByText("Span").hasAttribute("type")).toBe(false);
  });

  it("target _blank always gets noopener noreferrer, keeping the consumer's rel", () => {
    render(
      <>
        <Link href="https://example.com" target="_blank">
          New tab
        </Link>
        <Link href="https://example.com" target="_blank" rel="external noopener">
          External
        </Link>
        <Link href="https://example.com" target="_self" rel="author">
          Same tab
        </Link>
      </>,
    );
    expect(screen.getByText("New tab").getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText("External").getAttribute("rel")).toBe("external noopener noreferrer");
    expect(screen.getByText("Same tab").getAttribute("rel")).toBe("author");
  });

  it("refuses invalid values", () => {
    render(
      <Link
        href="#x"
        variant={HOSTILE}
        color={HOSTILE}
        underline={HOSTILE}
        align={HOSTILE}
        noWrap={HOSTILE}
      >
        Text
      </Link>,
    );
    expect({ ...screen.getByText("Text").dataset }).toEqual({
      okTypography: "",
      okLink: "",
      okVariant: "inherit",
      okColor: "primary",
      okUnderline: "always",
    });
  });

  it("renders on the server like on the client, in StrictMode", () => {
    expect(renderToString(<Link href="#a">A</Link>)).toBe(
      '<a data-ok-typography="" data-ok-variant="inherit" data-ok-link="" data-ok-color="primary" data-ok-underline="always" href="#a">A</a>',
    );
    expect(renderToString(<Link>B</Link>)).toBe(
      '<button data-ok-typography="" data-ok-variant="inherit" data-ok-link="" data-ok-color="primary" data-ok-underline="always" type="button">B</button>',
    );
    const element = (
      <Link href="https://example.com" target="_blank" color="inherit" underline="hover">
        C
      </Link>
    );
    const { container } = render(<StrictMode>{element}</StrictMode>);
    expect(container.innerHTML).toBe(renderToString(element));
  });

  it("has no axe violations (link-in-text-block too)", async () => {
    const { container } = render(
      <div>
        <p>
          {"Read the "}
          <Link href="#a">setup guide</Link>
          {" and the "}
          <Link href="#b" color="inherit">
            release notes
          </Link>
          .
        </p>
        {linkColors.map((color) => (
          <p key={color}>
            <Link href={`#${color}`} color={color}>
              {`Open the ${color} report`}
            </Link>
          </p>
        ))}
        {linkUnderlines.map((underline) => (
          <p key={underline}>
            <Link href={`#${underline}`} underline={underline}>
              {`Underline ${underline}`}
            </Link>
          </p>
        ))}
        <p>
          <Link variant="body2">Show more</Link>
        </p>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
