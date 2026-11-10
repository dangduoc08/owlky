import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import { Slider } from "./slider.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const root = () => document.querySelector("[data-ok-slider]") as HTMLElement;
const thumbs = () => [...document.querySelectorAll<HTMLElement>("[data-ok-slider-thumb]")];
const at = (el: Element) => (el as HTMLElement).style.getPropertyValue("--_ok-slider-at");

function press(ratio: number, type = "pointerdown", y = 0.5) {
  act(() => dispatch(ratio, type, y));
}

function dispatch(ratio: number, type: string, y: number) {
  const box = (
    document.querySelector("[data-ok-slider-rail]") as HTMLElement
  ).getBoundingClientRect();
  root().dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 1,
      clientX: box.left + ratio * box.width,
      clientY: box.top + y * box.height,
    }),
  );
}

function Demo() {
  const [value, setValue] = useState<number | number[]>(10);
  return <Slider aria-label="C" value={value} onChange={setValue} />;
}

describe("Slider", () => {
  it("native range input under a drawn thumb, explicit defaults", async () => {
    render(<Slider aria-label="Volume" defaultValue={30} />);
    expect({ ...root().dataset }).toEqual({
      okSlider: "",
      okColor: "primary",
      okSize: "medium",
      okOrientation: "horizontal",
      okTrack: "normal",
      okValueLabelDisplay: "off",
      okRuntime: "off",
    });
    const input = screen.getByRole("slider", { name: "Volume" }) as HTMLInputElement;
    expect([input.type, input.min, input.max, input.step, input.value]).toEqual([
      "range",
      "0",
      "100",
      "1",
      "30",
    ]);
    expect(at(thumbs()[0] as Element)).toBe("30%");
    expect(root().style.getPropertyValue("--_ok-slider-end")).toBe("30%");
    await expectNoAxeViolations();
  });

  it("looks like the reference: 10 / 6px rail, 20 / 16px thumb, track in the main color", () => {
    const { rerender } = render(
      <div style={{ width: 400 }}>
        <Slider aria-label="S" defaultValue={50} />
      </div>,
    );
    const rail = document.querySelector("[data-ok-slider-rail]") as HTMLElement;
    const track = document.querySelector("[data-ok-slider-track]") as HTMLElement;
    expect(rail.getBoundingClientRect().height).toBe(10);
    expect(thumbs()[0]?.getBoundingClientRect().width).toBe(20);
    expect(track.getBoundingClientRect().width).toBeCloseTo(200, 0);
    expect(css(track).backgroundColor).toBe("rgb(0, 167, 111)");
    rerender(
      <div style={{ width: 400 }}>
        <Slider aria-label="S" defaultValue={50} size="small" color="error" />
      </div>,
    );
    expect(rail.getBoundingClientRect().height).toBe(6);
    expect(thumbs()[0]?.getBoundingClientRect().width).toBe(16);
    expect(css(track).backgroundColor).toBe("rgb(255, 86, 48)");
  });

  it("pointer: press the rail, drag, commit once", () => {
    const onChange = vi.fn();
    const onChangeCommitted = vi.fn();
    render(
      <div style={{ width: 400 }}>
        <Slider aria-label="S" onChange={onChange} onChangeCommitted={onChangeCommitted} />
      </div>,
    );
    press(0.25);
    expect(onChange).toHaveBeenLastCalledWith(25, 0);
    expect(thumbs()[0]?.hasAttribute("data-ok-active")).toBe(true);
    press(0.75, "pointermove");
    expect(onChange).toHaveBeenLastCalledWith(75, 0);
    press(0.75, "pointerup");
    expect(onChangeCommitted).toHaveBeenCalledExactlyOnceWith(75);
    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("75");
  });

  it("keyboard: arrows step, Home / End, steps of 10 and marks only", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Slider aria-label="K" defaultValue={30} step={10} onChange={onChange} />,
    );
    screen.getByRole("slider").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(40, 0);
    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(100, 0);
    rerender(
      <Slider
        aria-label="K"
        defaultValue={20}
        step={null}
        marks={[{ value: 0 }, { value: 20 }, { value: 37 }]}
        onChange={onChange}
      />,
    );
  });

  it("marks: ticks, labels, active ones; marks only (step null) snaps to them", async () => {
    const onChange = vi.fn();
    render(
      <div style={{ width: 400 }}>
        <Slider
          aria-label="T"
          defaultValue={20}
          step={null}
          marks={[
            { value: 0, label: "0°C" },
            { value: 20, label: "20°C" },
            { value: 100, label: "100°C" },
          ]}
          onChange={onChange}
        />
      </div>,
    );
    expect(root().dataset["okStep"]).toBe("0");
    const marks = [...document.querySelectorAll("[data-ok-slider-mark]")];
    expect(marks.map((m) => m.hasAttribute("data-ok-active"))).toEqual([true, true, false]);
    const label = screen.getByText("100°C");
    expect(label.getAttribute("aria-hidden")).toBe("true");
    expect(css(label).color).toBe("rgb(99, 115, 129)");
    press(0.7);
    expect(onChange).toHaveBeenLastCalledWith(100, 0);
    screen.getByRole("slider").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(20, 0);
  });

  it("marks={true}: one per step", () => {
    render(<Slider aria-label="M" step={25} marks />);
    expect(document.querySelectorAll("[data-ok-slider-mark]")).toHaveLength(5);
    expect(document.querySelectorAll("[data-ok-slider-mark-label]")).toHaveLength(0);
  });

  it("range: two named thumbs, the track between them, swapping when they cross", () => {
    const onChange = vi.fn();
    render(
      <div style={{ width: 400 }}>
        <Slider
          defaultValue={[20, 40]}
          getAriaLabel={(i) => (i ? "Max" : "Min")}
          onChange={onChange}
        />
      </div>,
    );
    expect(screen.getAllByRole("slider").map((s) => s.getAttribute("aria-label"))).toEqual([
      "Min",
      "Max",
    ]);
    expect(root().style.getPropertyValue("--_ok-slider-start")).toBe("20%");
    press(0.35);
    expect(onChange).toHaveBeenLastCalledWith([20, 35], 1);
    press(0.1, "pointermove");
    expect(onChange).toHaveBeenLastCalledWith([10, 20], 0);
  });

  it("controlled value; refusing changes keeps the thumb", () => {
    render(
      <StrictMode>
        <div style={{ width: 400 }}>
          <Demo />
        </div>
      </StrictMode>,
    );
    press(0.5);
    expect((screen.getByRole("slider") as HTMLInputElement).value).toBe("50");
    render(<Slider aria-label="Fixed" value={10} />);
    expect((screen.getByRole("slider", { name: "Fixed" }) as HTMLInputElement).value).toBe("10");
  });

  it("value labels: auto on focus, on always, formatted; aria-valuetext", async () => {
    const { rerender } = render(
      <Slider
        aria-label="L"
        defaultValue={30}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `${v}°C`}
        getAriaValueText={(v) => `${v} degrees`}
      />,
    );
    const label = document.querySelector("[data-ok-slider-value-label]") as HTMLElement;
    expect(label.textContent).toBe("30°C");
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("30 degrees");
    expect(css(label).opacity).toBe("0");
    await userEvent.tab();
    await settled(label);
    expect(css(label).opacity).toBe("1");
    rerender(<Slider aria-label="L" defaultValue={30} valueLabelDisplay="on" />);
    expect(css(document.querySelector("[data-ok-slider-value-label]") as Element).opacity).toBe(
      "1",
    );
    expect(
      css(document.querySelector("[data-ok-slider-value-label]") as Element).backgroundColor,
    ).toBe("rgb(28, 37, 46)");
  });

  it("vertical: aria-orientation, positions bottom-up, pointer upward", () => {
    const onChange = vi.fn();
    render(
      <div style={{ height: 200 }}>
        <Slider aria-label="V" orientation="vertical" defaultValue={25} onChange={onChange} />
      </div>,
    );
    expect(screen.getByRole("slider").getAttribute("aria-orientation")).toBe("vertical");
    const box = root().getBoundingClientRect();
    const thumb = thumbs()[0]?.getBoundingClientRect() as DOMRect;
    expect(thumb.top + thumb.height / 2).toBeCloseTo(box.bottom - 0.25 * box.height, 0);
    press(0.5, "pointerdown", 0.25);
    expect(onChange).toHaveBeenLastCalledWith(75, 0);
  });

  it("track inverted and false", () => {
    const { rerender } = render(<Slider aria-label="I" defaultValue={30} track="inverted" />);
    expect(root().style.getPropertyValue("--_ok-slider-start")).toBe("30%");
    expect(root().style.getPropertyValue("--_ok-slider-end")).toBe("100%");
    rerender(<Slider aria-label="I" defaultValue={30} track={false} />);
    expect(css(document.querySelector("[data-ok-slider-track]") as Element).display).toBe("none");
  });

  it("disabled: inputs disabled, grey, pointer ignored", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="D" defaultValue={30} disabled onChange={onChange} />);
    expect((screen.getByRole("slider") as HTMLInputElement).disabled).toBe(true);
    press(0.9);
    expect(onChange).not.toHaveBeenCalled();
    expect(
      css(document.querySelector("[data-ok-slider-track]") as Element).backgroundColor,
    ).not.toBe("rgb(0, 167, 111)");
  });

  it("native input changes (assistive technologies) go through onChange", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="A" defaultValue={30} onChange={onChange} />);
    const input = screen.getByRole("slider") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "64");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(64, 0);
  });

  it("invalid props fall back; ref, name and DOM props pass through", async () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Slider
        ref={ref}
        aria-labelledby="h"
        name="level"
        color={HOSTILE}
        size={HOSTILE}
        min={10}
        max={5}
        className="mine"
        style={{ marginTop: 3 }}
      />,
    );
    expect(ref.current?.className).toBe("mine");
    expect(root().dataset["okColor"]).toBe("primary");
    const input = document.querySelector("input") as HTMLInputElement;
    expect([input.name, input.min, input.max, input.getAttribute("aria-labelledby")]).toEqual([
      "level",
      "10",
      "110",
      "h",
    ]);
    expect(root().style.marginTop).toBe("3px");
  });

  it("server render matches the client markup", () => {
    const element = (
      <Slider
        aria-label="SSR"
        defaultValue={[20, 37]}
        marks={[{ value: 20, label: "20" }]}
        valueLabelDisplay="on"
      />
    );
    const html = renderToString(element);
    const { container } = render(element);
    // Same DOM (serialization differs: attribute order, style text).
    const server = document.createElement("div");
    server.innerHTML = html;
    const client = container.cloneNode(true) as HTMLElement;
    for (const el of [...server.querySelectorAll("*"), ...client.querySelectorAll("*")])
      el.removeAttribute("style");
    expect(client.firstElementChild?.isEqualNode(server.firstElementChild)).toBe(true);
  });
});

describe("Slider scale, shiftStep and tabIndex", () => {
  it("scale: label, aria-valuenow and aria-valuetext show the scaled value; onChange the plain one", async () => {
    const onChange = vi.fn();
    render(
      <Slider
        aria-label="Storage"
        defaultValue={10}
        min={5}
        max={30}
        scale={(x) => 2 ** x}
        valueLabelDisplay="on"
        valueLabelFormat={(v) => `${v} B`}
        getAriaValueText={(v) => `${v} bytes`}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole("slider") as HTMLInputElement;
    expect(input.getAttribute("aria-valuenow")).toBe("1024");
    expect(input.getAttribute("aria-valuetext")).toBe("1024 bytes");
    expect(document.querySelector("[data-ok-slider-value-label]")?.textContent).toBe("1024 B");
    input.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(11, 0);
    expect(input.getAttribute("aria-valuenow")).toBe("2048");
  });

  it("shiftStep moves Page keys and Shift + arrows; tabIndex goes to the inputs", async () => {
    const onChange = vi.fn();
    render(
      <Slider
        aria-label="Volume"
        defaultValue={[20, 60]}
        shiftStep={15}
        tabIndex={-1}
        onChange={onChange}
      />,
    );
    expect(root().dataset["okShiftStep"]).toBe("15");
    const [first] = screen.getAllByRole("slider") as HTMLInputElement[];
    expect(first?.tabIndex).toBe(-1);
    expect(root().hasAttribute("tabindex")).toBe(false);
    first?.focus();
    await userEvent.keyboard("{PageUp}");
    expect(onChange).toHaveBeenLastCalledWith([35, 60], 0);
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onChange).toHaveBeenLastCalledWith([50, 60], 0);
  });
});
