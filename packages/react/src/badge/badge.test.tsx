import { badgeVariants } from "@owlky/core";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Badge } from "./badge.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const box = <span style={{ display: "inline-block", width: 24, height: 24 }}>x</span>;
const part = (root: Element) => root.querySelector("[data-ok-badge-badge]") as HTMLElement;
/** Badge center relative to the anchor's box. */
const center = (root: Element) => {
  const r = root.getBoundingClientRect();
  const b = part(root).getBoundingClientRect();
  return [Math.round(b.left + b.width / 2 - r.left), Math.round(b.top + b.height / 2 - r.top)];
};

describe("Badge", () => {
  it("shows a count on the top-right corner", async () => {
    const { container } = render(<Badge badgeContent={4}>{box}</Badge>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset).toMatchObject({
      okBadge: "",
      okVariant: "standard",
      okColor: "default",
      okOverlap: "rectangular",
      okVertical: "top",
      okHorizontal: "right",
    });
    expect(part(root).textContent).toBe("4");
    expect(css(part(root)).height).toBe("20px");
    await settled(part(root));
    expect(center(root)).toEqual([24, 0]);
  });

  it("anchors and circular overlap move it", async () => {
    const { container } = render(
      <>
        <Badge badgeContent={1} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
          {box}
        </Badge>
        <Badge badgeContent={1} overlap="circular">
          <span style={{ display: "inline-block", width: 100, height: 100 }} />
        </Badge>
      </>,
    );
    const [a, b] = container.children as unknown as HTMLElement[];
    expect(center(a as Element)).toEqual([0, 24]);
    expect(center(b as Element)).toEqual([86, 14]);
  });

  it("caps at max, hides 0 unless showZero, hides when invisible", () => {
    const { container } = render(
      <>
        <Badge badgeContent={120}>{box}</Badge>
        <Badge badgeContent={1000} max={999}>
          {box}
        </Badge>
        <Badge badgeContent={0}>{box}</Badge>
        <Badge badgeContent={0} showZero>
          {box}
        </Badge>
        <Badge badgeContent={3} invisible>
          {box}
        </Badge>
      </>,
    );
    const roots = [...container.children] as HTMLElement[];
    expect(roots.map((r) => part(r).textContent)).toEqual(["99+", "999+", "0", "0", "3"]);
    expect(roots.map((r) => r.hasAttribute("data-ok-invisible"))).toEqual([
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it.each(badgeVariants)("variant %s", (variant) => {
    const { container } = render(
      <Badge variant={variant} badgeContent={5}>
        {box}
      </Badge>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset["okVariant"]).toBe(variant);
    expect(part(root).textContent).toBe(variant === "standard" ? "5" : "");
    const size = css(part(root)).height;
    if (variant === "dot") expect(size).toBe("8px");
    if (["online", "always", "busy", "offline"].includes(variant)) expect(size).toBe("10px");
    if (variant === "invisible") expect(css(part(root)).display).toBe("none");
  });

  it("colors, invalid values and ref", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <>
        <Badge ref={ref} color="error" badgeContent={1}>
          {box}
        </Badge>
        <Badge color={HOSTILE} variant={HOSTILE} overlap={HOSTILE} badgeContent={1}>
          {box}
        </Badge>
      </>,
    );
    const [a, b] = container.children as unknown as HTMLElement[];
    expect(ref.current).toBe(a);
    expect(css(part(a as Element)).backgroundColor).toBe("rgb(255, 86, 48)");
    expect((b as HTMLElement).dataset).toMatchObject({
      okColor: "default",
      okVariant: "standard",
      okOverlap: "rectangular",
    });
  });

  it("renders on the server and has no axe violations", async () => {
    expect(renderToString(<Badge badgeContent={4}>{box}</Badge>)).toContain(
      'data-ok-badge-badge=""',
    );
    const { container } = render(
      <>
        <Badge badgeContent={4}>
          <span role="img" aria-label="4 messages">
            ✉
          </span>
        </Badge>
        <Badge variant="online">{box}</Badge>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
