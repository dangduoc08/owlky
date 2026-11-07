import { avatarColors, avatarVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Avatar, AvatarGroup } from "./avatar.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/%3E";

describe("Avatar", () => {
  it("renders an image in a 40px circle", () => {
    render(<Avatar src={PIXEL} alt="Ada Lovelace" />);
    const img = screen.getByRole("img", { name: "Ada Lovelace" });
    const root = img.parentElement as HTMLElement;
    expect(root.dataset).toMatchObject({ okAvatar: "", okVariant: "circular", okColor: "default" });
    expect(css(root).width).toBe("40px");
    expect(css(root).borderRadius).not.toBe("0px");
    expect(css(img).objectFit).toBe("cover");
  });

  it("falls back to children, the alt letter, then an icon when the image fails", async () => {
    render(
      <>
        <Avatar data-testid="a" src="data:image/png;base64,broken" alt="ada">
          AL
        </Avatar>
        <Avatar data-testid="b" src="data:image/png;base64,broken" alt=" grace" />
        <Avatar data-testid="c" src="data:image/png;base64,broken" />
        <Avatar data-testid="d" />
      </>,
    );
    await expect.poll(() => screen.getByTestId("a").textContent).toBe("AL");
    await expect.poll(() => screen.getByTestId("b").textContent).toBe("G");
    await expect.poll(() => screen.getByTestId("c").querySelector("svg")).not.toBeNull();
    expect(screen.getByTestId("d").querySelector("svg[aria-hidden]")).not.toBeNull();
  });

  it("a broken srcSet alone falls back too", async () => {
    render(<Avatar data-testid="s" srcSet="data:image/png;base64,broken 1x" alt="kay" />);
    await expect.poll(() => screen.getByTestId("s").textContent).toBe("K");
  });

  it("calls the image's own onError too", async () => {
    let called = false;
    render(
      <Avatar
        src="data:image/png;base64,broken"
        alt="x"
        imgProps={{
          onError: () => {
            called = true;
          },
        }}
      />,
    );
    await expect.poll(() => called).toBe(true);
  });

  it.each(avatarVariants)("variant %s", (variant) => {
    render(<Avatar variant={variant}>A</Avatar>);
    const root = screen.getByText("A");
    expect(root.dataset["okVariant"]).toBe(variant);
    expect(css(root).borderRadius).toBe(
      { circular: "9999px", rounded: "12px", square: "0px" }[variant],
    );
  });

  it.each(avatarColors)("color %s", (color) => {
    render(<Avatar color={color}>A</Avatar>);
    const root = screen.getByText("A");
    const probe = document.createElement("span");
    probe.style.color =
      color === "default" ? "var(--ok-palette-grey-300)" : `var(--ok-palette-${color}-main)`;
    document.body.append(probe);
    expect(css(root).backgroundColor).toBe(css(probe).color);
    probe.remove();
  });

  it("size: px or a length; letters scale; invalid sizes fall back", () => {
    render(
      <>
        <Avatar size={56}>A</Avatar>
        <Avatar size="3rem">B</Avatar>
        <Avatar size={HOSTILE} variant={HOSTILE} color={HOSTILE}>
          C
        </Avatar>
      </>,
    );
    const a = screen.getByText("A");
    expect(a.dataset["okSize"]).toBe("56");
    expect(css(a).width).toBe("56px");
    expect(Number.parseFloat(css(a).fontSize)).toBeCloseTo(25.2, 1);
    expect(css(screen.getByText("B")).width).toBe("48px");
    const c = screen.getByText("C");
    expect(c.dataset).toMatchObject({ okVariant: "circular", okColor: "default" });
    expect(c.hasAttribute("data-ok-size")).toBe(false);
  });

  it("forwards ref and props; renders on the server", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} aria-label="Team" role="img" />);
    expect(ref.current).toBe(screen.getByRole("img", { name: "Team" }));
    expect(renderToString(<Avatar src={PIXEL} alt="x" size={24} />)).toContain(
      "--_ok-avatar-size:24px",
    );
  });
});

describe("AvatarGroup", () => {
  const people = ["A", "B", "C", "D", "E", "F"].map((letter) => (
    <Avatar key={letter} size={32}>
      {letter}
    </Avatar>
  ));

  it("shows max − 1 avatars and a +N surplus sized like the first", () => {
    const { container } = render(<AvatarGroup max={4}>{people}</AvatarGroup>);
    const group = container.firstElementChild as HTMLElement;
    expect(group.dataset).toMatchObject({ okAvatarGroup: "", okSpacing: "medium" });
    const avatars = [...group.children] as HTMLElement[];
    expect(avatars.map((a) => a.textContent)).toEqual(["A", "B", "C", "+3"]);
    const surplus = avatars[3] as HTMLElement;
    expect(surplus.hasAttribute("data-ok-avatar-surplus")).toBe(true);
    expect(surplus.dataset["okSize"]).toBe("32");
    expect(css(avatars[1] as Element).marginLeft).toBe("-8px");
    expect(css(avatars[1] as Element).borderTopWidth).toBe("2px");
  });

  it("total, renderSurplus, variant, spacing and limits", () => {
    const { container } = render(
      <>
        <AvatarGroup
          total={20}
          max={3}
          variant="rounded"
          spacing="small"
          renderSurplus={(n) => `${n} more`}
        >
          {people}
        </AvatarGroup>
        <AvatarGroup max={1}>{people.slice(0, 2)}</AvatarGroup>
        <AvatarGroup max={Number.NaN}>{people.slice(0, 3)}</AvatarGroup>
      </>,
    );
    const [a, b, c] = container.children as unknown as HTMLElement[];
    expect([...(a as HTMLElement).children].map((x) => x.textContent)).toEqual([
      "A",
      "B",
      "18 more",
    ]);
    expect((a as HTMLElement).querySelectorAll('[data-ok-variant="rounded"]')).toHaveLength(3);
    expect(css((a as HTMLElement).children[1] as Element).marginLeft).toBe("-16px");
    expect((b as HTMLElement).children).toHaveLength(2);
    expect((c as HTMLElement).children).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <Avatar src={PIXEL} alt="Ada" />
        <Avatar color="primary" role="img" aria-label="Grace Hopper">
          GH
        </Avatar>
        <Avatar>AL</Avatar>
        <AvatarGroup max={3}>{people}</AvatarGroup>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
