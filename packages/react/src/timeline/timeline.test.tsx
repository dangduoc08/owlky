import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  type TimelineDotProps,
  TimelineItem,
  TimelineOppositeContent,
  type TimelineProps,
  TimelineSeparator,
} from "./timeline.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

function Events({
  position,
  dot,
  opposite = false,
}: {
  position?: TimelineProps["position"];
  dot?: TimelineDotProps;
  opposite?: boolean;
}) {
  return (
    <Timeline position={position}>
      {["One", "Two", "Three"].map((label, index) => (
        <TimelineItem key={label}>
          {opposite && <TimelineOppositeContent>{`${index}:00`}</TimelineOppositeContent>}
          <TimelineSeparator>
            <TimelineDot {...dot} />
            {index < 2 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>{label}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

const content = (label: string) => screen.getByText(label);
const dot = () => document.querySelector("[data-ok-timeline-dot]") as HTMLElement;

describe("Timeline", () => {
  it("a list of events with explicit defaults", async () => {
    render(<Events />);
    const list = screen.getByRole("list");
    expect({ ...list.dataset }).toEqual({ okTimeline: "", okPosition: "right" });
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect({ ...dot().dataset }).toEqual({
      okTimelineDot: "",
      okVariant: "filled",
      okColor: "grey",
    });
    expect(document.querySelectorAll("[data-ok-timeline-connector]")).toHaveLength(2);
    await expectNoAxeViolations();
  });

  it("looks like the reference: 12px dots, a 2px line, 70px items, the content on the right half", () => {
    render(
      <div style={{ width: 600 }}>
        <Events />
      </div>,
    );
    expect(dot().getBoundingClientRect()).toMatchObject({ width: 12, height: 12 });
    expect(css(dot()).backgroundColor).toBe("rgb(196, 205, 213)");
    const line = document.querySelector("[data-ok-timeline-connector]") as HTMLElement;
    expect(line.getBoundingClientRect().width).toBe(2);
    expect(screen.getAllByRole("listitem")[0]?.getBoundingClientRect().height).toBe(70);
    const text = content("One").getBoundingClientRect();
    const axis = dot().getBoundingClientRect();
    expect(text.left).toBeGreaterThanOrEqual(axis.right);
    expect(axis.left + 6).toBeCloseTo(300, 0);
    expect(css(content("One")).textAlign).toBe("left");
  });

  it("left and alternate place the content on the other side", () => {
    const { rerender } = render(<Events position="left" />);
    const before = (label: string) =>
      content(label).getBoundingClientRect().right <=
      (
        (content(label).parentElement as Element).querySelector("[data-ok-timeline-dot]") as Element
      ).getBoundingClientRect().left;
    expect(before("One")).toBe(true);
    expect(css(content("One")).textAlign).toBe("right");
    rerender(<Events position="alternate" />);
    expect([before("One"), before("Two"), before("Three")]).toEqual([false, true, false]);
    rerender(<Events position="alternate-reverse" />);
    expect([before("One"), before("Two")]).toEqual([true, false]);
    rerender(<Events position={HOSTILE} />);
    expect(screen.getByRole("list").dataset["okPosition"]).toBe("right");
  });

  it("an item may override the side", () => {
    render(
      <Timeline position="left">
        <TimelineItem position="right">
          <TimelineSeparator>
            <TimelineDot />
          </TimelineSeparator>
          <TimelineContent>Own side</TimelineContent>
        </TimelineItem>
      </Timeline>,
    );
    expect(css(content("Own side")).textAlign).toBe("left");
  });

  it("opposite content takes the other half, aligned toward the line", () => {
    render(<Events opposite position="alternate" />);
    const opposite = screen.getByText("0:00");
    expect(opposite.hasAttribute("data-ok-timeline-opposite-content")).toBe(true);
    expect(css(opposite).textAlign).toBe("right");
    expect(css(screen.getByText("1:00")).textAlign).toBe("left");
  });

  it("dot colors and outlined variant; icons inside", async () => {
    const { rerender } = render(<Events dot={{ color: "primary" }} />);
    expect(css(dot()).backgroundColor).toBe("rgb(0, 167, 111)");
    rerender(<Events dot={{ color: "error", variant: "outlined" }} />);
    expect(css(dot()).borderTopColor).toBe("rgb(255, 86, 48)");
    expect(css(dot()).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    rerender(<Events dot={{ color: "inherit" }} />);
    expect(css(dot()).backgroundColor).toBe("rgb(28, 37, 46)");
    rerender(
      <Timeline>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color="info">
              <svg aria-hidden="true" viewBox="0 0 24 24" />
            </TimelineDot>
          </TimelineSeparator>
          <TimelineContent>Icon</TimelineContent>
        </TimelineItem>
      </Timeline>,
    );
    expect(dot().getBoundingClientRect().width).toBe(36);
    await expectNoAxeViolations();
  });

  it("passes refs and props to every part", () => {
    const refs = Array.from({ length: 7 }, () => createRef<HTMLElement>());
    render(
      <Timeline ref={refs[0] as never} className="t">
        <TimelineItem ref={refs[1] as never}>
          <TimelineOppositeContent ref={refs[2] as never} />
          <TimelineSeparator ref={refs[3] as never}>
            <TimelineDot ref={refs[4] as never} />
            <TimelineConnector ref={refs[5] as never} />
          </TimelineSeparator>
          <TimelineContent ref={refs[6] as never} />
        </TimelineItem>
      </Timeline>,
    );
    expect(refs.every((ref) => ref.current instanceof HTMLElement)).toBe(true);
    expect(refs[0]?.current?.className).toBe("t");
  });

  it("server render matches the client markup", () => {
    const element = <Events opposite position="alternate" dot={{ color: "success" }} />;
    const html = renderToString(element);
    const { container } = render(element);
    expect(html).toBe(container.innerHTML);
  });
});
