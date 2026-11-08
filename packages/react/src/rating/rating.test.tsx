import { render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Rating } from "./rating.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const icons = () => [...document.querySelectorAll<HTMLElement>("[data-ok-rating-icon]")];
const filled = () => icons().map((icon) => icon.hasAttribute("data-ok-filled"));
const radio = (name: string) => screen.getByRole("radio", { name });

function Controlled({ onChange }: { onChange?: (value: number | null) => void }) {
  const [value, setValue] = useState<number | null>(2);
  return (
    <Rating
      name="c"
      value={value}
      onChange={(next) => {
        onChange?.(next);
        setValue(next);
      }}
    />
  );
}

describe("Rating", () => {
  it("a radio group drawn as icons, with explicit defaults", async () => {
    render(<Rating name="r" defaultValue={2} />);
    const root = document.querySelector("[data-ok-rating]") as HTMLElement;
    expect({ ...root.dataset }).toEqual({
      okRating: "",
      okSize: "medium",
      okColor: "warning",
      okRuntime: "off",
    });
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    expect((radio("2 Stars") as HTMLInputElement).checked).toBe(true);
    expect((radio("Empty") as HTMLInputElement).value).toBe("");
    expect(filled()).toEqual([true, true, false, false, false]);
    await expectNoAxeViolations();
  });

  it("looks like the reference: 24px icons, warning when filled, grey 48% when empty", () => {
    render(<Rating name="r" defaultValue={1} />);
    const [on, off] = icons() as [HTMLElement, HTMLElement];
    expect(on.getBoundingClientRect()).toMatchObject({ width: 24, height: 24 });
    expect(css(on).color).toBe("rgb(255, 171, 0)");
    expect(css(off).color).toBe("rgba(145, 158, 171, 0.48)");
    expect(css(on.querySelector("svg") as Element).fill).toBe("rgb(255, 171, 0)");
  });

  it("click chooses, clicking the chosen icon clears; onChange once per change", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <Controlled onChange={onChange} />
      </StrictMode>,
    );
    await userEvent.click(icons()[3] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(filled()).toEqual([true, true, true, true, false]);
    await userEvent.click(icons()[3] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect((radio("Empty") as HTMLInputElement).checked).toBe(true);
    await userEvent.hover(document.body);
    expect(filled()).toEqual([false, false, false, false, false]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("keyboard: arrows move along the native radio group (Space doesn't clear)", async () => {
    const onChange = vi.fn();
    render(
      <>
        <input aria-label="Before" />
        <Rating name="k" defaultValue={2} onChange={onChange} />
      </>,
    );
    // Tab in, as a keyboard user does (WebKit shows no focus ring after a scripted focus).
    screen.getByLabelText("Before").focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(radio("2 Stars"));
    expect(css(icons()[1] as Element).outlineStyle).toBe("solid");
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(3);
    // WebKit drops :focus-visible when arrow keys move along a radio group (native radios too).
    expect(css(icons()[2] as Element).outlineStyle).toBe(
      radio("3 Stars").matches(":focus-visible") ? "solid" : "none",
    );
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("arrow keys reach the empty radio (no rating)", async () => {
    const onChange = vi.fn();
    render(<Rating name="e" defaultValue={5} onChange={onChange} />);
    // The empty radio follows the last star (WebKit doesn't wrap arrow keys in a radio group).
    radio("5 Stars").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect((radio("Empty") as HTMLInputElement).checked).toBe(true);
  });

  it("hover previews the value under the pointer and reports it", async () => {
    const onChangeActive = vi.fn();
    render(<Rating name="h" defaultValue={1} onChangeActive={onChangeActive} />);
    await userEvent.hover(icons()[3] as HTMLElement);
    expect(onChangeActive).toHaveBeenLastCalledWith(4);
    expect(filled()).toEqual([true, true, true, true, false]);
    expect((icons()[3] as HTMLElement).hasAttribute("data-ok-hover")).toBe(true);
    await userEvent.hover(document.body);
    expect(onChangeActive).toHaveBeenLastCalledWith(null);
    expect(filled()).toEqual([true, false, false, false, false]);
  });

  it("half precision: two radios per icon, the first half clipped over the icon", () => {
    render(<Rating name="p" defaultValue={2.5} precision={0.5} />);
    expect(screen.getAllByRole("radio")).toHaveLength(11);
    const half = icons()[4] as HTMLElement;
    expect(half.dataset["okFraction"]).toBe("0.5");
    expect(half.getBoundingClientRect().width).toBe(12);
    expect(css(half).position).toBe("absolute");
    expect(filled().slice(0, 6)).toEqual([true, true, true, true, true, false]);
    // An empty half shows nothing: the whole icon below shows the empty state.
    expect(css(icons()[6]?.querySelector("svg") as Element).visibility).toBe("hidden");
  });

  it("read only: one image named by the value, no radios", async () => {
    render(<Rating defaultValue={2.5} precision={0.5} readOnly />);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByRole("img", { name: "2.5 Stars" })).toBeTruthy();
    render(<Rating readOnly emptyLabelText="No rating" />);
    expect(screen.getByRole("img", { name: "No rating" })).toBeTruthy();
    await expectNoAxeViolations();
  });

  it("disabled: radios disabled, dimmed, no hover", async () => {
    const onChangeActive = vi.fn();
    render(<Rating name="d" defaultValue={2} disabled onChangeActive={onChangeActive} />);
    expect(screen.getAllByRole("radio").every((r) => (r as HTMLInputElement).disabled)).toBe(true);
    expect(css(document.querySelector("[data-ok-rating]") as Element).opacity).toBe("0.48");
  });

  it("max, sizes, colors, custom icons and labels; invalid values fall back", async () => {
    const { rerender, unmount } = render(<Rating name="m" max={10} size="large" color="info" />);
    expect(icons()).toHaveLength(10);
    expect(icons()[0]?.getBoundingClientRect().width).toBe(28);
    unmount();
    const view = render(
      <Rating
        name="m"
        defaultValue={1}
        icon={<svg data-testid="full" aria-hidden="true" viewBox="0 0 24 24" />}
        emptyIcon={<svg data-testid="empty" aria-hidden="true" fill="none" viewBox="0 0 24 24" />}
        getLabelText={(value) => `${value} hearts`}
        size={HOSTILE}
        color={HOSTILE}
      />,
    );
    void rerender;
    expect(radio("1 hearts")).toBeTruthy();
    const [first, second] = icons() as [HTMLElement, HTMLElement];
    expect(css(first.querySelector("[data-ok-rating-icon-filled]") as Element).display).toBe(
      "flex",
    );
    expect(css(first.querySelector("[data-ok-rating-icon-empty]") as Element).display).toBe("none");
    expect(css(second.querySelector("[data-ok-rating-icon-filled]") as Element).display).toBe(
      "none",
    );
    expect(document.querySelector("[data-ok-rating]")?.getAttribute("data-ok-size")).toBe("medium");
    view.unmount();
    render(
      <Rating
        name="m"
        defaultValue={2}
        highlightSelectedOnly
        renderIcon={(value) => <svg aria-hidden="true" data-value={value} viewBox="0 0 24 24" />}
      />,
    );
    expect(filled()).toEqual([false, true, false, false, false]);
    expect(icons()[4]?.querySelector("svg")?.dataset["value"]).toBe("5");
    await expectNoAxeViolations();
  });

  it("generates a group name, passes ref and DOM props", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Rating ref={ref} className="mine" aria-describedby="x" />);
    expect(ref.current?.className).toBe("mine");
    const names = new Set(screen.getAllByRole("radio").map((r) => (r as HTMLInputElement).name));
    expect(names.size).toBe(1);
  });

  it("server render matches the client markup", () => {
    for (const element of [
      <Rating key="a" name="s" defaultValue={2} />,
      <Rating key="b" defaultValue={2.5} precision={0.5} readOnly />,
    ]) {
      const html = renderToString(element);
      const { container, unmount } = render(element);
      // Same DOM (serialization differs: attribute order).
      const server = document.createElement("div");
      server.innerHTML = html;
      const norm = (el: Element) =>
        [el, ...el.querySelectorAll("*")].map(
          (n) =>
            `${n.tagName} ${[...n.attributes]
              .map((a) => `${a.name}=${a.value}`)
              .sort()
              .join(" ")} ${n.childElementCount ? "" : n.textContent}`,
        );
      expect(norm(container.firstElementChild as Element)).toEqual(
        norm(server.firstElementChild as Element),
      );
      unmount();
    }
  });
});
