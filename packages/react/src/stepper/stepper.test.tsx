import { render, screen } from "@testing-library/react";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  MobileStepper,
  Step,
  StepConnector,
  StepContent,
  StepLabel,
  Stepper,
  type StepperProps,
} from "./stepper.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const steps = () => [...document.querySelectorAll<HTMLElement>("[data-ok-step]")];
const states = () =>
  steps().map((step) =>
    ["active", "completed", "disabled"].filter((s) => step.hasAttribute(`data-ok-${s}`)).join(),
  );

function Basic(props: Omit<StepperProps, "children">) {
  return (
    <Stepper aria-label="Setup" {...props}>
      <Step>
        <StepLabel>Plan</StepLabel>
      </Step>
      <Step>
        <StepLabel optional="Optional">Details</StepLabel>
      </Step>
      <Step>
        <StepLabel>Review</StepLabel>
      </Step>
    </Stepper>
  );
}

function Demo() {
  const [active, setActive] = useState(0);
  return (
    <>
      <Basic activeStep={active} />
      <button type="button" onClick={() => setActive(active + 1)}>
        Next
      </button>
    </>
  );
}

describe("Stepper", () => {
  it("an ordered list of steps; states from activeStep", async () => {
    render(<Basic activeStep={1} />);
    const list = screen.getByRole("list", { name: "Setup" });
    expect(list.localName).toBe("ol");
    expect({ ...list.dataset }).toEqual({
      okStepper: "",
      okOrientation: "horizontal",
      okVariant: "standard",
      okActiveStep: "1",
    });
    expect(states()).toEqual(["completed", "active", "disabled"]);
    expect(steps()[1]?.getAttribute("aria-current")).toBe("step");
    expect(steps()[0]?.hasAttribute("aria-current")).toBe(false);
    // A connector before every step but the first.
    expect(steps().map((s) => s.querySelector("[data-ok-step-connector]") !== null)).toEqual([
      false,
      true,
      true,
    ]);
    expect(screen.getByText("Optional").hasAttribute("data-ok-step-label-optional")).toBe(true);
    await expectNoAxeViolations();
  });

  it("looks like the reference: 24px icons, white numbers, labels 14px, 1px lines", () => {
    render(<Basic activeStep={1} />);
    const [done, active, idle] = steps().map(
      (s) => s.querySelector("[data-ok-step-icon]") as HTMLElement,
    ) as [HTMLElement, HTMLElement, HTMLElement];
    expect(active.getBoundingClientRect()).toMatchObject({ width: 24, height: 24 });
    expect(css(active).backgroundColor).toBe("rgb(0, 167, 111)");
    expect(css(active).color).toBe("rgb(255, 255, 255)");
    expect(css(active).fontSize).toBe("12px");
    // Not reached: grey-600 keeps the white number at AA.
    expect(css(idle).backgroundColor).toBe("rgb(99, 115, 129)");
    // Completed: a check instead of the number.
    expect(css(done.querySelector("[data-ok-step-icon-check]") as Element).display).toBe("block");
    expect(css(done.querySelector("[data-ok-step-icon-text]") as Element).display).toBe("none");
    expect(css(active.querySelector("[data-ok-step-icon-check]") as Element).display).toBe("none");
    const title = (index: number) =>
      steps()[index]?.querySelector("[data-ok-step-label-title]") as Element;
    expect(css(title(1))).toMatchObject({ fontSize: "14px", fontWeight: "500" });
    expect(css(title(1)).color).toBe("rgb(28, 37, 46)");
    expect(css(title(2)).color).toBe("rgb(99, 115, 129)");
    expect(css(title(2)).fontWeight).toBe("400");
    const line = steps()[1]?.querySelector("[data-ok-step-connector-line]") as Element;
    expect(css(line).borderTopWidth).toBe("1px");
  });

  it("moves with the app's activeStep, up to all completed", async () => {
    render(
      <StrictMode>
        <Demo />
      </StrictMode>,
    );
    expect(states()).toEqual(["active", "disabled", "disabled"]);
    const next = screen.getByRole("button", { name: "Next" });
    await userEvent.click(next);
    expect(states()).toEqual(["completed", "active", "disabled"]);
    await userEvent.click(next);
    await userEvent.click(next);
    expect(states()).toEqual(["completed", "completed", "completed"]);
  });

  it("explicit step state wins; error labels; custom icons", async () => {
    render(
      <Stepper activeStep={2} aria-label="Custom">
        <Step completed={false}>
          <StepLabel>Skipped</StepLabel>
        </Step>
        <Step>
          <StepLabel error optional="Card declined">
            Payment
          </StepLabel>
        </Step>
        <Step>
          <StepLabel icon="C">Text icon</StepLabel>
        </Step>
        <Step>
          <StepLabel icon={<svg aria-hidden="true" viewBox="0 0 24 24" />}>Node icon</StepLabel>
        </Step>
      </Stepper>,
    );
    expect(states()).toEqual(["", "completed", "active", "disabled"]);
    const label = screen.getByText("Payment").closest("[data-ok-step-label]") as HTMLElement;
    expect(label.hasAttribute("data-ok-error")).toBe(true);
    const icon = label.querySelector("[data-ok-step-icon]") as HTMLElement;
    expect(css(icon).backgroundColor).toBe("rgb(255, 86, 48)");
    expect(css(icon.querySelector("[data-ok-step-icon-error]") as Element).display).toBe("block");
    expect(css(icon.querySelector("[data-ok-step-icon-check]") as Element).display).toBe("none");
    expect(css(screen.getByText("Payment")).color).not.toBe("rgb(99, 115, 129)");
    expect(steps()[2]?.querySelector("[data-ok-step-icon-text]")?.textContent).toBe("C");
    const custom = steps()[3]?.querySelector("[data-ok-step-icon]") as HTMLElement;
    expect(custom.hasAttribute("data-ok-custom")).toBe(true);
    expect(custom.querySelector("[data-ok-step-icon-text]")).toBeNull();
    expect(css(custom).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expectNoAxeViolations();
  });

  it("alternative label: labels below the icons, steps share the width", () => {
    render(
      <div style={{ width: 600 }}>
        <Basic activeStep={0} alternativeLabel />
      </div>,
    );
    const [a, b] = steps() as [HTMLElement, HTMLElement];
    expect(a.getBoundingClientRect().width).toBe(200);
    expect(b.getBoundingClientRect().width).toBe(200);
    const icon = a.querySelector("[data-ok-step-icon]") as Element;
    const title = a.querySelector("[data-ok-step-label-title]") as Element;
    expect(title.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      icon.getBoundingClientRect().bottom + 16,
    );
    // The line runs between the icons, at their middle.
    const line = (b.querySelector("[data-ok-step-connector]") as Element).getBoundingClientRect();
    // Centered on the icon: 12px down, less half of the 1px line.
    expect(line.top).toBeCloseTo(icon.getBoundingClientRect().top + 11.5, 1);
    expect(line.left).toBeGreaterThan(icon.getBoundingClientRect().right);
  });

  it("vertical: stacked steps; StepContent shows on the active step only", () => {
    render(
      <Stepper activeStep={1} orientation="vertical" aria-label="Vertical">
        {["A", "B", "C"].map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>Content {label}</StepContent>
          </Step>
        ))}
      </Stepper>,
    );
    const [a, b, c] = steps() as [HTMLElement, HTMLElement, HTMLElement];
    expect(b.getBoundingClientRect().top).toBeGreaterThanOrEqual(a.getBoundingClientRect().bottom);
    expect(css(a.querySelector("[data-ok-step-content]") as Element).display).toBe("none");
    const content = b.querySelector("[data-ok-step-content]") as HTMLElement;
    expect(css(content).display).toBe("block");
    expect(css(content).borderLeftWidth).toBe("1px");
    const line = b.querySelector("[data-ok-step-connector-line]") as Element;
    expect(css(line).borderLeftWidth).toBe("1px");
    expect(line.getBoundingClientRect().height).toBe(24);
    expect(css(c.querySelector("[data-ok-step-content]") as Element).display).toBe("none");
  });

  it("variants: dot and circle", () => {
    const { rerender } = render(<Basic activeStep={1} variant="dot" />);
    const icon = (index: number) =>
      steps()[index]?.querySelector("[data-ok-step-icon]") as HTMLElement;
    expect(getComputedStyle(icon(1), "::before").width).toBe("8px");
    expect(css(icon(1)).color).toBe("rgb(0, 167, 111)");
    expect(
      css(steps()[1]?.querySelector("[data-ok-step-connector-line]") as Element),
    ).toMatchObject({ borderTopWidth: "3px", borderTopColor: "rgb(0, 167, 111)" });
    rerender(<Basic activeStep={1} variant="circle" />);
    expect(icon(1).getBoundingClientRect().width).toBe(50);
    expect(css(icon(1)).backgroundImage).toMatch(/linear-gradient/);
    expect(css(icon(2)).backgroundImage).toBe("none");
    rerender(<Basic activeStep={1} variant={HOSTILE} />);
    expect(steps()[0]?.parentElement?.dataset["okVariant"]).toBe("standard");
  });

  it("connector: a custom node or none", () => {
    const { rerender } = render(
      <Stepper connector={<span data-testid="c" />} aria-label="C">
        <Step>
          <StepLabel>A</StepLabel>
        </Step>
        <Step>
          <StepLabel>B</StepLabel>
        </Step>
      </Stepper>,
    );
    expect(screen.getAllByTestId("c")).toHaveLength(1);
    rerender(
      <Stepper connector={null} aria-label="C">
        <Step>
          <StepLabel>A</StepLabel>
        </Step>
        text
        <Step>
          <StepLabel>B</StepLabel>
        </Step>
      </Stepper>,
    );
    expect(document.querySelector("[data-ok-step-connector]")).toBeNull();
    // Text children are kept but don't count as steps.
    expect(steps()[1]?.textContent).toContain("2");
  });

  it("parts outside a Stepper fall back to the first step", () => {
    render(
      <ol aria-label="Loose">
        <Step>
          <StepLabel>Alone</StepLabel>
        </Step>
      </ol>,
    );
    expect(states()).toEqual(["active"]);
    expect(screen.getByText("1")).toBeTruthy();
    render(<StepConnector />);
    expect(document.querySelector("[data-ok-step-connector]")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("passes refs and DOM props", () => {
    const list = createRef<HTMLOListElement>();
    const item = createRef<HTMLLIElement>();
    const label = createRef<HTMLSpanElement>();
    const content = createRef<HTMLDivElement>();
    render(
      <Stepper ref={list} className="s" aria-label="Refs">
        <Step ref={item} className="i">
          <StepLabel ref={label} className="l">
            A
          </StepLabel>
          <StepContent ref={content} className="c" />
        </Step>
      </Stepper>,
    );
    expect(list.current?.className).toBe("s");
    expect(item.current?.className).toBe("i");
    expect(label.current?.className).toBe("l");
    expect(content.current?.className).toBe("c");
  });

  it("server render matches the client markup", () => {
    const element = <Basic activeStep={1} alternativeLabel variant="dot" />;
    const html = renderToString(element);
    const { container } = render(element);
    expect(html).toBe(container.innerHTML);
  });
});

describe("MobileStepper", () => {
  const button = (label: string, disabled = false) => (
    <button type="button" disabled={disabled}>
      {label}
    </button>
  );

  it("dots (default): one dot per step, the active one in primary, a named group", async () => {
    render(
      <MobileStepper
        steps={3}
        activeStep={1}
        position="static"
        backButton={button("Back")}
        nextButton={button("Next")}
      />,
    );
    const root = document.querySelector("[data-ok-mobile-stepper]") as HTMLElement;
    expect({ ...root.dataset }).toEqual({
      okMobileStepper: "",
      okVariant: "dots",
      okPosition: "static",
      okSteps: "3",
      okActiveStep: "1",
      okRuntime: "off",
    });
    const dots = screen.getByRole("img", { name: "Step 2 of 3" });
    const items = [...dots.children] as HTMLElement[];
    expect(items).toHaveLength(3);
    expect(items.map((dot) => dot.hasAttribute("data-ok-active"))).toEqual([false, true, false]);
    expect(css(items[1] as Element).backgroundColor).toBe("rgb(0, 167, 111)");
    expect((items[0] as Element).getBoundingClientRect()).toMatchObject({ width: 8, height: 8 });
    // Back, progress, Next in a row, spread across the bar.
    expect(css(root)).toMatchObject({ display: "flex", justifyContent: "space-between" });
    expect([...root.children].map((c) => c.textContent)).toEqual(["Back", "", "Next"]);
    await expectNoAxeViolations();
  });

  it("text and progress variants; a translated label", async () => {
    const { rerender } = render(
      <MobileStepper steps={3} activeStep={1} variant="text" position="static" />,
    );
    expect(document.querySelector("[data-ok-mobile-stepper-text]")?.textContent).toBe("2 / 3");
    rerender(
      <MobileStepper
        steps={3}
        activeStep={1}
        variant="progress"
        position="static"
        getStepLabel={(step, total) => `Étape ${step} sur ${total}`}
      />,
    );
    const bar = screen.getByRole("progressbar", { name: "Étape 2 sur 3" });
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
    expect(bar.hasAttribute("data-ok-mobile-stepper-progress")).toBe(true);
    await expectNoAxeViolations();
  });

  it("position: fixed to the bottom by default, or the top", () => {
    const { rerender } = render(<MobileStepper steps={2} />);
    const root = () => document.querySelector("[data-ok-mobile-stepper]") as HTMLElement;
    expect(css(root())).toMatchObject({ position: "fixed", bottom: "0px", zIndex: "1000" });
    rerender(<MobileStepper steps={2} position="top" />);
    expect(css(root())).toMatchObject({ position: "fixed", top: "0px" });
  });

  it("clamps invalid steps and active steps", () => {
    render(<MobileStepper steps={Number.NaN} activeStep={7} variant="text" position="static" />);
    expect(document.querySelector("[data-ok-mobile-stepper-text]")?.textContent).toBe("1 / 1");
  });

  it("server render matches the client markup", () => {
    const element = <MobileStepper steps={3} activeStep={2} position="static" />;
    const html = renderToString(element);
    const { container } = render(element);
    expect(html).toBe(container.innerHTML);
  });
});
