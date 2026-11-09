import { paperElevations } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Avatar } from "../avatar/avatar.js";
import { Button } from "../button/button.js";
import { IconButton } from "../icon-button/icon-button.js";
import { Image } from "../image/image.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Card, CardActionArea, CardActions, CardContent, CardHeader, CardMedia } from "./card.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect width='4' height='3' fill='%23888'/%3E%3C/svg%3E";
const css = (element: Element, pseudo?: string) => getComputedStyle(element, pseudo);

/** The computed value of `<property>: <value>` (engines serialize shadows and colors differently). */
function computed(property: "boxShadow" | "backgroundColor", value: string) {
  const probe = document.createElement("div");
  probe.style[property] = value;
  document.body.append(probe);
  const result = css(probe)[property];
  probe.remove();
  return result;
}

describe("Card", () => {
  it("renders a Paper root with the card marker, radius and card shadow", () => {
    render(<Card data-testid="c">Content</Card>);
    const card = screen.getByTestId("c");
    expect(card.localName).toBe("div");
    expect({ ...card.dataset }).toEqual({
      testid: "c",
      okPaper: "",
      okVariant: "elevation",
      okElevation: "1",
      okCard: "",
    });
    const style = css(card);
    expect(style.borderRadius).toBe("16px");
    expect(style.boxShadow).toBe(computed("boxShadow", "var(--ok-shadow-card)"));
    expect(style.overflow).toBe("hidden");
    expect(style.position).toBe("relative");
    expect(style.backgroundColor).toBe("rgb(255, 255, 255)");
  });

  it.each(paperElevations)(
    "elevation %s: the card shadow at 1, Paper's levels otherwise",
    (level) => {
      render(<Card elevation={Number(level)} data-testid="c" />);
      const expected =
        level === "0"
          ? "none"
          : computed(
              "boxShadow",
              level === "1" ? "var(--ok-shadow-card)" : `var(--ok-elevation-${level})`,
            );
      expect(css(screen.getByTestId("c")).boxShadow).toBe(expected);
    },
  );

  it("raised, outlined and square", () => {
    render(
      <>
        <Card raised data-testid="raised" />
        <Card raised elevation={0} data-testid="raised0" />
        <Card raised variant="outlined" data-testid="outlined" />
        <Card square data-testid="square" />
      </>,
    );
    const elevation8 = computed("boxShadow", "var(--ok-elevation-8)");
    expect(screen.getByTestId("raised").dataset["okRaised"]).toBe("");
    expect(css(screen.getByTestId("raised")).boxShadow).toBe(elevation8);
    expect(css(screen.getByTestId("raised0")).boxShadow).toBe(elevation8);
    const outlined = css(screen.getByTestId("outlined"));
    expect(outlined.boxShadow).toBe("none");
    expect(outlined.borderTopStyle).toBe("solid");
    expect(outlined.borderTopWidth).toBe("1px");
    expect(css(screen.getByTestId("square")).borderRadius).toBe("0px");
  });

  it("component, ref, props and invalid values", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card
        ref={ref}
        component="article"
        className="extra"
        aria-label="Story"
        raised={HOSTILE}
        variant={HOSTILE}
      />,
    );
    const card = ref.current as HTMLElement;
    expect(card.localName).toBe("article");
    expect(card.className).toBe("extra");
    expect(card.getAttribute("aria-label")).toBe("Story");
    expect(card.hasAttribute("data-ok-raised")).toBe(false);
    expect(card.dataset["okVariant"]).toBe("elevation");
  });

  it("follows the color scheme", () => {
    render(
      <div data-ok-theme="dark">
        <Card data-testid="c">Dark</Card>
      </div>,
    );
    expect(css(screen.getByTestId("c")).backgroundColor).toBe("rgb(28, 37, 46)");
    expect(css(screen.getByTestId("c")).color).toBe("rgb(255, 255, 255)");
  });
});

describe("CardHeader", () => {
  it("renders avatar, title (h6), subheader (body2, secondary) and action", () => {
    render(
      <Card>
        <CardHeader
          data-testid="h"
          avatar={
            <Avatar role="img" aria-label="Ada">
              A
            </Avatar>
          }
          action={
            <IconButton aria-label="More">
              <svg aria-hidden="true" />
            </IconButton>
          }
          title="Title"
          subheader="Subheader"
        />
      </Card>,
    );
    const header = screen.getByTestId("h");
    expect(header.hasAttribute("data-ok-card-header")).toBe(true);
    expect(
      [...header.children].map((child) => Object.keys((child as HTMLElement).dataset)[0]),
    ).toEqual(["okCardHeaderAvatar", "okCardHeaderContent", "okCardHeaderAction"]);
    const title = screen.getByText("Title");
    const subheader = screen.getByText("Subheader");
    expect(title.localName).toBe("span");
    expect({ ...title.dataset }).toEqual({
      okTypography: "",
      okVariant: "h6",
      okCardHeaderTitle: "",
    });
    expect({ ...subheader.dataset }).toEqual({
      okTypography: "",
      okVariant: "body2",
      okColor: "textSecondary",
      okCardHeaderSubheader: "",
    });
    expect(css(header).display).toBe("flex");
    expect(css(header).padding).toBe("24px 24px 0px");
    expect(css(title).display).toBe("block");
    expect(css(title).fontSize).toBe(computedFont("h6"));
    expect(css(subheader).display).toBe("block");
    expect(css(subheader).marginTop).toBe("4px");
    expect(css(subheader).color).toBe("rgb(99, 115, 129)");
    const avatar = header.children[0] as HTMLElement;
    const action = header.children[2] as HTMLElement;
    expect(css(avatar).marginInlineEnd).toBe("16px");
    expect(css(action).alignSelf).toBe("flex-start");
    expect(css(action).marginTop).toBe("-4px");
    expect(css(action).marginRight).toBe("-8px");
  });

  it("only the content slot without avatar, action, title or subheader; children follow", () => {
    render(
      <CardHeader data-testid="h" component="header">
        <span>Extra</span>
      </CardHeader>,
    );
    const header = screen.getByTestId("h");
    expect(header.localName).toBe("header");
    expect(header.children).toHaveLength(2);
    expect((header.children[0] as HTMLElement).dataset["okCardHeaderContent"]).toBe("");
    expect(header.children[0]?.children).toHaveLength(0);
    expect(header.children[1]?.textContent).toBe("Extra");
  });

  it("titleProps / subheaderProps, and disableTypography", () => {
    const { rerender } = render(
      <CardHeader
        title="T"
        subheader="S"
        titleProps={{ variant: "subtitle1", component: "h2" }}
        subheaderProps={{ color: "primary" }}
      />,
    );
    expect(screen.getByText("T").localName).toBe("h2");
    expect(screen.getByText("T").dataset["okVariant"]).toBe("subtitle1");
    expect(screen.getByText("T").dataset["okCardHeaderTitle"]).toBe("");
    expect(screen.getByText("S").dataset["okColor"]).toBe("primary");
    rerender(<CardHeader disableTypography title={<h2>Own</h2>} subheader={<p>Line</p>} />);
    expect(screen.getByText("Own").localName).toBe("h2");
    expect(screen.getByText("Own").hasAttribute("data-ok-typography")).toBe(false);
    expect(screen.getByText("Line").parentElement?.dataset["okCardHeaderContent"]).toBe("");
  });
});

/** The computed font size of a Typography variant. */
function computedFont(variant: string) {
  const probe = document.createElement("span");
  probe.setAttribute("data-ok-typography", "");
  probe.setAttribute("data-ok-variant", variant);
  document.body.append(probe);
  const size = css(probe).fontSize;
  probe.remove();
  return size;
}

describe("CardContent and CardActions", () => {
  it("content padding; element choice", () => {
    render(<CardContent data-testid="c" component="section" />);
    const content = screen.getByTestId("c");
    expect(content.localName).toBe("section");
    expect(content.dataset["okCardContent"]).toBe("");
    expect(css(content).padding).toBe("24px");
  });

  it("actions: a row with 8px between the actions; disableSpacing removes it", () => {
    render(
      <>
        <CardActions data-testid="a">
          <Button size="sm">One</Button>
          <Button size="sm">Two</Button>
        </CardActions>
        <CardActions data-testid="b" disableSpacing>
          <Button size="sm">Three</Button>
        </CardActions>
      </>,
    );
    const actions = screen.getByTestId("a");
    expect(actions.dataset["okCardActions"]).toBe("");
    expect(css(actions).display).toBe("flex");
    expect(css(actions).padding).toBe("8px");
    expect(css(actions).columnGap).toBe("8px");
    expect(screen.getByTestId("b").dataset["okDisableSpacing"]).toBe("");
    expect(css(screen.getByTestId("b")).columnGap).toBe("0px");
  });
});

describe("CardMedia", () => {
  it("media elements get src and fill the width", () => {
    render(
      <div style={{ width: 300 }}>
        <CardMedia component="img" image={PIXEL} height="140" alt="Grey" data-testid="img" />
        <CardMedia component="video" src={PIXEL} data-testid="video" />
      </div>,
    );
    const img = screen.getByTestId("img");
    expect(img.localName).toBe("img");
    expect(img.getAttribute("src")).toBe(PIXEL);
    expect(img.getAttribute("alt")).toBe("Grey");
    expect(img.dataset["okCardMedia"]).toBe("");
    expect(css(img).width).toBe("300px");
    expect(css(img).height).toBe("140px");
    expect(css(img).objectFit).toBe("cover");
    expect(screen.getByTestId("video").getAttribute("src")).toBe(PIXEL);
    expect(css(screen.getByTestId("video")).width).toBe("300px");
  });

  it("other elements hold a decorative cover image that fills them", () => {
    render(
      <div style={{ width: 300 }}>
        <CardMedia image={PIXEL} title="Grey" style={{ height: 120 }} data-testid="div" />
        <CardMedia component="section" data-testid="empty">
          Text
        </CardMedia>
      </div>,
    );
    const media = screen.getByTestId("div");
    expect(media.localName).toBe("div");
    expect(media.hasAttribute("src")).toBe(false);
    expect(media.getAttribute("title")).toBe("Grey");
    expect(css(media).position).toBe("relative");
    const cover = media.querySelector("img") as HTMLImageElement;
    expect(cover.dataset["okCardMediaImage"]).toBe("");
    expect(cover.getAttribute("alt")).toBe("");
    expect(cover.getAttribute("src")).toBe(PIXEL);
    const box = cover.getBoundingClientRect();
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([300, 120]);
    expect(css(cover).objectFit).toBe("cover");
    const empty = screen.getByTestId("empty");
    expect(empty.querySelector("img")).toBeNull();
    expect(empty.textContent).toBe("Text");
  });

  it("media right after the header keeps 24px from it; elsewhere none", () => {
    render(
      <Card>
        <CardHeader title="Title" />
        <CardMedia component="img" src={PIXEL} alt="" data-testid="below" />
        <CardMedia component="img" src={PIXEL} alt="" data-testid="next" />
      </Card>,
    );
    expect(css(screen.getByTestId("below")).marginTop).toBe("24px");
    expect(css(screen.getByTestId("next")).marginTop).toBe("0px");
  });

  it("composes a component such as Image: it gets src and the media marker", () => {
    render(<CardMedia component={Image} ratio="16/9" src={PIXEL} alt="Grey" data-testid="m" />);
    const root = screen.getByTestId("m");
    expect(root.hasAttribute("data-ok-image")).toBe(true);
    expect(root.dataset["okCardMedia"]).toBe("");
    expect(root.dataset["okRatio"]).toBe("16/9");
    expect(root.querySelector(":scope > img")?.getAttribute("src")).toBe(PIXEL);
  });
});

describe("CardActionArea", () => {
  it("a full-width button, tinted on hover, ringed and tinted on keyboard focus", async () => {
    const onClick = vi.fn();
    render(
      <>
        <Card>
          <CardActionArea onClick={onClick}>
            <CardContent>Open</CardContent>
          </CardActionArea>
        </Card>
        <input aria-label="After" />
      </>,
    );
    const area = screen.getByRole("button", { name: "Open" });
    expect(area.getAttribute("type")).toBe("button");
    expect(area.dataset["okCardActionArea"]).toBe("");
    const card = area.parentElement as HTMLElement;
    expect(area.getBoundingClientRect().width).toBe(card.getBoundingClientRect().width);
    expect(css(area).textAlign).toBe(css(card).textAlign);
    expect(css(area, "::after").backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.hover(area);
    await settled(area);
    expect(css(area, "::after").backgroundColor).toBe(
      computed("backgroundColor", "var(--ok-action-hover)"),
    );
    await userEvent.unhover(area);
    await userEvent.click(area);
    expect(onClick).toHaveBeenCalledTimes(1);
    // Keyboard focus, back from the next field (Firefox doesn't Tab in from the document start).
    screen.getByRole("textbox", { name: "After" }).focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(area);
    await settled(area);
    expect(css(area).outlineStyle).toBe("solid");
    expect(css(area).outlineWidth).toBe("2px");
    expect(css(area, "::after").backgroundColor).toBe(
      computed("backgroundColor", "var(--ok-action-focus)"),
    );
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("a link with href; a disabled link loses href; a disabled button ignores presses", async () => {
    const onClick = vi.fn();
    render(
      <>
        <CardActionArea href="#a">Link</CardActionArea>
        <CardActionArea href="#b" disabled>
          Off link
        </CardActionArea>
        <CardActionArea disabled onClick={onClick}>
          Off button
        </CardActionArea>
        <CardActionArea type="submit" role="tab" aria-selected="false">
          Tab
        </CardActionArea>
      </>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link.getAttribute("href")).toBe("#a");
    expect(link.dataset["okCardActionArea"]).toBe("");
    const off = screen.getByText("Off link");
    expect(off.hasAttribute("href")).toBe(false);
    expect(off.getAttribute("role")).toBe("link");
    expect(off.getAttribute("aria-disabled")).toBe("true");
    expect(css(off).cursor).toBe("default");
    const button = screen.getByRole("button", { name: "Off button" });
    expect(button).toHaveProperty("disabled", true);
    expect(css(button).pointerEvents).toBe("none");
    expect(screen.getByRole("tab").getAttribute("type")).toBe("submit");
  });
});

describe("Card rendering", () => {
  it("renders on the server and has no axe violations", async () => {
    const card = (
      <Card>
        <CardHeader
          avatar={
            <Avatar role="img" aria-label="Ada">
              A
            </Avatar>
          }
          action={
            <IconButton aria-label="More">
              <svg aria-hidden="true" />
            </IconButton>
          }
          title="Title"
          subheader="Subheader"
        />
        <CardActionArea>
          <CardMedia component="img" src={PIXEL} height="80" alt="Grey" />
          <CardContent>Content</CardContent>
        </CardActionArea>
        <CardMedia image={PIXEL} />
        <CardActions>
          <Button size="sm">Share</Button>
        </CardActions>
      </Card>
    );
    const markup = renderToString(card);
    expect(markup).toContain('data-ok-card=""');
    expect(markup).toContain('<img data-ok-card-media-image="" src="');
    expect(renderToString(<Card raised />)).toBe(
      '<div data-ok-paper="" data-ok-variant="elevation" data-ok-elevation="1" data-ok-card="" data-ok-raised=""></div>',
    );
    const { container } = render(
      <>
        {card}
        <div data-ok-theme="dark">{card}</div>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
