import { act, render, screen } from "@testing-library/react";
import { createRef, type RefObject, useRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircularProgress } from "../circular-progress/circular-progress.js";
import { LinearProgress } from "../linear-progress/linear-progress.js";
import { expectNoAxeViolations } from "../test-utils.js";
import { scrollProgressProps, type UseScrollOptions, useScroll } from "./scroll-progress.js";

/** Scroll events and timelines update on the next frames. */
const frames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

const shown = (element: Element) =>
  Number(getComputedStyle(element).getPropertyValue("--_ok-scroll-progress"));

/** A 100px tall area over 500px of content (400px of scroll), 500px wide over 1000px. */
function Area({ id, areaRef }: { id?: string; areaRef?: RefObject<HTMLElement | null> }) {
  return (
    <section
      ref={areaRef}
      id={id}
      aria-label="Area"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scroll area takes focus.
      tabIndex={0}
      style={{ height: 100, width: 500, overflow: "auto" }}
    >
      <div style={{ height: 500, width: 1000, position: "relative" }}>
        <div id="item" style={{ position: "absolute", top: 200, height: 50, width: 50 }} />
      </div>
    </section>
  );
}

function RefDemo({ axis }: { axis: "x" | "y" }) {
  const area = useRef<HTMLElement>(null);
  return (
    <>
      <CircularProgress enableTrackSlot scroll={{ container: area, axis }} />
      <Area areaRef={area} />
    </>
  );
}

function TargetDemo() {
  const item = useRef<HTMLDivElement>(null);
  return (
    <>
      <CircularProgress
        scroll={{ container: "frame", target: item, offset: ["start end", "end start"] }}
      />
      <section id="frame" style={{ height: 100, overflow: "auto" }}>
        <div style={{ height: 500, paddingTop: 200 }}>
          <div ref={item} style={{ height: 50 }} />
        </div>
      </section>
    </>
  );
}

/** Every value `Readout` rendered. */
const seen: object[] = [];

function Readout({ options }: { options: UseScrollOptions }) {
  const info = useScroll(options);
  seen.push(info);
  return (
    <output>
      {info.scrollX} {info.scrollY} {info.scrollXProgress} {info.scrollYProgress}
    </output>
  );
}

function PageReadout() {
  const { scrollY } = useScroll();
  return <output>{scrollY}</output>;
}

afterEach(() => {
  vi.restoreAllMocks();
  window.scrollTo(0, 0);
});

describe("LinearProgress scroll", () => {
  it("renders a decorative determinate bar without a value", () => {
    render(
      <LinearProgress scroll={{ container: "box", axis: "x", offset: "start end, end start" }} />,
    );
    const root = document.querySelector("[data-ok-linear-progress]") as HTMLElement;
    expect(root.dataset).toMatchObject({
      okVariant: "determinate",
      okScrollProgress: "",
      okScrollAxis: "x",
      okScrollContainer: "box",
      okScrollOffset: "start end, end start",
    });
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.hasAttribute("aria-valuenow")).toBe(false);
    expect(root.style.getPropertyValue("--_ok-progress-value")).toBe("");
  });

  it("follows a container by id and stops on unmount", async () => {
    const { unmount } = render(
      <>
        <LinearProgress color="info" scroll={{ container: "box" }} />
        <Area id="box" />
      </>,
    );
    const root = document.querySelector("[data-ok-linear-progress]") as HTMLElement;
    const box = document.getElementById("box") as HTMLElement;
    box.scrollTop = 200;
    await frames();
    expect(shown(root)).toBeCloseTo(0.5, 2);
    const bar = root.firstElementChild as HTMLElement;
    const translate = new DOMMatrix(getComputedStyle(bar).transform).m41;
    expect(translate / bar.getBoundingClientRect().width).toBeCloseTo(-0.5, 2);
    await expectNoAxeViolations();
    unmount();
    expect(root.getAnimations()).toHaveLength(0);
  });

  it("smooths the bar with a spring (`smooth`)", async () => {
    const { unmount } = render(
      <>
        <LinearProgress scroll={{ container: "box", smooth: { stiffness: 300, damping: 30 } }} />
        <Area id="box" />
      </>,
    );
    const root = document.querySelector("[data-ok-linear-progress]") as HTMLElement;
    expect(root.getAttribute("data-ok-scroll-smooth")).toBe('{"stiffness":300,"damping":30}');
    expect(root.hasAttribute("data-ok-fallback")).toBe(true);
    const box = document.getElementById("box") as HTMLElement;
    box.scrollTop = 200;
    for (let i = 0; i < 240 && Math.abs(shown(root) - 0.5) > 0.01; i++) await frames();
    expect(shown(root)).toBeCloseTo(0.5, 1);
    unmount();
    expect(scrollProgressProps({ smooth: true })["data-ok-scroll-smooth"]).toBe("");
  });

  it("keeps an explicit variant and follows the page with `true`", () => {
    render(<LinearProgress variant="buffer" scroll />);
    const root = document.querySelector("[data-ok-linear-progress]") as HTMLElement;
    expect(root.getAttribute("data-ok-variant")).toBe("buffer");
    expect(root.hasAttribute("data-ok-scroll-container")).toBe(false);
  });

  it("renders the same markup on the server", () => {
    const html = renderToString(<LinearProgress scroll={{ container: "box" }} />);
    expect(html).toContain('data-ok-scroll-progress=""');
    expect(html).toContain('data-ok-scroll-container="box"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<LinearProgress ref={ref} scroll />);
    expect(ref.current?.hasAttribute("data-ok-scroll-progress")).toBe(true);
  });
});

describe("CircularProgress scroll", () => {
  it("follows a container ref on the x axis and starts over when the options change", async () => {
    const { rerender } = render(<RefDemo axis="x" />);
    const root = document.querySelector("[data-ok-circular-progress]") as HTMLElement;
    // A ref writes no id.
    expect(root.hasAttribute("data-ok-scroll-container")).toBe(false);
    expect(root.hasAttribute("aria-valuenow")).toBe(false);
    const area = screen.getByRole("region", { name: "Area" });
    area.scrollLeft = 250;
    await frames();
    expect(shown(root)).toBeCloseTo(0.5, 2);
    const circle = root.querySelector("circle") as SVGElement;
    const arc = Math.PI * (44 - 3.6);
    expect(Number.parseFloat(getComputedStyle(circle).strokeDashoffset)).toBeCloseTo(arc / 2, 0);
    rerender(<RefDemo axis="y" />);
    area.scrollTop = 100;
    await frames();
    expect(shown(root)).toBeCloseTo(0.25, 2);
  });

  it("follows a target ref between two intersections", async () => {
    render(<TargetDemo />);
    const root = document.querySelector("[data-ok-circular-progress]") as HTMLElement;
    expect(root.getAttribute("data-ok-scroll-offset")).toBe("start end, end start");
    const frame = document.getElementById("frame") as HTMLElement;
    frame.scrollTop = 175;
    await frames();
    expect(shown(root)).toBeCloseTo(0.5, 2);
  });
});

describe("useScroll", () => {
  it("returns the position and the progress on both axes", async () => {
    seen.length = 0;
    render(
      <>
        <Readout options={{ container: "box", offset: ["start start", "end end"] }} />
        <Area id="box" />
      </>,
    );
    const output = document.querySelector("output") as HTMLOutputElement;
    expect(output.textContent).toBe("0 0 0 0");
    const box = document.getElementById("box") as HTMLElement;
    await act(async () => {
      box.scrollTop = 100;
      box.scrollLeft = 250;
      await frames();
    });
    expect(output.textContent).toBe("250 100 0.5 0.25");
    // Nothing moved: the same values (React may render once more before it bails out).
    const before = seen.length;
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      await frames();
    });
    expect(seen.slice(before - 1).every((info) => info === seen[before - 1])).toBe(true);
  });

  it("follows the page by default", async () => {
    render(
      <>
        <PageReadout />
        <div style={{ height: 3000 }} />
      </>,
    );
    await act(async () => {
      window.scrollTo(0, 300);
      await frames();
    });
    expect(document.querySelector("output")?.textContent).toBe("300");
  });
});

describe("scrollProgressProps", () => {
  it("writes nothing without scroll and the axis only when given", () => {
    expect(scrollProgressProps(undefined)).toEqual({});
    expect(scrollProgressProps(false)).toEqual({});
    expect(scrollProgressProps(true)).toEqual({
      "data-ok-scroll-progress": "",
      "aria-hidden": "true",
    });
    expect(scrollProgressProps({ target: "item", offset: [[0, 1], "end start"] })).toEqual({
      "data-ok-scroll-progress": "",
      "data-ok-scroll-target": "item",
      "data-ok-scroll-offset": "0 1, end start",
      "aria-hidden": "true",
    });
  });
});
